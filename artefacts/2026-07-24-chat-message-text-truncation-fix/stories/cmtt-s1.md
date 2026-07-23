# Story: Fix sanitiseAnswer() silently eating hyphenated user-message text before a colon

**Epic reference:** None — short-track (bounded rendering/data-corruption bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live-verified defect found by `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2 & AC3 test failing against real `wuce-staging`, run this session after PR #568 (catc-s1), PR #569 (icrh-s1), and PR #570 (icv-s1) all merged.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below, tied honestly to the parent feature's own benefit metric rather than fabricating a new metric artefact.

## User Story

As **any operator typing a chat message in `/ideate` (or any skill session) that happens to contain a hyphenated identifier, codename, or reference followed later by a colon** (the exact shape `a4-ideate-session-resume.spec.js`'s AC2/AC3 test drives: `"call it Project-Codename-Falcon-detail-1784829153994-51525: an internal tool..."`),
I want **my own typed message to be stored and later displayed exactly as I typed it, not silently mangled**,
So that **my own conversation history — which the platform explicitly promises to restore on session resume — is not corrupted the moment I type a plausible, ordinary sentence, in production, for real users, not just in a test.**

## Benefit Linkage

**Metric moved:** `2026-07-23-e2e-core-journey-coverage`'s own benefit metric (m1 — real, staging-verified E2E coverage of the core product journey, replacing untested/unverified confidence with live-verified confidence). Not a new metric artefact (short-track) — this fix closes a genuine, previously-undetected production defect that `a4-ideate-session-resume`'s own AC2/AC3 test surfaced once its upstream credits/mock-gateway blockers were cleared (PR #568) and two other real defects in the same flow were fixed (PR #569, PR #570).

**How:** Real, live-verified E2E failure against real `wuce-staging`: `expect(resumedThreadText).toContain(distinctiveDetail)` failed with `Received string: "...call it Project: an internal tool..."` where the sent text was `"...call it Project-Codename-Falcon-detail-1784829153994-51525: an internal tool..."`. Direct isolation (see `decisions.md`) traced this to `sanitiseAnswer()`'s `CLI_FLAG` regex (`src/answer-sanitiser.js`) deleting the entire hyphenated span between "Project" and the colon at write time, before the turn is ever pushed to `session.turns`. This is not a test-only artefact — it is a real, permanent, silent corruption of any user's own stored chat history whenever their message matches this shape.

## Architecture Constraints

- **This is a minimal, targeted regex fix to a single shared utility function.** Only `CLI_FLAG` in `src/answer-sanitiser.js` changes — a negative lookbehind (`(?<![\w-])`) is added so a CLI-flag-like token is only recognised at a genuine token boundary (start of string, or preceded by a non-word/non-hyphen character), not in the middle of an ordinary hyphenated compound word.
- **Do not weaken the existing injection defence.** `T4.3`/`T4.5`/`NFR3` in `tests/skill-launcher.test.js` (already-passing, unmodified tests asserting `--allow-all`, `rm -rf`, and the full shell-metacharacter set are stripped) must continue to pass unmodified — this fix must not narrow or remove that coverage.
- **Do not modify `lightMd`** (`src/web-ui/routes/skills.js`, client-side inline script) **or `lightMarkdown`** (`src/web-ui/views/chat-view.js`, server-side resume render) — both were directly isolated during investigation and confirmed NOT to reproduce the bug; the defect is entirely in `sanitiseAnswer()`, upstream of both render paths.
- **Do not modify `mergeRedisSessionData()`** or any session-restore/merge mechanism — the data-layer restore of already-stored turns is not implicated; the corruption happens before storage, not during restore.

## Dependencies

- **Upstream:** PR #568 (catc-s1, credits gate fix), PR #569 (icrh-s1, canvas hydration fix), PR #570 (icv-s1, continue-chain fix) — all merged this session, which is what allowed `a4-ideate-session-resume.spec.js`'s AC2/AC3 test to run far enough to surface this defect (rather than skipping at an earlier blocker).
- **Downstream:** `a4-ideate-session-resume`'s own AC2/AC3 test (`tests/e2e/a4-ideate-session-resume.spec.js`) is the direct consumer of this fix — expected to newly pass against real staging once this fix is deployed. Any other skill session's chat/answer submission path (`src/web-ui/routes/skills.js` lines 381, 1983, 3927, 4477, all calling the shared `sanitiseAnswer()`) also benefits — this was a cross-cutting defect, not ideate-specific.

## Acceptance Criteria

**AC1:** Given a user-typed answer containing a hyphenated compound word/identifier immediately followed by a colon (e.g. `"call it Project-Codename-Falcon-detail-1784829153994-51525: an internal tool..."` — the exact shape that broke `a4-ideate-session-resume.spec.js`), When `sanitiseAnswer()` processes it, Then the full hyphenated identifier is preserved unmodified in the output.

**AC2:** Given a user-typed answer containing a real CLI-flag-like token at a genuine word boundary (`"--allow-all"` at the start of a string, or `"-rf"` preceded by whitespace, as in the existing `T4.3`/`T4.5` tests), When `sanitiseAnswer()` processes it, Then the flag token is still stripped exactly as before — no regression on the existing shell-injection defence.

**AC3:** Given the full existing shell-metacharacter set (`; & | \` $ ! > < \`, per `NFR3`), When `sanitiseAnswer()` processes an answer containing all of them, Then every metacharacter is still stripped — no regression.

**AC4:** Given the real `htmlSubmitTurn()` write path (`src/web-ui/routes/skills.js`) seeded with the exact `a4-ideate-session-resume.spec.js` distinctive-detail input string, When the turn is submitted, Then the resulting `session.turns` user-turn entry contains the distinctive-detail string uncorrupted (proving the fix holds through the real write path, not just the sanitiser function in isolation).

**AC5:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

**AC6:** Given this fix is deployed to real `wuce-staging` (subject to no concurrent deploy in progress from another agent), When `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2 & AC3 test is re-run against real staging, Then it passes — reported honestly as observed, including if deploy could not be completed this session.

## Out of Scope

- Any change to `lightMd` (`src/web-ui/routes/skills.js`) or `lightMarkdown` (`src/web-ui/views/chat-view.js`) — both confirmed, by direct isolation, not to reproduce the bug.
- Any change to `mergeRedisSessionData()` or the Redis session-restore mechanism — not implicated; the corruption happens at write time, before storage.
- Broader redesign of `sanitiseAnswer()`'s CLI-flag-stripping strategy (e.g. an allowlist of known-dangerous flags instead of a general pattern) — out of scope; this fix is the minimal boundary correction that closes the reported defect without touching the function's overall design.
- Retroactively repairing already-corrupted turn content in any already-stored/deployed session data — out of scope; this fix prevents future corruption, it does not attempt to detect or repair historical data.

## NFRs

- **Performance:** Negligible — a single additional negative-lookbehind assertion added to an existing regex, evaluated per answer submission (already low-frequency, human-typed-message-rate).
- **Security:** This IS the security-relevant surface (shell-injection/CLI-flag defence) — the fix is scoped and verified specifically to avoid narrowing that defence (AC2/AC3 lock in the exact existing coverage).
- **Accessibility:** Not applicable — no UI/DOM change.
- **Audit:** Not applicable — no change to any audited/logged code path (per `T4.6`, answer content is never logged; unaffected by this fix).

## Complexity Rating

**Rating:** 1 — well understood; root cause independently confirmed by direct isolation of the exact regex and exact input string, fix is a single, minimal regex boundary correction, and verification approach (unit test against the real sanitiser + real write path + full regression + real staging redeploy) is already identified.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic

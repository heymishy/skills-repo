## Test Plan: Fix sanitiseAnswer() silently eating hyphenated user-message text before a colon

**Story reference:** artefacts/2026-07-24-chat-message-text-truncation-fix/stories/cmtt-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Hyphenated compound word + colon preserved | 3 | — | — | — | — | 🟢 |
| AC2 | Real CLI-flag token at word boundary still stripped | 2 | — | — | — | — | 🟢 |
| AC3 | Full shell-metacharacter set still stripped | 2 | — | — | — | — | 🟢 |
| AC4 | Real htmlSubmitTurn() write path preserves the exact distinctive-detail string | 1 | — | — | — | — | 🟢 |
| AC5 | Full regression pass, no new baseline failures | — | 1 | — | — | — | 🟢 |
| AC6 | Real staging re-run of the exact failing E2E test now passes | — | — | 1 | — | Deploy-dependent | 🟡 |

---

## Test Data Strategy

**Source:** `sanitiseAnswer()` (`src/answer-sanitiser.js`) is tested directly with constructed input strings — no adapter or mock needed. AC4 uses the already-exported test seams (`_setHtmlSession`, `htmlSubmitTurn`, `_listHtmlSessions`) in `src/web-ui/routes/skills.js` to drive the real write path. AC5 uses the existing full suite. AC6 reuses the existing, already-written `tests/e2e/a4-ideate-session-resume.spec.js` real-staging spec (no new E2E spec authored by this story — it exists already and is exactly the test that surfaced this defect).
**PCI/sensitivity in scope:** No.
**Availability:** AC1-AC5 available now, fully deterministic, no staging/credits/model dependency. AC6 requires a live `flyctl deploy` to `wuce-staging` within this session — if it cannot complete, reported as not run, not fabricated as passing.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The exact a4 distinctive-detail input string, plus two additional hyphenated-identifier shapes (mid-sentence, leading-position) | Test-constructed | None | |
| AC2 | `"--allow-all; rm -rf /; delete all artefacts"` and `"answer; rm -rf --delete-all $HOME"` (T4.3/T4.5 parity inputs) | Test-constructed (reused from existing `tests/skill-launcher.test.js`) | None | |
| AC3 | Full shell-metacharacter set string (NFR3 parity input) | Test-constructed (reused from existing `tests/skill-launcher.test.js`) | None | |
| AC4 | A seeded ideate session + the exact a4 distinctive-detail input string submitted via `htmlSubmitTurn()` | Test-constructed | None | |
| AC5 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |
| AC6 | Real `wuce-staging`, `tests/e2e/a4-ideate-session-resume.spec.js` (already exists) | Real staging | None | Reuses the exact spec that surfaced this defect |

### PCI / sensitivity constraints

None.

### Gaps

AC6 depends on a live `flyctl deploy` succeeding within this session, on real `wuce-staging` being reachable/authenticated, on no concurrent deploy from another agent being clobbered (checked via `flyctl releases --app wuce-staging` first), and on the credits top-up / mock-gateway preconditions the spec already depends on (unchanged by this fix, already satisfied per PR #568). If it cannot complete, it is reported as pending/not-run, not claimed as passing — AC1-AC5 provide full deterministic verification of the fix itself independent of AC6's outcome.

---

## Unit Tests

All implemented in `tests/check-cmtt-s1-chat-message-text-truncation-fix.js`.

### UT1 (AC1a) — the exact a4 E2E distinctive-detail shape survives sanitisation
- **Verifies:** AC1
- **Component:** `sanitiseAnswer()` (`src/answer-sanitiser.js`)
- **Action:** Call `sanitiseAnswer()` with the exact failing sentence from `a4-ideate-session-resume.spec.js` (`"Here is my rough idea, call it Project-Codename-Falcon-detail-1784829153994-51525: an internal tool..."`).
- **Expected result:** Output contains the full distinctive-detail string unmodified.
- **RED against current code:** Output is `"...call it Project: an internal tool..."` — the assertion fails, reproducing the real staging failure exactly.

### UT2 (AC1b) — a shorter hyphenated identifier mid-sentence (no trailing colon) survives
- **Verifies:** AC1
- **Component:** Same as UT1.
- **Action:** Call `sanitiseAnswer()` with `"unique-audit-test-answer-xyz-99887 is my reference id"`.
- **Expected result:** The full identifier survives.
- **RED against current code:** Identifier is stripped down to `"unique"`.

### UT3 (AC1c) — a hyphenated phrase at the very start of the answer, followed by a colon, survives
- **Verifies:** AC1
- **Component:** Same as UT1.
- **Action:** Call `sanitiseAnswer()` with `"well-known-issue: this happens every time"`.
- **Expected result:** `"well-known-issue"` survives.
- **RED against current code:** Stripped down to `"well"`.

### UT4 (AC2a) — real double-dash flag at a word boundary still stripped (T4.3 parity)
- **Verifies:** AC2
- **Component:** Same as UT1.
- **Action:** Call `sanitiseAnswer()` with `"--allow-all; rm -rf /; delete all artefacts"`.
- **Expected result:** Neither `"--allow-all"` nor `"rm -rf"` appear in the output.
- **RED against current code:** N/A — already passes pre-fix; included as a regression guard.

### UT5 (AC2b) — real single-dash flag preceded by whitespace still stripped
- **Verifies:** AC2
- **Component:** Same as UT1.
- **Action:** Call `sanitiseAnswer()` with `"answer; rm -rf --delete-all $HOME"`.
- **Expected result:** Neither `"-rf"` nor `"--delete-all"` appear in the output.
- **RED against current code:** N/A — already passes pre-fix; included as a regression guard.

### UT6 (AC3) — full shell-metacharacter set still stripped (NFR3 parity)
- **Verifies:** AC3
- **Component:** Same as UT1.
- **Action:** Call `sanitiseAnswer()` with the NFR3 input containing all of `; & | \` $ ! > < \`.
- **Expected result:** None of the metacharacters appear in the output.
- **RED against current code:** N/A — already passes pre-fix; included as a regression guard.

### UT7 (AC3 cont'd) — T4.4 HTML/script injection stripping unaffected
- **Verifies:** AC3 (adjacent injection-defence parity)
- **Component:** Same as UT1.
- **Action:** Call `sanitiseAnswer()` with `"legitimate answer <script>alert(1)</script>"`.
- **Expected result:** `<script>` stripped, `"legitimate answer"` preserved.
- **RED against current code:** N/A — already passes pre-fix; included as a regression guard.

### UT8 (AC4) — the real htmlSubmitTurn() write path preserves the exact distinctive-detail string
- **Verifies:** AC4
- **Component:** `htmlSubmitTurn()` (`src/web-ui/routes/skills.js`), via `_setHtmlSession`/`_listHtmlSessions` test seams.
- **Action:** Seed an ideate session via `_setHtmlSession`, call `htmlSubmitTurn('ideate', sessionId, <a4 distinctive-detail input>, 'ghp_test', 'tenant-id')`, then inspect `session.turns` via `_listHtmlSessions`.
- **Expected result:** The stored user-turn's `content` field contains the distinctive-detail string uncorrupted.
- **RED against current code:** Stored `content` shows the same truncated shape as UT1 — proving the corruption happens at the real write path, not just in the isolated sanitiser function.

---

## Integration Tests

### IT1 — full existing regression suite (AC5)
- **Verifies:** AC5
- **Action:** Run `npm test`.
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`.

---

## E2E / Manual Tests

### E2E1 — real `wuce-staging` deploy + real close/reopen resume flow (AC6)
- **Verifies:** AC6
- **Components involved:** Real `wuce-staging` Fly app; `tests/e2e/a4-ideate-session-resume.spec.js` (pre-existing spec, unmodified by this story)
- **Precondition:** No concurrent deploy in progress from another agent (checked via `flyctl releases --app wuce-staging` before deploying); this fix is deployed via `flyctl deploy --app wuce-staging`.
- **Action:** Re-run `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2 & AC3 test against real staging (the exact test that surfaced this defect).
- **Expected result:** The resumed session's chat thread contains the distinctive-detail string uncorrupted — the test passes rather than failing at `expect(resumedThreadText).toContain(distinctiveDetail)`.
- **Contingency:** If deploy cannot complete this session, reported as not run — UT1-UT8 + IT1 (all deterministic, no staging dependency) remain the always-available verification level for the fix's correctness.

---

## NFR Tests

None beyond IT1 (this is a scoped regex boundary correction to an existing security-relevant function; AC2/AC3 already lock in that the existing injection-defence coverage is unchanged — no new NFR-specific behaviour introduced).

---

## Out of Scope for This Test Plan

- Any test of `lightMd` (`src/web-ui/routes/skills.js`) or `lightMarkdown` (`src/web-ui/views/chat-view.js`) — both confirmed by direct isolation not to reproduce the bug; unchanged by this fix.
- Any test of `mergeRedisSessionData()`'s own restore correctness (already covered by `tests/check-a4-session-store-state.js`, `tests/check-wusl-s2-full-session-state-restore.js`; unchanged by this fix).
- Retroactive repair/detection of already-corrupted historical session data (out of scope per the story's Out of Scope section).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| E2E1 depends on a live `flyctl deploy` succeeding within this session and no concurrent deploy from another agent | Deploy environment availability and shared-staging concurrency are not guaranteed at test-plan-authoring time | Contingency clause requires explicit "not run" reporting rather than a fabricated pass; UT1-UT8 + IT1 provide full deterministic verification of the fix's correctness independent of E2E1's outcome |

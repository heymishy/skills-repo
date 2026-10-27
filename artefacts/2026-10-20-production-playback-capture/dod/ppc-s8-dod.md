# Definition of Done: ppc-s8 — Production bug fix: `playwright` missing from the deployed image

**PR:** https://github.com/heymishy/skills-repo/pull/1025 (original) + https://github.com/heymishy/skills-repo/pull/1026 (fast-follow: disable Chromium sandbox) + https://github.com/heymishy/skills-repo/pull/1027 (fast-follow #2: disable `/dev/shm` usage) | **Merged:** 2026-10-26 (all three)
**Story:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s8-playwright-production-dependency.md`
**Test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s8-test-plan.md`
**DoR artefact:** `artefacts/2026-10-20-production-playback-capture/dor/ppc-s8-dor.md`
**Assessed by:** Claude (session)
**Date:** 2026-10-27

**Why this DoD is run a day late, and why its content differs from a normal post-merge check:** `ppc-s8`'s own 3 PRs merged and its `dodStatus`/`prStatus` were never reconciled afterward — found stale (`prStatus: "draft"`) during `ppc-s10`'s own DoD run. In the interim, `ppc-s9` shipped and **entirely retired** the in-process Chromium mechanism `ppc-s8` was fixing (`decisions.md`'s 2026-10-26 "Superseding decision" entry; `ppc-s9`'s own Task 7 explicit dead-code removal). This DoD assesses `ppc-s8`'s ACs against what was actually true **at the time each PR merged** (the real evidence available from that session, recorded in `decisions.md`), not against the current codebase, which no longer contains the code these ACs describe.

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `require('playwright')` resolves inside the built production image | ✅ | The original failure (`Error: Cannot find module 'playwright'`) never recurred in any of the two subsequent fast-follow production attempts — both later failures were a different symptom (an indefinite hang, not a module-resolution error), confirming the `dependencies`/Dockerfile fix from PR #1025 held | `live-verified` (confirmed by the absence of the original error signature across 2 further live production attempts, not just a local Docker build check) | None |
| AC2 — `chromium.launch()` + a real page round trip succeeds inside the built production image | ⚠️ | Partial: the launch call was reached past the module-resolution fix, but the exact point of the eventual hang (sandbox setup vs. the subsequent navigate/capture step) was never cleanly isolated before the mechanism was abandoned in favour of `ppc-s9`'s architecture — `decisions.md`'s own fast-follow entries describe "a matched CSRF guard check logged, then total silence," consistent with the hang occurring inside or shortly after `chromium.launch()`, not before it, but this was never confirmed via an isolated `page.title()` round trip against a reachable URL as the test plan's own AC2 verification step specified | `live-verified`, but incomplete — never isolated the specific launch-vs-navigate boundary | The specific manual verification step the test plan called for (an isolated `docker run` + `page.goto()`/`page.title()` check) does not appear to have been performed in isolation — only the full, real capture flow was ever tried, which conflates AC2 with AC3 |
| AC3 — A real capture against the deployed production app succeeds end-to-end | ❌ | Confirmed NOT satisfied. Three consecutive live production attempts across all 3 PRs: (1) PR #1025 fixed the module-resolution 500 but then hung indefinitely; (2) PR #1026 (`chromiumSandbox: false`) still hung identically; (3) PR #1027 (`--disable-dev-shm-usage`) **also failed to resolve the hang** — `decisions.md`'s own 2026-10-26 "Superseding decision" entry states this explicitly as the trigger for the architecture review that produced `ppc-s9`. This AC was never achieved by this story's own approach. | `live-verified` (the failure, not the success, is what's confirmed) | **Not resolved by this story.** Resolved by `ppc-s9`'s superseding architecture change (moving capture execution to a GitHub Actions worker) instead — see Outcome below. |
| AC4 — Existing Playwright E2E suite unaffected | ✅ | Each of the 3 PRs' own decisions.md entries confirms "full suite verified passing" / "full suite passes unmodified" before merge | `integration-real-code` | None |
| AC5 — Unit/integration chain still never invokes real Playwright (ADR-018) | ✅ | Same full-suite-passing confirmation as AC4; unchanged since this story touched only production-only, env-gated code paths | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None within this story's own 3 PRs (each fast-follow was a narrowly-scoped, well-precedented launch-flag addition, not scope creep). The larger deviation — AC3 ultimately being resolved by a *different* story's architecture change rather than this one — is recorded as the Outcome below, not as an out-of-scope violation (no out-of-scope item from this story's own story file was implemented).

---

## Test Plan Coverage

**Tests from plan implemented:** 2/2 automated (AC4, AC5 regression coverage) + 3/3 manual verification steps attempted (AC1, AC2, AC3)
**Tests passing in CI:** 2/2 automated tests passing (confirmed across all 3 PRs)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 manual Docker-build check | Attempted | ⚠️ Inferred, not isolated | See AC1 evidence above |
| AC2 manual launch+round-trip check | Attempted | ❌ Not isolated/confirmed | See AC2 evidence above |
| AC3 manual real-production-capture check | Attempted (3x) | ❌ Failed all 3 times | See AC3 evidence above |
| AC4 full E2E suite re-run | ✅ | ✅ | Re-run unmodified across all 3 PRs |
| AC5 ADR-018 regression test | ✅ | ✅ | Re-run unmodified across all 3 PRs |

**Gaps:** AC1/AC2's own manual verification steps, as specified in the test plan, were never performed in the precise, isolated form the test plan called for — the team instead relied on the full end-to-end production attempt (which conflates AC1/AC2/AC3 into one signal) each time. Not flagged as a process failure given the urgency of a live production incident response, but recorded here for completeness.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (image size/build time) | ⚠️ | Not quantified in any of the 3 PRs' own decisions.md entries — the story's own NFR section said this would be "measured as part of implementation," but no measurement was recorded |
| Security (no new exposure surface) | ✅ | Confirmed — no change to what the mechanism can see or do, only to how/where it launches |
| Reliability | ❌ | This was the NFR the story existed to fix, and it was not actually fixed by this story — see AC3 |
| Design system | N/A | No UI/rendering change |

---

## Metric Signal

No entry in this feature's `metrics` array lists `ppc-s8` in its `contributingStories`. Given AC3 (the actual functional fix) was never achieved by this story, this is appropriate — there was never a working mechanism for `ppc-s8` to have moved a metric with.

---

## Outcome

**INCOMPLETE — superseded, not fixed, by this story's own approach**

This is an honest, non-penalizing INCOMPLETE: the story correctly diagnosed root causes, shipped 3 real, well-reasoned, individually-correct fixes (module dependency, sandbox flag, shared-memory flag), and each was verified against live production rather than assumed — exactly the discipline this pipeline asks for. But the underlying approach (in-process Chromium launch inside the 512MB production web server) turned out to be unfixable within its own architecture (a genuine memory-budget problem, not a flag the team hadn't tried yet — see `decisions.md`'s own cost/memory research). The team correctly recognised this after the third failed attempt and pivoted to `ppc-s9`'s GitHub Actions worker architecture, which **does** satisfy the equivalent of `ppc-s8`'s AC3 (confirmed live in `ppc-s9`'s own DoD and again during `ppc-s10`'s live validation this session).

**Follow-up actions:**
1. None required for AC3 itself — already resolved by `ppc-s9`. No further action needed on the underlying functional gap.
2. Mark this story `dodStatus: "superseded"` if this repo's schema supports that value (check `pipeline-state.schema.json`); if not, `"complete"` with this DoD artefact as the permanent record of the true outcome is the closest available accurate state. Do not mark `releaseReady: true` on the strength of this story alone — `ppc-s9`'s own DoD already carries that signal for the real, working mechanism.
3. `/improve` candidate: this is a clean example of a story whose own fast-follow pattern (3 PRs, escalating fixes, eventual architecture pivot) is exactly the kind of signal `/improve` should look for when calibrating complexity estimates for "launch a browser in a constrained container" classes of work in this repo going forward.

---

## DoD Observations

1. **Stale `prStatus`/`dodStatus` bookkeeping on a 3-PR story is a real, repeatable gap.** None of `ppc-s8`'s 3 merge events triggered a `/definition-of-done` run or even a `prStatus` update — likely because the team's attention was correctly on the live incident (3 consecutive production failures) rather than pipeline bookkeeping, and no single "the PR is merged" moment felt like the natural trigger when a 4th fix (the architecture pivot) was already known to be coming. `/improve` candidate: consider whether a fast-follow sequence like this should defer its own DoD until the sequence's own terminal outcome is known (success or supersession), rather than running — and then needing to re-run or amend — a DoD after each individual PR.
2. This DoD was written entirely from `decisions.md`'s own prior entries (all authored live, in the same incident-response session that produced the 3 PRs) rather than from re-inspecting now-deleted code — a direct, positive example of why this repo's own `decisions.md` mandate (CLAUDE.md: "Without it, rationale lives only in git log messages and is invisible to future operators") earns its keep: this DoD would have been materially harder, and less confident, without that record.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ppc-s8 (production bug fix: playwright
missing from the deployed image), feature 2026-10-20-production-playback-capture.
Check:
1. Is the INCOMPLETE/superseded framing for AC3 fair, given the story's own 3 PRs
   each individually did real, correct, live-verified work -- or should this be
   framed differently (e.g. COMPLETE WITH DEVIATIONS, since the underlying problem
   WAS eventually solved, just not by this story)?
2. Does pipeline-state.schema.json support a "superseded" dodStatus value, and if
   not, should it?
3. Is Observation #1's /improve suggestion (defer DoD on a fast-follow sequence
   until its terminal outcome is known) a good general rule, or specific to this
   one incident?
```

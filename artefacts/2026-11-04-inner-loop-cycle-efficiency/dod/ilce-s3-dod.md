# Definition of Done: /subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix

**PR:** https://github.com/heymishy/skills-repo/pull/1054 | **Merged:** 2026-11-05
**Story:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s3-parallel-review-dispatch.md
**Test plan:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s3-test-plan.md
**DoR artefact:** artefacts/2026-11-04-inner-loop-cycle-efficiency/dor/ilce-s3-dor.md
**Assessed by:** Claude (Sonnet 5)
**Date:** 2026-11-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `subagent-execution SKILL.md Step 2 dispatches spec-compliance and code-quality review concurrently` (unit); **live-verified** — this exact mechanism was used for real, repeatedly, across `ilce-s4`'s 5 tasks and `bcfx-s1`'s 1 task (both built in this same session after `ilce-s3` shipped): both reviewers were genuinely dispatched in the same turn every round | unit → live-verified | None |
| AC2 | ✅ | `decideReviewOutcome returns accept-both when both reviewers pass clean`; live-verified via several clean task rounds in `ilce-s4`/`bcfx-s1` where both reviewers approved without any redispatch | unit → live-verified | None |
| AC3 | ✅ | `decideReviewOutcome returns redispatch-quality...` / `redispatch-spec...` (both directions, unit); live-verified — both directions were genuinely exercised in `ilce-s4` (Tasks 1-4 all hit `redispatch-quality` at least once) and `bcfx-s1` (3 full fix-and-redispatch rounds, including a Critical finding) | unit → live-verified | None |
| AC4 | ✅ | `buildFinalRecord retains only the post-fix result...` (both directions, unit); live-verified — every redispatch round across `ilce-s4`/`bcfx-s1` correctly surfaced only the post-fix reviewer verdict | unit → live-verified | None |
| AC5 | ✅ | `runReconciliationCheck`... — wait, N/A, see note below; `subagent-execution timing records include dispatchCount` (unit, confirms the mechanism writes the right data) | unit | Full baseline-comparison (22.0-min target) is explicitly out of scope for this test plan per its own "Coverage gaps" note — tracked by Metric 1, not a test gap |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

One documented, operator-approved scope addition beyond the story's own DoR contract: `.github/workflows/*.yml` runner-pin changes (4 files, 7 jobs, `ubuntu-latest` → `ubuntu-24.04`) were bundled into this PR to unblock its own CI, per the operator's explicit request ("Fix please before I merge PR") after GitHub's `ubuntu-latest` rolled forward mid-session to a version Playwright 1.59.1 doesn't support. Logged in `decisions.md` (SCOPE entry, 2026-11-06) with full rationale at the time. Confirmed unrelated to this story's own ACs and does not affect the AC coverage above.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (one test per the plan's own 5-AC coverage table)
**Tests passing in CI:** 10 / 10 (fresh run, `node tests/check-ilce-s3-review-outcome.js`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| decideReviewOutcome returns accept-both when both reviewers pass clean | ✅ | ✅ | |
| decideReviewOutcome returns redispatch-quality when spec requires a fix and quality already passed | ✅ | ✅ | |
| decideReviewOutcome returns redispatch-spec when quality requires a fix and spec already passed | ✅ | ✅ | The symmetric direction |
| decideReviewOutcome returns redispatch-quality when both reviewers require a fix (spec fix takes priority) | ✅ | ✅ | |
| buildFinalRecord retains only the post-fix result when a redispatch occurred | ✅ | ✅ | |
| buildFinalRecord retains only the post-fix spec result when the symmetric redispatch-spec occurred | ✅ | ✅ | Added during Task 2's own code-quality review — the symmetric direction was initially untested |
| buildFinalRecord carries both original results through when no redispatch occurred | ✅ | ✅ | |
| subagent-execution SKILL.md Step 2 dispatches spec-compliance and code-quality review concurrently | ✅ | ✅ | |
| subagent-execution SKILL.md references symmetric discard-and-redispatch and buildFinalRecord | ✅ | ✅ | |
| subagent-execution timing records include dispatchCount, enabling active-minutes-per-task measurement | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| N/A | — | No NFRs specific to this story beyond the feature-level profile, already assessed |

---

## Metric Signal

**[Metric 1] (Metric 1 — Review-dispatch active time per task, `pipeline-state.json`'s `m1`)**
Measurement-ready: **not yet**
Signal: not-yet-measured
Evidence note: The mechanism is confirmed working correctly via real usage across `ilce-s4` (5 tasks) and `bcfx-s1` (1 task) — 6 real dispatched tasks so far, with `dispatchCount` timing data recorded for each. This is short of a statistically meaningful sample against the 22.0-minute/task baseline; a real signal needs more tasks to accumulate across future stories.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None.

---

## DoD Observations

1. This is the first feature in this repo where a story's own shipped mechanism (parallel review dispatch) was then used, within the same session, to build later stories (`ilce-s4`, `bcfx-s1`) — giving this DoD genuine `live-verified` evidence for all 4 of its process-behavior ACs (AC1-AC4), not just unit-test evidence. Both symmetric redispatch directions, the both-fail edge case, and a 3-round fix-and-redispatch cycle (in `bcfx-s1`) were all exercised for real, not just in a mocked test.
2. A real Critical finding was caught and fixed during this story's own implementation (Task 3's code-quality review): the first draft of the redispatch loop never specified updating the triggering reviewer's result to `{status: 'pass'}` after its fix was confirmed done, risking an infinite loop and a final record permanently showing a stale `fix-required` status. See `decisions.md`'s SCOPE entry (2026-11-05) for the full writeup.
3. A cross-story test-collision was found and resolved cleanly: this story's SKILL.md rewrite broke an earlier story's (`s3fw-s1`) non-regression lock-in test, which hard-asserted exact literal text from the sections being replaced. Resolved by updating that test to assert the same safety property against the new structure — the correct response to this class of collision, per the pattern now documented in `decisions.md`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "/subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

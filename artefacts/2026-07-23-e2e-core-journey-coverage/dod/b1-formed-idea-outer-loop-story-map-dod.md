# Definition of Done: Drive the formed-idea outer loop to DoR and assert the /definition story-map canvas, close/resume mid-SSE

**PR:** https://github.com/heymishy/skills-repo/pull/553 | **Merged:** 2026-07-23
**Story:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b1-formed-idea-outer-loop-story-map.md
**Test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b1-formed-idea-outer-loop-story-map-test-plan.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| All ACs (formed-idea outer loop to DoR, story-map canvas assertion, close/resume mid-SSE, AC4 session-restore) | ✅ | `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` — 6/6 test plan tests; this exact spec is the entirety of the `"Scenario B E2E (staging)"` CI job | Continuous CI evidence, confirmed via `.github/workflows/e2e.yml` line 403, and directly observed passing on `si-s1`'s PR #749 and `si-s2`'s PR #748 today | None |

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing in CI:** 6/6 per test plan, run on every PR since merge (though see the important caveat in Outcome below — the job runs, but is not currently a *required* check).
**Gaps:** None in the test itself.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

No formal benefit-metric artefact exists for this feature. No metric signal to record.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None for this story's own scope — see `b2`'s own DoD for the related (but distinct) finding that this job's status check is not currently required by the branch ruleset. `b1`'s own job runs and passes correctly; the gap is in `b2`'s gate-wiring, not in this story.

---

## DoD Observations

1. ~4 weeks live, job passing continuously. Same evidence basis as `a1`/`a3`/`a4`.

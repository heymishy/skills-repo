# Definition of Done: Reassign an epic to a different module

**PR:** https://github.com/heymishy/skills-repo/pull/526 | **Merged:** 2026-07-21
**Story:** artefacts/2026-07-21-web-ui-experience-redesign/stories/a2-reassign-epics-between-modules.md
**Test plan:** artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a2-test-plan.md
**DoR artefact:** artefacts/2026-07-21-web-ui-experience-redesign/dor/a2-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1–AC4 (PUT reassign endpoint, server wiring, validation, UI trigger) | ✅ | `check-a2-reassign-epics-between-modules.js`, 11 assertions | Automated test, re-run fresh on current master 2026-08-17 | None |

11/11 assertions pass fresh, including `server.js registers handlePutEpicModule and the PUT epics/:epicId/module route` — confirms production wiring, not just handler logic in isolation.

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing in CI:** 11/11, re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

No red flags found in this pass; covered by feature-level `nfr-profile.md`.

---

## Metric Signal

**Time to identify the least-healthy area of a large product (Metric 1)**
Signal: not-yet-measured
Evidence note: Same as `a1` — no dedicated telemetry traced for this specific story in this retroactive pass.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. ~4 weeks live in production, no incidents reported. Part of the same 14-story batch pass as `a1` (see `a1-dod.md` for the batch-scope note).

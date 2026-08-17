# Definition of Done: Remove dead nav links and add the missing Org board and Home List/Board toggle

**PR:** https://github.com/heymishy/skills-repo/pull/523 | **Merged:** 2026-07-21
**Story:** artefacts/2026-07-21-web-ui-experience-redesign/stories/b1-remove-dead-links-add-missing-nav.md
**Test plan:** artefacts/2026-07-21-web-ui-experience-redesign/test-plans/b1-test-plan.md
**DoR artefact:** artefacts/2026-07-21-web-ui-experience-redesign/dor/b1-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1–AC4 (dead links removed, Org board + List/Board toggle added) | ✅ | `check-b1-nav-fix.js`, 8 assertions | Automated test, re-run fresh on current master 2026-08-17 | None |

8/8 assertions pass fresh. Live-verified 2026-08-17: "Org board" nav item and List/Board toggle both visible and present in the sidebar during unrelated live-checks this session.

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing in CI:** 8/8, re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

**Navigation dead-link rate (Metric 2)**
Signal: not-yet-measured
Evidence note: No dedicated telemetry traced in this retroactive pass; a companion story in a later feature (`bssm-s1`) added a dangling-link regression test suite that indirectly guards this metric going forward.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. ~4 weeks live in production, no incidents reported. Also incidentally confirmed live during this session's separate `si-s1`/`si-s2` DoD work (the sidebar nav elements from this story were visible in those screenshots too).

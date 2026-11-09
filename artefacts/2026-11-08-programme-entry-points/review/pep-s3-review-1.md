# Review Report: Bottom-up programme-candidate detection script (epic-count primary signal) — Run 1

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s3-bottom-up-detection-script.md
**Date:** 2026-11-09
**Categories run:** A, B, C, D, E, F, G, H
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** AC quality (Category C) — Same root-cause defect as `pep-s2-review-1.md` (1-H1): AC2 and AC3 say "the epic-count threshold is applied" without stating what that threshold is. As written, neither the true-positive check (AC2, phase4) nor the true-negative check (AC3, `team-identity-roles`) can be run, because there is no number to apply. This story is the one that's supposed to *produce* the validated threshold (per its own Benefit Linkage: "this story's own acceptance check... is literally what this meta-metric measures") — leaving the value undefined here is more significant than in pep-s2, since pep-s2 explicitly says it reuses "pep-s3's own validated primary signal," meaning pep-s3 is the authoritative source for the number pep-s2 depends on. Two stories both referencing an unpinned "the threshold" compounds into neither one actually being independently testable.
  Fix: Pin a concrete epic-count threshold in AC1 (not just AC2/AC3) — e.g. "≥4 epics" — chosen so phase4 (5 epics) is a true positive and `team-identity-roles` (1 epic) is a true negative, per this story's own two seeded cases. Coordinate with pep-s2's fix (1-H1 there) so both stories state the identical number, since pep-s2 explicitly inherits it from this story.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 5 | PASS |
| Architecture compliance (E) | 5 | PASS |
| Journey.js fixture hygiene (F) | N/A | — |
| skills.js fixture hygiene (G) | N/A | — |
| journeys.js fixture hygiene (H) | N/A | — |

**Justifications:**
- Traceability: references resolve; this story's own acceptance check is literally its meta-metric's measurement method, the same clean 1:1 pattern as pep-s1.
- Scope integrity: correctly excludes automated escalation, web UI rendering, and claiming a real-world false-positive rate this MVP can't produce.
- AC quality: 2 — see 1-H1. AC1 (computing the two signals, explicitly never computing timeline span) and AC4 (manual-review report format) are both independently testable; the defect is isolated to the threshold value, not the whole AC set.
- Completeness: full.
- Architecture compliance: constraint #11 (no persistent runtime) and ADR-011 (artefact-first for the new `scripts/` file) are both correctly cited; the explicit exclusion of calendar timeline span as a signal is grounded in the real, verified inverted-data finding from discovery, not merely asserted.

---

## Summary

1 HIGH, 0 MEDIUM, 0 LOW.
**Outcome:** FAIL — AC quality scored 2, below the pass threshold of 3.

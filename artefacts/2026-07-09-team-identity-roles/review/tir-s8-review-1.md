# Review Report: Bulk-add fetches real GitHub org members, not the admin's own org memberships — Run 1

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s8.md
**Date:** 2026-07-13
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 0 MEDIUM, 0 LOW.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Correctly frames why this matters — tir-s5's Metric 1 claim only holds if bulk-add actually adds people, and this story is precisely what makes that true rather than nominally true.
**Scope integrity (5):** Tightly scoped to the fetch mechanism only — explicitly does not touch `setFetchOrgs`/`resolveTenant` (which is correct and unrelated) or any of tir-s5's route/gating/audit logic (which is also correct).
**AC quality (5):** All 5 ACs in Given/When/Then, independently testable. AC5 (correcting tir-s5's existing tests, which were masking the bug with an unrealistic mock shape) is a well-chosen AC — without it, the bug could resurface silently in a future refactor.
**Completeness (5):** All fields populated with real, root-caused content — this story exists because of a directly-confirmed code inspection (GitHub's `/user/orgs` vs `/orgs/{org}/members`), not a hypothetical concern.
**Architecture compliance (5):** Correctly identifies this as a genuine new D37 adapter need (unlike tir-s5's own reasoning, which was right that no new adapter was needed for the write path, but wrong that the existing read adapter was sufficient) — ADR-025's tenant-scoping requirement is correctly carried forward.

**Verdict:** PASS — no findings of any severity. Clean story, directly traceable to a confirmed bug.

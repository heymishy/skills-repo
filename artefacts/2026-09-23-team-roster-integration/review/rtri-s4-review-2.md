# Review Report: Backfill person_identities on login so existing real memberships become resolvable — Run 2

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s4.md
**Date:** 2026-09-24
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

- **[2-L1]** (carried from Run 1, [1-L1]) — AC1 bundles 4 distinct login call sites into one AC; `/test-plan` must write 4 separate test cases explicitly.
- **[2-L2]** (carried from Run 1, [1-L2]) — Audit NFR conditionally unresolved pending DoR.

No new findings from the Architecture Constraints correction — it fixes the *how* (adapter-signature extension vs. no-adapter), not the *what* (AC1-AC5's observable behaviour is unchanged), so no new AC-quality or scope-integrity risk was introduced.

---

## Summary

0 HIGH, 0 MEDIUM, 2 LOW (both carried, unchanged).
**Outcome:** PASS

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Unchanged from Run 1.
**Scope integrity (5):** Unchanged from Run 1 — AC4's negative-case guard against the epic's own out-of-scope boundary is unaffected by the adapter correction.
**AC quality (4):** Unchanged from Run 1 — ACs describe observable behaviour, correctly independent of which internal mechanism (new adapter vs. extended adapter) delivers it.
**Completeness (4):** Unchanged from Run 1.
**Architecture compliance (5):** Now genuinely 5, not accidentally 5 — Run 1 scored this a 5 on an incorrect "no adapter" premise; the corrected Architecture Constraints section now accurately names the real D37 touch point (extending `getRoleForTenant`, not introducing a new adapter) and correctly cites `tir-s9`'s own precedent for how to extend it without breaking existing callers. This is a stronger, more accurate 5 than Run 1's.

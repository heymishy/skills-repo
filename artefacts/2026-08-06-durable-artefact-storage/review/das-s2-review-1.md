# Review Report: Require a connected repo before a new product can start its first journey — Run 1

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
**Date:** 2026-08-06
**Categories run:** A, B, C, D, E
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C (AC quality) — AC1 and AC3 together imply "brand-new product" means "has zero journeys yet," but this operational definition is never stated explicitly. A genuinely ambiguous edge case falls through the gap: a product that existed *before* this gate shipped but happens to have zero journeys started — is it "existing" (predates the fix, should be grandfathered per the /clarify Option A decision) or does the absence of any journey make it indistinguishable from "new" under a naive implementation, incorrectly blocking a pre-existing product's operator on their first attempt?
  Risk if proceeding: a coding agent could implement the boundary using product `created_at` (wrong — blocks a legitimate pre-existing repo-less product) instead of journey count (right — the natural, correct signal, since "existing" was defined by /clarify as "already has journeys"). Getting this wrong directly violates the AC3 regression guarantee.
  To acknowledge: run /decisions, category RISK-ACCEPT — or resolve now by adding an explicit AC stating the gate check is "product has zero journeys AND no connected repo," not a creation-date comparison.

---

## LOW findings — note for retrospective

- **[1-L1]** Category C (AC quality) — AC1's "Then the request is rejected with a clear, actionable message" uses soft, subjective language ("clear, actionable") rather than a concretely testable assertion, the same class of issue as `das-s1`'s 1-L1. Tighten to something like: "Then the request is rejected with a message directing the operator to connect a repo via the picker before proceeding."

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. The one MEDIUM (1-M1) is a real boundary-condition ambiguity worth resolving before /definition-of-ready (ideally by tightening the AC), not a blocker to /test-plan.

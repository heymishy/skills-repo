# Review Report: ep1-s1 — Run 2

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s1.md
**Date:** 2026-10-08
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** PASS

---

## Re-review context

Run 1 (2026-10-05) found 2 HIGH findings: **1-H1** (malformed "I want" clause, not independently comprehensible without the "so that") and **1-H2** (AC3 tested only write-path tenant-ID spoofing but was framed as "isolation" broadly, risking the impression that cross-tenant read/mutation protection was covered here). Both resolved in this revision:
- **1-H1:** User story rewritten — "I want to create a new journey by submitting a name, which creates a tenant-scoped record in Postgres and takes me to its canvas shell page" now stands alone as a complete capability statement.
- **1-H2:** AC3 rewritten to precisely describe the write-path guard it actually tests (request-body `tenantId` is never used; the session's own `tenantId` is), with an explicit parenthetical noting cross-tenant READ/UPDATE/DELETE protection is ep5-s2's own adversarial suite's responsibility — added to Out of Scope too, so the boundary is stated twice, not just in passing.

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

Carried over from Run 1, unaddressed (not blocking, per this story's own HIGH-only gate):

**1-M1:** AC4 ("canvas shell page shows 'No stages yet.'") mixes two concerns in one AC: the redirect and the empty-state render. These are independently testable — split into AC4a (redirect) and AC4b (canvas renders empty state). Medium because it does not block correctness but makes the test plan ambiguous.

**1-M2:** Benefit linkage says "M1 — Journey adoption — this story creates the journey record that M1 counts." This is correct but thin — it doesn't identify the mechanism sentence (what specific field/table is measured). Compare to the benefit-metric artefact which names `journeys` table count filtered by `tenantId`. The linkage should mirror that precision.

---

## LOW findings — note for retrospective

Carried over from Run 1, unaddressed:

**1-L1:** "Dependencies: ep5-s1" is listed but the out-of-scope section says "this story assumes the tables already exist" — those two statements together are correct, but the dependency is not reflected in the story's own AC list (no AC verifies the migration ran successfully before the POST fires). Low because this is a test-plan concern, not a story defect.

---

## Summary

**Outcome:** PASS

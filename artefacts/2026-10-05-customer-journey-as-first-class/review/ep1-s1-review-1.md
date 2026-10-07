# Review Report: ep1-s1 — Run 1

**Story reference:** artefacts/[feature]/stories/ep1-s1.md
**Date:** 2026-10-07
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

**1-H1:** User story format is malformed. "I want tenant-scoped record, I need a POST route..." reads as a fragment caused by story-splitting that lost the "So that I have a persistent," prefix from the discovery definition. The persona (Outer loop practitioner) and "So that" clause are present but the "I want" field is not independently comprehensible. A reader cannot understand the want without the so-that.

**1-H2:** AC3 ("Another tenant's `tenantId` is used in the request... Then the insert uses only the session `tenantId`") does not test isolation — it tests that the POST handler ignores a rogue `tenantId` in the request body. This is not the same as verifying that a cross-tenant GET or mutation is rejected. AC3 should be: given a request authenticated as tenant A with a journey ID belonging to tenant B, return 403. As written, AC3 will pass even if cross-tenant reads are not guarded.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**1-M1:** AC4 ("canvas shell page shows 'No stages yet.'") mixes two concerns in one AC: the redirect and the empty-state render. These are independently testable — split into AC4a (redirect) and AC4b (canvas renders empty state). Medium because it does not block correctness but makes the test plan ambiguous.

**1-M2:** Benefit linkage says "M1 — Journey adoption — this story creates the journey record that M1 counts." This is correct but thin — it doesn't identify the mechanism sentence (what specific field/table is measured). Compare to the benefit-metric artefact which names `journeys` table count filtered by `tenantId`. The linkage should mirror that precision.

---

## LOW findings — note for retrospective

**1-L1:** "Dependencies: ep5-s1" is listed but the out-of-scope section says "this story assumes the tables already exist" — those two statements together are correct, but the dependency is not reflected in the story's own AC list (no AC verifies the migration ran successfully before the POST fires). Low because this is a test-plan concern, not a story defect.

---

## Summary

**Outcome:** FAIL

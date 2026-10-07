# Review Report: ep4-s1 — Run 1

**Story reference:** artefacts/[feature]/stories/ep4-s1.md
**Date:** 2026-10-07
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**10-M1:** User story format: "I want a journey list page at `/journeys` that shows all journeys scoped to my tenant" — the "I want" clause describes the solution (a list page at a URL) rather than the capability. Standard format: "I want to see all my journeys in one place so that I can navigate to them." Medium: the intent is clear but the format is non-standard.

**10-M2:** AC3 (new journey form) says "optional description, and optionally associate a product from a picker of existing products for my tenant" — but this AC is a duplicate of ep1-s1's creation flow. The list page story should reference the creation flow (implemented in ep1-s1) rather than re-specifying it. As written, there is an implicit expectation that the list page implements its own creation form. The two forms may have different UX entry points but should share the same route handler — this must be clarified.

---

## LOW findings — note for retrospective

**10-L1:** AC5 (cross-tenant guard) tests GET requests with another tenant's journey ID — but the list page (`GET /journeys`) returns all journeys for the authenticated tenant. The realistic cross-tenant attack surface is a direct `GET /journeys/:id` with a foreign ID (already covered in ep5-s2) and a query that leaks another tenant's records (which AC1 implicitly covers via "scoped to my `tenantId`"). AC5 is redundant with ep5-s2 and could be removed or replaced with a test that the list query returns only the authenticated tenant's records.

---

## Summary

**Outcome:** PASS

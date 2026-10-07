# Review Report: ep5-s2 — Run 1

**Story reference:** artefacts/[feature]/stories/ep5-s2.md
**Date:** 2026-10-07
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**13-M1:** AC6 ("zero cross-tenant data leaks") is a summary assertion rather than a specific observable behaviour with a Given/When/Then. This should be expressed as: "Given the adversarial test suite covers all journey, stage, and mapping routes, When all tests pass, Then no response from any journey route includes data scoped to a tenant other than the authenticated requester." The current AC6 is a verdict, not a testable behaviour.

**13-M2:** AC5 tests `POST /api/journey-stages/:stageId/mappings` using a cross-tenant stage ID. But the route URL pattern as implied by ep2-s2 uses `journey_stage_id` in the body, not in the URL path. If the route is `POST /api/journeys/:id/stages` (for stage creation) and `POST /api/journey-stages/:stageId/mappings` (for mappings), the adversarial test must use the actual route structure. The AC should verify that the route URL shown is the actual implemented route — not an assumed one.

---

## LOW findings — note for retrospective

**13-L1:** The dependency list includes ep1-s1 and ep2-s1 but not ep1-s2 (stage creation routes). The adversarial tests cover `POST /api/journeys/:id/stages` which is implemented in ep1-s2, not ep1-s1 or ep2-s1. Add ep1-s2 to the dependency list.

---

## Summary

**Outcome:** PASS

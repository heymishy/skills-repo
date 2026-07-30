# Review Report: Client org self-service conversion to an independent paying account — Run 2

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-6-conversion-to-independent.md
**Date:** 2026-07-31
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Findings carried from Run 1

- **[1-H1] Traceability — RESOLVED.** AC1 now states its precondition precisely: `team_memberships.role === 'admin'` for the Client org's own `tenant_id`, satisfied by the org's first invited user per Story 3's corrected AC3 (see `decisions.md` 2026-07-31 role-model ARCH entry, and Story 3 review run 3). The Security NFR is updated to match, and a new Architecture Constraint names the reused check pattern (`middleware/require-admin.js`'s existing `role === 'admin'` gate, evaluated per-tenant via `resolveRoleForPerson`) rather than leaving the precondition's source unstated. AC1 also now states the negative case explicitly (non-admin role → 403), closing the previously-implicit precondition.
- **[1-M1]** (carried from Run 1, unchanged) — still open. Not addressed by this change; a separate, unrelated finding about `benefit-metric.md`'s Metric Coverage Matrix omitting this story.
- **[1-L1]** (carried from Run 1, unchanged) — AC4's concurrency test still doesn't specify the correct final state, only that data isn't corrupted.

## HIGH findings — must resolve before /test-plan

None.

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** (unchanged from Run 1) — `benefit-metric.md`'s Metric Coverage Matrix does not list this story against either Tier 1 metric, despite the story's own Benefit Linkage field framing an indirect connection. Add a row explicitly marking Story 6 as "Indirect / risk-mitigation, not directly measured," or acknowledge the omission in /decisions before /definition-of-done.

## LOW findings — note for retrospective

- **[1-L1]** (unchanged from Run 1) — tighten AC4 to state the correct final state under a grant/conversion race, not just "not corrupted," before /test-plan writes the concurrency test.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (4, up from 2):** 1-H1 closed — AC1's precondition is now a concrete, checkable role-model condition rather than an unsatisfiable "appropriate permissions" phrase. Not a 5 only because 1-M1's metric-coverage inconsistency is still open.

**Scope integrity (5):** Unchanged from Run 1 — clean.

**AC quality (4):** Unchanged — AC1's precondition is now precise; 1-L1 (concurrency final-state) is the remaining minor gap.

**Completeness (4, up from 4):** The role-model gap that previously made this story's own precondition unsatisfiable is closed; 1-M1's benefit-metric gap remains.

**Architecture compliance (5):** Unchanged — correctly cites ADR-025/ADR-026, now also explicitly for the reused role-check pattern.

**Verdict:** PASS — the HIGH finding is resolved. The MEDIUM (metric-coverage listing) should still be resolved or acknowledged before /definition-of-done, per Run 1's original recommendation.

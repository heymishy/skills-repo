# Review Report: Organisation exists as a first-class entity with an org_type — Run 1

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-1-organisation-entity.md
**Date:** 2026-07-30
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

- **[1-L1]** Completeness — AC2's backfill wording ("that tenant gets a corresponding `organisations` row") doesn't specify whether the backfill runs as a one-time migration script or lazily on next login. Both are plausible reads and either is implementable, but the test-plan author will need to pick one — worth a one-line clarification before /test-plan to avoid two different implementations of the same AC being written by different people.

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Epic, discovery, and benefit-metric references all present and correct; benefit linkage is a real mechanism sentence ("every later story... depends on it"), not a vague feature description.

**Scope integrity (5):** Out of scope explicitly excludes UI, agency/client type-setting (deferred to Story 3), and the relationship table (Story 2) — no overlap with any sibling story's scope, no implementation of anything on the epic/discovery out-of-scope list.

**AC quality (5):** 4 ACs, all Given/When/Then, independently testable, describe observable behaviour (a real table exists, a real row is created) not implementation detail.

**Completeness (4):** All template fields populated with real content. Minor gap noted in LOW-1 (backfill timing ambiguity).

**Architecture compliance (5):** Correctly cites ADR-025 (extends string-scoping, not schema/DB-per-tenant), ADR-026 (confirmed no existing entity duplicates this), and ADR-027 (ordinary app code, not a skill). All three are Active ADRs in `.github/architecture-guardrails.md` and are genuinely applicable to this story's actual change.

**Verdict:** PASS — no HIGH or MEDIUM findings. Story is well-scoped as the epic's foundational, lowest-risk story.

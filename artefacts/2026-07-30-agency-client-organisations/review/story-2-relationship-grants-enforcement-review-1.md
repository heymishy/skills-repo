# Review Report: Agency-Client relationships, shared-access grants, and read-only enforcement — Run 1

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-2-relationship-grants-enforcement.md
**Date:** 2026-07-30
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Completeness — AC5 ("revocation takes effect immediately, not after a caching delay") implies a caching layer might exist somewhere in the read path, but no Architecture Constraint or NFR states whether grant lookups are cached at all today, or commits to "no caching" as the implementation approach. If a caching layer is added later for performance, this AC becomes a real invalidation requirement that needs its own explicit design — worth stating now which approach applies, even if the answer is "no cache, direct query every time."
  Risk if proceeding: a future performance optimisation could silently reintroduce a revocation-delay bug without anyone connecting it back to this AC.
  To acknowledge: run /decisions, category RISK-ACCEPT, or add one sentence to NFRs/Architecture Constraints confirming "no caching in MVP; grant checks are always a direct query."

---

## LOW findings — note for retrospective

- **[1-L1]** Scope — the story correctly excludes "any notion of the Client org granting anything back to the Agency" from scope, but doesn't explicitly state what happens if an Agency org itself is later granted access to another org's resources (e.g. Agency-to-Agency sharing). Not needed for MVP, but worth a one-line forward note in Out of Scope for whoever picks up a future extension, since the data model (`AGENCY_CLIENT_RELATIONSHIPS`) is agency/client-typed specifically, not organisation-to-organisation generically.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 5 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Directly ties to Metric 1's "views at least one product/feature" observable step — the clearest possible mechanism sentence in the epic.

**Scope integrity (4):** Clean exclusion of Story 3's UI/flow work and Story 5's comments — correctly scoped as the data model + enforcement layer only. LOW-1 noted above.

**AC quality (5):** 6 ACs (including an explicit regression-guard AC6 protecting `bri-s3.4`'s existing tests), all Given/When/Then, all independently testable, correctly specify 404-not-403 per this codebase's existing FORBIDDEN-vs-NOT_FOUND policy rather than inventing a new convention.

**Completeness (4):** Strong NFR section explicitly calling out AC4/AC5 as "hard requirements, not aspirational" — unusually precise for this template. MEDIUM-1 noted above on the caching assumption.

**Architecture compliance (5):** Correctly identifies itself as the epic's highest-risk story, explicitly analogous to the real `bri-s3.4` cross-tenant bug, and commits to a single-adapter-function guardrail (no ad hoc DB access from route handlers) consistent with ADR-026's reuse-before-new-entities principle applied to enforcement logic itself.

**Verdict:** PASS — no HIGH findings. This is the epic's own flagged highest-risk story; the one MEDIUM finding (caching/invalidation assumption) is worth a one-line clarification before /test-plan writes tests for AC5, but does not block progression on its own.

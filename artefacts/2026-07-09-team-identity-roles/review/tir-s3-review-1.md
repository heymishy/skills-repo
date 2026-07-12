# Review Report: An admin adds a teammate by identity and assigns a role — Run 1

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s3.md
**Date:** 2026-07-13
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C (AC quality) — AC1 reads: "an identity that already has a `people` row from a prior login, or one that does not yet exist". This conflates two materially different scenarios into one AC via an "or" clause. The "does not yet exist" branch has no defined mechanism anywhere in the story: does adding a never-logged-in identity create a placeholder `people` row keyed by (say) email, that gets reconciled on that person's first real login? Or is adding a not-yet-existing identity actually out of scope, and an admin can only add someone who has already logged in at least once? As written, AC1 is not independently testable for the second branch because the expected behaviour isn't specified.
  Fix: Split into two ACs — AC1a for an admin adding an existing person (testable as written), and AC1b explicitly defining what happens for an identity with no prior login (either specify the placeholder-record mechanism, or state plainly that this story only supports adding people who have logged in at least once, moving "add by identity with no prior login" to Out of Scope).

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 3 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Clean — this is the first story where Metric 1's target becomes concretely testable (2+ people, distinct roles, in one tenant); benefit linkage sentence states this directly.
**Scope integrity (5):** Out-of-scope section correctly excludes invite-flows, removal, and pending-invite states — no epic/discovery violation.
**AC quality (3):** See 1-M1 — AC1's ambiguity is addressable without full story rework (splitting one AC into two, plus a scope decision), but as written it fails the "independently testable" bar for one of its two bundled scenarios.
**Completeness (5):** Persona, benefit linkage, NFRs, complexity, and scope stability all populated with real content.
**Architecture compliance (5):** ADR-025 correctly cited for tenant-scoped authorization; D37 correctly flagged as likely-not-applicable rather than boilerplate-cited.

**Verdict:** PASS — no HIGH findings; 1 MEDIUM (AC1 ambiguity) should be resolved before /test-plan is written against this story, since a test-plan author would otherwise have to guess the "does not yet exist" behaviour.

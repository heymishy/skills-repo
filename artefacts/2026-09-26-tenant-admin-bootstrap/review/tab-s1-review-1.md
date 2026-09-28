# Review Report: Bootstrap a brand-new tenant's first admin automatically on login — Run 1

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
**Date:** 2026-09-28
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Category C (AC quality / coverage) — The story writes to two separate tables (`tenant_admin_bootstrap` gate row, then `team_memberships` admin row) but no AC or Architecture Constraint requires these two writes to be atomic (same database transaction). If the process crashes or errors between the two writes, the `tenant_admin_bootstrap` row is already claimed (its `ON CONFLICT` slot is permanently used for that `tenant_id`), but no real admin was ever granted — that tenant becomes permanently unbootstrappable via this mechanism, recreating a worse version of the exact bug this feature exists to fix.
  Fix: Add to Architecture Constraints: "Both writes MUST occur within a single database transaction — committed together or not at all, never partially." Add AC6: "Given the second write (the `team_memberships` admin grant) fails after the first write (the bootstrap-table claim) succeeds, When the transaction is rolled back, Then no tenant is left in a claimed-but-adminless state — the bootstrap-table row is only ever committed together with the real admin grant, in the same transaction."

<!-- 1 HIGH finding this run. -->

---

## MEDIUM findings — resolve or acknowledge in /decisions

<!-- None this run. -->

---

## LOW findings — note for retrospective

- **[1-L1]** Category D (Completeness / clarity) — AC4 refers to "3 real auth providers," while `rtri-s4` (a related prior story in this same feature area) referred to "4 real login call sites" (email/password has separate sign-up and sign-in handlers). The distinction here is actually correct — only 3 paths can ever be a genuine *first* login for a brand-new tenant (2 OAuth callbacks each handle both first-time and returning users in one function; email's sign-up handler is the only first-login-capable email path) — but a future reader could misread this as an inconsistency with `rtri-s4`'s own "4 call sites" framing. Not blocking; worth one clarifying sentence.

---

## Summary

1 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** FAIL

---

## Category scores

| Criterion | Score | Pass/Fail | Justification |
|-----------|-------|-----------|----------------|
| Traceability | 5 | PASS | Parent epic, discovery, and benefit-metric all referenced; "So that" connects to a named metric with a real mechanism sentence; metric present in the coverage matrix. |
| Scope integrity | 5 | PASS | No epic/discovery out-of-scope items implemented; own Out of Scope section names 4 excluded behaviours; no unapproved scope additions. |
| AC quality | 2 | FAIL | All 5 ACs are well-formed Given/When/Then, independently testable, observable-behaviour-focused — but the AC set is missing coverage for a critical failure mode (1-H1), which is a coverage gap severe enough to drop below the pass threshold on its own. |
| Completeness | 4 | PASS | All required fields populated; named persona; NFRs, complexity, and scope stability all present. Minor clarity note (1-L1) keeps this from a clean 5. |
| Architecture compliance (E) | 3 | PASS | Architecture Constraints populated (4 items); no named guardrail, pattern, or anti-pattern explicitly violated; ADR-025 correctly addressed. The atomicity gap (1-H1) is architecturally relevant but is captured under Category C rather than double-counted here. |

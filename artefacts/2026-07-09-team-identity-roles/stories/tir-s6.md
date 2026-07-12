## Story: Team-membership lookups stay indexed at ~100 members per tenant

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As a **Team admin / tech lead**,
I want **my team's role lookups to stay fast as my team approaches its full size (~100 members)**,
So that **the platform doesn't slow down or degrade for the exact teams this feature is built to serve**.

## Benefit Linkage

**Metric moved:** Schema holds up at ~100 members per tenant.
**How:** This story load-tests the schema built in tir-s1 at a synthetic 100-member scale, confirming indexed (not full-table-scan) lookup behaviour — directly producing the evidence the metric requires.

## Architecture Constraints

- Extends tir-s1's `people`/`team_memberships` schema with any additional index found necessary at this story's load-test scale — does not introduce a new table or a different tenancy model.
- **ADR-025:** tenant-scoping stays the isolation boundary; this story only validates that scoping stays performant as membership count grows within one tenant.

## Dependencies

- **Upstream:** tir-s1 (hard — schema must exist). Soft dependency on tir-s5 for AC4's bulk-insert-path validation — if AC4 is instead validated via a direct seeding script rather than tir-s5's actual bulk-add feature, tir-s5 is not a hard blocker.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant with 100 synthetic `team_memberships` rows (script-seeded, not real accounts), When a role lookup query runs for a specific person+tenant pair, Then the query plan uses an index (confirmed via `EXPLAIN` or the equivalent for the active database), not a full table scan.

**AC2:** Given the same 100-member tenant, When the lookup query from AC1 completes, Then its execution time is under 50ms. **[Testability: accepted by operator on 2026-07-12 — threshold confirmed as under 50ms.]**

**AC3:** Given a tenant with only 1 member (today's common solo case), When the same lookup query runs, Then its performance is unaffected by the schema/indexing changes made for the 100-member case — no regression for the far more common single-tenant case.

**AC4:** Given 100 members are inserted in one batch (simulating tir-s5's bulk-add path), When the insert completes, Then it does not time out or noticeably degrade compared to 100 individual inserts — confirming the bulk-insert path scales too.

## Out of Scope

- Real load testing against production-scale *concurrent* traffic — this story validates schema/query-plan correctness at 100 rows for a single request at a time, not concurrent-request throughput, which is a distinct NFR concern for a future story if it becomes relevant.
- Testing beyond 100 members — the ~100 figure is discovery's stated soft ceiling; this story does not validate 1,000 or 10,000-member scale.

## NFRs

- **Performance:** This story's entire purpose is the performance NFR — indexed lookups at 100 members/tenant, confirmed under 50ms (see AC2).
- **Security:** None identified beyond what tir-s1/tir-s4 already establish.
- **Accessibility:** Not applicable — no UI, this is a backend/data-layer story.
- **Audit:** Not applicable beyond the standard migration/query logging already in place from tir-s1.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

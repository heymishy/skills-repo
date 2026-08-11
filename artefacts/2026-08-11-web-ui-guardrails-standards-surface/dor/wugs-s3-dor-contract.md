## Contract Proposal — Show a tenant's org-level guardrails and standards, read from a designated org repo, seeded on first use

**What will be built:**
New `tenant_org_repo` table (migration). A designation handler that inserts the row and, on first designation, calls `wugs-s6`'s write adapter (stubbed/mocked for this story) to seed `.github/architecture-guardrails.md` and `standards/getting-started.md` with the exact verbatim content specified in AC1. A view section reading org content via `wugs-s1`'s fetch function, rendered alongside `wugs-s2`'s product section.

**What will NOT be built:**
Multi-level org hierarchies, cross-repo aggregation, UI for re-designating after first set.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, mock pool + mocked seed-write call, asserts exact seeded text | unit |
| AC2 | Unit test, mocked `wugs-s1` fetch for the org repo | unit |
| AC3 | Unit test, mock pool with no `tenant_org_repo` row | unit |
| AC4 | Unit test, two mock products same tenant | unit |
| AC5 | Integration test, two mock products different tenants, cross-tenant isolation | integration |

**Assumptions:**
None beyond the explicit `wugs-s6` upstream dependency now recorded in the story's own Dependencies block (resolved during this DoR run — see `decisions.md`'s SLICE entry, 2026-08-11). `/implementation-plan` must sequence `wugs-s6` before `wugs-s3`'s AC1 seeding step, even though they sit in different epics.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `scripts/migrate-schema-pg.js` (new table), `tests/check-wugs-s3-*.js` (new)
Services: None
APIs: None directly

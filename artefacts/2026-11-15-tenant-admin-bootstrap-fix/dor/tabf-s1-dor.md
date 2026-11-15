## Definition of Ready: Make the tenant-admin bootstrap statement valid on a real Postgres

**Story reference:** artefacts/2026-11-15-tenant-admin-bootstrap-fix/stories/tabf-s1-valid-bootstrap-statement.md
**Test plan reference:** artefacts/2026-11-15-tenant-admin-bootstrap-fix/test-plans/tabf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

## Contract Proposal
See `artefacts/2026-11-15-tenant-admin-bootstrap-fix/dor/tabf-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** A two-line SQL change and one new test file; all 7 ACs map to a named test or a named live scenario. The contract's exclusion list (roles, login flow, auth routes, migrations, backfill, CI Postgres) has zero test assertions against it; the touched files are exactly the two the tests need.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for sff-s1 and pes-s1.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a person logging in as the first user of a brand-new tenant" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test | ✅ | AC1 P1, AC2 P2, AC3 P3, AC4 P4, AC5 P5+P6, AC6 U1 and the suite, AC7 live scenario |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Closes tab-s1's unmet intent on a real database |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-025 and ADR-011 |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | Takes `pool` as a plain parameter; no `setX()` adapter |
| H-E2E, H-NFR, H-NFR2, H-NFR3, H-GOV, H-INF, H-MIG, H-DESIGN | N/A or vacuous | ✅ | No UI, no schema change (statement only), NFRs inline |

**Hard blocks: 19/19 passed** (2 vacuous).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Verification script not yet walked by a human |
| W5 | ⚠️ Pending operator | Two accepted risks: the real-database tests do not run in CI; and shipping starts granting admin to the next first user of any tenant with no admin. The second needs the operator's read-only check of tenants without an admin before production promotion |

## Standards injection
Domain tags `[web-ui, data, auth]`: `web-ui`, `data` and `auth` match keys in `.github/standards/index.yml`. The agent must read the listed files (`web-ui/web-ui-patterns.md`, and the `data` and `auth` entries) before implementing; the `data` standards file is noted elsewhere as an unfilled template, so the binding constraints are the story's own.

## Oversight level
**Medium** - a small change, but it activates a never-working security-relevant path (first-user admin grant) in production for the first time. The operator is told before promotion and checks the tenants-without-admin list; no formal named sign-off beyond that.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-15-tenant-admin-bootstrap-fix/stories/tabf-s1-valid-bootstrap-statement.md
Test plan: artefacts/2026-11-15-tenant-admin-bootstrap-fix/test-plans/tabf-s1-test-plan.md
Contract: artefacts/2026-11-15-tenant-admin-bootstrap-fix/dor/tabf-s1-dor-contract.md
Goal: write tests/check-tabf-s1-bootstrap-real-postgres.js first (U1 and P1 to P6); with a throwaway Postgres confirm P2 (and U1) FAIL on the unfixed statement while P1 passes; then add the casts. No scope beyond the 7 ACs.
Constraints:
- Only the claim statement's parameters change: $1::varchar and $2::integer; keep the single statement, the transaction, the second insert, the logging and the return value exactly as they are.
- Set the schema up with the REAL migrateTeamSchema and migrateTenantAdminBootstrapSchema; the freshDb() helper must refuse a non-local database URL (copy the guard from tests/check-coha-s6-error-bridge.js) and must only touch its own bootstrap tables and its own generated tenants.
- The real-DB tests are gated by TAB_TEST_DATABASE_URL and print SKIPPED when it is unset; U1 always runs and reads the source with line endings normalised.
- Do not edit tests/check-tab-s1-tenant-admin-bootstrap.js, auth.js, auth-email.js or any other src file.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. Node built-ins and the existing pg dependency only. ASCII only (verify the count).
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy.
- Docker must be running for the real-database run; if it is not, STOP and report (do not mark the story verified on skipped tests).
Oversight level: Medium - the operator checks tenants without an admin before production promotion.
```

## Sign-off
**Oversight level:** Medium; **Sign-off required:** Operator awareness of the first-time admin grant before promotion (recorded in the story, the contract and the pending actions). W4 and W5 advisory, pending the operator.
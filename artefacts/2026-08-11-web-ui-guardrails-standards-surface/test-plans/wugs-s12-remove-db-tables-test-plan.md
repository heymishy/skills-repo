## Test Plan: Remove the `standards`/`standard_product_optouts` DB tables and their references

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s12-remove-db-tables.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-4-smug-s1-migration.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | no remaining table references | — | — | — | 1 check | — | 🟢 |
| AC2 | handleDeleteProduct cleanup lines removed, still works | 1 test | — | — | — | — | 🟢 |
| AC3 | schema migration drops tables | 1 test | — | — | — | — | 🟢 |
| AC4 | full regression suite still passes | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock pool for `handleDeleteProduct`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC2 | Mock pool for `handleDeleteProduct`, asserting only the remaining (non-standards) DELETE statements fire | Mock pool | None | This is the story's highest-value test — directly verifies the cross-reference finding from this feature's own discovery investigation |
| AC3 | Schema migration script run against a test DB or dry-run mode | Migration script | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handleDeleteProduct_afterTableRemoval_noStandardsCleanupCalls

- **Verifies:** AC2
- **Precondition:** Mock pool tracking all `.query()` calls made during product deletion
- **Action:** Call `handleDeleteProduct` for a product
- **Expected result:** No `DELETE FROM standards` or `DELETE FROM standard_product_optouts` calls are issued; the remaining deletion calls (`journeys`, `products`) still fire correctly and in the right order
- **Edge case:** No — but this is the story's single most important test, directly covering the real risk found during discovery

### migrationScript_dropsTables

- **Verifies:** AC3
- **Precondition:** Migration script includes a `DROP TABLE IF EXISTS standards` / `standard_product_optouts` step
- **Action:** Run the migration against a test database that has the old tables
- **Expected result:** Both tables no longer exist after migration runs
- **Edge case:** No

---

## Integration Tests

### fullProductsRegressionSuite_afterTableRemoval_allPass

- **Verifies:** AC4
- **Components involved:** All of `products.js`'s existing test coverage
- **Precondition:** This story's changes applied
- **Action:** Re-run `check-prc-s4.2-delete-product.js` and all other `products.js`-touching test files
- **Expected result:** All pass, zero regressions — proves the table removal didn't silently break unrelated product-management functionality
- **Edge case:** No

---

## NFR Tests

None — confirmed with story owner (schema-removal story, no new runtime NFR surface; the deploy-time migration correctness is covered by AC3).

---

## Out of Scope for This Test Plan

- Any data-preservation/export mechanism — explicitly not built, per this epic's Out of Scope.

---

## Test Gaps and Risks

None identified as blocking.

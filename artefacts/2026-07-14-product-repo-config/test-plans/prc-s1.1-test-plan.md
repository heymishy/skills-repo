## Test Plan: Add repo association columns to the products table

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.1.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-1-walking-skeleton.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Migration adds repo_provider/repo_owner/repo_name columns, idempotently | — | 1 test | — | — | — | 🟢 |
| AC2 | Existing product rows have null repo columns after migration | — | 1 test | — | — | — | 🟢 |
| AC3 | Re-running the migration is a no-op, no error, no duplicate columns | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — a mocked `pg`-Pool-shaped object exposing `query(sql, params)`, matching this repo's existing `makeFakePool`/spy-mock convention (see `tests/check-tir-s9-*.js`, `tests/check-arl-s5-*.js`).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no external dependency.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mock pool that records every `ALTER TABLE` statement it receives | Synthetic | None | Assert the exact SQL shape, not just "no error" |
| AC2 | A pre-existing product row (no repo columns populated) | Synthetic fixture row | None | |
| AC3 | Same mock pool, `query` called twice | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story is schema migration only; the meaningful assertions are at the integration (mocked-pool) level, not pure-function unit level.

---

## Integration Tests

### migrateProductRepoColumns runs the expected idempotent ALTER TABLE statements

- **Verifies:** AC1
- **Components involved:** New migration function (likely `migrateProductRepoColumns(pool)` in `products.js` or a new `modules/product-repo.js`, mirroring `user-roles.js`'s `migrateTeamSchema` convention), mocked `pg` pool
- **Precondition:** Mock pool with no prior calls recorded
- **Action:** Call the migration function
- **Expected result:** Mock pool recorded exactly 3 `ALTER TABLE products ADD COLUMN IF NOT EXISTS` calls (`repo_provider`, `repo_owner`, `repo_name`), each nullable (no `NOT NULL` in the SQL)

### Existing product rows are unaffected by the migration

- **Verifies:** AC2
- **Components involved:** Migration function, mocked pool seeded with one pre-existing product row
- **Precondition:** Mock pool's `products` fixture has one row with no repo columns
- **Action:** Run the migration, then `SELECT repo_provider, repo_owner, repo_name FROM products WHERE product_id = $1`
- **Expected result:** All three columns return `null` for the pre-existing row — no default value fabricated

### Migration is idempotent across repeated calls

- **Verifies:** AC3
- **Components involved:** Migration function, mocked pool
- **Precondition:** Migration already run once against the mock pool
- **Action:** Call the migration function a second time
- **Expected result:** No thrown error; the mock pool's assertion helper confirms no duplicate-column SQL was issued (the `IF NOT EXISTS` clause is present in both calls, matching the existing `products.js`/`server.js` idempotent-migration convention)

---

## NFR Tests

None — confirmed with story owner (story's own NFR section states "None identified" for Performance and Security).

---

## Out of Scope for This Test Plan

- Populating the columns via a real connect/create-repo flow — that's prc-s1.2's test plan.
- Any UI-level test — this story has no UI surface.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |

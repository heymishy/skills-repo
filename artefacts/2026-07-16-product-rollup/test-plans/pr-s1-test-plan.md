## Test Plan: Designate Product as a named primitive and register skills-framework as a product

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s1.md
**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e1-foundation.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Product row created with repo_owner/repo_name, tenant-scoped | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | `/products/:id` renders skills-framework's product like any other | — | 1 test | — | — | — | 🟢 |
| AC3 | `docs/concepts/README.md` has an 8th primitives-list entry for Product | 1 test | — | — | — | — | 🟢 |
| AC4 | No cross-tenant data returned when querying product rows | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mixed — seeded/synthetic Postgres rows (product creation), static file read (primitives list)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own data in setup/teardown

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A test Postgres instance/mock pool; tenant_id fixture value | Seeded — test creates the row itself | None | Follows existing product-creation test convention in `products.js`'s own test suite |
| AC2 | The product row from AC1's setup | Seeded | None | Uses the same `_renderProductView` render path already tested elsewhere |
| AC3 | Real `docs/concepts/README.md` file content | Fixture — reads the actual committed file | None | This test reads the real file, not a mock — it fails until the doc is actually updated |
| AC4 | Two distinct tenant_id fixture values, each with their own product row | Seeded | None | Mirrors the existing tenant-isolation test pattern already used for `products` table queries |

### PCI / sensitivity constraints

None — product metadata contains no payment or personal data.

### Gaps

None — all data is synthesizable in test setup.

---

## Unit Tests

### creates a product row scoped to the caller's tenant_id

- **Verifies:** AC1
- **Precondition:** No product row exists for skills-framework's repo in the test database.
- **Action:** Run the migration/seed function that creates skills-framework's own product row.
- **Expected result:** A row exists in `products` with `repo_owner`/`repo_name` matching this repository and `tenant_id` matching the operator's tenant.
- **Edge case:** No.

### seed step is idempotent — running it twice does not create a duplicate row

- **Verifies:** AC1
- **Precondition:** The seed step has already run once (row exists).
- **Action:** Run the seed step a second time.
- **Expected result:** Still exactly one product row for skills-framework's repo — no duplicate, no error thrown.
- **Edge case:** Yes — re-run safety, matching the existing `ADD COLUMN IF NOT EXISTS` idempotency convention used elsewhere in this codebase (`product-repo.js`'s `migrateProductRepoColumns`).

### docs/concepts/README.md contains exactly one "Product" primitive entry

- **Verifies:** AC3
- **Precondition:** None — reads the real committed file.
- **Action:** Read `docs/concepts/README.md` and count primitive entries.
- **Expected result:** The file lists 8 primitives (the existing 7 plus "Product"), and the "Product" entry's description references the existing `products` table/UI, not a new schema.
- **Edge case:** No.

### querying a product row by tenant_id never returns another tenant's row

- **Verifies:** AC4
- **Precondition:** Two product rows exist, each with a different `tenant_id`.
- **Action:** Query for tenant A's products using tenant A's `tenant_id`.
- **Expected result:** Only tenant A's row is returned — tenant B's row is absent from the result set.
- **Edge case:** No.

### querying with tenant B's tenant_id returns only tenant B's row, not tenant A's

- **Verifies:** AC4
- **Precondition:** Same two-tenant fixture as the previous test.
- **Action:** Query for tenant B's products using tenant B's `tenant_id`.
- **Expected result:** Only tenant B's row is returned.
- **Edge case:** Yes — the reverse-direction check, confirming isolation is symmetric, not just checked from one tenant's side.

---

## Integration Tests

### GET /products/:id renders skills-framework's product like any other existing product

- **Verifies:** AC2
- **Components involved:** `products.js` route handler, `_renderProductView`, the product row from AC1's seed.
- **Precondition:** skills-framework's own product row exists (from the seed step); an authenticated session exists for the operator's tenant.
- **Action:** Send `GET /products/:productId` for skills-framework's product row.
- **Expected result:** HTTP 200; response body contains the product name and a feature list, using the same render path as any other product — no special-cased branch for this particular row.

---

## NFR Tests

None — confirmed with story owner. This story's NFRs state "Not applicable" for Performance/Accessibility (one-time row creation, no new UI) and describe existing conventions for Security/Audit rather than introducing new measurable thresholds.

---

## Out of Scope for This Test Plan

- The sync mechanism (fetching/caching the connected repo's `pipeline-state.json`) — covered in pr-s2's own test plan.
- End-to-end browser testing of the full `/products/:id` page — AC2 is covered at the integration level (route handler + render function); a full Playwright E2E spec is recommended per ADR-018 (see story's Architecture Constraints) as a DoR-time addition, not required for this test plan's own AC coverage since no AC here is CSS-layout-dependent.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

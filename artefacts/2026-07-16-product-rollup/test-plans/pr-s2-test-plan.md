## Test Plan: Sync a product's connected repo and show aggregate DoD status

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s2.md
**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e1-foundation.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fetch via Contents API + write computed rollup to Postgres | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | `/products/:id` renders cached DoD status | — | 1 test | — | — | — | 🟢 |
| AC3 | Fetch failure surfaces visibly, no silent stale/empty data | 2 tests | — | — | — | — | 🟢 |
| AC4 | Epic-nested stories counted correctly alongside flat stories | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mixed — mocked GitHub Contents API responses via `global.fetch` override (matching `tests/check-prc-s1.3-sign-off-write-back.js`'s exact precedent), seeded/synthetic Postgres fixtures for the cache table and product row.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own mocked responses and fixture data in setup/teardown

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A mocked Contents API response with base64-encoded `pipeline-state.json` content; a test Postgres pool/mock | Mocked fetch + seeded DB | None | Mock response shape must match GitHub's real Contents API shape (`{ content: base64String, encoding: 'base64', ... }`) per the story's own mock-shape verification constraint |
| AC2 | A pre-populated cache row (from AC1's mechanism) | Seeded | None | Reuses `_renderProductView`'s existing render path |
| AC3 | A mocked fetch response returning 404, and a mocked fetch response returning 403 (token lacks access) | Mocked fetch | None | Two distinct failure-shape tests — 404 (not found) and 403 (access denied) are handled the same way per the story's own AC (both surface visibly), but tested separately since they are different real-world response codes |
| AC4 | A fixture `pipeline-state.json` payload containing both `epics[].stories[]`-nested features and flat `feature.stories[]` features, mirroring this platform's own real file shape | Fixture — synthetic JSON matching this repo's own real structure | None | Directly modelled on this repo's own `pipeline-state.json`, which genuinely has this exact mixed structure |

### PCI / sensitivity constraints

None.

### Gaps

None — all data is synthesizable in test setup; no real GitHub credentials needed for any test.

---

## Unit Tests

### fetches pipeline-state.json via GitHub Contents API using the caller's OAuth token

- **Verifies:** AC1
- **Precondition:** `global.fetch` is mocked to return a 200 response with base64-encoded `pipeline-state.json` content, matching GitHub's real Contents API response shape.
- **Action:** Call the sync adapter with a product's `repo_owner`/`repo_name` and a fake OAuth token.
- **Expected result:** The mocked fetch is called with a URL matching `/repos/{owner}/{repo}/contents/.github/pipeline-state.json` and an `Authorization` header containing the fake token — mirroring `check-prc-s1.3-sign-off-write-back.js`'s own assertion style for the same API surface.
- **Edge case:** No.

### computes and writes a DoD-status rollup record scoped by product_id

- **Verifies:** AC1
- **Precondition:** The fetch mock returns a fixture `pipeline-state.json` with features at known `dodStatus` values (e.g. 2 "complete", 1 "in-progress").
- **Action:** Run the sync mechanism end to end against the mock, then read back the written cache row for that `product_id`.
- **Expected result:** The cache row's DoD-status counts exactly match the fixture (2 complete, 1 in-progress) and the row is keyed by the correct `product_id`.
- **Edge case:** No.

### sync failure on 404 surfaces a visible error and writes nothing

- **Verifies:** AC3
- **Precondition:** `global.fetch` mocked to return `{ ok: false, status: 404 }`.
- **Action:** Trigger a sync against a product whose connected repo doesn't have the file.
- **Expected result:** The sync mechanism returns/throws a distinguishable error result; no cache row is written or updated as a result of this failed attempt (existing cached data, if any, is left untouched).
- **Edge case:** Yes — the negative path, ensuring failure doesn't silently corrupt or blank existing good data.

### sync failure on 403 (token lacks access) surfaces a visible error, distinct from 404

- **Verifies:** AC3
- **Precondition:** `global.fetch` mocked to return `{ ok: false, status: 403 }`.
- **Action:** Trigger a sync against a product the token cannot access.
- **Expected result:** The sync mechanism surfaces a failure result — the AC only requires visibility, not a distinct message per status code, but this test confirms the 403 case is not silently swallowed or misreported as success.
- **Edge case:** Yes.

### DoD status aggregation counts epic-nested stories correctly

- **Verifies:** AC4
- **Precondition:** Fixture `pipeline-state.json` with a feature using `epics[].stories[]` (2 nested stories, one "complete", one "in-progress") alongside a separate flat feature using `feature.stories[]` (1 story, "complete").
- **Action:** Run the DoD-status aggregation function against this fixture.
- **Expected result:** Total counts are 2 "complete" and 1 "in-progress" — the epic-nested stories are found and counted, not skipped because they're not at the top-level `stories[]` path.
- **Edge case:** No.

### DoD status aggregation does not double-count when both structures coexist in one feature

- **Verifies:** AC4
- **Precondition:** Fixture where a single feature object has both a (legacy/empty) top-level `stories: []` and populated `epics[].stories[]` — mirroring how a real epic-nested feature in this repo's own `pipeline-state.json` is actually shaped (confirmed in this session's own grounding).
- **Action:** Run the aggregation against this fixture.
- **Expected result:** Only the `epics[].stories[]` entries are counted for this feature — the empty top-level array contributes zero, not a silent double-count or a silent skip of the epic-nested ones.
- **Edge case:** Yes — specifically targets the exact ambiguous shape this repo's own data has, which is why AC4 exists at all.

---

## Integration Tests

### GET /products/:id renders cached DoD status after a successful sync

- **Verifies:** AC2
- **Components involved:** `products.js` route handler, `_renderProductView`, the sync mechanism's cache table.
- **Precondition:** A sync has completed successfully (using the Unit test fixtures above) and a cache row exists for the product.
- **Action:** Send `GET /products/:productId`.
- **Expected result:** The response body contains the DoD-status counts from the cache row, not just the pre-existing `featureCount` value.

---

## NFR Tests

### Sync performs exactly one Contents API call and one Postgres write, regardless of feature count

- **NFR addressed:** Performance
- **Measurement method:** Count `global.fetch` invocations and DB write invocations during a single sync run, against a fixture with 50 features.
- **Pass threshold:** Exactly 1 fetch call, exactly 1 write (or 1 upsert) to the cache table — not one call per feature.
- **Tool:** Assertion on mock call counts (Node `assert`, no external tool needed).

### OAuth token never appears in the written cache row or in log output

- **NFR addressed:** Security
- **Measurement method:** After a sync using a known fake token value, inspect the written cache row's serialized content and any captured log output for that token string.
- **Pass threshold:** The token string does not appear anywhere in the cache row or logs.
- **Tool:** String search assertion (Node `assert`).

---

## Out of Scope for This Test Plan

- Every rollup dimension other than DoD status — covered in pr-s4 through pr-s7's own test plans.
- The Refresh UI control and last-synced timestamp — covered in pr-s3's own test plan.
- Full browser E2E testing of the sync flow — no AC here is CSS-layout-dependent; ADR-018 recommends an E2E spec as a DoR-time architecture-guardrail addition (see story's Architecture Constraints), not a requirement of this test plan's own AC coverage.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

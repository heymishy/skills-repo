## Test Plan: Resolve each product's own repo for SaaS export, tenant-scoped

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s1-tenant-scoped-repo-resolution.md
**Epic reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/epics/mtrr-e1-multi-tenant-repo-resolution-and-ux.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-06

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Product A's slug resolves product A's own repo | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Product B independently resolves its own repo (behavioural correctness) | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Unauthorized credential → 403, no repo/owner/tenant identifier leaked | 2 tests | — | — | — | — | 🟢 |
| AC4 | GITHUB_REPO env var fully removed from export path | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Seeded database (test environment)
**PCI/sensitivity in scope:** No — repo owner/name and tenant IDs are operational metadata, not PCI/PII
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Product A row with owner/repo columns populated; a feature slug belonging to product A; a credential authorized for product A | Seeded test DB | None | |
| AC2 | Product B row, distinct owner/repo from product A; a feature slug belonging to product B; a credential authorized for product B | Seeded test DB | None | Must genuinely differ in content from product A's fixture, not just differ in name |
| AC3 | A credential authorized for neither product A nor B; a feature slug for a non-existent product | Seeded test DB | None | |
| AC4 | N/A — static code inspection | Source file grep | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### resolvesOwnerRepoForFeatureSlug_productA

- **Verifies:** AC1
- **Precondition:** Product A seeded with distinct owner/repo; feature slug belonging to product A
- **Action:** Call `ownerRepoForFeature(slug, credentialForA)`
- **Expected result:** Returns product A's own owner/repo — not a global/hardcoded value
- **Edge case:** No

### resolvesOwnerRepoForFeatureSlug_productB_differsFromA

- **Verifies:** AC2
- **Precondition:** Product B seeded with distinct owner/repo; feature slug belonging to product B
- **Action:** Call `ownerRepoForFeature(slug, credentialForB)`, compare result against product A's result from the previous test
- **Expected result:** Product B's owner/repo differs from product A's, and each individually matches its own fixture — proves the lookup is genuinely per-request, not shared/cached (mirrors the D37 lesson from `rb-s4`)
- **Edge case:** No

### unauthorizedCredential_returns403_noRepoIdentifierInBody

- **Verifies:** AC3
- **Precondition:** Credential authorized for neither product; existing feature slug belonging to product A
- **Action:** Call the export endpoint
- **Expected result:** 403 response; error body does not contain product A's repo name, owner name, or any tenant identifier
- **Edge case:** No

### nonExistentSlug_returns403or404_noRepoIdentifierInBody

- **Verifies:** AC3
- **Precondition:** Credential authorized for neither product; a feature slug that doesn't exist anywhere
- **Action:** Call the export endpoint
- **Expected result:** Error response (403 or 404, per `rb-s4`'s existing distinction — preserved, not required to be identical); error body does not contain any repo/owner/tenant identifier in either case
- **Edge case:** Yes — the two "unauthorized" and "doesn't exist" cases must be checked side by side to confirm neither leaks identifying detail, even though their status codes may differ

### githubRepoEnvVarNotReferenced_inExportPath

- **Verifies:** AC4
- **Precondition:** N/A — static analysis
- **Action:** Grep `src/web-ui/adapters/export-data-source.js` and `src/web-ui/routes/export.js` for `GITHUB_REPO` / `ownerRepoFromEnv`
- **Expected result:** Zero matches
- **Edge case:** No

---

## Integration Tests

### exportEndpointEndToEnd_twoProductsResolveIndependently

- **Verifies:** AC1, AC2
- **Components involved:** Export route, `ownerRepoForFeature`, seeded products table, mocked GitHub Contents API
- **Precondition:** Two products seeded, each with a DoR-approved feature and distinct repo
- **Action:** Call the export endpoint for each product's feature slug with its own authorized credential
- **Expected result:** Each call returns its own product's content; cross-checking confirms no overlap or shared state between the two calls

---

## NFR Tests

### tenantScopedLookupUnder500ms

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing of `ownerRepoForFeature` against the seeded test DB
- **Pass threshold:** < 500ms
- **Tool:** `console.time`/`console.timeEnd` wrapper

---

## Out of Scope for This Test Plan

- Testing `mtrr-s2`'s UI — separate test plan.
- Testing the underlying GitHub Contents API fetch itself — already covered by `rb-s4`'s existing tests; this plan only tests the new resolution step in front of it.

---

## Test Gaps and Risks

None — all ACs have automated coverage; no manual-only scenarios required.

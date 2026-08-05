## Test Plan: Bootstrap an existing repo from a DoR-approved SaaS artefact

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s4-saas-connected-bootstrap.md
**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e2-saas-connected-bootstrap-and-outer-loop.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | CLI authenticates via secure prompt, fetches artefact + pipeline-state | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Local repo contains full skill set + fetched content at conventional paths | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | 403-equivalent error on access denial, no silent fallback | 2 tests | — | — | — | — | 🟢 |
| AC4 | Export endpoint returns 200 with content matching SaaS UI exactly | 2 tests | 1 test | — | — | — | 🟢 |
| AC5 | Injectable adapter (D37): stub throws, production wiring behaviourally verified | 2 tests | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mocked external services
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mocked SaaS API response for a valid credential + feature slug | Mocked, following this repo's existing `setFetcher`-style injectable mock pattern (see `tests/check-prc-s1.3-sign-off-write-back.js` for precedent) | None (test credential is a synthetic string, never a real token) | |
| AC2 | Fetched artefact/pipeline-state content fixture | Synthetic | None | |
| AC3 | Mocked 403 response from the SaaS API | Mocked | None | |
| AC4 | Real DoR-approved artefact + pipeline-state entry in a test database/fixture, and the same content as rendered by the existing SaaS UI route | Seeded database (test environment) | None — this is the operator's own work product, not customer PII | |

### PCI / sensitivity constraints

None — no payment or personal data involved; artefact content is the operator's own delivery work product.

### Gaps

None.

---

## Unit Tests

### cliPromptsForCredentialSecurely_neverViaEnvVar

- **Verifies:** AC1
- **Precondition:** CLI invoked with the SaaS-connected flag and a feature slug
- **Action:** Inspect how the CLI obtains its credential
- **Expected result:** Credential is read via an interactive prompt (or a documented secrets-store reference), never read from `process.env` as a plain value and never accepted as a CLI argument (which would appear in shell history)
- **Edge case:** No

### cliFetchesArtefactAndPipelineStateForValidCredential

- **Verifies:** AC1
- **Precondition:** Mocked SaaS API returns 200 with a fixture artefact + pipeline-state entry for a given feature slug
- **Action:** Run the CLI fetch logic against the mock
- **Expected result:** The returned content matches the fixture exactly, unmodified

### fetchedContentWrittenToConventionalPaths

- **Verifies:** AC2
- **Precondition:** Fetch succeeds (mocked)
- **Action:** Inspect the target directory after the CLI completes
- **Expected result:** Artefact content is written to `artefacts/[slug]/...` and the pipeline-state entry is merged into `.github/pipeline-state.json` at the correct feature/story path

### return403OnInvalidCredentialAccess_namesTheProblem

- **Verifies:** AC3
- **Precondition:** Mocked SaaS API returns 403 for the given credential/slug combination
- **Action:** Run the CLI fetch logic
- **Expected result:** CLI exits non-zero with an error message naming the access problem (e.g. "credential does not have access to feature [slug]") — not a generic failure message

### doesNotFallBackToFreshRepoBootstrapOn403

- **Verifies:** AC3
- **Precondition:** Same 403 mock as above
- **Action:** Run the CLI fetch logic; inspect the target directory afterward
- **Expected result:** No fresh-repo bootstrap content (per `rb-s1`) is written as a fallback — the command stops and reports the error, target directory is left as it was before the attempt

### exportEndpointReturns200WithMatchingContent_forValidRequest

- **Verifies:** AC4
- **Precondition:** A DoR-approved feature exists in the test database; a valid credential for that feature's tenant
- **Action:** Call the new export endpoint directly (route-level test, following this repo's `setFetcher`/route-handler injection convention)
- **Expected result:** Returns 200 with artefact content and pipeline-state entry that exactly matches what `handleArtefactRoute` (the existing in-app viewing route) would render for the same feature — no divergence between the two code paths

### exportEndpointRejectsRequestForFeatureNotDorApproved

- **Verifies:** AC4 (edge case — only DoR-approved features should be exportable)
- **Precondition:** A feature exists but has not reached DoR sign-off
- **Action:** Call the export endpoint for that feature's slug
- **Expected result:** Returns a 4xx response, not 200 with partial/premature content
- **Edge case:** Yes

---

### stubExportDataSourceThrows_whenNotWired

- **Verifies:** AC5
- **Precondition:** `setExportDataSource` has not been called — default stub is active
- **Action:** Call the export data-source function directly
- **Expected result:** Throws `Adapter not wired: exportDataSource. Call setExportDataSource() with a real implementation before use.` — does not return `null`, `undefined`, or an empty object
- **Edge case:** No

### wiredExportDataSource_returnsCorrectPayloadForCredential

- **Verifies:** AC5
- **Precondition:** `setExportDataSource(realExportDataSource)` called with the real implementation
- **Action:** Call the export endpoint for a specific feature slug
- **Expected result:** Returns the payload for that specific feature — not a generic or hardcoded response

---

## Integration Tests

### cliEndToEnd_fetchAndMaterializeAgainstMockedSaasApi

- **Verifies:** AC1, AC2
- **Components involved:** CLI fetch logic, mocked SaaS API, target directory file system
- **Precondition:** Empty target directory (not yet bootstrapped); mocked SaaS API configured with a valid fixture
- **Action:** Run the full CLI command end to end against the mock
- **Expected result:** Target directory ends up with the full skill set (per `rb-s2`) plus the fetched artefact/pipeline-state, ready for `/branch-setup` — verified by confirming all expected files exist with correct content

### twoDifferentFeaturesResolveToTwoDifferentCorrectPayloads

- **Verifies:** AC5 (behavioural-correctness requirement — the critical D37 test, not just a wiring-assignment check)
- **Components involved:** Export endpoint, wired `realExportDataSource`, two distinct DoR-approved test-database fixtures
- **Precondition:** Two different DoR-approved features exist in the test database, each with genuinely different artefact content
- **Action:** Call the export endpoint for feature A's slug, then for feature B's slug
- **Expected result:** The two responses differ from each other, and each individually matches its own feature's real content — proves `realExportDataSource` is actually resolving per-feature data, not returning a shared/cached/hardcoded response that happens to pass a single-feature test

### exportEndpointAuditLogsEachFetch

- **Verifies:** AC4 NFR (Audit)
- **Components involved:** Export endpoint, audit log store
- **Precondition:** A valid fetch request is made
- **Action:** Inspect the audit log after the request completes
- **Expected result:** A log entry exists recording who made the request, which feature slug, and when

---

## NFR Tests

### fetchAndMaterializeUnder15Seconds

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing of the CLI fetch-and-materialize flow against the mocked API
- **Pass threshold:** < 15 seconds
- **Tool:** `console.time`/`console.timeEnd` wrapper

### credentialNeverLoggedOrWrittenToDisk

- **NFR addressed:** Security
- **Measurement method:** After a fetch attempt (success or failure), grep all written files and captured log output for the test credential string
- **Pass threshold:** Zero matches anywhere
- **Tool:** Node script string-search assertion

---

## Out of Scope for This Test Plan

- Building a general-purpose public API for third-party integrations — only the minimal export endpoint this story needs.
- Testing the CLI's outer-loop opt-in flag — covered by `rb-s5`'s own test plan.

---

## Test Gaps and Risks

None — all ACs have automated coverage; no manual-only scenarios required for this story.

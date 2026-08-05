# Contract Proposal: Bootstrap an existing repo from a DoR-approved SaaS artefact

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s4-saas-connected-bootstrap.md
**Date:** 2026-08-05

## What will be built

A new minimal export endpoint (`src/web-ui/routes/`) that returns a DoR-approved feature's artefact content and pipeline-state entry, gated by a credential valid for that feature's tenant, exposed via an injectable adapter (`setExportDataSource`, mirroring `artefact.js`'s existing `setFetcher` pattern). CLI-side fetch logic (following `platform-fetch.js`'s existing shape) authenticates via secure prompt, calls the endpoint, and materializes the result into conventional paths.

## What will NOT be built

- A general-purpose public API for third-party integrations
- The optional full-outer-loop install flag — `rb-s5`

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked SaaS API, assert credential prompt + fetch behaviour | Unit + integration |
| AC2 | Assert fetched content written to conventional paths | Unit + integration |
| AC3 | Mocked 403, assert error message + no silent fallback | Unit |
| AC4 | Route-level test against seeded test-database fixture | Unit + integration |
| AC5 | Stub-throws test + two-different-features-two-different-payloads behavioural test | Unit + integration |

## Assumptions

- A test database/fixture environment is available for seeding DoR-approved features
- The existing `setFetcher` pattern in `artefact.js` is a valid precedent to mirror for the new endpoint's own adapter

## Estimated touch points

- **Files:** new route file under `src/web-ui/routes/`, `server.js` (wiring `setExportDataSource`), new CLI fetch module
- **Services:** none new — uses existing test database
- **APIs:** one new internal endpoint

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

Dependencies on `rb-s1`/`rb-s2`/`rb-s3` are code-level (this story's CLI composes their output on disk), not `pipeline-state.json` schema field consumption.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 5 ACs (AC5 added at DoR to close the H-ADAPTER gap — see review Run 3).

# DoR Contract Proposal: Sync a product's connected repo and show aggregate DoD status

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s2.md

## What will be built

A new route/module in `src/web-ui/` implementing a "trigger sync" action: fetches the connected repo's `.github/pipeline-state.json` via GitHub's Contents API (following `sign-off.js`'s `handleArtefactRead` pattern, using the requesting user's own OAuth token), computes an aggregate DoD-status rollup (count of features at each `dodStatus` value, correctly handling both `epics[].stories[]`-nested and flat `feature.stories[]` structures), and writes it to a new Postgres table scoped by `product_id`. The Contents API call is wired behind a new injectable adapter (throw-on-unwired default, mirroring `repo-adapter.js`'s existing pattern), with production wiring in `server.js` verified by a behavioural test (AC5).

## What will NOT be built

Every rollup dimension other than DoD status (Epic 2's scope). Last-synced timestamp display and the Refresh UI control (pr-s3's scope). Automatic or scheduled sync — on-demand only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked `global.fetch` (matching `check-prc-s1.3-sign-off-write-back.js`'s pattern) + seeded Postgres fixture | Unit |
| AC2 | Integration test against `_renderProductView` after a successful mocked sync | Integration |
| AC3 | Mocked fetch returning 404 and 403, asserting visible failure with no silent stale/empty data | Unit |
| AC4 | Fixture `pipeline-state.json` mirroring this repo's own real epic-nested + flat structure | Unit |
| AC5 | Two-repo mocked-fetch test proving the wired adapter returns correct, differentiated data per repo; separate test confirming the unwired stub throws | Unit |

## Assumptions

The new cache table is a new Postgres table (not new columns on `products`), since it stores a computed, re-derivable rollup rather than product identity/config data — consistent with how `standards` is already a separate table keyed by `product_id` rather than columns bolted onto `products`.

## Estimated touch points

Files: a new route/module in `src/web-ui/` (sync handler), a new adapter module (Contents API fetch, mirroring `repo-adapter.js`), `server.js` (wiring), a new Postgres migration for the cache table
Services: GitHub Contents API (via existing OAuth-token pattern)
APIs: `GET /repos/{owner}/{repo}/contents/{path}` (GitHub)

# Contract Proposal: Require a connected repo before a new product can start its first journey

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
**Date:** 2026-08-07

## What will be built

A gate check inserted into the journey-start code path (`journey.js`'s journey-creation handler): before creating a journey, query the product's existing journey count and `repo_owner`/`repo_name`. If journey count is 0 AND no repo is connected, reject with a message directing the operator to `mtrr-s2`'s repo-connection picker. Otherwise (journey count ≥ 1, or a repo is already connected), proceed exactly as today.

## What will NOT be built

- Any new repo-connection UI — reuses `mtrr-s2`'s picker unchanged.
- Any retroactive migration or blocking of existing repo-less products.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Zero-journey, no-repo product, assert journey-start rejected with a clear message | Unit |
| AC2 | Connect a repo, retry, assert success | Unit + integration |
| AC3 | Product with ≥1 existing journey, no repo, assert NOT blocked | Unit (regression guard) |
| AC4 | Brand-new product with repo already connected, assert no gate friction | Unit |

## Assumptions

- The journey-count check (`journeys WHERE product_id = $1`, count ≥ 1) is a cheap, already-indexed-equivalent query given existing per-tenant journey-count caps (`MAX_JOURNEYS_PER_TENANT`) already perform a similar count.

## Estimated touch points

- **Files:** `src/web-ui/routes/journey.js` (journey-creation handler)
- **Services:** none new
- **APIs:** none new — reads existing `products`/`journeys` columns

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

Upstream (`mtrr-s2`) is a code-level reuse dependency (already merged), not a pipeline-state.json schema field dependency.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.

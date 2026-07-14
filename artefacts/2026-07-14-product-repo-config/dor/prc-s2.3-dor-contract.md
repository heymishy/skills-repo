# DoR Contract Proposal: Resolve annotation write-back to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.3.md

## What will be built

`annotation-writer.js` changed to import and reuse `prc-s1.3`'s per-product resolution function directly (not a duplicate implementation) — same pattern applied to the second existing Contents API write path.

## What will NOT be built

Any annotation UI/UX change — write-target resolution only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Product fixture, assert annotation commit targets its repo | Integration |
| AC2 | Product with no repo, assert same error pattern as prc-s1.3 | Integration |
| AC3 | Static import-identity check — same resolution function, not reimplemented | Integration |

## Assumptions

None beyond what `prc-s1.3` already established.

## Estimated touch points

Files: `src/web-ui/adapters/annotation-writer.js`
Services: GitHub Contents API (existing)
APIs: `PUT /repos/{owner}/{repo}/contents/{path}` (parameterized)

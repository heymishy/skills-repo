# DoR Contract Proposal: Edit a product's name, description, and repo association

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.1.md

## What will be built

An edit route handler for name/description (simple update), and a repo-association change path that reuses `prc-s1.2`/`prc-s2.1`'s already-wired `repoAdapter` access-verification logic (not a reimplementation).

## What will NOT be built

Cross-tenant product transfer.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Edit request, assert pool UPDATE + immediate reflection | Integration |
| AC2 | Change repo association, assert same access-check as prc-s1.2 fires first | Integration |
| AC3 | Product with no repo, use edit flow to add one, assert identical code path to first-time config | Integration |

## Assumptions

None new.

## Estimated touch points

Files: product edit route handler
Services: `repoAdapter` (reused)
APIs: `GET /repos/{owner}/{repo}` (reused, via `repoAdapter`)

# DoR Contract Proposal: Write standards to the product's repo as the source of truth

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.1.md

## What will be built

`standardsPost`/`standardsPut` changed to commit standard content as a real file (`standards/<name>.md`) via the GitHub Contents API, reusing the same mechanism `prc-s1.3`/`prc-s2.3`/`prc-s2.4` already established — not a fourth, separate implementation of "commit a file."

## What will NOT be built

`standardsPromote`/`optoutPost`/`optoutDelete` — untouched.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked Contents API, assert PUT to standards/<name>.md | Integration |
| AC2 | Existing file's SHA reused on edit, assert update not duplicate | Integration |
| AC3 | Product with no repo, assert same error pattern | Integration |

## Assumptions

None new.

## Estimated touch points

Files: `src/web-ui/routes/standards.js` (`standardsPost`, `standardsPut` only)
Services: GitHub Contents API (existing mechanism, reused)
APIs: `PUT /repos/{owner}/{repo}/contents/standards/{name}.md`

# DoR Contract Proposal: Resolve sign-off write-back to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.3.md

## What will be built

`sign-off-writer.js`'s `commitSignOff` changes from reading `process.env.GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` directly to accepting `owner`/`repo` as parameters, resolved by `routes/sign-off.js` from the product's own `repo_owner`/`repo_name` columns (populated by `prc-s1.2`). A "no repo configured" rejection path when the product has no repo association.

## What will NOT be built

Annotation write-back (`prc-s2.3`) or the local `journey.js` artefact-write path (`prc-s2.4`) — deliberately deferred to keep the walking skeleton thin.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Product fixture with connected repo, assert Contents API call targets it | Integration |
| AC2 | Two products/two repos, assert zero cross-contamination | Integration |
| AC3 | Product with null repo columns, assert rejection + zero API calls | Integration |
| AC4 | Mocked `GET /user`, assert commit author/committer unchanged | Integration |

## Assumptions

`commitSignOff`'s existing identity-resolution logic (fetching `GET /user` for author/committer) is untouched — only the `owner`/`repo` resolution changes.

## Estimated touch points

Files: `src/web-ui/adapters/sign-off-writer.js`, `src/web-ui/routes/sign-off.js`
Services: GitHub Contents API (existing)
APIs: `PUT /repos/{owner}/{repo}/contents/{path}` (parameterized, not hardcoded)

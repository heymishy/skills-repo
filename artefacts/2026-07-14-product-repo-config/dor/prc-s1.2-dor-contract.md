# DoR Contract Proposal: Connect an existing GitHub repo to a product

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.2.md

## What will be built

A repo-connection route handler plus a D37 injectable adapter (`setRepoAdapter`/`getRepoAdapter`-shaped) that: verifies the authenticated user's GitHub token has access to a submitted owner/repo via `GET /repos/{owner}/{repo}`, then updates the product's `repo_provider`/`repo_owner`/`repo_name` columns. For non-GitHub-authenticated sessions, redirects to the existing `GET /settings/link-account/github/start` flow.

## What will NOT be built

Creating a brand-new repo (`prc-s2.1`). Any bootstrap/seeding of the connected repo's content (`prc-s2.2`).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked GitHub API (200), assert pool UPDATE + confirmation response | Integration |
| AC1 (confirmation) | Assert response shape indicates success | Integration |
| AC2 | Mocked GitHub API (404), assert rejection + zero writes | Integration |
| AC3 | Session without accessToken, assert redirect to account-linking | Integration |
| AC4 | Product fixture with existing repo, assert re-link updates not duplicates | Integration |
| AC5 (D37 wiring) | Unwired call throws exact error message; wired adapter resolves 2 sessions to 2 distinct, individually-correct results | Integration (2 tests) |

## Assumptions

The GitHub OAuth App's existing `repo,read:user` scope (confirmed via code inspection at `/clarify`) is sufficient for the `GET /repos/{owner}/{repo}` access check — no scope change needed.

## Estimated touch points

Files: new route handler (likely `src/web-ui/routes/product-repo.js`), new adapter module, `src/web-ui/server.js` (wiring)
Services: GitHub REST API (Contents/repo endpoints)
APIs: `GET /repos/{owner}/{repo}` (GitHub)

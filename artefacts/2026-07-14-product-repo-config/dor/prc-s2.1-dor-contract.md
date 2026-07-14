# DoR Contract Proposal: Create a new GitHub repo directly from product creation

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.1.md

## What will be built

A `createRepo` method added to the same `repoAdapter` module `prc-s1.2` introduced and wired (not a second, parallel adapter) — calls `POST /user/repos` with the operator's own OAuth token, then sets the product's `repo_*` columns to the created repo. Reuses the "link your GitHub account" redirect for non-GitHub-authenticated sessions.

## What will NOT be built

Repo visibility/privacy configuration beyond GitHub's default. Bootstrap content — `prc-s2.2`.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked `POST /user/repos` (201), assert pool UPDATE | Integration |
| AC2 | Mocked `POST /user/repos` (422, name collision), assert rejection + zero writes | Integration |
| AC3 | Session without accessToken, assert same redirect as prc-s1.2 AC3 | Integration |
| AC4 | Assert repo_* columns populated before bootstrap-step response | Integration |

## Assumptions

`repoAdapter`'s `createRepo` method reuses the exact same D37 wiring `prc-s1.2` established (`setRepoAdapter`) — no second wiring AC needed since the adapter itself, not just one of its methods, is already wired.

## Estimated touch points

Files: `repoAdapter` module (extended, not new), product-creation route handler
Services: GitHub REST API
APIs: `POST /user/repos`

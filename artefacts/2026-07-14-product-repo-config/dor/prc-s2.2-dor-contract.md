# DoR Contract Proposal: Bootstrap a newly created repo with the skills framework

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.2.md

## What will be built

A bootstrap orchestration function that, given a freshly created empty repo, commits the skills framework content (`.github/skills/`, `.github/templates/`, `scripts/`, matching `platform-init.js`'s `COPY_DIRS`) via the GitHub Git Data API (tree/blob/commit endpoints) — a single commit under the operator's identity. Local-clone fallback only if the API-only approach proves genuinely too complex during implementation (per `/clarify`'s resolution).

## What will NOT be built

Standards content bootstrap (Epic 3). Per-tenant customization of bootstrap content.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked tree/blob/commit API, assert commit contains framework files under real identity | Integration |
| AC2 | Spy on API call sequence, assert genuinely invoked (corrected wording per `/review` 1-M1) | Integration |
| AC3 | Compare bootstrap output structurally against `platform-init.js`'s real `COPY_DIRS` | Integration |
| AC4 | Forced API failure, assert fallback (if implemented) still uses the operator's own token | Integration |

## Assumptions

If the fallback path (AC4) is never actually implemented because the API-only approach succeeds without needing it, AC4's test is marked pending with an explanatory comment, not deleted — per the test plan's own note.

## Estimated touch points

Files: new bootstrap module (e.g. `src/web-ui/modules/repo-bootstrap.js`), wired into the product-creation flow after `prc-s2.1`
Services: GitHub Git Data API (tree/blob/commit)
APIs: `POST /repos/{owner}/{repo}/git/trees`, `.../blobs`, `.../commits`, `PATCH .../refs/heads/{branch}`

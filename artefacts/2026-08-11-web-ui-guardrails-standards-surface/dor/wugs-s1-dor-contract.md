## Contract Proposal — Extend the artefact-fetcher adapter to read arbitrary repo files and folders

**What will be built:**
A new exported function in `src/web-ui/adapters/artefact-fetcher.js` (e.g. `fetchRepoPath(owner, repo, path, token)`) that generalises the existing `fetchArtefact()` GitHub Contents API call to accept any path, not just `artefacts/<slug>/<type>.md`. Branches on response shape: single-file object (base64 `content`, decoded and returned as a string) vs. directory array (returned as-is, entries with `name`/`path`/`type`). Reuses the existing `ArtefactNotFoundError`/`ArtefactFetchError` classes. Follows the injectable-adapter pattern (`_fetchRepoPath` internal var, `setFetchRepoPath()`/`getFetchRepoPath()` exports), stub default throws.

**What will NOT be built:**
No change to `fetchArtefact()`'s existing single-file behaviour or its callers (`export-data-source.js`, artefact viewer). No caching layer. No write capability (read-only).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, mocked single-file Contents API response | unit |
| AC2 | Unit test, mocked folder-listing Contents API response | unit |
| AC3 | Unit test, mocked 404 response | unit |
| AC4 | Unit test, mocked 500/rate-limit response | unit |
| AC5 | Unit test, fresh module require, no adapter wired | unit |
| AC6 | Integration test, real `server.js` wiring, two distinct mocked paths | integration |

**Assumptions:**
The real GitHub Contents API returns an array (not an object) for directory paths — confirmed via GitHub's public API documentation; the implementer must additionally verify with one live call per this story's own Test Gaps note, since a documentation-only assumption is exactly the mock-shape risk CLAUDE.md warns about.

**Estimated touch points:**
Files: `src/web-ui/adapters/artefact-fetcher.js`, `src/web-ui/server.js` (wiring), `tests/check-wugs-s1-*.js` (new)
Services: None
APIs: GitHub Contents API (`GET /repos/{owner}/{repo}/contents/{path}`)

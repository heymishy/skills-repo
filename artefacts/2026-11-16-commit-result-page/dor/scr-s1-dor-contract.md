# Contract Proposal - Show the "Committed" result page after a skill session commit, instead of a server error

**What will be built:**
- `src/web-ui/routes/skills.js`: `htmlGetCommitResult(skillName, sessionId)` (async; reads the session with `_getSessionOrRestore`; throws an error with `status: 404` and message `Commit result not found` when the session is unknown, has no `committedAt`, or has no usable `artefactPath`; otherwise returns `{ artefactPath, featureSlug, artefactType }`), exported; and in `handlePostCommitHtml`, after a successful `_commitSession`, `committedAt` is stamped on the session.
- `src/web-ui/server.js`: the wiring task, `skillsAdapter.setGetCommitResult(...)` calling `htmlGetCommitResult`, in the same block as `setGetCommitPreview` and `setCommitSession`; plus the import.
- `tests/check-scr-s1-commit-result-page.js` (new, T1 to T7).

**What will NOT be built:**
- No change to `adapters/skills.js` (the stub keeps throwing), `views/commit-view.js`, the preview handler, `handleCommitArtefact`, or any other route; no pull request URL or next-skill suggestion; no new store; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (real wiring) |
| AC2 | T2 | unit |
| AC3 | T3 | integration (real route table) |
| AC4 | T4 | integration |
| AC5 | T5 | integration |
| AC6 | T6 | unit |
| AC7 | Scenario 9 | live (production-observed, operator-performed) |

**Assumptions:** `routes/skills.js` binds `_getCommitResult = skillsAdapter.getCommitResult`, which delegates to the adapter's current implementation, so wiring through `skillsAdapter.setGetCommitResult` takes effect (read at `routes/skills.js` line 1478 and `adapters/skills.js` lines 177 to 179); the `/result` route is already registered in `server.js` and guarded; `session.artefactPath` is set before the preview and commit steps (`routes/skills.js` lines 2726 and 5540).

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/routes/skills.js`, `src/web-ui/server.js`, `tests/check-scr-s1-commit-result-page.js` (new). Services: none. APIs: the result route answers 200 (or 404) instead of 500.

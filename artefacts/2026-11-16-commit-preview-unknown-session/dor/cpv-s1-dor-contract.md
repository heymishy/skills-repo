# Contract Proposal - Answer 404 for a commit preview or commit with nothing to commit, and say where the file really goes

**What will be built:**
- `src/web-ui/routes/skills.js`: `htmlGetCommitPreviewChecked(skillName, sessionId)` (async; reads the session with `_getSessionOrRestore`; throws an error with `status: 404` and message `Nothing to commit for this session` when the session is missing, has no `artefactPath` or no `artefactContent`, or has a `skillName` different from the one given; otherwise returns `{ artefactContent, artefactPath }`), exported; `htmlCommitSession` calls it before `commitArtefact` so a commit with nothing to commit throws the 404 error and makes no outward call.
- `src/web-ui/server.js`: the `setGetCommitPreview` wiring calls `htmlGetCommitPreviewChecked` instead of `htmlGetPreview`; the import line gains the new name.
- `src/web-ui/views/commit-view.js`: the two copy lines (preview and result).
- `tests/check-cpv-s1-commit-preview-unknown-session.js` (new, T1 to T7).

**What will NOT be built:**
- No change to `htmlGetPreview` (existing tests pin it), to `scm-adapter.js` or what it writes where, to the result page handler, the CSRF or viewer guards, credits, or any other route; no branch or pull request flow; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (real route table and wiring) |
| AC2 | T2 | integration |
| AC3 | T3 | integration |
| AC4 | T4 | integration with a recording `fetch` |
| AC5 | T5 | integration with a stubbed `fetch` |
| AC6 | T6 and the full suite | unit, integration |
| AC7 | Scenario 8 | live (read-only) |

**Assumptions:** `handleGetCommitPreviewHtml` and `handlePostCommitHtml` already render `err.status || 500` with the error message in an error page (read at `routes/skills.js` around lines 1603 to 1615 and 1660 to 1680); `server.js` wires `setGetCommitPreview` and `setCommitSession` in the `WIRE_SKILL_ADAPTERS` block (read at lines 452 to 458); `htmlCommitSession` is currently `htmlGetPreview` then `commitArtefact` (read at `routes/skills.js` lines 6179 to 6184); the contents-API PUT is made by `scm-adapter.js` using `fetch` and `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` (read in full); no test asserts the text "new branch" (searched `tests/`).

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/routes/skills.js`, `src/web-ui/server.js`, `src/web-ui/views/commit-view.js`, `tests/check-cpv-s1-commit-preview-unknown-session.js` (new). Services: none. APIs: two routes answer 404 where they answered 200 or a 500.

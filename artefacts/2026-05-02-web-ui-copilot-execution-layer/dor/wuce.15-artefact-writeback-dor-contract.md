# Contract Proposal: Artefact write-back with attribution

**Story:** wuce.15
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `POST /skills/:sessionId/commit` — triggers artefact commit for a completed session
- Path validation: server-side validation that commit path is within `artefacts/` — paths outside → HTTP 400 with descriptive message
- Identity resolution: fetches authenticated user name + email from GitHub user endpoint before commit
- Reuses `commitArtefact(artefactPath, content, commitMessage, token)` adapter from `src/adapters/artefact-committer.js` (established by wuce.3) — no new commit function created
- 409 conflict handling: returns "Artefact already exists — reload and review" to client; does not overwrite silently
- Success response: returns repository link and commit SHA to display in browser
- Test fixtures: reuses `tests/fixtures/github/contents-api-commit-success.json`, `tests/fixtures/github/contents-api-conflict.json`

## Components NOT built by this story

- Post-commit editing of the artefact via the web UI
- Versioned artefact history view or diff
- Batch commit of multiple artefacts in one operation
- Write-back to any path outside `artefacts/` (security constraint, not a feature)

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | Commit artefact to `artefacts/<feature-slug>/discovery.md` under user identity | `POST /commit → commits to expected path`, `commit message includes skill name and user identity`, `contents API called with correct path` |
| AC2 | Git author + committer = authenticated user | `commit uses authenticated user name and email`, `author and committer fields both set to user identity`, `not a service account or anonymous` |
| AC3 | Path outside `artefacts/` → 400 | `path "../../etc/passwd" → HTTP 400`, `path "src/index.js" → HTTP 400`, `path "artefacts/feature/discovery.md" → accepted` |
| AC4 | Contents API conflict → "Artefact already exists — reload and review" | `409 from Contents API → exact message "Artefact already exists — reload and review"`, `no silent overwrite on conflict` |
| AC5 | Success → repository link + commit SHA shown | `success response contains repository URL`, `success response contains commit SHA`, `both displayed in browser` |

## Assumptions

- `commitArtefact` adapter (wuce.3) already handles the Contents API call, conflict detection, and SHA fetching — wuce.15 calls it, does not re-implement it
- The commit route is a distinct API endpoint from the execute route (ADR-009)
- Default commit message format: `"feat: add [artefact-type] via [skill-name] ([user-login])"` — matching wuce.3 convention

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/commit.js` | Create | Artefact commit route handler |
| `src/adapters/artefact-committer.js` | Reuse | `commitArtefact` already created by wuce.3 |
| `src/utils/path-validator.js` | Reuse | Already created by wuce.10 (or wuce.3) |
| `src/app.js` | Extend | Mount commit route |
| `tests/artefact-writeback.test.js` | Create | 18 Jest tests for wuce.15 |
| `tests/fixtures/github/contents-api-commit-success.json` | Reuse | Already created by wuce.15 test plan fixtures |
| `tests/fixtures/github/contents-api-conflict.json` | Reuse | Already created by wuce.15 test plan fixtures |

## Contract review

**APPROVED** — all components are within story scope, `commitArtefact` adapter reused from wuce.3, path validation is server-side, author + committer attribution is explicit, no scope boundary violations identified.

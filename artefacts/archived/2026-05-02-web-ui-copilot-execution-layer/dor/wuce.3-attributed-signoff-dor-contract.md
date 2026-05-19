# Contract Proposal: Attributed sign-off on pipeline artefacts

**Story:** wuce.3
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `POST /artefact/signoff` — validates path, calls `commitSignOff` adapter, returns success/conflict/error
- Sign-off adapter module: `src/adapters/sign-off-writer.js` — `commitSignOff(artefactPath, approverName, token)` — appends `## Approved by` section and commits under user identity
- Server-side path validation: reject paths containing `..`, `/etc/`, `/tmp/`, or any traversal sequence → 400
- Rate limiter middleware: 10 requests/user/minute on sign-off route
- Conflict handling: 409 from GitHub Contents API → "reload and retry" message to client; no partial commit
- Already-signed-off detection: if `## Approved by` already present → sign-off button disabled; server returns 409 if attempted
- Audit log: sign-off attempt (success/failure), user ID, artefact path, timestamp

## Components NOT built by this story

- Multi-approver workflows — out of scope
- Rejection action — out of scope
- pipeline-state.json update on sign-off — out of scope (ADR-003)
- Action queue visibility of signed-off items (wuce.5)
- Annotation feature (wuce.8)

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | Sign-off commit appends `## Approved by` | `POST /artefact/signoff commits with ## Approved by section`, `approved-by section contains user display name` |
| AC2 | Verify on reload | `artefact fetch after sign-off contains ## Approved by`, `sign-off persists across page reload` |
| AC3 | Commit shows user identity | `commit author is authenticated user not service account`, `commit committer matches session user` |
| AC4 | Path traversal → 400 | `path with ../ → 400`, `path with /etc/ → 400`, `valid path → proceeds` |
| AC5 | 409 conflict → reload message | `GitHub 409 response → reload message to user`, `no partial commit on 409` |
| AC6 | Already signed off → button disabled | `artefact with ## Approved by → sign-off button disabled`, `POST to already-signed-off → 409` |

## Assumptions

- The GitHub Contents API `update` endpoint is used (requires current file SHA); the adapter fetches SHA before committing
- `approverName` is extracted from the authenticated GitHub user identity (from wuce.1 session), not from a form field
- The `## Approved by` section format is: `## Approved by\n\n[name] — [role] — [date]`

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/sign-off.js` | Create | Sign-off route handler |
| `src/adapters/sign-off-writer.js` | Create | `commitSignOff` adapter |
| `src/middleware/rate-limiter.js` | Create | Per-user rate limiting |
| `src/app.js` | Extend | Mount sign-off routes |
| `tests/sign-off.test.js` | Create | 17 Jest tests for wuce.3 |

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.

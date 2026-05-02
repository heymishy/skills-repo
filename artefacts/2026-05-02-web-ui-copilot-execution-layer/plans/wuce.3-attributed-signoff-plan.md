# Implementation Plan: wuce.3 — Attributed sign-off on pipeline artefacts

**Story:** wuce.3
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Planned:** 2026-05-03
**Oversight:** High

---

## Loaded

**Story:** Attributed sign-off on pipeline artefacts
ACs: 6 | Tests: 17 (T1.1–T1.3, T3.1, T4.1–T4.2, T5.1, T6.1–T6.2, IT1–IT5, NFR1–NFR3)
Arch constraints: ADR-009 (separate handler), ADR-012 (commitSignOff adapter), committer = authenticated user, server-side path validation, ADR-003 (no new pipeline-state.json fields)

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `tests/fixtures/github/contents-api-write-success.json` | Create | GitHub Contents API success response fixture |
| `tests/fixtures/github/contents-api-conflict.json` | Create | GitHub Contents API 409 conflict response fixture |
| `tests/fixtures/markdown/discovery-unsigned.md` | Create | Unsigned artefact fixture for tests |
| `tests/fixtures/markdown/discovery-signed.md` | Create | Signed artefact fixture for tests (has ## Approved by) |
| `src/web-ui/adapters/sign-off-writer.js` | Create | Core adapter: buildSignOffPayload, commitSignOff, detectExistingSignOff, validateArtefactPath, SignOffConflictError |
| `src/web-ui/middleware/rate-limiter.js` | Create | Per-user rate limiter factory (10 req/user/min) |
| `src/web-ui/routes/sign-off.js` | Create | POST /sign-off + GET /artefact/:slug/discovery route handlers (ADR-009) |
| `src/web-ui/server.js` | Extend | Mount sign-off route handler |
| `tests/check-wuce3-attributed-signoff.js` | Create | 17 tests: T1.1–T1.3, T3.1, T4.1–T4.2, T5.1, T6.1–T6.2, IT1–IT5, NFR1–NFR3 |
| `package.json` | Extend | Add check-wuce3-attributed-signoff.js to test chain |

---

## Task 1 — Fixtures

**TDD step:** Fixtures required before tests can run.

### `tests/fixtures/github/contents-api-write-success.json`
Contents API PUT success response.

### `tests/fixtures/github/contents-api-conflict.json`
Contents API 409 conflict response.

### `tests/fixtures/markdown/discovery-unsigned.md`
Markdown without `## Approved by` section.

### `tests/fixtures/markdown/discovery-signed.md`
Markdown with existing `## Approved by` section (Test Stakeholder — 2026-04-28T14:32:00Z).

---

## Task 2 — Core adapter (src/web-ui/adapters/sign-off-writer.js)

Implements ADR-012 adapter pattern.

**Functions:**
- `validateArtefactPath(path)` → boolean — rejects `..`, `./`, absolute paths, null bytes
- `buildSignOffPayload(markdown, user, timestamp)` → string — appends `## Approved by\n\n{name} — {timestamp}\n`
- `detectExistingSignOff(markdown)` → `{ approver, date }|null` — detects existing `## Approved by` section
- `SignOffConflictError` — custom error class for 409 conflicts
- `commitSignOff(artefactPath, { content, sha }, token)` → Promise — fetches /user for identity, PUTs to GitHub with user as committer/author

**Security invariant:** `commitSignOff` uses `token` param for all requests — no env-var write token.

---

## Task 3 — Rate limiter middleware (src/web-ui/middleware/rate-limiter.js)

`createRateLimiter({ maxRequests, windowMs })` returns middleware.
Default: 10 requests/user/minute.
In-memory sliding window per userId.
Returns 429 on limit exceeded.

---

## Task 4 — Sign-off route handler (src/web-ui/routes/sign-off.js)

**ADR-009:** Separate module from read/auth handlers.

`handleSignOff(req, res)`:
1. Apply rate limiter
2. Parse body (`req.body` if present, else read stream)
3. Validate path via `validateArtefactPath` → 400 if invalid
4. GET current file from GitHub Contents API (user's token)
5. `detectExistingSignOff` → 409 if already signed
6. `commitSignOff` — throws `SignOffConflictError` → 409 with reload message
7. Audit log: signoff_submitted event
8. 200 on success

`handleArtefactRead(req, res, slug)`:
- GET file from GitHub Contents API
- Return rendered content (needed for IT2/AC2)

Exported: `handleSignOff`, `handleArtefactRead`, `setLogger`

---

## Task 5 — Mount in server.js

Add routes in `router()`:
- `POST /sign-off` → `handleSignOff`
- `GET /artefact/:slug/discovery` → `handleArtefactRead`

---

## Task 6 — Test file (tests/check-wuce3-attributed-signoff.js)

17 tests, Node.js built-ins, same pattern as check-wuce1-oauth-flow.js.
Mock `global.fetch` for GitHub API calls.

---

## Commit message

```
feat(wuce.3): attributed sign-off on pipeline artefacts

- POST /sign-off route handler (ADR-009: separate from auth/read)
- commitSignOff adapter (ADR-012): PUTs to GitHub under user identity
- validateArtefactPath: rejects traversal sequences (AC4)
- detectExistingSignOff: prevents duplicate sign-offs (AC6)
- buildSignOffPayload: appends ## Approved by section (AC1)
- createRateLimiter: 10 req/user/min (AC5/NFR)
- GET /artefact/:slug/discovery: minimal read for AC2 testing
- 17 tests: T1.1–T1.3, T3.1, T4.1–T4.2, T5.1, T6.1–T6.2, IT1–IT5, NFR1–NFR3

Security:
- Committer identity = authenticated user token (never service account)
- Path traversal prevention: rejects ../ and absolute paths → 400
- Rate limit: 10 sign-offs/user/minute → 429

Story: artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.3-attributed-signoff-dor.md
```

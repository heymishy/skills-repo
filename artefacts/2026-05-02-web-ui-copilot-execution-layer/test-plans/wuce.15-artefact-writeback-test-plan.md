# Test Plan: wuce.15 — Artefact write-back with attribution

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.15-artefact-writeback.md
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Epic:** wuce-e4 (Phase 2 guided UI)
**Framework:** Jest + Node.js (backend only)
**Test data strategy:** Static fixtures committed to `tests/fixtures/`; HTTP mocking via `jest.mock` / nock for Contents API calls
**Written:** 2026-05-02
**Status:** Failing (TDD — no implementation exists)

---

## Summary

| Category | Count |
|----------|-------|
| Unit | 14 |
| Integration | 2 |
| NFR | 2 |
| **Total** | **18** |

---

## Named shared fixtures

New fixtures defined by this story:

| Fixture | Content | Consumed by |
|---------|---------|-------------|
| `tests/fixtures/github/contents-api-commit-success.json` | GitHub Contents API success response with `content.sha` and `content.html_url` | T1.1, T1.3, T3.1, INT1 |
| `tests/fixtures/github/contents-api-conflict.json` | GitHub Contents API 409 conflict response | T1.4, T4.1 |

**`tests/fixtures/github/contents-api-commit-success.json` content:**
```json
{
  "content": {
    "name": "discovery.md",
    "path": "artefacts/2026-05-02-ai-pipeline/discovery.md",
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    "html_url": "https://github.com/test-org/test-repo/blob/master/artefacts/2026-05-02-ai-pipeline/discovery.md"
  },
  "commit": {
    "sha": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
    "message": "artefact: commit /discovery session output [session-test-123]",
    "author": {
      "name": "test-stakeholder",
      "email": "test-stakeholder@users.noreply.github.com"
    }
  }
}
```

**`tests/fixtures/github/contents-api-conflict.json` content:**
```json
{
  "message": "409: Conflict",
  "documentation_url": "https://docs.github.com/rest/repos/contents",
  "status": "409"
}
```

---

## AC mapping

| AC | Summary | Test group |
|----|---------|-----------|
| AC1 | Confirm → server commits artefact to `artefacts/<slug>/discovery.md` under user identity | T1, T3 |
| AC2 | Git author + committer = authenticated user's GitHub identity, not service account | T1 |
| AC3 | Path outside `artefacts/` rejected with 400 | T2 |
| AC4 | Contents API 409 → "Artefact already exists — reload and review before committing" | T4 |
| AC5 | Confirmation page shows repo link + commit SHA | T5 |

---

## Test groups

### T1 — commitArtefact SCM adapter (reuses wuce.3 adapter)

Module under test: `src/scm-adapter.js` — `commitArtefact(artefactPath, content, commitMessage, token, identity)`

**T1.1** — calls Contents API with correct path, content (base64), and user identity as committer
```javascript
const { commitArtefact } = require('../src/scm-adapter');
const mockPut = jest.fn().mockResolvedValue(
  JSON.parse(fs.readFileSync('tests/fixtures/github/contents-api-commit-success.json'))
);
jest.mock('../src/github-client', () => ({ put: mockPut }));

await commitArtefact(
  'artefacts/2026-05-02-ai-pipeline/discovery.md',
  '## Discovery content',
  'artefact: commit /discovery session output [session-123]',
  'gho_test_token',
  { name: 'test-stakeholder', email: 'test@example.com' }
);

expect(mockPut).toHaveBeenCalledWith(
  expect.stringContaining('contents/artefacts/2026-05-02-ai-pipeline/discovery.md'),
  expect.objectContaining({
    committer: expect.objectContaining({ name: 'test-stakeholder' }),
    author: expect.objectContaining({ name: 'test-stakeholder' })
  }),
  expect.objectContaining({ Authorization: 'Bearer gho_test_token' })
);
```
Expected: FAIL

**T1.2** — commit message includes skill name and session ID
```javascript
await commitArtefact('artefacts/slug/discovery.md', 'content', 'artefact: commit /discovery [sess-abc]', token, identity);
const callArgs = mockPut.mock.calls[0][1];
expect(callArgs.message).toContain('discovery');
expect(callArgs.message).toContain('sess-abc');
```
Expected: FAIL

**T1.3** — returns `{ sha, htmlUrl }` on success
```javascript
const result = await commitArtefact(...);
expect(result).toMatchObject({
  sha: expect.stringMatching(/^[0-9a-f]{40}$/),
  htmlUrl: expect.stringContaining('github.com')
});
```
Expected: FAIL

**T1.4** — propagates 409 conflict without swallowing it
```javascript
const mockPut = jest.fn().mockRejectedValue(
  Object.assign(new Error('Conflict'), { status: 409 })
);
await expect(commitArtefact(...)).rejects.toMatchObject({ status: 409 });
```
Expected: FAIL

---

### T2 — Artefact path validation (server-side, pure string check)

Module under test: `src/artefact-path-validator.js` — `validateArtefactPath(path: string): boolean`

**T2.1** — valid path under `artefacts/` → accepted
```javascript
const { validateArtefactPath } = require('../src/artefact-path-validator');
expect(validateArtefactPath('artefacts/2026-05-02-ai-pipeline/discovery.md')).toBe(true);
expect(validateArtefactPath('artefacts/2026-05-02-feature/stories/story.md')).toBe(true);
```
Expected: FAIL

**T2.2** — `../etc/passwd` → rejected
```javascript
expect(validateArtefactPath('../etc/passwd')).toBe(false);
```
Expected: FAIL

**T2.3** — path outside `artefacts/` → rejected (even without traversal)
```javascript
expect(validateArtefactPath('src/evil.js')).toBe(false);
expect(validateArtefactPath('.github/workflows/pwned.yml')).toBe(false);
```
Expected: FAIL

**T2.4** — resolved traversal rejected (`artefacts/../etc/passwd` normalises outside artefacts/)
```javascript
// path.resolve or path.normalize reveals the traversal
expect(validateArtefactPath('artefacts/../etc/passwd')).toBe(false);
```
Expected: FAIL

**T2.5** — path is derived from skillName + sessionContext on server; client-supplied path is ignored
```javascript
// Route handler test: body includes arbitrary 'path' field
const res = await request(app)
  .post(`/api/skills/discovery/sessions/${sessionId}/commit`)
  .set('Cookie', validSessionCookie)
  .send({ path: '../etc/passwd' }); // client-supplied path — must be ignored
// Server must derive path from session context, not req.body.path
expect(res.status).not.toBe(200); // either 400 or 201 with server-derived path, never the client path
const committedPath = commitSpy.mock.calls[0]?.[0];
expect(committedPath).not.toContain('etc/passwd');
```
Expected: FAIL

---

### T3 — Route handler (POST /api/skills/:name/sessions/:id/commit)

**T3.1** — returns 201 with `{ sha, htmlUrl }` on success
```javascript
// Mock commitArtefact to return success fixture values
const res = await request(app)
  .post(`/api/skills/discovery/sessions/${sessionId}/commit`)
  .set('Cookie', validSessionCookie);
expect(res.status).toBe(201);
expect(res.body).toMatchObject({
  sha: expect.stringMatching(/^[0-9a-f]{40}$/),
  htmlUrl: expect.stringContaining('github.com')
});
```
Expected: FAIL

**T3.2** — returns 401 when unauthenticated
```javascript
const res = await request(app).post(`/api/skills/discovery/sessions/${sessionId}/commit`);
expect(res.status).toBe(401);
```
Expected: FAIL

**T3.3** — returns 403 when session belongs to a different user
```javascript
const res = await request(app)
  .post(`/api/skills/discovery/sessions/${userASessionId}/commit`)
  .set('Cookie', userBCookie);
expect(res.status).toBe(403);
```
Expected: FAIL

**T3.4** — returns 400 when session not yet complete (no final artefact event)
```javascript
// session is in-progress, no skill_complete event yet
const res = await request(app)
  .post(`/api/skills/discovery/sessions/${incompleteSessionId}/commit`)
  .set('Cookie', validSessionCookie);
expect(res.status).toBe(400);
expect(res.body.code).toBe('SESSION_NOT_COMPLETE');
```
Expected: FAIL

---

### T4 — Conflict handling (409 from Contents API)

**T4.1** — 409 response → message matches AC4 exact text
```javascript
// Mock commitArtefact to throw 409 error
const res = await request(app)
  .post(`/api/skills/discovery/sessions/${sessionId}/commit`)
  .set('Cookie', validSessionCookie);
expect(res.status).toBe(409);
expect(res.body.message).toBe('Artefact already exists — reload and review before committing');
```
Expected: FAIL — exact message required by AC4

**T4.2** — 409 response includes `existingArtefactUrl` for the "view existing" option
```javascript
// Contents API conflict response includes the existing file URL
expect(res.body.existingArtefactUrl).toContain('github.com');
```
Expected: FAIL

---

### T5 — Confirmation response (commit SHA + repo link)

**T5.1** — success response `sha` is a 40-character lowercase hex string
```javascript
const res = await request(app)
  .post(`/api/skills/discovery/sessions/${sessionId}/commit`)
  .set('Cookie', validSessionCookie);
expect(res.body.sha).toMatch(/^[0-9a-f]{40}$/);
```
Expected: FAIL

**T5.2** — success response `htmlUrl` is a GitHub repository link to the committed file
```javascript
expect(res.body.htmlUrl).toMatch(/^https:\/\/github\.com\/.+\/blob\/.+\/artefacts\//);
```
Expected: FAIL

---

### T6 — Audit logging

**T6.1** — write-back event logged with userId, skillName, artefactPath, sha, timestamp
```javascript
const logSpy = jest.spyOn(logger, 'info');
await request(app)
  .post(`/api/skills/discovery/sessions/${sessionId}/commit`)
  .set('Cookie', validSessionCookie);
const writebackLog = logSpy.mock.calls.find(c => JSON.stringify(c).includes('artefact_committed'));
expect(writebackLog).toBeDefined();
const logStr = JSON.stringify(writebackLog);
expect(logStr).toContain('skillName');
expect(logStr).toContain('artefactPath');
expect(logStr).toContain('sha');
```
Expected: FAIL

---

### NFR tests

**NFR1** — path validation is pure string computation (no filesystem I/O)
```javascript
const fsSpy = jest.spyOn(require('fs'), 'existsSync');
const { validateArtefactPath } = require('../src/artefact-path-validator');
validateArtefactPath('artefacts/slug/discovery.md');
validateArtefactPath('../etc/passwd');
expect(fsSpy).not.toHaveBeenCalled();
```
Expected: FAIL — validator must not call the filesystem; pure string/path.resolve check only

**NFR2** — commit does not use a service account token; uses only the session user's OAuth token
```javascript
await request(app)
  .post(`/api/skills/discovery/sessions/${sessionId}/commit`)
  .set('Cookie', validSessionCookie);
const commitCall = commitArtefactSpy.mock.calls[0];
const tokenArg = commitCall[3]; // 4th arg to commitArtefact is the token
// Token must be the user's OAuth token from session, not a service account env var
expect(tokenArg).toBe(expectedUserToken);
expect(tokenArg).not.toBe(process.env.GITHUB_TOKEN);
expect(tokenArg).not.toBe(process.env.SERVICE_ACCOUNT_TOKEN);
```
Expected: FAIL

---

## Integration tests

**INT1** — complete session commit end-to-end: session complete → POST /commit → verify Contents API called with user identity
- Uses success fixture; mock GitHub client returns `contents-api-commit-success.json`
- Asserts 201 response, `sha` matches fixture value, `htmlUrl` matches fixture value

**INT2** — conflict scenario: Contents API returns 409 → 409 propagated to client with correct message
- Uses `contents-api-conflict.json` fixture
- Asserts 409 status, exact message text

---

## Test data

| Fixture | Path | Used by |
|---------|------|---------|
| Contents API commit success | `tests/fixtures/github/contents-api-commit-success.json` | T1.1, T1.3, T3.1, INT1 (NEW — defined by this story) |
| Contents API conflict | `tests/fixtures/github/contents-api-conflict.json` | T1.4, T4.1, INT2 (NEW — defined by this story) |

---

## Out-of-scope tests

- PR creation after commit — explicitly deferred (story out-of-scope: "v1 commits directly to default branch")
- Content editing before commit — post-MVP
- Automated downstream pipeline trigger — out of scope

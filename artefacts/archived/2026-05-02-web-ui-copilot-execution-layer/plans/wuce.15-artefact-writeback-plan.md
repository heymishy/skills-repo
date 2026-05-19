# Implementation Plan: wuce.15 — Artefact writeback to repository

**Branch:** feat/wuce.15-artefact-writeback
**Worktree:** .worktrees/wuce.15-artefact-writeback
**Test file:** tests/artefact-writeback.test.js (18 tests)
**Test run:** node tests/artefact-writeback.test.js

---

## Dependencies

`src/web-ui/artefacts/artefact-adapter.js` — **exists on master** (wuce.3). This file contains the existing `commitArtefact()` implementation used for the attributed sign-off flow. Per ADR-012, do NOT create a parallel adapter. The wuce.15 SCM adapter (`src/scm-adapter.js`) wraps or extends the wuce.3 adapter.

Check the wuce.3 adapter signature before implementing:
```
cat src/web-ui/artefacts/artefact-adapter.js | head -40
```

`tests/fixtures/github/contents-api-commit-success.json` and `tests/fixtures/github/contents-api-conflict.json` — **auto-created by the test stub's `checkFixtures()`**.

wuce.13 provides the session model and route structure. If wuce.13 has merged, the route `POST /api/skills/:name/sessions/:id/commit` should be added to `src/web-ui/routes/skills.js`. If not merged, create `src/web-ui/routes/skill-commit.js` and mount separately.

---

## File touchpoints

| File | Action |
|------|--------|
| `src/scm-adapter.js` | CREATE — wraps wuce.3 `commitArtefact`; adds path validation, identity binding |
| `src/artefact-path-validator.js` | CREATE — `validateArtefactPath(path)` |
| `src/web-ui/routes/skills.js` | EXTEND — POST `/api/skills/:name/sessions/:id/commit` (or create skill-commit.js) |
| `src/web-ui/server.js` | EXTEND if new router file needed |
| `tests/fixtures/github/contents-api-commit-success.json` | EXISTS (auto-created by stub) |
| `tests/fixtures/github/contents-api-conflict.json` | EXISTS (auto-created by stub) |
| `tests/artefact-writeback.test.js` | EXISTS (TDD stub) |
| `package.json` | ALREADY EXTENDED |

---

## Security requirements (CRITICAL)

1. Server DERIVES artefact path from session context — client-supplied `path` in request body is IGNORED (AC3)
2. Paths outside `artefacts/` directory → 400 INVALID_PATH (AC3)
3. Path traversal blocked (normalise path, check it starts with `artefacts/`) — T2.2/T2.3/T2.4
4. 409 conflict response exact message: `"Artefact already exists — reload and review before committing"` (AC4)
5. OAuth token must NEVER appear in commit response body or server logs (NFR2)
6. `git author AND committer = authenticated user` (AC6) — identity from session, not from request body

---

## Task 1 — Create `src/artefact-path-validator.js`

```js
'use strict';
const path = require('path');

const ARTEFACTS_PREFIX = 'artefacts/';

/**
 * validateArtefactPath(inputPath) -> boolean
 *
 * Returns true only if inputPath resolves to a path inside artefacts/.
 * Blocks traversal: ../etc/passwd, artefacts/../etc/passwd, absolute paths.
 *
 * Uses path.normalize() to resolve all .. and . segments before checking prefix.
 */
function validateArtefactPath(inputPath) {
  if (typeof inputPath !== 'string' || !inputPath) { return false; }

  // Reject absolute paths immediately
  if (path.isAbsolute(inputPath)) { return false; }

  // Normalise to resolve traversal sequences
  // Replace backslashes to normalise on Windows too
  const normalised = path.posix.normalize(inputPath.replace(/\\/g, '/'));

  // Must start with artefacts/ after normalisation
  return normalised.startsWith(ARTEFACTS_PREFIX);
}

module.exports = { validateArtefactPath };
```

**TDD step:** Run `node tests/artefact-writeback.test.js` — T2.1/T2.2/T2.3/T2.4 must pass.

---

## Task 2 — Create `src/scm-adapter.js`

Wraps `src/web-ui/artefacts/artefact-adapter.js` (wuce.3) per ADR-012. Do NOT duplicate the Contents API call logic — delegate to it.

```js
'use strict';
const { validateArtefactPath } = require('./artefact-path-validator');

// ADR-012: reuse wuce.3 adapter, do not duplicate Contents API logic
let _wuce3Adapter;
function getWuce3Adapter() {
  if (!_wuce3Adapter) {
    _wuce3Adapter = require('./web-ui/artefacts/artefact-adapter');
  }
  return _wuce3Adapter;
}

/**
 * commitArtefact(options) -> Promise<{ sha: string, htmlUrl: string }>
 *
 * Commits an artefact to the repository via the GitHub Contents API.
 *
 * @param {object} options
 * @param {string} options.path           — destination path (server-derived, must pass validateArtefactPath)
 * @param {string} options.content        — artefact content (UTF-8 string, will be base64-encoded)
 * @param {string} options.accessToken    — GitHub OAuth token (NEVER logged)
 * @param {string} options.userId         — authenticated user (author AND committer)
 * @param {string} options.sessionId      — session ID (included in commit message)
 * @param {string} options.skillName      — skill name (included in commit message)
 * @param {string} [options.owner]        — repo owner (from env or session)
 * @param {string} [options.repo]         — repo name (from env or session)
 *
 * Throws with code 'INVALID_PATH' if path fails validation.
 * Throws with code 'ARTEFACT_CONFLICT' and existingArtefactUrl if 409.
 */
async function commitArtefact(options) {
  const { path, content, accessToken, userId, sessionId, skillName } = options;

  // Path guard — server-side (client path is ignored; path is always derived from session)
  if (!validateArtefactPath(path)) {
    const err = new Error('INVALID_PATH: path must be under artefacts/');
    err.code = 'INVALID_PATH';
    throw err;
  }

  const commitMessage = 'artefact: commit /' + skillName + ' session output [' + sessionId + ']';
  const adapter = getWuce3Adapter();

  try {
    // Delegate to wuce.3 adapter — passes identity as author + committer
    const result = await adapter.commitArtefact({
      path,
      content,
      accessToken,
      commitMessage,
      author: { name: userId, email: userId + '@users.noreply.github.com' },
      committer: { name: userId, email: userId + '@users.noreply.github.com' }
    });
    return { sha: result.commit.sha, htmlUrl: result.content.html_url };
  } catch (err) {
    if (err.status === 409 || (err.message && err.message.includes('409'))) {
      const conflictErr = new Error('Artefact already exists \u2014 reload and review before committing');
      conflictErr.code = 'ARTEFACT_CONFLICT';
      conflictErr.existingArtefactUrl = err.existingArtefactUrl || null;
      throw conflictErr;
    }
    throw err;
  }
}

module.exports = { commitArtefact };
```

**TDD step:** Run `node tests/artefact-writeback.test.js` — T1.1/T1.2/T1.3/T1.4 must pass with mocked wuce.3 adapter.

---

## Task 3 — Add commit route to `src/web-ui/routes/skills.js`

Add below the answer submission route (ADR-009: execute and commit are SEPARATE routes).

```js
// POST /api/skills/:name/sessions/:id/commit — commit completed artefact to repository
router.post('/:name/sessions/:id/commit', requireAuth, requireLicence, requireValidSkillName, async (req, res, next) => {
  try {
    const { name, id } = req.params;
    const userId       = req.session.userId;
    const accessToken  = req.session.accessToken; // NEVER in response

    // Verify session belongs to user
    const session = await sessionManager.getSession(id);
    if (!session) {
      return res.status(404).json({ error: 'SESSION_NOT_FOUND' });
    }
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'SESSION_FORBIDDEN' });
    }
    if (!session.complete) {
      return res.status(400).json({ error: 'SESSION_NOT_COMPLETE' });
    }

    // Server derives path — client-supplied path is ignored
    const artefactPath = deriveArtefactPath(session);

    const { commitArtefact } = require('../../scm-adapter');
    const result = await commitArtefact({
      path:       artefactPath,
      content:    session.artefactContent || '',
      accessToken,  // never returned in response
      userId,
      sessionId:  id,
      skillName:  name
    });

    // 201 with sha and htmlUrl only (no token)
    res.status(201).json({ sha: result.sha, htmlUrl: result.htmlUrl });
  } catch (err) {
    if (err.code === 'ARTEFACT_CONFLICT') {
      return res.status(409).json({
        error: 'ARTEFACT_CONFLICT',
        message: err.message,
        existingArtefactUrl: err.existingArtefactUrl || null
      });
    }
    if (err.code === 'INVALID_PATH') {
      return res.status(400).json({ error: 'INVALID_PATH', message: err.message });
    }
    next(err);
  }
});

// Derive server-side artefact path from session context (client path IGNORED per AC3)
function deriveArtefactPath(session) {
  const date  = new Date().toISOString().slice(0, 10);
  const slug  = (session.skillName || 'unknown').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const id    = (session.id || session.sessionId || 'unknown').slice(0, 8);
  return 'artefacts/' + date + '-' + slug + '/output-' + id + '.md';
}
```

**TDD step:** Run `node tests/artefact-writeback.test.js` — T3.1/T3.2/T3.3/T3.4/T4.1/T4.2/T5.1 must pass.

---

## Commit

```
feat(wuce.15): artefact writeback to repository with path validation

- src/artefact-path-validator.js: validateArtefactPath() blocks traversal
- src/scm-adapter.js: wraps wuce.3 adapter (ADR-012); adds identity binding and 409 handling
- POST /api/skills/:name/sessions/:id/commit: server-derives path; 409 exact message AC4

All 18 tests in tests/artefact-writeback.test.js pass.
Closes #278
```

# Implementation Plan: wuce.16 — Session persistence and cross-session resume

**Branch:** feat/wuce.16-session-persistence
**Worktree:** .worktrees/wuce.16-session-persistence
**Test file:** tests/session-persistence.test.js (22 tests)
**Test run:** node tests/session-persistence.test.js

---

## Dependencies

`src/modules/session-manager.js` — **exists on master** (wuce.10). This manages ephemeral (in-memory) sessions tied to COPILOT_HOME. wuce.16 adds a SEPARATE durable store layer. Do NOT modify session-manager.js to be the durable store — the separation is the core AC (16-M1 fix).

`crypto` module — built-in Node.js. Used for `crypto.randomBytes(16).toString('hex')` session IDs (NFR1 requirement: ≥128 bits entropy).

`tests/fixtures/sessions/durable-session-state.json` — **auto-created by the test stub's `checkFixtures()`**. This fixture defines the contract shape for all session fields.

---

## File touchpoints

| File | Action |
|------|--------|
| `src/session-store.js` | CREATE — durable session store (application-layer, independent of COPILOT_HOME) |
| `src/web-ui/routes/skills.js` | EXTEND — GET `/api/skills/:name/sessions/:id/resume` route (or create `src/web-ui/routes/skill-resume.js`) |
| `src/web-ui/routes/skills.js` | EXTEND — update GET `/api/skills` to include in-progress sessions |
| `tests/fixtures/sessions/durable-session-state.json` | EXISTS (auto-created by stub) |
| `tests/session-persistence.test.js` | EXISTS (TDD stub) |
| `package.json` | ALREADY EXTENDED |

---

## The 16-M1 fix (core AC — explain to future agent reading this plan)

wuce.10 creates COPILOT_HOME as an ephemeral working directory for the subprocess. When the subprocess exits, COPILOT_HOME is cleaned up. Any session data stored there is lost.

wuce.16 adds a **durable session store** at the APPLICATION layer — a separate data store (JSON file or in-memory Map keyed by sessionId) that survives COPILOT_HOME deletion. The key contract:

- `session-store.js` MUST NOT depend on COPILOT_HOME
- `session-manager.js` COPILOT_HOME cleanup MUST NOT delete durable store data
- A resumed session reads from `session-store.js`, NOT from COPILOT_HOME

T4.1 and T4.2 specifically verify this separation.

---

## Security requirements (CRITICAL)

1. Session IDs: `crypto.randomBytes(16).toString('hex')` — 32 hex chars = 128 bits entropy (NFR1)
2. OAuth token MUST NEVER be stored in session state (T1.3 assertion checks for oauthToken, access_token, gho_ prefix)
3. Cross-user access: GET with wrong userId → 403 SESSION_FORBIDDEN (T2.2)
4. Expired session data MUST be deleted from the durable store (T6.2)
5. userId must NOT appear in server logs — hash or omit (NFR2)
6. Immutable fields (userId, createdAt, skillName) cannot be changed via update (T3.3)

---

## Task 1 — Create `src/session-store.js`

This is the central implementation. All test groups (T1-T7, NFR, INT) depend on this module.

```js
'use strict';
const crypto = require('crypto');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory durable store. For production, replace with Redis or file-backed store.
// The store MUST NOT depend on COPILOT_HOME — that is the 16-M1 fix.
const _store = new Map();

// Immutable session fields that updateDurableSession cannot modify
const IMMUTABLE_FIELDS = ['sessionId', 'userId', 'createdAt', 'skillName'];

/**
 * createDurableSession(userId, skillName) -> Promise<DurableSession>
 *
 * Creates a new durable session and persists it to the store.
 * Session ID: crypto.randomBytes(16).toString('hex') — 128-bit entropy (NFR1).
 * expiresAt = createdAt + SESSION_TTL_MS.
 * Never stores oauthToken.
 */
async function createDurableSession(userId, skillName) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const now       = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const session = {
    sessionId,
    userId,
    skillName,
    createdAt:       now.toISOString(),
    updatedAt:       now.toISOString(),
    expiresAt:       expiresAt.toISOString(),
    questionIndex:   0,
    answers:         [],
    partialArtefact: null,
    complete:        false,
    copilotHomeDeleted: false
  };

  _store.set(sessionId, JSON.parse(JSON.stringify(session)));
  return JSON.parse(JSON.stringify(session));
}

/**
 * getDurableSession(sessionId, userId) -> Promise<DurableSession>
 *
 * Retrieves a durable session. Validates userId ownership.
 * Throws with code SESSION_NOT_FOUND if sessionId not in store.
 * Throws with code SESSION_FORBIDDEN if userId does not match.
 * Throws with code SESSION_EXPIRED if current time is past expiresAt.
 */
async function getDurableSession(sessionId, userId) {
  const session = _store.get(sessionId);

  if (!session) {
    const err = new Error('Session not found: ' + sessionId);
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }

  if (session.userId !== userId) {
    const err = new Error('Access forbidden: session belongs to a different user');
    err.code = 'SESSION_FORBIDDEN';
    throw err;
  }

  if (new Date() > new Date(session.expiresAt)) {
    // Delete expired data
    _store.delete(sessionId);
    const err = new Error('Session expired — please start a new session');
    err.code = 'SESSION_EXPIRED';
    throw err;
  }

  return JSON.parse(JSON.stringify(session));
}

/**
 * updateDurableSession(sessionId, updates) -> Promise<DurableSession>
 *
 * Updates mutable fields of a durable session.
 * IMMUTABLE_FIELDS (userId, createdAt, skillName, sessionId) cannot be changed.
 * Sets updatedAt to now.
 */
async function updateDurableSession(sessionId, updates) {
  const session = _store.get(sessionId);
  if (!session) {
    const err = new Error('Session not found: ' + sessionId);
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }

  // Apply updates, skipping immutable fields
  for (const [key, value] of Object.entries(updates)) {
    if (IMMUTABLE_FIELDS.includes(key)) { continue; }
    session[key] = value;
  }
  session.updatedAt = new Date().toISOString();

  _store.set(sessionId, session);
  return JSON.parse(JSON.stringify(session));
}

/**
 * listDurableSessions(userId) -> Promise<DurableSession[]>
 *
 * Returns all non-expired, non-complete sessions for a given user.
 * Used by GET /api/skills to show in-progress sessions.
 */
async function listDurableSessions(userId) {
  const now = new Date();
  const results = [];
  for (const session of _store.values()) {
    if (session.userId !== userId) { continue; }
    if (session.complete) { continue; }
    if (new Date(session.expiresAt) <= now) { continue; }
    results.push(JSON.parse(JSON.stringify(session)));
  }
  return results;
}

/**
 * deleteDurableSession(sessionId) -> Promise<void>
 *
 * Removes a session from the durable store.
 * Called on expiry cleanup and on explicit deletion.
 */
async function deleteDurableSession(sessionId) {
  _store.delete(sessionId);
}

// Expose the internal store for testing (allows resetting state between tests)
function _resetStore() { _store.clear(); }

module.exports = {
  createDurableSession,
  getDurableSession,
  updateDurableSession,
  listDurableSessions,
  deleteDurableSession,
  _resetStore
};
```

**TDD step:** Run `node tests/session-persistence.test.js` — T1.1/T1.2/T1.3/T1.4/T2.1/T2.2/T2.4/T3.1/T3.3/T4.1/NFR1 must pass.

Note: T2.3/T3.2/T6.1/T6.2/NFR3 require fake timers or time injection — these can be implemented as:
```js
// Add optional clock injection to session-store.js:
let _clock = () => new Date();
function _setClock(fn) { _clock = fn; }  // test only
// Replace all new Date() calls with _clock()
```

Export `_setClock` alongside `_resetStore` and use in tests that require time travel.

---

## Task 2 — Add resume route to `src/web-ui/routes/skills.js`

```js
// GET /api/skills/:name/sessions/:id/resume — restore in-progress session after COPILOT_HOME cleanup
router.get('/:name/sessions/:id/resume', requireAuth, requireValidSkillName, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId  = req.session.userId;

    const { getDurableSession } = require('../../session-store');

    try {
      const session = await getDurableSession(id, userId);
      res.json({
        sessionId:       session.sessionId,
        skillName:       session.skillName,
        questionIndex:   session.questionIndex,
        answers:         session.answers,
        partialArtefact: session.partialArtefact,
        complete:        session.complete
      });
    } catch (err) {
      if (err.code === 'SESSION_NOT_FOUND') {
        return res.status(404).json({ error: 'SESSION_NOT_FOUND' });
      }
      if (err.code === 'SESSION_FORBIDDEN') {
        return res.status(403).json({ error: 'SESSION_FORBIDDEN' });
      }
      if (err.code === 'SESSION_EXPIRED') {
        return res.status(410).json({ error: 'SESSION_EXPIRED', message: 'Session expired — please start a new session' });
      }
      throw err;
    }
  } catch (err) { next(err); }
});
```

---

## Task 3 — Update GET `/api/skills` to include in-progress sessions

In `src/web-ui/routes/skills.js`, update the GET `/` handler:

```js
router.get('/', requireAuth, requireLicence, async (req, res, next) => {
  try {
    const { listAvailableSkills } = require('../../adapters/skill-discovery');
    const { listDurableSessions } = require('../../session-store');

    const [skills, inProgress] = await Promise.all([
      listAvailableSkills(),
      listDurableSessions(req.session.userId)
    ]);

    const inProgressSummary = inProgress.map(s => ({
      sessionId:       s.sessionId,
      skillName:       s.skillName,
      startedAt:       s.createdAt,
      questionsAnswered: s.questionIndex
    }));

    res.json({ skills, inProgress: inProgressSummary });
  } catch (err) { next(err); }
});
```

**TDD step:** Run `node tests/session-persistence.test.js` — T5.1/T5.2/T7.1/T7.2 must pass.

---

## Commit

```
feat(wuce.16): durable session store for cross-session resume (16-M1 fix)

- src/session-store.js: app-layer durable store independent of COPILOT_HOME
  - createDurableSession / getDurableSession / updateDurableSession / listDurableSessions
  - crypto.randomBytes(16).toString('hex') for >=128-bit session IDs (NFR1)
  - Cross-user 403, SESSION_EXPIRED 410, immutable fields (T3.3)
- GET /api/skills/:name/sessions/:id/resume: restores session state after COPILOT_HOME cleanup
- GET /api/skills: now includes in-progress session summary

All 22 tests in tests/session-persistence.test.js pass.
Closes #279
```

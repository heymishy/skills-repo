# Test Plan: wuce.16 — Multi-turn session persistence (resume an in-progress skill session)

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.16-session-persistence.md
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Epic:** wuce-e4 (Phase 2 guided UI)
**Framework:** Jest + Node.js (backend only); real `fs` module (no mocking); fake timers for expiry tests
**Test data strategy:** Static fixtures committed to `tests/fixtures/`; in-test temp dirs for filesystem tests
**Written:** 2026-05-02
**Status:** Failing (TDD — no implementation exists)

---

## Summary

| Category | Count |
|----------|-------|
| Unit | 16 |
| Integration | 3 |
| NFR | 3 |
| **Total** | **22** |

---

## Storage backend contract fixture (16-M1 fix)

### `tests/fixtures/sessions/durable-session-state.json`

This fixture is the **storage backend contract**. It defines the exact shape of the durable session object that any storage backend (filesystem `sessions/` directory, Redis, or future durable store) must preserve. It is the formal contract between wuce.16 and the storage layer. If a backend cannot round-trip this shape without data loss, it is non-conformant.

The fixture is distinct from `COPILOT_HOME` state. `COPILOT_HOME` is ephemeral: it is the CLI subprocess working directory, cleaned up on subprocess exit (wuce.10 AC3). This fixture represents the **application-layer** durable state that survives `COPILOT_HOME` deletion.

```json
{
  "sessionId": "a3f7c2d1e4b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
  "userId": "test-stakeholder",
  "skillName": "discovery",
  "createdAt": "2026-05-02T09:00:00.000Z",
  "updatedAt": "2026-05-02T09:15:00.000Z",
  "expiresAt": "2026-05-03T09:00:00.000Z",
  "questionIndex": 2,
  "answers": [
    {
      "questionId": "q1",
      "text": "We want to automate our software delivery pipeline using AI agents."
    },
    {
      "questionId": "q2",
      "text": "The target users are non-technical stakeholders — product owners, BAs, business leads."
    }
  ],
  "partialArtefact": "## Discovery: AI-Driven Pipeline Automation\n\n**Problem statement:** The team spends significant manual effort coordinating delivery pipeline steps.",
  "complete": false,
  "copilotHomeDeleted": false
}
```

**Field notes:**
- `sessionId`: 48-char hex string = 192 bits, exceeds the ≥128-bit security requirement (NFR1)
- `userId`: raw user identifier used for binding checks only — never logged (NFR2 requires hash in logs)
- `copilotHomeDeleted`: set to `true` by `cleanupSession` (wuce.10) when the subprocess working directory is removed; durable state must survive this field being `true` — this is the 16-M1 fix test anchor
- No `oauthToken` field — security requirement; token is in the HTTP session cookie (wuce.1), not stored here

**⚠️ FLAG: If any storage backend cannot round-trip this fixture shape (all fields, correct types, UTF-8 content in `partialArtefact`), it is non-conformant and must not be used as the durable session store. The coding agent must write a round-trip test using this fixture for whichever backend is selected.**

---

## AC mapping

| AC | Summary | Test group |
|----|---------|-----------|
| AC1 | Close + return within 24h → session restored to exact step; partial preview reflects prior answers | T2, T7 |
| AC2 | Resume + complete → committed artefact contains full content from both sessions | T3, INT2 |
| AC3 | Access another user's session → 403 | T2 |
| AC4 | Inactive > 24h → "Session expired" message + data deleted | T6 |
| AC5 | Multiple in-progress sessions → list on /skills with skill name, start date, question count | T5 |

---

## Test groups

### T1 — createDurableSession

Module under test: `src/session-store.js` — `createDurableSession(userId, skillName): Promise<DurableSession>`

**T1.1** — returns a session object with all required fields from the contract fixture shape
```javascript
const { createDurableSession } = require('../src/session-store');
const session = await createDurableSession('test-stakeholder', 'discovery');
expect(session).toMatchObject({
  sessionId: expect.any(String),
  userId: 'test-stakeholder',
  skillName: 'discovery',
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  expiresAt: expect.any(String),
  questionIndex: 0,
  answers: [],
  partialArtefact: null,
  complete: false,
  copilotHomeDeleted: false
});
```
Expected: FAIL

**T1.2** — sessionId is ≥128 bits (≥32 hex chars; or UUID v4 format)
```javascript
const session = await createDurableSession('user', 'discovery');
// Either a 32+ char hex string OR a UUID v4 (36-char with hyphens = 122-bit entropy)
const isHex32 = /^[0-9a-f]{32,}$/.test(session.sessionId);
const isUuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session.sessionId);
expect(isHex32 || isUuidV4).toBe(true);
```
Expected: FAIL

**T1.3** — session state does NOT contain an `oauthToken` field (security: token must not be stored)
```javascript
const session = await createDurableSession('user', 'discovery');
const sessionStr = JSON.stringify(session);
expect(sessionStr).not.toContain('oauthToken');
expect(sessionStr).not.toContain('access_token');
expect(sessionStr).not.toContain('gho_');
```
Expected: FAIL

**T1.4** — `expiresAt` is exactly 24 hours after `createdAt`
```javascript
const session = await createDurableSession('user', 'discovery');
const created = new Date(session.createdAt).getTime();
const expires = new Date(session.expiresAt).getTime();
expect(expires - created).toBe(24 * 60 * 60 * 1000);
```
Expected: FAIL

---

### T2 — getDurableSession

Module under test: `src/session-store.js` — `getDurableSession(sessionId, userId): Promise<DurableSession>`

**T2.1** — returns full session state for the correct userId
```javascript
const created = await createDurableSession('test-stakeholder', 'discovery');
const retrieved = await getDurableSession(created.sessionId, 'test-stakeholder');
expect(retrieved.sessionId).toBe(created.sessionId);
expect(retrieved.userId).toBe('test-stakeholder');
expect(retrieved.skillName).toBe('discovery');
```
Expected: FAIL

**T2.2** — throws `SESSION_FORBIDDEN` when userId does not match the stored session owner
```javascript
const created = await createDurableSession('user-a', 'discovery');
await expect(getDurableSession(created.sessionId, 'user-b'))
  .rejects.toMatchObject({ code: 'SESSION_FORBIDDEN' });
```
Expected: FAIL

**T2.3** — throws `SESSION_EXPIRED` when current time is past `expiresAt`
```javascript
jest.useFakeTimers();
const created = await createDurableSession('user', 'discovery');
jest.setSystemTime(new Date(created.expiresAt).getTime() + 1);
await expect(getDurableSession(created.sessionId, 'user'))
  .rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
jest.useRealTimers();
```
Expected: FAIL

**T2.4** — throws `SESSION_NOT_FOUND` for an unknown session ID
```javascript
await expect(getDurableSession('nonexistent-session-id', 'user'))
  .rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
```
Expected: FAIL

---

### T3 — updateDurableSession

Module under test: `src/session-store.js` — `updateDurableSession(sessionId, patch): Promise<DurableSession>`

**T3.1** — updates `questionIndex`, `answers`, and `partialArtefact` fields
```javascript
const created = await createDurableSession('user', 'discovery');
const updated = await updateDurableSession(created.sessionId, {
  questionIndex: 1,
  answers: [{ questionId: 'q1', text: 'Automate the pipeline.' }],
  partialArtefact: '## Discovery draft'
});
expect(updated.questionIndex).toBe(1);
expect(updated.answers).toHaveLength(1);
expect(updated.partialArtefact).toBe('## Discovery draft');
```
Expected: FAIL

**T3.2** — `updatedAt` is set to the time of the update (not `createdAt`)
```javascript
jest.useFakeTimers();
const created = await createDurableSession('user', 'discovery');
jest.setSystemTime(new Date(created.createdAt).getTime() + 5000); // 5s later
const updated = await updateDurableSession(created.sessionId, { questionIndex: 1 });
expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(new Date(updated.createdAt).getTime());
jest.useRealTimers();
```
Expected: FAIL

**T3.3** — immutable fields (`userId`, `createdAt`, `skillName`) cannot be changed via update
```javascript
const created = await createDurableSession('user', 'discovery');
const updated = await updateDurableSession(created.sessionId, {
  userId: 'hacked-user',
  createdAt: '2020-01-01T00:00:00.000Z',
  skillName: 'evil'
});
expect(updated.userId).toBe('user');
expect(updated.createdAt).toBe(created.createdAt);
expect(updated.skillName).toBe('discovery');
```
Expected: FAIL

---

### T4 — COPILOT_HOME / durable store separation (16-M1 fix)

These tests are the core of the user-flagged separation requirement: a session must be resumable after `COPILOT_HOME` has been cleaned up. The resume path reads from the durable store, not from the CLI filesystem state.

**T4.1** — session can be retrieved via getDurableSession after COPILOT_HOME directory has been deleted
```javascript
// Create a session and set copilotHomeDeleted: true (simulates wuce.10 cleanup)
const created = await createDurableSession('user', 'discovery');
await updateDurableSession(created.sessionId, {
  questionIndex: 1,
  answers: [{ questionId: 'q1', text: 'Some answer' }],
  copilotHomeDeleted: true
});
// getDurableSession must succeed — no dependency on COPILOT_HOME path
const resumed = await getDurableSession(created.sessionId, 'user');
expect(resumed.answers).toHaveLength(1);
expect(resumed.questionIndex).toBe(1);
expect(resumed.copilotHomeDeleted).toBe(true);
```
Expected: FAIL — this is the 16-M1 regression anchor: if the session store reads from COPILOT_HOME, this test fails

**T4.2** — resume route handler reads session state from durable store, not from COPILOT_HOME path
```javascript
// Mock: COPILOT_HOME for the session does not exist (fs.existsSync returns false for the path)
const fsSpy = jest.spyOn(require('fs'), 'existsSync').mockReturnValue(false);

const res = await request(app)
  .get(`/api/skills/discovery/sessions/${sessionId}/resume`)
  .set('Cookie', validSessionCookie);
// Resume must succeed despite COPILOT_HOME being absent
expect(res.status).toBe(200);
expect(res.body.questionIndex).toBe(2); // state from durable store, not filesystem
```
Expected: FAIL

**T4.3** — COPILOT_HOME deletion (setting copilotHomeDeleted: true) does not corrupt the stored answers array
```javascript
const created = await createDurableSession('user', 'discovery');
await updateDurableSession(created.sessionId, {
  answers: [
    { questionId: 'q1', text: 'Answer one' },
    { questionId: 'q2', text: 'Answer two' }
  ],
  copilotHomeDeleted: false
});
// Simulate wuce.10 marking COPILOT_HOME as deleted
await updateDurableSession(created.sessionId, { copilotHomeDeleted: true });
const resumed = await getDurableSession(created.sessionId, 'user');
// Answers must be intact — not zeroed or nulled by the copilotHomeDeleted flag
expect(resumed.answers).toHaveLength(2);
expect(resumed.answers[0].text).toBe('Answer one');
```
Expected: FAIL

---

### T5 — listDurableSessions

Module under test: `src/session-store.js` — `listDurableSessions(userId): Promise<DurableSession[]>`

**T5.1** — returns only sessions owned by the given userId (not all users' sessions)
```javascript
await createDurableSession('user-a', 'discovery');
await createDurableSession('user-b', 'definition');
const sessions = await listDurableSessions('user-a');
expect(sessions.every(s => s.userId === 'user-a')).toBe(true);
```
Expected: FAIL

**T5.2** — excludes expired sessions from the list
```javascript
jest.useFakeTimers();
const session = await createDurableSession('user', 'discovery');
jest.setSystemTime(new Date(session.expiresAt).getTime() + 1);
const sessions = await listDurableSessions('user');
expect(sessions.find(s => s.sessionId === session.sessionId)).toBeUndefined();
jest.useRealTimers();
```
Expected: FAIL

**T5.3** — each session entry includes `skillName`, `createdAt`, and `questionIndex`
```javascript
await createDurableSession('user', 'discovery');
const sessions = await listDurableSessions('user');
expect(sessions[0]).toMatchObject({
  skillName: expect.any(String),
  createdAt: expect.any(String),
  questionIndex: expect.any(Number)
});
```
Expected: FAIL

**T5.4** — returns empty array when user has no unexpired sessions
```javascript
const sessions = await listDurableSessions('user-with-no-sessions');
expect(sessions).toEqual([]);
```
Expected: FAIL

---

### T6 — Expiry and cleanup

Module under test: `src/session-store.js` — `purgeExpiredSessions(): Promise<number>`

**T6.1** — purgeExpiredSessions deletes sessions past their `expiresAt`
```javascript
jest.useFakeTimers();
const s1 = await createDurableSession('user', 'discovery');
jest.setSystemTime(new Date(s1.expiresAt).getTime() + 1);
const deletedCount = await purgeExpiredSessions();
expect(deletedCount).toBeGreaterThan(0);
await expect(getDurableSession(s1.sessionId, 'user'))
  .rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
jest.useRealTimers();
```
Expected: FAIL

**T6.2** — purgeExpiredSessions retains sessions not yet expired
```javascript
jest.useFakeTimers();
const active = await createDurableSession('user', 'discovery');
// Do NOT advance time past expiresAt
await purgeExpiredSessions();
const retained = await getDurableSession(active.sessionId, 'user');
expect(retained.sessionId).toBe(active.sessionId);
jest.useRealTimers();
```
Expected: FAIL

**T6.3** — resume attempt on expired session returns SESSION_EXPIRED error code and triggers deletion
```javascript
jest.useFakeTimers();
const s = await createDurableSession('user', 'discovery');
jest.setSystemTime(new Date(s.expiresAt).getTime() + 1);
await expect(getDurableSession(s.sessionId, 'user'))
  .rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
// After SESSION_EXPIRED throw, the session should be deleted
jest.useRealTimers();
await expect(getDurableSession(s.sessionId, 'user'))
  .rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' }); // gone, not just expired
```
Expected: FAIL

---

### NFR tests

**NFR1** — sessionId is cryptographically random and ≥128 bits; short IDs must fail the test
```javascript
const sessions = await Promise.all(
  Array.from({ length: 10 }, () => createDurableSession('user', 'discovery'))
);
sessions.forEach(s => {
  // 32 hex = 128 bits minimum; UUID v4 = 122 bits (marginal but accepted)
  const hexLength = s.sessionId.replace(/-/g, '').length;
  expect(hexLength).toBeGreaterThanOrEqual(32);
  // No sequential IDs (not a counter)
  expect(s.sessionId).not.toMatch(/^[0-9]+$/);
});
// All sessionIds must be unique
const ids = sessions.map(s => s.sessionId);
expect(new Set(ids).size).toBe(10);
```
Expected: FAIL

**NFR2** — no OAuth token present in any stored session object (static shape check against contract fixture)
```javascript
// Load the contract fixture and verify it has no token fields
const fixture = JSON.parse(fs.readFileSync('tests/fixtures/sessions/durable-session-state.json', 'utf8'));
const fixtureStr = JSON.stringify(fixture);
expect(fixtureStr).not.toContain('oauthToken');
expect(fixtureStr).not.toContain('access_token');
expect(fixtureStr).not.toContain('gho_');
// Also verify a freshly created session has the same shape
const session = await createDurableSession('user', 'discovery');
const sessionStr = JSON.stringify(session);
expect(sessionStr).not.toContain('oauthToken');
```
Expected: FAIL

**NFR3** — session create + restore completes within 100ms (excluding CLI execution time)
```javascript
const start = Date.now();
const session = await createDurableSession('user', 'discovery');
await updateDurableSession(session.sessionId, { questionIndex: 1 });
await getDurableSession(session.sessionId, 'user');
expect(Date.now() - start).toBeLessThan(100);
```
Expected: FAIL

---

## Integration tests

**INT1** — resume flow: create → update with 2 answers → set copilotHomeDeleted: true → getDurableSession → verify answers intact
```javascript
// Full 16-M1 scenario:
// 1. Create session
// 2. Simulate user answering 2 questions (update answers + questionIndex)
// 3. Simulate wuce.10 cleanup (set copilotHomeDeleted: true)
// 4. Resume: call getDurableSession
// 5. Assert: all 2 answers present, questionIndex = 2, partialArtefact intact
```
Expected: FAIL — this is the primary integration anchor for the COPILOT_HOME separation

**INT2** — resume + complete → answers from both sessions preserved in final state
```javascript
// 1. Create session, submit 2 answers (simulate first session)
// 2. Simulate browser close (no explicit close action needed — session persists)
// 3. Retrieve session (simulate re-open) — verify answers [q1, q2]
// 4. Submit 1 more answer (simulate resumed session)
// 5. Mark session complete
// 6. Retrieve final state — verify answers [q1, q2, q3] — no loss or duplication
```
Expected: FAIL

**INT3** — session expiry end-to-end: create → advance time > 24h → GET /api/skills/:name/sessions/:id/resume → 410 Gone with "Session expired" message
```javascript
// Confirm the HTTP route returns 410 Gone (not 404 Not Found) for expired sessions
// AC4 requires "Session expired — please start a new session" message
const res = await request(app)
  .get(`/api/skills/discovery/sessions/${expiredSessionId}/resume`)
  .set('Cookie', validSessionCookie);
expect(res.status).toBe(410);
expect(res.body.message).toBe('Session expired — please start a new session');
```
Expected: FAIL

---

## Test data

| Fixture | Path | Used by |
|---------|------|---------|
| Durable session state (storage contract) | `tests/fixtures/sessions/durable-session-state.json` | NFR2, T1.1 shape comparison, INT1 (NEW — defined by this story) |

**⚠️ Storage backend contract note:** The `durable-session-state.json` fixture is not a test helper — it is the formal interface contract between wuce.16 and the storage layer. If the v1 implementation is replaced with Redis or another backend post-pilot, any new backend must pass a round-trip test using this fixture before being considered conformant. The coding agent must not write a storage backend that cannot preserve all fields in this fixture.

---

## Out-of-scope tests

- Cross-device session sync — explicitly deferred (story out-of-scope: "v1 sessions tied to HTTP session cookie")
- Collaborative sessions — explicitly deferred
- ACP multi-turn state — deferred to post-GA; v1 uses filesystem `sessions/` or in-memory store

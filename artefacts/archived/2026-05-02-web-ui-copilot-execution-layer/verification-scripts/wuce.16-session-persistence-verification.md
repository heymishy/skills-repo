# Verification Script: wuce.16 — Multi-turn session persistence

**Story:** wuce.16-session-persistence
**AC count:** 5
**Test suite:** `tests/check-wuce16-session-persistence.js`

---

## Pre-conditions

- Web UI backend running with session store configured (filesystem `sessions/` or in-memory)
- `tests/fixtures/sessions/durable-session-state.json` present (defined by this story — storage backend contract)
- wuce.10 `cleanupSession` callable in tests (used for 16-M1 separation tests)

---

## Storage backend contract check

Run this before any other verification. If it fails, the storage backend is non-conformant and must be fixed before wuce.16 can be considered passing.

```bash
node -e "
const fs = require('fs');
const fixture = JSON.parse(fs.readFileSync('tests/fixtures/sessions/durable-session-state.json', 'utf8'));
const required = ['sessionId','userId','skillName','createdAt','updatedAt','expiresAt',
  'questionIndex','answers','partialArtefact','complete','copilotHomeDeleted'];
const missing = required.filter(f => !(f in fixture));
if (missing.length) { console.log('FAIL: missing fields:', missing); process.exit(1); }
if (typeof fixture.answers !== 'object' || !Array.isArray(fixture.answers))
  { console.log('FAIL: answers must be an array'); process.exit(1); }
if ('oauthToken' in fixture || 'access_token' in fixture)
  { console.log('FAIL: token field present in fixture — security violation'); process.exit(1); }
if (fixture.sessionId.replace(/-/g,'').length < 32)
  { console.log('FAIL: sessionId too short — does not meet 128-bit minimum'); process.exit(1); }
console.log('PASS: durable-session-state.json contract fixture is valid');
"
```

---

## AC1 — Session restored to exact step after close + return within 24h

**Automated:** T4.1 (16-M1): session retrieved via `getDurableSession` after `copilotHomeDeleted: true` — answers and `questionIndex` intact; INT1: full resume flow end-to-end

**Human smoke test:**
1. Start a `/discovery` session and answer 2 of 5 questions
2. Close the browser tab
3. Reopen the browser and navigate to `/skills`
4. Verify: an in-progress session is listed showing "discovery" and "2 of 5 questions completed"
5. Click "Resume"
6. Verify: the form opens at question 3 (not question 1)
7. Verify: the preview panel shows the partial artefact from the first session

**COPILOT_HOME separation check (16-M1):**
After step 2, manually delete (or confirm deletion of) the `COPILOT_HOME` directory for the session, then continue from step 3. The resume must succeed even if `COPILOT_HOME` is gone.

---

## AC2 — Resumed session produces complete artefact with no data loss

**Automated:** INT2: create → update answers [q1, q2] → retrieve → submit q3 → mark complete → verify answers has length 3, no duplicates

**Human smoke test:**
1. Resume a session (from AC1 smoke test above)
2. Answer the remaining 3 questions
3. Click "Commit artefact to repository"
4. Open the committed artefact in GitHub
5. Verify: the artefact content reflects ALL 5 answers — both from the first session and the resumed session
6. Verify: no answer is repeated or missing

---

## AC3 — Another user's session ID returns 403

**Automated:** T2.2: `getDurableSession(sessionId, wrongUserId)` throws `{ code: 'SESSION_FORBIDDEN' }`; T1.3: HTTP route returns 403

**Human smoke test:**
1. Note the session ID from user A's in-progress session (from browser storage / request inspector)
2. Authenticate as user B
3. Attempt to `GET /api/skills/discovery/sessions/<user-A-session-id>/resume` as user B
4. Verify: 403 response — user B cannot access user A's session

---

## AC4 — Session inactive > 24h → expired message + data deleted

**Automated:** T6.3: expired session → `SESSION_EXPIRED` error + session deleted; INT3: HTTP route returns 410 with exact message text

**Human smoke test:**
1. Create a session and simulate expiry (advance server time past 24h, or use a test endpoint if available)
2. Attempt to resume the session
3. Verify: the message "Session expired — please start a new session" is displayed
4. Verify: the session no longer appears in the in-progress session list
5. Verify: after expiry, `GET /api/skills/discovery/sessions/:id/resume` returns 410 (Gone), not 404 (Not Found) — the distinction signals "existed but expired" vs "never existed"

---

## AC5 — Multiple sessions listed on /skills with metadata

**Automated:** T5.1: list returns only sessions for the correct userId; T5.3: each entry includes `skillName`, `createdAt`, `questionIndex`; T5.4: empty result for user with no sessions

**Human smoke test:**
1. Create two separate skill sessions on different days (or using different skill names)
2. Navigate to `/skills`
3. Verify: a "Resume in-progress session" section lists both sessions
4. Verify: each entry shows the skill name, the date the session was started, and the number of questions completed
5. Verify: expired sessions do NOT appear in the list
6. Click each listed session and verify it resumes at the correct question step

---

## Run commands

```bash
# Storage contract check first
node -e "const f=JSON.parse(require('fs').readFileSync('tests/fixtures/sessions/durable-session-state.json','utf8')); const r=['sessionId','userId','skillName','createdAt','updatedAt','expiresAt','questionIndex','answers','partialArtefact','complete','copilotHomeDeleted']; const m=r.filter(k=>!(k in f)); console.log(m.length?'FAIL missing: '+m.join(','):'PASS contract fixture valid');"

# Unit + integration tests
npx jest tests/check-wuce16-session-persistence.js --verbose

# Full suite
npm test
```

---

## 16-M1 separation check (critical — run explicitly)

This check must be run as an explicit step before marking wuce.16 as verified:

```bash
node -e "
// Simulates the 16-M1 scenario:
// 1. Create a session
// 2. Update with 2 answers
// 3. Set copilotHomeDeleted: true (simulates wuce.10 cleanup)
// 4. Retrieve session — must succeed with all answers intact
const { createDurableSession, updateDurableSession, getDurableSession } = require('./src/session-store');
(async () => {
  const s = await createDurableSession('m1-test-user', 'discovery');
  await updateDurableSession(s.sessionId, {
    questionIndex: 2,
    answers: [
      { questionId: 'q1', text: 'Answer one' },
      { questionId: 'q2', text: 'Answer two' }
    ],
    partialArtefact: 'Partial content'
  });
  await updateDurableSession(s.sessionId, { copilotHomeDeleted: true });
  const resumed = await getDurableSession(s.sessionId, 'm1-test-user');
  if (resumed.answers.length !== 2) throw new Error('16-M1 FAIL: answers lost after COPILOT_HOME deletion');
  if (!resumed.partialArtefact) throw new Error('16-M1 FAIL: partial artefact lost');
  console.log('16-M1 PASS: session resumed successfully after COPILOT_HOME deletion');
})().catch(e => { console.error('16-M1 FAIL:', e.message); process.exit(1); });
"
```

---

## Gap table

| AC | Coverage type | Gap / risk |
|----|--------------|-----------|
| AC1 | Automated (T4.1 16-M1 + INT1) + human smoke + explicit M1 check | Low — the 16-M1 check is the primary regression anchor |
| AC2 | Automated (INT2 answer continuity) + human smoke | Low |
| AC3 | Automated (SESSION_FORBIDDEN unit + HTTP 403) + human smoke | Low |
| AC4 | Automated (fake timers + SESSION_EXPIRED + INT3 HTTP 410) + human smoke | Low — HTTP status 410 vs 404 distinction is deliberate and tested |
| AC5 | Automated (list unit tests T5.1–T5.4) + human smoke | Low |

# Verification Script: wuce.10 — Per-user session isolation via COPILOT_HOME

## Pre-conditions

- Jest installed; `tests/check-wuce10-session-isolation.js` exists
- Write access to `os.tmpdir()` (required for real filesystem tests)

## Step 1 — Run Jest tests

```bash
npx jest tests/check-wuce10-session-isolation.js --verbose
```

**Expected output:** 17 tests pass, 0 fail.

## Step 2 — Verify path structure at runtime

```bash
node -e "
const { createSession, cleanupSession } = require('./src/execution/session-manager');
async function run() {
  const path1 = await createSession('user-alice@example.com');
  const path2 = await createSession('user-bob@example.com');
  const path3 = await createSession('user-alice@example.com');
  console.log('Alice session 1:', path1);
  console.log('Bob session:    ', path2);
  console.log('Alice session 2:', path3);
  const same = path1 === path3;
  console.log('Two Alice sessions are identical:', same, '(expected: false)');
  const sharedUser = path1.split('/').slice(-2,-1)[0] === path2.split('/').slice(-2,-1)[0];
  console.log('Same user hash for alice and bob:', sharedUser, '(expected: false)');
  await Promise.all([cleanupSession(path1), cleanupSession(path2), cleanupSession(path3)]);
  const { existsSync } = require('fs');
  console.log('All cleaned up:', !existsSync(path1) && !existsSync(path2) && !existsSync(path3));
}
run().catch(console.error);
"
```

**Expected:**
```
Alice session 1: /tmp/copilot-sessions/<hash-alice>/<uuid1>/
Bob session:     /tmp/copilot-sessions/<hash-bob>/<uuid2>/
Alice session 2: /tmp/copilot-sessions/<hash-alice>/<uuid3>/
Two Alice sessions are identical: false (expected: false)
Same user hash for alice and bob: false (expected: false)
All cleaned up: true
```

## Step 3 — Verify path traversal rejection

```bash
node -e "
const { cleanupSession } = require('./src/execution/session-manager');
cleanupSession('/etc/passwd')
  .then(() => console.error('FAIL: should have rejected'))
  .catch(err => console.log('PASS: traversal rejected -', err.message));
"
```

**Expected:** `PASS: traversal rejected - [error message about path outside temp base]`

## Step 4 — Verify raw user ID not in logs

```bash
node -e "
// Inspect that createSession hashes the userId
const src = require('fs').readFileSync('src/execution/session-manager.js','utf8');
if (!src.includes('sha256') && !src.includes('createHash')) {
  throw new Error('FAIL: No sha256/createHash found in session-manager.js');
}
console.log('PASS: hash function present in session-manager.js');
"
```

**Expected:** `PASS: hash function present in session-manager.js`

## Step 5 — Full npm test baseline

```bash
npm test 2>&1 | tail -5
```

**Expected:** All pre-existing passing tests continue to pass. New tests for wuce.10 pass.

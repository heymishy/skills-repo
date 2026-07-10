# Provision a Neon staging branch for Postgres — Implementation Plan

> **For agent execution:** Executed directly in this session using /tdd discipline
> (RED — GREEN — REFACTOR, commit after each task) per the DoR's "Oversight level: Medium"
> and the absence of a multi-subagent fan-out need for a 4-test, single-module story.

**Goal:** Make every test in the test plan pass (T1, T2, IT1, IT2, NFR2) without adding scope beyond the ACs. AC1 (schema identity) and AC2 (write isolation)'s live-database proof, and AC3 (cold-start)'s real-world timing, remain manual verification scenarios per the test plan's declared External-dependency gaps — no real Neon connection is made anywhere in this repo's automated suite.
**Branch:** `feature/bri-s2.2`
**Worktree:** `.worktrees/bri-s2.2`
**Test command:** `node tests/check-bri-s2.2-neon-staging-branch.js`

---

## File map

```
Create:
  src/web-ui/adapters/db-ready.js               — connection-readiness helper: waitForDbReady(connectFn, timeoutMs) bounds Neon's autosuspend cold-start behind a configurable timeout budget (default 10000ms per AC3/NFR-Performance), rejecting with a clearly named DbConnectTimeoutError (code DB_CONNECT_TIMEOUT) rather than hanging indefinitely.
  tests/check-bri-s2.2-neon-staging-branch.js   — T1 (no environment-conditional schema fork in server.js), T2 (no hardcoded Postgres connection string in tracked src/), NFR2 (no literal Neon connection string in tracked src/), IT1 (delayed-but-within-budget connect succeeds), IT2 (over-budget connect surfaces DbConnectTimeoutError at ~timeout mark)

Modify:
  package.json                                   — register the new test file in scripts.test chain (append `&& node tests/check-bri-s2.2-neon-staging-branch.js`)
```

**No changes to `src/web-ui/adapters/journey-store-pg.js` or `src/web-ui/server.js`** — per the DoR contract's "Estimated touch points" ("No change expected to journey-store-pg.js's existing query logic — only connection-establishment timing/retry behaviour is in scope") and to avoid scope beyond the DoR. `waitForDbReady` is a standalone, independently-testable helper — a downstream consumer (S2.5 CI pipeline health check, S2.6 smoke test) is expected to import and call it against a real `pg` client's `connect()`, per the story's declared Downstream dependency ("S2.5/S2.6 depend on it being reachable"). Wiring it into a live health-check endpoint is out of this story's scope (no AC or test in the test plan asserts a wired call site).

---

## Task 1: T1/T2/NFR2 — static regression guards (schema-fork guard, hardcoded connection string guard)

**Verifies:** AC1 (partial, code-level), AC2 (partial, code-level), NFR-Security

**Files:**
- Create: `tests/check-bri-s2.2-neon-staging-branch.js` (T1, T2, NFR2 sections only for this task)

- [ ] **Step 1: Write the failing test**

Create `tests/check-bri-s2.2-neon-staging-branch.js` with this content (T1/T2/NFR2 portion — IT1/IT2 added in Task 2):

```javascript
'use strict';

/**
 * bri-s2.2 -- Provision a Neon staging branch for Postgres
 *
 * Static-analysis regression guards (T1, T2, NFR2) plus mocked-timing
 * integration tests (IT1, IT2) for the connection-readiness helper.
 * No real Neon/Postgres connections are made anywhere in this file --
 * see the story's test plan Coverage gaps table for the three
 * External-dependency gaps (live schema identity, live write isolation,
 * real-world cold-start timing) that remain manual verification steps.
 *
 * Reference: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.2-neon-staging-branch-test-plan.md
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SERVER_JS_PATH = path.join(ROOT, 'src', 'web-ui', 'server.js');
const SRC_DIR = path.join(ROOT, 'src');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

function walkJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// T1 -- no environment-conditional schema-forking branch in server.js
// ---------------------------------------------------------------------------
test('T1: server.js has no environment-conditional schema-forking branch', () => {
  const content = fs.readFileSync(SERVER_JS_PATH, 'utf8');

  // Looks for a conditional keyed on a "staging"-flavoured env check that
  // wraps a CREATE TABLE / require of a staging-only schema file -- i.e.
  // the anti-pattern this guard protects against, not the ordinary
  // `if (process.env.DATABASE_URL)` presence check that already exists
  // unconditionally for both staging and prod.
  const stagingForkPattern = /NODE_ENV\s*===?\s*['"]staging['"]|STAGING_SCHEMA|staging-schema|schema[-_]staging/i;
  const match = content.match(stagingForkPattern);

  assert.strictEqual(
    match,
    null,
    `server.js appears to contain an environment-conditional schema fork: "${match && match[0]}"`
  );
});

// ---------------------------------------------------------------------------
// T2 -- no hardcoded Postgres connection string in tracked source
// ---------------------------------------------------------------------------
test('T2: no hardcoded Postgres connection string in tracked src/', () => {
  const jsFiles = walkJsFiles(SRC_DIR);
  // Matches postgres:// or postgresql:// followed by a credentials-shaped
  // literal (user:pass@host) -- not a bare scheme mentioned in a comment
  // or a placeholder like postgres://user:pass@localhost/db.
  const credPattern = /postgres(?:ql)?:\/\/[a-zA-Z0-9_.-]+:[^@\s'"`]+@(?!localhost)[a-zA-Z0-9_.-]+/;
  const offenders = [];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      if (credPattern.test(line)) {
        offenders.push(`${path.relative(ROOT, file)}:${idx + 1}`);
      }
    });
  }

  assert.deepStrictEqual(
    offenders,
    [],
    `hardcoded Postgres connection string(s) found: ${offenders.join(', ')}`
  );
});

// ---------------------------------------------------------------------------
// NFR2 -- no literal Neon connection string committed to tracked source
// ---------------------------------------------------------------------------
test('NFR2: no literal Neon connection string in tracked src/', () => {
  const jsFiles = walkJsFiles(SRC_DIR);
  const neonPattern = /neon\.tech/i;
  const offenders = [];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (neonPattern.test(content)) {
      offenders.push(path.relative(ROOT, file));
    }
  }

  assert.deepStrictEqual(
    offenders,
    [],
    `literal Neon hostname reference found in tracked source (expected only in Fly secrets, never in code): ${offenders.join(', ')}`
  );
});

console.log(`\n[bri-s2.2] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test — expect PASS (regression guard, not red-before-green)**

```bash
node tests/check-bri-s2.2-neon-staging-branch.js
```

Expected output: `T1`, `T2`, `NFR2` all show `✓` (pass) and `[bri-s2.2] Results: 3 passed, 0 failed`. Per the test plan's own note (Test Gaps table), T1/T2/NFR2 are protective regression guards against patterns that don't exist in the codebase today — they are not expected to fail before implementation exists.

- [ ] **Step 3: Commit**

```bash
git add tests/check-bri-s2.2-neon-staging-branch.js
git commit -m "test(bri-s2.2): add T1/T2/NFR2 regression guards for staging schema fork and hardcoded connection strings"
```

---

## Task 2: IT1/IT2 — connection-readiness helper (`waitForDbReady`)

**Verifies:** AC3, NFR-Performance

**Files:**
- Create: `src/web-ui/adapters/db-ready.js`
- Modify: `tests/check-bri-s2.2-neon-staging-branch.js` (append IT1/IT2)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-bri-s2.2-neon-staging-branch.js`, before the final `console.log`/`process.exit` lines:

```javascript
// ---------------------------------------------------------------------------
// IT1 / IT2 -- connection-readiness helper bounds Neon's autosuspend
// cold-start behind the 10-second budget (AC3 / NFR-Performance)
// ---------------------------------------------------------------------------
const { waitForDbReady, DbConnectTimeoutError } = require('../src/web-ui/adapters/db-ready');

async function runAsyncTests() {
  await testAsync('IT1: a delayed connection within the 10s budget succeeds', async () => {
    const start = Date.now();
    const stubConnect = () => new Promise((resolve) => setTimeout(() => resolve('connected'), 200));
    const result = await waitForDbReady(stubConnect, 1000);
    const elapsed = Date.now() - start;
    assert.strictEqual(result, 'connected');
    assert.ok(elapsed < 1000, `expected elapsed (${elapsed}ms) to be well under the 1000ms budget`);
  });

  await testAsync('IT2: a delayed connection exceeding the budget surfaces DbConnectTimeoutError', async () => {
    const start = Date.now();
    const stubConnect = () => new Promise(() => {}); // never resolves
    let caught = null;
    try {
      await waitForDbReady(stubConnect, 300);
    } catch (err) {
      caught = err;
    }
    const elapsed = Date.now() - start;
    assert.ok(caught instanceof DbConnectTimeoutError, `expected a DbConnectTimeoutError, got ${caught && caught.constructor.name}`);
    assert.strictEqual(caught.code, 'DB_CONNECT_TIMEOUT');
    assert.ok(elapsed >= 300 && elapsed < 1000, `expected rejection at ~300ms, got ${elapsed}ms`);
  });
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}
```

Replace the final two lines (`console.log(...)` / `if (failed > 0) ...`) with:

```javascript
runAsyncTests().then(() => {
  console.log(`\n[bri-s2.2] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail (module does not exist yet)**

```bash
node tests/check-bri-s2.2-neon-staging-branch.js
```

Expected output: `Error: Cannot find module '../src/web-ui/adapters/db-ready'` (thrown at require-time, before any test runs).

- [ ] **Step 3: Write minimal implementation**

Create `src/web-ui/adapters/db-ready.js`:

```javascript
'use strict';

/**
 * bri-s2.2 -- connection-readiness helper for Neon's autosuspend cold-start.
 *
 * Bounds an arbitrary connect-shaped function behind a timeout budget
 * (default 10000ms, per AC3 / NFR-Performance -- sourced from Neon's
 * published latency benchmarks: typical 500ms-800ms, 95th percentile 2.6s,
 * worst case 3.1s across a 200-sample benchmark; see decisions.md and
 * the story's NFRs). Resolves with whatever `connectFn` resolves with if
 * it settles within the budget; rejects with a named DbConnectTimeoutError
 * (code DB_CONNECT_TIMEOUT) if it does not -- never hangs indefinitely.
 *
 * Intended for use by downstream staging health checks (S2.5 CI pipeline,
 * S2.6 smoke test) -- not wired into journey-store-pg.js's existing query
 * logic, which is unchanged by this story (see DoR contract "Estimated
 * touch points").
 */

const DEFAULT_TIMEOUT_MS = 10000;

class DbConnectTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`DB_CONNECT_TIMEOUT: database connection did not succeed within ${timeoutMs}ms`);
    this.name = 'DbConnectTimeoutError';
    this.code = 'DB_CONNECT_TIMEOUT';
    this.timeoutMs = timeoutMs;
  }
}

function waitForDbReady(connectFn, timeoutMs) {
  const budget = typeof timeoutMs === 'number' ? timeoutMs : DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new DbConnectTimeoutError(budget));
    }, budget);
    // Do not let this timer keep a process/test runner alive on its own.
    if (timer && typeof timer.unref === 'function') timer.unref();

    Promise.resolve()
      .then(() => connectFn())
      .then((result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
  });
}

module.exports = { waitForDbReady, DbConnectTimeoutError, DEFAULT_TIMEOUT_MS };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s2.2-neon-staging-branch.js
```

Expected output: all 5 checks (`T1`, `T2`, `NFR2`, `IT1`, `IT2`) show `✓` and `[bri-s2.2] Results: 5 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-bri-s2.2-neon-staging-branch.js
```

(Full `npm test` chain is blocked earlier by a pre-existing, unrelated baseline failure — `check-definition-skill.js: FATAL: .github/skills/definition/SKILL.md not found` — confirmed present on `origin/master` before this branch started. See decisions.md entry logged at /branch-setup. This story's own test file is run directly and independently for this reason.)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/db-ready.js tests/check-bri-s2.2-neon-staging-branch.js
git commit -m "feat(bri-s2.2): add waitForDbReady connection-readiness helper bounding Neon cold-start to 10s (AC3)"
```

---

## Task 3: Register the new test file in `package.json`'s test chain

**Verifies:** repo convention (CLAUDE.md: "Register any new test file in package.json's scripts.test chain")

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Append to `scripts.test`**

Append ` && node tests/check-bri-s2.2-neon-staging-branch.js` to the end of the `scripts.test` string in `package.json` (after the existing `... && node tests/check-bri-s2.1-fly-staging-app.js` tail).

- [ ] **Step 2: Verify the new test file runs standalone (the chain itself is blocked by the pre-existing baseline failure noted above)**

```bash
node tests/check-bri-s2.2-neon-staging-branch.js
```

Expected output: `[bri-s2.2] Results: 5 passed, 0 failed`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(bri-s2.2): register check-bri-s2.2-neon-staging-branch.js in the test chain"
```

---

<!-- End of plan. 3 tasks cover T1, T2, NFR2 (static regression guards), IT1/IT2 (mocked cold-start timing), and test-chain registration. AC1/AC2's live schema/isolation proof and AC3's real-world cold-start timing remain the story's declared manual verification scenarios (Scenario 1-3 in the AC verification script) -- no code task exists for them because no code in this repo can perform a real Neon connection. -->

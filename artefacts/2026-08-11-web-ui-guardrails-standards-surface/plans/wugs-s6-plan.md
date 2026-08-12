# Build the branch + PR creation adapter for guardrail/standard edits — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — a new injectable adapter (`guardrailPrAdapter`) that creates a branch, commits a file (new or SHA-based update), and opens a PR against a tenant's connected repo, never writing the default branch directly; wire it for real in `server.js`, closing the gap `wugs-s5` flagged (the form's POST route currently has no real write adapter to call).
**Branch:** `feature/wugs-s6`
**Worktree:** `.worktrees/wugs-s6`
**Test command:** `node tests/check-wugs-s6-branch-pr-creation-adapter.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  src/web-ui/adapters/guardrail-pr-adapter.js         — the new injectable adapter (D37)
  tests/check-wugs-s6-branch-pr-creation-adapter.js   — AC1-AC6 + 2 NFRs

Modify:
  src/web-ui/server.js  — wire setGuardrailPrAdapter(realGuardrailPrAdapter), and wire the
                           POST /products/:id/guardrails/form route to handlePostGuardrailsForm
                           (wugs-s5), passing a real writeAdapter that calls guardrailPrAdapter
```

**Design note on the real GitHub API call sequence (read before starting):** The test plan describes
"4 sequential calls" for the new-file case (default-branch SHA, create ref, create file, create PR) and
a separate "get file" call for the existing-file case (AC2). To safely construct the file-write payload
without trusting the caller to declare "new vs existing" upfront — an operator could type a path in Add
mode that happens to already exist, and silently overwriting it without a SHA would be wrong — the real
adapter always performs one GET-file-existence check (on the default branch) before the PUT, for BOTH
cases: a 404 means new (PUT with no `sha`), a 200 means existing (PUT with the returned `sha`). This means
the real adapter makes 5 network calls total in both the AC1 and AC2 cases (branch-sha, create-ref, get-file,
put-file, create-pr), not exactly "4" for the new-file case — a deliberate, more-correct refinement over
the test plan's literal framing, made because probing for existence is strictly safer than trusting an
unverified caller flag. AC1's own wording ("a new branch is created... the file is committed... the default
branch is never written to directly") is fully satisfied by this design; only the test plan's illustrative
call-count description differs slightly, and this is noted explicitly here so a task-level spec-compliance
reviewer doesn't flag it as a deviation without this context.

**Design note on the POST route wiring (closing wugs-s5's GAP-FLAG):** `handlePostGuardrailsForm`
(`wugs-s5`, already merged) calls `writeAdapter(target, content)` where `target = {productId, path}` — it
does NOT look up `repo_owner`/`repo_name` or the session token, because at the time it was built there was
no real adapter needing them. Rather than modifying `handlePostGuardrailsForm` itself (already reviewed and
merged), the POST route wiring in `server.js` constructs a per-request closure that looks up the product's
`repo_owner`/`repo_name` via `pool` and reads `req.session.accessToken`, then calls the real
`guardrailPrAdapter` with the full parameter set. This keeps `wugs-s5`'s code untouched and contains the
new lookup logic entirely within the wiring task (Task 7).

---

## Task 1: Adapter skeleton + injectable pattern (AC5)

**Files:**
- Create: `src/web-ui/adapters/guardrail-pr-adapter.js`
- Create: `tests/check-wugs-s6-branch-pr-creation-adapter.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s6-branch-pr-creation-adapter.js`:

```javascript
'use strict';
// check-wugs-s6-branch-pr-creation-adapter.js — wugs-s6
//
// Unit/integration tests for the branch + PR creation adapter: creates a
// branch, commits a file (new or SHA-based update), opens a PR — never
// writes the default branch directly.

var assert = require('assert');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

async function checkAsync(name, fn) {
  try { await fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

var guardrailPrAdapter = require('../src/web-ui/adapters/guardrail-pr-adapter');

(async () => {

// ── AC5: unwired adapter throws explicit error ───────────────────────────
await checkAsync('AC5: guardrailPrAdapter_unwired_throwsExplicitError', async () => {
  var original = guardrailPrAdapter.getGuardrailPrAdapter();
  guardrailPrAdapter.setGuardrailPrAdapter(function() {
    throw new Error('Adapter not wired: guardrailPrAdapter. Call setGuardrailPrAdapter() with a real implementation before use.');
  });
  try {
    await assert.rejects(
      guardrailPrAdapter.guardrailPrAdapter('token', 'owner', 'repo', 'path.md', 'content', {}),
      function(err) {
        return err.message === 'Adapter not wired: guardrailPrAdapter. Call setGuardrailPrAdapter() with a real implementation before use.';
      },
      'expected the exact D37 "not wired" error message'
    );
  } finally {
    guardrailPrAdapter.setGuardrailPrAdapter(original);
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `FAIL: AC5: ... — Cannot find module '../src/web-ui/adapters/guardrail-pr-adapter'`

- [ ] **Step 3: Write minimal implementation**

Create `src/web-ui/adapters/guardrail-pr-adapter.js`:

```javascript
'use strict';

// guardrail-pr-adapter.js — wugs-s6, ADR-012
// Creates a branch, commits a guardrail/standard file (new or SHA-based
// update), and opens a PR against the tenant's connected repo. Never
// writes the default branch directly. A genuinely new branch-then-PR flow
// — does NOT reuse repo-bootstrap.js's realBootstrapRepo or its
// direct-to-master pattern (Architecture Constraints).

class GuardrailPrError extends Error {
  constructor(step, message) {
    super(`${step}: ${message}`);
    this.name = 'GuardrailPrError';
    this.step = step;
  }
}

class GuardrailPrConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GuardrailPrConflictError';
  }
}

let _guardrailPrAdapter = function() {
  throw new Error('Adapter not wired: guardrailPrAdapter. Call setGuardrailPrAdapter() with a real implementation before use.');
};

/**
 * @param {string} token   - operator's own session OAuth token
 * @param {string} owner
 * @param {string} repo
 * @param {string} targetPath
 * @param {string} content
 * @param {object} options - { tenantId, productId, defaultBranch, posthog }
 */
async function guardrailPrAdapter(token, owner, repo, targetPath, content, options) {
  return _guardrailPrAdapter(token, owner, repo, targetPath, content, options);
}

function setGuardrailPrAdapter(impl) {
  _guardrailPrAdapter = impl;
}

function getGuardrailPrAdapter() {
  return _guardrailPrAdapter;
}

module.exports = {
  guardrailPrAdapter,
  setGuardrailPrAdapter,
  getGuardrailPrAdapter,
  GuardrailPrError,
  GuardrailPrConflictError
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected: 33 pre-existing failures (documented baseline in `artefacts/2026-08-11-web-ui-guardrails-standards-surface/decisions.md`), 0 new. This is a long run (~8-9 min) — a faster targeted check is sufficient:

```bash
for f in $(grep -rl "adapters/guardrail-pr-adapter\|routes/products" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/guardrail-pr-adapter.js tests/check-wugs-s6-branch-pr-creation-adapter.js
git commit -m "feat(wugs-s6): adapter skeleton with D37 injectable pattern (AC5)"
```

---

## Task 2: New file — branch, commit, PR; never writes default branch directly (AC1)

**Files:**
- Modify: `src/web-ui/adapters/guardrail-pr-adapter.js`, `tests/check-wugs-s6-branch-pr-creation-adapter.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log('\n' + passed ...` line:

```javascript
// ── Shared test helper: mock a sequence of fetch responses ──────────────
function mockFetchSequence(responses) {
  var calls = [];
  var i = 0;
  return {
    fn: async function(url, opts) {
      calls.push({ url: url, method: (opts && opts.method) || 'GET', body: opts && opts.body });
      if (i >= responses.length) { throw new Error('unexpected extra fetch call: ' + url); }
      var r = responses[i]; i++;
      return {
        ok: r.status >= 200 && r.status < 300,
        status: r.status,
        statusText: r.statusText || '',
        json: async function() { return r.body; }
      };
    },
    calls: calls
  };
}

// ── AC1: new file — branch, commit, PR; never writes default directly ───
await checkAsync('AC1: guardrailPrAdapter_newFile_createsBranchCommitsAndOpensPr', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'base-sha-123' } } },              // 1. get default branch SHA
    { status: 201, body: { ref: 'refs/heads/guardrail-edit-x' } },           // 2. create ref
    { status: 404, body: { message: 'Not Found' } },                        // 3. get file (doesn't exist -- new file)
    { status: 201, body: { content: { sha: 'new-file-sha' } } },             // 4. put file
    { status: 201, body: { number: 42, html_url: 'https://github.com/acme/widgets/pull/42' } } // 5. create PR
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var original = require('../src/web-ui/adapters/guardrail-pr-adapter').getGuardrailPrAdapter();
    var { setGuardrailPrAdapter, guardrailPrAdapter, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var { realGuardrailPrAdapter } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      await guardrailPrAdapter('tok', 'acme', 'widgets', 'standards/new-discipline.md', 'New content', { tenantId: 't1', productId: 'p1' });
      assert.strictEqual(mock.calls.length, 5, 'expected exactly 5 sequential API calls');
      assert.ok(mock.calls[1].method === 'POST' && /\/git\/refs$/.test(mock.calls[1].url), 'expected step 2 to create a new ref');
      assert.ok(mock.calls[3].method === 'PUT' && /\/contents\//.test(mock.calls[3].url), 'expected step 4 to PUT the file content');
      var putBody = JSON.parse(mock.calls[3].body);
      assert.ok(!putBody.sha, 'expected no sha in the PUT payload for a genuinely new file');
      assert.ok(putBody.branch !== 'main' && putBody.branch !== undefined, 'expected the file committed to the NEW branch, not directly to main/default');
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `FAIL: AC1: ... — realGuardrailPrAdapter is not a function` (or similar — not implemented yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/guardrail-pr-adapter.js`, add after the `getGuardrailPrAdapter` function, before `module.exports`:

```javascript
async function _ghRequest(token, apiBase, method, endpoint, body) {
  const res = await fetch(`${apiBase}${endpoint}`, {
    method: method || 'GET',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'skills-pipeline-web-ui',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

/**
 * Real implementation. See the plan's Design note for why this always
 * performs a GET-file-existence check for both new and existing paths,
 * rather than trusting a caller-supplied "is this new" flag.
 */
async function realGuardrailPrAdapter(token, owner, repo, targetPath, content, options) {
  const opts = options || {};
  const defaultBranch = opts.defaultBranch || 'main';
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  // Step 1: get default branch SHA
  const baseRefRes = await _ghRequest(token, apiBase, 'GET', `/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`);
  if (!baseRefRes.ok) {
    throw new GuardrailPrError('branch creation failed', `Could not read default branch ref (${baseRefRes.status})`);
  }
  const baseRefData = await baseRefRes.json();
  const baseSha = baseRefData.object.sha;

  // Step 2: create new branch ref
  const branchName = `guardrail-edit-${Date.now()}`;
  const createRefRes = await _ghRequest(token, apiBase, 'POST', `/repos/${owner}/${repo}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });
  if (!createRefRes.ok) {
    throw new GuardrailPrError('branch creation failed', `Could not create branch (${createRefRes.status})`);
  }

  // Step 3: check whether the target file already exists on the default branch
  const getFileRes = await _ghRequest(token, apiBase, 'GET', `/repos/${owner}/${repo}/contents/${targetPath}?ref=${defaultBranch}`);
  let existingSha = null;
  if (getFileRes.status === 200) {
    const fileData = await getFileRes.json();
    existingSha = fileData.sha;
  } else if (getFileRes.status !== 404) {
    throw new GuardrailPrError('file commit failed', `Could not check existing file (${getFileRes.status})`);
  }

  // Step 4: create or update the file on the new branch
  const putBody = {
    message: `Update ${targetPath}`,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: branchName
  };
  if (existingSha) { putBody.sha = existingSha; }
  const putRes = await _ghRequest(token, apiBase, 'PUT', `/repos/${owner}/${repo}/contents/${targetPath}`, putBody);
  if (!putRes.ok) {
    if (putRes.status === 409 || putRes.status === 422) {
      throw new GuardrailPrConflictError('This file changed since you started editing — please refresh and try again.');
    }
    throw new GuardrailPrError('file commit failed', `Could not commit file (${putRes.status})`);
  }

  // Step 5: open the PR
  const prRes = await _ghRequest(token, apiBase, 'POST', `/repos/${owner}/${repo}/pulls`, {
    title: `Update ${targetPath}`,
    head: branchName,
    base: defaultBranch,
    body: 'Automated guardrail/standard edit via skills platform.'
  });
  if (!prRes.ok) {
    throw new GuardrailPrError('PR creation failed', `Could not open PR (${prRes.status})`);
  }
  const prData = await prRes.json();

  return { prNumber: prData.number, prUrl: prData.html_url };
}
```

Add `realGuardrailPrAdapter` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

Faster targeted check:

```bash
for f in $(grep -rl "adapters/guardrail-pr-adapter\|routes/products" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/guardrail-pr-adapter.js tests/check-wugs-s6-branch-pr-creation-adapter.js
git commit -m "feat(wugs-s6): new-file branch+commit+PR sequence, never writes default directly (AC1)"
```

---

## Task 3: Existing file — SHA-based update, conflict surfaced (AC2)

**Files:**
- Modify: `tests/check-wugs-s6-branch-pr-creation-adapter.js` (implementation already handles this from Task 2 — this task locks it in)

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC2: existing file — SHA-based update ────────────────────────────────
await checkAsync('AC2: guardrailPrAdapter_existingFile_usesShaForUpdate', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'base-sha-123' } } },
    { status: 201, body: { ref: 'refs/heads/guardrail-edit-x' } },
    { status: 200, body: { sha: 'existing-file-sha-999' } },  // file exists
    { status: 200, body: { content: { sha: 'updated-file-sha' } } },
    { status: 201, body: { number: 43, html_url: 'https://github.com/acme/widgets/pull/43' } }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      await guardrailPrAdapter('tok', 'acme', 'widgets', 'standards/saas-gui.md', 'Updated content', { tenantId: 't1', productId: 'p1' });
      var putBody = JSON.parse(mock.calls[3].body);
      assert.strictEqual(putBody.sha, 'existing-file-sha-999', 'expected the fetched SHA to be included in the update payload');
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

// ── AC2 (conflict edge case): stale SHA surfaces a clear conflict error ──
await checkAsync('AC2: guardrailPrAdapter_staleSha_throwsConflictError', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'base-sha-123' } } },
    { status: 201, body: { ref: 'refs/heads/guardrail-edit-x' } },
    { status: 200, body: { sha: 'stale-sha' } },
    { status: 409, body: { message: 'sha does not match' } }  // conflict on update
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter, GuardrailPrConflictError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      await assert.rejects(
        guardrailPrAdapter('tok', 'acme', 'widgets', 'standards/saas-gui.md', 'Updated content', { tenantId: 't1', productId: 'p1' }),
        function(err) { return err instanceof GuardrailPrConflictError; },
        'expected a GuardrailPrConflictError, not a generic error or silent failure'
      );
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 2)**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `4 passed, 0 failed` — if either fails, that's your RED signal; fix `realGuardrailPrAdapter`'s SHA/conflict handling in `guardrail-pr-adapter.js` until both pass.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected — Task 2's code already branches on `getFileRes.status` and throws `GuardrailPrConflictError` on 409/422. If Step 2 failed, fix that branching.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "adapters/guardrail-pr-adapter\|routes/products" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s6-branch-pr-creation-adapter.js
git commit -m "test(wugs-s6): lock in SHA-based update and stale-SHA conflict error (AC2)"
```

---

## Task 4: Success returns PR number and URL (AC3)

**Files:**
- Modify: `tests/check-wugs-s6-branch-pr-creation-adapter.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC3: success returns PR number and URL ───────────────────────────────
await checkAsync('AC3: guardrailPrAdapter_success_returnsPrNumberAndUrl', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'base-sha-123' } } },
    { status: 201, body: { ref: 'refs/heads/guardrail-edit-x' } },
    { status: 404, body: {} },
    { status: 201, body: { content: { sha: 'x' } } },
    { status: 201, body: { number: 42, html_url: 'https://github.com/acme/widgets/pull/42' } }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      var result = await guardrailPrAdapter('tok', 'acme', 'widgets', 'standards/new.md', 'content', { tenantId: 't1', productId: 'p1' });
      assert.strictEqual(result.prNumber, 42, 'expected the real mocked PR number, not a placeholder');
      assert.strictEqual(result.prUrl, 'https://github.com/acme/widgets/pull/42', 'expected the real mocked PR URL, not a constructed/guessed one');
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 2)**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `5 passed, 0 failed` — if it fails, that's the RED signal; fix the return statement in `realGuardrailPrAdapter`.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected — Task 2's `return { prNumber: prData.number, prUrl: prData.html_url };` already does this.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "adapters/guardrail-pr-adapter\|routes/products" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s6-branch-pr-creation-adapter.js
git commit -m "test(wugs-s6): lock in PR number/URL return shape (AC3)"
```

---

## Task 5: Step failure surfaces which step failed (AC4)

**Files:**
- Modify: `tests/check-wugs-s6-branch-pr-creation-adapter.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log` — 4 separate cases, one per step:

```javascript
// ── AC4: step failure surfaces which step failed (4 distinct steps) ─────
await checkAsync('AC4: guardrailPrAdapter_branchShaFails_surfacesBranchCreationStep', async () => {
  var mock = mockFetchSequence([{ status: 500, statusText: 'Internal Server Error', body: {} }]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      await assert.rejects(
        guardrailPrAdapter('tok', 'acme', 'widgets', 'x.md', 'c', {}),
        function(err) { return err instanceof GuardrailPrError && err.step === 'branch creation failed'; },
        'expected a GuardrailPrError naming "branch creation failed"'
      );
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

await checkAsync('AC4: guardrailPrAdapter_createRefFails_surfacesBranchCreationStep', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'x' } } },
    { status: 422, body: { message: 'Reference already exists' } }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      await assert.rejects(
        guardrailPrAdapter('tok', 'acme', 'widgets', 'x.md', 'c', {}),
        function(err) { return err instanceof GuardrailPrError && err.step === 'branch creation failed'; },
        'expected a GuardrailPrError naming "branch creation failed" for the create-ref step'
      );
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

await checkAsync('AC4: guardrailPrAdapter_fileCommitFails_surfacesFileCommitStep', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'x' } } },
    { status: 201, body: {} },
    { status: 404, body: {} },
    { status: 500, statusText: 'Internal Server Error', body: {} }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      await assert.rejects(
        guardrailPrAdapter('tok', 'acme', 'widgets', 'x.md', 'c', {}),
        function(err) { return err instanceof GuardrailPrError && err.step === 'file commit failed'; },
        'expected a GuardrailPrError naming "file commit failed"'
      );
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

await checkAsync('AC4: guardrailPrAdapter_prCreationFails_surfacesPrCreationStep', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'x' } } },
    { status: 201, body: {} },
    { status: 404, body: {} },
    { status: 201, body: { content: { sha: 'y' } } },
    { status: 500, statusText: 'Internal Server Error', body: {} }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      await assert.rejects(
        guardrailPrAdapter('tok', 'acme', 'widgets', 'x.md', 'c', {}),
        function(err) { return err instanceof GuardrailPrError && err.step === 'PR creation failed'; },
        'expected a GuardrailPrError naming "PR creation failed"'
      );
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});
```

- [ ] **Step 2: Run tests — expected to already pass (behaviour built in Task 2)**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `9 passed, 0 failed` — if any fail, that's the RED signal; fix the corresponding `throw new GuardrailPrError(...)` call in `guardrail-pr-adapter.js`.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected — Task 2's code already throws a distinctly-named `GuardrailPrError` at each of the 4 failure points.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `9 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "adapters/guardrail-pr-adapter\|routes/products" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s6-branch-pr-creation-adapter.js
git commit -m "test(wugs-s6): lock in per-step failure error naming (AC4)"
```

---

## Task 6: NFRs — token never logged, PR creation audit-logged

**Files:**
- Modify: `src/web-ui/adapters/guardrail-pr-adapter.js`, `tests/check-wugs-s6-branch-pr-creation-adapter.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
// ── NFR: token is never logged ───────────────────────────────────────────
await checkAsync('NFR-SEC: guardrailPrAdapter_run_neverLogsToken', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'x' } } },
    { status: 201, body: {} },
    { status: 404, body: {} },
    { status: 201, body: { content: { sha: 'y' } } },
    { status: 201, body: { number: 1, html_url: 'https://github.com/acme/widgets/pull/1' } }
  ]);
  var originalFetch = global.fetch;
  var originalLog = console.log;
  var originalError = console.error;
  var logged = [];
  console.log = function() { logged.push(Array.prototype.slice.call(arguments).join(' ')); };
  console.error = function() { logged.push(Array.prototype.slice.call(arguments).join(' ')); };
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    var SECRET_TOKEN = 'ghp_supersecrettoken12345';
    try {
      await guardrailPrAdapter(SECRET_TOKEN, 'acme', 'widgets', 'x.md', 'c', { tenantId: 't1', productId: 'p1' });
      var allLogged = logged.join('\n');
      assert.ok(allLogged.indexOf(SECRET_TOKEN) === -1, 'expected the raw token to never appear in any log output');
    } finally { setGuardrailPrAdapter(original); }
  } finally {
    global.fetch = originalFetch;
    console.log = originalLog;
    console.error = originalError;
  }
});

// ── NFR: PR creation is audit-logged via PostHog ─────────────────────────
await checkAsync('NFR-AUDIT: guardrailPrAdapter_success_capturesPostHogEvent', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'x' } } },
    { status: 201, body: {} },
    { status: 404, body: {} },
    { status: 201, body: { content: { sha: 'y' } } },
    { status: 201, body: { number: 7, html_url: 'https://github.com/acme/widgets/pull/7' } }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  var captured = null;
  var mockPosthog = { capture: function(distinctId, event, properties) { captured = { distinctId: distinctId, event: event, properties: properties }; } };
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, guardrailPrAdapter, realGuardrailPrAdapter } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      await guardrailPrAdapter('tok', 'acme', 'widgets', 'x.md', 'c', { tenantId: 't1', productId: 'p1', posthog: mockPosthog });
      assert.ok(captured, 'expected a PostHog capture call to have fired');
      assert.strictEqual(captured.event, 'guardrail_pr_opened');
      assert.strictEqual(captured.properties.tenant_id, 't1');
      assert.strictEqual(captured.properties.product_id, 'p1');
      assert.strictEqual(captured.properties.repo, 'acme/widgets');
      assert.strictEqual(captured.properties.pr_number, 7, 'expected the real PR number in the audit event, not a placeholder');
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});
```

- [ ] **Step 2: Run tests — must fail on the audit-log test**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: the token-not-logged test already passes (Task 2's code never calls `console.log`/`console.error` at all). The audit-log test fails: `FAIL: NFR-AUDIT: ... — expected a PostHog capture call to have fired`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/guardrail-pr-adapter.js`, add the PostHog require near the top (after the class definitions, before `_guardrailPrAdapter`):

```javascript
const _posthog = require('../modules/posthog-server');
```

In `realGuardrailPrAdapter`, right before the final `return { prNumber: ..., prUrl: ... };` line, add:

```javascript
  const _ph = opts.posthog || _posthog;
  _ph.capture(opts.tenantId, 'guardrail_pr_opened', {
    tenant_id: opts.tenantId,
    product_id: opts.productId,
    repo: `${owner}/${repo}`,
    pr_number: prData.number
  });

```

(Insert this between the `const prData = await prRes.json();` line and the `return` statement.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `11 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "adapters/guardrail-pr-adapter\|routes/products" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/guardrail-pr-adapter.js tests/check-wugs-s6-branch-pr-creation-adapter.js
git commit -m "feat(wugs-s6): audit-log PR creation via PostHog, confirm token never logged (NFRs)"
```

---

## Task 7: Wire the real adapter and the POST route in server.js (AC6)

**Files:**
- Modify: `src/web-ui/server.js`, `tests/check-wugs-s6-branch-pr-creation-adapter.js`

**This task closes the GAP-FLAG logged in `decisions.md` during `wugs-s5`'s final review**: `handlePostGuardrailsForm` (already merged) has never had a real `writeAdapter` wired to it, and the POST route has never been registered at all.

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC6: real wiring — two different submissions produce two different, correct PRs ──
await checkAsync('AC6: realWiring_twoDifferentContentChanges_produceTwoDifferentCorrectPrs', async () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('setGuardrailPrAdapter') !== -1, 'expected server.js to wire setGuardrailPrAdapter');
  assert.ok(serverSrc.indexOf('guardrails\\/form$/) && req.method === \'POST\'') !== -1 || serverSrc.indexOf("guardrails/form$/) && req.method === 'POST'") !== -1, 'expected server.js to route POST /products/:id/guardrails/form');

  // Differentiating-outcome check (D37 requirement 4): call the real handler
  // twice with two distinct submissions through a mocked GitHub API, and
  // confirm two distinct, individually-correct PRs are opened -- not the
  // same content/target twice, not merely "a setter was called".
  var products = require('../src/web-ui/routes/products');
  var prPayloads = [];
  var callIndex = 0;
  var originalFetch = global.fetch;
  global.fetch = async function(url, opts) {
    var method = (opts && opts.method) || 'GET';
    if (method === 'GET' && /\/git\/ref\/heads\//.test(url)) { return { ok: true, status: 200, json: async function() { return { object: { sha: 'base-sha' } }; } }; }
    if (method === 'POST' && /\/git\/refs$/.test(url)) { return { ok: true, status: 201, json: async function() { return {}; } }; }
    if (method === 'GET' && /\/contents\//.test(url)) { return { ok: false, status: 404, json: async function() { return {}; } }; }
    if (method === 'PUT' && /\/contents\//.test(url)) {
      var body = JSON.parse(opts.body);
      return { ok: true, status: 201, json: async function() { return { content: { sha: 'x' } }; } };
    }
    if (method === 'POST' && /\/pulls$/.test(url)) {
      var prBody = JSON.parse(opts.body);
      prPayloads.push(prBody);
      callIndex++;
      return { ok: true, status: 201, json: async function() { return { number: callIndex, html_url: 'https://github.com/acme/widgets/pull/' + callIndex }; } };
    }
    throw new Error('unexpected fetch call in AC6 test: ' + method + ' ' + url);
  };

  function mockPool() {
    return {
      query: async function(sql) {
        if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) {
          return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
        }
        return { rows: [] };
      }
    };
  }

  function mockReq(body) {
    return { params: { id: 'p1' }, session: { accessToken: 'tok', tenantId: 't1' }, body: body };
  }

  function mockRes() {
    var _status = null, _body = '';
    return { status: function(c) { _status = c; return this; }, json: function(b) { _body = JSON.stringify(b); }, writeHead: function(c) { _status = c; return this; }, end: function(b) { if (b != null) _body = b; }, _get: function() { return { statusCode: _status, body: _body }; } };
  }

  try {
    var { guardrailPrAdapter, setGuardrailPrAdapter, getGuardrailPrAdapter, realGuardrailPrAdapter } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realGuardrailPrAdapter);
    try {
      var pool = mockPool();
      var writeAdapterForRequest = async function(target, content) {
        var prodRow = (await pool.query('SELECT repo_owner, repo_name FROM products WHERE product_id = $1')).rows[0];
        return guardrailPrAdapter('tok', prodRow.repo_owner, prodRow.repo_name, target.path, content, { tenantId: 't1', productId: target.productId });
      };

      var req1 = mockReq({ path: 'standards/first-discipline.md', content: 'First content' });
      var res1 = mockRes();
      await products.handlePostGuardrailsForm(req1, res1, null, pool, writeAdapterForRequest);

      var req2 = mockReq({ path: 'standards/second-discipline.md', content: 'Second content' });
      var res2 = mockRes();
      await products.handlePostGuardrailsForm(req2, res2, null, pool, writeAdapterForRequest);

      assert.strictEqual(res1._get().statusCode, 200);
      assert.strictEqual(res2._get().statusCode, 200);
      assert.strictEqual(prPayloads.length, 2, 'expected exactly two PR-creation calls');
      assert.notStrictEqual(prPayloads[0].title, prPayloads[1].title, 'expected two individually-distinct PR titles, not the same content twice');
      assert.ok(/first-discipline/.test(prPayloads[0].title), 'expected the first PR to reference the first submission\'s real path');
      assert.ok(/second-discipline/.test(prPayloads[1].title), 'expected the second PR to reference the second submission\'s real path');
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `FAIL: AC6: ... — expected server.js to wire setGuardrailPrAdapter`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add the require near the other adapter requires (search for `setFetchRepoPath, realFetchRepoPath` — the `wugs-s1` adapter wiring require — add a new line right after it):

```javascript
const { setGuardrailPrAdapter, realGuardrailPrAdapter } = require('./adapters/guardrail-pr-adapter'); // wugs-s6
```

Find where `wugs-s1`'s adapter is wired unconditionally (search for `setFetchRepoPath(realFetchRepoPath)`, inside the `if (process.env.NODE_ENV !== 'test')` block near the other production wiring calls) and add the new wiring right after it, inside the same block:

```javascript
  setGuardrailPrAdapter(realGuardrailPrAdapter);
  console.log('[wugs-s6] guardrail PR adapter wired');
```

Add `handlePostGuardrailsForm` and `guardrailPrAdapter` requires where needed — `handlePostGuardrailsForm` is already imported from `wugs-s5`'s wiring (search for `handleGetGuardrailsForm` in the destructured `./routes/products` import — add `handlePostGuardrailsForm` right after it):

```javascript
const { handlePostProductNew, handlePostProductConfirm, handleGetDashboard: _handleGetDashboard, handleGetProductNew, handleGetProductView, handleGetProductRoadmap, handleGetProductStandardsTab, handleGetProductGuardrailsView, handleGetGuardrailsForm, handlePostGuardrailsForm, handlePostProductSync, handlePostProductFeature, handleGetProductKanban, handleGetOrgKanban, handlePostBoardAdvance, handleDeleteProduct, handlePostProductRepoCreate, handlePutProductEdit, handleGetProductModules, handlePostProductModule, handlePutProductModule, handleDeleteProductModule, handlePutEpicModule, handlePostBulkAssignFeatureModules } = require('./routes/products'); // psh-s3 / psh-s4 / psh-s6 / psh-s7 / prc-s4.2 / prc-s2.1 / prc-s4.1 / pr-s3 / a1 / a2 / a5 / tmc-s1 / s1.1 / smug-s1 / wugs-s2 / wugs-s5 / wugs-s6
```

Find the existing GET `/products/:id/guardrails/form` route (search for `\/guardrails\\\/form\$\/` — the `wugs-s5` route block) and add the new POST route right after it:

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/guardrails\/form$/) && req.method === 'POST') {
    // wugs-s6 -- submission handler for the create/edit form (wugs-s5),
    // now wired to a real write adapter. Closes the gap wugs-s5 flagged in
    // decisions.md: the POST route previously did not exist at all.
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => {
      const writeAdapterForRequest = async (target, content) => {
        const prodRow = (await _pshPool.query(
          'SELECT repo_owner, repo_name FROM products WHERE product_id = $1',
          [target.productId]
        )).rows[0];
        return guardrailPrAdapter(req.session.accessToken, prodRow.repo_owner, prodRow.repo_name, target.path, content, {
          tenantId: req.session.tenantId,
          productId: target.productId
        });
      };
      await handlePostGuardrailsForm(req, res, null, _pshPool, writeAdapterForRequest);
    });
```

This closure needs `guardrailPrAdapter` (the injectable wrapper function, not `realGuardrailPrAdapter`) imported too — add it to the same require line as `setGuardrailPrAdapter`/`realGuardrailPrAdapter`:

```javascript
const { guardrailPrAdapter, setGuardrailPrAdapter, realGuardrailPrAdapter } = require('./adapters/guardrail-pr-adapter'); // wugs-s6
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `12 passed, 0 failed`

- [ ] **Step 5: Regression check**

```bash
for f in $(grep -rl "adapters/guardrail-pr-adapter\|routes/products\|require.*server" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

`server.js` is large and widely-depended-on — if any `FAIL` lines appear (besides the known pre-existing `check-wuce4-docker-deployment.js` hang, verify via `git stash` that it's unrelated), investigate before proceeding. Also confirm `node tests/check-wugs-s5-create-edit-form.js` still shows `13 passed, 0 failed` and `node tests/check-wugs-s2-product-level-guardrails-view.js` still shows `11 passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-wugs-s6-branch-pr-creation-adapter.js
git commit -m "feat(wugs-s6): wire the real adapter and POST route (AC6, closes wugs-s5's GAP-FLAG)"
```

---

## Final story-level check (before /verify-completion)

After all 7 tasks:

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
```

Expected: `12 passed, 0 failed`

```bash
node tests/check-wugs-s5-create-edit-form.js
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Both expected unchanged (13/13 and 11/11 respectively) — confirms this story's wiring didn't regress either upstream story.

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s6`), 0 new failures.

**Before this story is considered fully done (per the DoR's own REQUIRED step):** perform one real, manual test against a sandbox GitHub repo confirming the branch/Contents/Pulls API response shapes match the mocked test shapes (CLAUDE.md's mock-shape-verification rule) — this is a human action requiring real GitHub credentials and a disposable sandbox repo; it cannot be performed by an automated agent. Record the outcome in the PR description and, if any real-API shape differs from what the mocks assumed, fix `guardrail-pr-adapter.js` before merge.

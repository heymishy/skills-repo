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
  await assert.rejects(
    guardrailPrAdapter.createGuardrailPr('token', 'owner', 'repo', 'path.md', 'content', {}),
    function(err) {
      return err.message === 'Adapter not wired: guardrailPrAdapter. Call setGuardrailPrAdapter() with a real implementation before use.';
    },
    'expected the exact D37 "not wired" error message from the real, unwired default'
  );
});

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
await checkAsync('AC1: createGuardrailPr_newFile_createsBranchCommitsAndOpensPr', async () => {
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
    var { setGuardrailPrAdapter, createGuardrailPr, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var { realCreateGuardrailPr } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await createGuardrailPr('tok', 'acme', 'widgets', 'standards/new-discipline.md', 'New content', { tenantId: 't1', productId: 'p1' });
      assert.strictEqual(mock.calls.length, 5, 'expected exactly 5 sequential API calls');

      // Verify call 0: default-branch SHA fetch
      assert.strictEqual(mock.calls[0].method, 'GET');
      assert.ok(/\/git\/ref\/heads\/main$/.test(mock.calls[0].url), 'expected step 1 to read the default branch ref');

      assert.ok(mock.calls[1].method === 'POST' && /\/git\/refs$/.test(mock.calls[1].url), 'expected step 2 to create a new ref');

      // Verify call 2: file-existence check
      assert.strictEqual(mock.calls[2].method, 'GET');
      assert.ok(/\/contents\/standards%2Fnew-discipline\.md\?ref=main$|\/contents\/standards\/new-discipline\.md\?ref=main$/.test(mock.calls[2].url), 'expected step 3 to check the target file on the default branch');

      assert.ok(mock.calls[3].method === 'PUT' && /\/contents\//.test(mock.calls[3].url), 'expected step 4 to PUT the file content');
      var putBody = JSON.parse(mock.calls[3].body);
      assert.ok(!putBody.sha, 'expected no sha in the PUT payload for a genuinely new file');
      assert.ok(putBody.branch !== 'main' && putBody.branch !== undefined, 'expected the file committed to the NEW branch, not directly to main/default');

      // Cross-check: the branch created in step 2 is the SAME branch committed to in step 4
      var refBody = JSON.parse(mock.calls[1].body);
      var createdBranchName = refBody.ref.replace('refs/heads/', '');
      assert.strictEqual(putBody.branch, createdBranchName, 'expected the file to be committed to the exact branch just created, not an unrelated non-main value');

      // Verify call 4: PR creation targets the right head/base
      var prBody = JSON.parse(mock.calls[4].body);
      assert.strictEqual(mock.calls[4].method, 'POST');
      assert.ok(/\/pulls$/.test(mock.calls[4].url), 'expected step 5 to POST to the pulls endpoint');
      assert.strictEqual(prBody.head, createdBranchName, 'expected the PR to be opened FROM the branch just created');
      assert.strictEqual(prBody.base, 'main', 'expected the PR to target the default branch as its base');
      assert.ok(prBody.title && prBody.title.length > 0, 'expected a real, non-empty PR title');
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

// ── AC2: existing file — SHA-based update ────────────────────────────────
await checkAsync('AC2: createGuardrailPr_existingFile_usesShaForUpdate', async () => {
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
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await createGuardrailPr('tok', 'acme', 'widgets', 'standards/saas-gui.md', 'Updated content', { tenantId: 't1', productId: 'p1' });
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
await checkAsync('AC2: createGuardrailPr_staleSha_throwsConflictError', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'base-sha-123' } } },
    { status: 201, body: { ref: 'refs/heads/guardrail-edit-x' } },
    { status: 200, body: { sha: 'stale-sha' } },
    { status: 409, body: { message: 'sha does not match' } }  // conflict on update
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr, GuardrailPrConflictError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await assert.rejects(
        createGuardrailPr('tok', 'acme', 'widgets', 'standards/saas-gui.md', 'Updated content', { tenantId: 't1', productId: 'p1' }),
        function(err) { return err instanceof GuardrailPrConflictError; },
        'expected a GuardrailPrConflictError, not a generic error or silent failure'
      );
      assert.strictEqual(mock.calls.length, 4, 'expected PR creation to never fire after a conflict');
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

// ── AC2 (negative case): a non-conflict PUT failure is NOT mislabeled as a conflict ──
await checkAsync('AC2: createGuardrailPr_nonConflictPutFailure_throwsGenericErrorNotConflict', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'base-sha-123' } } },
    { status: 201, body: { ref: 'refs/heads/guardrail-edit-x' } },
    { status: 200, body: { sha: 'existing-sha' } },
    { status: 500, statusText: 'Internal Server Error', body: {} }  // NOT a conflict status
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr, GuardrailPrError, GuardrailPrConflictError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await assert.rejects(
        createGuardrailPr('tok', 'acme', 'widgets', 'standards/saas-gui.md', 'Updated content', { tenantId: 't1', productId: 'p1' }),
        function(err) {
          return err instanceof GuardrailPrError && !(err instanceof GuardrailPrConflictError) && err.step === 'file commit failed';
        },
        'expected a generic GuardrailPrError for a non-conflict PUT failure, NOT a GuardrailPrConflictError'
      );
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

// ── AC3: success returns PR number and URL ───────────────────────────────
await checkAsync('AC3: createGuardrailPr_success_returnsPrNumberAndUrl', async () => {
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
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      var result = await createGuardrailPr('tok', 'acme', 'widgets', 'standards/new.md', 'content', { tenantId: 't1', productId: 'p1' });
      assert.strictEqual(result.prNumber, 42, 'expected the real mocked PR number, not a placeholder');
      assert.strictEqual(result.prUrl, 'https://github.com/acme/widgets/pull/42', 'expected the real mocked PR URL, not a constructed/guessed one');
    } finally {
      setGuardrailPrAdapter(original);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

// ── AC4: step failure surfaces which step failed (4 distinct steps) ─────
await checkAsync('AC4: createGuardrailPr_branchShaFails_surfacesBranchCreationStep', async () => {
  var mock = mockFetchSequence([{ status: 500, statusText: 'Internal Server Error', body: {} }]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await assert.rejects(
        createGuardrailPr('tok', 'acme', 'widgets', 'x.md', 'c', {}),
        function(err) { return err instanceof GuardrailPrError && err.step === 'branch creation failed'; },
        'expected a GuardrailPrError naming "branch creation failed"'
      );
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

await checkAsync('AC4: createGuardrailPr_createRefFails_surfacesBranchCreationStep', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'x' } } },
    { status: 422, body: { message: 'Reference already exists' } }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await assert.rejects(
        createGuardrailPr('tok', 'acme', 'widgets', 'x.md', 'c', {}),
        function(err) { return err instanceof GuardrailPrError && err.step === 'branch creation failed'; },
        'expected a GuardrailPrError naming "branch creation failed" for the create-ref step'
      );
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

await checkAsync('AC4: createGuardrailPr_fileCommitFails_surfacesFileCommitStep', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'x' } } },
    { status: 201, body: {} },
    { status: 404, body: {} },
    { status: 500, statusText: 'Internal Server Error', body: {} }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await assert.rejects(
        createGuardrailPr('tok', 'acme', 'widgets', 'x.md', 'c', {}),
        function(err) { return err instanceof GuardrailPrError && err.step === 'file commit failed'; },
        'expected a GuardrailPrError naming "file commit failed"'
      );
      assert.strictEqual(mock.calls.length, 4, 'expected exactly 4 calls -- failure at the PUT (file-commit) step specifically, not the earlier GET-file-existence-check');
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

await checkAsync('AC4: createGuardrailPr_prCreationFails_surfacesPrCreationStep', async () => {
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
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await assert.rejects(
        createGuardrailPr('tok', 'acme', 'widgets', 'x.md', 'c', {}),
        function(err) { return err instanceof GuardrailPrError && err.step === 'PR creation failed'; },
        'expected a GuardrailPrError naming "PR creation failed"'
      );
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

// ── NFR: token is never logged ───────────────────────────────────────────
await checkAsync('NFR-SEC: createGuardrailPr_run_neverLogsToken', async () => {
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
  var captured = null;
  var mockPosthog = { capture: function(distinctId, event, properties) { captured = { distinctId: distinctId, event: event, properties: properties }; } };
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    var SECRET_TOKEN = 'ghp_supersecrettoken12345';
    try {
      await createGuardrailPr(SECRET_TOKEN, 'acme', 'widgets', 'x.md', 'c', { tenantId: 't1', productId: 'p1', posthog: mockPosthog });
      var allLogged = logged.join('\n');
      assert.ok(allLogged.indexOf(SECRET_TOKEN) === -1, 'expected the raw token to never appear in any log output');
      assert.ok(captured, 'expected a PostHog capture call to have fired');
      assert.notStrictEqual(captured.distinctId, SECRET_TOKEN, 'expected the token to never be used as the PostHog distinctId');
      assert.ok(JSON.stringify(captured.properties).indexOf(SECRET_TOKEN) === -1, 'expected the raw token to never appear anywhere in the PostHog audit event properties');
    } finally { setGuardrailPrAdapter(original); }
  } finally {
    global.fetch = originalFetch;
    console.log = originalLog;
    console.error = originalError;
  }
});

// ── NFR: PR creation is audit-logged via PostHog ─────────────────────────
await checkAsync('NFR-AUDIT: createGuardrailPr_success_capturesPostHogEvent', async () => {
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
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await createGuardrailPr('tok', 'acme', 'widgets', 'x.md', 'c', { tenantId: 't1', productId: 'p1', posthog: mockPosthog });
      assert.ok(captured, 'expected a PostHog capture call to have fired');
      assert.strictEqual(captured.distinctId, 't1', 'expected the event attributed to the correct tenant');
      assert.strictEqual(captured.event, 'guardrail_pr_opened');
      assert.strictEqual(captured.properties.tenant_id, 't1');
      assert.strictEqual(captured.properties.product_id, 'p1');
      assert.strictEqual(captured.properties.repo, 'acme/widgets');
      assert.strictEqual(captured.properties.pr_number, 7, 'expected the real PR number in the audit event, not a placeholder');
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

// ── NFR: audit event never fires unless PR creation actually succeeded ──
await checkAsync('NFR-AUDIT: createGuardrailPr_prCreationFails_neverCapturesEvent', async () => {
  var mock = mockFetchSequence([
    { status: 200, body: { object: { sha: 'x' } } },
    { status: 201, body: {} },
    { status: 404, body: {} },
    { status: 201, body: { content: { sha: 'y' } } },
    { status: 500, statusText: 'Internal Server Error', body: {} }
  ]);
  var originalFetch = global.fetch;
  global.fetch = mock.fn;
  var captured = null;
  var mockPosthog = { capture: function(distinctId, event, properties) { captured = { distinctId: distinctId, event: event, properties: properties }; } };
  try {
    var { setGuardrailPrAdapter, getGuardrailPrAdapter, createGuardrailPr, realCreateGuardrailPr, GuardrailPrError } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      await assert.rejects(
        createGuardrailPr('tok', 'acme', 'widgets', 'x.md', 'c', { tenantId: 't1', productId: 'p1', posthog: mockPosthog }),
        function(err) { return err instanceof GuardrailPrError && err.step === 'PR creation failed'; },
        'expected a GuardrailPrError naming "PR creation failed"'
      );
      assert.strictEqual(captured, null, 'expected no audit event when PR creation fails');
    } finally { setGuardrailPrAdapter(original); }
  } finally { global.fetch = originalFetch; }
});

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
    var { createGuardrailPr, setGuardrailPrAdapter, getGuardrailPrAdapter, realCreateGuardrailPr } = require('../src/web-ui/adapters/guardrail-pr-adapter');
    var original = getGuardrailPrAdapter();
    setGuardrailPrAdapter(realCreateGuardrailPr);
    try {
      var pool = mockPool();
      var writeAdapterForRequest = async function(target, content) {
        var prodRow = (await pool.query('SELECT repo_owner, repo_name FROM products WHERE product_id = $1')).rows[0];
        return createGuardrailPr('tok', prodRow.repo_owner, prodRow.repo_name, target.path, content, { tenantId: 't1', productId: target.productId });
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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();

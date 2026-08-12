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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();

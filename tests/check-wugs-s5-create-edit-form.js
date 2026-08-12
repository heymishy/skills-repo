'use strict';
// check-wugs-s5-create-edit-form.js — wugs-s5
//
// Unit/integration tests for the create/edit form: Add/Edit action links on
// the product-level guardrails/standards view (wugs-s2), a pre-filled edit
// form, and server-side validation + write-path hand-off.

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

var products = require('../src/web-ui/routes/products');
var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');

function mockReq(overrides) {
  return Object.assign({
    params: { id: 'p1' },
    query: {},
    session: { accessToken: 'tok', tenantId: 't1', login: 'alice' }
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

function makeMockPool(navProducts) {
  return {
    query: async function (sql) {
      var s = String(sql);
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: [{ name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) {
        return { rows: (navProducts || []).map(function (p) { return { product_id: p.id, name: p.name, created_at: new Date().toISOString() }; }) };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) {
        return { rows: [] };
      }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

async function withMockedFetchRepoPath(mockFn, testFn) {
  var original = artefactFetcher.getFetchRepoPath();
  artefactFetcher.setFetchRepoPath(mockFn);
  try {
    await testFn();
  } finally {
    artefactFetcher.setFetchRepoPath(original);
  }
}

(async () => {

// ── AC1: Add/Edit actions present ─────────────────────────────────────
await checkAsync('AC1: guardrailsView_rendersAddAndEditActions', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return 'REAL GUARDRAILS CONTENT'; }
    if (path === 'standards/') { return [{ name: 'saas-gui', path: 'standards/saas-gui', type: 'dir' }]; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);

    // Tie each label to its specific href so the assertion can't be
    // satisfied by any of the *other* Add/Edit links on the page.
    var guardrailsHref = '/products/p1/guardrails/form?path=' + encodeURIComponent('.github/architecture-guardrails.md');
    var standardsEntryHref = '/products/p1/guardrails/form?path=' + encodeURIComponent('standards/saas-gui');
    var addStandardHref = '/products/p1/guardrails/form?section=standards';

    // An "Edit" action for the existing guardrails file (guardrails file present).
    assert.ok(result.body.indexOf('href="' + guardrailsHref + '" style="font-size:13px;color:var(--accent)">Edit<') !== -1, 'expected the guardrails header link to read "Edit" when the file exists');
    // An "Edit" action for the existing standards entry.
    assert.ok(result.body.indexOf('href="' + standardsEntryHref + '" style="font-size:13px;color:var(--accent)">Edit<') !== -1, 'expected an Edit link for the existing standards entry');
    // An "Add" action for creating a new standard (unconditional, section-level action).
    assert.ok(result.body.indexOf('href="' + addStandardHref + '" style="font-size:13px;color:var(--accent)">Add<') !== -1, 'expected an Add link for creating a new standard');
  });
});

// ── AC1: guardrails-file-missing branch of the ternary ─────────────────
await checkAsync('AC1: guardrailsView_missingGuardrailsFile_showsAddNotEdit', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path); }
    if (path === 'standards/') { return [{ name: 'saas-gui', path: 'standards/saas-gui', type: 'dir' }]; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);

    var guardrailsAddHref = '/products/p1/guardrails/form?path=' + encodeURIComponent('.github/architecture-guardrails.md');
    // When the file is missing, the guardrails header link must read "Add", not "Edit" —
    // scoped to the guardrails href specifically so an inverted or hardcoded ternary fails this.
    assert.ok(result.body.indexOf('href="' + guardrailsAddHref + '" style="font-size:13px;color:var(--accent)">Add<') !== -1, 'expected the guardrails header to show "Add" when the file is missing, not "Edit"');
    assert.ok(result.body.indexOf('href="' + guardrailsAddHref + '" style="font-size:13px;color:var(--accent)">Edit<') === -1, 'did not expect "Edit" on the guardrails header link when the file is missing');
  });
});

// ── AC2: Edit form pre-filled with real current content ─────────────────
await checkAsync('AC2: editForm_prefillsWithRealCurrentContent', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === 'standards/saas-gui') { return 'REAL SAAS-GUI STANDARD CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ query: { path: 'standards/saas-gui' } });
    var res = mockRes();
    await products.handleGetGuardrailsForm(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('REAL SAAS-GUI STANDARD CONTENT') !== -1, 'expected the real current content pre-filled in the form');
    assert.ok(result.body.indexOf('<h1 style="margin:0 0 24px;font-size:24px">Edit guardrail or standard</h1>') !== -1, 'expected the "Edit" heading when editing an existing path');
  });
});

// ── AC2 (blank mode): Add form (no path) renders blank, no fetch needed ──
await checkAsync('AC2: addForm_noPath_rendersBlank', async () => {
  var pool = makeMockPool([]);
  var fetchCallCount = 0;
  await withMockedFetchRepoPath(async function () {
    fetchCallCount++;
    return 'should not be reached';
  }, async function () {
    var req = mockReq({ query: { section: 'standards' } });
    var res = mockRes();
    await products.handleGetGuardrailsForm(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('<textarea') !== -1, 'expected a blank textarea for add mode');
    assert.strictEqual(fetchCallCount, 0, 'expected no fetch call in add mode (no path given)');
    assert.ok(result.body.indexOf('<h1 style="margin:0 0 24px;font-size:24px">Add guardrail or standard</h1>') !== -1, 'expected the "Add" heading when no path is given');
  });
});

// ── NFR-SEC-01: pre-filled content is escaped before rendering ──────────
await checkAsync('NFR-SEC-01: editForm_withScriptTag_isEscapedNotLiveMarkup', async () => {
  var pool = makeMockPool([]);
  var malicious = '<script>alert(1)</script>';
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === 'standards/saas-gui') { return malicious; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ query: { path: 'standards/saas-gui' } });
    var res = mockRes();
    await products.handleGetGuardrailsForm(req, res, null, pool);
    var result = res._get();
    assert.ok(result.body.indexOf('<script>alert(1)</script>') === -1, 'expected the script tag to be escaped, not rendered live');
    assert.ok(result.body.indexOf('&lt;script&gt;') !== -1, 'expected the escaped form to be present');
  });
});

// ── AC3: empty submission rejected server-side ───────────────────────────
await checkAsync('AC3: submitForm_emptyContent_rejectedServerSide', async () => {
  var pool = makeMockPool([]);
  var writeAdapterCalled = false;
  var writeAdapter = async function () { writeAdapterCalled = true; };
  var req = mockReq({ body: { path: 'standards/saas-gui', content: '   ' } });
  var res = mockRes();
  await products.handlePostGuardrailsForm(req, res, null, pool, writeAdapter);
  var result = res._get();
  assert.strictEqual(result.statusCode, 400, 'expected a 400 validation error for whitespace-only content');
  assert.ok(/content/i.test(result.body), 'expected a clear validation error message mentioning content');
  assert.strictEqual(writeAdapterCalled, false, 'expected the write adapter to never be called for invalid content');
});

// ── AC3 (accept path): valid content is accepted, not rejected ──────────
await checkAsync('AC3: submitForm_validContent_acceptedServerSide', async () => {
  var pool = makeMockPool([]);
  var req = mockReq({ body: { path: 'standards/saas-gui', content: 'Some real content' } });
  var res = mockRes();
  await products.handlePostGuardrailsForm(req, res, null, pool, async function () {});
  var result = res._get();
  assert.strictEqual(result.statusCode, 200, 'expected valid content to be accepted, not rejected');
  assert.ok(/"ok":true/.test(result.body), 'expected an ok:true response body');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();

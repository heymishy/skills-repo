'use strict';
// check-ppc-s7-sign-off-recording.js — ppc-s7. Covers the in-app sign-off
// decision (Approve/Needs changes) recorded on the Playback Evidence page:
// the no-decision empty state (AC1, AC6), the POST handler writing to
// journeys.data.signOff with resolved identity/timestamp/coverage snapshot
// (AC2, AC5), and rendering an existing (possibly stale) decision on reload
// (AC3, AC4).

var assert = require('assert');
var fs = require('fs');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  var result;
  try { result = fn(); } catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve(); }
  if (result && typeof result.then === 'function') {
    return result.then(function() { passed++; console.log('  PASS: ' + name); }, function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); });
  }
  passed++; console.log('  PASS: ' + name); return Promise.resolve();
}
var queue = [];

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
pe.setJourneyStoreModule(store);

function getStore() { store._clearForTesting(); return store; }
function makeRes() {
  var res = { _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = (res._body || '') + (body || ''); },
    setHeader: function(k, v) { res._headers[k] = v; } };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
var _n = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _n++;
  return Object.assign({ session: { tenantId: tenantId, userId: 'ppc-s7-user-' + _n, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId, params: { productId: productId, featureSlug: featureSlug },
    headers: { accept: 'text/html', 'content-type': 'application/json' }, body: {} }, extra || {});
}
function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s7-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var acRows = opts.acRows || [{ acId: 'AC1', satisfied: 'Yes', evidence: 'screenshot' }];
  var dodContent = ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|----|----|']
    .concat(acRows.map(function(r) { return '| ' + r.acId + ' — ' + r.acId + ' | ' + r.satisfied + ' | ' + r.evidence + ' |'; })).join('\n');
  store.setPgAdapterForTesting({ saveJourney: async function() {}, getArtefactsForJourney: async function() { return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }]; } });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}
function makeMockPool() { return { query: async function() { return { rows: [] }; } }; }

console.log('\n[ppc-s7] AC1/AC6: sign-off area, no prior decision');

queue.push(function() {
  return test('T1 (AC1): no prior decision -- shows Approve (primary) and Needs changes (destructive) buttons plus a comment field', function() {
    var html = pe._renderSignOffHtml({ signOff: null, productId: 'product-a', featureSlug: 'feat-a' }, 'tok', '0 of 1');
    assert.ok(html.indexOf('Approve') !== -1, 'must show an Approve action');
    assert.ok(html.indexOf('Needs changes') !== -1, 'must show a Needs changes action');
    assert.ok(html.indexOf('sw-btn--primary') !== -1, 'Approve must use the primary button variant');
    assert.ok(html.indexOf('ppc-signoff-btn--destructive') !== -1, 'Needs changes must use a destructive-styled variant');
    assert.ok(html.indexOf('<textarea') !== -1, 'must include an optional comment field');
    assert.ok(html.indexOf('method="POST"') !== -1, 'must be a plain form submission, no client JS required');
  });
});

queue.push(function() {
  return test('T3 (AC6): empty state reads "No decision recorded yet", distinct from Approved badge markup', function() {
    var html = pe._renderSignOffHtml({ signOff: null, productId: 'product-a', featureSlug: 'feat-a' }, 'tok', '0 of 1');
    assert.ok(html.indexOf('No decision recorded yet') !== -1);
    assert.ok(html.indexOf('class="ppc-signoff-badge ppc-signoff-badge--success"') === -1, 'must not render the Approved badge element when nothing is recorded');
  });
});

console.log('\n[ppc-s7] AC2/AC5: sign-off submission');

queue.push(function() {
  return test('T4 (AC2): writes signOff to journey data with resolved identity and ISO timestamp', function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { session: { tenantId: setup.tenantId, login: 'alice', csrfToken: 'test-csrf-token' }, body: { status: 'approved', comment: 'looks good', _csrf: 'test-csrf-token' } });
    var res = makeRes();
    return pe.handlePostSignOff(req, res, null, makeMockPool()).then(function() {
      var journey = store2.getJourneyByTenantProductSlug(setup.tenantId, setup.productId, setup.featureSlug);
      assert.strictEqual(journey.signOff.status, 'approved');
      assert.strictEqual(journey.signOff.by, 'alice');
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(journey.signOff.at), 'at must be an ISO timestamp');
      assert.strictEqual(journey.signOff.comment, 'looks good');
    });
  });
});

queue.push(function() {
  return test('T5 (AC2 regression guard): identity resolves via login||userId, never accessToken', function() {
    var store3 = getStore();
    var setup = setupDodCompleteJourney(store3, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { session: { tenantId: setup.tenantId, userId: 'u-1', accessToken: 'decoy-token', csrfToken: 'test-csrf-token' }, body: { status: 'needs-changes', _csrf: 'test-csrf-token' } });
    var res = makeRes();
    return pe.handlePostSignOff(req, res, null, makeMockPool()).then(function() {
      var journey = store3.getJourneyByTenantProductSlug(setup.tenantId, setup.productId, setup.featureSlug);
      assert.strictEqual(journey.signOff.by, 'u-1');
      var src = fs.readFileSync(require('path').join(__dirname, '../src/web-ui/routes/playback-evidence.js'), 'utf8');
      var start = src.indexOf('async function handlePostSignOff');
      var signOffFnSrc = src.slice(start, start + 2500);
      assert.ok(signOffFnSrc.indexOf('.accessToken') === -1, 'handlePostSignOff must never read req.session.accessToken for identity');
    });
  });
});

queue.push(function() {
  return test('T6 (AC2): coverageSnapshot reflects AC coverage at the moment of decision', function() {
    var store4 = getStore();
    var setup = setupDodCompleteJourney(store4, { acRows: [{ acId: 'AC1', satisfied: 'Yes', evidence: 'x' }, { acId: 'AC2', satisfied: 'Yes', evidence: 'x' }] });
    store4.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png' } });
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { session: { tenantId: setup.tenantId, login: 'alice', csrfToken: 'test-csrf-token' }, body: { status: 'approved', _csrf: 'test-csrf-token' } });
    var res = makeRes();
    return pe.handlePostSignOff(req, res, null, makeMockPool()).then(function() {
      var journey = store4.getJourneyByTenantProductSlug(setup.tenantId, setup.productId, setup.featureSlug);
      assert.strictEqual(journey.signOff.coverageSnapshot, '1 of 2');
    });
  });
});

queue.push(function() {
  return test('T11 (AC5): cross-tenant sign-off request is denied, no write occurs', function() {
    var store5 = getStore();
    var setup = setupDodCompleteJourney(store5, { tenantId: 'tenant-a', productId: 'product-a' });
    var req = makeReq('tenant-b', setup.productId, setup.featureSlug, { session: { tenantId: 'tenant-b', login: 'eve', csrfToken: 'test-csrf-token' }, body: { status: 'approved', _csrf: 'test-csrf-token' } });
    var res = makeRes();
    return pe.handlePostSignOff(req, res, null, makeMockPool()).then(function() {
      assert.strictEqual(res._status, 404);
      var journey = store5.getJourneyByTenantProductSlug('tenant-a', setup.productId, setup.featureSlug);
      assert.ok(!journey.signOff, 'tenant A journey must be unchanged');
    });
  });
});

queue.push(function() {
  return test('T12 (NFR-Performance): exactly one additional journey-store write per submission', function() {
    var store6 = getStore();
    var setup = setupDodCompleteJourney(store6, {});
    var writeCount = 0;
    var origSet = store6.setJourneyFields;
    store6.setJourneyFields = function() { writeCount++; return origSet.apply(store6, arguments); };
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { session: { tenantId: setup.tenantId, login: 'alice', csrfToken: 'test-csrf-token' }, body: { status: 'approved', _csrf: 'test-csrf-token' } });
    var res = makeRes();
    return pe.handlePostSignOff(req, res, null, makeMockPool()).then(function() {
      store6.setJourneyFields = origSet;
      assert.strictEqual(writeCount, 1);
    }, function(err) { store6.setJourneyFields = origSet; throw err; });
  });
});

console.log('\n[ppc-s7] AC3/AC4: rendering an existing (and possibly stale) decision');

queue.push(function() {
  return test('T2 (AC3, XSS): escapes <script> and double-quote in the stored comment on render', function() {
    var journey = { signOff: { status: 'approved', by: 'alice', at: '2026-10-27T00:00:00.000Z', comment: '<script>alert(1)</script>"', coverageSnapshot: '7 of 7' }, productId: 'product-a', featureSlug: 'feat-a' };
    var html = pe._renderSignOffHtml(journey, 'tok', '7 of 7');
    assert.ok(html.indexOf('<script>alert') === -1, 'must never render an unescaped <script> tag');
    assert.ok(html.indexOf('&lt;script&gt;') !== -1, 'must render the escaped tag text');
    assert.ok(html.indexOf('&quot;') !== -1, 'must escape the double quote');
  });
});

queue.push(function() {
  return test('T7 (AC3): existing decision renders a status badge plus escaped who/when/comment/coverage', function() {
    var journey = { signOff: { status: 'approved', by: 'alice', at: '2026-10-27T00:00:00.000Z', comment: 'looks good', coverageSnapshot: '7 of 7' }, productId: 'product-a', featureSlug: 'feat-a' };
    var html = pe._renderSignOffHtml(journey, 'tok', '7 of 7');
    assert.ok(html.indexOf('alice') !== -1);
    assert.ok(html.indexOf('looks good') !== -1);
    assert.ok(html.indexOf('ppc-signoff-badge--success') !== -1, 'Approved must use the success-token badge');
  });
});

queue.push(function() {
  return test('T7b (AC3): a "needs-changes" decision renders the danger-token badge', function() {
    var journey = { signOff: { status: 'needs-changes', by: 'bob', at: '2026-10-27T00:00:00.000Z', comment: '', coverageSnapshot: '3 of 7' }, productId: 'product-a', featureSlug: 'feat-a' };
    var html = pe._renderSignOffHtml(journey, 'tok', '3 of 7');
    assert.ok(html.indexOf('ppc-signoff-badge--danger') !== -1, 'Needs changes must use the danger-token badge');
  });
});

queue.push(function() {
  return test('T8 (AC4): stale decision (recorded at 5 of 7, now 7 of 7) stays visible, explicitly labelled with the ORIGINAL snapshot', function() {
    var journey = { signOff: { status: 'approved', by: 'alice', at: '2026-10-27T00:00:00.000Z', comment: '', coverageSnapshot: '5 of 7' }, productId: 'product-a', featureSlug: 'feat-a' };
    var html = pe._renderSignOffHtml(journey, 'tok', '7 of 7');
    assert.ok(html.indexOf('5 of 7') !== -1, 'must show the snapshot the decision was actually recorded against');
  });
});

queue.push(function() {
  return test('T9 (AC4, negative): never renders a bare "Approved" with no coverage qualifier when snapshots differ', function() {
    var journey = { signOff: { status: 'approved', by: 'alice', at: '2026-10-27T00:00:00.000Z', comment: '', coverageSnapshot: '5 of 7' }, productId: 'product-a', featureSlug: 'feat-a' };
    var html = pe._renderSignOffHtml(journey, 'tok', '7 of 7');
    var textOnly = html.replace(/<[^>]+>/g, ' ');
    assert.ok(!/Approved(?!\s+against)/.test(textOnly), 'a stale decision must never read as a bare, unqualified "Approved"');
  });
});

console.log('\n[ppc-s7] NFR: accessibility');

queue.push(function() {
  return test('T13 (NFR-Accessibility): sign-off markup emits only form/button/textarea, no inline JS event handlers', function() {
    var html = pe._renderSignOffHtml({ signOff: null, productId: 'product-a', featureSlug: 'feat-a' }, 'tok', '0 of 1');
    assert.ok(!/on(click|submit|change)\s*=/.test(html), 'must not rely on inline JS event handlers');
  });
});

(async function() { for (var i = 0; i < queue.length; i++) { await queue[i](); } console.log('\n' + passed + ' passed, ' + failed + ' failed'); if (failed > 0) process.exitCode = 1; })();

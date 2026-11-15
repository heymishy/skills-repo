'use strict';
// eit-s1 -- the error value (which becomes the GitHub issue title) says what failed and where, and the real code is kept.
// Plain Node script. Run: node tests/check-eit-s1-issue-title.js
// Story: artefacts/2026-11-16-error-issue-title/stories/eit-s1-error-issue-title.md
// Test plan: artefacts/2026-11-16-error-issue-title/test-plans/eit-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const ec = require('../src/web-ui/modules/error-capture');
const bridge = require('../src/web-ui/routes/error-bridge');
const incident = require('../scripts/lib/error-issue-incident');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const seed = 'eit' + crypto.randomBytes(5).toString('hex');

function event(opts) {
  opts = opts || {};
  return { event: '$exception', distinctId: 'someone@example.com', properties: Object.assign({
    $exception_list: [{ type: opts.type || 'Error', value: opts.message || ('boom ' + seed), mechanism: { handled: true },
      stacktrace: { type: 'raw', frames: [{ filename: 'a.js', function: 'f', lineno: 1, colno: 2 }] } }],
    $exception_level: 'error', $lib: 'posthog-node', $lib_version: '5.40.0', $is_server: true, $geoip_disable: true,
    code: opts.code, route: opts.route }, opts.extra || {}) };
}
const scrub = (opts) => ec.scrubEvent(event(opts), 'production');
const valueOf = (out) => out.properties.$exception_list[0].value;

test('T1 the value is <code>: <Type> at <route> (AC1)', () => {
  assert.strictEqual(valueOf(scrub({ code: 'request_error', type: 'URIError', route: '/journey/abc/stage/x' })), 'request_error: URIError at /journey/:p/:p/:p');
  assert.strictEqual(valueOf(scrub({ code: 'request_error', type: 'WeirdError', route: '/products/x' })), 'request_error: Error at /products/:p', 'a type outside the allow-list becomes Error');
  assert.strictEqual(valueOf(scrub({ code: 'unhandled_exception', type: 'TypeError' })), 'unhandled_exception: TypeError at /process', 'no route means /process');
});

test('T2 the allow-listed fixed message keeps its value (AC2)', () => {
  const out = scrub({ code: 'request_error', message: 'tenant_admin_bootstrap_failed', route: '/auth/github/callback' });
  assert.strictEqual(valueOf(out), 'tenant_admin_bootstrap_failed');
});

test('T3 http_5xx and unhandled_rejection are kept; an unknown code is still rewritten (AC3)', () => {
  assert.strictEqual(scrub({ code: 'http_5xx', route: '/x' }).properties.code, 'http_5xx');
  assert.strictEqual(scrub({ code: 'unhandled_rejection' }).properties.code, 'unhandled_rejection');
  assert.strictEqual(scrub({ code: 'made_up_code' }).properties.code, 'unhandled_exception');
  assert.strictEqual(valueOf(scrub({ code: 'http_5xx', route: '/skills/discovery/sessions/abc/result' })), 'http_5xx: Error at /skills/:p/:p/:p/:p');
});

test('T4 no canary text appears anywhere in the output, and a malformed event is dropped without throwing (AC4)', () => {
  const c = 'canary-' + seed;
  const out = scrub({ code: 'request_error', type: 'Error' + c, message: 'user jo@' + c + '.example failed', route: '/tenants/' + c + '/products/' + c + '?q=' + c,
    extra: { tenantId: c, reason: c } });
  assert.ok(out, 'event survives');
  assert.ok(!JSON.stringify(out).includes(c), 'canary leaked: ' + JSON.stringify(out).slice(0, 300));
  assert.doesNotThrow(() => ec.scrubEvent({ event: '$exception', properties: { $exception_list: 'not a list' } }, 'production'));
  assert.strictEqual(ec.scrubEvent({ event: '$exception', properties: { $exception_list: 'not a list' } }, 'production'), null);
});

test('T6 the fingerprint is unchanged: <environment>|<code>|<route> (AC6)', () => {
  const out = scrub({ code: 'request_error', type: 'URIError', route: '/journey/abc/stage/x' });
  assert.strictEqual(out.properties.$exception_fingerprint, 'production|request_error|/journey/:p/:p/:p');
  const kept = scrub({ code: 'http_5xx', route: '/x/y' });
  assert.strictEqual(kept.properties.$exception_fingerprint, 'production|http_5xx|/:p/:p');
});

// ---- T5: the longest title is accepted by the bridge and the incident script ----
const FIXTURE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'coha-s6-bridge-payload.json'), 'utf8'));
const SECRET = 'gen-secret-' + crypto.randomBytes(12).toString('hex');
function makeReq(payload) {
  const req = Readable.from([Buffer.from(JSON.stringify(payload))]);
  req.method = 'POST'; req.url = '/webhook/error-alert'; req.headers = { 'x-error-bridge-secret': SECRET };
  return req;
}
function makeRes() {
  const res = { statusCode: null, headers: {}, body: '' };
  res.done = new Promise((resolve) => { res._done = resolve; });
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.writeHead = (code, h) => { res.statusCode = code; Object.keys(h || {}).forEach((k) => { res.headers[k.toLowerCase()] = h[k]; }); };
  res.end = (b) => { res.body = b || ''; res._done(); };
  return res;
}
function makePool() {
  const rows = new Map();
  return { query: async (text, params) => {
    const t = text.replace(/\s+/g, ' ').trim();
    if (t.startsWith('CREATE TABLE')) return { rows: [], rowCount: 0 };
    if (t.startsWith('INSERT INTO production_error_issues')) { if (rows.has(params[0])) return { rows: [], rowCount: 0 }; rows.set(params[0], { status: 'pending' }); return { rows: [{ posthog_issue_id: params[0] }], rowCount: 1 }; }
    if (t.startsWith('UPDATE production_error_issues SET status')) { const r = rows.get(params[0]); if (r) { r.status = 'created'; } return { rows: [], rowCount: r ? 1 : 0 }; }
    if (t.startsWith('SELECT status FROM production_error_issues')) { const r = rows.get(params[0]); return { rows: r ? [{ status: r.status }] : [], rowCount: r ? 1 : 0 }; }
    return { rows: [], rowCount: 0 };
  } };
}

test('T5 the longest possible title is accepted by the bridge and the incident script (AC5)', async () => {
  const longestRoute = ec.routeLabel('/organisations/' + 'x/'.repeat(14));
  const longest = valueOf(scrub({ code: 'unhandled_rejection', type: 'AggregateError', route: '/organisations/' + 'x/'.repeat(14) }));
  assert.strictEqual(longest, 'unhandled_rejection: AggregateError at ' + longestRoute, 'the value is built from the scrubbed pieces');
  assert.ok(longest.length <= 120, 'under the 120-character limit: ' + longest.length);
  const created = [];
  const github = { createIssue: async (i) => { created.push(i); return { number: 1234 }; }, findIssueByMarker: async () => null };
  const payload = Object.assign({}, FIXTURE, { posthog_issue_id: crypto.randomUUID(), code: longest });
  const req = makeReq(payload); const res = makeRes();
  await bridge.handlePostErrorBridge(req, res, { log: () => {}, pool: makePool(), github, secret: SECRET, githubTimeoutMs: 500 });
  await res.done;
  assert.strictEqual(res.statusCode, 200, 'bridge answered ' + res.statusCode + ' ' + res.body);
  assert.strictEqual(created.length, 1); assert.strictEqual(created[0].title, longest);
  assert.strictEqual(incident.codeProblem(longest), null, 'the incident script accepts it');
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[eit-s1-issue-title] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();

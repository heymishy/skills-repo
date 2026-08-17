#!/usr/bin/env node
// check-si-s2-locale-preference.js — si-s2
// Verifies the timezone/date-format preference feature on the Settings
// Profile tab: src/web-ui/routes/settings.js's renderLocaleForm/
// handleGetSettings/handlePostLocalePreference, backed by two new nullable
// columns on the existing `people` table (src/web-ui/modules/user-roles.js's
// migrateTeamSchema), resolved via identity-links.js's
// resolvePersonForIdentity(pool, identityKey) -- the SAME identityKey
// handleGetSettings already computes (req.session.tenantId), per this
// story's Architecture Constraints (ADR-026 correction: people/
// person_identities, never the legacy `users` table).
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-bse-s1-billing-settings-error-banner.js) -- no Jest/Mocha.
// The fake pool below is a self-contained, narrow, explicit-branch inline
// fake -- mirrors tests/check-tir-s2-cross-provider-linking.js's own
// established convention (NOT an extension of
// src/web-ui/adapters/fake-test-db.js, which has no people.timezone/
// date_format support and whose own docstring reserves it for query shapes
// shared across many test files).
//
// AC1: form renders with sensible non-blank defaults when unset
// AC2: valid submit persists to people.timezone/date_format via resolvePersonForIdentity + shows confirmation
// AC3: reload pre-populates saved values
// AC4: invalid/empty timezone rejected 400 + field-specific message, no partial write
// AC5: resolvePersonForIdentity returns null -> clean rejection, no crash, no wrong-row write
// AC6: successful save fires a new, distinct PostHog event

'use strict';

var assert = require('assert');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  [PASS]', name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  [FAIL]', name, '--', (err && err.message) || err);
    });
}

var SETTINGS_PATH = path.resolve(ROOT, 'src/web-ui/routes/settings.js');
var POSTHOG_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'posthog-server'));

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockReq(overrides) {
  return Object.assign({
    session: {},
    sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
    query: {},
    headers: {},
    body: undefined
  }, overrides || {});
}

function mockRes() {
  var r = { statusCode: null, body: '', headers: {} };
  r.writeHead = function(code, hdrs) { r.statusCode = code; Object.assign(r.headers, hdrs || {}); };
  r.end = function(b) { r.body = (b != null ? String(b) : ''); r._ended = true; };
  return r;
}

// ── In-memory fake pool ──────────────────────────────────────────────────────
// Narrow, self-contained fake -- supports exactly the query shapes this
// story's code issues against people / team_memberships / person_identities.
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool() {
  var people = []; // { id, timezone, date_format }
  var teamMemberships = []; // { person_id, tenant_id }
  var personIdentities = []; // { identity_key, person_id }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('CREATE TABLE') === 0 || s.indexOf('ALTER TABLE') === 0) {
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var match = personIdentities.filter(function(r) { return r.identity_key === p[0]; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tm.length ? [{ person_id: tm[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT TIMEZONE, DATE_FORMAT FROM PEOPLE WHERE ID') === 0) {
      var personRow = people.filter(function(r) { return r.id === p[0]; });
      return Promise.resolve({ rows: personRow.length ? [{ timezone: personRow[0].timezone, date_format: personRow[0].date_format }] : [] });
    }

    if (s.indexOf('UPDATE PEOPLE SET TIMEZONE') === 0) {
      var target = people.filter(function(r) { return r.id === p[2]; })[0];
      if (target) {
        target.timezone = p[0];
        target.date_format = p[1];
      }
      return Promise.resolve({ rows: [], rowCount: target ? 1 : 0 });
    }

    // handleGetSettings's existing (pre-si-s2) call to getLinkedProviders --
    // no linked-provider fixtures needed for this story's own tests, so an
    // empty result is correct, not just tolerated.
    if (s.indexOf('SELECT PROVIDER FROM PERSON_IDENTITIES WHERE PERSON_ID') === 0) {
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helpers (not production query shapes) -- mirrors tir-s2's own
  // _seedPerson convention.
  function _seedPerson(id, locale) {
    people.push({ id: id, timezone: (locale && locale.timezone) || null, date_format: (locale && locale.date_format) || null });
  }
  function _seedIdentity(identityKey, personId) {
    personIdentities.push({ identity_key: identityKey, person_id: personId });
  }
  function _getPerson(id) {
    return people.filter(function(r) { return r.id === id; })[0] || null;
  }

  return { query: query, _seedPerson: _seedPerson, _seedIdentity: _seedIdentity, _getPerson: _getPerson };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — sensible non-blank defaults when unset
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1LocaleFormRendersDefaultsWhenUnset() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderLocaleForm({ timezone: null, date_format: null }, 'tok-1');

  assert.ok(/<select[^>]*id="locale-timezone"/.test(html), 'AC1: timezone selector present');
  assert.ok(/<select[^>]*id="locale-date-format"/.test(html), 'AC1: date-format selector present');
  assert.ok(/<option value="UTC" selected>/.test(html), 'AC1: timezone defaults to a sensible non-blank value (UTC)');
  assert.ok(/<option value="YYYY-MM-DD" selected>/.test(html), 'AC1: date format defaults to a sensible non-blank value (ISO)');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — PostHog capture (unit, injected spy)
// ─────────────────────────────────────────────────────────────────────────────

async function testAC6LocalePreferenceSaveFiresPostHogEvent() {
  var posthogModule = require(POSTHOG_PATH);
  var originalCapture = posthogModule.capture;
  var calls = [];
  posthogModule.capture = function(id, event, props) { calls.push({ id: id, event: event, props: props }); };

  try {
    var settings = freshRequire(SETTINGS_PATH);
    var pool = makeFakePool();
    pool._seedPerson(1, {});
    pool._seedIdentity('tenant-ph', 1);
    var handlers = settings.createSettingsHandlers(pool);

    var req = mockReq({
      session: { tenantId: 'tenant-ph', login: 'ph-user', csrfToken: 'csrf-ph' },
      body: { timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', _csrf: 'csrf-ph' }
    });
    var res = mockRes();

    await handlers.handlePostLocalePreference(req, res);

    assert.strictEqual(res.statusCode, 302, 'save succeeds (302 redirect)');
    assert.strictEqual(calls.length, 1, 'AC6: capture called exactly once');
    assert.notStrictEqual(calls[0].event, 'teammate_added_by_admin', 'AC6: uses a new, distinct event name');
    assert.ok(calls[0].event && calls[0].event.length > 0, 'AC6: event name is non-empty');
  } finally {
    posthogModule.capture = originalCapture;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — persist + confirmation banner
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2SubmitPersistsToPeopleTableViaIdentityResolution() {
  var posthogModule = require(POSTHOG_PATH);
  var originalCapture = posthogModule.capture;
  posthogModule.capture = function() {};

  try {
    var settings = freshRequire(SETTINGS_PATH);
    var pool = makeFakePool();
    pool._seedPerson(1, {});
    pool._seedIdentity('tenant-ac2', 1);
    var handlers = settings.createSettingsHandlers(pool);

    var postReq = mockReq({
      session: { tenantId: 'tenant-ac2', login: 'ac2-user', csrfToken: 'csrf-ac2' },
      body: { timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', _csrf: 'csrf-ac2' }
    });
    var postRes = mockRes();
    await handlers.handlePostLocalePreference(postReq, postRes);

    assert.strictEqual(postRes.statusCode, 302, 'AC2: redirects on success');
    var personRow = pool._getPerson(1);
    assert.strictEqual(personRow.timezone, 'America/New_York', 'AC2: timezone persisted to people row');
    assert.strictEqual(personRow.date_format, 'MM/DD/YYYY', 'AC2: date_format persisted to people row');

    // AC2: confirmation banner shown -- bse-s1's query-param -> dictionary ->
    // conditional-banner pattern, reused for a success message (not a new
    // mechanism). Follow the redirect the way a browser would.
    var location = postRes.headers.Location;
    assert.ok(location && location.indexOf('/settings') === 0, 'redirect targets /settings');
    var qsIdx = location.indexOf('?');
    var qs = qsIdx !== -1 ? new URLSearchParams(location.slice(qsIdx + 1)) : new URLSearchParams();

    var getReq = mockReq({
      session: { tenantId: 'tenant-ac2', login: 'ac2-user' },
      query: { locale: qs.get('locale') }
    });
    var getRes = mockRes();
    await handlers.handleGetSettings(getReq, getRes);

    assert.strictEqual(getRes.statusCode, 200, 'follow-up GET succeeds');
    assert.ok(getRes.body.indexOf('id="locale-success"') !== -1, 'AC2: confirmation banner present on reload');
    assert.ok(getRes.body.indexOf('saved') === -1 || getRes.body.indexOf('preferences have been saved') !== -1, 'AC2: banner shows a real confirmation message');
  } finally {
    posthogModule.capture = originalCapture;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — reload pre-populates saved values
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3ReloadPrePopulatesSavedValues() {
  var settings = freshRequire(SETTINGS_PATH);
  var pool = makeFakePool();
  pool._seedPerson(1, { timezone: 'Asia/Tokyo', date_format: 'DD/MM/YYYY' });
  pool._seedIdentity('tenant-ac3', 1);
  var handlers = settings.createSettingsHandlers(pool);

  var req = mockReq({ session: { tenantId: 'tenant-ac3', login: 'ac3-user' } });
  var res = mockRes();
  await handlers.handleGetSettings(req, res);

  assert.strictEqual(res.statusCode, 200, 'responds 200');
  assert.ok(/<option value="Asia\/Tokyo" selected>/.test(res.body), 'AC3: saved timezone pre-selected, not the default');
  assert.ok(/<option value="DD\/MM\/YYYY" selected>/.test(res.body), 'AC3: saved date format pre-selected, not the default');
  assert.ok(!/<option value="UTC" selected>/.test(res.body), 'AC3: default timezone is NOT selected when a saved value exists');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — invalid timezone rejected, no partial write
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4InvalidTimezoneRejectedNoPartialWrite() {
  var settings = freshRequire(SETTINGS_PATH);
  var pool = makeFakePool();
  pool._seedPerson(1, { timezone: null, date_format: null });
  pool._seedIdentity('tenant-ac4', 1);
  var handlers = settings.createSettingsHandlers(pool);

  var req = mockReq({
    session: { tenantId: 'tenant-ac4', login: 'ac4-user', csrfToken: 'csrf-ac4' },
    body: { timezone: 'Not/A/Real/Zone', dateFormat: 'YYYY-MM-DD', _csrf: 'csrf-ac4' }
  });
  var res = mockRes();
  await handlers.handlePostLocalePreference(req, res);

  assert.strictEqual(res.statusCode, 400, 'AC4: 400 response');
  var parsed = JSON.parse(res.body);
  assert.ok(/timezone/i.test(parsed.error), 'AC4: message names the timezone field specifically');

  var personRow = pool._getPerson(1);
  assert.strictEqual(personRow.timezone, null, 'AC4: no partial write -- timezone still null');
  assert.strictEqual(personRow.date_format, null, 'AC4: no partial write -- date_format still null');
}

async function testAC4EmptyTimezoneRejected() {
  var settings = freshRequire(SETTINGS_PATH);
  var pool = makeFakePool();
  pool._seedPerson(1, { timezone: null, date_format: null });
  pool._seedIdentity('tenant-ac4b', 1);
  var handlers = settings.createSettingsHandlers(pool);

  var req = mockReq({
    session: { tenantId: 'tenant-ac4b', login: 'ac4b-user', csrfToken: 'csrf-ac4b' },
    body: { timezone: '', dateFormat: 'YYYY-MM-DD', _csrf: 'csrf-ac4b' }
  });
  var res = mockRes();
  await handlers.handlePostLocalePreference(req, res);

  assert.strictEqual(res.statusCode, 400, 'AC4: empty timezone -> 400');
  var parsed = JSON.parse(res.body);
  assert.ok(/timezone/i.test(parsed.error), 'AC4: message names the timezone field for empty submission too');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — resolvePersonForIdentity returns null -> clean rejection
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5NullPersonResolutionRejectedCleanly() {
  var settings = freshRequire(SETTINGS_PATH);
  var pool = makeFakePool();
  // No _seedPerson / _seedIdentity call at all -- identityKey resolves to nothing.
  var handlers = settings.createSettingsHandlers(pool);

  var req = mockReq({
    session: { tenantId: 'tenant-unknown', login: 'ghost-user', csrfToken: 'csrf-ac5' },
    body: { timezone: 'America/New_York', dateFormat: 'YYYY-MM-DD', _csrf: 'csrf-ac5' }
  });
  var res = mockRes();

  // Must not throw -- AC5 explicitly requires no unhandled exception.
  await handlers.handlePostLocalePreference(req, res);

  assert.notStrictEqual(res.statusCode, 500, 'AC5: not an unhandled-exception 500');
  assert.strictEqual(res.statusCode, 400, 'AC5: clean 400 rejection');
  var parsed = JSON.parse(res.body);
  assert.ok(parsed.error, 'AC5: a clear error message is present');
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR — security: allowlist rejects a range of invalid inputs
// ─────────────────────────────────────────────────────────────────────────────

async function testNfrServerSideValidatesTimezoneAllowlist() {
  var settings = freshRequire(SETTINGS_PATH);
  var invalidValues = ['', 'Not/A/Real/Zone', '<script>alert(1)</script>', 'UTC; DROP TABLE people;'];

  for (var i = 0; i < invalidValues.length; i++) {
    var pool = makeFakePool();
    pool._seedPerson(1, { timezone: null, date_format: null });
    pool._seedIdentity('tenant-nfr-' + i, 1);
    var handlers = settings.createSettingsHandlers(pool);

    var req = mockReq({
      session: { tenantId: 'tenant-nfr-' + i, login: 'nfr-user', csrfToken: 'csrf-nfr' },
      body: { timezone: invalidValues[i], dateFormat: 'YYYY-MM-DD', _csrf: 'csrf-nfr' }
    });
    var res = mockRes();
    await handlers.handlePostLocalePreference(req, res);

    assert.strictEqual(res.statusCode, 400, 'NFR: invalid value "' + invalidValues[i] + '" rejected with 400');
    var personRow = pool._getPerson(1);
    assert.strictEqual(personRow.timezone, null, 'NFR: no write occurred for invalid value "' + invalidValues[i] + '"');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR — security: no unescaped value in rendered form (legacy/malformed data)
// ─────────────────────────────────────────────────────────────────────────────

async function testNfrNoUnescapedValueInRenderedForm() {
  var settings = freshRequire(SETTINGS_PATH);
  var malformed = '<script>alert(1)</script>';
  var html = settings.renderLocaleForm({ timezone: malformed, date_format: null }, 'tok-nfr');

  assert.ok(html.indexOf(malformed) === -1, 'NFR: raw unescaped value never appears verbatim');
  assert.ok(html.indexOf('&lt;script&gt;') !== -1, 'NFR: value is HTML-escaped when reflected');
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR — performance: save completes under 1 second (fake pool)
// ─────────────────────────────────────────────────────────────────────────────

async function testNfrSaveCompletesUnderOneSecond() {
  var posthogModule = require(POSTHOG_PATH);
  var originalCapture = posthogModule.capture;
  posthogModule.capture = function() {};

  try {
    var settings = freshRequire(SETTINGS_PATH);
    var pool = makeFakePool();
    pool._seedPerson(1, {});
    pool._seedIdentity('tenant-perf', 1);
    var handlers = settings.createSettingsHandlers(pool);

    var req = mockReq({
      session: { tenantId: 'tenant-perf', login: 'perf-user', csrfToken: 'csrf-perf' },
      body: { timezone: 'UTC', dateFormat: 'YYYY-MM-DD', _csrf: 'csrf-perf' }
    });
    var res = mockRes();

    var start = Date.now();
    await handlers.handlePostLocalePreference(req, res);
    var elapsed = Date.now() - start;

    assert.strictEqual(res.statusCode, 302, 'save succeeds');
    assert.ok(elapsed < 1000, 'NFR: save completes in under 1 second (took ' + elapsed + 'ms)');
  } finally {
    posthogModule.capture = originalCapture;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[si-s2] Running AC verification tests...\n');

  await test('AC1: locale form renders sensible non-blank defaults when unset', testAC1LocaleFormRendersDefaultsWhenUnset);
  await test('AC6: successful save fires a new, distinct PostHog event', testAC6LocalePreferenceSaveFiresPostHogEvent);
  await test('AC2: valid submit persists to people table via resolvePersonForIdentity + shows confirmation', testAC2SubmitPersistsToPeopleTableViaIdentityResolution);
  await test('AC3: reload pre-populates saved values, not defaults', testAC3ReloadPrePopulatesSavedValues);
  await test('AC4: invalid timezone rejected with 400, no partial write', testAC4InvalidTimezoneRejectedNoPartialWrite);
  await test('AC4: empty timezone rejected', testAC4EmptyTimezoneRejected);
  await test('AC5: null person resolution rejected cleanly, not a crash', testAC5NullPersonResolutionRejectedCleanly);
  await test('NFR: server-side validates timezone allowlist against a range of invalid inputs', testNfrServerSideValidatesTimezoneAllowlist);
  await test('NFR: no unescaped value in rendered form output', testNfrNoUnescapedValueInRenderedForm);
  await test('NFR: save completes under 1 second', testNfrSaveCompletesUnderOneSecond);

  console.log('\n[si-s2] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[si-s2] Unexpected error:', err);
  process.exit(1);
});

'use strict';
// check-fstf-s1-timezone-aware-slug.js -- fstf-s1: feature-slug date prefix
// uses the operator's own saved timezone (si-s2's people.timezone), falling
// back to UTC when unresolvable. Reproduces the exact real production
// incident timestamp investigated 2026-10-06.
// artefacts/2026-10-06-feature-slug-timezone-fix/stories/fstf-s1-timezone-aware-feature-slug-date.md

var assert = require('assert');
var path = require('path');

var MODULE_PATH = path.join(__dirname, '..', 'src', 'web-ui', 'modules', 'person-locale.js');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  PASS: ' + name); },
    function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); }
  );
}

function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

// Matches identity-links.js's real resolvePersonForIdentity query shapes.
function makePool(opts) {
  opts = opts || {};
  return {
    query: function(sql, params) {
      if (opts.throws) return Promise.reject(new Error('simulated DB error'));
      var s = String(sql).toUpperCase();
      if (s.indexOf('PERSON_IDENTITIES') !== -1) {
        return Promise.resolve({ rows: opts.personId != null ? [{ person_id: opts.personId }] : [] });
      }
      if (s.indexOf('TEAM_MEMBERSHIPS') !== -1) {
        return Promise.resolve({ rows: [] });
      }
      if (s.indexOf('FROM PEOPLE') !== -1) {
        return Promise.resolve({ rows: opts.personId != null ? [{ timezone: opts.timezone || null }] : [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function utcToday(date) { return date.toISOString().slice(0, 10); }

(async function() {
  var mod = freshRequire();

  // The real incident timestamp: 2026-10-04T23:09:29Z, which is
  // 2026-10-05, 12:09pm in Pacific/Auckland (UTC+13).
  var incidentDate = new Date('2026-10-04T23:09:29.104Z');

  await test('returns the operator\'s local date, not UTC, reproducing the real incident timestamp (AC1)', async function() {
    var pool = makePool({ personId: 1, timezone: 'Pacific/Auckland' });
    var result = await mod.getTenantLocalDateString(pool, 'tenant-1', incidentDate);
    assert.strictEqual(result, '2026-10-05');
    assert.notStrictEqual(result, utcToday(incidentDate));
  });

  await test('falls back to UTC when timezone is unset (AC2)', async function() {
    var pool = makePool({ personId: 1, timezone: null });
    var result = await mod.getTenantLocalDateString(pool, 'tenant-1', incidentDate);
    assert.strictEqual(result, utcToday(incidentDate));
  });

  await test('falls back to UTC when identity cannot be resolved (AC2)', async function() {
    var pool = makePool({ personId: null });
    var result = await mod.getTenantLocalDateString(pool, 'tenant-unknown', incidentDate);
    assert.strictEqual(result, utcToday(incidentDate));
  });

  await test('falls back to UTC when pool is null (AC2, e.g. NODE_ENV=test with no DATABASE_URL)', async function() {
    var result = await mod.getTenantLocalDateString(null, 'tenant-1', incidentDate);
    assert.strictEqual(result, utcToday(incidentDate));
  });

  await test('falls back to UTC when identityKey is empty (AC2)', async function() {
    var pool = makePool({ personId: 1, timezone: 'Pacific/Auckland' });
    var result = await mod.getTenantLocalDateString(pool, '', incidentDate);
    assert.strictEqual(result, utcToday(incidentDate));
  });

  await test('falls back to UTC when the query throws, never propagating (AC3)', async function() {
    var pool = makePool({ throws: true });
    var result = await mod.getTenantLocalDateString(pool, 'tenant-1', incidentDate);
    assert.strictEqual(result, utcToday(incidentDate));
  });

  await test('defaults to the real current date when no date argument is given', async function() {
    var pool = makePool({ personId: null });
    var before = new Date();
    var result = await mod.getTenantLocalDateString(pool, 'tenant-1');
    var after = new Date();
    assert.ok(result === utcToday(before) || result === utcToday(after), 'expected a real current-date fallback, got: ' + result);
  });

  // ── Call-site integration: routes/journey.js's handlePostJourney (AC1) ──
  var JOURNEY_PATH = path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'journey.js');
  var SKILLS_PATH = path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'skills.js');
  var JOURNEY_STORE_PATH = path.join(__dirname, '..', 'src', 'web-ui', 'modules', 'journey-store.js');

  function makeRes() {
    var res = { _status: null, _headers: {}, _body: '' };
    res.writeHead = function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); };
    res.setHeader = function(k, v) { res._headers[k] = v; };
    res.end = function(body) { res._body += (body || ''); };
    return res;
  }

  await test('handlePostJourney uses the timezone-aware local date for its featureSlug, reproducing the real incident (AC1, call-site integration)', async function() {
    delete require.cache[require.resolve(JOURNEY_PATH)];
    delete require.cache[require.resolve(JOURNEY_STORE_PATH)];
    var journey = require(JOURNEY_PATH);
    var journeyStore = require(JOURNEY_STORE_PATH);
    var skills = require(SKILLS_PATH);
    journeyStore._clear();

    var fakePool = makePool({ personId: 1, timezone: 'Pacific/Auckland' });
    journey.setFeatureEditsPool(fakePool);

    // No time-freezing: compute the expected date the same way the handler
    // itself will (real "now", same pool/identityKey), then confirm the
    // handler's own output matches it -- proves the call site really wires
    // the helper's result into the slug without the fragility of mocking
    // global Date (which would also affect CSRF/journey-id generation
    // inside the same handler call). The incident-specific date math
    // (2026-10-04T23:09:29Z -> 2026-10-05 in Pacific/Auckland) is already
    // directly proven above, against the real timestamp, with no handler
    // involved.
    var expectedDate = await mod.getTenantLocalDateString(fakePool, 'tenant-1');

    try {
      var req = {
        session: { accessToken: 'test-token', userId: 1, login: 'user', tenantId: 'tenant-1', csrfToken: 'test-csrf-token' },
        params: {},
        body: { featureName: 'Customer Journey As First Class', startSkill: 'discovery', _csrf: 'test-csrf-token' }
      };
      var res = makeRes();
      await journey.handlePostJourney(req, res);
      var sidMatch = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(res._headers.Location || '');
      assert.ok(sidMatch, 'expected a redirect to a new discovery session; got Location: ' + res._headers.Location);
      var session = skills._getHtmlSession(decodeURIComponent(sidMatch[1]));
      var createdJourney = journeyStore.getJourney(session.journeyId);
      assert.strictEqual(createdJourney.featureSlug, expectedDate + '-customer-journey-as-first-class',
        'expected the handler to use the same timezone-aware date as a direct helper call, got: ' + createdJourney.featureSlug);
    } finally {
      journey.setFeatureEditsPool(null);
    }
  });

  console.log('\n[fstf-s1-timezone-aware-slug] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) { failures.forEach(function(f) { console.log('  FAILED: ' + f.name); }); process.exit(1); }
})();

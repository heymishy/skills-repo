'use strict';

// tsir-s1: shared mockReq/mockRes fixture for journey.js-touching tests.
// Default session shape matches journey.js's real req.session reads
// (login, tenantId, accessToken, userId, role) -- grounded in the route
// code itself (grep -n "req\.session\." src/web-ui/routes/journey.js),
// not copied from any one of the 17 existing divergent hand-rolled mocks.
// tenantId default ('t1') matches the pre-existing value already in use
// by tests/check-ep1-s1-journey-feature-merge.js (including its own
// process.env.PLATFORM_TENANT_ID = 't1' pairing) -- deliberately not
// changed to a different synthetic value, since 't1' already satisfies
// the "non-empty, never '' or undefined" requirement (AC3/ctpl-s1).

function journeyFixture(overrides) {
  overrides = overrides || {};
  var defaultSession = {
    login: 'alice',
    tenantId: 't1',
    accessToken: 'tok-alice',
    userId: '1',
    role: 'user'
  };
  var merged = Object.assign(
    { params: {}, query: {}, body: {}, url: '/' },
    overrides
  );
  merged.session = Object.assign({}, defaultSession, overrides.session || {});
  return merged;
}

function journeyFixtureRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

module.exports = { journeyFixture: journeyFixture, journeyFixtureRes: journeyFixtureRes };

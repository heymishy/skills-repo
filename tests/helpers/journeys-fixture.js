'use strict';

// tfhc-s7: shared mockReq/mockRes fixture for journeys.js-touching tests.
// Default session shape matches journeys.js's real req.session reads --
// grounded in the route code itself (grep -n "req\.session\." src/web-ui/routes/journeys.js),
// which reads exactly one field: tenantId. Deliberately does NOT include
// csrfToken, accessToken, login, userId, or role -- journeys.js's own
// handlers never read those; csrfToken is read separately by the CSRF
// middleware wrapping CSRF-guarded routes, not by journeys.js itself,
// matching journey-fixture.js's own precedent of excluding it from the default.

function journeysFixture(overrides) {
  overrides = overrides || {};
  var defaultSession = {
    tenantId: 'org-1'
  };
  var merged = Object.assign(
    { params: {}, query: {}, body: {}, url: '/' },
    overrides
  );
  merged.session = Object.assign({}, defaultSession, overrides.session || {});
  return merged;
}

function journeysFixtureRes() {
  var _status = null;
  var _body = null;
  var _headers = null;
  return {
    writeHead: function(code, headers) { _status = code; _headers = headers; },
    end: function(body) { _body = body; },
    _get: function() { return { status: _status, body: _body, headers: _headers }; }
  };
}

module.exports = { journeysFixture: journeysFixture, journeysFixtureRes: journeysFixtureRes };

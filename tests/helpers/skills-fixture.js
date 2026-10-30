'use strict';

// tfhc-s3: shared mockReq/mockRes fixture for skills.js-touching tests.
// Default session shape matches skills.js's real req.session reads
// (login, tenantId, accessToken, userId, role) -- grounded in the route
// code itself (grep -n "req\.session\." src/web-ui/routes/skills.js),
// independently re-confirmed rather than copied from journey.js's own
// fixture, even though the field set happens to be identical.

function skillsFixture(overrides) {
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

function skillsFixtureRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

module.exports = { skillsFixture: skillsFixture, skillsFixtureRes: skillsFixtureRes };

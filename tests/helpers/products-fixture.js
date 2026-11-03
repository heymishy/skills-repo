'use strict';

// fhff-s3: shared mockReq/mockRes fixture for products.js-touching tests.
// Default session shape matches products.js's real req.session reads --
// grounded in the route code itself via:
//   grep -n "req\.session\." src/web-ui/routes/products.js
// which confirms the real fields read are tenantId, login, accessToken,
// userId, plan, and impersonation. products.js never reads req.session.role
// or req.session.csrfToken, so neither field is included here (deliberately
// different from journey-fixture.js's default session, which does include
// role -- that field is real for journey.js, not for products.js).
// Same shape/convention as tests/helpers/journey-fixture.js's
// journeyFixture/journeyFixtureRes.

function productsFixture(overrides) {
  overrides = overrides || {};
  var defaultSession = {
    tenantId: 'org-1',
    login: 'alice',
    accessToken: 'tok-alice',
    userId: '1',
    plan: null,
    impersonation: null
  };
  var merged = Object.assign(
    { params: {}, query: {}, body: {}, url: '/' },
    overrides
  );
  merged.session = Object.assign({}, defaultSession, overrides.session || {});
  return merged;
}

function productsFixtureRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

module.exports = { productsFixture: productsFixture, productsFixtureRes: productsFixtureRes };

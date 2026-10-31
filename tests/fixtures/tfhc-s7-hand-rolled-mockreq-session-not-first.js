// Non-compliant example fixture for tfhc-s7's own tests: requires journeys.js
// and uses an ad-hoc inline session literal where `session` is NOT the first
// key in the object literal -- this is the exact blind-spot shape the regex
// fix in 480aa194 addressed, so this fixture must NOT use a mockReq()
// function and must keep `params` before `session`.
'use strict';
var journeysRoutes = require('../../src/web-ui/routes/journeys');

var req = { params: { id: 'j1' }, session: { tenantId: 't1' } };

module.exports = { req: req };

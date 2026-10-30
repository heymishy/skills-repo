// Non-compliant example fixture for tfhc-s7's own tests: requires journeys.js
// and uses an ad-hoc inline session literal instead of the shared fixture --
// this is the real pattern tfhc-s5's spike found (0 of 30 consumers use even
// a local factory function, unlike journey.js's/skills.js's own hand-rolled
// mockReq precedent), so this fixture must NOT use a mockReq() function.
'use strict';
var journeysRoutes = require('../../src/web-ui/routes/journeys');

var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };

module.exports = { req: req };

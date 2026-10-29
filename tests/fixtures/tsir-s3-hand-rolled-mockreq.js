// Non-compliant example fixture for tsir-s3's own tests: requires journey.js
// and defines its own local mockReq instead of using the shared fixture.
'use strict';
var journeyRoutes = require('../../src/web-ui/routes/journey');

function mockReq(overrides) {
  return Object.assign({ session: { tenantId: 't1' } }, overrides || {});
}

module.exports = { mockReq: mockReq };

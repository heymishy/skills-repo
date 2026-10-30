// Non-compliant example fixture for tfhc-s3's own tests: requires skills.js
// and defines its own local mockReq instead of using the shared fixture.
'use strict';
var skillsRoutes = require('../../src/web-ui/routes/skills');

function mockReq(overrides) {
  return Object.assign({ session: { tenantId: 't1' } }, overrides || {});
}

module.exports = { mockReq: mockReq };

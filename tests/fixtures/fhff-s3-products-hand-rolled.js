// Non-compliant example fixture for fhff-s3's own tests: requires products.js
// and defines its own local mockReq instead of using the shared fixture.
'use strict';
var productsRoutes = require('../../src/web-ui/routes/products');

function mockReq(overrides) {
  return Object.assign({ session: { tenantId: 'org-1' } }, overrides || {});
}

module.exports = { mockReq: mockReq };

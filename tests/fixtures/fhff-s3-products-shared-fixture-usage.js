// Compliant example fixture for fhff-s3's own tests: requires products.js and
// correctly uses the shared fixture module instead of hand-rolling.
'use strict';
var productsRoutes = require('../../src/web-ui/routes/products');
var productsFixture = require('../helpers/products-fixture').productsFixture;

var req = productsFixture();

module.exports = { req: req };

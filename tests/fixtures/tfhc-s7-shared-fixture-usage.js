// Compliant example fixture for tfhc-s7's own tests: requires journeys.js
// and correctly uses the shared fixture module instead of hand-rolling.
'use strict';
var journeysRoutes = require('../../src/web-ui/routes/journeys');
var journeysFixture = require('../helpers/journeys-fixture').journeysFixture;

var req = journeysFixture();

module.exports = { req: req };

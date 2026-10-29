// Compliant example fixture for tsir-s3's own tests: requires journey.js and
// correctly uses the shared fixture module from tsir-s1 instead of hand-rolling.
'use strict';
var journeyRoutes = require('../../src/web-ui/routes/journey');
var journeyFixture = require('../helpers/journey-fixture').journeyFixture;

var req = journeyFixture();

module.exports = { req: req };

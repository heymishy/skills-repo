// Compliant example fixture for tfhc-s3's own tests: requires skills.js and
// correctly uses the shared fixture module instead of hand-rolling.
'use strict';
var skillsRoutes = require('../../src/web-ui/routes/skills');
var skillsFixture = require('../helpers/skills-fixture').skillsFixture;

var req = skillsFixture();

module.exports = { req: req };

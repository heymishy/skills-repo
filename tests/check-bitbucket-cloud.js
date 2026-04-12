#!/usr/bin/env node
/**
 * check-bitbucket-cloud.js
 *
 * Automated tests for Bitbucket Cloud pipeline validation.
 * Implements tests from the test plan for story p2.10:
 *
 *   Unit tests (AC1 — YAML syntax validation):
 *   - valid-pipelines-yml-passes-syntax-check
 *   - malformed-yaml-fails-with-parse-error
 *
 *   Unit tests (AC2 — pipeline-shape validation):
 *   - missing-assurance-gate-step-detected-not-false-pass
 *   - pipelines-yml-with-gate-step-passes
 *
 *   Unit tests (AC6 — Cloud/DC isolation):
 *   - cloud-path-makes-no-dc-auth-calls
 *   - dc-module-makes-no-cloud-api-calls
 *
 *   Unit tests (AC7 — Docker Compose deliverable):
 *   - docker-compose-file-exists-at-declared-path
 *
 * Run:  node tests/check-bitbucket-cloud.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var root          = path.join(__dirname, '..');
var cloudValidator = require(path.join(root, 'src', 'bitbucket-cloud-validator', 'index.js'));

var fixturesDir   = path.join(__dirname, 'fixtures');
var validFixture  = path.join(fixturesDir, 'bitbucket-pipelines-valid.yml');
var missingGateFixture = path.join(fixturesDir, 'bitbucket-pipelines-missing-gate.yml');
var malformedFixture   = path.join(fixturesDir, 'bitbucket-pipelines-malformed.yml');
var dockerComposePath  = path.join(fixturesDir, 'docker-compose.bitbucket-dc.yml');

// ── Helpers ───────────────────────────────────────────────────────────────────

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name: name, reason: reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

process.stdout.write('[bitbucket-cloud-check] Running p2.10 Bitbucket Cloud validation tests\u2026\n\n');

// ── Unit: AC1 — YAML syntax validation ───────────────────────────────────────

process.stdout.write('  Unit: AC1 \u2014 YAML syntax validation\n');

// valid-pipelines-yml-passes-syntax-check
{
  var testName = 'valid-pipelines-yml-passes-syntax-check';
  try {
    if (!fs.existsSync(validFixture)) {
      fail(testName, 'Fixture not found: ' + validFixture);
    } else {
      var content = fs.readFileSync(validFixture, 'utf8');
      var result  = cloudValidator.validateYamlSyntax(content);
      if (!result.valid) {
        fail(testName, 'Expected valid YAML but got error: ' + result.error);
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// malformed-yaml-fails-with-parse-error
{
  var testName = 'malformed-yaml-fails-with-parse-error';
  try {
    if (!fs.existsSync(malformedFixture)) {
      fail(testName, 'Fixture not found: ' + malformedFixture);
    } else {
      var content = fs.readFileSync(malformedFixture, 'utf8');
      var result  = cloudValidator.validateYamlSyntax(content);
      if (result.valid) {
        fail(testName, 'Expected syntax error but validator returned valid:true (false pass)');
      } else if (result.errorType !== 'yaml-syntax-error') {
        fail(testName, 'Expected errorType "yaml-syntax-error" but got "' + result.errorType + '"');
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── Unit: AC2 — pipeline-shape validation ─────────────────────────────────────

process.stdout.write('\n  Unit: AC2 \u2014 pipeline-shape validation\n');

// missing-assurance-gate-step-detected-not-false-pass
{
  var testName = 'missing-assurance-gate-step-detected-not-false-pass';
  try {
    if (!fs.existsSync(missingGateFixture)) {
      fail(testName, 'Fixture not found: ' + missingGateFixture);
    } else {
      var content = fs.readFileSync(missingGateFixture, 'utf8');

      // First confirm the YAML itself is valid (so any failure is shape-related)
      var syntaxResult = cloudValidator.validateYamlSyntax(content);
      if (!syntaxResult.valid) {
        fail(testName, 'Pre-condition failed: missing-gate fixture has YAML syntax error: ' + syntaxResult.error);
      } else {
        var shapeResult = cloudValidator.checkPipelineShape(content);
        if (shapeResult.valid) {
          fail(testName, 'Shape check returned valid:true for a pipeline missing the assurance gate step (false pass)');
        } else if (shapeResult.errorType !== 'pipeline-shape-error') {
          fail(testName, 'Expected errorType "pipeline-shape-error" but got "' + shapeResult.errorType + '"');
        } else if (!shapeResult.error || !shapeResult.error.includes('assurance gate step missing')) {
          fail(testName, 'Error message should name the missing step; got: "' + shapeResult.error + '"');
        } else {
          pass(testName);
        }
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// pipelines-yml-with-gate-step-passes
{
  var testName = 'pipelines-yml-with-gate-step-passes';
  try {
    if (!fs.existsSync(validFixture)) {
      fail(testName, 'Fixture not found: ' + validFixture);
    } else {
      var content = fs.readFileSync(validFixture, 'utf8');
      var result  = cloudValidator.checkPipelineShape(content);
      if (!result.valid) {
        fail(testName, 'Shape check failed for pipeline with assurance gate step: ' + result.error);
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── Unit: AC6 — Cloud/DC isolation ───────────────────────────────────────────

process.stdout.write('\n  Unit: AC6 \u2014 Cloud/DC isolation\n');

// cloud-path-makes-no-dc-auth-calls
// Verifies that the Cloud validator module does not import or invoke the DC
// validator module or any DC-only auth functions — structural isolation check.
// AC6: a Cloud test run makes zero DC auth calls.
{
  var testName = 'cloud-path-makes-no-dc-auth-calls';
  try {
    var cloudModulePath = path.join(root, 'src', 'bitbucket-cloud-validator', 'index.js');
    var cloudSource     = fs.readFileSync(cloudModulePath, 'utf8');

    // DC-specific identifiers that must NOT appear in the Cloud module's code.
    // Note: BB_APP_PASSWORD/OAUTH_KEY/OAUTH_SECRET are shared config key names
    // (used in both Cloud and DC config readers per ADR-004) and are not listed
    // here. SSH_PRIVATE_KEY is DC-only (SSH auth is a DC topology test only).
    var dcOnlyIdentifiers = [
      'bitbucket-dc-validator',   // DC module import
      'testAppPasswordAuth',       // DC auth function
      'testOAuthAuth',             // DC auth function
      'testSshKeyAuth',            // DC auth function
      'isDcAvailable',             // DC availability check
      'SSH_PRIVATE_KEY',           // SSH auth — DC-only topology
    ];

    // Check non-comment lines only
    var nonCommentLines = cloudSource.split('\n').filter(function (line) {
      var t = line.trim();
      return !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('#');
    });

    var violations = dcOnlyIdentifiers.filter(function (id) {
      return nonCommentLines.some(function (line) { return line.includes(id); });
    });

    if (violations.length > 0) {
      fail(testName, 'Cloud module references DC-only identifiers: ' + violations.join(', '));
    } else {
      // Also verify running Cloud validation does not trigger DC auth: run
      // validateCloudPipeline and confirm it is a pure synchronous function
      // (no Promises, no network calls).
      var content = fs.readFileSync(validFixture, 'utf8');
      var result  = cloudValidator.validateCloudPipeline(content);
      if (typeof result !== 'object' || result === null) {
        fail(testName, 'validateCloudPipeline did not return an object');
      } else if (typeof result.then === 'function') {
        fail(testName, 'validateCloudPipeline returned a Promise — Cloud path must be synchronous (no async DC calls)');
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// dc-module-makes-no-cloud-api-calls
// Verifies that the DC validator module does not import or reference the Cloud
// validator module — structural isolation check (viewed from the Cloud test file).
{
  var testName = 'dc-module-makes-no-cloud-api-calls';
  try {
    var dcModulePath = path.join(root, 'src', 'bitbucket-dc-validator', 'index.js');
    var dcSource     = fs.readFileSync(dcModulePath, 'utf8');

    // Check that the DC module does not reference Cloud-specific identifiers
    var cloudIdentifiers = [
      'bitbucket-cloud-validator',
      'validateYamlSyntax',
      'checkPipelineShape',
      'validateCloudPipeline',
    ];

    // Exclude lines that are purely comments
    var nonCommentLines = dcSource.split('\n').filter(function (line) {
      return !line.trim().startsWith('*') && !line.trim().startsWith('//');
    });

    var violations = cloudIdentifiers.filter(function (id) {
      return nonCommentLines.some(function (line) { return line.includes(id); });
    });

    if (violations.length > 0) {
      fail(testName, 'DC module references Cloud-specific identifiers: ' + violations.join(', '));
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── Unit: AC7 — Docker Compose deliverable ───────────────────────────────────

process.stdout.write('\n  Unit: AC7 \u2014 Docker Compose deliverable\n');

// docker-compose-file-exists-at-declared-path
{
  var testName = 'docker-compose-file-exists-at-declared-path';
  try {
    if (!fs.existsSync(dockerComposePath)) {
      fail(testName, 'docker-compose.bitbucket-dc.yml not found at declared path: ' + dockerComposePath);
    } else {
      var composeContent = fs.readFileSync(dockerComposePath, 'utf8');

      // Verify it has a services block
      var hasServices = composeContent.includes('services:');
      if (!hasServices) {
        fail(testName, 'docker-compose.bitbucket-dc.yml does not contain a "services:" block');
        return;
      }

      // Verify no credential literals — all secret values must be env-var references
      var credentialLiteralPatterns = [
        /password:\s+[^$\n{][^\n]{3,}/i,
        /secret:\s+[^$\n{][^\n]{3,}/i,
        /private_key:\s+[^$\n{][^\n]{3,}/i,
      ];
      var credentialViolations = credentialLiteralPatterns.filter(function (pattern) {
        // Exclude lines that are comments
        return composeContent.split('\n').some(function (line) {
          return !line.trim().startsWith('#') && pattern.test(line);
        });
      });

      if (credentialViolations.length > 0) {
        fail(testName, 'docker-compose.bitbucket-dc.yml contains potential credential literals (MC-SEC-02)');
      } else {
        // Verify the file is valid YAML (no tab indentation)
        var yamlResult = cloudValidator.validateYamlSyntax(composeContent);
        if (!yamlResult.valid) {
          fail(testName, 'docker-compose.bitbucket-dc.yml has YAML syntax error: ' + yamlResult.error);
        } else {
          pass(testName);
        }
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[bitbucket-cloud-check] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failed > 0) {
  process.stdout.write('\n  Failures:\n');
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write('    \u2717 ' + failures[i].name + ': ' + failures[i].reason + '\n');
  }
  process.exit(1);
}

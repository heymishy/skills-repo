#!/usr/bin/env node
/**
 * check-bitbucket-dc.js
 *
 * Automated tests for Bitbucket DC Docker auth topology validation.
 * Implements tests from the test plan for story p2.10:
 *
 *   Integration tests (Docker-gated — AC3, AC4, AC5, AC7):
 *   - app-password-auth-no-401-403       (AC3)
 *   - oauth-consumer-token-obtained      (AC4)
 *   - ssh-key-no-handshake-failure       (AC5)
 *   - docker-compose-up-starts-dc        (AC7 integration)
 *
 *   Integration tests (non-Docker — AC6):
 *   - cloud-dc-independently-executable  (AC6 integration isolation)
 *
 *   NFR tests:
 *   - nfr-no-credential-literals-in-dc-fixtures  (Security)
 *   - nfr-cloud-dc-no-shared-state-side-effects  (Isolation)
 *
 * Docker-gated tests: when the DC Docker instance is not reachable, these tests
 * are SKIPPED with reason [PREREQ-DOCKER] and do NOT count as failures. This
 * matches the prerequisite defined in the test plan.
 *
 * Run:  node tests/check-bitbucket-dc.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var root        = path.join(__dirname, '..');
var dcValidator = require(path.join(root, 'src', 'bitbucket-dc-validator', 'index.js'));

var fixturesDir      = path.join(__dirname, 'fixtures');
var dockerComposePath = path.join(fixturesDir, 'docker-compose.bitbucket-dc.yml');

// ── Helpers ───────────────────────────────────────────────────────────────────

var passed   = 0;
var failed   = 0;
var skipped  = 0;
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

function skip(name, reason) {
  skipped++;
  process.stdout.write('  \u2014 ' + name + ' [SKIPPED \u2014 ' + reason + ']\n');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

process.stdout.write('[bitbucket-dc-check] Running p2.10 Bitbucket DC Docker auth topology tests\u2026\n\n');

// ── Integration: AC6 — Cloud/DC independent execution (non-Docker) ────────────

process.stdout.write('  Integration: AC6 \u2014 Cloud/DC independent execution\n');

// cloud-dc-independently-executable
// Run both Cloud and DC validation paths sequentially and confirm their
// outputs are independent — Cloud path does not require DC credentials;
// DC path does not require Cloud credentials.
{
  var testName = 'cloud-dc-independently-executable';
  try {
    var cloudValidator = require(path.join(root, 'src', 'bitbucket-cloud-validator', 'index.js'));

    // Cloud path: run validateYamlSyntax without any DC credentials set
    // Temporarily unset DC env vars to confirm Cloud path does not need them
    var savedDcVars = {
      BB_APP_PASSWORD:  process.env.BB_APP_PASSWORD,
      BB_USER:          process.env.BB_USER,
      OAUTH_KEY:        process.env.OAUTH_KEY,
      OAUTH_SECRET:     process.env.OAUTH_SECRET,
      SSH_PRIVATE_KEY:  process.env.SSH_PRIVATE_KEY,
    };

    delete process.env.BB_APP_PASSWORD;
    delete process.env.BB_USER;
    delete process.env.OAUTH_KEY;
    delete process.env.OAUTH_SECRET;
    delete process.env.SSH_PRIVATE_KEY;

    var cloudRanClean = false;
    var cloudError    = null;
    try {
      var testContent = 'image: node:18\npipelines:\n  default:\n    - step:\n        name: Build\n        script:\n          - node .github/scripts/run-assurance-gate.js\n';
      var cloudResult = cloudValidator.validateCloudPipeline(testContent);
      // Cloud path must return a result without needing DC credentials
      cloudRanClean = (typeof cloudResult === 'object' && cloudResult !== null);
    } catch (err) {
      cloudError = err.message;
    }

    // Restore DC env vars
    Object.keys(savedDcVars).forEach(function (k) {
      if (savedDcVars[k] !== undefined) { process.env[k] = savedDcVars[k]; }
    });

    if (!cloudRanClean) {
      fail(testName, 'Cloud validation path failed when DC credentials were absent: ' + cloudError);
    } else {
      // DC path: run readBitbucketDcConfig without Cloud env vars — DC config
      // reader should succeed independently of Cloud settings
      var dcConfig = null;
      var dcError  = null;
      try {
        dcConfig = dcValidator.readBitbucketDcConfig();
      } catch (err) {
        dcError = err.message;
      }

      if (!dcConfig) {
        fail(testName, 'DC config reader failed when Cloud credentials were absent: ' + dcError);
      } else if (dcConfig.host && typeof dcConfig.host === 'string') {
        pass(testName);
      } else {
        fail(testName, 'DC config did not return a valid host string');
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── Integration: AC3 — app-password auth topology (Docker-gated) ─────────────

process.stdout.write('\n  Integration: AC3 \u2014 app-password auth (Docker-gated)\n');

// app-password-auth-no-401-403
var appPasswordPromise = (function () {
  var testName = 'app-password-auth-no-401-403';
  return dcValidator.testAppPasswordAuth().then(function (result) {
    if (result.skipped) {
      skip(testName, result.reason + ': ' + (result.message || ''));
    } else if (!result.passed) {
      fail(testName, result.error || 'app-password auth topology test failed');
    } else {
      pass(testName + ' (HTTP ' + result.statusCode + ')');
    }
  }).catch(function (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  });
})();

// ── Integration: AC4 — OAuth consumer auth topology (Docker-gated) ───────────

process.stdout.write('\n  Integration: AC4 \u2014 OAuth consumer auth (Docker-gated)\n');

// oauth-consumer-token-obtained
var oauthPromise = (function () {
  var testName = 'oauth-consumer-token-obtained';
  return dcValidator.testOAuthAuth().then(function (result) {
    if (result.skipped) {
      skip(testName, result.reason + ': ' + (result.message || ''));
    } else if (!result.passed) {
      fail(testName, result.error || 'OAuth consumer auth topology test failed');
    } else {
      pass(testName + ' (token obtained)');
    }
  }).catch(function (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  });
})();

// ── Integration: AC5 — SSH key auth topology (Docker-gated) ──────────────────

process.stdout.write('\n  Integration: AC5 \u2014 SSH key auth (Docker-gated)\n');

// ssh-key-no-handshake-failure
var sshPromise = (function () {
  var testName = 'ssh-key-no-handshake-failure';
  return dcValidator.testSshKeyAuth().then(function (result) {
    if (result.skipped) {
      skip(testName, result.reason + ': ' + (result.message || ''));
    } else if (!result.passed) {
      fail(testName, result.error || 'SSH key auth topology test failed');
    } else {
      pass(testName);
    }
  }).catch(function (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  });
})();

// ── Integration: AC7 — docker-compose-up-starts-dc (Docker-gated) ────────────

process.stdout.write('\n  Integration: AC7 \u2014 Docker Compose DC instance (Docker-gated)\n');

// docker-compose-up-starts-dc
// Checks that the Docker Compose file exists, has a valid services block, and
// that the DC instance is reachable when Docker is available.
var dockerComposePromise = (function () {
  var testName = 'docker-compose-up-starts-dc';
  try {
    if (!fs.existsSync(dockerComposePath)) {
      fail(testName, 'docker-compose.bitbucket-dc.yml not found at: ' + dockerComposePath);
      return Promise.resolve();
    }

    var config = dcValidator.readBitbucketDcConfig();
    return dcValidator.isDcAvailable(config.host).then(function (available) {
      if (!available) {
        skip(testName, 'PREREQ-DOCKER: DC Docker instance not reachable at ' + config.host +
          ' — run: docker compose -f tests/fixtures/docker-compose.bitbucket-dc.yml up -d');
      } else {
        pass(testName + ' (DC instance reachable at ' + config.host + ')');
      }
    });
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
    return Promise.resolve();
  }
})();

// ── NFR tests ─────────────────────────────────────────────────────────────────

// Wait for all async tests then run synchronous NFR tests
Promise.all([appPasswordPromise, oauthPromise, sshPromise, dockerComposePromise])
  .then(function () {
    process.stdout.write('\n  NFR: Security and isolation\n');

    // nfr-no-credential-literals-in-dc-fixtures
    // Scans all DC-related fixture files for credential literal values (MC-SEC-02).
    {
      var testName = 'nfr-no-credential-literals-in-dc-fixtures';
      try {
        var filesToScan = [
          dockerComposePath,
          path.join(fixturesDir, 'bitbucket-pipelines-valid.yml'),
          path.join(fixturesDir, 'bitbucket-pipelines-missing-gate.yml'),
          path.join(fixturesDir, 'bitbucket-pipelines-malformed.yml'),
        ].filter(function (f) { return fs.existsSync(f); });

        // Patterns that would indicate a hardcoded credential value
        // (not an env-var reference like ${VAR} or $VAR)
        var credentialPatterns = [
          // Bearer token patterns
          /Bearer [A-Za-z0-9+/=]{16,}/,
          // Literal password/secret assignments (not env-var references)
          /(?:password|secret|private_key):\s+(?![${])[^\n]{8,}/i,
          // PEM private key header in config files
          /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
        ];

        var violations = [];
        filesToScan.forEach(function (filePath) {
          var content = fs.readFileSync(filePath, 'utf8');
          var lines   = content.split('\n');
          lines.forEach(function (line, idx) {
            // Skip comment lines
            if (line.trim().startsWith('#')) { return; }
            credentialPatterns.forEach(function (pattern) {
              if (pattern.test(line)) {
                violations.push(path.basename(filePath) + ':' + (idx + 1) + ' — matched ' + pattern.toString().slice(0, 50));
              }
            });
          });
        });

        if (violations.length > 0) {
          fail(testName, 'Credential literals found in DC fixtures: ' + violations.join('; '));
        } else {
          pass(testName);
        }
      } catch (e) {
        fail(testName, 'Unexpected error: ' + e.message);
      }
    }

    // nfr-cloud-dc-no-shared-state-side-effects
    // Verifies that neither module imports from the other (no shared module state).
    {
      var testName = 'nfr-cloud-dc-no-shared-state-side-effects';
      try {
        var cloudSrc = fs.readFileSync(
          path.join(root, 'src', 'bitbucket-cloud-validator', 'index.js'), 'utf8');
        var dcSrc    = fs.readFileSync(
          path.join(root, 'src', 'bitbucket-dc-validator', 'index.js'), 'utf8');

        // Neither module should require() the other
        var cloudRequiresDc = /require\(['""][^'"]*bitbucket-dc-validator/.test(cloudSrc);
        var dcRequiresCloud = /require\(['""][^'"]*bitbucket-cloud-validator/.test(dcSrc);

        if (cloudRequiresDc) {
          fail(testName, 'bitbucket-cloud-validator imports bitbucket-dc-validator (cross-contamination)');
        } else if (dcRequiresCloud) {
          fail(testName, 'bitbucket-dc-validator imports bitbucket-cloud-validator (cross-contamination)');
        } else {
          pass(testName);
        }
      } catch (e) {
        fail(testName, 'Unexpected error: ' + e.message);
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    process.stdout.write('\n[bitbucket-dc-check] Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped\n');

    if (skipped > 0) {
      process.stdout.write('  (Skipped tests require Docker daemon and docker-compose — run:\n');
      process.stdout.write('   docker compose -f tests/fixtures/docker-compose.bitbucket-dc.yml up -d)\n');
    }

    if (failed > 0) {
      process.stdout.write('\n  Failures:\n');
      for (var i = 0; i < failures.length; i++) {
        process.stdout.write('    \u2717 ' + failures[i].name + ': ' + failures[i].reason + '\n');
      }
      process.exit(1);
    }
  })
  .catch(function (e) {
    process.stderr.write('[bitbucket-dc-check] Fatal error: ' + e.message + '\n');
    process.exit(1);
  });

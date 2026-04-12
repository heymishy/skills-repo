#!/usr/bin/env node
/**
 * bitbucket-dc-validator/index.js
 *
 * Bitbucket Data Center Docker auth topology test runner.
 * Implements story p2.10: Bitbucket CI validation — DC Docker auth topology.
 *
 * Functions:
 *   testAppPasswordAuth(options)  — app-password auth topology test (AC3)
 *   testOAuthAuth(options)        — OAuth consumer auth topology test (AC4)
 *   testSshKeyAuth(options)       — SSH key auth topology test (AC5)
 *   readBitbucketDcConfig(path)   — reads DC config from context.yml (ADR-004)
 *   isDcAvailable(host)           — checks if local DC Docker instance is reachable
 *
 * Isolation guarantee (AC6):
 *   This module contains ONLY DC auth topology logic. It makes zero Cloud
 *   YAML-parsing API calls and imports nothing from bitbucket-cloud-validator.
 *   A DC validation run must not call Bitbucket Cloud endpoints.
 *
 * Auth secrets are read EXCLUSIVELY from environment variables (MC-SEC-02):
 *   BB_APP_PASSWORD  — app password credential
 *   BB_USER          — Bitbucket username
 *   OAUTH_KEY        — OAuth consumer key
 *   OAUTH_SECRET     — OAuth consumer secret
 *   SSH_PRIVATE_KEY  — SSH private key (PEM format)
 *
 * Docker prerequisite:
 *   AC3, AC4, AC5 require a running local Bitbucket DC Docker instance
 *   (started via docker compose -f tests/fixtures/docker-compose.bitbucket-dc.yml up).
 *   When the instance is unreachable, tests are skipped with reason PREREQ-DOCKER.
 *
 * Run:  node src/bitbucket-dc-validator/index.js
 * Used: tests/check-bitbucket-dc.js
 *
 * Zero external dependencies — plain Node.js (fs, path, http, net).
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var http = require('http');
var net  = require('net');

// ── Config reader (ADR-004) ───────────────────────────────────────────────────

/**
 * Read Bitbucket DC configuration from context.yml.
 * All DC-specific identifiers (host, secret var names) must be stored here —
 * no hardcoded values in this module (ADR-004).
 *
 * @param {string} [contextYmlPath] - Path to context.yml
 * @returns {{
 *   host:             string,
 *   userEnv:          string,
 *   appPasswordEnv:   string,
 *   oauthKeyEnv:      string,
 *   oauthSecretEnv:   string,
 *   sshPrivateKeyEnv: string,
 *   sshPort:          number,
 * }}
 */
function readBitbucketDcConfig(contextYmlPath) {
  var resolvedPath = contextYmlPath ||
    path.join(__dirname, '..', '..', '.github', 'context.yml');

  var content = fs.readFileSync(resolvedPath, 'utf8');
  var config  = {
    host:             'http://localhost:7990',
    userEnv:          'BB_USER',
    appPasswordEnv:   'BB_APP_PASSWORD',
    oauthKeyEnv:      'OAUTH_KEY',
    oauthSecretEnv:   'OAUTH_SECRET',
    sshPrivateKeyEnv: 'SSH_PRIVATE_KEY',
    sshPort:          7999,
  };

  var inBitbucket = false;
  var inDc        = false;
  var bbIndent    = -1;
  var dcIndent    = -1;

  var lines = content.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var raw     = lines[i].replace(/\s*#.*$/, '').trimEnd();
    if (raw.trim() === '') { continue; }

    var indent  = raw.match(/^(\s*)/)[1].length;
    var trimmed = raw.trim();

    if (!inBitbucket) {
      if (trimmed === 'bitbucket:') {
        inBitbucket = true;
        bbIndent    = indent;
      }
      continue;
    }

    if (indent <= bbIndent && trimmed !== '') {
      inBitbucket = false;
      inDc        = false;
      continue;
    }

    if (!inDc) {
      if (trimmed === 'dc:') {
        inDc     = true;
        dcIndent = indent;
      }
      continue;
    }

    if (indent <= dcIndent && trimmed !== '') {
      inDc = false;
      continue;
    }

    var colonIdx = trimmed.indexOf(':');
    if (colonIdx < 0) { continue; }
    var key = trimmed.slice(0, colonIdx).trim();
    var val = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key === 'host')               { config.host             = val; }
    if (key === 'user_env')           { config.userEnv          = val; }
    if (key === 'app_password_env')   { config.appPasswordEnv   = val; }
    if (key === 'oauth_key_env')      { config.oauthKeyEnv      = val; }
    if (key === 'oauth_secret_env')   { config.oauthSecretEnv   = val; }
    if (key === 'ssh_private_key_env'){ config.sshPrivateKeyEnv = val; }
    if (key === 'ssh_port')           { config.sshPort          = parseInt(val, 10) || 7999; }
  }

  return config;
}

// ── DC availability check ─────────────────────────────────────────────────────

/**
 * Check whether a local Bitbucket DC Docker instance is reachable.
 * Attempts a TCP connection to the host's HTTP port. Returns a Promise that
 * resolves to true if reachable within the timeout, false otherwise.
 *
 * @param {string} dcHost  - DC host URL (e.g. 'http://localhost:7990')
 * @param {number} [timeoutMs] - Connection timeout in ms (default: 2000)
 * @returns {Promise<boolean>}
 */
function isDcAvailable(dcHost, timeoutMs) {
  var timeout = timeoutMs || 2000;
  return new Promise(function (resolve) {
    try {
      var urlObj = new (require('url').URL)(dcHost);
      var host   = urlObj.hostname;
      var port   = parseInt(urlObj.port, 10) || (urlObj.protocol === 'https:' ? 443 : 80);

      var socket = new net.Socket();
      var settled = false;

      socket.setTimeout(timeout);
      socket.on('connect', function () {
        if (!settled) { settled = true; socket.destroy(); resolve(true); }
      });
      socket.on('timeout', function () {
        if (!settled) { settled = true; socket.destroy(); resolve(false); }
      });
      socket.on('error', function () {
        if (!settled) { settled = true; resolve(false); }
      });
      socket.connect(port, host);
    } catch (_) {
      resolve(false);
    }
  });
}

// ── Auth topology helpers ─────────────────────────────────────────────────────

/**
 * Perform an HTTP GET request and return a Promise resolving to
 * { statusCode, body, error? }.
 */
function httpGet(url, headers) {
  return new Promise(function (resolve) {
    try {
      var urlObj = new (require('url').URL)(url);
      var options = {
        hostname: urlObj.hostname,
        port:     parseInt(urlObj.port, 10) || 80,
        path:     urlObj.pathname + (urlObj.search || ''),
        method:   'GET',
        headers:  headers || {},
      };
      var req = http.request(options, function (res) {
        var body = '';
        res.on('data', function (chunk) { body += chunk; });
        res.on('end', function () {
          resolve({ statusCode: res.statusCode, body: body });
        });
      });
      req.on('error', function (err) {
        resolve({ statusCode: null, body: '', error: err.message });
      });
      req.setTimeout(5000, function () {
        req.destroy();
        resolve({ statusCode: null, body: '', error: 'Request timeout' });
      });
      req.end();
    } catch (err) {
      resolve({ statusCode: null, body: '', error: err.message });
    }
  });
}

/**
 * Perform an HTTP POST request and return a Promise resolving to
 * { statusCode, body, error? }.
 */
function httpPost(url, headers, postBody) {
  return new Promise(function (resolve) {
    try {
      var urlObj = new (require('url').URL)(url);
      var bodyBuf = Buffer.from(postBody || '', 'utf8');
      var options = {
        hostname:        urlObj.hostname,
        port:            parseInt(urlObj.port, 10) || 80,
        path:            urlObj.pathname + (urlObj.search || ''),
        method:          'POST',
        headers:         Object.assign({ 'Content-Length': bodyBuf.length }, headers || {}),
      };
      var req = http.request(options, function (res) {
        var body = '';
        res.on('data', function (chunk) { body += chunk; });
        res.on('end', function () {
          resolve({ statusCode: res.statusCode, body: body });
        });
      });
      req.on('error', function (err) {
        resolve({ statusCode: null, body: '', error: err.message });
      });
      req.setTimeout(5000, function () {
        req.destroy();
        resolve({ statusCode: null, body: '', error: 'Request timeout' });
      });
      req.write(bodyBuf);
      req.end();
    } catch (err) {
      resolve({ statusCode: null, body: '', error: err.message });
    }
  });
}

// ── Auth topology tests ───────────────────────────────────────────────────────

/**
 * AC3: Bitbucket DC Docker — app-password auth topology test.
 *
 * Tests that the app-password credential resolves correctly via the Bitbucket
 * DC auth mechanism. Passes when the HTTP response is NOT 401 or 403.
 * Skips with reason PREREQ-DOCKER when the DC instance is unreachable.
 *
 * Auth credentials are read ONLY from environment variables (MC-SEC-02):
 *   process.env[config.userEnv]          — Bitbucket username
 *   process.env[config.appPasswordEnv]   — Bitbucket app password
 *
 * @param {{ dcConfig?: object, contextYmlPath?: string }} [options]
 * @returns {Promise<{ passed?: boolean, skipped?: boolean, reason?: string,
 *                     statusCode?: number, error?: string }>}
 */
function testAppPasswordAuth(options) {
  options = options || {};
  var config = options.dcConfig || readBitbucketDcConfig(options.contextYmlPath);

  return isDcAvailable(config.host).then(function (available) {
    if (!available) {
      return { skipped: true, reason: 'PREREQ-DOCKER', message: 'DC Docker instance not reachable at ' + config.host };
    }

    var user        = process.env[config.userEnv]        || '';
    var appPassword = process.env[config.appPasswordEnv] || '';

    if (!user || !appPassword) {
      return { skipped: true, reason: 'PREREQ-DOCKER', message: 'CI secrets ' + config.userEnv + ' / ' + config.appPasswordEnv + ' not set' };
    }

    var credentials = Buffer.from(user + ':' + appPassword).toString('base64');
    var url         = config.host + '/rest/api/1.0/projects';
    var headers     = { 'Authorization': 'Basic ' + credentials };

    return httpGet(url, headers).then(function (response) {
      if (response.error) {
        return { passed: false, error: response.error };
      }
      if (response.statusCode === 401 || response.statusCode === 403) {
        return { passed: false, statusCode: response.statusCode,
          error: 'Auth failed: HTTP ' + response.statusCode + ' — app-password not accepted' };
      }
      return { passed: true, statusCode: response.statusCode };
    });
  });
}

/**
 * AC4: Bitbucket DC Docker — OAuth consumer auth topology test.
 *
 * Tests that the OAuth consumer flow completes and returns a token.
 * Uses client credentials grant with the configured OAuth consumer key+secret.
 * Skips with reason PREREQ-DOCKER when the DC instance is unreachable.
 *
 * Auth credentials read ONLY from environment variables (MC-SEC-02):
 *   process.env[config.oauthKeyEnv]      — OAuth consumer key
 *   process.env[config.oauthSecretEnv]   — OAuth consumer secret
 *
 * @param {{ dcConfig?: object, contextYmlPath?: string }} [options]
 * @returns {Promise<{ passed?: boolean, skipped?: boolean, reason?: string,
 *                     tokenObtained?: boolean, error?: string }>}
 */
function testOAuthAuth(options) {
  options = options || {};
  var config = options.dcConfig || readBitbucketDcConfig(options.contextYmlPath);

  return isDcAvailable(config.host).then(function (available) {
    if (!available) {
      return { skipped: true, reason: 'PREREQ-DOCKER', message: 'DC Docker instance not reachable at ' + config.host };
    }

    var oauthKey    = process.env[config.oauthKeyEnv]    || '';
    var oauthSecret = process.env[config.oauthSecretEnv] || '';

    if (!oauthKey || !oauthSecret) {
      return { skipped: true, reason: 'PREREQ-DOCKER', message: 'CI secrets ' + config.oauthKeyEnv + ' / ' + config.oauthSecretEnv + ' not set' };
    }

    var credentials = Buffer.from(oauthKey + ':' + oauthSecret).toString('base64');
    var tokenUrl    = config.host + '/rest/oauth2/1.0/token';
    var postBody    = 'grant_type=client_credentials';
    var headers     = {
      'Authorization':  'Basic ' + credentials,
      'Content-Type':   'application/x-www-form-urlencoded',
    };

    return httpPost(tokenUrl, headers, postBody).then(function (response) {
      if (response.error) {
        return { passed: false, error: response.error };
      }

      var tokenObtained = false;
      try {
        var parsed = JSON.parse(response.body);
        tokenObtained = !!(parsed.access_token || parsed.token);
      } catch (_) {
        tokenObtained = false;
      }

      if (response.statusCode === 401 || response.statusCode === 403) {
        return { passed: false, statusCode: response.statusCode,
          error: 'OAuth auth failed: HTTP ' + response.statusCode };
      }

      if (!tokenObtained) {
        return { passed: false, statusCode: response.statusCode,
          error: 'OAuth token not obtained — response did not contain access_token' };
      }

      return { passed: true, statusCode: response.statusCode, tokenObtained: true };
    });
  });
}

/**
 * AC5: Bitbucket DC Docker — SSH key auth topology test.
 *
 * Tests that SSH key resolution succeeds for the pipeline runner.
 * Verifies the SSH key is present in env and reachable at the DC SSH port
 * (no full SSH handshake — topology verification only, aligning with story
 * scope; full data retrieval is out of scope).
 *
 * Auth credentials read ONLY from environment variables (MC-SEC-02):
 *   process.env[config.sshPrivateKeyEnv] — SSH private key (PEM)
 *
 * @param {{ dcConfig?: object, contextYmlPath?: string }} [options]
 * @returns {Promise<{ passed?: boolean, skipped?: boolean, reason?: string,
 *                     error?: string }>}
 */
function testSshKeyAuth(options) {
  options = options || {};
  var config = options.dcConfig || readBitbucketDcConfig(options.contextYmlPath);

  return isDcAvailable(config.host).then(function (available) {
    if (!available) {
      return { skipped: true, reason: 'PREREQ-DOCKER', message: 'DC Docker instance not reachable at ' + config.host };
    }

    var sshKey = process.env[config.sshPrivateKeyEnv] || '';

    if (!sshKey) {
      return { skipped: true, reason: 'PREREQ-DOCKER', message: 'CI secret ' + config.sshPrivateKeyEnv + ' not set' };
    }

    // Topology check: verify the SSH port is reachable and the key is valid PEM
    var hasValidPemHeader = /-----BEGIN [A-Z ]+ PRIVATE KEY-----/.test(sshKey);
    if (!hasValidPemHeader) {
      return {
        passed: false,
        error:  'SSH_PRIVATE_KEY does not appear to be a valid PEM-format private key',
      };
    }

    // Verify the DC SSH port (7999) is reachable
    return new Promise(function (resolve) {
      var urlObj  = new (require('url').URL)(config.host);
      var dcHost  = urlObj.hostname;
      var sshPort = config.sshPort;

      var socket  = new net.Socket();
      var settled = false;

      socket.setTimeout(2000);
      socket.on('connect', function () {
        if (!settled) {
          settled = true;
          socket.destroy();
          resolve({ passed: true, message: 'SSH port ' + sshPort + ' reachable; key format valid' });
        }
      });
      socket.on('timeout', function () {
        if (!settled) {
          settled = true;
          socket.destroy();
          resolve({ passed: false, error: 'SSH handshake timeout: port ' + sshPort + ' not responding' });
        }
      });
      socket.on('error', function (err) {
        if (!settled) {
          settled = true;
          resolve({ passed: false, error: 'SSH topology failure: ' + err.message });
        }
      });
      socket.connect(sshPort, dcHost);
    });
  });
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  readBitbucketDcConfig,
  isDcAvailable,
  testAppPasswordAuth,
  testOAuthAuth,
  testSshKeyAuth,
};

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  var config = readBitbucketDcConfig();
  process.stdout.write('[bitbucket-dc-validator] DC host: ' + config.host + '\n');

  Promise.all([
    testAppPasswordAuth({ dcConfig: config }),
    testOAuthAuth({ dcConfig: config }),
    testSshKeyAuth({ dcConfig: config }),
  ]).then(function (results) {
    var labels = ['app-password', 'oauth', 'ssh'];
    results.forEach(function (r, idx) {
      var label = labels[idx];
      if (r.skipped) {
        process.stdout.write('[bitbucket-dc-validator] SKIP ' + label + ' [' + r.reason + ']: ' + (r.message || '') + '\n');
      } else if (r.passed) {
        process.stdout.write('[bitbucket-dc-validator] PASS ' + label + '\n');
      } else {
        process.stdout.write('[bitbucket-dc-validator] FAIL ' + label + ': ' + (r.error || 'unknown') + '\n');
      }
    });
    var anyFailed = results.some(function (r) { return !r.skipped && !r.passed; });
    process.exit(anyFailed ? 1 : 0);
  });
}

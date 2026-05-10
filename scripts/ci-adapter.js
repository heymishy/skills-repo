#!/usr/bin/env node
/**
 * ci-adapter.js
 *
 * Platform-agnostic CI verdict delivery adapter.
 * Reads audit.ci_platform from .github/context.yml and routes to
 * the appropriate platform adapter.
 *
 * Core scripts (run-assurance-gate.js, index.js) call this module.
 * Workflow YAML files are thin wrappers that invoke this module via CLI.
 *
 * Supported platforms: github-actions (default), bitbucket, none
 *
 * Governing constraint (copilot-instructions.md):
 *   All CI-platform-specific behaviour must be isolated to this module.
 *   The core scripts must not contain platform-specific code beyond reading
 *   neutral env vars with platform-specific fallbacks.
 *
 * Zero external dependencies — plain Node.js (fs, path, https).
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var https = require('https');

var ROOT = path.join(__dirname, '..');

// ── Config reader ─────────────────────────────────────────────────────────────

/**
 * Read audit.ci_platform from .github/context.yml.
 * Returns 'github-actions' if the key is absent or the file is unreadable.
 *
 * @param {string} [contextYmlPath] - override path to context.yml
 * @returns {string}
 */
function readCiPlatform(contextYmlPath) {
  var ymlPath = contextYmlPath || path.join(ROOT, '.github', 'context.yml');
  try {
    var raw = fs.readFileSync(ymlPath, 'utf8');
    var m   = raw.match(/^[ \t]*ci_platform:\s*(.+)$/m);
    return m ? m[1].trim().replace(/['"]/g, '') : 'github-actions';
  } catch (e) {
    return 'github-actions';
  }
}

// ── Verdict file readers ──────────────────────────────────────────────────────

/**
 * Read workspace/gate-verdict.json produced by run-assurance-gate.js.
 *
 * @param {string} [verdictFilePath] - override path
 * @returns {object|null}
 */
function readGateVerdict(verdictFilePath) {
  var p = verdictFilePath || path.join(ROOT, 'workspace', 'gate-verdict.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * Read workspace/gate-remediation.json produced by run-assurance-gate.js on fail.
 *
 * @param {string} [remediationFilePath] - override path
 * @returns {object|null}
 */
function readGateRemediation(remediationFilePath) {
  var p = remediationFilePath || path.join(ROOT, 'workspace', 'gate-remediation.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

// ── Comment body builder ──────────────────────────────────────────────────────

/**
 * Build the PR/build comment body from structured verdict and remediation objects.
 * Platform-agnostic — the caller decides how to post it.
 *
 * @param {object|null} verdict     - gate-verdict.json contents
 * @param {object|null} remediation - gate-remediation.json contents (may be null on pass)
 * @returns {string}
 */
function buildCommentBody(verdict, remediation) {
  var icon = verdict && verdict.verdict === 'pass' ? '\u2705' : '\u274c';
  var lines = [
    '## Assurance Gate ' + icon,
    '',
    '**Verdict:** ' + (verdict ? verdict.verdict : 'unknown'),
    '**Trace hash:** `' + (verdict ? verdict.traceHash : 'unknown') + '`',
    '**Commit:** `' + (verdict ? verdict.commitSha : 'unknown') + '`',
  ];
  if (remediation && remediation.remediationHints && remediation.remediationHints.length) {
    lines.push('');
    lines.push('**Remediation:**');
    remediation.remediationHints.forEach(function (h) {
      lines.push('- **`' + h.check + '`**: ' + h.hint + ' ' + h.remediation);
    });
  }
  return lines.join('\n');
}

// ── GitHub Actions adapter ────────────────────────────────────────────────────

/**
 * Post a PR comment via the GitHub REST API.
 *
 * Reads from env vars:
 *   GITHUB_TOKEN      — required
 *   GITHUB_REPOSITORY — owner/repo (required)
 *   PR_NUMBER         — pull request number (required)
 *
 * @param {string} body - comment body markdown
 * @returns {Promise<void>}
 */
function postGitHubComment(body) {
  return new Promise(function (resolve, reject) {
    var token      = process.env.GITHUB_TOKEN;
    var repository = process.env.GITHUB_REPOSITORY;
    var prNumber   = process.env.PR_NUMBER;

    if (!token) {
      reject(new Error('GITHUB_TOKEN env var is required for github-actions platform'));
      return;
    }
    if (!repository) {
      reject(new Error('GITHUB_REPOSITORY env var is required for github-actions platform'));
      return;
    }
    if (!prNumber) {
      reject(new Error('PR_NUMBER env var is required for github-actions platform'));
      return;
    }

    var payload = JSON.stringify({ body: body });
    var parts   = repository.split('/');
    var apiPath = '/repos/' + parts[0] + '/' + parts[1] + '/issues/' + prNumber + '/comments';

    var options = {
      hostname: 'api.github.com',
      path:     apiPath,
      method:   'POST',
      headers:  {
        'Authorization': 'Bearer ' + token,
        'Accept':        'application/vnd.github+json',
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent':    'ci-adapter/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    };

    var req = https.request(options, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error('GitHub API returned status ' + res.statusCode + ': ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Bitbucket adapter ─────────────────────────────────────────────────────────

/**
 * Post a build status to the Bitbucket REST API.
 *
 * Reads from env vars:
 *   BITBUCKET_ACCESS_TOKEN — required
 *   BITBUCKET_WORKSPACE    — required
 *   BITBUCKET_REPO_SLUG    — required
 *   BITBUCKET_COMMIT       — required
 *
 * @param {string} verdict - 'pass' or 'fail'
 * @param {string} body    - build status description (truncated to 255 chars)
 * @returns {Promise<void>}
 */
function postBitbucketBuildStatus(verdict, body) {
  return new Promise(function (resolve, reject) {
    var token     = process.env.BITBUCKET_ACCESS_TOKEN;
    var workspace = process.env.BITBUCKET_WORKSPACE;
    var repoSlug  = process.env.BITBUCKET_REPO_SLUG;
    var commit    = process.env.BITBUCKET_COMMIT;

    if (!token || !workspace || !repoSlug || !commit) {
      reject(new Error(
        'Bitbucket platform requires BITBUCKET_ACCESS_TOKEN, BITBUCKET_WORKSPACE, ' +
        'BITBUCKET_REPO_SLUG, and BITBUCKET_COMMIT env vars'
      ));
      return;
    }

    var state   = verdict === 'pass' ? 'SUCCESSFUL' : 'FAILED';
    var payload = JSON.stringify({
      state:       state,
      key:         'assurance-gate',
      name:        'Assurance Gate',
      description: body.slice(0, 255),
    });
    var apiPath = '/2.0/repositories/' + workspace + '/' + repoSlug +
                  '/commit/' + commit + '/statuses/build';

    var options = {
      hostname: 'api.bitbucket.org',
      path:     apiPath,
      method:   'POST',
      headers:  {
        'Authorization': 'Bearer ' + token,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    var req = https.request(options, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error('Bitbucket API returned status ' + res.statusCode + ': ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Notifications fallback ────────────────────────────────────────────────────

/**
 * Write verdict to workspace/notifications.json as a fallback for unknown platforms.
 *
 * @param {object} verdict     - gate-verdict.json contents
 * @param {string} body        - comment body
 * @returns {void}
 */
function writeNotificationsJson(verdict, body) {
  var notifPath = path.join(ROOT, 'workspace', 'notifications.json');
  var entry = {
    type:      'assurance-gate-verdict',
    verdict:   verdict ? verdict.verdict : 'unknown',
    body:      body,
    timestamp: new Date().toISOString(),
  };
  var existing = [];
  if (fs.existsSync(notifPath)) {
    try { existing = JSON.parse(fs.readFileSync(notifPath, 'utf8')); } catch (_) {}
  }
  if (!Array.isArray(existing)) existing = [];
  existing.push(entry);
  fs.writeFileSync(notifPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
}

// ── Module exports ────────────────────────────────────────────────────────────

module.exports = {
  readCiPlatform:      readCiPlatform,
  readGateVerdict:     readGateVerdict,
  readGateRemediation: readGateRemediation,
  buildCommentBody:    buildCommentBody,
};

// ── CLI entry point ───────────────────────────────────────────────────────────
// Usage: node scripts/ci-adapter.js --post-comment
//        node scripts/ci-adapter.js --read-verdict

if (require.main === module) {
  var args = process.argv.slice(2);

  if (args.includes('--read-verdict')) {
    var v = readGateVerdict();
    if (v) {
      process.stdout.write(JSON.stringify(v, null, 2) + '\n');
      process.exit(0);
    } else {
      process.stderr.write('[ci-adapter] workspace/gate-verdict.json not found or unreadable\n');
      process.exit(1);
    }
  }

  if (args.includes('--post-comment')) {
    var platform   = readCiPlatform();
    var verdict    = readGateVerdict();
    var remediation = readGateRemediation();
    var body       = buildCommentBody(verdict, remediation);

    process.stdout.write('[ci-adapter] platform=' + platform + '\n');
    process.stdout.write('[ci-adapter] verdict=' + (verdict ? verdict.verdict : 'unknown') + '\n');

    var postPromise;
    if (platform === 'github-actions') {
      postPromise = postGitHubComment(body);
    } else if (platform === 'bitbucket') {
      postPromise = postBitbucketBuildStatus(
        verdict ? verdict.verdict : 'fail',
        body
      );
    } else {
      // Unknown platform — write to notifications.json as fallback
      process.stdout.write('[ci-adapter] Unknown platform "' + platform + '" — writing to notifications.json\n');
      writeNotificationsJson(verdict, body);
      process.exit(0);
      return;
    }

    postPromise.then(function () {
      process.stdout.write('[ci-adapter] Comment posted successfully\n');
      process.exit(0);
    }).catch(function (err) {
      process.stderr.write('[ci-adapter] Failed to post comment: ' + err.message + '\n');
      process.exit(1);
    });

    return;
  }

  process.stderr.write('Usage: node scripts/ci-adapter.js --post-comment | --read-verdict\n');
  process.exit(1);
}

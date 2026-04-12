#!/usr/bin/env node
/**
 * bitbucket-cloud-validator/index.js
 *
 * Bitbucket Cloud pipeline validation module.
 * Implements story p2.10: Bitbucket CI validation — Cloud pipeline-shape tests.
 *
 * Functions:
 *   validateYamlSyntax(content)    — YAML syntax check (AC1)
 *   checkPipelineShape(content)    — assurance gate step presence check (AC2)
 *   validateCloudPipeline(content) — combined syntax + shape check
 *   readBitbucketCloudConfig(contextYmlPath) — reads Cloud config from context.yml (ADR-004)
 *
 * Isolation guarantee (AC6):
 *   This module contains ONLY Cloud validation logic. It makes zero DC auth calls
 *   and imports nothing from bitbucket-dc-validator. A Cloud validation run must
 *   not attempt DC operations (no app password calls, no OAuth flows, no SSH auth).
 *
 * Run:  node src/bitbucket-cloud-validator/index.js
 * Used: tests/check-bitbucket-cloud.js
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * The identifier that must appear in a bitbucket-pipelines.yml to confirm
 * the governance assurance gate step is present.
 */
const ASSURANCE_GATE_STEP_ID = 'run-assurance-gate';

// ── YAML syntax validator ─────────────────────────────────────────────────────

/**
 * Perform a structural YAML syntax check on the provided content string.
 *
 * Detects the following classes of syntax error without an external YAML
 * library:
 *   1. Tab characters used for indentation (YAML spec §6.1 forbids tabs in
 *      indentation — only spaces are permitted)
 *   2. Unterminated flow collections — a `{` or `[` that is never closed
 *      within the document
 *   3. Unexpected closing brackets that appear without a matching opener
 *
 * @param {string} content - Raw YAML string to validate
 * @returns {{ valid: boolean, errorType?: string, error?: string }}
 */
function validateYamlSyntax(content) {
  if (typeof content !== 'string') {
    return {
      valid:     false,
      errorType: 'yaml-syntax-error',
      error:     'YAML content must be a string',
    };
  }

  const lines = content.split('\n');

  // Rule 1: YAML forbids tab characters at the start of indentation
  for (var i = 0; i < lines.length; i++) {
    if (/^\t/.test(lines[i])) {
      return {
        valid:     false,
        errorType: 'yaml-syntax-error',
        error:     'YAML syntax error at line ' + (i + 1) +
                   ': tab character in indentation (YAML requires spaces, not tabs)',
      };
    }
  }

  // Rule 2: Track flow-collection depth to detect unterminated { [ structures.
  // Walks character-by-character, skipping quoted strings and line comments.
  var flowDepth = 0;
  for (var li = 0; li < lines.length; li++) {
    var line    = lines[li];
    var inQuote = false;
    var quoteChar = '';

    for (var ci = 0; ci < line.length; ci++) {
      var ch = line[ci];

      if (inQuote) {
        // Escaped character — skip next char
        if (ch === '\\') { ci++; continue; }
        if (ch === quoteChar) { inQuote = false; }
        continue;
      }

      if (ch === '"' || ch === "'") {
        inQuote   = true;
        quoteChar = ch;
        continue;
      }

      // Rest-of-line comment
      if (ch === '#') { break; }

      if (ch === '{' || ch === '[') {
        flowDepth++;
      } else if (ch === '}' || ch === ']') {
        flowDepth--;
        if (flowDepth < 0) {
          return {
            valid:     false,
            errorType: 'yaml-syntax-error',
            error:     'YAML syntax error at line ' + (li + 1) +
                       ': unexpected closing bracket \'' + ch + '\' without matching opener',
          };
        }
      }
    }
  }

  if (flowDepth > 0) {
    return {
      valid:     false,
      errorType: 'yaml-syntax-error',
      error:     'YAML syntax error: unterminated flow collection (unclosed { or [) — ' +
                 flowDepth + ' collection(s) not closed',
    };
  }

  return { valid: true };
}

// ── Pipeline-shape validator ──────────────────────────────────────────────────

/**
 * Check that the governance assurance gate step is present in a Bitbucket
 * Cloud pipeline definition.
 *
 * A pipeline definition is considered to contain the assurance gate step when
 * the content includes the string "run-assurance-gate" — the canonical script
 * identifier used by all pipeline configurations that invoke the gate.
 *
 * Returns a distinct errorType of 'pipeline-shape-error' so callers can
 * differentiate shape failures from YAML syntax failures (AC1 vs AC2).
 *
 * @param {string} content - YAML string (must already pass validateYamlSyntax)
 * @returns {{ valid: boolean, errorType?: string, error?: string }}
 */
function checkPipelineShape(content) {
  if (typeof content !== 'string') {
    return {
      valid:     false,
      errorType: 'pipeline-shape-error',
      error:     'Pipeline content must be a string',
    };
  }

  if (!content.includes(ASSURANCE_GATE_STEP_ID)) {
    return {
      valid:     false,
      errorType: 'pipeline-shape-error',
      error:     'assurance gate step missing: pipeline definition does not include a step ' +
                 'invoking "' + ASSURANCE_GATE_STEP_ID + '" — add the governance assurance ' +
                 'gate step to your bitbucket-pipelines.yml',
    };
  }

  return { valid: true };
}

// ── Combined validator ────────────────────────────────────────────────────────

/**
 * Validate a Bitbucket Cloud pipeline definition: syntax check first, then
 * pipeline-shape check.
 *
 * Returns the first failure encountered. If both checks pass, returns
 * `{ valid: true }`.
 *
 * @param {string} content - Raw bitbucket-pipelines.yml content
 * @returns {{ valid: boolean, errorType?: string, error?: string }}
 */
function validateCloudPipeline(content) {
  var syntaxResult = validateYamlSyntax(content);
  if (!syntaxResult.valid) { return syntaxResult; }
  return checkPipelineShape(content);
}

// ── Config reader (ADR-004) ───────────────────────────────────────────────────

/**
 * Read Bitbucket Cloud configuration from context.yml.
 * All Bitbucket-specific identifiers (org, repo slug, secret var names) must
 * be stored here — no hardcoded values in this module (ADR-004).
 *
 * @param {string} [contextYmlPath] - Path to context.yml (defaults to .github/context.yml)
 * @returns {{
 *   org:               string,
 *   repoSlug:          string,
 *   appPasswordEnv:    string,
 *   oauthKeyEnv:       string,
 *   oauthSecretEnv:    string,
 * }}
 */
function readBitbucketCloudConfig(contextYmlPath) {
  var resolvedPath = contextYmlPath ||
    path.join(__dirname, '..', '..', '.github', 'context.yml');

  var content = fs.readFileSync(resolvedPath, 'utf8');
  var config  = {
    org:            '',
    repoSlug:       '',
    appPasswordEnv: 'BB_APP_PASSWORD',
    oauthKeyEnv:    'OAUTH_KEY',
    oauthSecretEnv: 'OAUTH_SECRET',
  };

  var inBitbucket = false;
  var inCloud     = false;
  var bbIndent    = -1;
  var cloudIndent = -1;

  var lines = content.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var raw      = lines[i].replace(/\s*#.*$/, '').trimEnd();
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

    // Leaving the bitbucket block
    if (indent <= bbIndent && trimmed !== '') {
      inBitbucket = false;
      inCloud     = false;
      continue;
    }

    if (!inCloud) {
      if (trimmed === 'cloud:') {
        inCloud     = true;
        cloudIndent = indent;
      }
      continue;
    }

    // Leaving the cloud sub-block
    if (indent <= cloudIndent && trimmed !== '') {
      inCloud = false;
      continue;
    }

    var colonIdx = trimmed.indexOf(':');
    if (colonIdx < 0) { continue; }
    var key = trimmed.slice(0, colonIdx).trim();
    var val = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key === 'org')              { config.org            = val; }
    if (key === 'repo_slug')        { config.repoSlug       = val; }
    if (key === 'app_password_env') { config.appPasswordEnv = val; }
    if (key === 'oauth_key_env')    { config.oauthKeyEnv    = val; }
    if (key === 'oauth_secret_env') { config.oauthSecretEnv = val; }
  }

  return config;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  validateYamlSyntax,
  checkPipelineShape,
  validateCloudPipeline,
  readBitbucketCloudConfig,
  ASSURANCE_GATE_STEP_ID,
};

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  var filePath = process.argv[2];
  if (!filePath) {
    process.stderr.write('Usage: node src/bitbucket-cloud-validator/index.js <pipeline-yml>\n');
    process.exit(1);
  }

  var pipelineContent = fs.readFileSync(filePath, 'utf8');
  var result          = validateCloudPipeline(pipelineContent);

  if (result.valid) {
    process.stdout.write('[bitbucket-cloud-validator] PASS — pipeline definition is valid\n');
    process.exit(0);
  } else {
    process.stdout.write('[bitbucket-cloud-validator] FAIL — ' + result.error + '\n');
    process.exit(1);
  }
}

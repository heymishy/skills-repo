#!/usr/bin/env node
/**
 * scripts/validate-suite-entry.js
 *
 * Validates a candidate new suite.json entry for the required anti-gaming
 * controls introduced in p3.4: traceId + failurePattern presence, and
 * traceId file resolution.
 *
 * Exports (for programmatic use in tests):
 *   sanitizeTraceId(traceId)             — returns null if safe, error string if not
 *   resolveTraceId(traceId, wsRoot)      — { found: boolean, resolvedPath: string }
 *   validateEntry(entry, options)        — { valid: boolean, errors: string[] }
 *
 * CLI usage:
 *   node scripts/validate-suite-entry.js <entry-file.json> [--workspace <dir>]
 *   Exits 0 on pass, 1 on validation failure, 2 on usage/IO error.
 *
 * Grandfathering:
 *   Entries with `_grandfathered: true` are pre-existing entries that predate
 *   this story's controls and are exempt from traceId/failurePattern checks.
 *
 * Security:
 *   traceId values are sanitised — absolute paths and path traversal (..) are
 *   rejected before any file-system access. path.join is used for all
 *   resolution so the resolved path stays within workspaceRoot (AC2).
 *
 * Zero external npm dependencies — plain Node.js (fs, path) only.
 */
'use strict';

var fs   = require('fs');
var path = require('path');

// Flag field name used to mark grandfathered (pre-existing) entries
var GRANDFATHER_FLAG = '_grandfathered';

// ── Sanitization ──────────────────────────────────────────────────────────────

/**
 * Sanitize a traceId value to prevent path traversal attacks.
 *
 * @param {*} traceId
 * @returns {string|null} null if safe; error description string if rejected
 */
function sanitizeTraceId(traceId) {
  if (typeof traceId !== 'string') {
    return 'traceId must be a string';
  }
  if (traceId.trim() === '') {
    return 'traceId must not be empty';
  }
  // Reject absolute paths
  if (traceId.charAt(0) === '/' || traceId.charAt(0) === '\\') {
    return 'traceId must not be an absolute path';
  }
  // Reject Windows-style absolute paths (e.g. C:\...)
  if (/^[A-Za-z]:[/\\]/.test(traceId)) {
    return 'traceId must not be an absolute path';
  }
  // Reject path traversal
  if (traceId.indexOf('..') !== -1) {
    return 'traceId must not contain path traversal (..)';
  }
  return null;
}

// ── Trace file resolution ─────────────────────────────────────────────────────

/**
 * Resolve a traceId to an existing trace file.
 *
 * Tries the following candidates in order:
 *   1. <workspaceRoot>/workspace/traces/<traceId>
 *   2. <workspaceRoot>/platform/traces/<traceId>
 *
 * @param {string} traceId       - sanitized traceId value
 * @param {string} workspaceRoot - project root directory
 * @returns {{ found: boolean, resolvedPath: string }}
 */
function resolveTraceId(traceId, workspaceRoot) {
  var root = workspaceRoot || process.cwd();

  // Candidate 1: workspace/traces/[traceId]
  var wsPath = path.join(root, 'workspace', 'traces', traceId);
  if (fs.existsSync(wsPath)) {
    return { found: true, resolvedPath: wsPath };
  }

  // Candidate 2: platform/traces/[traceId]  (squad encoded in traceId as [squad]/[id])
  var platPath = path.join(root, 'platform', 'traces', traceId);
  if (fs.existsSync(platPath)) {
    return { found: true, resolvedPath: platPath };
  }

  // Return the primary candidate path for error messages
  return { found: false, resolvedPath: wsPath };
}

// ── Entry validator ───────────────────────────────────────────────────────────

/**
 * Validate a single candidate suite.json entry.
 *
 * @param {object} entry                      - the entry object to validate
 * @param {object} [options]
 * @param {string} [options.workspaceRoot]    - root dir for trace resolution (default: cwd)
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEntry(entry, options) {
  var opts          = options || {};
  var workspaceRoot = opts.workspaceRoot || process.cwd();
  var errors        = [];

  if (!entry || typeof entry !== 'object') {
    return { valid: false, errors: ['entry must be a non-null object'] };
  }

  // Grandfathered entries are pre-existing and exempt from new controls
  if (entry[GRANDFATHER_FLAG] === true) {
    return { valid: true, errors: [] };
  }

  // AC1 — required fields
  if (!entry.traceId) {
    errors.push('Missing required field: traceId');
  }
  if (!entry.failurePattern) {
    errors.push('Missing required field: failurePattern');
  }

  // AC2 — traceId file resolution (only if traceId is present)
  if (entry.traceId) {
    var sanitizeErr = sanitizeTraceId(entry.traceId);
    if (sanitizeErr) {
      errors.push('Invalid traceId: ' + sanitizeErr);
    } else {
      var resolution = resolveTraceId(entry.traceId, workspaceRoot);
      if (!resolution.found) {
        errors.push(
          'traceId references non-existent trace file: ' + resolution.resolvedPath
        );
      }
    }
  }

  return { valid: errors.length === 0, errors: errors };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  sanitizeTraceId: sanitizeTraceId,
  resolveTraceId:  resolveTraceId,
  validateEntry:   validateEntry,
};

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  var argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    process.stderr.write(
      'Usage: node scripts/validate-suite-entry.js <entry-file.json> [--workspace <dir>]\n'
    );
    process.exit(2);
  }

  var entryFilePath = argv[0];

  // Parse optional --workspace argument
  var workspaceRoot = process.cwd();
  for (var i = 1; i < argv.length - 1; i++) {
    if (argv[i] === '--workspace') {
      workspaceRoot = argv[i + 1];
      break;
    }
  }

  var entry;
  try {
    entry = JSON.parse(fs.readFileSync(entryFilePath, 'utf8'));
  } catch (e) {
    process.stderr.write('Error reading entry file: ' + e.message + '\n');
    process.exit(2);
  }

  var result = validateEntry(entry, { workspaceRoot: workspaceRoot });

  if (result.valid) {
    process.stdout.write('Suite entry validation passed.\n');
    process.exit(0);
  } else {
    result.errors.forEach(function (err) {
      process.stderr.write('  Error: ' + err + '\n');
    });
    process.exit(1);
  }
}

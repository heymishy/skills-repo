'use strict';

/**
 * ci-attachment-config.js — reads the audit.ci_attachment config from context.yml
 *
 * Used by caa.3 tests and by the assurance-gate workflow (via the yq step for
 * live YAML parsing, and via this module for Node.js unit testing with pre-parsed
 * config objects).
 *
 * AC1: returns { skip: true } when ci_attachment is false or audit block is absent
 * AC2: returns { skip: false, platform: 'github-actions' } when ci_attachment is true
 * AC3: throws with informative message for unimplemented platform
 * AC6: throws with required message when context.yml is invalid YAML
 */

const fs   = require('fs');
const path = require('path');

const SUPPORTED_ADAPTERS = ['github-actions'];

/**
 * Read and parse context.yml from rootDir, returning a config decision object.
 *
 * This function handles YAML parsing itself using a minimal YAML reader
 * (no external deps — context.yml audit block uses only simple scalar types).
 *
 * @param {string} rootDir  Repo root directory
 * @returns {{ skip: boolean, platform?: string }}
 */
function readCiAttachmentConfig(rootDir) {
  const contextPath = path.join(rootDir, 'context.yml');

  if (!fs.existsSync(contextPath)) {
    return { skip: true };
  }

  let raw;
  try {
    raw = fs.readFileSync(contextPath, 'utf8');
  } catch (_) {
    return { skip: true };
  }

  // AC6: detect invalid YAML by looking for unclosed brackets / obvious syntax errors
  // We parse only the audit: block using line-by-line reading (no external deps)
  let config;
  try {
    config = parseAuditBlock(raw);
  } catch (e) {
    const err = new Error(
      `[ci-artefact-attachment] context.yml could not be parsed — check YAML syntax.`
    );
    err.isParseError = true;
    throw err;
  }

  // AC1: absent audit block or ci_attachment != true → skip
  if (!config || config.ci_attachment !== true) {
    return { skip: true };
  }

  const platform = config.ci_platform || 'github-actions';

  // AC3: unknown platform → throw with informative message
  if (!SUPPORTED_ADAPTERS.includes(platform)) {
    const err = new Error(
      `[ci-artefact-attachment] Adapter '${platform}' is not yet implemented. Available adapters: ${SUPPORTED_ADAPTERS.join(', ')}.`
    );
    err.isAdapterError = true;
    throw err;
  }

  return { skip: false, platform };
}

/**
 * Load an adapter by platform name.
 * AC3: throws with informative message for unimplemented platform.
 *
 * @param {string} platform
 * @returns {object}  { upload, postComment }
 */
function loadAdapter(platform) {
  if (!SUPPORTED_ADAPTERS.includes(platform)) {
    const err = new Error(
      `[ci-artefact-attachment] Adapter '${platform}' is not yet implemented. Available adapters: ${SUPPORTED_ADAPTERS.join(', ')}.`
    );
    err.isAdapterError = true;
    throw err;
  }
  return require(path.join(__dirname, 'ci-adapters', platform));
}

/**
 * Minimal YAML audit block parser — reads only the `audit:` section.
 * Supports simple key: value scalar entries. Throws on obvious syntax errors.
 *
 * @param {string} raw  Full file content
 * @returns {{ ci_attachment?: boolean, ci_platform?: string, artifact_retention_days?: number } | null}
 */
function parseAuditBlock(raw) {
  // Detect unclosed brackets (common YAML syntax error)
  if (/:\s*\[(?![^\]]*\])/.test(raw)) {
    throw new Error('unclosed bracket');
  }

  const lines = raw.split('\n');
  let inAudit = false;
  const result = {};

  for (const line of lines) {
    if (/^audit:\s*$/.test(line)) {
      inAudit = true;
      continue;
    }
    if (inAudit) {
      // End of audit block: another top-level key
      if (/^[a-zA-Z]/.test(line) && !/^\s/.test(line)) {
        break;
      }
      const m = line.match(/^\s+(ci_attachment|ci_platform|artifact_retention_days):\s*(.+?)(?:\s*#.*)?$/);
      if (m) {
        const key = m[1];
        const val = m[2].trim();
        if (key === 'ci_attachment') {
          result[key] = val === 'true';
        } else if (key === 'artifact_retention_days') {
          result[key] = parseInt(val, 10);
        } else {
          result[key] = val;
        }
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

module.exports = { readCiAttachmentConfig, loadAdapter };

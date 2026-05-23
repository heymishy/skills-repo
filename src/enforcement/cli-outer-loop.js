// cli-outer-loop.js — skills validate: artefact structural validation
// Phase 1: H1 check (story artefact exists). Returns { exitCode, stdout, stderr }.
// Pure function — no process.exit(), no file writes, no network calls.

'use strict';

const fs   = require('fs');
const path = require('path');

const SUPPORTED_GATES = ['definition-of-ready'];

// Pattern to find story artefact references in markdown content.
// Matches: artefacts/<feature-slug>/stories/<story-slug>.md
const STORY_REF_RE = /artefacts\/[^/\s\n]+\/stories\/([^/\s\n.]+)\.md/g;

/**
 * Validate an artefact against a gate.
 *
 * @param {string} artefactPath - Path to the artefact (absolute or relative to repoRoot)
 * @param {string} gateName     - Gate to validate against (e.g. 'definition-of-ready')
 * @param {string} repoRoot     - Absolute path to the repository root
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function validate(artefactPath, gateName, repoRoot) {
  // ── Path traversal guard (OWASP A01) ───────────────────────────────────────
  const resolved = path.isAbsolute(artefactPath)
    ? path.resolve(artefactPath)
    : path.resolve(repoRoot, artefactPath);

  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  if (!resolved.startsWith(rootWithSep)) {
    return {
      exitCode: 8,
      stdout: '',
      stderr: 'Error: artefact path resolves outside repository root. Path traversal prevented (OWASP A01).',
    };
  }

  // ── Gate validation ─────────────────────────────────────────────────────────
  if (!SUPPORTED_GATES.includes(gateName)) {
    return {
      exitCode: 8,
      stdout: '',
      stderr: `UNSUPPORTED_GATE: '${gateName}' is not a recognised gate. Supported gates: ${SUPPORTED_GATES.join(', ')}`,
    };
  }

  // ── H1: story artefact exists ───────────────────────────────────────────────
  let content;
  try {
    content = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    return {
      exitCode: 1,
      stdout: '',
      stderr: `H1 FAIL: could not read artefact (file not found or unreadable)`,
    };
  }

  let match;
  STORY_REF_RE.lastIndex = 0;
  while ((match = STORY_REF_RE.exec(content)) !== null) {
    const relStoryPath = match[0];
    const absStoryPath = path.join(repoRoot, relStoryPath);
    if (!fs.existsSync(absStoryPath)) {
      return {
        exitCode: 1,
        stdout: '',
        stderr: `H1 FAIL: story artefact not found at ${relStoryPath} (slug: ${match[1]})`,
      };
    }
  }

  // ── All checks passed ───────────────────────────────────────────────────────
  return {
    exitCode: 0,
    stdout: `validate OK: ${gateName} — 0 violations found`,
    stderr: '',
  };
}

module.exports = { validate };

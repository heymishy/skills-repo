// cli-init.js — skills init: create a new discovery-stage feature stub
// Returns { exitCode, stdout, stderr }. No process.exit(). No subprocess calls.
// Called via require() from bin/skills — satisfies ADR-H7.1 (no child_process spawning).
'use strict';

var fs   = require('fs');
var path = require('path');

// Slug regex: must start and end with alphanum, middle may contain hyphens.
// Allows 2-char minimum slugs (both alphanum).
var SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

var PROTO_BLOCKED = ['__proto__', 'constructor', 'prototype'];

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

/**
 * Create a new discovery-stage feature stub in pipeline-state.json.
 *
 * @param {string}        slug        — feature slug (e.g. "2026-05-25-my-feature")
 * @param {string|null}   description — optional human-readable name; if absent, title-cased from slug
 * @param {string}        repoRoot    — absolute path to repository root
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 *   exitCode 0 = success
 *   exitCode 1 = validation error (bad slug, missing arg, path traversal, read/write failure)
 *   exitCode 2 = conflict (slug already exists)
 */
function init(slug, description, repoRoot) {
  // ── Arg validation ────────────────────────────────────────────────────────
  if (!slug || typeof slug !== 'string') {
    return { exitCode: 1, stdout: '', stderr: 'Error: slug argument is required\nUsage: skills init <slug> [--description "..."]' };
  }

  // ── Prototype pollution guard (OWASP A03) ─────────────────────────────────
  if (PROTO_BLOCKED.indexOf(slug) !== -1) {
    return { exitCode: 1, stdout: '', stderr: 'Error: invalid slug \'' + slug + '\': reserved name' };
  }

  // ── Slug format validation ─────────────────────────────────────────────────
  if (!SLUG_RE.test(slug)) {
    return { exitCode: 1, stdout: '', stderr: 'Error: invalid slug \'' + slug + '\': must match /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/' };
  }

  // ── Path resolution + traversal guard (OWASP A01) ─────────────────────────
  var statePath = path.resolve(repoRoot, '.github', 'pipeline-state.json');
  var rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  if (!statePath.startsWith(rootWithSep)) {
    return { exitCode: 1, stdout: '', stderr: 'Error: path resolves outside repository root (OWASP A01)' };
  }

  // ── Read current state ─────────────────────────────────────────────────────
  var state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (err) {
    return { exitCode: 1, stdout: '', stderr: 'Failed to read pipeline-state.json: ' + err.message };
  }
  if (!Array.isArray(state.features)) state.features = [];

  // ── Duplicate check — exit 2 (conflict) ───────────────────────────────────
  var existing = state.features.find(function(f) { return f.slug === slug; });
  if (existing) {
    return { exitCode: 2, stdout: '', stderr: 'Error: feature slug \'' + slug + '\' already exists in pipeline-state.json' };
  }

  // ── Build new feature stub ─────────────────────────────────────────────────
  var today = new Date().toISOString().slice(0, 10);
  var name = description && description.trim() ? description.trim() : titleCase(slug);
  var newFeature = {
    slug: slug,
    name: name,
    stage: 'discovery',
    health: 'green',
    stories: [],
    metrics: [],
    updatedAt: today,
  };
  state.features.push(newFeature);

  // ── Atomic write (temp-file rename) ───────────────────────────────────────
  var tmpPath = statePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2) + '\n', 'utf8');
    fs.renameSync(tmpPath, statePath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
    return { exitCode: 1, stdout: '', stderr: 'Failed to write pipeline-state.json: ' + err.message };
  }

  return { exitCode: 0, stdout: 'Created feature: ' + slug, stderr: '' };
}

module.exports = { init: init };

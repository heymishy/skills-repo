// cli-advance.js — skills advance: CI-facing pipeline-state write with typed exit codes
// Returns { exitCode, stdout, stderr }. No process.exit(). No subprocess calls.
// Called via require() from bin/skills — satisfies ADR-H7.1 (no child_process spawning).
'use strict';

var fs   = require('fs');
var path = require('path');

// Known enum fields and their valid values.
// Fields not listed here accept any string value.
var ENUM_FIELDS = {
  dorStatus:    ['not-started', 'in-progress', 'signed-off'],
  prStatus:     ['none', 'draft', 'open', 'merged'],
  reviewStatus: ['not-started', 'passed', 'has-findings'],
  health:       ['green', 'amber', 'red'],
};

var USAGE = 'Usage: skills advance <feature-slug> <story-id> <field>=<value>...';

/**
 * Advance pipeline-state.json fields for a given feature/story.
 *
 * @param {string}   featureSlug  — pipeline-state feature slug
 * @param {string}   storyId      — story id or slug
 * @param {string[]} rawFields    — array of "field=value" strings
 * @param {string}   repoRoot     — absolute path to repository root
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function advance(featureSlug, storyId, rawFields, repoRoot) {
  // ── Arg validation ────────────────────────────────────────────────────────
  if (!featureSlug || !storyId || !rawFields || rawFields.length === 0) {
    return { exitCode: 8, stdout: '', stderr: USAGE };
  }

  // ── Parse field=value pairs ───────────────────────────────────────────────
  var stateUpdate = {};
  for (var i = 0; i < rawFields.length; i++) {
    var raw = rawFields[i];
    var eqIdx = raw.indexOf('=');
    if (eqIdx === -1) {
      return {
        exitCode: 8, stdout: '',
        stderr: 'Invalid argument \'' + raw + '\': expected field=value format. ' + USAGE,
      };
    }
    var field = raw.slice(0, eqIdx);
    var value = raw.slice(eqIdx + 1);
    stateUpdate[field] = value;
  }

  // ── Enum validation ───────────────────────────────────────────────────────
  var fields = Object.keys(stateUpdate);
  for (var j = 0; j < fields.length; j++) {
    var f = fields[j];
    var v = stateUpdate[f];
    var allowed = ENUM_FIELDS[f];
    if (allowed !== undefined && allowed.indexOf(v) === -1) {
      return {
        exitCode: 8, stdout: '',
        stderr: 'Invalid value \'' + v + '\' for field \'' + f + '\'. Allowed values: ' + allowed.join(', '),
      };
    }
  }

  // ── Path resolution + traversal guard (OWASP A01) ────────────────────────
  var statePath = path.resolve(repoRoot, '.github', 'pipeline-state.json');
  var rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  if (!statePath.startsWith(rootWithSep)) {
    return { exitCode: 8, stdout: '', stderr: 'Error: path resolves outside repository root (OWASP A01)' };
  }

  // ── Read current state ────────────────────────────────────────────────────
  var state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (err) {
    return { exitCode: 8, stdout: '', stderr: 'Failed to read pipeline-state.json: ' + err.message };
  }
  if (!Array.isArray(state.features)) state.features = [];

  // ── Find feature — exit 8 if not found (do NOT create) ───────────────────
  var feature = state.features.find(function(feat) {
    return feat.slug === featureSlug || feat.id === featureSlug;
  });
  if (!feature) {
    return {
      exitCode: 8, stdout: '',
      stderr: 'Feature not found: \'' + featureSlug + '\'. Check pipeline-state.json.',
    };
  }

  // ── Find or create story entry ────────────────────────────────────────────
  if (!Array.isArray(feature.stories)) feature.stories = [];
  var story = feature.stories.find(function(s) {
    return s.id === storyId || s.slug === storyId;
  });
  if (!story) {
    story = { id: storyId };
    feature.stories.push(story);
  }

  // ── Apply all fields ──────────────────────────────────────────────────────
  Object.keys(stateUpdate).forEach(function(key) {
    story[key] = stateUpdate[key];
  });

  // ── Atomic write (temp-file rename) ──────────────────────────────────────
  var tmpPath = statePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2) + '\n', 'utf8');
    fs.renameSync(tmpPath, statePath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
    return { exitCode: 8, stdout: '', stderr: 'Failed to write pipeline-state.json: ' + err.message };
  }

  var fieldsStr = Object.keys(stateUpdate).map(function(k) { return k + '=' + stateUpdate[k]; }).join(' ');
  return {
    exitCode: 0,
    stdout: 'Advanced: ' + featureSlug + '/' + storyId + ' \u2014 ' + fieldsStr,
    stderr: '',
  };
}

module.exports = { advance: advance };

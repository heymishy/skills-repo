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

// Known boolean fields — values must be 'true' or 'false' and are coerced to JS booleans.
var BOOLEAN_FIELDS = [
  'releaseReady',
  'layoutGapsAtMerge',
  'layoutGapsRiskAccepted',
  'gateChecksumVerified',
  'regulated',
  'stalenessFlag',
  'hasInfraTrack',
  'hasMigrationTrack',
];

// Path fields — always stored as strings; integer coercion is skipped (no numeric paths allowed).
var STRING_FIELDS = [
  'infraPlanPath',
  'migrationReviewPath',
];

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
  var PROTO_BLOCKED = ['__proto__', 'constructor', 'prototype'];
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

    // ── Prototype pollution guard (OWASP A03) ─────────────────────────────
    if (PROTO_BLOCKED.indexOf(field) !== -1) {
      return { exitCode: 8, stdout: '', stderr: 'Rejected field name \'' + field + '\': prototype pollution risk.' };
    }
    // Validate dot-notation depth and segments
    if (field.indexOf('.') !== -1) {
      var parts = field.split('.');
      if (parts.length > 2) {
        return { exitCode: 8, stdout: '', stderr: 'Field \'' + field + '\': only single-level dot-notation (parent.child) is supported.' };
      }
      for (var pi = 0; pi < parts.length; pi++) {
        if (PROTO_BLOCKED.indexOf(parts[pi]) !== -1) {
          return { exitCode: 8, stdout: '', stderr: 'Rejected field segment \'' + parts[pi] + '\': prototype pollution risk.' };
        }
      }
    }

    // ── Boolean validation ─────────────────────────────────────────────────
    if (BOOLEAN_FIELDS.indexOf(field) !== -1) {
      if (value !== 'true' && value !== 'false') {
        return {
          exitCode: 8, stdout: '',
          stderr: 'Invalid value \'' + value + '\' for boolean field \'' + field + '\'. Accepted values: true, false',
        };
      }
    }

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

  // ── Split fields: feature-scoped (`feature.<field>`) vs story-scoped ──────
  // pcr-s1 (AC3/AC4): only a `feature.<field>` write is a genuine feature-level
  // milestone and bumps `feature.updatedAt`. Plain (story-scoped) fields never
  // touch `feature.updatedAt` — this is what makes two stories in the same
  // feature advancing concurrently produce zero conflict on that shared line.
  var allKeys = Object.keys(stateUpdate);
  var featureKeys = allKeys.filter(function(k) { return k.indexOf('feature.') === 0; });
  var storyKeys = allKeys.filter(function(k) { return k.indexOf('feature.') !== 0; });

  function coerce(key, val) {
    // Integer coercion: bare digit strings become numbers (skipped for STRING_FIELDS — path values stay as strings).
    if (/^\d+$/.test(val) && STRING_FIELDS.indexOf(key) === -1) { val = Number(val); }
    // Boolean coercion: fields in BOOLEAN_FIELDS are coerced from 'true'/'false' strings to booleans.
    // Values are already validated in the parsing loop — only 'true'/'false' can reach here.
    if (BOOLEAN_FIELDS.indexOf(key) !== -1) { val = (val === 'true'); }
    return val;
  }

  // ── Apply feature-scoped fields directly to the feature object ───────────
  if (featureKeys.length > 0) {
    featureKeys.forEach(function(key) {
      var fieldName = key.slice('feature.'.length);
      feature[fieldName] = coerce(key, stateUpdate[key]);
    });
    feature.updatedAt = new Date().toISOString();
  }

  // ── Find or create story entry — only when there are story-scoped fields ─
  // A pure feature-level milestone call (no story-scoped fields) must not
  // create a phantom story entry just because a storyId was passed.
  var story = null;
  if (storyKeys.length > 0) {
    if (!Array.isArray(feature.stories)) feature.stories = [];
    story = feature.stories.find(function(s) {
      return s.id === storyId || s.slug === storyId;
    });
    // If not in flat stories, search epic-nested stories
    if (!story) {
      var epics = feature.epics || [];
      for (var ei = 0; ei < epics.length; ei++) {
        var epicStories = epics[ei].stories || [];
        var found = epicStories.find(function(s) {
          return s.id === storyId || s.slug === storyId;
        });
        if (found) { story = found; break; }
      }
    }
    // Still not found — create a new flat entry
    if (!story) {
      story = { id: storyId };
      feature.stories.push(story);
    }

    // ── Apply story-scoped fields (with integer coercion and single-level dot-notation) ─
    storyKeys.forEach(function(key) {
      var val = coerce(key, stateUpdate[key]);
      // Dot-notation: parent.child → story[parent][child]
      if (key.indexOf('.') !== -1) {
        var segs = key.split('.');
        var parent = segs[0];
        var child  = segs[1];
        if (typeof story[parent] !== 'object' || story[parent] === null) {
          story[parent] = {};
        }
        story[parent][child] = val;
      } else {
        story[key] = val;
      }
    });

    // Story-scoped writes stamp the story's own updatedAt automatically —
    // this removes the need for every caller (SKILL.md instruction) to pass
    // it explicitly, and never touches feature.updatedAt. An explicitly
    // passed `updatedAt` field is respected as-is (existing callers/tests
    // may set a specific value on purpose) — auto-stamp only fills the gap
    // when the caller didn't provide one.
    if (storyKeys.indexOf('updatedAt') === -1) {
      story.updatedAt = new Date().toISOString();
    }
  }

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

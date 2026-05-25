// cli-gate-advance.js — gated pipeline-state advance with artefact validation
// Returns { exitCode, stdout, stderr }. No process.exit(). No file writes until
// validate() passes. Implements AC1–AC3 of cdg.7.
'use strict';

var { validate } = require('./cli-outer-loop');
var { advance }  = require('./cli-advance');

var USAGE = 'Usage: skills gate-advance <feature-slug> <story-id> <gate-name> <artefact-path> [field=value...]';

/**
 * Validate an artefact against a gate, then advance pipeline-state fields.
 * If validate() returns a non-zero exit code, the state file is not modified.
 *
 * @param {string}   featureSlug  — pipeline-state feature slug
 * @param {string}   storyId      — story id or slug
 * @param {string}   gateName     — gate to validate (e.g. 'definition-of-ready')
 * @param {string}   artefactPath — path to the artefact to validate
 * @param {string[]} rawFields    — array of "field=value" pairs for advance()
 * @param {string}   repoRoot     — absolute path to the repository root
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function gateAdvance(featureSlug, storyId, gateName, artefactPath, rawFields, repoRoot) {
  // AC3: all four positional args are required
  if (!featureSlug || !storyId || !gateName || !artefactPath) {
    return {
      exitCode: 8,
      stdout: '',
      stderr: 'Missing required argument(s). ' + USAGE +
        '\nRequired positional args: feature-slug, story-id, gate-name, artefact-path',
    };
  }

  // AC1: run the gate validation — if non-zero, propagate and do not touch state
  var valResult = validate(artefactPath, gateName, repoRoot);
  if (valResult.exitCode !== 0) {
    return valResult;
  }

  // AC2: validation passed — advance pipeline-state fields
  return advance(featureSlug, storyId, rawFields || [], repoRoot);
}

module.exports = { gateAdvance };

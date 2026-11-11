'use strict';

// src/pep-s2-patch-programme-and-workflow/step0-scorer.js — pep-s2
//
// Executable mirror of skills/programme/SKILL.md's PATCHED Step 0 scoring
// table (AC1), used to verify AC2/AC3's real-case outcomes programmatically.
// Deliberately does NOT modify pep-s1-dry-run.js's own scoreStep0 — that
// function is pep-s1's own historical snapshot of the Step 0 verdict BEFORE
// this patch (phase4: fail), already shipped and DoD-complete; mutating it
// would silently flip pep-s1's own already-recorded finding. This module
// adds the new epicCountAtLeastFour signal on top of the same signal shape,
// reusing pep-s1's generic (non-phase4-specific) helpers where they already
// do exactly what's needed.
//
// The epic-count threshold is imported from scripts/detect-programme-
// candidates.js (pep-s3) rather than restated here, so the two stay
// coupled — if pep-s3's threshold ever changes, this module (and its tests)
// pick up the new value automatically instead of silently drifting.

const { countEpics } = require('../pep-s1-retrospective-dry-run/pep-s1-dry-run');
const { EPIC_COUNT_THRESHOLD } = require('../../scripts/detect-programme-candidates');

/**
 * Patched Step 0 scoring — the same 5 original signals plus the new
 * epic-count signal this story (pep-s2) adds to the scoring table.
 * @param {object} profile - { operatorCount, operatorNames, crossTeamDeps:{value,detail},
 *   formalPhaseGates? , phaseGates:{value,detail}, consumerMigrationStep0Sense:{value,detail},
 *   timelineSpanDays, timelineRange:{min,max}, epicCount }
 * @returns {{verdict: 'pass'|'fail', signals: object}}
 */
function scoreStep0Patched(profile) {
  const signals = {
    multipleTeams: {
      value: profile.operatorCount >= 2,
      detail: profile.operatorCount + ' operator(s)' + (profile.operatorNames ? ': ' + profile.operatorNames.join(', ') : ''),
    },
    crossTeamHardDeps: { value: profile.crossTeamDeps.value, detail: profile.crossTeamDeps.detail },
    formalPhaseGates: { value: profile.phaseGates.value, detail: profile.phaseGates.detail },
    consumerMigration: { value: profile.consumerMigration.value, detail: profile.consumerMigration.detail },
    timelineMultiPhaseOverOneQuarter: {
      value: profile.timelineSpanDays > 90,
      detail: profile.timelineSpanDays + '-day span',
    },
    epicCountAtLeastFour: {
      value: profile.epicCount >= EPIC_COUNT_THRESHOLD,
      detail: profile.epicCount + ' epic(s) within a single feature (threshold: ' + EPIC_COUNT_THRESHOLD + ')',
    },
  };
  const firingSignals = Object.keys(signals).filter((k) => signals[k].value);
  return {
    verdict: firingSignals.length > 0 ? 'pass' : 'fail',
    firingSignals,
    signals,
  };
}

/**
 * Builds a Step 0 profile for any archived/real fixture directory, reusing
 * pep-s1's own generic (not phase4-specific) epic-count helper. Other
 * signals are supplied by the caller since they are not mechanically
 * derivable the same way for every fixture (pep-s1's own qualitative
 * reader is phase4-specific prose, out of this story's scope to generalize).
 * @param {string} fixtureDir - absolute path to the fixture's artefact directory
 * @param {object} overrides - { operatorCount, operatorNames, crossTeamDeps, phaseGates, consumerMigration, timelineSpanDays }
 */
function buildProfile(fixtureDir, overrides) {
  return Object.assign(
    {
      epicCount: countEpics(fixtureDir),
      operatorCount: 1,
      operatorNames: [],
      crossTeamDeps: { value: false, detail: 'not evaluated for this profile' },
      phaseGates: { value: false, detail: 'not evaluated for this profile' },
      consumerMigration: { value: false, detail: 'not evaluated for this profile' },
      timelineSpanDays: 0,
    },
    overrides || {}
  );
}

module.exports = {
  scoreStep0Patched,
  buildProfile,
  EPIC_COUNT_THRESHOLD,
};

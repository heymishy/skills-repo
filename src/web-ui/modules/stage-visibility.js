'use strict';

// ep2-s2: role -> default-visible-stage-subset mapping. Hardcoded now, same
// "hardcode now, DB-backed later" precedent as pod-store.js's VALID_ROLES
// (see that file's own header comment and design.md Open Question #5). Real
// stage universe confirmed against journey-store.js's completeStage() call
// sites -- see decisions.md (2026-09-18) for why "coding" is not included
// (it cannot exist as a completedStages entry in this codebase's real data
// model, and this is a documented AC-level RISK-ACCEPT, not an oversight).
//
// Frozen more deeply than VALID_ROLES (which is a plain unfrozen array):
// getVisibleStages() hands back the same shared array reference to every
// caller, so without freezing, one caller mutating the result (e.g.
// .push()) would silently corrupt visibility for every subsequent caller.

var ALL_STAGES = Object.freeze(['ideate', 'discovery', 'benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready']);

var STAGE_VISIBILITY_BY_ROLE = Object.freeze({
  product:   Object.freeze(['discovery', 'benefit-metric', 'definition']),
  engineer:  Object.freeze(['test-plan', 'review', 'definition-of-ready']),
  conductor: ALL_STAGES,
  architect: ALL_STAGES
});

/**
 * @param {string} roleId
 * @returns {string[]} the stage subset this role sees by default. An
 *   unrecognised roleId fails open (all stages) rather than fails hidden
 *   (zero stages) -- never wrongly hide something from a role this mapping
 *   doesn't yet know about.
 */
function getVisibleStages(roleId) {
  return STAGE_VISIBILITY_BY_ROLE[roleId] || ALL_STAGES;
}

module.exports = { ALL_STAGES, STAGE_VISIBILITY_BY_ROLE, getVisibleStages };

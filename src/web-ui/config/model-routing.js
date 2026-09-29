'use strict';

// model-routing.js — psrc-s1: single source of truth for per-skill model
// routing. Previously duplicated in two places in routes/skills.js
// (getModelForSkill() and the streaming turn handler's own inline block) --
// nothing enforced they stayed in sync, so a future edit to one without the
// other could make the UI's displayed model badge lie about what actually ran.
//
// Per-skill overrides (WUCE_MODEL_OVERRIDE_<SKILL>) let an operator test a
// single skill on a different model via a scoped Fly secret, without the
// blanket, all-skills, all-traffic blast radius of WUCE_FAST_MODEL.
//
// Precedence, most to least specific: per-skill override -> WUCE_FAST_MODEL
// (blanket, kept for backward compatibility) -> module default.
//
// Safety invariant (EXP-021): Haiku fabricates regulatory constraints on
// /discovery that are structurally compliant (pass automated gates) but
// content-wrong. No override path -- per-skill or blanket -- may route a
// HAIKU_BLOCKED_SKILLS skill to a Haiku model. This is unconditional.

// getActiveModel() mirrors the executor's own fallback chain
// (WUCE_TURN_MODEL || DEFAULT_ANTHROPIC_MODEL/DEFAULT_MODEL) exactly --
// it is the correct "no override" value for Sonnet-routed skills, NOT a
// hardcoded literal. skill-turn-executor.js's DEFAULT_ANTHROPIC_MODEL is
// 'claude-sonnet-4.6' (dot), not 'claude-sonnet-4-6' (dash) used elsewhere
// in this codebase for display/pricing -- calling the real function avoids
// baking in the wrong literal.
const { getActiveModel } = require('../../modules/skill-turn-executor');

const DEFAULT_SONNET_SKILLS = ['discovery', 'ideate'];
const HAIKU_BLOCKED_SKILLS = ['discovery'];

// psrc-verify-s3: the 5 governance-critical skills that ship via
// WUCE_MODEL_OVERRIDE_<SKILL> Fly secrets (psrc-verify-s2), distinct from
// DEFAULT_SONNET_SKILLS above (skills that default to Sonnet with NO
// override at all). This list is deliberately its own constant, not merged
// into DEFAULT_SONNET_SKILLS -- confusing the two was flagged and fixed at
// /review (finding 1-M1): DEFAULT_SONNET_SKILLS means "no override needed",
// this means "an override is INTENDED to exist and resolve to Sonnet".
// wuar-s1: benefit-metric, decisions, and definition-of-done are equally
// governance-critical (they gate what ships) but were never added here when
// this list was created -- confirmed via a live audit of
// 2026-09-28-weeb-ui-learnings-and-improvements that benefit-metric was
// still silently routing to Haiku in production, with no drift-guard
// coverage to catch it.
const DRIFT_GUARD_SONNET_SKILLS = ['design', 'definition', 'review', 'test-plan', 'definition-of-ready', 'benefit-metric', 'decisions', 'definition-of-done'];

function _isHaikuModel(modelId) {
  return !!(modelId && modelId.indexOf('haiku') !== -1);
}

function _overrideEnvName(skillName) {
  return 'WUCE_MODEL_OVERRIDE_' + String(skillName).toUpperCase().replace(/-/g, '_');
}

/**
 * Resolve the model to use for a given skill.
 * @param {string} skillName
 * @param {object} [envVars] - defaults to process.env; injected for testability
 *   (note: the Sonnet-skill default path calls the real, non-injectable
 *   getActiveModel(), which reads real process.env -- matches the original
 *   getModelForSkill()'s own behaviour, not a testability regression)
 * @param {{allowBlanketOverride?: boolean}} [options] - allowBlanketOverride
 *   defaults to true; the streaming turn handler passes false during a
 *   mid-artefact continuation turn, mirroring its pre-existing
 *   rawAnswer/_artefactInProgress guard on WUCE_FAST_MODEL
 * @returns {string} model id
 */
function getModelForSkill(skillName, envVars, options) {
  envVars = envVars || process.env;
  options = options || {};
  const allowBlanketOverride = options.allowBlanketOverride !== false;

  const defaultModel = DEFAULT_SONNET_SKILLS.indexOf(skillName) !== -1
    ? getActiveModel()
    : (envVars.WUCE_HAIKU_MODEL || 'claude-haiku-4-5');

  const isBlocked = HAIKU_BLOCKED_SKILLS.indexOf(skillName) !== -1;

  const perSkillOverride = envVars[_overrideEnvName(skillName)];
  if (perSkillOverride) {
    if (_isHaikuModel(perSkillOverride) && isBlocked) {
      return defaultModel; // refused -- fabrication risk is not prompt-tunable
    }
    return perSkillOverride;
  }

  if (allowBlanketOverride) {
    const blanketOverride = envVars.WUCE_FAST_MODEL;
    if (blanketOverride) {
      if (_isHaikuModel(blanketOverride) && isBlocked) {
        return defaultModel; // refused, same guard as the per-skill path
      }
      return blanketOverride;
    }
  }

  return defaultModel;
}

/**
 * psrc-verify-s3: check whether any of DRIFT_GUARD_SONNET_SKILLS is
 * currently resolving to a Haiku model -- the exact scenario that
 * recurred twice (2026-09-15 marker-emission bug, 2026-09-29 shallow-
 * completion bug), both times because a WUCE_MODEL_OVERRIDE_<SKILL> Fly
 * secret that was supposed to route a governance-critical skill to Sonnet
 * either was never set, or was silently removed. Pure, read-only, directly
 * unit-testable -- takes an injectable envVars object mirroring
 * getModelForSkill's own existing testability pattern, never mutates
 * anything, never touches DEFAULT_SONNET_SKILLS/HAIKU_BLOCKED_SKILLS.
 * @param {object} [envVars] - defaults to process.env; injected for testability
 * @returns {Array<{skill: string, resolvedModel: string}>} one entry per
 *   drifted skill; empty array when all of DRIFT_GUARD_SONNET_SKILLS
 *   correctly resolve to a non-Haiku model
 */
function checkModelRoutingDrift(envVars) {
  envVars = envVars || process.env;
  const drifted = [];
  DRIFT_GUARD_SONNET_SKILLS.forEach((skillName) => {
    const resolvedModel = getModelForSkill(skillName, envVars);
    if (_isHaikuModel(resolvedModel)) {
      drifted.push({ skill: skillName, resolvedModel });
    }
  });
  return drifted;
}

module.exports = {
  getModelForSkill,
  checkModelRoutingDrift,
  DEFAULT_SONNET_SKILLS,
  HAIKU_BLOCKED_SKILLS,
  DRIFT_GUARD_SONNET_SKILLS,
};

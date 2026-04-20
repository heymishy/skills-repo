'use strict';
// src/teams-bot/artefact-assembler.js
// p4-nta-artefact-parity — Assemble artefact from completed Teams bot session
//
// ADR-004: no hardcoded artefact paths; featureSlug injected by caller
// MC-SEC-02: no session.answers or answer content in log calls
// C1: no fork logic

// Required fields for the discovery template
const REQUIRED_ANSWER_KEYS = ['problem', 'who', 'outcome', 'scope'];

/**
 * Returns a branch name following chore/nta-<slug>-YYYY-MM-DD convention.
 *
 * @param {{ featureSlug: string }} opts
 * @returns {string}
 */
function getBranchName({ featureSlug } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return 'chore/nta-' + (featureSlug || 'feature') + '-' + today;
}

/**
 * Assembles a pipeline artefact object from a completed session.
 * Returns null if the session is incomplete (any required field missing).
 *
 * @param {{ featureSlug: string, template: string, answers: object, standardsInjected: boolean, sessionId: string }} session
 * @returns {object | null}
 */
function assembleArtefact(session) {
  if (!session || !session.answers) return null;

  // Validate completeness — all required keys must be present and non-empty
  for (const key of REQUIRED_ANSWER_KEYS) {
    const val = session.answers[key];
    if (val === undefined || val === null || val === '') return null;
  }

  const today      = new Date().toISOString().slice(0, 10);
  const featureSlug = session.featureSlug || 'feature';
  const template   = session.template || 'discovery';

  return {
    featureSlug:       featureSlug,
    template:          template,
    artefactPath:      'artefacts/' + today + '-' + featureSlug + '/' + template + '.md',
    branchName:        getBranchName({ featureSlug }),
    sessionId:         session.sessionId || null,
    standards_injected: session.standardsInjected === true,
    problem:           session.answers.problem,
    who:               session.answers.who,
    outcome:           session.answers.outcome,
    scope:             session.answers.scope,
    assembledAt:       new Date().toISOString(),
  };
}

module.exports = { assembleArtefact, getBranchName };

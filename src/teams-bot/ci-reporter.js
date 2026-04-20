'use strict';
// src/teams-bot/ci-reporter.js
// p4-nta-ci-artefact — CI artefact quality reporter for Teams bot sessions
//
// MC-CORRECT-02: only returns null (clean) or { level: 'warning', ... } (never 'error' or 'failure')
// ADR-004: no hardcoded artefact paths
// MC-SEC-02: no credentials in warning output

/**
 * Checks whether an artefact produced by the Teams bot session has standards injected.
 * If standards_injected is false, emits a warning (not an error) — the artefact is still valid.
 * Returns null for clean artefacts; { level: 'warning', ... } otherwise.
 *
 * @param {{ artefactPath: string, standardsInjected: boolean }} opts
 * @returns {{ level: 'warning', message: string, artefactPath: string } | null}
 */
function checkBotArtefact({ artefactPath, standardsInjected } = {}) {
  if (standardsInjected) return null;

  return {
    level:       'warning',
    message:     'Artefact "' + (artefactPath || '') + '" was produced without standards injection (standards_injected: false). ' +
                 'Consider running skills-repo init to install the standards sidecar before the next session.',
    artefactPath: artefactPath || '',
  };
}

module.exports = { checkBotArtefact };

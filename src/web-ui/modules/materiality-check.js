'use strict';

// materiality-check.js — res-s3: deterministic section-diff classifier +
// rationale generation. Compares a stage's pre-revision and post-revision
// artefact content (already handed to it by res-s2's overwrite flow) and
// classifies the change as material (Problem Statement, MVP Scope, or
// Constraints section changed) or minor (anything else — wording, phrasing,
// typos). Deterministic by design (D37/decisions.md 2026-08-28 ARCH entry,
// res-s3) — NOT an LLM/model judgment call.
//
// Task 1 of 4 (res-s3 implementation plan): pure classification only. No
// orchestration, no PostHog logging, no chat-turn handler wiring — those are
// Tasks 2-4.

// Target sections match discovery.md's real heading names (Problem Statement,
// MVP Scope, Constraints) — confirmed against
// artefacts/2026-08-27-revise-earlier-stage/discovery.md.
var TARGET_SECTIONS = ['Problem Statement', 'MVP Scope', 'Constraints'];

function _parseSections(markdown) {
  var sections = {};
  var lines = (markdown || '').split('\n');
  var currentHeading = null;
  var currentLines = [];
  function flush() {
    if (currentHeading !== null) {
      sections[currentHeading] = currentLines.join('\n').trim();
    }
  }
  for (var i = 0; i < lines.length; i++) {
    var m = lines[i].match(/^##\s+(.+?)\s*$/);
    if (m) {
      flush();
      currentHeading = m[1].trim();
      currentLines = [];
    } else if (currentHeading !== null) {
      currentLines.push(lines[i]);
    }
  }
  flush();
  return sections;
}

/**
 * Deterministic materiality classifier. Compares only TARGET_SECTIONS' text
 * between pre- and post-revision content — a change anywhere else (wording,
 * phrasing, typos) never flips the classification.
 * @param {string} preContent
 * @param {string} postContent
 * @returns {{classification: 'material'|'minor', changedSections: string[]}}
 */
function checkMateriality(preContent, postContent) {
  var preSections = _parseSections(preContent);
  var postSections = _parseSections(postContent);
  var changedSections = TARGET_SECTIONS.filter(function(name) {
    return (preSections[name] || '') !== (postSections[name] || '');
  });
  return {
    classification: changedSections.length > 0 ? 'material' : 'minor',
    changedSections: changedSections
  };
}

/**
 * One-sentence rationale, deterministically derived from the diff's own
 * output — no model call.
 * @param {'material'|'minor'} classification
 * @param {string[]} changedSections
 * @returns {string}
 */
function generateRationale(classification, changedSections) {
  if (classification === 'material') {
    var joined = changedSections.length > 1
      ? changedSections.slice(0, -1).join(', ') + ' and ' + changedSections[changedSections.length - 1]
      : changedSections[0];
    return 'This looks like a material change — the ' + joined + ' section' + (changedSections.length > 1 ? 's' : '') + ' changed.';
  }
  return 'This looks like a minor change — no scope or constraint impact detected.';
}

module.exports = { checkMateriality: checkMateriality, generateRationale: generateRationale, TARGET_SECTIONS: TARGET_SECTIONS };

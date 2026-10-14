'use strict';

// field-suggestion-ai.js — jae-s4: D37 injectable adapter for the LLM-generated
// fallback field suggestion, used only when jae-s3's own deterministic scan
// (getFieldSuggestions) has nothing to offer for a given field. Mirrors
// artefact-fetcher.js's own fetchRepoPath/setFetchRepoPath/getFetchRepoPath
// pattern exactly (throw-on-unwired stub default, set/get pair, a separate
// "real" implementation wired in server.js as its own D37 task).

const { skillTurnExecutor } = require('../../modules/skill-turn-executor');

// Small, fixed, conservative bound -- a field suggestion is a short piece of
// prose (1-3 sentences), never a full skill-turn-sized response. Passed via
// meta.maxTokens, an optional per-call override added to skillTurnExecutor
// for this story (every existing caller omits it and is unaffected).
const SUGGESTION_MAX_TOKENS = 300;

/**
 * Build the system prompt for one field suggestion. Scoped tightly to the
 * field being suggested and the stage/journey context available -- never a
 * general-purpose "write anything" prompt (per the scoping spike's own
 * named guardrail).
 * @param {{stageName: string, journeyName: string, featureSlug?: string}} stageContext
 * @param {'customer_actions'|'pain_points'} field
 * @returns {string}
 */
function buildFieldSuggestionPrompt(stageContext, field) {
  const fieldLabel = field === 'pain_points' ? 'pain points' : 'customer actions';
  const featureLine = stageContext.featureSlug
    ? `This stage is linked to the feature "${stageContext.featureSlug}".`
    : 'This stage is not yet linked to a specific feature.';
  return [
    'You are helping a product owner fill in a customer journey map stage.',
    `Stage name: "${stageContext.stageName}"`,
    `Journey name: "${stageContext.journeyName}"`,
    featureLine,
    `Suggest a short, empathetic, plausible starting point for the stage's own "${fieldLabel}" field.`,
    'Write 1-2 sentences of plain prose only -- no headings, no lists, no preamble, no quotation marks.',
    'The operator will review and edit this before saving it -- write a genuine, specific starting draft, not a generic placeholder.'
  ].join('\n');
}

/**
 * Real implementation -- calls skillTurnExecutor (src/modules/skill-turn-executor.js)
 * unmodified in its call shape (ADR-026 reuse), with a jae-s4-added optional
 * maxTokens override to keep this short completion cost-bounded. Any error
 * (missing ANTHROPIC_API_KEY, network failure, timeout) or an empty/
 * whitespace-only response resolves to null rather than throwing -- the
 * caller (the new ai-suggestion route) treats null as "no suggestion
 * available," exactly as jae-s3's own getFieldSuggestions already does for
 * its own no-match case (AC5).
 * @param {{stageName: string, journeyName: string, featureSlug?: string}} stageContext
 * @param {'customer_actions'|'pain_points'} field
 * @returns {Promise<string|null>}
 */
async function realGenerateAiFieldSuggestion(stageContext, field) {
  try {
    const systemPrompt = buildFieldSuggestionPrompt(stageContext, field);
    const text = await skillTurnExecutor(systemPrompt, [], 'Begin.', null, { maxTokens: SUGGESTION_MAX_TOKENS });
    const trimmed = (text || '').trim();
    return trimmed || null;
  } catch (_) {
    return null;
  }
}

let _generateAiFieldSuggestion = function() {
  throw new Error('Adapter not wired: generateAiFieldSuggestion. Call setGenerateAiFieldSuggestion() with a real implementation before use.');
};

/**
 * Generate an LLM-based fallback suggestion for one field (used in tests and production).
 * @param {{stageName: string, journeyName: string, featureSlug?: string}} stageContext
 * @param {'customer_actions'|'pain_points'} field
 * @returns {Promise<string|null>}
 */
function generateAiFieldSuggestion(stageContext, field) {
  return getGenerateAiFieldSuggestion()(stageContext, field);
}

/**
 * Replace the AI field-suggestion adapter (used in tests and production startup).
 * @param {(stageContext: object, field: string) => Promise<string|null>} impl
 */
function setGenerateAiFieldSuggestion(impl) {
  _generateAiFieldSuggestion = impl;
}

/**
 * Retrieve the currently wired adapter function. Callers invoke
 * getGenerateAiFieldSuggestion()(stageContext, field) rather than holding a
 * captured reference, so rewiring always takes effect for the next call.
 * @returns {Function}
 */
function getGenerateAiFieldSuggestion() {
  return _generateAiFieldSuggestion;
}

module.exports = {
  buildFieldSuggestionPrompt,
  realGenerateAiFieldSuggestion,
  generateAiFieldSuggestion,
  setGenerateAiFieldSuggestion,
  getGenerateAiFieldSuggestion,
  SUGGESTION_MAX_TOKENS
};

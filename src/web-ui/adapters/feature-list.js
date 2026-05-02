'use strict';

// feature-list.js — listFeatures adapter (ADR-012)
// Reads configured repositories and returns a feature list with:
// slug, stage, lastUpdated, artefactIndexUrl per feature.
// Server-side access validation is performed before any data is returned (AC1, NFR2).

const { labelArtefactType } = require('../utils/plain-language-labels');

// Injected dependencies — replaced in tests via setters
let _validateRepositoryAccess = async (/* owner, repo, token */) => true;
let _fetchPipelineState = async (/* owner, repo, token */) => null;
let _getConfiguredRepositories = () => {
  const raw = process.env.WUCE_REPOSITORIES || '';
  return raw.split(',').map((r) => r.trim()).filter(Boolean);
};
let _auditLogger = {
  info: (/* event, data */) => {}
};

function setValidateRepositoryAccess(fn) { _validateRepositoryAccess = fn; }
function setFetchPipelineState(fn)       { _fetchPipelineState = fn; }
function setConfiguredRepositories(fn)   { _getConfiguredRepositories = fn; }
function setAuditLogger(logger)          { _auditLogger = logger; }

/**
 * Derive current pipeline stage from a feature object.
 * Stage is inferred from which artefact types are present (highest reached wins).
 * @param {Object} feature
 * @returns {string}
 */
function deriveStage(feature) {
  if (feature.stage) return feature.stage;
  // Infer from nested artefact presence
  const hasDor      = feature.dor      || feature.dorStatus;
  const hasTestPlan = feature.testPlan || feature.testPlanStatus;
  const hasStories  = (feature.stories && feature.stories.length > 0) || (feature.epics && feature.epics.length > 0);
  const hasBenefit  = feature.benefitMetric || feature.benefitMetricStatus;
  if (hasDor)      return 'dor';
  if (hasTestPlan) return 'test-plan';
  if (hasStories)  return 'definition';
  if (hasBenefit)  return 'benefit-metric';
  return 'discovery';
}

/**
 * List all features in the configured repositories.
 * Validates repository access before returning any data (NFR2).
 *
 * @param {string} token  OAuth access token
 * @returns {Promise<Array<{ slug: string, stage: string, lastUpdated: string, artefactIndexUrl: string }>>}
 */
async function listFeatures(token) {
  const repos = _getConfiguredRepositories();
  const results = [];

  for (const repoPath of repos) {
    const [owner, repo] = repoPath.split('/');
    if (!owner || !repo) continue;

    // Security: validate read access before returning any data for this repo (NFR2)
    const canAccess = await _validateRepositoryAccess(owner, repo, token);
    if (!canAccess) continue;

    const state = await _fetchPipelineState(owner, repo, token);
    if (!state || !state.features) continue;

    for (const feature of state.features) {
      results.push({
        slug:             feature.slug || feature.id || '',
        stage:            deriveStage(feature),
        lastUpdated:      feature.updatedAt || feature.lastUpdated || '',
        artefactIndexUrl: `/features/${feature.slug || feature.id || ''}`
      });
    }
  }

  // Audit log: no tokens logged (NFR1)
  _auditLogger.info('feature_list_loaded', {
    featureCount: results.length,
    timestamp:    new Date().toISOString()
  });

  return results;
}

module.exports = {
  listFeatures,
  setValidateRepositoryAccess,
  setFetchPipelineState,
  setConfiguredRepositories,
  setAuditLogger,
  // Exported for testing only
  deriveStage,
  labelArtefactType
};

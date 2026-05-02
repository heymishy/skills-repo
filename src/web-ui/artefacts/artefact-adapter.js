'use strict';

// artefact-adapter.js — GitHub Contents API adapter (ADR-012)
// Respects GITHUB_API_BASE_URL for GitHub Enterprise Server support.
// Default API base: https://api.github.com

/**
 * Build the API base URL, respecting GITHUB_API_BASE_URL for GHE deployments.
 * - If GITHUB_API_BASE_URL is set: uses it as the API base, appending /api/v3 if absent
 * - Default: https://api.github.com
 * @returns {string}
 */
function buildApiBase() {
  const apiBase = process.env.GITHUB_API_BASE_URL;
  if (apiBase) {
    const clean = apiBase.replace(/\/+$/, '');
    return clean.endsWith('/api/v3') ? clean : clean + '/api/v3';
  }
  return 'https://api.github.com';
}

/**
 * Fetch a pipeline artefact from the GitHub Contents API.
 * Uses GITHUB_API_BASE_URL for GHE support (ADR-012).
 * @param {string} featureSlug - e.g. '2026-05-02-web-ui-copilot-execution-layer'
 * @param {string} artefactType - e.g. 'discovery', 'benefit-metric'
 * @param {string} token - OAuth access token
 * @returns {Promise<string>} raw file content
 */
async function fetchArtefact(featureSlug, artefactType, token) {
  const base  = buildApiBase();
  const owner = process.env.GITHUB_REPO_OWNER || 'org';
  const repo  = process.env.GITHUB_REPO_NAME  || 'repo';
  const path  = `artefacts/${featureSlug}/${artefactType}.md`;
  const url   = `${base}/repos/${owner}/${repo}/contents/${path}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept':        'application/vnd.github.v3.raw',
      'User-Agent':    'skills-pipeline-web-ui'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${path}`);
  }

  return response.text();
}

module.exports = { fetchArtefact, buildApiBase };

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

/**
 * Commit a pipeline artefact to the GitHub Contents API (create new file).
 * Uses GITHUB_API_BASE_URL for GHE support (ADR-012).
 * @param {object} opts
 * @param {string} opts.path          - repo-relative path, e.g. 'artefacts/slug/file.md'
 * @param {string} opts.content       - raw file content (will be base64-encoded)
 * @param {string} opts.accessToken   - OAuth access token
 * @param {string} opts.commitMessage - commit message string
 * @param {object} [opts.author]      - { name, email }
 * @param {object} [opts.committer]   - { name, email }
 * @returns {Promise<{content: object, commit: object}>} GitHub API response
 */
async function commitArtefact({ path: filePath, content, accessToken, commitMessage, author, committer }) {
  const base  = buildApiBase();
  const owner = process.env.GITHUB_REPO_OWNER || 'org';
  const repo  = process.env.GITHUB_REPO_NAME  || 'repo';
  const url   = `${base}/repos/${owner}/${repo}/contents/${filePath}`;

  const encodedContent = Buffer.from(content).toString('base64');
  const body = { message: commitMessage, content: encodedContent };
  if (author)    body.author    = author;
  if (committer) body.committer = committer;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${accessToken}`,
      'Content-Type':  'application/json',
      'Accept':        'application/vnd.github.v3+json',
      'User-Agent':    'skills-pipeline-web-ui'
    },
    body: JSON.stringify(body)
  });

  if (response.status === 409) {
    const err = new Error('409: Conflict');
    err.status = 409;
    throw err;
  }

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${filePath}`);
  }

  return response.json();
}

module.exports = { fetchArtefact, commitArtefact, buildApiBase };

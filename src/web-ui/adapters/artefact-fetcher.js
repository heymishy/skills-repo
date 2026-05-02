'use strict';

// artefact-fetcher.js — ADR-012: artefact-fetching adapter
// All artefact fetching goes through this module — no inline GitHub API calls in route handlers.
// Resolves artefact paths via GitHub Contents API using the user's OAuth token.

const GITHUB_API_BASE = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
const GITHUB_REPO     = process.env.GITHUB_REPO || '';

// ── Named error classes ────────────────────────────────────────────────────

class ArtefactNotFoundError extends Error {
  constructor(featureSlug, artefactType) {
    super(`Artefact not found: ${featureSlug}/${artefactType}`);
    this.name        = 'ArtefactNotFoundError';
    this.featureSlug = featureSlug;
    this.artefactType = artefactType;
  }
}

class ArtefactFetchError extends Error {
  constructor(message, cause) {
    super(message);
    this.name  = 'ArtefactFetchError';
    this.cause = cause;
  }
}

// ── Adapter ────────────────────────────────────────────────────────────────

/**
 * Fetch a pipeline artefact from GitHub Contents API.
 * @param {string} featureSlug  - e.g. '2026-01-01-example-feature'
 * @param {string} artefactType - e.g. 'discovery'
 * @param {string} token        - OAuth access token
 * @returns {Promise<string>} decoded markdown content
 * @throws {ArtefactNotFoundError} when the Contents API returns 404
 * @throws {ArtefactFetchError}    on non-404 error or network failure
 */
async function fetchArtefact(featureSlug, artefactType, token) {
  const repoPath = `artefacts/${featureSlug}/${artefactType}.md`;
  const url      = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${repoPath}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept':        'application/vnd.github.v3+json'
      }
    });
  } catch (err) {
    throw new ArtefactFetchError('Network error fetching artefact', err.message);
  }

  if (response.status === 404) {
    throw new ArtefactNotFoundError(featureSlug, artefactType);
  }

  if (!response.ok) {
    let errorMessage = 'Unknown error';
    try {
      const body = await response.json();
      errorMessage = body.message || errorMessage;
    } catch (_) { /* ignore parse failure */ }
    throw new ArtefactFetchError(`GitHub API error: ${response.status}`, errorMessage);
  }

  const data    = await response.json();
  const decoded = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return decoded;
}

module.exports = { fetchArtefact, ArtefactNotFoundError, ArtefactFetchError };

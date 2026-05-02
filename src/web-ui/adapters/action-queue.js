'use strict';

// action-queue.js — getPendingActions adapter (ADR-012)
// Detects pending sign-offs by absence of "## Approved by" section in artefact markdown.
// Validates repository access before surfacing items (Security NFR / ADR-009).
// Repository list from env var (ADR-004); never hardcoded.

const { getRepoList } = require('../config/repo-list');

// ── Injectable dependencies (replaced in tests) ───────────────────────────

let _validateRepositoryAccess = defaultValidateRepositoryAccess;
let _getArtefactDescriptors   = defaultGetArtefactDescriptors;
let _fetchArtefact            = defaultFetchArtefact;

function setValidateRepositoryAccess(fn) { _validateRepositoryAccess = fn; }
function setGetArtefactDescriptors(fn)   { _getArtefactDescriptors   = fn; }
function setFetchArtefact(fn)            { _fetchArtefact            = fn; }

// ── Default implementations (real GitHub API) ────────────────────────────

async function defaultValidateRepositoryAccess(owner, repo, token) {
  const apiBase = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
  const response = await fetch(`${apiBase}/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/json',
      'User-Agent': 'skills-pipeline-web-ui'
    }
  });
  return response.ok;
}

/**
 * Default: returns an empty list — real implementation would scan repo artefacts.
 * Phase 1: artefact list is injected by callers or overridden in tests.
 */
async function defaultGetArtefactDescriptors(/* owner, repo, token */) {
  return [];
}

async function defaultFetchArtefact(owner, repo, artefactPath, token) {
  const apiBase = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
  const response = await fetch(
    `${apiBase}/repos/${owner}/${repo}/contents/${artefactPath}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'skills-pipeline-web-ui'
      }
    }
  );
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.text();
}

// ── Core functions ────────────────────────────────────────────────────────

/**
 * Detect pending sign-off from artefact markdown content.
 * Returns true if "## Approved by" section is ABSENT.
 * @param {string} markdownContent
 * @returns {boolean}
 */
function hasPendingSignOff(markdownContent) {
  if (!markdownContent) return false;
  return !markdownContent.includes('## Approved by');
}

/**
 * Render the action queue as an HTML string.
 * @param {Array<{featureName:string,artefactType:string,daysPending:number,artefactUrl:string}>} items
 * @param {string|null} bannerMessage
 * @returns {string} HTML fragment
 */
function renderActionQueue(items, bannerMessage) {
  let html = '<section class="action-queue">';

  if (bannerMessage) {
    html += `<div class="action-queue-banner" role="alert">${escapeHtml(bannerMessage)}</div>`;
  }

  if (items.length === 0) {
    html += '<p class="action-queue-empty">No actions pending — you\'re up to date</p>';
  } else {
    html += '<ul class="action-queue-list">';
    for (const item of items) {
      const linkText = `${escapeHtml(item.artefactType)} for ${escapeHtml(item.featureName)}`;
      html += '<li class="action-queue-item">';
      html += `<a href="${escapeHtml(item.artefactUrl)}" class="action-queue-link">${linkText}</a>`;
      html += ` <span class="days-pending">${escapeHtml(String(item.daysPending))} day(s) pending</span>`;
      html += `<span class="feature-name">${escapeHtml(item.featureName)}</span>`;
      html += '</li>';
    }
    html += '</ul>';
  }

  html += '</section>';
  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Get pending actions for the authenticated user.
 * Returns { items: [...], bannerMessage: null|string }
 * @param {object} userIdentity - { id, login }
 * @param {string} token - OAuth access token
 * @returns {Promise<{ items: Array, bannerMessage: string|null }>}
 */
async function getPendingActions(userIdentity, token) {
  const repos = getRepoList();
  const items = [];
  let hadAccessFailure = false;

  for (const repoSpec of repos) {
    const parts = repoSpec.split('/');
    const owner    = parts[0];
    const repoName = parts[1];

    // Server-side repository access validation (Security NFR)
    let hasAccess;
    try {
      hasAccess = await _validateRepositoryAccess(owner, repoName, token);
    } catch (_err) {
      hasAccess = false;
    }

    if (!hasAccess) {
      hadAccessFailure = true;
      continue;
    }

    // Get list of artefacts to check for this repo
    let artefacts;
    try {
      artefacts = await _getArtefactDescriptors(owner, repoName, token);
    } catch (_err) {
      artefacts = [];
    }

    for (const artefact of artefacts) {
      try {
        const content = await _fetchArtefact(owner, repoName, artefact.path, token);
        if (hasPendingSignOff(content)) {
          const created     = artefact.createdAt || new Date().toISOString();
          const daysPending = Math.max(0, Math.floor(
            (Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24)
          ));
          items.push({
            featureName:  artefact.featureName,
            artefactType: artefact.artefactType,
            daysPending,
            artefactUrl:  artefact.artefactUrl ||
              `/features/${artefact.featureSlug}/${artefact.artefactType.toLowerCase().replace(/\s+/g, '-')}`
          });
        }
      } catch (_err) {
        // Skip individual artefact fetch errors
      }
    }
  }

  return {
    items,
    bannerMessage: hadAccessFailure
      ? 'Some repositories could not be checked — re-authenticate if you believe items are missing.'
      : null
  };
}

module.exports = {
  hasPendingSignOff,
  getPendingActions,
  renderActionQueue,
  // Dependency injection hooks
  setValidateRepositoryAccess,
  setGetArtefactDescriptors,
  setFetchArtefact
};

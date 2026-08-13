'use strict';

// guardrail-pr-adapter.js — wugs-s6, ADR-012
// Creates a branch, commits a guardrail/standard file (new or SHA-based
// update), and opens a PR against the tenant's connected repo. Never
// writes the default branch directly. A genuinely new branch-then-PR flow
// — does NOT reuse repo-bootstrap.js's realBootstrapRepo or its
// direct-to-master pattern (Architecture Constraints).

class GuardrailPrError extends Error {
  constructor(step, message) {
    super(`${step}: ${message}`);
    this.name = 'GuardrailPrError';
    this.step = step;
  }
}

class GuardrailPrConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GuardrailPrConflictError';
  }
}

const _posthog = require('../modules/posthog-server');

let _guardrailPrAdapter = function() {
  throw new Error('Adapter not wired: guardrailPrAdapter. Call setGuardrailPrAdapter() with a real implementation before use.');
};

/**
 * @param {string} token   - operator's own session OAuth token
 * @param {string} owner
 * @param {string} repo
 * @param {string} targetPath
 * @param {string} content
 * @param {object} options - { tenantId, productId, defaultBranch, posthog }
 */
async function createGuardrailPr(token, owner, repo, targetPath, content, options) {
  return getGuardrailPrAdapter()(token, owner, repo, targetPath, content, options);
}

function setGuardrailPrAdapter(impl) {
  _guardrailPrAdapter = impl;
}

function getGuardrailPrAdapter() {
  return _guardrailPrAdapter;
}

async function _ghRequest(token, apiBase, method, endpoint, body) {
  const res = await fetch(`${apiBase}${endpoint}`, {
    method: method || 'GET',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'skills-pipeline-web-ui',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

/**
 * Real implementation. See the plan's Design note for why this always
 * performs a GET-file-existence check for both new and existing paths,
 * rather than trusting a caller-supplied "is this new" flag.
 */
async function realCreateGuardrailPr(token, owner, repo, targetPath, content, options) {
  const opts = options || {};
  const defaultBranch = opts.defaultBranch || 'main';
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  // Step 1: get default branch SHA
  const baseRefRes = await _ghRequest(token, apiBase, 'GET', `/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`);
  if (!baseRefRes.ok) {
    throw new GuardrailPrError('branch creation failed', `Could not read default branch ref (${baseRefRes.status})`);
  }
  const baseRefData = await baseRefRes.json();
  const baseSha = baseRefData.object.sha;

  // Step 2: create new branch ref
  const branchName = `guardrail-edit-${Date.now()}`;
  const createRefRes = await _ghRequest(token, apiBase, 'POST', `/repos/${owner}/${repo}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });
  if (!createRefRes.ok) {
    throw new GuardrailPrError('branch creation failed', `Could not create branch (${createRefRes.status})`);
  }

  // Step 3: check whether the target file already exists on the default branch
  const getFileRes = await _ghRequest(token, apiBase, 'GET', `/repos/${owner}/${repo}/contents/${targetPath}?ref=${defaultBranch}`);
  let existingSha = null;
  if (getFileRes.status === 200) {
    const fileData = await getFileRes.json();
    existingSha = fileData.sha;
  } else if (getFileRes.status !== 404) {
    throw new GuardrailPrError('file commit failed', `Could not check existing file (${getFileRes.status})`);
  }

  // Step 4: create or update the file on the new branch
  const putBody = {
    message: `Update ${targetPath}`,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: branchName
  };
  if (existingSha) { putBody.sha = existingSha; }
  const putRes = await _ghRequest(token, apiBase, 'PUT', `/repos/${owner}/${repo}/contents/${targetPath}`, putBody);
  if (!putRes.ok) {
    if (putRes.status === 409 || putRes.status === 422) {
      throw new GuardrailPrConflictError('This file changed since you started editing — please refresh and try again.');
    }
    throw new GuardrailPrError('file commit failed', `Could not commit file (${putRes.status})`);
  }

  // Step 5: open the PR
  const prRes = await _ghRequest(token, apiBase, 'POST', `/repos/${owner}/${repo}/pulls`, {
    title: `Update ${targetPath}`,
    head: branchName,
    base: defaultBranch,
    body: 'Automated guardrail/standard edit via skills platform.'
  });
  if (!prRes.ok) {
    throw new GuardrailPrError('PR creation failed', `Could not open PR (${prRes.status})`);
  }
  const prData = await prRes.json();

  const _ph = opts.posthog || _posthog;
  _ph.capture(opts.tenantId, 'guardrail_pr_opened', {
    tenant_id: opts.tenantId,
    product_id: opts.productId,
    repo: `${owner}/${repo}`,
    pr_number: prData.number
  });

  return { prNumber: prData.number, prUrl: prData.html_url };
}

/**
 * wugs-s7 — live-checks a single PR's status. Read-only; not a D37
 * injectable adapter (the DoR's own H-ADAPTER row confirms none is needed
 * here — this reuses _ghRequest's already-established fetch pattern
 * directly, matching realCreateGuardrailPr's own style).
 * @returns {Promise<{state: 'open'|'merged'|'closed'}>}
 */
async function checkPrStatus(token, owner, repo, prNumber) {
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  const res = await _ghRequest(token, apiBase, 'GET', `/repos/${owner}/${repo}/pulls/${prNumber}`);
  if (!res.ok) {
    throw new GuardrailPrError('PR status check failed', `Could not check PR status (${res.status})`);
  }
  const data = await res.json();
  if (data.merged) { return { state: 'merged' }; }
  return { state: data.state === 'open' ? 'open' : 'closed' };
}

module.exports = {
  createGuardrailPr,
  setGuardrailPrAdapter,
  getGuardrailPrAdapter,
  realCreateGuardrailPr,
  checkPrStatus,
  GuardrailPrError,
  GuardrailPrConflictError
};

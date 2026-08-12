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

module.exports = {
  createGuardrailPr,
  setGuardrailPrAdapter,
  getGuardrailPrAdapter,
  GuardrailPrError,
  GuardrailPrConflictError
};

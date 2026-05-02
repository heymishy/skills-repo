'use strict';

// repo-list.js — Repository list loader (ADR-004)
// Reads configured repositories from WUCE_REPOSITORIES env var.
// Format: comma-separated "owner/repo" strings.
// context.yml support is deferred to Phase 1.5.

/**
 * Get the list of configured repositories.
 * @returns {string[]} array of "owner/repo" strings
 */
function getRepoList() {
  const envRepos = process.env.WUCE_REPOSITORIES;
  if (envRepos) {
    return envRepos.split(',').map(r => r.trim()).filter(Boolean);
  }
  return [];
}

module.exports = { getRepoList };

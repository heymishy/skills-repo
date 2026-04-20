'use strict';

/**
 * Get the upstream repository URL from the provided config.
 * The config object is passed in — never read from process.argv or process.env
 * (ADR-004: all config injected).
 *
 * @param {object} config - The context config object (e.g. parsed from context.yml)
 * @returns {string} The upstream repository URL
 * @throws {Error} If skills_upstream.repo is not configured
 */
function getUpstreamUrl(config) {
  const repo = config && config.skills_upstream && config.skills_upstream.repo;
  if (!repo) {
    throw new Error(
      'No upstream source configured — set skills_upstream.repo in .github/context.yml'
    );
  }
  return repo;
}

/**
 * Validate the structure of the skills_upstream config block.
 * Returns an error if skills_upstream.repo is not a string.
 *
 * @param {object} config
 * @returns {null|Error}
 */
function loadContextConfig(config) {
  const upstream = config && config.skills_upstream;
  if (!upstream || !upstream.repo) {
    return new Error(
      'Missing required field: skills_upstream.repo in .github/context.yml'
    );
  }
  if (typeof upstream.repo !== 'string') {
    return new Error(
      `Invalid skills_upstream.repo type: expected string, got ${typeof upstream.repo}. ` +
      `Check .github/context.yml for the correct repo URL string.`
    );
  }
  return null;
}

module.exports = { getUpstreamUrl, loadContextConfig };

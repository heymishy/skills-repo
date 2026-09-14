'use strict';

// pipeline-state-writer-selector.js — wsd-s2: pure selection logic between
// pipeline-state-writer.js's local-fs factory (real, git-backed checkouts)
// and pipeline-state-github-writer.js's GitHub-API factory (the production
// container, where `.dockerignore` excludes `.git/` so the local-fs
// factory's own isRealCheckout guard always throws). Extracted into its own
// tiny module -- rather than left inline in server.js -- so the D37
// injectable-wiring test can assert real, behavioural correctness (which
// factory a given repoRoot resolves to) instead of only that some function
// got assigned to setPipelineStateWriter() (CLAUDE.md D37 rule 4, citing
// the tir-s1 lesson).

var fs   = require('fs');
var path = require('path');

/**
 * Mirrors pipeline-state-writer.js's own isRealCheckout signal exactly --
 * duplicated here (not imported) so this module has zero dependency on
 * pipeline-state-writer.js's internals, per the wsd-s2 DoR's own framing:
 * "Expose or duplicate the isRealCheckout check ... so server.js can choose
 * without pipeline-state-writer.js needing to change its own internal
 * logic."
 * @param {string} repoRoot
 * @returns {boolean}
 */
function isRealCheckout(repoRoot) {
  return fs.existsSync(path.join(repoRoot, '.git'));
}

/**
 * Selects which pipeline-state-writer factory to use for a given repoRoot.
 * @param {string} repoRoot
 * @param {{ localFs: Function, githubApi: Function }} factories
 * @returns {Function} the chosen (uninvoked) factory function
 */
function selectPipelineStateWriterFactory(repoRoot, factories) {
  return isRealCheckout(repoRoot) ? factories.localFs : factories.githubApi;
}

module.exports = { isRealCheckout, selectPipelineStateWriterFactory };

'use strict';

/**
 * GitHub Actions CI adapter for ci-artefact-attachment (caa.2)
 *
 * Interface contract:
 *   upload(stagingDir, runId)  → { artifactName: string }
 *   postComment(issueRef, summaryLink) → void
 *
 * dispatch key: ci_platform = 'github-actions'
 *
 * This adapter is called by the assurance-gate workflow after --collect runs.
 * It uploads the staging dir as a named artifact and posts a PR comment with
 * the governed artefact chain summary link.
 *
 * See scripts/ci-adapters/README.md for interface documentation.
 */

const { execSync } = require('child_process');

/**
 * Upload the staging directory as a GitHub Actions artifact.
 *
 * In a live GitHub Actions run this shells out to `gh` CLI (or the upload
 * step is driven directly by the actions/upload-artifact workflow step).
 * The adapter is responsible for constructing the deterministic artifact name.
 *
 * @param {string} stagingDir  Path to the .ci-artefact-staging/[slug]/ dir
 * @param {string} runId       GITHUB_RUN_ID string
 * @returns {{ artifactName: string }}
 */
function upload(stagingDir, runId) {
  // Derive slug from the last path segment of stagingDir
  const path = require('path');
  const slug = path.basename(stagingDir);
  const artifactName = `governed-artefacts-${slug}-${runId}`;
  return { artifactName };
}

/**
 * Post a PR comment containing the governed artefact chain summary.
 *
 * AC2: comment body MUST contain:
 *   - the phrase "Governed artefact chain"
 *   - the artifact download URL (summaryLink)
 *   - the issue/PR reference (issueRef)
 *
 * @param {string} issueRef    PR/issue number as a string (e.g. "42")
 * @param {string} summaryLink URL to the artifact download page
 * @returns {void}
 */
function postComment(issueRef, summaryLink) {
  const body = [
    `## Governed artefact chain`,
    ``,
    `Artefact bundle for PR #${issueRef} is available for download:`,
    ``,
    `**Download link:** ${summaryLink}`,
    ``,
    `_Posted by the ci-artefact-attachment adapter (github-actions)._`
  ].join('\n');

  execSync(`gh pr comment ${issueRef} --body "${body.replace(/"/g, '\\"')}"`, {
    stdio: 'pipe'
  });
}

module.exports = { upload, postComment };

'use strict';

const fs   = require('fs');
const path = require('path');

const SIDECAR_NAMES = ['.skills-repo', 'skills-sidecar', '.skills'];

/**
 * Install the skills sidecar into a consumer repository root.
 *
 * @param {object} options
 * @param {string} options.root   - Absolute path to the consumer repo root.
 * @param {object} options.config - Context config object (must contain skills_upstream.repo).
 */
function install({ root, config }) {
  if (!config || !config.skills_upstream || !config.skills_upstream.repo) {
    const err = new Error(
      'No upstream source configured — set skills_upstream.repo in .github/context.yml. ' +
      'Missing required field: skills_upstream.repo'
    );
    throw err;
  }

  const upstreamRepo = config.skills_upstream.repo;
  const sidecarName = SIDECAR_NAMES[0]; // .skills-repo is the canonical name
  const sidecarDir = path.join(root, sidecarName);

  // AC4: idempotent — if already installed, return silently (no extra commits)
  if (fs.existsSync(sidecarDir)) {
    return;
  }

  // Create the sidecar directory
  fs.mkdirSync(sidecarDir, { recursive: true });

  // AC3: create/update .gitignore with the sidecar entry
  const gitignorePath = path.join(root, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const existing = fs.readFileSync(gitignorePath, 'utf8');
    if (!existing.includes(sidecarName)) {
      fs.appendFileSync(gitignorePath, (existing.endsWith('\n') ? '' : '\n') + sidecarName + '\n');
    }
  } else {
    fs.writeFileSync(gitignorePath, sidecarName + '\n');
  }

  // AC2: write skills-lock.json inside sidecar
  const lockfilePath = path.join(sidecarDir, 'skills-lock.json');
  const lockfile = {
    upstreamSource: upstreamRepo,
    pinnedRef: 'HEAD',
    pinnedAt: new Date().toISOString(),
    platformVersion: '4.0.0',
    skills: [],
  };
  fs.writeFileSync(lockfilePath, JSON.stringify(lockfile, null, 2));
}

module.exports = { install };

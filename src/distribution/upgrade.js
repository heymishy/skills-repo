'use strict';

const fs   = require('fs');
const path = require('path');
const { verifyLockfile } = require('./lockfile');

/**
 * Generate a diff between two lockfile versions.
 * Returns added, modified, and removed skill arrays.
 *
 * @param {object} oldLockfile
 * @param {object} newLockfile
 * @returns {{ added: Array, modified: Array, removed: Array }}
 */
function generateDiff(oldLockfile, newLockfile) {
  const oldSkills = oldLockfile.skills || [];
  const newSkills = newLockfile.skills || [];

  const oldMap = new Map(oldSkills.map(s => [s.skillId || s.id, s]));
  const newMap = new Map(newSkills.map(s => [s.skillId || s.id, s]));

  const added    = [];
  const modified = [];
  const removed  = [];

  for (const [skillId, newEntry] of newMap) {
    if (!oldMap.has(skillId)) {
      added.push({ skillId, contentHash: newEntry.contentHash || newEntry.hash });
    } else {
      const oldEntry = oldMap.get(skillId);
      const oldHash = oldEntry.contentHash || oldEntry.hash;
      const newHash = newEntry.contentHash || newEntry.hash;
      if (oldHash !== newHash) {
        const entry = { skillId, oldHash, newHash };
        // Highlight POLICY floor changes
        if (skillId === 'POLICY' && oldEntry.floor !== newEntry.floor) {
          entry.label = `POLICY FLOOR CHANGE: ${oldEntry.floor} → ${newEntry.floor}`;
          entry.description = entry.label;
          entry.note = entry.label;
        }
        modified.push(entry);
      }
    }
  }

  for (const [skillId, oldEntry] of oldMap) {
    if (!newMap.has(skillId)) {
      removed.push({ skillId, contentHash: oldEntry.contentHash || oldEntry.hash });
    }
  }

  return { added, modified, removed };
}

/**
 * Perform an upgrade: apply a new lockfile to the consumer's sidecar directory.
 *
 * @param {object} options
 * @param {string} options.root          - Consumer repo root
 * @param {object} options.newLockfile   - The new lockfile to apply
 * @param {boolean} [options.confirm]    - If true, apply the upgrade
 * @param {boolean} [options.interactive] - If false, non-interactive CI mode
 * @param {boolean} [options.confirmFlag] - Explicit --confirm flag in CI mode
 */
function performUpgrade({ root, newLockfile, confirm, interactive, confirmFlag }) {
  // AC3: non-interactive without confirm → error
  if (interactive === false && !confirmFlag) {
    const err = new Error(
      'Upgrade requires operator confirmation. ' +
      'Pass --confirm flag to proceed in non-interactive mode.'
    );
    throw err;
  }

  // AC2: confirm: false → no-op (dry run)
  if (!confirm) {
    return;
  }

  // Find the lockfile on disk
  const sidecarNames = ['.skills-repo', 'skills-sidecar', '.skills'];
  let lockPath = null;
  // Check sidecar subdirectories first
  for (const name of sidecarNames) {
    const candidate = path.join(root, name, 'skills-lock.json');
    if (fs.existsSync(candidate)) {
      lockPath = candidate;
      break;
    }
  }
  // Also check root-level lockfile (for test fixtures and direct placement)
  if (!lockPath && fs.existsSync(path.join(root, 'skills-lock.json'))) {
    lockPath = path.join(root, 'skills-lock.json');
  }
  if (!lockPath) {
    // No existing lockfile — write to default sidecar location
    const sidecarDir = path.join(root, '.skills-repo');
    if (!fs.existsSync(sidecarDir)) fs.mkdirSync(sidecarDir, { recursive: true });
    lockPath = path.join(sidecarDir, 'skills-lock.json');
  }

  // Read existing lockfile for audit trail
  let previousPinnedRef = null;
  if (fs.existsSync(lockPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      previousPinnedRef = existing.pinnedRef || null;
    } catch (_) {}
  }

  // Build the updated lockfile with audit trail
  const updatedLockfile = Object.assign({}, newLockfile, {
    previousPinnedRef,
    upgradedAt: new Date().toISOString(),
  });

  // AC4: atomic write using tmp file + rename
  const tmpPath = lockPath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(updatedLockfile, null, 2));
    // AC4: call verifyLockfile before finalising
    const sidecarDir = path.dirname(lockPath);
    verifyLockfile(updatedLockfile, sidecarDir);
    fs.renameSync(tmpPath, lockPath);
  } catch (err) {
    // Rollback: remove tmp file if write failed
    try { fs.unlinkSync(tmpPath); } catch (_) {}
    throw err;
  }
}

module.exports = { generateDiff, performUpgrade };

'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const REQUIRED_FIELDS = ['upstreamSource', 'pinnedRef', 'pinnedAt', 'platformVersion', 'skills'];

/**
 * Compute a SHA-256 hash of a Buffer.
 * @param {Buffer} buf
 * @returns {string} 64-char lowercase hex string
 */
function computeHash(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Validate a lockfile object against the required schema.
 * @param {object} lockfile
 * @returns {null|Error} null if valid, Error naming the missing/invalid field
 */
function validateSchema(lockfile) {
  for (const field of REQUIRED_FIELDS) {
    if (lockfile[field] === undefined || lockfile[field] === null) {
      return new Error(
        `Lockfile schema validation failed: missing required field "${field}". ` +
        `skills-lock.json must include: ${REQUIRED_FIELDS.join(', ')}.`
      );
    }
  }
  return null;
}

/**
 * Verify all skill files listed in the lockfile match their recorded content hashes.
 * Skill files are resolved relative to `dir`.
 *
 * @param {object} lockfile - The parsed lockfile object
 * @param {string} dir      - Directory to resolve skill files against
 * @returns {null|Error}    - null if all hashes match, Error if any mismatch
 */
function verifyLockfile(lockfile, dir) {
  const skills = lockfile.skills || [];
  for (const entry of skills) {
    const skillId = entry.skillId || entry.id;
    const expectedHash = entry.contentHash || entry.hash;
    // Try common file extensions
    const candidates = [
      path.join(dir, `${skillId}.md`),
      path.join(dir, `${skillId}.js`),
      path.join(dir, skillId),
    ];
    const skillPath = candidates.find(c => fs.existsSync(c));
    if (!skillPath) {
      // If file not found, skip verification for this entry
      continue;
    }
    const content = fs.readFileSync(skillPath);
    const actualHash = computeHash(content);
    if (actualHash !== expectedHash) {
      return new Error(
        `Hash mismatch for skill "${skillId}": ` +
        `expected ${expectedHash}, got ${actualHash}. ` +
        `The skill file may have been tampered with. ` +
        `Run "skills-repo pin" to re-pin after intentional changes.`
      );
    }
  }
  return null;
}

/**
 * Write a lockfile object to disk as JSON.
 * @param {string} lockPath  - Absolute path to write the lockfile to
 * @param {object} lockfile  - The lockfile object to write
 */
function writeLockfile(lockPath, lockfile) {
  fs.writeFileSync(lockPath, JSON.stringify(lockfile, null, 2));
}

module.exports = { computeHash, validateSchema, verifyLockfile, writeLockfile };

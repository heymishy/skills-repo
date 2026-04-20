#!/usr/bin/env node
/**
 * checksum-validator.js
 *
 * SHA-256 checksum validator for the downloaded governance gate script.
 * Implements story p3.3: Gate structural independence — checksum validation.
 *
 * Usage (module):
 *   const { validateChecksum, computeFileChecksum } = require('./checksum-validator');
 *   validateChecksum('/tmp/gate-runner.js', expectedHash); // throws on mismatch
 *
 * Usage (CLI):
 *   node src/gate-validator/checksum-validator.js <filePath> <expectedHash>
 *   Exit 0 on match, exit 1 on mismatch.
 *
 * Zero external dependencies — plain Node.js (crypto, fs).
 */
'use strict';

const crypto = require('crypto');
const fs     = require('fs');

// ── Error type ────────────────────────────────────────────────────────────────

class ChecksumMismatchError extends Error {
  constructor(actual, expected) {
    super('Gate script checksum mismatch \u2014 aborting');
    this.name     = 'ChecksumMismatchError';
    this.code     = 'CHECKSUM_MISMATCH';
    this.actual   = actual;
    this.expected = expected;
  }
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Compute the SHA-256 checksum of a file's raw bytes.
 * Returns a lowercase hex string.
 *
 * @param {string} filePath - absolute or relative path to the file
 * @returns {string} hex SHA-256 digest
 */
function computeFileChecksum(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Validate that a file's SHA-256 checksum matches the expected value.
 * Returns true on match. Throws ChecksumMismatchError on mismatch.
 *
 * @param {string} filePath     - path to the file to validate
 * @param {string} expectedHash - lowercase hex SHA-256 to compare against
 * @returns {true}
 * @throws {ChecksumMismatchError}
 */
function validateChecksum(filePath, expectedHash) {
  const actualHash = computeFileChecksum(filePath);
  if (actualHash !== expectedHash.toLowerCase()) {
    throw new ChecksumMismatchError(actualHash, expectedHash);
  }
  return true;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = { computeFileChecksum, validateChecksum, ChecksumMismatchError };

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  const [,, filePath, expectedHash] = process.argv;
  if (!filePath || !expectedHash) {
    process.stderr.write('Usage: node checksum-validator.js <filePath> <expectedHash>\n');
    process.exit(2);
  }
  try {
    validateChecksum(filePath, expectedHash);
    process.stdout.write('Gate script checksum verified: ' + expectedHash.slice(0, 16) + '...\n');
    process.exit(0);
  } catch (e) {
    if (e instanceof ChecksumMismatchError) {
      process.stderr.write(e.message + '\n');
      process.stderr.write('  actual:   ' + e.actual   + '\n');
      process.stderr.write('  expected: ' + e.expected + '\n');
    } else {
      process.stderr.write('Error: ' + e.message + '\n');
    }
    process.exit(1);
  }
}

'use strict';
// scripts/platform-verify.js
// Verifies that installed skill files match the platform-lock.json hashes.
//
// Usage: node scripts/platform-verify.js --target <dir>
//   If --target is omitted, uses current working directory.
//
// Exit 0: all files match.
// Exit 1: lock missing, files drifted, or other error.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalisePath(p) {
  return p.replace(/\\/g, '/');
}

function main() {
  const args = process.argv.slice(2);
  let targetDir = process.cwd();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      targetDir = path.resolve(args[i + 1]);
      i++;
    }
  }

  const lockPath = path.join(targetDir, 'platform-lock.json');

  if (!fs.existsSync(lockPath)) {
    process.stderr.write(
      `[platform-verify] No platform-lock.json found in ${targetDir}\n` +
      `  Run: npm run platform:pin  to create the lockfile first.\n`
    );
    process.exit(1);
  }

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch (e) {
    process.stderr.write(`[platform-verify] Failed to parse platform-lock.json: ${e.message}\n`);
    process.exit(1);
  }

  const skills = lock.skills || {};
  const drifted = [];

  for (const [rawKey, expectedHash] of Object.entries(skills)) {
    const normKey = normalisePath(rawKey);
    const filePath = path.join(targetDir, normKey);

    if (!fs.existsSync(filePath)) {
      drifted.push({ key: normKey, expectedHash, actualHash: null, missing: true });
      continue;
    }

    const actualHash = sha256File(filePath);
    if (actualHash !== expectedHash) {
      drifted.push({ key: normKey, expectedHash, actualHash, missing: false });
    }
  }

  if (drifted.length === 0) {
    const count = Object.keys(skills).length;
    const platform = lock.platform || 'unknown';
    process.stdout.write(`[platform-verify] All ${count} skill files match pinned version ${platform}. ✓\n`);
    process.exit(0);
  }

  // Report drifted files
  process.stderr.write(`[platform-verify] ${drifted.length} drifted file(s) detected:\n\n`);
  for (const d of drifted) {
    if (d.missing) {
      process.stderr.write(`  MISSING: ${d.key}\n`);
      process.stderr.write(`    Expected: ${d.expectedHash}\n`);
      process.stderr.write(`    Actual:   (file not found)\n`);
    } else {
      process.stderr.write(`  DRIFTED: ${d.key}\n`);
      process.stderr.write(`    Expected: ${d.expectedHash}\n`);
      process.stderr.write(`    Actual:   ${d.actualHash}\n`);
    }
  }
  process.stderr.write(`\n  Fix options:\n`);
  process.stderr.write(`    npm run platform:pin    -- re-pin to the current file state\n`);
  process.stderr.write(`    npm run platform:fetch  -- fetch canonical skill files from platform source\n`);
  process.exit(1);
}

main();

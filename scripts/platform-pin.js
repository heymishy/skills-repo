'use strict';
// scripts/platform-pin.js
// Creates/updates platform-lock.json in the target directory.
//
// Usage: node scripts/platform-pin.js --target <dir>
//   If --target is omitted, uses current working directory.
//
// platform-lock.json schema v1:
// {
//   "version": "1",
//   "pinnedAt": "<ISO-8601>",
//   "platform": "<git-sha or version>",
//   "skills": { "<forward-slash-relative-path>": "<sha256-hex>" }
// }

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function getPlatformId(scriptRoot) {
  try {
    return execSync('git rev-parse HEAD', { cwd: scriptRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (_) {
    // Fallback to package.json version if not a git repo
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(scriptRoot, 'package.json'), 'utf8'));
      return pkg.version || 'unknown';
    } catch (_2) {
      return 'unknown';
    }
  }
}

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function walkDir(dir, base, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, base, results);
    } else if (entry.isFile()) {
      const rel = path.relative(base, full).replace(/\\/g, '/');
      results.push({ rel, full });
    }
  }
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

  const scriptRoot = path.resolve(__dirname, '..');
  const skillsDir = path.join(targetDir, '.github', 'skills');

  const skills = {};
  if (fs.existsSync(skillsDir)) {
    const files = [];
    walkDir(skillsDir, targetDir, files);
    for (const { rel, full } of files) {
      skills[rel] = sha256File(full);
    }
  }

  const lock = {
    version: '1',
    pinnedAt: new Date().toISOString(),
    platform: getPlatformId(scriptRoot),
    skills
  };

  const lockPath = path.join(targetDir, 'platform-lock.json');
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');

  const count = Object.keys(skills).length;
  console.log(`[platform-pin] Pinned ${count} skill file(s) to platform-lock.json`);
}

main();

'use strict';
// platform-fetch.js — Fetch the latest skill files from the platform source
//                     into a target repository.
//
// Usage:
//   node scripts/platform-fetch.js [target-dir] [source-dir]
//
// Environment:
//   PLATFORM_ROOT — override the source platform root (default: repo root)
//
// Writes workspace/platform-fetch-log.json with:
//   { "fetchedAt": "<ISO-8601>", "source": "<absolute-source-path>" }

'use strict';

const fs = require('fs');
const path = require('path');

// ── Argument parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
const sourceRoot = args[1]
  ? path.resolve(args[1])
  : process.env.PLATFORM_ROOT
    ? path.resolve(process.env.PLATFORM_ROOT)
    : path.join(__dirname, '..');

// ── Directories to fetch ──────────────────────────────────────────────────────
const FETCH_DIRS = [
  { src: path.join(sourceRoot, '.github', 'skills'), dest: path.join(targetDir, '.github', 'skills') },
  { src: path.join(sourceRoot, '.github', 'templates'), dest: path.join(targetDir, '.github', 'templates') }
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function listFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) results.push(...listFiles(full));
    else results.push(full);
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  try {
    fs.mkdirSync(targetDir, { recursive: true });
  } catch (err) {
    process.stderr.write(`[platform-fetch] Failed to create target '${targetDir}': ${err.message}\n`);
    process.exit(1);
  }

  let fetched = 0;

  for (const { src, dest } of FETCH_DIRS) {
    for (const srcFile of listFiles(src)) {
      const relative = path.relative(src, srcFile);
      const destFile = path.join(dest, relative);
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      fetched++;
    }
  }

  // Record fetch timestamp
  const workspaceDir = path.join(targetDir, 'workspace');
  fs.mkdirSync(workspaceDir, { recursive: true });
  const log = {
    fetchedAt: new Date().toISOString(),
    source: sourceRoot
  };
  fs.writeFileSync(
    path.join(workspaceDir, 'platform-fetch-log.json'),
    JSON.stringify(log, null, 2) + '\n',
    'utf8'
  );

  console.log(`[platform-fetch] Fetched ${fetched} file(s) from ${sourceRoot}`);
  console.log(`[platform-fetch] Log written to workspace/platform-fetch-log.json`);
  console.log('[platform-fetch] Done.');
}

main();

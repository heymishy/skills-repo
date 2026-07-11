'use strict';

/**
 * bri-s2.5 - minimal, dependency-free "typecheck" stand-in for CI.
 * This is a plain-JS (no TypeScript) codebase, so there is no type system
 * to check. This performs a require-load smoke check across src/web-ui's
 * route/module graph, catching load-time reference errors (broken
 * requires, undefined exports used at module scope) - the closest
 * meaningful equivalent available without adding a new toolchain.
 */

const path = require('path');
const fs = require('fs');

function collectJsFiles(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const targetDir = path.join(repoRoot, 'src', 'web-ui');
  const files = collectJsFiles(targetDir);

  let failures = 0;
  for (const file of files) {
    try {
      require(file);
    } catch (err) {
      failures += 1;
      console.error('[ci-typecheck] load-time error: ' + path.relative(repoRoot, file));
      console.error(err.message);
    }
  }

  if (failures > 0) {
    console.error('[ci-typecheck] ' + failures + ' file(s) failed to load');
    process.exit(1);
  }
  console.log('[ci-typecheck] ' + files.length + ' file(s) loaded OK');
}

if (require.main === module) run();
module.exports = { collectJsFiles, run };

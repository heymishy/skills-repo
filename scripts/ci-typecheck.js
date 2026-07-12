'use strict';

/**
 * bri-s2.5 - minimal, dependency-free "typecheck" stand-in for CI.
 * This is a plain-JS (no TypeScript) codebase, so there is no type system
 * to check. This performs a require-load smoke check across src/web-ui's
 * route/module graph, catching load-time reference errors (broken
 * requires, undefined exports used at module scope) - the closest
 * meaningful equivalent available without adding a new toolchain.
 *
 * Each file is required in its own child process, which forces an exit
 * immediately after a successful load. This matters because files like
 * server.js have real top-level side effects (e.g. startSessionEviction()
 * fires a setInterval with no .unref()) that keep an in-process require()
 * loop's event loop alive forever - discovered when this script's first
 * version hung the real CI pipeline indefinitely on its own PR (#457).
 * A bounded per-file timeout is a second safety net in case some other
 * file has a similar or worse hang (e.g. an unresolved network call).
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const PER_FILE_TIMEOUT_MS = 10000;

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

function checkFile(file) {
  const result = spawnSync(
    process.execPath,
    ['-e', 'require(process.argv[1]); process.exit(0);', file],
    { encoding: 'utf8', timeout: PER_FILE_TIMEOUT_MS }
  );
  if (result.error && result.error.code === 'ETIMEDOUT') {
    return { ok: false, message: 'timed out after ' + PER_FILE_TIMEOUT_MS + 'ms (likely an unref()-less timer or listener firing at module scope)' };
  }
  if (result.status !== 0) {
    return { ok: false, message: (result.stderr || result.error && result.error.message || 'non-zero exit').trim() };
  }
  return { ok: true };
}

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const targetDir = path.join(repoRoot, 'src', 'web-ui');
  const files = collectJsFiles(targetDir);

  let failures = 0;
  for (const file of files) {
    const result = checkFile(file);
    if (!result.ok) {
      failures += 1;
      console.error('[ci-typecheck] load-time error: ' + path.relative(repoRoot, file));
      console.error(result.message);
    }
  }

  if (failures > 0) {
    console.error('[ci-typecheck] ' + failures + ' file(s) failed to load');
    process.exit(1);
  }
  console.log('[ci-typecheck] ' + files.length + ' file(s) loaded OK');
}

if (require.main === module) run();
module.exports = { collectJsFiles, checkFile, run };

'use strict';

/**
 * bri-s2.5 - minimal "build" stand-in for CI. This Node.js app has no
 * bundler/compile step (server.js runs directly via `node`) - "build" here
 * confirms the deployable server entrypoint loads cleanly end-to-end
 * (its full require graph resolves, and it exports what server-startup
 * code expects), the closest meaningful equivalent to "the artifact
 * compiles" for a non-bundled Node app.
 *
 * Runs the require-check in a short-lived child process that force-exits
 * immediately after a successful load, same fix as scripts/ci-typecheck.js
 * (see its own header comment) - server.js has a real top-level side
 * effect (startSessionEviction() fires a setInterval with no .unref()),
 * so requiring it in-process hangs forever. Discovered when this exact
 * copy-pasted require(entrypoint) pattern hung PR #457's own Build step
 * the same way ci-typecheck.js's did.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const TIMEOUT_MS = 10000;

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const entrypoint = path.join(repoRoot, 'src', 'web-ui', 'server.js');
  const result = spawnSync(
    process.execPath,
    ['-e', 'const mod = require(process.argv[1]); if (typeof mod.createApp !== "function") { throw new Error("server.js did not export the expected createApp() function"); } process.exit(0);', entrypoint],
    { encoding: 'utf8', timeout: TIMEOUT_MS }
  );
  if (result.error && result.error.code === 'ETIMEDOUT') {
    console.error('[ci-build] entrypoint timed out after ' + TIMEOUT_MS + 'ms (likely an unref()-less timer or listener firing at module scope)');
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error('[ci-build] entrypoint failed to load: ' + (result.stderr || (result.error && result.error.message) || 'non-zero exit').trim());
    process.exit(1);
  }
  console.log('[ci-build] server entrypoint loads OK (deployable artifact verified)');
}

if (require.main === module) run();
module.exports = { run };

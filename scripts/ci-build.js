'use strict';

/**
 * bri-s2.5 - minimal "build" stand-in for CI. This Node.js app has no
 * bundler/compile step (server.js runs directly via `node`) - "build" here
 * confirms the deployable server entrypoint loads cleanly end-to-end
 * (its full require graph resolves, and it exports what server-startup
 * code expects), the closest meaningful equivalent to "the artifact
 * compiles" for a non-bundled Node app.
 */

const path = require('path');

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const entrypoint = path.join(repoRoot, 'src', 'web-ui', 'server.js');
  try {
    const mod = require(entrypoint);
    if (typeof mod.createApp !== 'function') {
      throw new Error('server.js did not export the expected createApp() function');
    }
  } catch (err) {
    console.error('[ci-build] entrypoint failed to load: ' + err.message);
    process.exit(1);
  }
  console.log('[ci-build] server entrypoint loads OK (deployable artifact verified)');
}

if (require.main === module) run();
module.exports = { run };

'use strict';
// coha-s5 child harness: runs the real createApp (real catch block) with a throwing test router.
// Prints one JSON line {port} to stdout, then serves. Settings come from the environment.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
const server = require('../../src/web-ui/server');

// Mirror the app's startup block: log-only handlers, registered BEFORE capture init so that
// exception autocapture is enabled safely (posthog-node would otherwise call process.exit(1)).
process.on('uncaughtException', (err) => { console.error('[uncaughtException]', err && err.message); });
process.on('unhandledRejection', (reason) => { console.error('[unhandledRejection]', reason && reason.message ? reason.message : reason); });

if (process.env.CHILD_SKIP_WIRING !== '1') {
  // Task 4 will swap this direct call for the real server.wireErrorCapture(process.env).
  const envName = process.env.CHILD_ENV_NAME || 'production';
  require('../../src/web-ui/modules/error-capture').initErrorCapture(envName, process.env, { clientOptions: { flushAt: 1, flushInterval: 20 } });
}

const router = async (req, res) => {
  const u = req.url || '';
  if (u.startsWith('/ok')) { res.end('ok'); return; }
  if (u.startsWith('/reject')) { Promise.reject(new Error('unhandled ' + u)); res.end('queued'); return; }
  throw new Error('route failed for ' + decodeURIComponent(u));
};
const app = server.createApp({ router });
app.listen(0, '127.0.0.1', () => process.stdout.write(JSON.stringify({ port: app.address().port }) + '\n'));

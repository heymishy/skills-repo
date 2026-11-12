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
  // The process stays NODE_ENV=test (staging would connect real adapters); the wiring function sees the derived env.
  const derivedEnv = Object.assign({}, process.env, { NODE_ENV: process.env.CHILD_ENV_NAME === 'staging' ? 'staging' : process.env.NODE_ENV });
  const clientOptions = { flushAt: Number(process.env.CHILD_FLUSH_AT) || 1, flushInterval: Number(process.env.CHILD_FLUSH_INTERVAL) || 20 };
  server.wireErrorCapture(derivedEnv, { clientOptions });
  if (process.env.CHILD_WIRE_TWICE === '1') server.wireErrorCapture(derivedEnv, { clientOptions });
}

// NFR routes: markerThrower puts a distinctive marker on a source line the SDK can read as context.
function markerThrower() {
  // SRC_LINE_MARKER_7f3a91c2 (must never reach a sink payload)
  throw new Error('boom');
}
const router = async (req, res) => {
  const u = req.url || '';
  if (u.startsWith('/ok')) { res.end('ok'); return; }
  if (u.startsWith('/shutdown')) { res.end('bye'); setImmediate(() => process.emit('SIGTERM')); return; }
  if (u.startsWith('/listeners')) { res.end(JSON.stringify({ SIGTERM: process.listenerCount('SIGTERM'), SIGINT: process.listenerCount('SIGINT') })); return; }
  if (u.startsWith('/reject')) { Promise.reject(new Error('unhandled ' + u)); res.end('queued'); return; }
  if (u.startsWith('/uncaught')) { res.end('queued'); const c = decodeURIComponent(u.slice('/uncaught/'.length)); setTimeout(() => { throw new Error('canary ' + c); }, 0); return; }
  if (u.startsWith('/marker')) { markerThrower(); }
  if (u.startsWith('/keyerr')) { throw new Error('leak ' + process.env.POSTHOG_KEY_PROD); }
  throw new Error('route failed for ' + decodeURIComponent(u));
};
const app = server.createApp({ router });
app.listen(0, '127.0.0.1', () => process.stdout.write(JSON.stringify({ port: app.address().port }) + '\n'));

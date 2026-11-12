'use strict';
// coha-s5 -- production error capture to PostHog. Allow-list scrubbing, fail-closed.
// A separate client from posthog-config.js's feature-flag client (which is left untouched).

const NOT_WIRED = 'Adapter not wired: error-capture. Call initErrorCapture() with a real implementation before use.';
const FIXED_DISTINCT_ID = 'server-error-capture';
const KEPT_KEYS = ['$exception_list', '$exception_level', '$lib', '$lib_version',
  '$is_server', '$geoip_disable', '$process_person_profile', 'environment', 'route', 'code'];
const ALLOW_LISTED_MESSAGES = new Set(['tenant_admin_bootstrap_failed']);

// First path segments of the real routes in src/web-ui/server.js, collected 2026-11-13 by grepping its
// pathname === '/...' / startsWith('/...') / regex literals. Any other first segment (e.g. a tenant slug) becomes ':p'.
const ROUTE_ROOTS = new Set(['admin', 'agency', 'api', 'artefact', 'auth', 'billing', 'client', 'customer-journeys',
  'dashboard', 'features', 'health', 'internal', 'invite', 'journey', 'journeys', 'org', 'organisations', 'playback',
  'playback-media', 'products', 'public', 'sessions', 'settings', 'sign-off', 'signals', 'skills', 'team', 'test',
  'vendor', 'version', 'webhook', 'welcome']);

const LEVELS = ['fatal', 'error', 'warning', 'info', 'debug'];
const RE_VERSION = /^\d+\.\d+\.\d+([.\-][\w.\-]{0,20})?$/;
const RE_REPO_PATH = /^(src|node_modules)\/[\w.\-\/]{1,150}$/;  // anything not under src/ or node_modules/ is omitted
const KNOWN_PLATFORMS = new Set(['node:javascript', 'javascript']);
const RE_IDENT = /^[A-Za-z_$][\w$.<>]{0,80}$/;
const ALLOWED_CODES = new Set(Array.from(ALLOW_LISTED_MESSAGES).concat(['request_error', 'unhandled_exception']));
const ALLOWED_TYPES = new Set(['Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'EvalError', 'URIError', 'AggregateError']);
const MAX_ROUTE_SEGMENTS = 8;

// From the LAST 'src/' or 'node_modules/' at a segment boundary, else the basename; the caller keeps
// the result only if it starts with src/ or node_modules/ (a basename never does, so it is omitted).
function repoRelative(p) {
  const s = p.replace(/\\/g, '/');
  let best = -1;
  ['src/', 'node_modules/'].forEach(m => {
    let i = s.lastIndexOf(m);
    while (i > 0 && s[i - 1] !== '/') i = s.lastIndexOf(m, i - 1);
    if (i > best) best = i;
  });
  if (best >= 0) return s.slice(best);
  return s.slice(s.lastIndexOf('/') + 1);
}

function routeLabel(url) {
  try {
    const pathname = String(url || '').split('?')[0].split('#')[0];
    const segs = pathname.split('/').filter(Boolean);
    if (!segs.length) return '/unknown';
    const first = ROUTE_ROOTS.has(segs[0]) ? segs[0] : ':p';
    const rest = segs.slice(1, MAX_ROUTE_SEGMENTS).map(() => ':p');
    return '/' + [first].concat(rest).join('/') + (segs.length > MAX_ROUTE_SEGMENTS ? '/...' : '');
  } catch (e) { return '/unknown'; }
}

function scrubFrame(f) {
  const g = {};
  if (!f || typeof f !== 'object') return g;
  ['filename', 'abs_path'].forEach(k => {
    const v = typeof f[k] === 'string' ? repoRelative(f[k]) : null;
    if (v && RE_REPO_PATH.test(v)) g[k] = v;
  });
  // coha-s5 review round 3: accepted risk, frame function names are code-defined. An identifier-shaped
  // name cannot be PROVEN free of tenant text, but it is the code's own symbol, so it is kept.
  if (typeof f.function === 'string' && RE_IDENT.test(f.function)) g.function = f.function;
  if (KNOWN_PLATFORMS.has(f.platform)) g.platform = f.platform;  // module is never copied
  ['lineno', 'colno'].forEach(k => { if (typeof f[k] === 'number' && isFinite(f[k])) g[k] = f[k]; });
  if (typeof f.in_app === 'boolean') g.in_app = f.in_app;
  return g;
}

function scrubEvent(ev, environment) {
  try {
    if (!ev || ev.event !== '$exception' || !ev.properties) return null;
    const p = ev.properties;
    if (!Array.isArray(p.$exception_list)) return null;
    const code = typeof p.code === 'string' && ALLOWED_CODES.has(p.code) ? p.code : 'unhandled_exception';
    const out = {};
    if (p.$lib === 'posthog-node') out.$lib = p.$lib;
    if (typeof p.$lib_version === 'string' && RE_VERSION.test(p.$lib_version)) out.$lib_version = p.$lib_version;
    if (typeof p.$is_server === 'boolean') out.$is_server = p.$is_server;
    if (typeof p.$geoip_disable === 'boolean') out.$geoip_disable = p.$geoip_disable;
    // $exception_fingerprint is deliberately never copied: a hex-shaped value cannot be told apart from tenant-derived text.
    out.$exception_level = LEVELS.indexOf(p.$exception_level) >= 0 ? p.$exception_level : 'error';
    out.code = code;
    out.route = typeof p.route === 'string' ? routeLabel(p.route) : '/process';
    out.environment = environment;
    out.$process_person_profile = false;
    out.$exception_list = p.$exception_list.map(x => {
      const frames = ((x.stacktrace && Array.isArray(x.stacktrace.frames)) ? x.stacktrace.frames : []).map(scrubFrame);
      const mech = { handled: !!(x.mechanism && x.mechanism.handled === true) };
      if (x.mechanism && typeof x.mechanism.type === 'string' && /^[a-z_]{1,30}$/.test(x.mechanism.type)) mech.type = x.mechanism.type;
      const item = {
        type: ALLOWED_TYPES.has(x.type) ? x.type : 'Error',
        value: ALLOW_LISTED_MESSAGES.has(x.value) ? x.value : code,
        mechanism: mech
      };
      if (x.stacktrace) item.stacktrace = { type: 'raw', frames };
      return item;
    });
    const result = { event: '$exception', distinctId: FIXED_DISTINCT_ID, properties: out };
    if (typeof ev.timestamp === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(ev.timestamp)) result.timestamp = ev.timestamp;
    return result;
  } catch (e) { return null; }  // fail closed: a scrub error drops the event
}

const { resolvePostHogApiKey } = require('./posthog-config');
const { isE2ETestIdentity } = require('./posthog-server');

let _state = { wired: false, disabled: false, client: null, environment: null };
function _resetForTests() { _state = { wired: false, disabled: false, client: null, environment: null }; }

function initErrorCapture(envName, env, deps) {
  deps = deps || {}; env = env || {};
  if (_state.wired) return { wired: true, alreadyWired: true };  // idempotent: never a second client or extra listeners
  const log = deps.logger || console;
  let key;
  try { key = resolvePostHogApiKey(envName, env); }
  catch (err) { log.error('[error-capture] disabled: ' + err.message); _state = { wired: false, disabled: true, client: null, environment: envName }; return { wired: false, error: err }; }
  // RISK: posthog-node 5.40.0 registers its own uncaughtException handler for autocapture and calls
  // process.exit(1) from it when no OTHER uncaughtException listener exists. So autocapture defaults on only
  // if a listener is already present at init time. The server.js startup block registers log-and-swallow
  // handlers, and they must exist BEFORE wireErrorCapture runs. deps.autocapture (boolean) overrides.
  const autocapture = typeof deps.autocapture === 'boolean' ? deps.autocapture : process.listenerCount('uncaughtException') > 0;
  const Ctor = deps.PostHogClient || require('posthog-node').PostHog;
  const client = new Ctor(key, Object.assign({
    host: env.POSTHOG_HOST || 'https://us.i.posthog.com',
    enableExceptionAutocapture: autocapture,
    before_send: (ev) => scrubEvent(ev, envName)
  }, deps.clientOptions || {}));
  _state = { wired: true, disabled: false, client, environment: envName };
  return { wired: true };
}

function captureServerError(err, context) {
  if (!_state.wired && !_state.disabled) throw new Error(NOT_WIRED);
  if (!_state.client) return;  // initialised without a key: deliberate no-op
  context = context || {};
  if (isE2ETestIdentity(context.identity)) return;
  _state.client.captureException(err, FIXED_DISTINCT_ID, {
    code: context.code || 'request_error', route: routeLabel(context.url),
    environment: _state.environment, $process_person_profile: false
  });
}

// Flushes AND shuts down the client (intended for process exit). Afterwards captureServerError is an explicit no-op.
async function flushErrorCapture(timeoutMs) {
  const client = _state.client;
  if (!client) return;
  const ms = timeoutMs || 2000;
  let timer;
  try {
    await Promise.race([
      client.shutdown(ms),
      new Promise(r => { timer = setTimeout(r, ms); if (timer.unref) timer.unref(); })
    ]);
  } finally {
    clearTimeout(timer);
    _state.client = null; _state.disabled = true;
  }
}

module.exports = { NOT_WIRED, FIXED_DISTINCT_ID, KEPT_KEYS, routeLabel, scrubEvent, initErrorCapture, captureServerError, flushErrorCapture, _resetForTests };

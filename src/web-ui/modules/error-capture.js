'use strict';
// coha-s5 -- production error capture to PostHog. Allow-list scrubbing, fail-closed.
// A separate client from posthog-config.js's feature-flag client (which is left untouched).

const NOT_WIRED = 'Adapter not wired: error-capture. Call initErrorCapture() with a real implementation before use.';
const FIXED_DISTINCT_ID = 'server-error-capture';
const KEPT_KEYS = ['$exception_list', '$exception_level', '$exception_fingerprint', '$lib', '$lib_version',
  '$is_server', '$geoip_disable', '$process_person_profile', 'environment', 'route', 'code'];
const ALLOW_LISTED_MESSAGES = new Set(['tenant_admin_bootstrap_failed']);

// First path segments of the real routes in src/web-ui/server.js, collected 2026-11-13 by grepping its
// pathname === '/...' / startsWith('/...') / regex literals. Any other first segment (e.g. a tenant slug) becomes ':p'.
const ROUTE_ROOTS = new Set(['admin', 'agency', 'api', 'artefact', 'auth', 'billing', 'client', 'customer-journeys',
  'dashboard', 'features', 'health', 'internal', 'invite', 'journey', 'journeys', 'org', 'organisations', 'playback',
  'playback-media', 'products', 'public', 'sessions', 'settings', 'sign-off', 'signals', 'skills', 'team', 'test',
  'vendor', 'version', 'webhook', 'welcome']);

const LEVELS = ['fatal', 'error', 'warning', 'info', 'debug'];
const RE_LIB = /^[\w.\-]{1,40}$/;
const RE_TOKEN = /^[\w.:\-]{1,40}$/;
const RE_PATHISH = /^[\w.\-\/\\:@$<> ]{1,200}$/;

function routeLabel(url) {
  try {
    const pathname = String(url || '').split('?')[0].split('#')[0];
    const segs = pathname.split('/').filter(Boolean);
    if (!segs.length) return '/unknown';
    const first = ROUTE_ROOTS.has(segs[0]) ? segs[0] : ':p';
    return '/' + [first].concat(segs.slice(1).map(() => ':p')).join('/');
  } catch (e) { return '/unknown'; }
}

function scrubFrame(f) {
  const g = {};
  if (!f || typeof f !== 'object') return g;
  ['filename', 'abs_path', 'function'].forEach(k => { if (typeof f[k] === 'string' && RE_PATHISH.test(f[k])) g[k] = f[k]; });
  ['module', 'platform'].forEach(k => { if (typeof f[k] === 'string' && RE_TOKEN.test(f[k])) g[k] = f[k]; });
  ['lineno', 'colno'].forEach(k => { if (typeof f[k] === 'number' && isFinite(f[k])) g[k] = f[k]; });
  if (typeof f.in_app === 'boolean') g.in_app = f.in_app;
  return g;
}

function scrubEvent(ev, environment) {
  try {
    if (!ev || ev.event !== '$exception' || !ev.properties) return null;
    const p = ev.properties;
    if (!Array.isArray(p.$exception_list)) return null;
    const code = typeof p.code === 'string' && /^[a-z0-9_]{1,60}$/.test(p.code) ? p.code : 'unhandled_exception';
    const out = {};
    if (typeof p.$lib === 'string' && RE_LIB.test(p.$lib)) out.$lib = p.$lib;
    if (typeof p.$lib_version === 'string' && RE_LIB.test(p.$lib_version)) out.$lib_version = p.$lib_version;
    if (typeof p.$is_server === 'boolean') out.$is_server = p.$is_server;
    if (typeof p.$geoip_disable === 'boolean') out.$geoip_disable = p.$geoip_disable;
    if (typeof p.$exception_fingerprint === 'string' && /^[a-f0-9]{8,64}$/.test(p.$exception_fingerprint)) out.$exception_fingerprint = p.$exception_fingerprint;
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
        type: typeof x.type === 'string' && /^[A-Za-z][A-Za-z0-9]{0,40}$/.test(x.type) ? x.type : 'Error',
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

module.exports = { NOT_WIRED, FIXED_DISTINCT_ID, KEPT_KEYS, routeLabel, scrubEvent };

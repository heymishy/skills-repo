'use strict';
// coha-s5 -- production error capture to PostHog. Allow-list scrubbing, fail-closed.
// A separate client from posthog-config.js's feature-flag client (which is left untouched).

const NOT_WIRED = 'Adapter not wired: error-capture. Call initErrorCapture() with a real implementation before use.';
const FIXED_DISTINCT_ID = 'server-error-capture';
const KEPT_KEYS = ['$exception_list', '$exception_level', '$exception_fingerprint', '$lib', '$lib_version',
  '$is_server', '$geoip_disable', '$process_person_profile', 'environment', 'route', 'code'];
const FRAME_KEYS = ['filename', 'abs_path', 'function', 'module', 'lineno', 'colno', 'in_app', 'platform'];
const ALLOW_LISTED_MESSAGES = new Set(['tenant_admin_bootstrap_failed']);

function routeLabel(url) {
  try {
    const pathname = String(url || '').split('?')[0].split('#')[0];
    const segs = pathname.split('/').filter(Boolean);
    if (!segs.length) return '/unknown';
    const first = /^[a-z][a-z-]{0,24}$/.test(segs[0]) ? segs[0] : ':p';
    return '/' + [first].concat(segs.slice(1).map(() => ':p')).join('/');
  } catch (e) { return '/unknown'; }
}

function scrubEvent(ev, environment) {
  try {
    if (!ev || ev.event !== '$exception' || !ev.properties) return null;
    const p = ev.properties;
    const code = typeof p.code === 'string' && /^[a-z0-9_]{1,60}$/.test(p.code) ? p.code : 'unhandled_exception';
    const out = {};
    KEPT_KEYS.forEach(k => { if (k in p) out[k] = p[k]; });
    out.code = code;
    out.route = typeof p.route === 'string' ? routeLabel(p.route) : '/process';
    out.environment = environment;
    out.$process_person_profile = false;
    out.$exception_list = p.$exception_list.map(x => {
      const frames = ((x.stacktrace && x.stacktrace.frames) || []).map(f => {
        const g = {}; FRAME_KEYS.forEach(k => { if (k in f) g[k] = f[k]; }); return g;
      });
      const item = { type: String(x.type || 'Error'), value: ALLOW_LISTED_MESSAGES.has(x.value) ? x.value : code, mechanism: x.mechanism };
      if (x.stacktrace) item.stacktrace = Object.assign({}, x.stacktrace, { frames });
      return item;
    });
    return Object.assign({}, ev, { distinctId: FIXED_DISTINCT_ID, properties: out });
  } catch (e) { return null; }  // fail closed: a scrub error drops the event
}

module.exports = { NOT_WIRED, FIXED_DISTINCT_ID, KEPT_KEYS, routeLabel, scrubEvent };

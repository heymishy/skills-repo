'use strict';
// coha-s6: PostHog -> GitHub issue bridge. POST /webhook/error-alert.
// Pattern follows /webhook/stripe in server.js (native http, no body parser, own verification); nothing is copied from it.
const crypto = require('crypto');
const store = require('../modules/error-bridge-store');

const MAX_BODY_BYTES = 16 * 1024;
const SECRET_HEADER = 'x-error-bridge-secret';
const SCHEMA = 'coha-s6/v1';
const LABEL = 'production-error';
const POSTHOG_URL_PREFIX = 'https://us.posthog.com/project/';
const MAX_TITLE = 120;
const URL_TAIL_RE = /^[A-Za-z0-9\/_-]+$/;
const FIRST_SEEN_RE = /^[0-9TZ:.+ -]{1,64}$/;
const CODE_BAD_RE = /[\u0000-\u001f\u007f\u2028\u2029]/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FIELDS = ['code', 'environment', 'first_seen', 'posthog_issue_id', 'posthog_issue_url'];

// D37: the stub MUST throw. server.js wires the real adapter (Task 9).
const NOT_WIRED_GITHUB = 'Adapter not wired: error-bridge-github. Call setGithubIssueAdapter() with a real implementation before use.';
// Adapter contract: createIssue({title, body, labels}) resolves {number}. findIssueByMarker(markerLine) resolves the issue
// number (a bare integer), or null ONLY when the issue is confirmed absent; it must THROW on any failure to look (non-2xx,
// unreadable body, network error), because the handler creates an issue when it returns null. Both must throw on failure,
// never return empty values. createIssue errors must set `definite = true` only when the failure proves no issue was created
// (a 4xx other than 408, or a connection error before any request byte was sent); anything else is ambiguous.
const unwiredGithubAdapter = {
  createIssue() { throw new Error(NOT_WIRED_GITHUB); },
  findIssueByMarker() { throw new Error(NOT_WIRED_GITHUB); }
};
let _github = unwiredGithubAdapter;
let _pool = null;
function setGithubIssueAdapter(adapter) { _github = adapter; }
function setStorePool(pool) { _pool = pool; }

function send(res, status, obj, headers) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json' }, headers || {}));
  res.end(JSON.stringify(obj));
}

function secretOk(provided, expected) {
  if (!expected || typeof provided !== 'string' || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) { crypto.timingSafeEqual(b, b); return false; }
  return crypto.timingSafeEqual(a, b);
}

function readBody(req, cap) {
  return new Promise((resolve) => {
    const chunks = [];
    let n = 0;
    let done = false;
    const finish = (r) => { if (done) return; done = true; req.removeListener('data', onData); resolve(r); };
    const onData = (c) => {
      const b = Buffer.isBuffer(c) ? c : Buffer.from(c);
      n += b.length;
      if (n > cap) { finish({ tooLarge: true }); req.resume(); return; }
      chunks.push(b);
    };
    req.on('data', onData);
    req.on('end', () => finish({ buf: Buffer.concat(chunks) }));
    req.on('error', () => finish({ buf: Buffer.alloc(0) }));
  });
}

function withTimeout(fn, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error('github timeout'), { name: 'GithubTimeout' })), ms);
    Promise.resolve().then(fn).then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

// Only the "not wired" message is logged verbatim; any other error is logged by name so no upstream text or credential can leak.
function describe(e) {
  if (e && typeof e.message === 'string' && e.message.indexOf('Adapter not wired') === 0) return e.message;
  return (e && e.name) || 'error';
}

function buildBody(f, marker) {
  return 'First seen: ' + f.first_seen + '\nEnvironment: ' + f.environment + '\nPostHog: ' + f.posthog_issue_url + '\n\n' + marker + '\n';
}

async function handlePostErrorBridge(req, res, deps) {
  const d = Object.assign({
    log: (line) => console.log(line),
    secret: process.env.ERROR_BRIDGE_SECRET,
    github: _github,
    pool: _pool,
    githubTimeoutMs: 8000,
    claimWindowSeconds: store.CLAIM_WINDOW_SECONDS
  }, deps || {});
  const reject = (status, line) => { d.log('error-bridge: rejected ' + line); return send(res, status, { error: status === 413 ? 'payload too large' : 'bad request' }, status === 413 ? { Connection: 'close' } : undefined); };

  if (req.method !== 'POST') { d.log('error-bridge: rejected method'); return send(res, 405, { error: 'method not allowed' }, { Allow: 'POST' }); }
  if (!secretOk(req.headers && req.headers[SECRET_HEADER], d.secret)) {
    d.log(d.secret ? 'error-bridge: rejected unauthorised' : 'error-bridge: rejected secret not configured');
    return send(res, 401, { error: 'unauthorised' }, { Connection: 'close' });
  }
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) { req.resume(); return reject(413, 'too large'); }
  const read = await readBody(req, MAX_BODY_BYTES);
  if (read.tooLarge) return reject(413, 'too large');

  let parsed;
  try { parsed = JSON.parse(read.buf.toString('utf8')); } catch (e) { return reject(400, 'not json'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return reject(400, 'shape');
  if (parsed.schema !== SCHEMA) return reject(400, 'schema');
  const nonString = FIELDS.filter((k) => parsed[k] !== undefined && typeof parsed[k] !== 'string');
  if (nonString.length) return reject(400, 'non-string fields: ' + nonString.join(','));
  const f = {};
  FIELDS.forEach((k) => { f[k] = parsed[k] === undefined ? '' : parsed[k]; });

  if (f.environment === '') { d.log('error-bridge: ignored environment missing'); return send(res, 200, { ignored: 'environment missing' }); }
  if (f.environment === 'staging') { d.log('error-bridge: ignored staging'); return send(res, 200, { ignored: 'staging' }); }
  if (f.environment !== 'production') {
    d.log('error-bridge: ignored environment unexpected (length ' + f.environment.length + ')');
    return send(res, 200, { ignored: 'environment' });
  }

  const empty = FIELDS.filter((k) => f[k] === '');
  if (empty.length) return reject(400, 'empty fields: ' + empty.join(','));
  if (!UUID_RE.test(f.posthog_issue_id)) return reject(400, 'issue id');
  if (f.posthog_issue_url.indexOf(POSTHOG_URL_PREFIX) !== 0 || f.posthog_issue_url.length > 512 || !URL_TAIL_RE.test(f.posthog_issue_url.slice(POSTHOG_URL_PREFIX.length))) return reject(400, 'link');
  if (f.code.length > MAX_TITLE || CODE_BAD_RE.test(f.code)) return reject(400, 'code');
  if (!FIRST_SEEN_RE.test(f.first_seen)) return reject(400, 'first seen');

  const id = f.posthog_issue_id;
  const marker = 'PostHog issue id: ' + id;
  let outcome;
  try {
    if (!d.pool) throw new Error('Adapter not wired: error-bridge-store. Call setStorePool() with a real implementation before use.');
    outcome = await store.claim(d.pool, id, d.claimWindowSeconds);
  } catch (e) { d.log('error-bridge: store failed ' + describe(e)); return send(res, 503, { error: 'unavailable' }); }

  if (outcome === 'created' || outcome === 'inflight') {
    d.log('error-bridge: duplicate ' + id + ' (' + outcome + ')');
    return send(res, 200, { duplicate: true });
  }

  // A failed or timed-out GitHub call leaves the row pending. A definite failure releases the claim so the retry takes over
  // at once; a timeout or a store failure after a create does not (a late success could land, and a takeover recovers it by marker).
  let issueNumber = null;
  let recovered = false;
  let phase = 'search';
  const unknown = (what) => { d.log('error-bridge: github failed ' + what + ' for ' + id + ' (outcome unknown, claim kept)'); return send(res, 503, { error: 'upstream unavailable' }); };
  try {
    let existing = null;
    if (outcome === 'takeover') existing = await withTimeout(() => d.github.findIssueByMarker(marker), d.githubTimeoutMs);
    if (existing) {
      if (!Number.isInteger(existing)) return unknown('bad response');
      issueNumber = existing; recovered = true;
    } else {
      phase = 'create';
      const issue = await withTimeout(() => d.github.createIssue({ title: f.code, body: buildBody(f, marker), labels: [LABEL] }), d.githubTimeoutMs);
      if (!Number.isInteger(issue && issue.number)) return unknown('bad response');
      issueNumber = issue.number;
    }
  } catch (e) {
    const notWired = !!(e && typeof e.message === 'string' && e.message.indexOf('Adapter not wired') === 0);
    const timeout = !!(e && e.name === 'GithubTimeout');
    // Release the claim only when nothing can have been created: any search-phase failure, or a create failure the adapter marked definite.
    const releasable = !notWired && (phase === 'search' || (e && e.definite === true && !timeout));
    if (!releasable) {
      if (timeout || notWired) { d.log(timeout ? 'error-bridge: github timeout for ' + id : 'error-bridge: github failed ' + describe(e) + ' for ' + id); return send(res, 503, { error: 'upstream unavailable' }); }
      return unknown(describe(e));
    }
    let note = ' (claim released)';
    try { await store.release(d.pool, id); } catch (re) { note = ' (release failed)'; }
    d.log(timeout ? 'error-bridge: github timeout for ' + id + note : 'error-bridge: github failed ' + describe(e) + ' for ' + id + note);
    return send(res, 503, { error: 'upstream unavailable' });
  }
  try {
    await store.markCreated(d.pool, id, issueNumber);
  } catch (e) {
    d.log('error-bridge: ' + (recovered ? 'recovered' : 'created') + ' issue #' + issueNumber + ' but store update failed for ' + id);
    return send(res, 503, { error: 'unavailable' });
  }
  d.log('error-bridge: ' + (recovered ? 'recovered' : 'created') + ' issue #' + issueNumber + ' for ' + id);
  return send(res, 200, recovered ? { issue: issueNumber, recovered: true } : { issue: issueNumber });
}

module.exports = {
  handlePostErrorBridge, setGithubIssueAdapter, setStorePool, unwiredGithubAdapter,
  _internals: { LABEL, buildBody, withTimeout, describe, UUID_RE }
};

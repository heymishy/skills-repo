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

  // ENVIRONMENT_GATE (Task 4 inserts the environment checks here, before the empty-field check below)

  const empty = FIELDS.filter((k) => f[k] === '');
  if (empty.length) return reject(400, 'empty fields: ' + empty.join(','));
  if (!UUID_RE.test(f.posthog_issue_id)) return reject(400, 'issue id');
  if (f.posthog_issue_url.indexOf(POSTHOG_URL_PREFIX) !== 0 || f.posthog_issue_url.length > 512 || !URL_TAIL_RE.test(f.posthog_issue_url.slice(POSTHOG_URL_PREFIX.length))) return reject(400, 'link');
  if (f.code.length > MAX_TITLE || CODE_BAD_RE.test(f.code)) return reject(400, 'code');
  if (!FIRST_SEEN_RE.test(f.first_seen)) return reject(400, 'first seen');

  // CLAIM_AND_CREATE (Tasks 4, 5 and 6 add the issue creation here)
  return send(res, 200, { ok: true });
}

module.exports = {
  handlePostErrorBridge, setGithubIssueAdapter, setStorePool, unwiredGithubAdapter,
  _internals: { LABEL, buildBody, withTimeout, describe, UUID_RE }
};

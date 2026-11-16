'use strict';
// pws-s1: child process for tests/check-pws-s1-production-wiring-smoke.js.
// Boots the real server.js with the skill-adapter wiring on, records which set* functions of the two
// skills modules were called during boot, then makes real requests through the real route table.
// Prints one JSON line on stdout. A child process because re-requiring server.js in one process hangs.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pws-s1-'));
process.env.NODE_ENV = 'test';
process.env.WIRE_SKILL_ADAPTERS = 'true';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.SKILLS_ARTEFACT_SAVE_ROOT = tmp; // the artefact auto-save goes to a temp dir, not the checkout
process.env.WUCE_SESSION_BASE_DIR = tmp;     // session directories too

const repoRoot = path.resolve(__dirname, '..', '..');
const { extractRoutePatterns } = require(path.join(repoRoot, 'scripts', 'check-production-wiring.js'));

// Record every call to an exported set* function before server.js captures them.
const called = [];
['adapters/skills.js', 'routes/skills.js'].forEach(function (rel) {
  const mod = require(path.join(repoRoot, 'src', 'web-ui', rel));
  Object.keys(mod).forEach(function (name) {
    if (/^set[A-Z]/.test(name) && typeof mod[name] === 'function') {
      const real = mod[name];
      mod[name] = function () { called.push(name); return real.apply(this, arguments); };
    }
  });
});

const quiet = function () { console.log = console.info = console.warn = console.error = function () {}; };
const realLog = console.log;
quiet();

const server = require(path.join(repoRoot, 'src', 'web-ui', 'server.js'));
const sessions = require(path.join(repoRoot, 'src', 'web-ui', 'middleware', 'session.js'));
const sid = crypto.randomBytes(16).toString('hex');
sessions.seedTestSession(sid, { accessToken: 'tok', userId: 'u1', login: 'u1', tenantId: 't1', csrfToken: 'c' });

function request(port, method, url) {
  return new Promise(function (resolve) {
    const headers = { Cookie: 'session_id=' + sid, 'x-csrf-token': 'c' };
    let payload = null;
    if (method === 'POST') { payload = JSON.stringify({ _csrf: 'c' }); headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(payload); }
    const r = http.request({ host: '127.0.0.1', port: port, path: url, method: method, headers: headers }, function (res) {
      let b = ''; res.on('data', function (c) { if (b.length < 4000) b += c; });
      res.on('end', function () { resolve({ method: method, url: url, status: res.statusCode, body: b }); });
    });
    r.setTimeout(8000, function () { r.destroy(new Error('timeout')); });
    r.on('error', function (e) { resolve({ method: method, url: url, status: 0, body: 'ERROR ' + e.message }); });
    if (payload) r.write(payload);
    r.end();
  });
}

const HOSTILE = [
  'not-a-uuid',
  '%00',
  '%E0%A4%A',
  '00000000-0000-4000-8000-000000000000',
  'a'.repeat(300),
  '..%2f..%2f..%2fetc%2fpasswd'
];
const UNKNOWN = '00000000-0000-4000-8000-000000000000';
const SESSION_PROBES = [
  ['GET', '/skills/discovery/sessions/' + UNKNOWN + '/commit-preview'],
  ['GET', '/skills/discovery/sessions/' + UNKNOWN + '/complete'],
  ['GET', '/skills/discovery/sessions/' + UNKNOWN + '/result'],
  ['GET', '/skills/discovery/sessions/' + UNKNOWN + '/chat'],
  ['GET', '/skills/discovery/sessions/' + UNKNOWN + '/next'],
  ['POST', '/api/skills/discovery/sessions/' + UNKNOWN + '/commit'],
  ['POST', '/api/skills/discovery/sessions/' + UNKNOWN + '/answer']
];

const app = server.createApp();
app.listen(0, '127.0.0.1', async function () {
  const port = app.address().port;
  const started = Date.now();
  const src = fs.readFileSync(path.join(repoRoot, 'src', 'web-ui', 'server.js'), 'utf8');
  const routes = extractRoutePatterns(src);
  const sessionProbes = [];
  for (const p of SESSION_PROBES) sessionProbes.push(await request(port, p[0], p[1]));
  const sweep = [];
  const skipSweep = (JSON.parse(process.argv[2] || '{}').skipSweep) || [];
  let skipped = 0;
  for (const pattern of routes.patterns) {
    for (const value of HOSTILE) {
      for (const method of ['GET', 'POST']) {
        if (skipSweep.indexOf(method + ' ' + pattern) !== -1) { skipped++; continue; } // the test file lists why
        const r = await request(port, method, pattern.split('{id}').join(value));
        sweep.push({ method: method, pattern: pattern, value: value.length > 40 ? value.slice(0, 12) + '...(' + value.length + ')' : value, status: r.status, unwired: /Adapter not wired/.test(r.body) });
      }
    }
  }
  const result = {
    called: Array.from(new Set(called)).sort(),
    patternCount: routes.patterns.length,
    skippedPatterns: routes.skipped.length,
    sessionProbes: sessionProbes.map(function (r) { return { method: r.method, url: r.url, status: r.status, unwired: /Adapter not wired/.test(r.body) }; }),
    sweepCount: sweep.length,
    sweepSkipped: skipped,
    sweepWorst: sweep.reduce(function (m, s) { const k = s.method + ' ' + s.pattern; m[k] = Math.max(m[k] || 0, s.status || 599); return m; }, {}),
    sweepFailures: sweep.filter(function (s) { return s.status >= 500 || s.status === 0 || s.unwired; }),
    ms: Date.now() - started
  };
  realLog(JSON.stringify(result));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) { /* best effort */ }
  process.exit(0);
});

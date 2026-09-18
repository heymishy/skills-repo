'use strict';
// tests/check-dsa-s1-comment-routes.js -- AC7, AC8 (route integration)
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const router = require('../src/web-ui/server').router;
const seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

function makeRes() {
  var statusCode = null, headers = {}, chunks = [];
  return {
    writeHead: function (code, h) { statusCode = code; Object.assign(headers, h || {}); },
    setHeader: function (k, v) { headers[k] = v; },
    end: function (body) { if (body != null) chunks.push(body); },
    _get: function () { return { statusCode: statusCode, headers: headers, body: chunks.join('') }; }
  };
}
function dispatchAndAwait(req) {
  return new Promise(function (resolve, reject) {
    var res = makeRes();
    var origEnd = res.end;
    var settled = false;
    res.end = function (body) { origEnd(body); if (!settled) { settled = true; resolve(res._get()); } };
    router(req, res).catch(function (err) { if (!settled) { settled = true; reject(err); } });
  });
}

async function testCreateCommentRouteRequiresAuth() {
  var req = { headers: {}, method: 'POST', url: '/api/artefact-comments' };
  var result = await dispatchAndAwait(req);
  assert.notStrictEqual(result.statusCode, 200, 'unauthenticated create must not succeed');
}

async function testListCommentsRouteRequiresAuth() {
  var req = { headers: {}, method: 'GET', url: '/api/artefact-comments?resourceType=artefact&resourceId=test/discovery' };
  var result = await dispatchAndAwait(req);
  assert.notStrictEqual(result.statusCode, 200, 'unauthenticated list must not succeed');
}

// session_id cookie values are matched by sessionMiddleware's own regex,
// /session_id=([a-f0-9]+)/ (middleware/session.js) -- lowercase hex only.
function authedSid() {
  return require('crypto').createHash('sha1').update('dsa-s1-comment-routes-tester').digest('hex');
}

async function testListCommentsRouteRejectsMissingResourceId() {
  var sid = authedSid();
  seedTestSession(sid, { accessToken: 'dsa-s1-test-token', login: 'dsa-s1-tester' });
  var req = { headers: { cookie: 'session_id=' + sid }, method: 'GET', url: '/api/artefact-comments?resourceType=artefact' };
  var result = await dispatchAndAwait(req);
  assert.strictEqual(result.statusCode, 400, 'authenticated list with no resourceId must 400, not silently return an empty list');
}

async function main() {
  await testCreateCommentRouteRequiresAuth();
  console.log('  ok - create-comment route requires auth');
  await testListCommentsRouteRequiresAuth();
  console.log('  ok - list-comments route requires auth');
  await testListCommentsRouteRejectsMissingResourceId();
  console.log('  ok - list-comments route rejects missing resourceId with 400');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });

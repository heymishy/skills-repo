#!/usr/bin/env node
// check-ep2-s4-artefact-edit-merge-static-route.js — regression test for a
// real bug found via a live staging check AFTER ep2-s4's own PR merged.
//
// routes/journey.js emits '<script src="/public/artefact-edit-merge.js">'
// on the edit-mode artefact page, but no route in server.js ever served
// that file. This codebase has no generic /public/* static-file server --
// only individually-registered literal routes per file (see the sibling
// /public/presence-sidebar.js, /public/stage-list.js, /public/artefact-
// sidebar.js, /public/approval-modal.js routes in server.js) -- so a new
// public script needs its own route added, or every request for it falls
// through to the catch-all sign-in/SPA handler, which returns HTML. A
// browser's <script> tag then fails to parse the HTML ("Uncaught
// SyntaxError: Unexpected token '<'"), so the script's own logic (the
// fetch-based JSON save + EventSource merge listener) never runs at all.
//
// This is the EXACT same bug class this codebase already hit once in this
// same epic (ep2-s1's own presence-sidebar.js route, see server.js's own
// comment there) -- neither ep2-s4's unit tests, its integration test
// (tests/check-ep2-s4-integration.js, which calls handlePostJourneyStageArtefact
// directly, never through server.js's own router), nor its E2E spec
// (tests/e2e/ep2-s4-concurrent-merge.spec.js, which drives the JSON save/SSE
// routes directly via raw HTTP/fetch, never the page's own <script> tag)
// ever requested this specific URL. Only a real live-browser check (post-
// merge, once Chrome was available) caught it -- see
// artefacts/new-feature-2b74a292/decisions.md for the full account.
//
// This test dispatches the real pathname through the ACTUAL exported
// router (not a direct handler call), matching
// check-jsvr-s1-wire-stage-view-route.js's own established convention for
// this exact class of "route never wired" regression -- so it fails again
// if the wiring is ever removed.

'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var passed = 0;
var failed = 0;

function check(label, ok) {
  if (ok) {
    console.log('  ✓ ' + label);
    passed++;
  } else {
    console.error('  ✗ ' + label);
    failed++;
  }
}

var router;
try {
  router = require('../src/web-ui/server').router;
} catch (e) {
  console.error('FATAL: could not load server.js:', e.message);
  process.exit(1);
}

function mockReq(overrides) {
  return Object.assign({ headers: {}, method: 'GET', url: '/' }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _headers = {};
  var _chunks = [];
  return {
    writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    setHeader: function(k, v) { _headers[k] = v; },
    end: function(body) { if (body != null) _chunks.push(body); },
    _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
  };
}

async function main() {
  var SIGN_IN_MARKER = 'Sign in — Skills Platform';

  // ── No session at all -- this is a public, unauthenticated static asset,
  //    matching every sibling /public/*.js route's own convention (they
  //    are served unconditionally, no auth guard). ─────────────────────────
  var req = mockReq({ url: '/public/artefact-edit-merge.js' });
  var res = mockRes();
  await router(req, res);
  var result = res._get();

  check('GET /public/artefact-edit-merge.js does not fall through to the sign-in page', result.body.indexOf(SIGN_IN_MARKER) === -1);
  check('GET /public/artefact-edit-merge.js returns 200', result.statusCode === 200);
  check('GET /public/artefact-edit-merge.js has a JavaScript content-type', /application\/javascript/.test(result.headers['Content-Type'] || ''));
  check('GET /public/artefact-edit-merge.js body does not start with HTML', result.body.trim().indexOf('<') !== 0);
  check('GET /public/artefact-edit-merge.js body is syntactically valid JavaScript', (function () {
    try { new Function(result.body); return true; } catch (e) { console.error('    (parse error: ' + e.message + ')'); return false; }
  })());
  check('GET /public/artefact-edit-merge.js body contains the real client script (form-submit interception)', result.body.indexOf('addEventListener') !== -1 && result.body.indexOf('EventSource') !== -1);

  console.log('\n[ep2-s4-artefact-edit-merge-static-route] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

main().catch(function (err) { console.error('FAIL (crash):', err); process.exitCode = 1; });

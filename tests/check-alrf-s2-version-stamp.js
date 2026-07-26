#!/usr/bin/env node
// check-alrf-s2-version-stamp.js — AC verification for alrf-s2
// (Build-identity footer stamp: commit SHA + originating PR # + GET /version,
// closing the "did my fix actually deploy?" gap found 2026-07-26 when a
// merged PR's overall CI status showed red from an unrelated pre-existing
// smoke-test failure, making a real staging deploy indistinguishable from a
// failed one from the UI alone.)
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

const { buildVersionInfo } = require('../scripts/write-version-file');

const ROOT = path.resolve(__dirname, '..');
const VERSION_PATH = path.join(ROOT, 'version.json');

function freshVersionInfoModule() {
  const modPath = require.resolve('../src/web-ui/utils/version-info');
  delete require.cache[modPath];
  return require('../src/web-ui/utils/version-info');
}

function freshVersionRouteModule() {
  const modPath = require.resolve('../src/web-ui/routes/version');
  delete require.cache[modPath];
  return require('../src/web-ui/routes/version');
}

function run() {
  // ── AC1: PR number parsed from a GitHub squash-merge commit subject ──
  console.log('\n  AC1 -- buildVersionInfo parses PR number from "(#123)" suffix');
  {
    process.env.GITHUB_SHA = '777e16031a913c0bfd48894217934f4c47da3a27'; // real squash-merge commit, this repo
    const info = buildVersionInfo();
    eq(info.sha, '777e16031a913c0bfd48894217934f4c47da3a27', 'AC1: sha matches GITHUB_SHA');
    eq(info.shortSha, '777e160', 'AC1: shortSha is first 7 chars');
    eq(info.prNumber, 614, 'AC1: prNumber parsed from commit subject "(#614)"');
    ok(typeof info.deployedAt === 'string' && info.deployedAt.length > 0, 'AC1: deployedAt is a non-empty ISO string');
    delete process.env.GITHUB_SHA;
  }

  // ── AC2: no PR pattern in commit subject -> prNumber is null, not a throw ──
  console.log('\n  AC2 -- buildVersionInfo returns null prNumber for a non-PR commit');
  {
    process.env.GITHUB_SHA = 'cb47053d596e95ebfdc60c7b03a30694d0407036'; // direct bookkeeping commit, no PR
    const info = buildVersionInfo();
    eq(info.prNumber, null, 'AC2: prNumber is null when commit subject has no "(#N)" suffix');
    delete process.env.GITHUB_SHA;
  }

  // ── AC3: getVersionInfo() falls back to a clearly-labelled dev build when
  //         version.json does not exist ──
  console.log('\n  AC3 -- getVersionInfo falls back to dev build identity when version.json is absent');
  {
    const hadFile = fs.existsSync(VERSION_PATH);
    const backup = hadFile ? fs.readFileSync(VERSION_PATH, 'utf8') : null;
    if (hadFile) fs.unlinkSync(VERSION_PATH);
    const { getVersionInfo } = freshVersionInfoModule();
    const info = getVersionInfo();
    eq(info.shortSha, 'dev', 'AC3: shortSha is "dev" when version.json absent');
    eq(info.sha, null, 'AC3: sha is null (no commit link renderable) when version.json absent');
    if (hadFile) fs.writeFileSync(VERSION_PATH, backup, 'utf8');
  }

  // ── AC4: getVersionInfo() reads real version.json content when present ──
  console.log('\n  AC4 -- getVersionInfo reads a real version.json when present');
  {
    const fixture = {
      sha: 'abc1234def5678900000000000000000000000',
      shortSha: 'abc1234',
      prNumber: 999,
      commitSubject: 'test fixture commit (#999)',
      deployedAt: '2026-07-26T00:00:00.000Z'
    };
    const hadFile = fs.existsSync(VERSION_PATH);
    const backup = hadFile ? fs.readFileSync(VERSION_PATH, 'utf8') : null;
    fs.writeFileSync(VERSION_PATH, JSON.stringify(fixture), 'utf8');
    const { getVersionInfo } = freshVersionInfoModule();
    const info = getVersionInfo();
    eq(info.shortSha, 'abc1234', 'AC4: shortSha read from real version.json');
    eq(info.prNumber, 999, 'AC4: prNumber read from real version.json');
    if (hadFile) fs.writeFileSync(VERSION_PATH, backup, 'utf8');
    else fs.unlinkSync(VERSION_PATH);
  }

  // ── AC5: GET /version route returns 200 JSON matching getVersionInfo() ──
  console.log('\n  AC5 -- GET /version returns 200 with the current version info as JSON');
  {
    const { versionHandler } = freshVersionRouteModule();
    const res = {
      _status: null, _headers: null, _body: '',
      writeHead(status, headers) { this._status = status; this._headers = headers; },
      end(body) { this._body = body; }
    };
    versionHandler({}, res);
    eq(res._status, 200, 'AC5: status 200');
    eq(res._headers['Content-Type'], 'application/json', 'AC5: JSON content-type');
    let parsed = null;
    try { parsed = JSON.parse(res._body); } catch (_) {}
    ok(parsed && Object.prototype.hasOwnProperty.call(parsed, 'shortSha'), 'AC5: response body has shortSha field');
  }

  // ── AC6: footer stamp renders a commit link when sha present, plain text otherwise ──
  console.log('\n  AC6 -- sidebar footer stamp renders correctly in both states');
  {
    const fixture = {
      sha: 'deadbeef00000000000000000000000000000000',
      shortSha: 'deadbee',
      prNumber: 42,
      commitSubject: 'a test commit (#42)',
      deployedAt: '2026-07-26T00:00:00.000Z'
    };
    const hadFile = fs.existsSync(VERSION_PATH);
    const backup = hadFile ? fs.readFileSync(VERSION_PATH, 'utf8') : null;
    fs.writeFileSync(VERSION_PATH, JSON.stringify(fixture), 'utf8');
    delete require.cache[require.resolve('../src/web-ui/utils/version-info')];
    delete require.cache[require.resolve('../src/web-ui/utils/html-shell')];
    const { renderShell } = require('../src/web-ui/utils/html-shell');
    const html = renderShell({ title: 'Test', bodyContent: '<p>hi</p>', user: { login: 'alice' } });
    ok(html.includes('sw-version-stamp'), 'AC6: footer stamp element present');
    ok(html.includes('deadbee'), 'AC6: short SHA visible in footer');
    ok(html.includes('#42'), 'AC6: PR number visible in footer');
    ok(html.includes('https://github.com/heymishy/skills-repo/commit/deadbeef00000000000000000000000000000000'), 'AC6: footer links to the real commit on GitHub');
    if (hadFile) fs.writeFileSync(VERSION_PATH, backup, 'utf8');
    else fs.unlinkSync(VERSION_PATH);
  }

  console.log('\n[alrf-s2-version-stamp] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();

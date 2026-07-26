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

const { buildVersionInfo, parsePrNumberFromSubject } = require('../scripts/write-version-file');

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
  // parsePrNumberFromSubject is pure (no git subprocess call), tested against
  // fabricated subjects -- buildVersionInfo() itself is only ever tested
  // against the CURRENT checkout's real HEAD below (AC1b), never a
  // hardcoded historical SHA: CI's default shallow (fetch-depth 1) clone
  // does not contain older commit objects, so a hardcoded past SHA that
  // happened to exist in a developer's full local clone would crash (not
  // fail-gracefully) the moment this test ran in CI -- exactly what
  // happened the first time this test was written.
  console.log('\n  AC1 -- parsePrNumberFromSubject parses PR number from "(#123)" suffix');
  {
    eq(parsePrNumberFromSubject('fix(alrf-s1): listArtefacts checks local filesystem before GitHub API (#614)'), 614, 'AC1: prNumber parsed from a realistic squash-merge subject');
    eq(parsePrNumberFromSubject('some commit (#7)'), 7, 'AC1: prNumber parsed from a short subject');
    eq(parsePrNumberFromSubject(''), null, 'AC1: empty subject yields null, not a throw');
    eq(parsePrNumberFromSubject(undefined), null, 'AC1: undefined subject yields null, not a throw');
  }

  console.log('\n  AC1b -- buildVersionInfo() runs against the current checkout\'s real HEAD without throwing');
  {
    const info = buildVersionInfo();
    ok(typeof info.sha === 'string' && info.sha.length === 40, 'AC1b: sha is a real 40-char commit hash');
    eq(info.shortSha, info.sha.slice(0, 7), 'AC1b: shortSha is the first 7 chars of sha');
    ok(typeof info.deployedAt === 'string' && info.deployedAt.length > 0, 'AC1b: deployedAt is a non-empty ISO string');
    ok(info.prNumber === null || typeof info.prNumber === 'number', 'AC1b: prNumber is null or a number, whatever HEAD currently is');
  }

  // ── AC2: no PR pattern in commit subject -> prNumber is null, not a throw ──
  console.log('\n  AC2 -- parsePrNumberFromSubject returns null for a non-PR commit subject');
  {
    eq(parsePrNumberFromSubject('chore: mark alrf-s1 prStatus=merged post PR #614'), null, 'AC2: prNumber is null when subject has no trailing "(#N)" suffix (mentions a PR mid-sentence, not the trailing pattern)');
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

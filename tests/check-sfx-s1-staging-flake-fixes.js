#!/usr/bin/env node
// check-sfx-s1-staging-flake-fixes.js -- AC verification for sfx-s1
// (a1 AC1's first staging request gets a cold-start budget instead of the 5-second steady-state budget, and the
// bri-s3.3 AC1 /admin/credits call records how long it took and how many tenants it rendered).
//
// The two specs only run against staging (secrets) or a test server, so the logic that can be tested without them lives
// in two small fixtures that this check runs directly; the specs' use of them is checked as text, and their assertions
// are checked to be unchanged. Run: node tests/check-sfx-s1-staging-flake-fixes.js
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n'); }
function load(rel) { try { return require(path.join(root, rel)); } catch (e) { return null; } }

console.log('check-sfx-s1-staging-flake-fixes');

// ── AC1/AC2: the cold-start and warm budgets ─────────────────────────────────
const lb = load('tests/e2e/fixtures/latency-budget.js');
{
  const has = !!lb && typeof lb.evaluateBudgets === 'function';
  ok(has && lb.WARM_BUDGET_MS === 5000 && lb.COLD_START_BUDGET_MS === 15000,
    'F1 (AC1): the warm budget is still 5000 ms (NFR-Performance) and the cold-start budget is 15000 ms');
  const r = function (m) { return has ? lb.evaluateBudgets(m) : { ok: null, failures: ['no module'] }; };
  ok(has && r({ coldMs: 9000, warmMs: 1200 }).ok === true && r({ coldMs: 9000, warmMs: 1200 }).failures.length === 0,
    'F2 (AC1): a slow first call (9 s) followed by a fast warm call (1.2 s) passes');
  ok(has && r({ coldMs: 15001, warmMs: 800 }).ok === false && /cold/i.test(r({ coldMs: 15001, warmMs: 800 }).failures.join(' ')),
    'F3 (AC2): a first call over the cold-start budget still fails, and says it was the cold-start call');
  ok(has && r({ coldMs: 3000, warmMs: 5001 }).ok === false && /5000/.test(r({ coldMs: 3000, warmMs: 5001 }).failures.join(' ')) && /warm/i.test(r({ coldMs: 3000, warmMs: 5001 }).failures.join(' ')),
    'F4 (AC2): a warm call over 5 seconds fails (the steady-state requirement is kept), naming the 5000 ms budget');
  ok(has && r({ coldMs: 20000, warmMs: 9000 }).failures.length === 2,
    'F5 (AC2): both budgets exceeded gives two failures');
  ok(has && r({ coldMs: undefined, warmMs: 1000 }).ok === false && r({ coldMs: 1000, warmMs: NaN }).ok === false,
    'F6 (AC2): a missing or non-numeric timing fails closed');
}

// ── AC3: the diagnostics line for the /admin/credits call ────────────────────
const dg = load('tests/e2e/fixtures/admin-credits-diagnostics.js');
{
  const has = !!dg && typeof dg.summariseAdminCreditsCall === 'function';
  const rows = function (n) { let s = '<table>'; for (let i = 0; i < n; i++) s += '<tr><td class="tpac-credits-balance">1</td></tr>'; return s + '</table>'; };
  const s1 = has ? dg.summariseAdminCreditsCall({ who: 'alice', status: 200, elapsedMs: 412, body: rows(37) }) : '';
  ok(has && /alice/.test(s1) && /200/.test(s1) && /412 ms/.test(s1) && /37 tenant/.test(s1),
    'F7 (AC3): a successful call names who called, the status, the elapsed milliseconds and the tenant row count');
  const s2 = has ? dg.summariseAdminCreditsCall({ who: 'alice', status: 502, elapsedMs: 30011, body: '<html>Bad Gateway</html>' }) : '';
  ok(has && /502/.test(s2) && /30011 ms/.test(s2) && /0 tenant/.test(s2),
    'F8 (AC3): a gateway error records the status and the time it took, with zero tenant rows');
  const s3 = has ? dg.summariseAdminCreditsCall({ who: 'alice', elapsedMs: 3012, error: new Error('apiRequestContext.get: aborted') }) : '';
  ok(has && /failed/i.test(s3) && /3012 ms/.test(s3) && /aborted/.test(s3) && /unknown/i.test(s3),
    'F9 (AC3): a call that threw (for example an aborted connection) records the time and the error, with the tenant count unknown');
  const s4 = has ? dg.summariseAdminCreditsCall({ who: 'bob', status: 403, elapsedMs: 88 }) : '';
  ok(has && /bob/.test(s4) && /403/.test(s4) && /unknown/i.test(s4), 'F10 (AC3): a call with no body (the 403) still reports who, status and time');
}

// ── AC1/AC3: the specs use the helpers and keep their assertions ──────────────
{
  const a1 = read('tests/e2e/a1-staging-auth-stub.spec.js');
  const ac1 = a1.slice(a1.indexOf("test('AC1:"), a1.indexOf("test('NFR-Audit"));
  ok(/require\('\.\/fixtures\/latency-budget'\)/.test(a1) && /evaluateBudgets\(/.test(ac1) && (ac1.match(/stubGithubLogin\(request\)/g) || []).length >= 2,
    'F11 (AC1): a1 AC1 times a first (cold) and a second (warm) stub login and judges them with evaluateBudgets');
  ok(!/expect\(elapsedMs[\s\S]*?\.toBeLessThan\(5000\)/.test(ac1) && /expect\(login\)\.toMatch\(\/\^e2e-test-gh-\/\)/.test(ac1) && /expect\(me\.login\)\.toBe\(login\)/.test(ac1),
    'F12 (AC1): the single 5 s check on the first call is gone and the identity and session assertions in AC1 are unchanged');
  ok(/signUpEmail\(request, 'ac2'\)[\s\S]{0,200}toBeLessThan\(5000\)/.test(a1),
    'F13 (AC2): AC2 (email signup) keeps its own 5 s check');
  const bri = read('tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js');
  const b1 = bri.slice(bri.indexOf("test('AC1: admin (alice)"), bri.indexOf("test('AC2:"));
  ok(/require\('\.\/fixtures\/admin-credits-diagnostics'\)/.test(bri) && (b1.match(/console\.log\(summariseAdminCreditsCall\(/g) || []).length === 3 && /who: 'alice'/.test(b1) && /who: 'bob'/.test(b1),
    'F14 (AC3): bri-s3.3 AC1 logs a diagnostics line for alice (success and error paths) and for bob');
  ok(/expect\(aliceAdminRes\.status\(\)\)\.toBe\(200\)/.test(b1) && /expect\(bobAdminRes\.status\(\)\)\.toBe\(403\)/.test(b1) && /expect\(afterCount\)\.toBe\(beforeCount\)/.test(b1),
    'F15 (AC3): its assertions (alice 200, bob 403, no real LLM calls) are unchanged');
  ok(/catch \(e\)[\s\S]{0,300}throw e/.test(b1), 'F16 (AC3): a thrown error is logged and then rethrown, so a failure still fails the test');
}

// ── AC4: the ledger note, and the existing checks ────────────────────────────
{
  const ledger = JSON.parse(read('tests/e2e/flake-ledger.json'));
  const bri = ledger.entries.find(function (e) { return /^bri-s3\.3/.test(e.test); });
  ok(!!bri && /2026-11-21/.test(bri.note) && /44880044029/.test(bri.note) && bri.firstSeen === '2026-11-21' && bri.reviewBy === '2026-12-05',
    'F17 (AC4): the bri-s3.3 ledger note records the 2026-11-21 occurrence (run 44880044029), dates unchanged');
  const chk = spawnSync(process.execPath, [path.join(root, 'scripts', 'flake-check.js'), '--check'], { cwd: root, encoding: 'utf8' });
  const sfr = spawnSync(process.execPath, [path.join(root, 'tests', 'check-sfr-s1-staging-flake-retries.js')], { cwd: root, encoding: 'utf8' });
  ok(chk.status === 0 && sfr.status === 0, 'F18 (AC4): flake-check --check and check-sfr-s1 still pass' + (chk.status === 0 && sfr.status === 0 ? '' : ' (exit ' + chk.status + ' / ' + sfr.status + ')'));
}

console.log('\n[sfx-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

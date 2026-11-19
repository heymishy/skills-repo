#!/usr/bin/env node
// check-pwi-s1-playwright-install-without-apt.js -- AC verification for pwi-s1
// (the Playwright install in CI no longer downloads Ubuntu packages). Workflow
// files are read as text; no network. Comment lines are ignored, because the
// replacement comments explain the change and necessarily mention --with-deps.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wfDir = path.join(root, '.github', 'workflows');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

// In-scope file -> number of install steps it must keep (story AC3).
const IN_SCOPE = {
  'e2e.yml': 3,
  'core-browser-tests.yml': 1,
  'staging-deploy.yml': 2,
  'bri-s3.4-cross-tenant-repeat-gate.yml': 1,
  'playwright-spec-coverage.yml': 1
};

function codeLines(file) {
  return fs.readFileSync(path.join(wfDir, file), 'utf8')
    .split(/\r?\n/)
    .filter(function (l) { return !/^\s*#/.test(l); });
}

console.log('T1 (AC1): no --with-deps or install-deps on a non-comment line');
Object.keys(IN_SCOPE).forEach(function (f) {
  const hits = codeLines(f).filter(function (l) { return /--with-deps|install-deps/.test(l); });
  ok(hits.length === 0, f + ': ' + hits.length + ' offending line(s)');
});

console.log('T2 (AC2): no apt cache path or key on a non-comment line');
Object.keys(IN_SCOPE).forEach(function (f) {
  const hits = codeLines(f).filter(function (l) { return /\/var\/cache\/apt|apt-playwright-deps/.test(l); });
  ok(hits.length === 0, f + ': ' + hits.length + ' offending line(s)');
});

console.log('T3 (AC3): exactly eight browser installs, each still a named step');
let total = 0;
Object.keys(IN_SCOPE).forEach(function (f) {
  const lines = codeLines(f);
  const runs = lines.filter(function (l) { return /^\s*run:\s*npx playwright install chromium\s*$/.test(l); }).length;
  const named = lines.filter(function (l) { return /^\s*-\s*name:\s*Install Playwright browsers \(Chromium only\)\s*$/.test(l); }).length;
  total += runs;
  ok(runs === IN_SCOPE[f] && named === IN_SCOPE[f], f + ': ' + runs + ' install command(s), ' + named + ' named step(s), expected ' + IN_SCOPE[f]);
});
ok(total === 8, 'eight installs in total (found ' + total + ')');

console.log('T4 (AC4): ppc-capture-worker.yml keeps --with-deps (its output is user-facing)');
ok(codeLines('ppc-capture-worker.yml').some(function (l) { return /npx playwright install --with-deps chromium/.test(l); }),
  'ppc-capture-worker.yml still installs with --with-deps');

console.log('T5 (AC5): the guardrail no longer recommends --with-deps for CI, and says why');
const guard = fs.readFileSync(path.join(root, '.github', 'architecture-guardrails.md'), 'utf8');
const rule = (guard.split(/\r?\n/).filter(function (l) { return /^3\.\s+\*\*Playwright is a devDependency only/.test(l); })[0]) || '';
ok(rule.length > 0, 'the devDependency rule is present');
ok(!/via CI `npx playwright install --with-deps chromium`/.test(rule), 'the rule does not recommend --with-deps for CI');
ok(/--with-deps/.test(rule) && /fonts|mirror/i.test(rule), 'the rule names --with-deps and the reason (fonts, mirror)');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

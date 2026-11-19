#!/usr/bin/env node
// check-cvt-s1-live-audit-shape.js -- AC verification for cvt-s1
// (the live npm audit case in check-coha-s3 checks the shape of the audit,
// not which packages happen to be vulnerable today).
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const COHA = path.join(root, 'tests', 'check-coha-s3-vulnerability-ci-step.js');
const BKN = path.join(root, 'tests', 'check-bkn-s1-bookkeeping-push-noise.js');
const vulnCheck = require('../scripts/check-vulnerability-findings.js');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

// The source of the one live case: from its comment to the next comment banner.
const source = fs.readFileSync(COHA, 'utf8');
const start = source.indexOf('Integration: AC1 (real repo dependency tree)');
const end = source.indexOf('Integration: AC2, AC3');
const liveCase = start >= 0 && end > start ? source.slice(start, end) : '';

function runTest(file) {
  return spawnSync(process.execPath, [file], { encoding: 'utf8', timeout: 240000 });
}

console.log('T1 (AC1): the coha-s3 test, including the live audit case, passes');
const coha = runTest(COHA);
ok(coha.status === 0, 'check-coha-s3-vulnerability-ci-step exits 0');
ok(/✓ fullAuditStepRunsAgainstRealRepoDependencyTree/.test(coha.stdout), 'the live audit case itself passes');

console.log('T2 (AC2): the live case requires no named package or severity');
ok(liveCase.length > 0, 'the live case was found in the coha-s3 test');
ok(!/vulnerabilities\.dompurify/.test(liveCase), 'it does not read vulnerabilities.dompurify');
ok(!/===\s*'critical'/.test(liveCase), "it does not require a 'critical' severity");

console.log('T3 (AC3): the live case checks the audit shape and can still fail');
ok(/isAuditCommandError\(/.test(liveCase), 'it calls isAuditCommandError');
ok(/\.vulnerabilities\b/.test(liveCase) && /typeof [^;]*\.metadata\.vulnerabilities\.total\s*===\s*'number'/.test(liveCase), 'it checks the vulnerabilities object and a numeric metadata.vulnerabilities.total');
ok(/filterNewHighOrCriticalFindings\(/.test(liveCase), 'it passes the result through filterNewHighOrCriticalFindings');
ok(vulnCheck.isAuditCommandError({ error: { code: 'ENETUNREACH', summary: 'Registry unreachable' } }) === true, 'a registry-error result is an audit-command error, so the case rejects it');

console.log('T4 (AC4): the bookkeeping-noise test, which re-runs the coha-s3 test, passes');
const bkn = runTest(BKN);
ok(bkn.status === 0, 'check-bkn-s1-bookkeeping-push-noise exits 0');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

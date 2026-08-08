'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'tests', 'check-md-3-adr.js');

(function () {
  // AC1: standalone run has no nested subprocess, T1-T3 still run and pass
  try {
    const r = spawnSync(process.execPath, [FILE], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status} (stderr: ${(r.stderr || '').slice(0, 300)})`);
    assert(/T1:/.test(r.stdout), 'expected T1 section to still run');
    assert(/T2:/.test(r.stdout), 'expected T2 section to still run');
    assert(/T3:/.test(r.stdout), 'expected T3 section to still run');
    assert(!/T4:/.test(r.stdout), 'expected T4 (the nested npm test check) to be removed entirely');
    assert(!/\[run-all-tests\]/.test(r.stdout), 'expected no evidence of a nested full-suite run in the output');
    pass('checkMd3Adr_standaloneRun_noNestedSubprocess_t1ThroughT3StillPass');
  } catch (e) { fail('checkMd3Adr_standaloneRun_noNestedSubprocess_t1ThroughT3StillPass', e); }

  // AC2: completes in bounded time (matching every other content-check test,
  // not the multi-minute nested-suite scale this fix removes)
  try {
    const start = Date.now();
    const r = spawnSync(process.execPath, [FILE], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
    const elapsedMs = Date.now() - start;
    assert.strictEqual(r.status, 0, 'expected exit 0');
    assert(elapsedMs < 5000, `expected completion well under 5s, took ${elapsedMs}ms`);
    pass('checkMd3Adr_inSuiteRun_completesInBoundedTime');
  } catch (e) { fail('checkMd3Adr_inSuiteRun_completesInBoundedTime', e); }

  // Source-level guard: no execSync('npm test', ...) left in the file at all
  try {
    const src = fs.readFileSync(FILE, 'utf8');
    assert(!/execSync\(\s*['"]npm test/.test(src), 'expected no execSync("npm test", ...) call to remain in the source');
    pass('checkMd3Adr_sourceContainsNoNestedNpmTestCall');
  } catch (e) { fail('checkMd3Adr_sourceContainsNoNestedNpmTestCall', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();

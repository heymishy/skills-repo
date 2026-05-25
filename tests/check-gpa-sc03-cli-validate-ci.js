'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const child = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN_SKILLS = path.join(ROOT, 'bin', 'skills');

let passed = 0, failed = 0;
function ok(condition, label) {
  if (condition) { console.log('  \u2713 ' + label); passed++; }
  else { console.log('  \u2717 ' + label); failed++; }
}

// T1: governance-package exports checkHGates function
{
  try {
    const mod = require('../src/enforcement/governance-package');
    ok(typeof mod.checkHGates === 'function', 'T1: governance-package exports checkHGates function');
  } catch (e) {
    ok(false, 'T1: governance-package exports checkHGates function (require failed: ' + e.message + ')');
  }
}

// T2: bin/skills source references governance-package (not reimplementing H-gates inline)
{
  const skillsSrc = fs.readFileSync(BIN_SKILLS, 'utf8');
  ok(skillsSrc.includes('governance-package'), 'T2: bin/skills require-references governance-package');
  // H-gate logic must NOT be reimplemented inline in bin/skills
  const hasInlineH1 = /H1\s+FAIL/i.test(skillsSrc) || /H1\s*:/i.test(skillsSrc);
  ok(!hasInlineH1, 'T2: bin/skills does not implement H-gate logic inline (no H1 definition)');
}

// T3: output uses canonical format [skills-validate] Results: N passed, N failed
{
  try {
    const mod = require('../src/enforcement/governance-package');
    // Use a real DoR artefact slug that should pass all H-gates (or be signed-off)
    const result = mod.checkHGates('gpa-sc-01-trace-contract', ROOT);
    const output = (result.stdout || '') + (result.stderr || '');
    const canonical = /\[skills-validate\] Results: \d+ passed, \d+ failed/;
    ok(canonical.test(output), 'T3: output uses canonical format [skills-validate] Results: N passed, N failed (got: ' + output.slice(0, 100) + ')');
  } catch (e) {
    ok(false, 'T3: output format check failed: ' + e.message);
  }
}

// T4: missing story file → H1 FAIL in output
{
  try {
    const mod = require('../src/enforcement/governance-package');
    const result = mod.checkHGates('nonexistent-slug-sc03-test', ROOT);
    const output = (result.stdout || '') + (result.stderr || '');
    ok(result.exitCode !== 0, 'T4: nonexistent slug → non-zero exit');
    ok(/H1\s*(FAIL|fail)/i.test(output), 'T4: H1 FAIL in output (got: ' + output.slice(0, 150) + ')');
  } catch (e) {
    ok(false, 'T4: H1 FAIL check failed: ' + e.message);
  }
}

// T5: dorStatus=signed-off → skip, exit 0
{
  try {
    const mod = require('../src/enforcement/governance-package');
    // Find a story that has dorStatus: signed-off in pipeline-state.json
    const stateRaw = fs.readFileSync(path.join(ROOT, '.github', 'pipeline-state.json'), 'utf8');
    const state = JSON.parse(stateRaw);
    let signedOffSlug = null;
    for (const feat of state.features) {
      const stories = [
        ...(feat.stories || []),
        ...((feat.epics || []).flatMap(e => e.stories || []))
      ];
      const found = stories.find(s => s.dorStatus === 'signed-off');
      if (found) { signedOffSlug = found.id || found.slug; break; }
    }
    if (signedOffSlug) {
      const result = mod.checkHGates(signedOffSlug, ROOT);
      const output = (result.stdout || '') + (result.stderr || '');
      ok(result.exitCode === 0, 'T5: signed-off dorStatus → exit 0 (got ' + result.exitCode + ')');
      ok(/skip/i.test(output), 'T5: skip message in output (got: ' + output.slice(0, 100) + ')');
    } else {
      ok(false, 'T5: no signed-off story found in pipeline-state.json — cannot test skip behaviour');
    }
  } catch (e) {
    ok(false, 'T5: skip test failed: ' + e.message);
  }
}

// IT1: node bin/skills validate --story gpa-sc-01-trace-contract --ci exits 0
{
  const spawn = child.spawnSync('node', [BIN_SKILLS, 'validate', '--story', 'gpa-sc-01-trace-contract', '--ci'],
    { cwd: ROOT, encoding: 'utf8', timeout: 10000 });
  ok(spawn.status === 0, 'IT1: validate --story gpa-sc-01-trace-contract --ci exits 0 (got ' + spawn.status + ')');
  const output = (spawn.stdout || '') + (spawn.stderr || '');
  ok(/\[skills-validate\] Results:/.test(output), 'IT1: output contains [skills-validate] Results: prefix');
  ok(/\[skills-validate\] Results: \d+ passed, 0 failed/.test(output), 'IT1: output shows 0 failures (got: ' + output.slice(0, 150) + ')');
}

// IT2: node bin/skills validate --story nonexistent-test-story-sc03 --ci exits 1
{
  const spawn = child.spawnSync('node', [BIN_SKILLS, 'validate', '--story', 'nonexistent-test-story-sc03', '--ci'],
    { cwd: ROOT, encoding: 'utf8', timeout: 10000 });
  ok(spawn.status !== 0, 'IT2: nonexistent story slug exits non-zero (got ' + spawn.status + ')');
  const output = (spawn.stdout || '') + (spawn.stderr || '');
  ok(/H1\s*(FAIL|fail)/i.test(output), 'IT2: H1 FAIL in output (got: ' + output.slice(0, 150) + ')');
}

console.log('\n[gpa-sc03] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

#!/usr/bin/env node
/**
 * check-rms-s1-skills-dir-path.js
 *
 * Regression test for rms-s1 -- scripts/run-model-sweep.js hardcoded
 * SKILLS_DIR at REPO_ROOT/.github/skills, a location that has never existed
 * in this repo. Skills actually live at REPO_ROOT/skills (confirmed:
 * skills/discovery, skills/test-plan, skills/definition-of-ready,
 * skills/review all have EVAL.md + corpus/). PR #753 (pisd-s1) fixed this
 * exact drift in platform-init.js but missed this script, which has had
 * zero test coverage -- every invocation since pisd-s1 merged has failed
 * immediately with "Skills directory not found", including --list-skills.
 *
 * This test drives the real CLI as a child process against the real repo
 * tree -- no mocks -- since the bug was invisible specifically because
 * nothing exercised the real path.
 *
 * Run: node tests/check-rms-s1-skills-dir-path.js
 */
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.resolve(__dirname, '../scripts/run-model-sweep.js');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}

function run() {
  // AC1: --list-skills finds the real skills, does not throw "Skills directory not found".
  const listResult = spawnSync(process.execPath, [SCRIPT_PATH, '--list-skills'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 15000,
  });
  const listOut = (listResult.stdout || '') + (listResult.stderr || '');

  ok(listResult.status === 0, 'AC1: --list-skills exits 0');
  ok(!/Skills directory not found/.test(listOut), 'AC1: --list-skills does not report "Skills directory not found"');
  ok(/\bdiscovery\b/.test(listOut), 'AC1: --list-skills output lists discovery');
  ok(/\btest-plan\b/.test(listOut), 'AC1: --list-skills output lists test-plan');
  ok(/\bdefinition-of-ready\b/.test(listOut), 'AC1: --list-skills output lists definition-of-ready');
  ok(/\breview\b/.test(listOut), 'AC1: --list-skills output lists review');

  // AC2: every listed skill has a real EVAL.md (implied by discoverSkills()
  // only including skills with EVAL.md) and, where present, a real corpus/
  // dir with a non-zero case count printed for definition-of-ready.
  const dorLine = listOut.split('\n').find((l) => /^\s*definition-of-ready\s+—/.test(l));
  ok(!!dorLine, 'AC2: definition-of-ready line present in --list-skills output');
  ok(!!dorLine && /(\d+) corpus case\(s\)/.test(dorLine) && parseInt(dorLine.match(/(\d+) corpus case\(s\)/)[1], 10) > 0,
    'AC2: definition-of-ready reports a non-zero corpus case count (real corpus/ dir found, not null)');

  // AC3: --dry-run against a real skill with corpus builds a real matrix
  // without hitting the network -- proves the corpus-discovery path also
  // works end-to-end post-fix, not just directory listing.
  const dryRunResult = spawnSync(process.execPath, [
    SCRIPT_PATH,
    '--experiment', 'EXP-TEST-rms-s1',
    '--skills', 'definition-of-ready',
    '--dry-run',
  ], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 15000,
  });
  const dryRunOut = (dryRunResult.stdout || '') + (dryRunResult.stderr || '');

  ok(dryRunResult.status === 0, 'AC3: --dry-run for definition-of-ready exits 0');
  ok(!/Skills directory not found/.test(dryRunOut), 'AC3: --dry-run does not report "Skills directory not found"');
  ok(!/no corpus cases match/i.test(dryRunOut), 'AC3: --dry-run finds real corpus cases for definition-of-ready (not an empty match)');

  console.log(`\n[rms-s1] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();

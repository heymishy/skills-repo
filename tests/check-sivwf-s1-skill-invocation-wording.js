#!/usr/bin/env node
/**
 * check-sivwf-s1-skill-invocation-wording.js
 *
 * Content-assertion tests for CLAUDE.md's clarifying passage stating the
 * real skill-invocation mechanism (read SKILL.md directly, not a registered
 * Claude Code skill). Run: node tests/check-sivwf-s1-skill-invocation-wording.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');
const CONTRACTS_SCRIPT = path.join(ROOT, '.github', 'scripts', 'check-skill-contracts.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ✓ ' + name);
    passed++;
  } catch (err) {
    console.error('  ✗ ' + name);
    console.error('      ' + err.message);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function norm(s) {
  return s.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');
}

const claudeMd = norm(fs.readFileSync(CLAUDE_MD, 'utf8'));

console.log('\n[sivwf-s1] Tests\n');

test('claudeMdStatesRealInvocationMechanism (AC1)', () => {
  const activeContextIdx = claudeMd.indexOf('## Active context');
  const pipelineOverviewIdx = claudeMd.indexOf('## Pipeline overview');
  assert(activeContextIdx !== -1, 'expected ## Active context section to exist');
  assert(pipelineOverviewIdx !== -1, 'expected ## Pipeline overview section to exist');
  const preOverview = claudeMd.slice(activeContextIdx, pipelineOverviewIdx);
  assert(/does not mean these are registered Claude Code skills|not registered Claude Code skills/i.test(preOverview),
    'expected an explicit statement before Pipeline overview that skills are not registered Claude Code skills');
  assert(/skills\/\[name\]\/SKILL\.md/.test(preOverview) || /skills\/\[name\]\/SKILL\.md/.test(claudeMd),
    'expected the passage to name the real file location skills/[name]/SKILL.md');
  assert(/reading that.{0,20}SKILL\.md.{0,20}file directly and following its instructions/i.test(preOverview),
    'expected the passage to state invoking means reading the file directly and following it');
});

test('existingNotationUnchanged (AC2, non-regression)', () => {
  assert(/Step {2,}Skill {2,}Entry condition {2,}Exit condition/.test(claudeMd) || /\| Skill/.test(claudeMd) || /\/discovery/.test(claudeMd),
    'expected the Pipeline overview table to still reference /discovery');
  assert(/`\/workflow`/.test(claudeMd), 'expected /workflow notation still present elsewhere in the document');
  assert(/Short-track/.test(claudeMd), 'expected the Short-track section heading to still be present');
  assert(/`\/test-plan → \/definition-of-ready → coding agent`/.test(claudeMd),
    'expected the short-track flow notation to be unchanged');
});

test('citesConcreteFailureMode (AC3)', () => {
  assert(/Unknown skill/.test(claudeMd), 'expected the passage to cite the real observed failure ("Unknown skill")');
  assert(/skill="workflow"/.test(claudeMd), 'expected the passage to cite the concrete skill="workflow" example');
});

test('referencesDiscoveryArtefact (AC4)', () => {
  assert(/artefacts\/2026-08-24-skill-tool-invocability-pilot\/discovery\.md/.test(claudeMd),
    'expected the passage to reference the discovery artefact by path');
});

test('noNativeRegistrationArtifactsIntroduced (non-regression, Architecture Constraints)', () => {
  assert(!fs.existsSync(path.join(ROOT, '.claude', 'skills')),
    '.claude/skills/ should not have been created by this story');
  assert(!fs.existsSync(path.join(ROOT, '.claude-plugin', 'plugin.json')),
    '.claude-plugin/plugin.json should not have been created by this story');
});

test('checkSkillContractsUntouched (non-regression, Architecture Constraints)', () => {
  assert(fs.existsSync(CONTRACTS_SCRIPT), 'check-skill-contracts.js should still exist, unmodified');
  const contractsSrc = fs.readFileSync(CONTRACTS_SCRIPT, 'utf8');
  assert(!/skill-invocation-wording/i.test(contractsSrc) && !/sivwf-s1/i.test(contractsSrc),
    'check-skill-contracts.js should not have gained a CLAUDE.md-related entry — that script is SKILL.md-only scoped');
});

console.log('');
console.log('[sivwf-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

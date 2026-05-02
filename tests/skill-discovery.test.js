'use strict';
/**
 * skill-discovery.test.js — AC verification for wuce.11
 * 18 tests: T1-T5 (unit), IT1-IT2 (integration), NFR1-NFR2
 */
const assert  = require('assert');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const { listAvailableSkills, validateSkillName, setLogger } = require('../src/adapters/skill-discovery');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  \u2717 ' + name + ': ' + err.message);
  }
}

function mkTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wuce11-'));
}
function makeSkill(root, skillsDir, skillName) {
  var sd = path.join(root, skillsDir, skillName);
  fs.mkdirSync(sd, { recursive: true });
  fs.writeFileSync(path.join(sd, 'SKILL.md'), '# ' + skillName, 'utf8');
}
function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

// T1 — listAvailableSkills basic discovery (AC1)
console.log('\nT1 — listAvailableSkills basic discovery (AC1)');

test('T1.1 — returns one entry per dir containing SKILL.md', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    makeSkill(root, path.join('.github', 'skills'), 'review');
    makeSkill(root, path.join('.github', 'skills'), 'test-plan');
    const result = listAvailableSkills(root);
    assert.strictEqual(result.length, 3);
    const names = result.map(r => r.name).sort();
    assert.deepStrictEqual(names, ['discovery', 'review', 'test-plan']);
  } finally { cleanup(root); }
});

test('T1.2 — path field is relative to repo root (not absolute)', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    const result = listAvailableSkills(root);
    assert.strictEqual(result.length, 1);
    assert.ok(!path.isAbsolute(result[0].path), 'path should be relative');
    assert.ok(result[0].path.includes('discovery'), 'path should include skill name');
  } finally { cleanup(root); }
});

test('T1.3 — name field matches directory name exactly', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'definition-of-ready');
    const result = listAvailableSkills(root);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'definition-of-ready');
  } finally { cleanup(root); }
});

// T2 — COPILOT_SKILLS_DIRS override (AC2)
console.log('\nT2 — COPILOT_SKILLS_DIRS env var override (AC2)');

test('T2.1 — custom COPILOT_SKILLS_DIRS overrides default', () => {
  const root = mkTempRoot();
  try {
    const customDir = path.join(root, 'custom-skills');
    fs.mkdirSync(path.join(customDir, 'discovery'), { recursive: true });
    fs.writeFileSync(path.join(customDir, 'discovery', 'SKILL.md'), '# discovery', 'utf8');
    makeSkill(root, path.join('.github', 'skills'), 'review');
    process.env.COPILOT_SKILLS_DIRS = customDir;
    const result = listAvailableSkills(root);
    delete process.env.COPILOT_SKILLS_DIRS;
    const names = result.map(r => r.name);
    assert.ok(names.includes('discovery'), 'should find discovery from custom dir');
    assert.ok(!names.includes('review'), 'should NOT find review from default dir');
  } finally { delete process.env.COPILOT_SKILLS_DIRS; cleanup(root); }
});

test('T2.2 — default .github/skills used when env var unset', () => {
  const root = mkTempRoot();
  try {
    delete process.env.COPILOT_SKILLS_DIRS;
    makeSkill(root, path.join('.github', 'skills'), 'review');
    const result = listAvailableSkills(root);
    assert.ok(result.map(r => r.name).includes('review'), 'should find review from default dir');
  } finally { delete process.env.COPILOT_SKILLS_DIRS; cleanup(root); }
});

// T3 — Subdirs without SKILL.md excluded (AC3)
console.log('\nT3 — Subdirs without SKILL.md excluded (AC3)');

test('T3.1 — empty subdir not included', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    fs.mkdirSync(path.join(root, '.github', 'skills', 'draft-wip'), { recursive: true });
    const result = listAvailableSkills(root);
    const names = result.map(r => r.name);
    assert.ok(names.includes('discovery'), 'discovery should be included');
    assert.ok(!names.includes('draft-wip'), 'draft-wip should be excluded (no SKILL.md)');
  } finally { cleanup(root); }
});

test('T3.2 — subdir with non-SKILL.md files not included', () => {
  const root = mkTempRoot();
  try {
    const assetsDir = path.join(root, '.github', 'skills', 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, 'logo.png'), 'fake png', 'utf8');
    const result = listAvailableSkills(root);
    assert.ok(!result.map(r => r.name).includes('assets'), 'assets dir without SKILL.md excluded');
  } finally { cleanup(root); }
});

// T4 — Missing or empty directory (AC4)
console.log('\nT4 — Missing or empty directory (AC4)');

test('T4.1 — missing skills dir returns empty array without throwing', () => {
  const root = mkTempRoot();
  try {
    let result;
    assert.doesNotThrow(() => { result = listAvailableSkills(root); });
    assert.deepStrictEqual(result, []);
  } finally { cleanup(root); }
});

test('T4.2 — empty skills dir returns empty array', () => {
  const root = mkTempRoot();
  try {
    fs.mkdirSync(path.join(root, '.github', 'skills'), { recursive: true });
    const result = listAvailableSkills(root);
    assert.deepStrictEqual(result, []);
  } finally { cleanup(root); }
});

test('T4.3 — missing dir logs a warning', () => {
  const root = mkTempRoot();
  try {
    let warnCalled = false;
    setLogger({ warn: function(msg) { warnCalled = true; } });
    listAvailableSkills(root);
    setLogger({ warn: function(msg) { process.stderr.write('[skill-discovery] ' + msg + '\n'); } });
    assert.ok(warnCalled, 'warn should be called for missing dir');
  } finally { cleanup(root); }
});

// T5 — Allowlist completeness and path bounds (AC5)
console.log('\nT5 — Allowlist completeness and path bounds (AC5)');

test('T5.1 — returned list contains all discovered skills', () => {
  const root = mkTempRoot();
  try {
    const skillNames = ['discovery', 'review', 'test-plan', 'definition', 'trace'];
    skillNames.forEach(n => makeSkill(root, path.join('.github', 'skills'), n));
    const result = listAvailableSkills(root);
    assert.strictEqual(result.length, 5, 'should return all 5 skills');
  } finally { cleanup(root); }
});

test('T5.2 — no entry path resolves outside skills directory', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    const skillsBase = path.join(root, '.github', 'skills');
    const result = listAvailableSkills(root);
    result.forEach(function(r) {
      var abs = path.resolve(root, r.path);
      assert.ok(abs.startsWith(skillsBase), 'path ' + r.path + ' should resolve within skills dir');
    });
  } finally { cleanup(root); }
});

test('T5.3 — validateSkillName returns false for name not in discovered list', () => {
  const discovered = [{ name: 'discovery', path: '.github/skills/discovery' }, { name: 'review', path: '.github/skills/review' }];
  assert.strictEqual(validateSkillName('unknown-skill', discovered), false);
});

test('T5.4 — validateSkillName returns true for name in discovered list', () => {
  const discovered = [{ name: 'discovery', path: '.github/skills/discovery' }, { name: 'review', path: '.github/skills/review' }];
  assert.strictEqual(validateSkillName('discovery', discovered), true);
});

// Integration tests
console.log('\nIntegration tests');

test('IT1 — listAvailableSkills returns skill list (AC1, AC2)', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    makeSkill(root, path.join('.github', 'skills'), 'review');
    makeSkill(root, path.join('.github', 'skills'), 'test-plan');
    const result = listAvailableSkills(root);
    assert.ok(Array.isArray(result), 'result should be an array');
    assert.strictEqual(result.length, 3, 'should find 3 skills');
    result.forEach(function(r) {
      assert.ok(r.name, 'each entry should have a name');
      assert.ok(r.path, 'each entry should have a path');
    });
  } finally { cleanup(root); }
});

test('IT2 — missing skills dir returns empty array (AC4)', () => {
  const root = mkTempRoot();
  try {
    const result = listAvailableSkills(root);
    assert.deepStrictEqual(result, [], 'missing dir should return empty array');
  } finally { cleanup(root); }
});

// NFR tests
console.log('\nNFR tests');

test('NFR1 — skill discovery completes in under 200ms for 20 skills', () => {
  const root = mkTempRoot();
  try {
    for (var i = 0; i < 20; i++) {
      makeSkill(root, path.join('.github', 'skills'), 'skill-' + i);
    }
    const start = Date.now();
    const result = listAvailableSkills(root);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 200, 'should complete in <200ms, took: ' + elapsed + 'ms');
    assert.strictEqual(result.length, 20, 'should find all 20 skills');
  } finally { cleanup(root); }
});

test('NFR2 — skill names with uppercase excluded and logged', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'valid-skill');
    // Create invalid dir (uppercase) manually
    var invalidDir = path.join(root, '.github', 'skills', 'InvalidSkill');
    fs.mkdirSync(invalidDir, { recursive: true });
    fs.writeFileSync(path.join(invalidDir, 'SKILL.md'), '# invalid', 'utf8');
    let warnMessages = [];
    setLogger({ warn: function(msg) { warnMessages.push(msg); } });
    const result = listAvailableSkills(root);
    setLogger({ warn: function(msg) { process.stderr.write('[skill-discovery] ' + msg + '\n'); } });
    const names = result.map(r => r.name);
    assert.ok(!names.includes('InvalidSkill'), 'InvalidSkill should be excluded');
    assert.ok(names.includes('valid-skill'), 'valid-skill should be included');
    assert.ok(warnMessages.some(m => m.includes('InvalidSkill')), 'should warn about excluded name');
  } finally { cleanup(root); }
});

// Summary
console.log('\n[wuce11-skill-discovery] ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  failures.forEach(f => console.log('  FAIL: ' + f.name + ': ' + f.err.message));
  process.exit(1);
}

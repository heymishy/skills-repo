'use strict';
/**
 * check-csdg-s1-root-skills-dir-default.js -- csdg-s1
 * Story: artefacts/2026-08-22-copilot-skills-dirs-prod-gap/stories/csdg-s1-verify-and-wire-skills-dir-in-production.md
 *
 * Root cause (live-confirmed against production, 2026-09-11):
 * COPILOT_SKILLS_DIRS is not set on skills-framework.fly.dev (flyctl secrets
 * list), and .github/skills/ no longer exists in this repo at all -- pisd-s1
 * (PR #753, 2026-08-22) consolidated every real skill, including
 * infra-definition/infra-plan/infra-review, into root skills/. A real,
 * authenticated POST /api/skills/benefit-metric/sessions against production
 * returned 400 SKILL_NOT_FOUND; so did POST /api/skills/infra-definition/sessions
 * -- confirming this is a live, current bug affecting every skill name for
 * every authenticated caller of this repo's own self-hosted deployment, not
 * a hypothetical.
 *
 * Fix: listAvailableSkills's default resolution (no COPILOT_SKILLS_DIRS set)
 * now prefers root skills/ when it exists, falling back to .github/skills/
 * only when it doesn't -- closing this repo's own case with zero Fly
 * secret/config change needed, while leaving the documented consumer-repo
 * bootstrap contract (skills only ever installed at .github/skills/ by
 * /bootstrap) completely unchanged, per AC5.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { listAvailableSkills } = require('../src/adapters/skill-discovery');

let passed = 0; let failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (err) { failed++; console.log('  ✗ ' + name + ': ' + err.message); }
}

function mkTempRoot() { return fs.mkdtempSync(path.join(os.tmpdir(), 'csdg-s1-')); }
function makeSkill(root, skillsDirRel, skillName) {
  var sd = path.join(root, skillsDirRel, skillName);
  fs.mkdirSync(sd, { recursive: true });
  fs.writeFileSync(path.join(sd, 'SKILL.md'), '# ' + skillName, 'utf8');
}
function cleanup(dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {} }

console.log('\nAC3 -- default resolution prefers root skills/ when it exists (this repo\'s own self-hosted case)');

test('AC3.1: root skills/ present (no COPILOT_SKILLS_DIRS set) -> resolves from root skills/, not .github/skills/', function() {
  var root = mkTempRoot();
  try {
    delete process.env.COPILOT_SKILLS_DIRS;
    makeSkill(root, 'skills', 'benefit-metric');
    makeSkill(root, path.join('.github', 'skills'), 'should-be-ignored');
    var result = listAvailableSkills(root);
    var names = result.map(function(r) { return r.name; });
    assert.ok(names.includes('benefit-metric'), 'benefit-metric (root skills/) should be found');
    assert.ok(!names.includes('should-be-ignored'), '.github/skills/ must NOT be consulted when root skills/ exists');
  } finally { delete process.env.COPILOT_SKILLS_DIRS; cleanup(root); }
});

test('AC4: infra-* skills (now real entries under root skills/, post-pisd-s1) resolve correctly, no regression', function() {
  var root = mkTempRoot();
  try {
    delete process.env.COPILOT_SKILLS_DIRS;
    makeSkill(root, 'skills', 'infra-definition');
    makeSkill(root, 'skills', 'infra-plan');
    makeSkill(root, 'skills', 'infra-review');
    makeSkill(root, 'skills', 'benefit-metric');
    var result = listAvailableSkills(root);
    var names = result.map(function(r) { return r.name; }).sort();
    assert.deepStrictEqual(names, ['benefit-metric', 'infra-definition', 'infra-plan', 'infra-review'], 'infra-* skills must resolve alongside every other real skill, all from the same root skills/ directory');
  } finally { delete process.env.COPILOT_SKILLS_DIRS; cleanup(root); }
});

console.log('\nAC5 -- fresh consumer repo (post-/bootstrap, no root skills/) behaviour is completely unchanged');

test('AC5: no root skills/ (fresh consumer repo) -> falls back to .github/skills/ exactly as before', function() {
  var root = mkTempRoot();
  try {
    delete process.env.COPILOT_SKILLS_DIRS;
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    var result = listAvailableSkills(root);
    var names = result.map(function(r) { return r.name; });
    assert.deepStrictEqual(names, ['discovery'], 'consumer-repo bootstrap contract (skills only at .github/skills/) must resolve unchanged when root skills/ is absent');
  } finally { delete process.env.COPILOT_SKILLS_DIRS; cleanup(root); }
});

test('AC5: explicit COPILOT_SKILLS_DIRS override still always wins, even when root skills/ exists', function() {
  var root = mkTempRoot();
  try {
    makeSkill(root, 'skills', 'should-be-ignored-by-override');
    var customDir = path.join(root, 'custom-skills');
    fs.mkdirSync(path.join(customDir, 'custom-skill'), { recursive: true });
    fs.writeFileSync(path.join(customDir, 'custom-skill', 'SKILL.md'), '# custom', 'utf8');
    process.env.COPILOT_SKILLS_DIRS = customDir;
    var result = listAvailableSkills(root);
    var names = result.map(function(r) { return r.name; });
    assert.deepStrictEqual(names, ['custom-skill'], 'an explicit override must still win over both root skills/ and .github/skills/');
  } finally { delete process.env.COPILOT_SKILLS_DIRS; cleanup(root); }
});

console.log('\n[csdg-s1] ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

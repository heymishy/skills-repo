# Implementation Plan: wuce.11 — SKILL.md discovery and skill routing

**Branch:** feat/wuce.11-skill-discovery
**Worktree:** .worktrees/wuce.11-skill-discovery
**Test file:** tests/skill-discovery.test.js (18 tests)
**Test run:** node tests/skill-discovery.test.js

---

## File touchpoints

| File | Action |
|------|--------|
| `src/adapters/skill-discovery.js` | CREATE |
| `tests/skill-discovery.test.js` | CREATE |
| `package.json` | EXTEND — add `&& node tests/skill-discovery.test.js` at end of test chain |

Note: test fixtures are created programmatically inside each test using `fs.mkdtempSync` — NO committed fixture files needed.

---

## Task 1 — Create `src/adapters/skill-discovery.js`

**File:** `src/adapters/skill-discovery.js`

```js
'use strict';
const fs   = require('fs');
const path = require('path');

const SKILL_NAME_RE = /^[a-z0-9-]+$/;

let _logger = { warn: function(msg) { process.stderr.write('[skill-discovery] ' + msg + '\n'); } };

function setLogger(logger) { _logger = logger; }

/**
 * listAvailableSkills(repoPath) -> [{name, path}]
 *
 * Scans the skills directory for subdirectories containing a SKILL.md file.
 * Default skills dir: <repoPath>/.github/skills/
 * Override: COPILOT_SKILLS_DIRS env var
 *
 * Returns an empty array (not an error) when the directory is missing or empty.
 * Only includes directories whose names match [a-z0-9-].
 * Returned paths are relative to repoPath (e.g. ".github/skills/discovery").
 */
function listAvailableSkills(repoPath) {
  var skillsDirRel = process.env.COPILOT_SKILLS_DIRS || path.join('.github', 'skills');
  var skillsDir = path.isAbsolute(skillsDirRel)
    ? skillsDirRel
    : path.join(repoPath, skillsDirRel);

  if (!fs.existsSync(skillsDir)) {
    _logger.warn('skills directory not found: ' + skillsDir);
    return [];
  }

  var entries;
  try {
    entries = fs.readdirSync(skillsDir);
  } catch (e) {
    _logger.warn('could not read skills directory: ' + e.message);
    return [];
  }

  if (entries.length === 0) {
    _logger.warn('skills directory is empty: ' + skillsDir);
    return [];
  }

  var results = [];
  for (var i = 0; i < entries.length; i++) {
    var name = entries[i];
    if (!SKILL_NAME_RE.test(name)) {
      _logger.warn('skill name does not match [a-z0-9-], excluded: ' + name);
      continue;
    }
    var skillPath = path.join(skillsDir, name);
    var stat;
    try { stat = fs.statSync(skillPath); } catch (e) { continue; }
    if (!stat.isDirectory()) { continue; }
    var skillMdPath = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) { continue; }
    // Return path relative to repoPath
    var relPath = path.relative(repoPath, skillPath);
    results.push({ name: name, path: relPath });
  }
  return results;
}

/**
 * validateSkillName(name, discoveredList) -> boolean
 *
 * Returns true only if name exists in the discovered skills list.
 * Name must also match [a-z0-9-] pattern.
 */
function validateSkillName(name, discoveredList) {
  if (!SKILL_NAME_RE.test(name)) { return false; }
  for (var i = 0; i < discoveredList.length; i++) {
    if (discoveredList[i].name === name) { return true; }
  }
  return false;
}

module.exports = { listAvailableSkills, validateSkillName, setLogger };
```

---

## Task 2 — Create `tests/skill-discovery.test.js`

**Pattern:** Custom Node.js test runner (same as all existing check-wuce*.js files).
Uses real filesystem with `fs.mkdtempSync` for temporary fixtures. No mocking of `fs`.

```js
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

// ── T1 — listAvailableSkills basic discovery (AC1) ────────────────────────────
console.log('\nT1 \u2014 listAvailableSkills basic discovery (AC1)');

test('T1.1 \u2014 returns one entry per dir containing SKILL.md', () => {
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

test('T1.2 \u2014 path field is relative to repo root (not absolute)', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    const result = listAvailableSkills(root);
    assert.strictEqual(result.length, 1);
    assert.ok(!path.isAbsolute(result[0].path), 'path should be relative');
    assert.ok(result[0].path.includes('discovery'), 'path should include skill name');
  } finally { cleanup(root); }
});

test('T1.3 \u2014 name field matches directory name exactly', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'definition-of-ready');
    const result = listAvailableSkills(root);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'definition-of-ready');
  } finally { cleanup(root); }
});

// ── T2 — COPILOT_SKILLS_DIRS override (AC2) ───────────────────────────────────
console.log('\nT2 \u2014 COPILOT_SKILLS_DIRS env var override (AC2)');

test('T2.1 \u2014 custom COPILOT_SKILLS_DIRS overrides default', () => {
  const root = mkTempRoot();
  try {
    // Custom path
    const customDir = path.join(root, 'custom-skills');
    fs.mkdirSync(path.join(customDir, 'discovery'), { recursive: true });
    fs.writeFileSync(path.join(customDir, 'discovery', 'SKILL.md'), '# discovery', 'utf8');
    // Default path (should NOT be scanned)
    makeSkill(root, path.join('.github', 'skills'), 'review');
    process.env.COPILOT_SKILLS_DIRS = customDir;
    const result = listAvailableSkills(root);
    delete process.env.COPILOT_SKILLS_DIRS;
    const names = result.map(r => r.name);
    assert.ok(names.includes('discovery'), 'should find discovery from custom dir');
    assert.ok(!names.includes('review'), 'should NOT find review from default dir');
  } finally { delete process.env.COPILOT_SKILLS_DIRS; cleanup(root); }
});

test('T2.2 \u2014 default .github/skills used when env var unset', () => {
  const root = mkTempRoot();
  try {
    delete process.env.COPILOT_SKILLS_DIRS;
    makeSkill(root, path.join('.github', 'skills'), 'review');
    const result = listAvailableSkills(root);
    assert.ok(result.map(r => r.name).includes('review'), 'should find review from default dir');
  } finally { delete process.env.COPILOT_SKILLS_DIRS; cleanup(root); }
});

// ── T3 — Subdirs without SKILL.md excluded (AC3) ─────────────────────────────
console.log('\nT3 \u2014 Subdirs without SKILL.md excluded (AC3)');

test('T3.1 \u2014 empty subdir not included', () => {
  const root = mkTempRoot();
  try {
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    // Empty dir (no SKILL.md)
    fs.mkdirSync(path.join(root, '.github', 'skills', 'draft-wip'), { recursive: true });
    const result = listAvailableSkills(root);
    const names = result.map(r => r.name);
    assert.ok(names.includes('discovery'), 'discovery should be included');
    assert.ok(!names.includes('draft-wip'), 'draft-wip should be excluded (no SKILL.md)');
  } finally { cleanup(root); }
});

test('T3.2 \u2014 subdir with non-SKILL.md files not included', () => {
  const root = mkTempRoot();
  try {
    const assetsDir = path.join(root, '.github', 'skills', 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, 'logo.png'), 'fake png', 'utf8');
    const result = listAvailableSkills(root);
    assert.ok(!result.map(r => r.name).includes('assets'), 'assets dir without SKILL.md excluded');
  } finally { cleanup(root); }
});

// ── T4 — Missing or empty directory (AC4) ────────────────────────────────────
console.log('\nT4 \u2014 Missing or empty directory (AC4)');

test('T4.1 \u2014 missing skills dir returns empty array without throwing', () => {
  const root = mkTempRoot();
  try {
    // No .github/skills/ dir created
    let result;
    assert.doesNotThrow(() => { result = listAvailableSkills(root); });
    assert.deepStrictEqual(result, []);
  } finally { cleanup(root); }
});

test('T4.2 \u2014 empty skills dir returns empty array', () => {
  const root = mkTempRoot();
  try {
    fs.mkdirSync(path.join(root, '.github', 'skills'), { recursive: true });
    const result = listAvailableSkills(root);
    assert.deepStrictEqual(result, []);
  } finally { cleanup(root); }
});

test('T4.3 \u2014 missing dir logs a warning', () => {
  const root = mkTempRoot();
  try {
    let warnCalled = false;
    let warnMsg = '';
    setLogger({ warn: function(msg) { warnCalled = true; warnMsg = msg; } });
    listAvailableSkills(root);
    setLogger({ warn: function(msg) { process.stderr.write('[skill-discovery] ' + msg + '\n'); } });
    assert.ok(warnCalled, 'warn should be called for missing dir');
  } finally { cleanup(root); }
});

// ── T5 — Allowlist completeness and path bounds (AC5) ────────────────────────
console.log('\nT5 \u2014 Allowlist completeness and path bounds (AC5)');

test('T5.1 \u2014 returned list contains all discovered skills', () => {
  const root = mkTempRoot();
  try {
    const skillNames = ['discovery', 'review', 'test-plan', 'definition', 'trace'];
    skillNames.forEach(n => makeSkill(root, path.join('.github', 'skills'), n));
    const result = listAvailableSkills(root);
    assert.strictEqual(result.length, 5, 'should return all 5 skills');
  } finally { cleanup(root); }
});

test('T5.2 \u2014 no entry path resolves outside skills directory', () => {
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

test('T5.3 \u2014 validateSkillName returns false for name not in discovered list', () => {
  const discovered = [{ name: 'discovery', path: '.github/skills/discovery' }, { name: 'review', path: '.github/skills/review' }];
  assert.strictEqual(validateSkillName('unknown-skill', discovered), false);
});

test('T5.4 \u2014 validateSkillName returns true for name in discovered list', () => {
  const discovered = [{ name: 'discovery', path: '.github/skills/discovery' }, { name: 'review', path: '.github/skills/review' }];
  assert.strictEqual(validateSkillName('discovery', discovered), true);
});

// ── Integration tests ─────────────────────────────────────────────────────────
console.log('\nIntegration tests');

test('IT1 \u2014 listAvailableSkills returns skill list (AC1, AC2)', () => {
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

test('IT2 \u2014 missing skills dir returns empty array (AC4)', () => {
  const root = mkTempRoot();
  try {
    const result = listAvailableSkills(root);
    assert.deepStrictEqual(result, [], 'missing dir should return empty array');
  } finally { cleanup(root); }
});

// ── NFR tests ─────────────────────────────────────────────────────────────────
console.log('\nNFR tests');

test('NFR1 \u2014 skill name with invalid chars excluded from results', () => {
  const root = mkTempRoot();
  try {
    // Create a dir with invalid name (contains !)
    const invalidDir = path.join(root, '.github', 'skills', 'discovery!');
    fs.mkdirSync(invalidDir, { recursive: true });
    fs.writeFileSync(path.join(invalidDir, 'SKILL.md'), '# bad', 'utf8');
    makeSkill(root, path.join('.github', 'skills'), 'discovery');
    const result = listAvailableSkills(root);
    const names = result.map(r => r.name);
    assert.ok(!names.includes('discovery!'), 'invalid name discovery! should be excluded');
    assert.ok(names.includes('discovery'), 'valid name discovery should be included');
  } finally { cleanup(root); }
});

test('NFR2 \u2014 discovery completes under 200ms for 50 skills', () => {
  const root = mkTempRoot();
  try {
    for (var i = 0; i < 50; i++) {
      makeSkill(root, path.join('.github', 'skills'), 'skill-' + i);
    }
    const start = Date.now();
    const result = listAvailableSkills(root);
    const elapsed = Date.now() - start;
    assert.strictEqual(result.length, 50, 'should find all 50 skills');
    assert.ok(elapsed < 200, 'discovery should complete under 200ms, took: ' + elapsed + 'ms');
  } finally { cleanup(root); }
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n[wuce11-skill-discovery] ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  failures.forEach(f => console.log('  FAIL: ' + f.name + ': ' + f.err.message));
  process.exit(1);
}
```

---

## Task 3 — Update package.json test chain

Add to the end of the `scripts.test` value in `package.json`:
```
 && node tests/skill-discovery.test.js
```

**Important:** Always base the update off `origin/master`:
```
node -e "const fs=require('fs'),{execSync}=require('child_process');const pkg=JSON.parse(execSync('git show origin/master:package.json').toString());pkg.scripts.test+=' && node tests/skill-discovery.test.js';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2),'utf8')"
```

---

## Task 4 — Commit and push

```bash
cd .worktrees/wuce.11-skill-discovery
git add src/adapters/skill-discovery.js tests/skill-discovery.test.js package.json
git commit -m "feat: wuce.11 -- SKILL.md discovery and skill routing"
git push -u origin feat/wuce.11-skill-discovery
```

---

## Task 5 — Open draft PR

```bash
gh pr create \
  --title "feat: wuce.11 — SKILL.md discovery and skill routing" \
  --body "## Summary

Implements wuce.11: SKILL.md discovery adapter that scans a skills directory for subdirectories containing SKILL.md files and returns a validated allowlist.

## Files changed
- \`src/adapters/skill-discovery.js\` — \`listAvailableSkills(repoPath)\` adapter (ADR-012)
- \`tests/skill-discovery.test.js\` — 18 tests (14 unit, 2 integration, 2 NFR)
- \`package.json\` — test chain extended

## Artefact
artefacts/2026-05-02-web-ui-copilot-execution-layer/plans/wuce.11-skill-discovery-plan.md

## Oversight comment
This PR: skill name regex \`[a-z0-9-]\` validated in \`listAvailableSkills\` (excludes names with spaces, punctuation, uppercase). The returned list is the authoritative allowlist for wuce.9 subprocess invocations — skill names not in this list will be rejected by \`validateSkillName\` before any spawn." \
  --draft \
  --base master \
  --head feat/wuce.11-skill-discovery
```

---

## Verification

Run from worktree root:
```bash
node tests/skill-discovery.test.js
```
Expected: 18 passed, 0 failed

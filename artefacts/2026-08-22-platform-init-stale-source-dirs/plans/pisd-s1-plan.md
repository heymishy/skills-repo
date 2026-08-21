# Point platform-init.js at the real skills/ and templates/ source directories — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Correct `scripts/platform-init.js`'s `COPY_DIRS` source paths so `/bootstrap` installs the real, current skill and template set (49 entries combined) instead of a stale 6-entry subset, and relocate the 6 misplaced files AC5's investigation found so the fix needs no special-case merge logic.
**Branch:** `feature/pisd-s1`
**Worktree:** `.worktrees/pisd-s1`
**Test command:** `node scripts/run-all-tests.js` (glob-discovers `tests/check-*.js`; individual files can be run directly with `node tests/check-<name>.js`)

---

## File map

```
Create:
  tests/check-pisd-s1-platform-init-source-dirs.js  — unit + integration tests for AC1, AC2, AC3

Modify:
  scripts/platform-init.js  — COPY_DIRS src paths corrected from .github/skills / .github/templates to skills / templates

Move (git mv, no content change):
  .github/skills/infra-definition/SKILL.md          → skills/infra-definition/SKILL.md
  .github/skills/infra-plan/SKILL.md                → skills/infra-plan/SKILL.md
  .github/skills/infra-review/SKILL.md              → skills/infra-review/SKILL.md
  .github/skills/schema-migration-plan/SKILL.md     → skills/schema-migration-plan/SKILL.md
  .github/skills/schema-migration-review/SKILL.md   → skills/schema-migration-review/SKILL.md
  .github/templates/staging-data-policy.md          → templates/staging-data-policy.md
```

---

## Task 1: Write failing tests for AC1 (COPY_DIRS source paths) and AC2/AC3 (full skill/template copy)

**Files:**
- Create: `tests/check-pisd-s1-platform-init-source-dirs.js`
- Test: (this file IS the test — no separate test-of-test needed)

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
// check-pisd-s1-platform-init-source-dirs.js
// AC verification for pisd-s1 (AC1, AC2, AC3, AC6's regression check).
// AC4 is covered by re-running the existing, unmodified check-i1.2-platform-init-fetch.js.
// AC5 is a documented investigation, not an automated test — see decisions.md.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function mktmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pisd-s1-test-'));
}

function rmtmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

function runInit(targetDir, args) {
  const script = path.join(root, 'scripts', 'platform-init.js');
  return execFileSync(process.execPath, [script, targetDir, ...(args || [])], {
    encoding: 'utf8',
    env: { ...process.env, PLATFORM_ROOT: root }
  });
}

// ── AC1: COPY_DIRS src paths point at repo-root skills/ and templates/ ────────

test('AC1: platform-init.js sources skills COPY_DIR from repo-root skills/, not .github/skills/', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'platform-init.js'), 'utf8');
  assert.ok(
    /src:\s*path\.join\(sourceRoot,\s*'skills'\)/.test(source),
    'Expected a COPY_DIRS entry with src: path.join(sourceRoot, \'skills\')'
  );
  assert.ok(
    !/src:\s*path\.join\(sourceRoot,\s*'\.github',\s*'skills'\)/.test(source),
    'Did not expect src: path.join(sourceRoot, \'.github\', \'skills\') to remain'
  );
});

test('AC1: platform-init.js sources templates COPY_DIR from repo-root templates/, not .github/templates/', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'platform-init.js'), 'utf8');
  assert.ok(
    /src:\s*path\.join\(sourceRoot,\s*'templates'\)/.test(source),
    'Expected a COPY_DIRS entry with src: path.join(sourceRoot, \'templates\')'
  );
  assert.ok(
    !/src:\s*path\.join\(sourceRoot,\s*'\.github',\s*'templates'\)/.test(source),
    'Did not expect src: path.join(sourceRoot, \'.github\', \'templates\') to remain'
  );
});

// ── AC2: full skill set installed ──────────────────────────────────────────────

test('AC2: runInit against a fresh target copies every skill from this repo\'s root skills/', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installed = fs.readdirSync(path.join(tmp, '.github', 'skills'));
    const real = fs.readdirSync(path.join(root, 'skills'));
    assert.ok(installed.includes('orient'), 'Expected orient to be installed');
    assert.ok(installed.includes('benefit-metric'), 'Expected benefit-metric to be installed');
    assert.ok(installed.includes('discovery'), 'Expected discovery to be installed');
    assert.strictEqual(installed.length, real.length,
      `Expected ${real.length} installed skills (matching live skills/), got ${installed.length}`);
  } finally { rmtmp(tmp); }
});

test('AC2 (integration): installed skills are independently loadable by skill-discovery.js', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    delete require.cache[require.resolve(path.join(root, 'src', 'adapters', 'skill-discovery.js'))];
    const { listAvailableSkills } = require(path.join(root, 'src', 'adapters', 'skill-discovery.js'));
    const found = listAvailableSkills(tmp);
    assert.ok(Array.isArray(found) && found.length > 0, 'Expected a non-empty skills array');
    assert.ok(found.some(s => s.name === 'benefit-metric'), 'Expected benefit-metric to be discoverable');
  } finally { rmtmp(tmp); }
});

// ── AC3: full template set installed ───────────────────────────────────────────

test('AC3: runInit against a fresh target copies every template from this repo\'s root templates/', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installed = fs.readdirSync(path.join(tmp, '.github', 'templates'));
    const real = fs.readdirSync(path.join(root, 'templates'));
    assert.ok(installed.includes('story.md'), 'Expected story.md to be installed');
    assert.ok(installed.includes('test-plan.md'), 'Expected test-plan.md to be installed');
    assert.strictEqual(installed.length, real.length,
      `Expected ${real.length} installed templates (matching live templates/), got ${installed.length}`);
  } finally { rmtmp(tmp); }
});

test('AC3 (integration): installed story.md matches this repo\'s own templates/story.md byte-for-byte', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installedContent = fs.readFileSync(path.join(tmp, '.github', 'templates', 'story.md'), 'utf8');
    const realContent = fs.readFileSync(path.join(root, 'templates', 'story.md'), 'utf8');
    assert.strictEqual(installedContent, realContent, 'Expected installed story.md to match the real template exactly');
  } finally { rmtmp(tmp); }
});

// ── AC5 spot check: the 6 relocated files are now part of the real skill/template set ──

test('AC5: infra-definition and schema-migration-plan skills are installed by platform-init.js', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installed = fs.readdirSync(path.join(tmp, '.github', 'skills'));
    assert.ok(installed.includes('infra-definition'), 'Expected infra-definition to be installed (relocated to skills/ per AC5)');
    assert.ok(installed.includes('schema-migration-plan'), 'Expected schema-migration-plan to be installed (relocated to skills/ per AC5)');
  } finally { rmtmp(tmp); }
});

test('AC5: staging-data-policy.md template is installed by platform-init.js', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installed = fs.readdirSync(path.join(tmp, '.github', 'templates'));
    assert.ok(installed.includes('staging-data-policy.md'), 'Expected staging-data-policy.md to be installed (relocated to templates/ per AC5)');
  } finally { rmtmp(tmp); }
});

console.log(`\n[pisd-s1] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pisd-s1-platform-init-source-dirs.js
```

Expected output: multiple `✖` lines — AC1's two tests fail because `COPY_DIRS` still has `src: path.join(sourceRoot, '.github', 'skills')` / `'.github', 'templates'`; AC2/AC3/AC5's tests fail because the installed skill/template counts and names (`orient`, `infra-definition`, etc.) don't match. Final line: `[pisd-s1] Results: 0 passed, 8 failed` (or similar — some may coincidentally pass, e.g. if a count happens to match by chance, but the specific-name assertions for `orient`/`benefit-metric`/`infra-definition` will fail).

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/check-pisd-s1-platform-init-source-dirs.js
git commit -m "test: add failing tests for pisd-s1 AC1/AC2/AC3/AC5 (platform-init source dirs)"
```

---

## Task 2: Fix platform-init.js's COPY_DIRS source paths (AC1)

**Files:**
- Modify: `scripts/platform-init.js`

- [ ] **Step 1: Make the fix**

In `scripts/platform-init.js`, find:

```javascript
const COPY_DIRS = [
  { src: path.join(sourceRoot, '.github', 'skills'), dest: path.join(targetDir, '.github', 'skills') },
  { src: path.join(sourceRoot, '.github', 'templates'), dest: path.join(targetDir, '.github', 'templates') },
  { src: path.join(sourceRoot, 'scripts'), dest: path.join(targetDir, 'scripts') }
];
```

Replace with:

```javascript
// pisd-s1: sourceRoot/skills and sourceRoot/templates are this platform's
// real, current source of truth (moved there in commit 1b1d0682) --
// sourceRoot/.github/skills and sourceRoot/.github/templates were only
// ever the bootstrap-install DESTINATION for consumer repos, never a
// source. dest paths are unchanged: a consumer repo still receives its
// install at .github/skills / .github/templates, matching the documented
// convention.
const COPY_DIRS = [
  { src: path.join(sourceRoot, 'skills'), dest: path.join(targetDir, '.github', 'skills') },
  { src: path.join(sourceRoot, 'templates'), dest: path.join(targetDir, '.github', 'templates') },
  { src: path.join(sourceRoot, 'scripts'), dest: path.join(targetDir, 'scripts') }
];
```

- [ ] **Step 2: Run the new test file — AC1's tests must now pass**

```bash
node tests/check-pisd-s1-platform-init-source-dirs.js
```

Expected output: AC1's two tests show `✔`. AC2/AC3/AC5's tests still `✖` until Task 3 moves the 6 misplaced files (the count assertions will still fail because `.github/skills/`'s 5 skills are no longer copied at all — a temporary state, resolved by Task 3).

- [ ] **Step 3: Commit**

```bash
git add scripts/platform-init.js
git commit -m "fix: source platform-init.js COPY_DIRS from repo-root skills/ and templates/"
```

---

## Task 3: Relocate the 6 misplaced files from .github/skills//.github/templates/ to skills//templates/ (AC5)

**Files:**
- Move: `.github/skills/infra-definition/SKILL.md` → `skills/infra-definition/SKILL.md`
- Move: `.github/skills/infra-plan/SKILL.md` → `skills/infra-plan/SKILL.md`
- Move: `.github/skills/infra-review/SKILL.md` → `skills/infra-review/SKILL.md`
- Move: `.github/skills/schema-migration-plan/SKILL.md` → `skills/schema-migration-plan/SKILL.md`
- Move: `.github/skills/schema-migration-review/SKILL.md` → `skills/schema-migration-review/SKILL.md`
- Move: `.github/templates/staging-data-policy.md` → `templates/staging-data-policy.md`

- [ ] **Step 1: Move the files (preserves git history via rename detection)**

```bash
git mv .github/skills/infra-definition skills/infra-definition
git mv .github/skills/infra-plan skills/infra-plan
git mv .github/skills/infra-review skills/infra-review
git mv .github/skills/schema-migration-plan skills/schema-migration-plan
git mv .github/skills/schema-migration-review skills/schema-migration-review
git mv .github/templates/staging-data-policy.md templates/staging-data-policy.md
```

- [ ] **Step 2: Run the new test file — AC2/AC3/AC5's tests must now pass**

```bash
node tests/check-pisd-s1-platform-init-source-dirs.js
```

Expected output: `[pisd-s1] Results: 8 passed, 0 failed`

- [ ] **Step 3: Commit**

```bash
git add .github/skills .github/templates skills/infra-definition skills/infra-plan skills/infra-review skills/schema-migration-plan skills/schema-migration-review templates/staging-data-policy.md
git commit -m "chore: relocate infra-*/schema-migration-*/staging-data-policy to skills/templates (AC5)"
```

---

## Task 4: Confirm AC4 (existing i1.2 tests pass unmodified) and AC6 (full suite regression check)

**Files:**
- None modified — verification only

- [ ] **Step 1: Run the existing i1.2 test file unmodified**

```bash
node tests/check-i1.2-platform-init-fetch.js
```

Expected output: last line reads `[i1.2-platform-init-fetch] Results: 20 passed, 0 failed`. In particular, `platform-init-reports-skipped-files` and `platform-init-force-flag-overwrites-existing` both show `✔`.

- [ ] **Step 2: Run the full suite**

```bash
node scripts/run-all-tests.js
```

Expected output: the "Failed files" list contains only `scripts/check-pipeline-state-integrity.js` (the 3 pre-existing, already-accepted C3 entries), plus — if not yet separately resolved — `tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-decision.js`, and `tests/check-wsm2-collaborative-sessions.js` (all three already logged as separate, independently-tracked findings unrelated to this story, per the branch-setup RISK-ACCEPT). `tests/check-i1.2-platform-init-fetch.js` must NOT appear in this list any more.

- [ ] **Step 3: If the full suite matches the expected baseline, this task needs no commit** — it is a verification-only task confirming no regression was introduced. Proceed to `/verify-completion`.

---

## Notes for the implementing agent

- Task 1's test file intentionally does not modify `tests/check-i1.2-platform-init-fetch.js` — AC4 requires that file to start passing unmodified once Tasks 2-3 land, not to be edited.
- Task 3's `git mv` preserves file history (git detects the rename) — do not delete-then-recreate the files, which would lose blame/history for `c7059896`, `4ce1e96c`, and `364592e3`.
- `.github/skills/` and `.github/templates/` will be empty directories after Task 3. Git does not track empty directories — no `.gitkeep` or similar is needed; this is expected and matches AC5's own decisions.md conclusion (their only real role is as the bootstrap-install *destination*, not a source, in this repo).

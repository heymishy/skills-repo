# `skills advance` CLI — Implementation Plan

**Goal:** Add `node bin/skills advance <feature-slug> <story-id> <field>=<value>...` CLI subcommand that writes pipeline-state.json atomically with typed exit codes.
**Branch:** `feature/cdg.3`
**Worktree:** `.worktrees/cdg.3`
**Test command:** `npm test` (or `node tests/check-cdg3-advance-cli.js` to run the story tests only)
**Oversight level:** Medium — platform maintainer reviews PR before merge

---

## File map

```
Create:
  src/enforcement/cli-advance.js            — advance handler: validate args, read state, write atomically
  tests/check-cdg3-advance-cli.js           — 9 TDD tests (T1–T7, IT1) — RED until Task 2 complete

Modify:
  bin/skills                                — add `advance` subcommand routing (keep `validate` unchanged)
  package.json                              — append && node tests/check-cdg3-advance-cli.js to test chain
```

---

## Design rationale (read before coding)

`cli-advance.js` implements its own inline read-validate-write rather than delegating to `pipelineStateWriterFactory` because:

1. The factory's `storyLevelKeys` does not include `reviewStatus`, so AC6 (multi-field write with `reviewStatus=passed`) would silently drop that field.
2. The factory creates a new feature entry when the slug is not found — violating AC2's requirement that the file is NOT modified on unknown feature slug.

`cli-advance.js` is itself a `require()`-able module called from `bin/skills` — this satisfies ADR-H7.1's "no subprocess spawning" intent. The module pattern mirrors `cli-outer-loop.js`: pure function, returns `{ exitCode, stdout, stderr }`, no `process.exit()`.

---

## Task 0: Write failing tests — TDD red state

**Files:**
- Create: `tests/check-cdg3-advance-cli.js`

All 9 tests in this file will FAIL immediately (the module being tested doesn't exist yet). Write the entire file first. The tests exercise the `advance()` module directly (T1–T6, IT1) plus validate regression (T7).

**Step 1: Create the test file**

```js
#!/usr/bin/env node
// check-cdg3-advance-cli.js — TDD tests for cdg.3 (skills advance CLI)
// Tests: T1, T2, T3, T4a, T4b, T5, T6, T7, IT1
// All tests FAIL until src/enforcement/cli-advance.js and bin/skills advance are implemented.
'use strict';

const fs    = require('fs');
const path  = require('path');
const child = require('child_process');

const ROOT       = path.join(__dirname, '..');
const MODULE     = path.join(ROOT, 'src', 'enforcement', 'cli-advance.js');
const BIN_SKILLS = path.join(ROOT, 'bin', 'skills');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(MODULE)) return null;
  try {
    delete require.cache[require.resolve(MODULE)];
    return require(MODULE);
  } catch (_) { return null; }
}

// ── Shared fixture helpers ────────────────────────────────────────────────────

function makeTmpDir(suffix) {
  return fs.mkdtempSync(path.join(ROOT, `.tmp-test-cdg3-${suffix}-`));
}

function writeFixture(tmpDir, features) {
  const ghDir = path.join(tmpDir, '.github');
  fs.mkdirSync(ghDir, { recursive: true });
  const state = { schemaVersion: '1', features: features };
  fs.writeFileSync(path.join(ghDir, 'pipeline-state.json'), JSON.stringify(state, null, 2) + '\n', 'utf8');
  return path.join(ghDir, 'pipeline-state.json');
}

function readFixture(tmpDir) {
  return JSON.parse(fs.readFileSync(path.join(tmpDir, '.github', 'pipeline-state.json'), 'utf8'));
}

function makeFeature(slug, stories) {
  return { slug, id: slug, name: 'Test Feature', stories: stories };
}

function makeStory(id, extraFields) {
  return Object.assign({ id, slug: id, name: 'Test Story' }, extraFields);
}

// Base fixture used by most unit tests
const BASE_FEATURE_SLUG = 'test-feature-cdg3';
const BASE_STORY_ID     = 'test-story-cdg3';

// ── T1 — advances story dorStatus atomically on valid args ────────────────────
console.log('\n[cdg3-advance] T1 — AC1: valid advance writes dorStatus, exit 0, stdout confirmation');
{
  const tmpDir = makeTmpDir('t1');
  writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID, { dorStatus: 'not-started' })])
  ]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, BASE_STORY_ID, ['dorStatus=signed-off'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T1a: exitCode === 0 on valid advance');
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(s => s.id === BASE_STORY_ID || s.slug === BASE_STORY_ID);
  assert(story !== undefined && story.dorStatus === 'signed-off', 'T1b: dorStatus written to signed-off');
  assert(result !== null && typeof result.stdout === 'string' &&
         result.stdout.includes(BASE_FEATURE_SLUG) && result.stdout.includes(BASE_STORY_ID),
         'T1c: stdout contains feature slug and story id');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T2 — exits 8 when feature slug not in pipeline-state.json ────────────────
console.log('\n[cdg3-advance] T2 — AC2: unknown feature slug → exit 8, stderr, file unchanged');
{
  const tmpDir = makeTmpDir('t2');
  const statePath = writeFixture(tmpDir, [
    makeFeature('other-feature-cdg3', [makeStory('some-story')])
  ]);
  const before = fs.readFileSync(statePath, 'utf8');
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance('unknown-slug-cdg3', 'some-story', ['dorStatus=signed-off'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T2a: exitCode === 8 for unknown feature');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('unknown-slug-cdg3'),
         'T2b: stderr names the unknown feature slug');
  const after = fs.readFileSync(statePath, 'utf8');
  assert(before === after, 'T2c: pipeline-state.json not modified');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T3 — exits non-zero when enum field value is invalid ─────────────────────
console.log('\n[cdg3-advance] T3 — AC3: invalid enum value → non-zero exit, stderr names value, file unchanged');
{
  const tmpDir = makeTmpDir('t3');
  const statePath = writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID, { prStatus: 'none' })])
  ]);
  const before = fs.readFileSync(statePath, 'utf8');
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, BASE_STORY_ID, ['prStatus=invalid-value'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode !== 0, 'T3a: exitCode !== 0 for invalid enum');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('invalid-value'),
         'T3b: stderr contains the rejected value');
  const after = fs.readFileSync(statePath, 'utf8');
  assert(before === after, 'T3c: pipeline-state.json not modified');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T4a — exits 8 with zero positional arguments ─────────────────────────────
console.log('\n[cdg3-advance] T4a — AC4: zero args → exit 8, usage in stderr');
{
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(undefined, undefined, [], ROOT); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T4a-1: exitCode === 8 for zero args');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.toLowerCase().includes('usage'),
         'T4a-2: stderr contains usage instructions');
}

// ── T4b — exits 8 with feature-slug only (story-id + field missing) ──────────
console.log('\n[cdg3-advance] T4b — AC4: feature-slug only → exit 8, usage in stderr');
{
  const tmpDir = makeTmpDir('t4b');
  writeFixture(tmpDir, [makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID)])]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, undefined, [], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T4b-1: exitCode === 8 for feature-slug only');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.toLowerCase().includes('usage'),
         'T4b-2: stderr contains usage instructions');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T5 — exits 8 on malformed field argument (no = sign) ─────────────────────
console.log('\n[cdg3-advance] T5 — AC5: malformed field arg (no =) → exit 8, stderr names arg, file unchanged');
{
  const tmpDir = makeTmpDir('t5');
  const statePath = writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID)])
  ]);
  const before = fs.readFileSync(statePath, 'utf8');
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, BASE_STORY_ID, ['invalidarg'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T5a: exitCode === 8 for malformed arg');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('invalidarg'),
         'T5b: stderr names the malformed argument');
  const after = fs.readFileSync(statePath, 'utf8');
  assert(before === after, 'T5c: pipeline-state.json not modified');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T6 — writes multiple fields atomically ────────────────────────────────────
console.log('\n[cdg3-advance] T6 — AC6: multi-field write → both fields written, single atomic write, exit 0');
{
  const tmpDir = makeTmpDir('t6');
  writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID, { dorStatus: 'not-started', reviewStatus: 'not-started' })])
  ]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, BASE_STORY_ID, ['dorStatus=signed-off', 'reviewStatus=passed'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T6a: exitCode === 0 for multi-field write');
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(s => s.id === BASE_STORY_ID || s.slug === BASE_STORY_ID);
  assert(story !== undefined && story.dorStatus === 'signed-off', 'T6b: dorStatus written');
  assert(story !== undefined && story.reviewStatus === 'passed', 'T6c: reviewStatus written');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T7 — validate routing is unaffected ──────────────────────────────────────
console.log('\n[cdg3-advance] T7 — AC8: bin/skills validate routing unchanged after advance added');
{
  // Use an artefact that has no story references — validate should return exit 0
  const tmpArtefact = path.join(ROOT, '.tmp-test-cdg3-t7-artefact.md');
  fs.writeFileSync(tmpArtefact, '# Clean Artefact\n\nNo story references here.\n', 'utf8');
  let spawn = null;
  try {
    spawn = child.spawnSync('node', [BIN_SKILLS, 'validate', tmpArtefact, 'definition-of-ready'], {
      encoding: 'utf8', timeout: 5000
    });
  } catch (_) {}
  assert(spawn !== null && spawn.status === 0, 'T7a: validate exit 0 after advance added');
  fs.unlinkSync(tmpArtefact);
}

// ── IT1 — end-to-end round-trip with real temp fixture ───────────────────────
console.log('\n[cdg3-advance] IT1 — AC1+AC6: end-to-end round-trip with real temp fixture (no stubs)');
{
  const tmpDir = makeTmpDir('it1');
  writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID, { dorStatus: 'not-started', reviewStatus: 'not-started' })])
  ]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try {
      result = mod.advance(
        BASE_FEATURE_SLUG, BASE_STORY_ID,
        ['dorStatus=signed-off', 'reviewStatus=passed'],
        tmpDir
      );
    } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'IT1a: exit 0 for round-trip write');
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(s => s.id === BASE_STORY_ID || s.slug === BASE_STORY_ID);
  assert(story !== undefined && story.dorStatus === 'signed-off' && story.reviewStatus === 'passed',
         'IT1b: both fields written to disk in final state');
  // Verify file is valid JSON (parseable — already done by readFixture above, but verify no tmp leftover)
  const tmpPath = path.join(tmpDir, '.github', 'pipeline-state.json.tmp');
  assert(!fs.existsSync(tmpPath), 'IT1c: no leftover .tmp file after atomic write');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── Results ───────────────────────────────────────────────────────────────────
console.log(`\n=== check-cdg3-advance-cli results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
```

**Step 2: Run — all tests must FAIL (TDD red)**

```
node tests/check-cdg3-advance-cli.js
```

Expected: `check-cdg3-advance-cli results: 0 passed, 9 failed`

**Step 3: Commit red tests**

```
git add tests/check-cdg3-advance-cli.js
git commit -m "test(cdg.3): add failing tests for skills advance CLI — TDD red"
```

---

## Task 1: Create `src/enforcement/cli-advance.js` — advance handler module

**Files:**
- Create: `src/enforcement/cli-advance.js`

**Step 1: Write the module**

```js
// cli-advance.js — skills advance: CI-facing pipeline-state write with typed exit codes
// Returns { exitCode, stdout, stderr }. No process.exit(). No subprocess calls.
// Called via require() from bin/skills — satisfies ADR-H7.1.
'use strict';

const fs   = require('fs');
const path = require('path');

// Known enum fields and their valid values.
// Fields not listed here accept any string value.
const ENUM_FIELDS = {
  dorStatus:    ['not-started', 'in-progress', 'signed-off'],
  prStatus:     ['none', 'draft', 'open', 'merged'],
  reviewStatus: ['not-started', 'passed', 'has-findings'],
  health:       ['green', 'amber', 'red'],
};

const USAGE = 'Usage: skills advance <feature-slug> <story-id> <field>=<value>...';

/**
 * Advance pipeline-state.json fields for a given feature/story.
 *
 * @param {string}   featureSlug  — pipeline-state feature slug
 * @param {string}   storyId      — story id or slug
 * @param {string[]} rawFields    — array of "field=value" strings
 * @param {string}   repoRoot     — absolute path to repository root
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function advance(featureSlug, storyId, rawFields, repoRoot) {
  // ── Arg validation ────────────────────────────────────────────────────────
  if (!featureSlug || !storyId || !rawFields || rawFields.length === 0) {
    return { exitCode: 8, stdout: '', stderr: USAGE };
  }

  // ── Parse field=value pairs ───────────────────────────────────────────────
  const stateUpdate = {};
  for (const raw of rawFields) {
    const eqIdx = raw.indexOf('=');
    if (eqIdx === -1) {
      return {
        exitCode: 8, stdout: '',
        stderr: `Invalid argument '${raw}': expected field=value format. ${USAGE}`,
      };
    }
    const field = raw.slice(0, eqIdx);
    const value = raw.slice(eqIdx + 1);
    stateUpdate[field] = value;
  }

  // ── Enum validation ───────────────────────────────────────────────────────
  for (const [field, value] of Object.entries(stateUpdate)) {
    const allowed = ENUM_FIELDS[field];
    if (allowed !== undefined && !allowed.includes(value)) {
      return {
        exitCode: 8, stdout: '',
        stderr: `Invalid value '${value}' for field '${field}'. Allowed values: ${allowed.join(', ')}`,
      };
    }
  }

  // ── Path resolution + traversal guard ────────────────────────────────────
  const statePath = path.resolve(repoRoot, '.github', 'pipeline-state.json');
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  if (!statePath.startsWith(rootWithSep)) {
    return { exitCode: 8, stdout: '', stderr: 'Error: path resolves outside repository root (OWASP A01)' };
  }

  // ── Read current state ────────────────────────────────────────────────────
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (err) {
    return { exitCode: 8, stdout: '', stderr: `Failed to read pipeline-state.json: ${err.message}` };
  }
  if (!Array.isArray(state.features)) state.features = [];

  // ── Find feature — exit 8 if not found (do NOT create) ───────────────────
  const feature = state.features.find(function(f) {
    return f.slug === featureSlug || f.id === featureSlug;
  });
  if (!feature) {
    return {
      exitCode: 8, stdout: '',
      stderr: `Feature not found: '${featureSlug}'. Check pipeline-state.json.`,
    };
  }

  // ── Find or create story entry ────────────────────────────────────────────
  if (!Array.isArray(feature.stories)) feature.stories = [];
  var story = feature.stories.find(function(s) {
    return s.id === storyId || s.slug === storyId;
  });
  if (!story) {
    story = { id: storyId };
    feature.stories.push(story);
  }

  // ── Apply all fields ──────────────────────────────────────────────────────
  Object.keys(stateUpdate).forEach(function(key) {
    story[key] = stateUpdate[key];
  });

  // ── Atomic write (temp-file rename) ──────────────────────────────────────
  const tmpPath = statePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2) + '\n', 'utf8');
    fs.renameSync(tmpPath, statePath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
    return { exitCode: 8, stdout: '', stderr: `Failed to write pipeline-state.json: ${err.message}` };
  }

  const fieldsStr = Object.entries(stateUpdate).map(function(e) { return e[0] + '=' + e[1]; }).join(' ');
  return {
    exitCode: 0,
    stdout: `Advanced: ${featureSlug}/${storyId} — ${fieldsStr}`,
    stderr: '',
  };
}

module.exports = { advance };
```

**Step 2: Run tests — should now pass T1–T6, IT1 (7 tests). T7 still fails (bin/skills not yet wired)**

```
node tests/check-cdg3-advance-cli.js
```

Expected: `7 passed, 2 failed` (T7a and T7b fail — advance routing not in bin/skills yet)

**Step 3: Commit**

```
git add src/enforcement/cli-advance.js
git commit -m "feat(cdg.3): add cli-advance module — advance handler with typed exit codes"
```

---

## Task 2: Modify `bin/skills` — add advance subcommand routing

**Files:**
- Modify: `bin/skills`

**Current state of bin/skills (lines 1–28):**

```js
#!/usr/bin/env node
// bin/skills — CLI entry point for the skills platform
// Usage: node bin/skills validate <artefact-path> <gate-name>

'use strict';

const path = require('path');
const { validate } = require('../src/enforcement/cli-outer-loop');

const [, , subcommand, ...args] = process.argv;

if (subcommand === 'validate') {
  if (args.length < 2) {
    process.stderr.write('Usage: skills validate <artefact-path> <gate-name>\n');
    process.exit(1);
  }
  const [artefactPath, gateName] = args;
  const repoRoot = path.resolve(__dirname, '..');
  const result = validate(artefactPath, gateName, repoRoot);
  if (result.stdout) process.stdout.write(result.stdout + '\n');
  if (result.stderr) process.stderr.write(result.stderr + '\n');
  process.exit(result.exitCode);
} else {
  const cmd = subcommand || '(none)';
  process.stderr.write(`Unknown subcommand: '${cmd}'\nUsage: skills validate <artefact-path> <gate-name>\n`);
  process.exit(8);
}
```

**Step 1: Replace the else block to add advance routing**

Replace the entire `else { ... }` block at the end with:

```js
} else if (subcommand === 'advance') {
  const [featureSlug, storyId, ...rawFields] = args;
  const { advance } = require('../src/enforcement/cli-advance');
  const repoRoot = path.resolve(__dirname, '..');
  const result = advance(featureSlug, storyId, rawFields, repoRoot);
  if (result.stdout) process.stdout.write(result.stdout + '\n');
  if (result.stderr) process.stderr.write(result.stderr + '\n');
  process.exit(result.exitCode);
} else {
  const cmd = subcommand || '(none)';
  process.stderr.write(
    `Unknown subcommand: '${cmd}'\n` +
    `Usage:\n` +
    `  skills validate <artefact-path> <gate-name>\n` +
    `  skills advance <feature-slug> <story-id> <field>=<value>...\n`
  );
  process.exit(8);
}
```

**Step 2: Run tests — all 9 tests must now PASS**

```
node tests/check-cdg3-advance-cli.js
```

Expected: `check-cdg3-advance-cli results: 9 passed, 0 failed`

**Step 3: Run full suite — must stay green**

```
npm test
```

Expected: all prior tests pass + 9 new cdg3 tests pass. (Full suite count increases.)

**Step 4: Commit**

```
git add bin/skills
git commit -m "feat(cdg.3): route bin/skills advance to cli-advance module (AC8)"
```

---

## Task 3: Add to `package.json` test chain

**Files:**
- Modify: `package.json` (test script only)

**Step 1: Find the current test script value**

```
node -e "console.log(require('./package.json').scripts.test)"
```

**Step 2: Append the new test file**

The test chain in `package.json` currently ends with (for example):
`... && node tests/check-cli-governance.js`

Append:
`&& node tests/check-cdg3-advance-cli.js`

Use the safe one-liner pattern (never edit by hand — avoids merge conflicts):

```
node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync('package.json','utf8'));p.scripts.test+=' && node tests/check-cdg3-advance-cli.js';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n','utf8')"
```

**Step 3: Verify**

```
npm test
```

Expected output ends with:
```
=== check-cdg3-advance-cli results: 9 passed, 0 failed ===
```

Exit code: 0

**Step 4: Commit**

```
git add package.json
git commit -m "chore(cdg.3): add check-cdg3-advance-cli.js to npm test chain (AC7)"
```

---

## Task 4: Open draft PR

```
git push origin feature/cdg.3
```

Then open a draft PR from `feature/cdg.3` → `master`. Title: `feat(cdg.3): skills advance CLI — CI-facing state write with typed exit codes`. Do not mark ready for review. Do not merge.

---

## Self-review checklist

- [x] Exact file paths (no `[placeholder]` remaining)
- [x] Complete code in every Step 1 (no "add validation here")
- [x] Failing test step before every implementation step
- [x] Expected output for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond the ACs (no trace, no validate-before-advance, no web UI route)
- [x] Path traversal guard present in cli-advance.js (OWASP A01)
- [x] Default stub check: no injectable adapter introduced in this story — N/A (D37 exemption)
- [x] T7 confirms validate routing is unaffected (AC8)

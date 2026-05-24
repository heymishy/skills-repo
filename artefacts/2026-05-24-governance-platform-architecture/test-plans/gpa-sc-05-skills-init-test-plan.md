## Test Plan: Add `skills init` command for atomic feature initialisation

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-05-skills-init.md`
**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-01-governance-foundation.md`
**Test plan author:** Copilot
**Date:** 2026-05-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Valid slug → feature stub created with correct shape; atomic write (no .tmp left) | 5 tests (T1–T5) | 1 test (IT1) | — | — | — | 🟢 |
| AC2 | Duplicate slug → non-zero exit, error message, state unchanged | 2 tests (T6–T7) | 1 test (IT2) | — | — | — | 🟢 |
| AC3 | Invalid slug → non-zero exit, validation error, state unchanged (6 cases) | 6 tests (T8–T13) | — | — | — | — | 🟢 |
| AC4 | After init, check-pipeline-state-integrity.js reports 0 failures | 1 test (T14) | — | — | — | — | 🟢 |
| AC5 | `node bin/skills` without args or --help lists `init <slug> [--description "..."]` | 1 test (IT3) | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — each test creates a temp `pipeline-state.json` fixture inside the repo root (to satisfy the path-traversal guard), exercises the module, then restores the original.
**PCI/sensitivity in scope:** No.
**Availability:** Self-contained — tests generate and tear down their own state.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Temp pipeline-state.json with known features array | Synthetic — created in test setup | None | Must be inside ROOT to pass path-traversal guard |
| AC2 | Temp pipeline-state.json that already contains target slug | Synthetic — created in test setup | None | |
| AC3 | Invalid slug strings: 6 cases (space, slash, dotdot, underscore, leading hyphen, trailing hyphen) | Synthetic — string literals in test | None | No file write attempted — validation exits before read |
| AC4 | Real `.github/pipeline-state.json` (read-only) and temp copy after init | Synthetic — temp copy | None | Integrity check runs against temp copy |
| AC5 | `node bin/skills` invocation | Process spawn | None | reads bin/skills exit and stderr |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

These tests call `require('../src/enforcement/cli-init')` directly (or whichever module implements `init`), following the `cli-advance.js` pattern. The module must export `init(slug, description, repoRoot)` returning `{ exitCode, stdout, stderr }` and must not call `process.exit()`.

### T1 — module exports an `init` function

- **Verifies:** Module contract precondition
- **Precondition:** `src/enforcement/cli-init.js` does not exist (fails to require)
- **Action:** `require('../src/enforcement/cli-init')` and assert `typeof mod.init === 'function'`
- **Expected result:** Module loads, `init` is exported as a function
- **Edge case:** No

### T2 — valid slug → exit 0 and feature stub created with correct fields

- **Verifies:** AC1 (core happy path)
- **Precondition:** Temp pipeline-state.json inside ROOT with `{ features: [] }`
- **Action:** Call `init('2026-05-25-test-feature-sc05', undefined, ROOT_TMP)` where `ROOT_TMP` is a temp directory containing the fixture; assert return value and resulting JSON
- **Expected result:**
  - `exitCode === 0`
  - `stdout` contains `'2026-05-25-test-feature-sc05'`
  - Resulting `pipeline-state.json` contains a new feature with:
    - `slug === '2026-05-25-test-feature-sc05'`
    - `stage === 'discovery'`
    - `health === 'green'`
    - `Array.isArray(stories) && stories.length === 0`
    - `Array.isArray(metrics) && metrics.length === 0`
    - `updatedAt` matches today's date (ISO date prefix `YYYY-MM-DD`)
- **Edge case:** No

### T3 — valid slug with --description → name derived from description, not slug

- **Verifies:** AC1 (`--description` path)
- **Precondition:** Temp pipeline-state.json with `{ features: [] }`
- **Action:** Call `init('test-feature-sc05b', 'My Custom Feature Name', ROOT_TMP)`
- **Expected result:** `exitCode === 0`; feature in JSON has `name === 'My Custom Feature Name'`
- **Edge case:** No

### T4 — valid slug without description → name derived from slug (title-cased, hyphens → spaces)

- **Verifies:** AC1 (name derivation from slug)
- **Precondition:** Temp pipeline-state.json with `{ features: [] }`
- **Action:** Call `init('my-new-feature', undefined, ROOT_TMP)`
- **Expected result:** `exitCode === 0`; feature `name` is `'My New Feature'` (or equivalent title-case)
- **Edge case:** No

### T5 — atomic write: no .tmp file left on disk after successful init

- **Verifies:** AC1 (atomicity NFR)
- **Precondition:** Temp pipeline-state.json with `{ features: [] }`
- **Action:** Call `init('atomic-test-sc05', undefined, ROOT_TMP)`; after return, assert no file matching `pipeline-state.json.tmp` exists at the state file path
- **Expected result:** `exitCode === 0` and `fs.existsSync(statePath + '.tmp') === false`
- **Edge case:** No

### T6 — duplicate slug → exit non-zero

- **Verifies:** AC2 (duplicate rejection)
- **Precondition:** Temp pipeline-state.json containing a feature with `slug: 'existing-feature-sc05'`
- **Action:** Call `init('existing-feature-sc05', undefined, ROOT_TMP)`
- **Expected result:** `exitCode !== 0`
- **Edge case:** No

### T7 — duplicate slug → error message contains slug name, state unchanged

- **Verifies:** AC2 (error quality + no mutation)
- **Precondition:** Temp pipeline-state.json with one feature (`slug: 'existing-feature-sc05'`); record `features.length` before call
- **Action:** Call `init('existing-feature-sc05', undefined, ROOT_TMP)`; re-read JSON after return
- **Expected result:**
  - `stderr` contains the string `'existing-feature-sc05'`
  - `features.length` is unchanged (no new entry added)
- **Edge case:** No

### T8 — slug with space → exit non-zero, validation error

- **Verifies:** AC3 (invalid: space)
- **Precondition:** None (validation fires before file read)
- **Action:** Call `init('has space', undefined, ROOT)`
- **Expected result:** `exitCode !== 0`; `stderr` contains a validation/error message
- **Edge case:** No

### T9 — slug with `/` → exit non-zero, validation error

- **Verifies:** AC3 (invalid: forward slash)
- **Action:** Call `init('path/traversal', undefined, ROOT)`
- **Expected result:** `exitCode !== 0`; `stderr` contains validation/error message
- **Edge case:** No

### T10 — slug `..` → exit non-zero, validation error

- **Verifies:** AC3 (invalid: dotdot)
- **Action:** Call `init('..', undefined, ROOT)`
- **Expected result:** `exitCode !== 0`; `stderr` contains validation/error message
- **Edge case:** No

### T11 — slug with underscore → exit non-zero, validation error

- **Verifies:** AC3 (invalid: underscore)
- **Action:** Call `init('has_underscore', undefined, ROOT)`
- **Expected result:** `exitCode !== 0`; `stderr` contains validation/error message
- **Edge case:** No

### T12 — slug with leading hyphen → exit non-zero, validation error

- **Verifies:** AC3 (invalid: leading hyphen)
- **Action:** Call `init('-leading', undefined, ROOT)`
- **Expected result:** `exitCode !== 0`; `stderr` contains validation/error message
- **Edge case:** No

### T13 — slug with trailing hyphen → exit non-zero, validation error

- **Verifies:** AC3 (invalid: trailing hyphen)
- **Action:** Call `init('trailing-', undefined, ROOT)`
- **Expected result:** `exitCode !== 0`; `stderr` contains validation/error message
- **Edge case:** No

### T14 — after successful init, check-pipeline-state-integrity.js reports 0 failures for new feature

- **Verifies:** AC4
- **Precondition:** Temp directory under ROOT containing a copy of the real `pipeline-state.json`
- **Action:** Call `init('integrity-check-sc05-' + Date.now(), undefined, ROOT_TMP_COPY)` against the copy; then `require('../scripts/check-pipeline-state-integrity')` (or spawn `node scripts/check-pipeline-state-integrity.js`) against the temp state; capture failure count
- **Expected result:** `exitCode === 0` from init; integrity check reports 0 failures for the new feature slug
- **Edge case:** No
- **Note:** If `check-pipeline-state-integrity.js` does not export a function (i.e. it only uses `process.exit`), this test spawns the script against the temp state file and asserts exit 0 + `0 fail` in stdout.

---

## Integration Tests

### IT1 — `node bin/skills init <slug>` e2e spawn: valid slug exits 0

- **Verifies:** AC1 (via bin/skills entry point)
- **Components involved:** `bin/skills`, `src/enforcement/cli-init.js`
- **Precondition:** Temp directory with pipeline-state.json fixture, temp directory is inside ROOT
- **Action:** `child.spawnSync('node', [BIN_SKILLS, 'init', 'spawn-test-sc05'], { cwd: ROOT, encoding: 'utf8', timeout: 5000, env: { ...process.env, SKILLS_STATE_PATH: tmpStatePath } })` — or use `--state-path` flag if the module supports it; otherwise copy temp fixture to a well-known temp location and pass its path
- **Expected result:** `spawn.status === 0`; temp state file contains the new slug
- **Edge case:** No
- **Implementation note:** The integration test sets up the temp state outside the real `.github/` path to avoid mutating the real pipeline-state. The module must accept a `repoRoot` override or the test uses a temporary tree.

### IT2 — `node bin/skills init <existing-slug>` exits non-zero with error message

- **Verifies:** AC2 (via bin/skills entry point)
- **Components involved:** `bin/skills`, `src/enforcement/cli-init.js`
- **Precondition:** Temp state file containing `slug: 'spawn-dup-sc05'`
- **Action:** `child.spawnSync('node', [BIN_SKILLS, 'init', 'spawn-dup-sc05'], ...)` against temp state
- **Expected result:** `spawn.status !== 0`; `spawn.stderr` contains `'spawn-dup-sc05'`
- **Edge case:** No

### IT3 — `node bin/skills` without arguments lists `init` as supported subcommand

- **Verifies:** AC5
- **Components involved:** `bin/skills`
- **Precondition:** `bin/skills` exists
- **Action:** `child.spawnSync('node', [BIN_SKILLS], { encoding: 'utf8', timeout: 3000 })`
- **Expected result:** `spawn.status !== 0`; `spawn.stderr` contains `init <slug>` (substring match)
- **Edge case:** No

---

## NFR Tests

### NFR-T1 — no .tmp file left on disk after any exit path

- **NFR addressed:** Atomicity
- **Measurement method:** T5 above (success path). Additional: call `init` with a slug that triggers validation failure; assert `.tmp` does not exist.
- **Pass threshold:** 0 `.tmp` files remaining after any code path
- **Tool:** Node.js `fs.existsSync`

### NFR-T2 — no external npm dependencies introduced

- **NFR addressed:** Dependency constraints
- **Measurement method:** Read `src/enforcement/cli-init.js` (and any file it requires); assert no `require()` of a string that does not appear in Node.js built-in module list and does not start with `.` (i.e. no third-party package imports)
- **Pass threshold:** 0 external npm require calls
- **Tool:** `fs.readFileSync` + regex check `require\(['"](?![./])(?!fs|path|os|child_process|assert|util|stream)` returns 0 matches

### NFR-T3 — path traversal guard: output path must be inside repoRoot

- **NFR addressed:** Security (OWASP A01 path traversal)
- **Measurement method:** Call `init('../../etc/malicious', undefined, ROOT)`; assert non-zero exit and no file written outside ROOT
- **Pass threshold:** exit non-zero; no file created at `path.resolve(ROOT, '../../etc/')` 
- **Tool:** Node.js `fs.existsSync`

---

## Test file

**File to create:** `tests/check-gpa-sc05-skills-init.js`
**Test output prefix:** `[gpa-sc05]` — must use this prefix so assurance-gate.yml parses it correctly.
**Runner:** Node.js built-ins only (`fs`, `path`, `os`, `child_process`). No external npm dependencies.

### Skeleton

```js
// tests/check-gpa-sc05-skills-init.js
// Tests FAIL until src/enforcement/cli-init.js and bin/skills init are implemented.
// No external dependencies — Node.js built-ins only.
'use strict';
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const child = require('child_process');

const ROOT       = path.join(__dirname, '..');
const MODULE     = path.join(ROOT, 'src', 'enforcement', 'cli-init.js');
const BIN_SKILLS = path.join(ROOT, 'bin', 'skills');

let passed = 0, failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(MODULE)) return null;
  try {
    delete require.cache[require.resolve(MODULE)];
    return require(MODULE);
  } catch (_) { return null; }
}

// ── Fixture helpers ───────────────────────────────────────────────────────────
// Create a temp dir INSIDE ROOT so path-traversal guard passes.
// Returns { tmpDir, statePath, cleanup }.
function makeTempState(initialFeatures) {
  const tmpDir = fs.mkdtempSync(path.join(ROOT, '.tmp-sc05-'));
  const githubDir = path.join(tmpDir, '.github');
  fs.mkdirSync(githubDir, { recursive: true });
  const statePath = path.join(githubDir, 'pipeline-state.json');
  const state = { features: initialFeatures || [] };
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
  return {
    tmpDir,
    statePath,
    cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }),
  };
}

// T1 … T14 + IT1–IT3 + NFR-T1–NFR-T3 here

console.log(`\n[gpa-sc05] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

---

## Out of Scope for This Test Plan

- Testing `skills advance` with an unknown slug (existing behaviour — intentionally exits 8; not changed by this story).
- Testing that `skills init` creates artefact directories under `artefacts/` (out-of-scope per story — command writes only to pipeline-state.json).
- GUI or web UI integration.
- Testing behaviour when `pipeline-state.json` does not exist at all (implementation may choose to create it or error — not specified in ACs; behaviour undefined, no test written).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| IT1/IT2 require a way to point `bin/skills init` at a temp state file | `bin/skills` currently hard-codes `path.resolve(__dirname, '..')` as repoRoot; `cli-init.js` must accept `repoRoot` as a parameter to be testable without modifying real state | Implementation must follow `cli-advance.js` pattern: `init(slug, description, repoRoot)` where `repoRoot` is passed in from `bin/skills`; integration tests pass a temp root |
| T14 requires spawning or requiring `check-pipeline-state-integrity.js` | Script uses `process.exit` — requires spawn to capture exit code | Spawn with `timeout: 10000`; assert `spawn.status === 0` and stdout contains `0 fail` |
| NFR-T3 path traversal test for AC3 slug `../../etc/malicious` — slug validation should reject this before path resolution | The slug regex `^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$` already excludes `/` and `.`, so `../../etc/malicious` is rejected at validation stage | T10 (dotdot) and T9 (slash) cover both components; NFR-T3 redundantly verifies that even if slug validation were bypassed, the path guard fires |

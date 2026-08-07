# Bootstrap a minimal fresh repo with one init command — Implementation Plan

> **For agent execution:** Executed task-by-task with /tdd discipline in this session.

**Goal:** Make every test in `artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s1-test-plan.md` pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/rb-s1-minimal-fresh-repo-init`
**Worktree:** `.claude/worktrees/agent-a61259d94b9c60e55` (pre-existing isolated worktree from dispatch)
**Test command:** `node scripts/run-all-tests.js` (full suite); `node tests/check-rb-s1-cli-init.js` (new tests in isolation)

---

## File map

```
Create:
  cli/lib/init.js                 — resolvePlatformRoot() + runInit(): wraps scripts/platform-init.js
                                     via require(), then seeds context.yml + .github/pipeline-state.json
  cli/bin/init.js                 — thin npx-invoked entry point (shebang), parses `init <dir> [--force]`
  tests/check-rb-s1-cli-init.js   — unit + integration + NFR tests for the CLI wrapper (this story only;
                                     does not re-test platform-init.js's own existing copy/skip logic,
                                     which already has coverage from i1.2/i1.3)

Modify:
  package.json                    — add `bin` entry (cli/bin/init.js) and `files` field (npm packaging
                                     allowlist: cli/, scripts/, .github/skills/, .github/templates/,
                                     contexts/personal.yml)
```

**Not created/modified:** `scripts/platform-init.js` (wrapped as-is, zero behavioural change). No `git init` call anywhere in new code.

---

## Task 1: `resolvePlatformRoot()` — PLATFORM_ROOT resolves to bundled package files, not env var

**Verifies:** AC2

**Files:**
- Create: `cli/lib/init.js` (this task only adds `resolvePlatformRoot`)
- Test: `tests/check-rb-s1-cli-init.js` (`resolvesPlatformRootToBundledFiles_whenRunViaNpx`)

- [ ] **Step 1: Write the failing test**

```javascript
test('resolvesPlatformRootToBundledFiles_whenRunViaNpx', () => {
  const { resolvePlatformRoot } = require('../cli/lib/init');
  const simulatedCallerDir = path.join(ROOT, 'cli', 'bin'); // where cli/bin/init.js lives
  const result = resolvePlatformRoot(simulatedCallerDir);
  assert.strictEqual(result, ROOT,
    'resolvePlatformRoot should return the package root two levels up from cli/bin, ' +
    'ignoring any PLATFORM_ROOT env var or process.cwd()');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `Cannot find module '../cli/lib/init'` (module does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';
const fs = require('fs');
const path = require('path');

function resolvePlatformRoot(callerDir) {
  return path.resolve(callerDir, '..', '..');
}

module.exports = { resolvePlatformRoot };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `✔ resolvesPlatformRootToBundledFiles_whenRunViaNpx`

- [ ] **Step 5: Commit**

```bash
git add cli/lib/init.js tests/check-rb-s1-cli-init.js
git commit -m "feat(rb-s1): add PLATFORM_ROOT resolution for bundled package files"
```

---

## Task 2: `runInit()` wraps `platform-init.js` via `require()` + seeds `context.yml` and `pipeline-state.json`

**Verifies:** AC1, AC2, AC3

**Files:**
- Modify: `cli/lib/init.js`
- Test: `tests/check-rb-s1-cli-init.js` (`seedsContextYmlAndPipelineStateJson_onFreshInit`, `skipsExistingFilesOnSecondRun_reportsWhichWereSkipped`, `secondRunDoesNotReferenceUndefinedUpdateMechanism`, `rerunInitAfterFirstBootstrap_fileSystemStateUnchanged`)

- [ ] **Step 1: Write the failing tests** (see full test file in Task 4 — these four cases call `runInit` indirectly via the CLI binary once Task 3 exists; for this task, add a direct-call smoke test)

```javascript
test('seedsContextYmlAndPipelineStateJson_onFreshInit', () => {
  const tmp = mktmp();
  try {
    const { runInit } = require('../cli/lib/init');
    runInit(tmp, { platformRoot: ROOT });
    const contextPath = path.join(tmp, 'context.yml');
    const statePath = path.join(tmp, '.github', 'pipeline-state.json');
    assert.ok(fs.existsSync(contextPath), 'context.yml not seeded');
    assert.ok(fs.existsSync(statePath), '.github/pipeline-state.json not seeded');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    assert.strictEqual(state.version, '1');
    assert.ok(Array.isArray(state.features) && state.features.length === 0);
    assert.ok(Array.isArray(state.programmes));
  } finally { rmtmp(tmp); }
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `✖ seedsContextYmlAndPipelineStateJson_onFreshInit` — `runInit is not a function`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';
const fs = require('fs');
const path = require('path');

function resolvePlatformRoot(callerDir) {
  return path.resolve(callerDir, '..', '..');
}

function requirePlatformInit(resolvedTarget, platformRoot, force) {
  const scriptPath = require.resolve(path.join(platformRoot, 'scripts', 'platform-init.js'));
  const originalArgv = process.argv;
  const originalEnv = process.env.PLATFORM_ROOT;
  process.argv = [process.argv[0], scriptPath, resolvedTarget].concat(force ? ['--force'] : []);
  process.env.PLATFORM_ROOT = platformRoot;
  delete require.cache[scriptPath];
  try {
    require(scriptPath);
  } finally {
    process.argv = originalArgv;
    if (originalEnv === undefined) delete process.env.PLATFORM_ROOT;
    else process.env.PLATFORM_ROOT = originalEnv;
  }
}

function seedContextYml(resolvedTarget, platformRoot, force) {
  const dest = path.join(resolvedTarget, 'context.yml');
  if (!force && fs.existsSync(dest)) return 'skipped';
  const src = path.join(platformRoot, 'contexts', 'personal.yml');
  fs.copyFileSync(src, dest);
  return 'copied';
}

function seedPipelineState(resolvedTarget, force) {
  const dest = path.join(resolvedTarget, '.github', 'pipeline-state.json');
  if (!force && fs.existsSync(dest)) return 'skipped';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const seed = { version: '1', updated: new Date().toISOString(), programmes: [], features: [] };
  fs.writeFileSync(dest, JSON.stringify(seed, null, 2) + '\n', 'utf8');
  return 'copied';
}

function runInit(targetDir, opts) {
  opts = opts || {};
  const platformRoot = opts.platformRoot || resolvePlatformRoot(__dirname);
  const resolvedTarget = path.resolve(targetDir);
  const force = !!opts.force;

  requirePlatformInit(resolvedTarget, platformRoot, force);

  const contextResult = seedContextYml(resolvedTarget, platformRoot, force);
  const stateResult = seedPipelineState(resolvedTarget, force);

  const seeded = [];
  const skipped = [];
  if (contextResult === 'copied') seeded.push('context.yml'); else skipped.push('context.yml');
  if (stateResult === 'copied') seeded.push('.github/pipeline-state.json'); else skipped.push('.github/pipeline-state.json');

  if (seeded.length > 0) {
    console.log(`[skills-repo-init] Seeded ${seeded.length} additional file(s):`);
    for (const f of seeded) console.log(`  + ${f}`);
  }
  if (skipped.length > 0) {
    console.log(`[skills-repo-init] Skipped ${skipped.length} existing file(s) (run \`npm run platform:fetch\` to pull updates, or pass --force to overwrite):`);
    for (const f of skipped) console.log(`  ~ ${f}`);
  }
  console.log('[skills-repo-init] Done.');
}

module.exports = { resolvePlatformRoot, runInit };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `✔ seedsContextYmlAndPipelineStateJson_onFreshInit`

- [ ] **Step 5: Commit**

```bash
git add cli/lib/init.js tests/check-rb-s1-cli-init.js
git commit -m "feat(rb-s1): wrap platform-init.js via require and seed context.yml + pipeline-state.json"
```

---

## Task 3: `cli/bin/init.js` — npx-invoked entry point

**Verifies:** AC1, AC2 (real command-line invocation path)

**Files:**
- Create: `cli/bin/init.js`
- Test: `tests/check-rb-s1-cli-init.js` (`initCommand_wrapsPlatformInitJs_producesIdenticalOutputToDirectInvocation`, `rejectsWhenTargetDirIsAFileNotADirectory`)

- [ ] **Step 1: Write the failing test**

```javascript
test('rejectsWhenTargetDirIsAFileNotADirectory', () => {
  const tmp = mktmp();
  try {
    const notAFolder = path.join(tmp, 'not-a-folder.txt');
    fs.writeFileSync(notAFolder, '', 'utf8');
    let threw = false;
    let stderr = '';
    try {
      runCli(notAFolder);
    } catch (err) {
      threw = true;
      stderr = err.stderr || '';
    }
    assert.ok(threw, 'CLI should exit non-zero when target is a file');
    assert.ok(stderr.length > 0, 'stderr should explain the conflict');
  } finally { rmtmp(tmp); }
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `Cannot find module 'cli/bin/init.js'` or ENOENT spawning it

- [ ] **Step 3: Write minimal implementation**

```javascript
#!/usr/bin/env node
'use strict';
const path = require('path');
const { runInit } = require('../lib/init');

function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0];
  if (subcommand !== 'init') {
    process.stderr.write('[skills-repo] Usage: skills-repo init <target-dir> [--force]\n');
    process.exit(1);
  }
  const force = args.includes('--force');
  const positional = args.slice(1).filter(a => !a.startsWith('-'));
  const targetDir = positional[0] ? path.resolve(positional[0]) : process.cwd();
  runInit(targetDir, { force });
}

main();
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `✔ rejectsWhenTargetDirIsAFileNotADirectory`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 37 pre-existing failures as baseline (see `decisions.md` 2026-08-05 RISK-ACCEPT), zero new failures, `tests/check-rb-s1-cli-init.js` passing

- [ ] **Step 6: Commit**

```bash
git add cli/bin/init.js tests/check-rb-s1-cli-init.js
git commit -m "feat(rb-s1): add npx-invoked init CLI entry point"
```

---

## Task 4: `package.json` — `bin` + `files` fields for npm packaging

**Verifies:** AC1, AC2 (packaging correctness, no runtime deps)

**Files:**
- Modify: `package.json`
- Test: `tests/check-rb-s1-cli-init.js` (`initCompletesUnder30Seconds`, `noCredentialWrittenToAnyGeneratedFile`, plus package.json assertions folded into the integration test)

- [ ] **Step 1: Write the failing test**

```javascript
test('packageJson-declares-bin-and-files-for-npm-packaging', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(pkg.bin, 'package.json missing bin field');
  const binEntry = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0];
  assert.ok(binEntry.includes('cli/bin/init.js'), 'bin entry should point at cli/bin/init.js');
  assert.ok(Array.isArray(pkg.files), 'package.json missing files field');
  assert.ok(pkg.files.some(f => f.startsWith('cli')), 'files field should include cli/');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `✖ packageJson-declares-bin-and-files-for-npm-packaging` — `package.json missing bin field`

- [ ] **Step 3: Write minimal implementation**

Add to `package.json` (after `"private": true,`):

```json
"bin": {
  "skills-repo": "cli/bin/init.js"
},
"files": [
  "cli/",
  "scripts/",
  ".github/skills/",
  ".github/templates/",
  "contexts/personal.yml"
],
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `✔ packageJson-declares-bin-and-files-for-npm-packaging`

- [ ] **Step 5: Run full test file + full suite**

```bash
node tests/check-rb-s1-cli-init.js
node scripts/run-all-tests.js
```

Expected output: all 9 new tests passing; full suite shows same 37 pre-existing failures, zero new ones

- [ ] **Step 6: Commit**

```bash
git add package.json tests/check-rb-s1-cli-init.js
git commit -m "chore(rb-s1): add bin and files fields to package.json for npm packaging"
```

---

## Ambiguity flagged (not resolved by ACs or tests — reported in PR, not blocking)

Actually registering the scoped npm package name (`@heymishy/skills-repo`), flipping `private: true` off, and running a real `npm publish` are explicitly out of this test plan's scope ("Testing the npm publish/release pipeline itself... covered by DoR/DoD process checks, not a unit/integration test concern"). This plan adds the `bin`/`files` fields needed for the package to work correctly *if* published, but does not change `name`/`private` — that is a deliberate, separate human decision given the risk of accidentally making this whole private tooling repo publishable. Flagged as a PR comment per Coding Agent Instructions.

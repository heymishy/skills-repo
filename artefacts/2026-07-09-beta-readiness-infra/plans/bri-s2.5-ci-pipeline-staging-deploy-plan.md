# Build the CI pipeline — PR checks through staging deploy — Implementation Plan

<!--
  Produced by /implementation-plan. Consumed by /subagent-execution or /tdd.
  Save to: artefacts/2026-07-09-beta-readiness-infra/plans/bri-s2.5-ci-pipeline-staging-deploy-plan.md
-->

> **For agent execution:** Use /tdd per task (single session; no subagents available in this environment).

**Goal:** Make every test in `artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.5-ci-pipeline-staging-deploy-test-plan.md` pass — rewire the CI pipeline so every PR runs lint/typecheck/test/build, and every merge to this repo's trunk branch auto-deploys to `wuce-staging` (never `wuce-prod`) and auto-runs the S2.4 seed script, with a CI-native static check that no push-triggered workflow deploys to prod outside the S2.6 promote job.
**Branch:** `feature/bri-s2.5`
**Worktree:** `.worktrees/bri-s2.5`
**Test command:** `node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` (per-file); `node scripts/run-all-tests.js` (full suite, delta-check only per decisions.md 2026-07-11 RISK-ACCEPT baseline entry — 68 pre-existing failures unrelated to this story)

**Repo-fact corrections applied (see decisions.md 2026-07-11 entries for full rationale):**
- This repo's actual trunk/default branch is `master` (`.github/context.yml` `base_branch: master`; `git remote show origin` → `HEAD branch: master`). No `main` branch exists. All "push to main" language in the story/ACs/test plan is treated as generic trunk-based-development vocabulary and implemented against `master`.
- No lint/typecheck/build tooling exists in this repo today (no ESLint config, no `tsconfig.json`, no bundler). Minimal, dependency-free, genuinely-can-fail scripts are added — see Task 2.
- `.github/workflows/fly-deploy.yml` (the file the story text says is "replaced") is **not tracked in git anywhere** (`git log --all` on it is empty; absent from `git ls-files`) — it only exists as an untracked scratch file in the operator's main checkout. There is nothing to modify or delete; Task 5 below only *adds* new workflow files.

---

## File map

```
Create:
  tests/check-bri-s2.5-ci-pipeline-staging-deploy.js  — T1-T6, IT1 (all 7 automated tests from the test plan)
  scripts/ci-lint.js                                  — minimal dependency-free "lint" (Node syntax check)
  scripts/ci-typecheck.js                             — minimal dependency-free "typecheck" (require-load smoke check)
  scripts/ci-build.js                                 — minimal "build" (confirms server entrypoint loads + exports)
  scripts/check-no-prod-deploy-on-push.js             — AC4's CI-native static-analysis check (reusable by T5 and T6)
  .github/workflows/pr-checks.yml                     — PR-triggered lint/typecheck/test/build (AC1)
  .github/workflows/staging-deploy.yml                — push-to-master deploy to wuce-staging + auto seed (AC2, AC3)

Modify:
  package.json                                        — add "lint", "typecheck", "build" scripts

Delete:
  .github/workflows/fly-deploy.yml                    — replaced; today it deploys straight to wuce-prod/skills-framework on push, which this story's AC2/AC4 forbid
```

---

## Task 1: Write the failing test file (T1–T6, IT1)

**Files:**
- Create: `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js`

- [ ] **Step 1: Write the test file**

```javascript
'use strict';

/**
 * check-bri-s2.5-ci-pipeline-staging-deploy.js
 * Verifies AC1-AC4 of bri-s2.5 (T1-T6, IT1 from the story's test plan).
 *
 * Text/regex-based YAML assertions (no js-yaml dependency), consistent with
 * this repo's existing convention (see tests/check-dviz2-pages-workflow.js:
 * "js-yaml is not a listed dependency; structural YAML checks use
 * text-based assertions consistent with the no-external-deps ADR-001 rule").
 *
 * Run: node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js
 * Story: bri-s2.5  Feature: 2026-07-09-beta-readiness-infra
 *
 * Repo-fact note (see decisions.md 2026-07-11 ASSUMPTION entry): this repo's
 * actual trunk branch is `master`, not `main` as the story/ACs/test plan
 * text says -- all "push to main" checks below target `master`.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { findProdDeployViolations } = require('../scripts/check-no-prod-deploy-on-push');

const SUITE = '[check-bri-s2.5-ci-pipeline-staging-deploy]';

let passed = 0;
let failed = 0;

function pass(id, msg) {
  console.log('  ✔ ' + id + ' ' + msg);
  passed++;
}

function fail(id, msg) {
  console.error('  ✖ ' + id + ' ' + msg);
  failed++;
}

const repoRoot = path.resolve(__dirname, '..');
const workflowsDir = path.join(repoRoot, '.github', 'workflows');
const prChecksPath = path.join(workflowsDir, 'pr-checks.yml');
const stagingDeployPath = path.join(workflowsDir, 'staging-deploy.yml');

const prChecksContent = fs.existsSync(prChecksPath) ? fs.readFileSync(prChecksPath, 'utf8') : '';
const stagingDeployContent = fs.existsSync(stagingDeployPath) ? fs.readFileSync(stagingDeployPath, 'utf8') : '';

// ---------------------------------------------------------------------------
// T1 — a pull_request-triggered workflow includes lint, typecheck, npm test,
// and a build step (AC1)
// ---------------------------------------------------------------------------
(function t1() {
  if (!prChecksContent) {
    fail('T1', '.github/workflows/pr-checks.yml not found');
    return;
  }
  const isPrTriggered = /(^|\n)\s*pull_request:\s*(\n|$)/.test(prChecksContent);
  const hasLint = /npm run lint/.test(prChecksContent);
  const hasTypecheck = /npm run typecheck|\btsc\b/.test(prChecksContent);
  const hasTest = /npm test\b/.test(prChecksContent);
  const hasBuild = /npm run build/.test(prChecksContent);

  if (isPrTriggered && hasLint && hasTypecheck && hasTest && hasBuild) {
    pass('T1', 'pull_request-triggered workflow includes lint, typecheck, npm test, and build');
  } else {
    fail('T1', `missing coverage - pr_trigger=${isPrTriggered} lint=${hasLint} typecheck=${hasTypecheck} test=${hasTest} build=${hasBuild}`);
  }
})();

// ---------------------------------------------------------------------------
// T2 — none of the four checks has continue-on-error: true (AC1)
// ---------------------------------------------------------------------------
(function t2() {
  if (!prChecksContent) {
    fail('T2', '.github/workflows/pr-checks.yml not found');
    return;
  }
  const hasContinueOnError = /continue-on-error:\s*true/.test(prChecksContent);
  if (!hasContinueOnError) {
    pass('T2', 'no continue-on-error: true present on any PR-check step');
  } else {
    fail('T2', 'found continue-on-error: true in pr-checks.yml - a failing check would not block merge');
  }
})();

// ---------------------------------------------------------------------------
// T3 — the wuce-staging deploy job's trigger is push to master only, not
// also pull_request (AC1, AC2)
// ---------------------------------------------------------------------------
(function t3() {
  if (!stagingDeployContent) {
    fail('T3', '.github/workflows/staging-deploy.yml not found');
    return;
  }
  const hasPushMaster = /(^|\n)\s*push:\s*\n\s*branches:\s*\n?\s*-?\s*master/.test(stagingDeployContent)
    || /(^|\n)\s*push:\s*\n\s*branches:\s*\[\s*master\s*\]/.test(stagingDeployContent);
  const alsoHasPullRequest = /(^|\n)\s*pull_request:\s*(\n|$)/.test(stagingDeployContent);

  if (hasPushMaster && !alsoHasPullRequest) {
    pass('T3', 'staging-deploy.yml is scoped to push:branches:[master] only, not pull_request');
  } else {
    fail('T3', `push_master=${hasPushMaster} also_pull_request=${alsoHasPullRequest}`);
  }
})();

// ---------------------------------------------------------------------------
// T4 — the push-to-master deploy step targets wuce-staging, not wuce-prod
// (AC2)
// ---------------------------------------------------------------------------
(function t4() {
  if (!stagingDeployContent) {
    fail('T4', '.github/workflows/staging-deploy.yml not found');
    return;
  }
  const targetsStaging = /--app[\s=]+["']?wuce-staging\b/.test(stagingDeployContent);
  const targetsProd = /--app[\s=]+["']?(wuce-prod|skills-framework)\b/.test(stagingDeployContent);

  if (targetsStaging && !targetsProd) {
    pass('T4', 'staging-deploy.yml deploy step targets --app wuce-staging, not wuce-prod/skills-framework');
  } else {
    fail('T4', `targets_staging=${targetsStaging} targets_prod=${targetsProd}`);
  }
})();

// ---------------------------------------------------------------------------
// T5 — no push-to-master-triggered workflow step deploys to the prod Fly app
// outside the S2.6 promote-to-prod job (AC4)
// ---------------------------------------------------------------------------
(function t5() {
  const violations = findProdDeployViolations(workflowsDir);
  if (violations.length === 0) {
    pass('T5', 'no push-to-master workflow deploys to wuce-prod/skills-framework outside promote-to-prod');
  } else {
    fail('T5', `found ${violations.length} violation(s): ${JSON.stringify(violations)}`);
  }
})();

// ---------------------------------------------------------------------------
// T6 — synthetic fixture: the same check function correctly flags a
// deliberately-introduced violation (AC4, proves the check is real)
// ---------------------------------------------------------------------------
(function t6() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bri-s2.5-fixture-'));
  try {
    const fixtureYml = [
      'name: Fixture Bad Workflow',
      'on:',
      '  push:',
      '    branches:',
      '      - master',
      'jobs:',
      '  deploy:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - run: flyctl deploy --remote-only --app wuce-prod',
      ''
    ].join('\n');
    fs.writeFileSync(path.join(tmpDir, 'fixture-bad.yml'), fixtureYml, 'utf8');

    const violations = findProdDeployViolations(tmpDir);
    if (violations.length > 0) {
      pass('T6', `synthetic fixture correctly flagged (${violations.length} violation(s)) - check is a real detector`);
    } else {
      fail('T6', 'synthetic fixture with a deliberate wuce-prod deploy was NOT flagged - check is vacuous');
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// ---------------------------------------------------------------------------
// IT1 — the seed-script step runs immediately after the deploy step, within
// the same job (AC3)
// ---------------------------------------------------------------------------
(function it1() {
  if (!stagingDeployContent) {
    fail('IT1', '.github/workflows/staging-deploy.yml not found');
    return;
  }
  const lines = stagingDeployContent.split(/\r?\n/);
  const deployIdx = lines.findIndex((l) => /wuce-staging/.test(l) && /run:/.test(l));
  const seedIdx = lines.findIndex((l) => /seed-staging\.js/.test(l));
  const jobHeaderIdxs = lines
    .map((l, i) => (/^  [A-Za-z0-9_.-]+:\s*$/.test(l) ? i : -1))
    .filter((i) => i !== -1);

  if (deployIdx === -1 || seedIdx === -1) {
    fail('IT1', `could not locate both steps (deployIdx=${deployIdx} seedIdx=${seedIdx})`);
    return;
  }
  if (seedIdx <= deployIdx) {
    fail('IT1', 'seed step does not come after the deploy step');
    return;
  }
  // Confirm no job boundary falls strictly between deploy and seed (same job).
  const boundaryBetween = jobHeaderIdxs.some((i) => i > deployIdx && i < seedIdx);
  if (boundaryBetween) {
    fail('IT1', 'a new job starts between the deploy step and the seed step - not the same job');
    return;
  }
  pass('IT1', 'seed-staging.js step runs immediately after the wuce-staging deploy step, within the same job');
})();

// ---------------------------------------------------------------------------
console.log('');
if (failed > 0) {
  console.error(SUITE + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exit(1);
} else {
  console.log(SUITE + ' ' + passed + ' passed, 0 failed');
}
```

- [ ] **Step 2: Run test — must fail (red)**

```bash
node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js
```

Expected output: `Cannot find module '../scripts/check-no-prod-deploy-on-push'` (module doesn't exist yet) — or, once Task 3 lands first in isolation, all 7 tests failing with "not found" messages since none of the workflow files exist yet.

- [ ] **Step 3: Commit**

```bash
git add tests/check-bri-s2.5-ci-pipeline-staging-deploy.js
git commit -m "test: add failing AC verification tests for bri-s2.5 CI pipeline (T1-T6, IT1)"
```

---

## Task 2: Add minimal dependency-free lint/typecheck/build scripts

**Files:**
- Create: `scripts/ci-lint.js`
- Create: `scripts/ci-typecheck.js`
- Create: `scripts/ci-build.js`
- Modify: `package.json`

- [ ] **Step 1: Write `scripts/ci-lint.js`**

```javascript
'use strict';

/**
 * bri-s2.5 - minimal, dependency-free "lint" check for CI.
 * Syntax-checks every .js file under src/ and scripts/ using Node's
 * built-in `--check` flag. No ESLint/config exists in this repo yet (see
 * decisions.md 2026-07-11 SCOPE entry) - this is the smallest real
 * (non-vacuous) check that can fail a PR without adding new tooling.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function collectJsFiles(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const files = [];
  for (const dir of ['src', 'scripts']) {
    collectJsFiles(path.join(repoRoot, dir), files);
  }

  let failures = 0;
  for (const file of files) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
      failures += 1;
      console.error('[ci-lint] syntax error: ' + path.relative(repoRoot, file));
      console.error(err.stderr ? err.stderr.toString() : err.message);
    }
  }

  if (failures > 0) {
    console.error('[ci-lint] ' + failures + ' file(s) failed syntax check');
    process.exit(1);
  }
  console.log('[ci-lint] ' + files.length + ' file(s) OK');
}

if (require.main === module) run();
module.exports = { collectJsFiles, run };
```

- [ ] **Step 2: Write `scripts/ci-typecheck.js`**

```javascript
'use strict';

/**
 * bri-s2.5 - minimal, dependency-free "typecheck" stand-in for CI.
 * This is a plain-JS (no TypeScript) codebase, so there is no type system
 * to check. This performs a require-load smoke check across src/web-ui's
 * route/module graph, catching load-time reference errors (broken
 * requires, undefined exports used at module scope) - the closest
 * meaningful equivalent available without adding a new toolchain.
 */

const path = require('path');
const fs = require('fs');

function collectJsFiles(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const targetDir = path.join(repoRoot, 'src', 'web-ui');
  const files = collectJsFiles(targetDir);

  let failures = 0;
  for (const file of files) {
    try {
      require(file);
    } catch (err) {
      failures += 1;
      console.error('[ci-typecheck] load-time error: ' + path.relative(repoRoot, file));
      console.error(err.message);
    }
  }

  if (failures > 0) {
    console.error('[ci-typecheck] ' + failures + ' file(s) failed to load');
    process.exit(1);
  }
  console.log('[ci-typecheck] ' + files.length + ' file(s) loaded OK');
}

if (require.main === module) run();
module.exports = { collectJsFiles, run };
```

- [ ] **Step 3: Write `scripts/ci-build.js`**

```javascript
'use strict';

/**
 * bri-s2.5 - minimal "build" stand-in for CI. This Node.js app has no
 * bundler/compile step (server.js runs directly via `node`) - "build" here
 * confirms the deployable server entrypoint loads cleanly end-to-end
 * (its full require graph resolves, and it exports what server-startup
 * code expects), the closest meaningful equivalent to "the artifact
 * compiles" for a non-bundled Node app.
 */

const path = require('path');

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const entrypoint = path.join(repoRoot, 'src', 'web-ui', 'server.js');
  try {
    const mod = require(entrypoint);
    if (typeof mod.createApp !== 'function') {
      throw new Error('server.js did not export the expected createApp() function');
    }
  } catch (err) {
    console.error('[ci-build] entrypoint failed to load: ' + err.message);
    process.exit(1);
  }
  console.log('[ci-build] server entrypoint loads OK (deployable artifact verified)');
}

if (require.main === module) run();
module.exports = { run };
```

- [ ] **Step 4: Add npm scripts to `package.json`**

In the `"scripts"` object, add (keep every existing key unchanged):

```json
    "lint": "node scripts/ci-lint.js",
    "typecheck": "node scripts/ci-typecheck.js",
    "build": "node scripts/ci-build.js",
```

- [ ] **Step 5: Run each script directly — must pass**

```bash
node scripts/ci-lint.js
node scripts/ci-typecheck.js
node scripts/ci-build.js
```

Expected output: each prints an `OK`-style summary line and exits 0 (e.g. `[ci-lint] 204 file(s) OK`).

- [ ] **Step 6: Commit**

```bash
git add scripts/ci-lint.js scripts/ci-typecheck.js scripts/ci-build.js package.json
git commit -m "feat: add minimal lint/typecheck/build npm scripts for the CI PR-check pipeline"
```

---

## Task 3: Add the AC4 CI-native static-analysis check (T5/T6 reusable function)

**Files:**
- Create: `scripts/check-no-prod-deploy-on-push.js`

- [ ] **Step 1: Write the script**

```javascript
'use strict';

/**
 * bri-s2.5 AC4 - CI-native static check: no push-to-master-triggered GitHub
 * Actions workflow step deploys to the production Fly app (wuce-prod, or
 * this repo's current prod app name, skills-framework), outside the
 * manual-approval promote job bri-s2.6 will introduce (job id convention:
 * promote-to-prod, per this story's DoR Coding Agent Instructions).
 *
 * Text/regex-based (no js-yaml dependency), consistent with this repo's
 * existing workflow-check convention (see
 * tests/check-dviz2-pages-workflow.js).
 *
 * Run standalone: node scripts/check-no-prod-deploy-on-push.js
 */

const fs = require('fs');
const path = require('path');

const PROD_APP_NAMES = ['wuce-prod', 'skills-framework'];
const ALLOWLISTED_JOB_IDS = ['promote-to-prod'];

function isProdDeployLine(line) {
  return PROD_APP_NAMES.some((appName) => {
    const flagPattern = new RegExp('--app[\\s=]+["\']?' + appName + '\\b', 'i');
    const keyPattern = new RegExp('\\bapp:\\s*["\']?' + appName + '\\b', 'i');
    return flagPattern.test(line) || keyPattern.test(line);
  });
}

function hasPushTrigger(content) {
  return /(^|\n)\s*push:\s*(\n|$)/.test(content);
}

/**
 * Splits a workflow file's content into per-job blocks using GitHub
 * Actions' standard 2-space-per-level indentation
 * (jobs: -> 2-space job ids -> 4+ space job bodies).
 */
function splitJobs(content) {
  const lines = content.split(/\r?\n/);
  const jobsIdx = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (jobsIdx === -1) return [];

  const jobs = [];
  let current = null;
  for (let i = jobsIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break; // dedent back to a new top-level key
    const jobHeaderMatch = /^  ([A-Za-z0-9_.-]+):\s*$/.exec(line);
    if (jobHeaderMatch) {
      if (current) jobs.push(current);
      current = { id: jobHeaderMatch[1], lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) jobs.push(current);
  return jobs;
}

function findProdDeployViolations(workflowsDir) {
  const violations = [];
  if (!fs.existsSync(workflowsDir)) return violations;

  const files = fs.readdirSync(workflowsDir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

  for (const file of files) {
    const fullPath = path.join(workflowsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');

    if (!hasPushTrigger(content)) continue;

    const jobs = splitJobs(content);
    for (const job of jobs) {
      if (ALLOWLISTED_JOB_IDS.includes(job.id)) continue;
      for (const line of job.lines) {
        if (isProdDeployLine(line)) {
          violations.push({ file, job: job.id, line: line.trim() });
        }
      }
    }
  }

  return violations;
}

module.exports = { findProdDeployViolations, ALLOWLISTED_JOB_IDS, PROD_APP_NAMES };

if (require.main === module) {
  const workflowsDir = path.resolve(__dirname, '..', '.github', 'workflows');
  const violations = findProdDeployViolations(workflowsDir);
  if (violations.length > 0) {
    console.error('[check-no-prod-deploy-on-push] VIOLATIONS FOUND:');
    for (const v of violations) {
      console.error('  ' + v.file + ' :: job "' + v.job + '" :: ' + v.line);
    }
    process.exit(1);
  }
  console.log('[check-no-prod-deploy-on-push] 0 violations - no push-to-master workflow deploys to prod outside the promote job');
}
```

- [ ] **Step 2: Run test file — T5/T6 should now execute (T5 fails, no workflow files yet so 0 files scanned = vacuous pass; T6 should already pass since it's self-contained)**

```bash
node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js
```

Expected output: T6 passes (fixture logic works standalone); T1-T4, IT1 still fail (workflow files don't exist yet); T5 passes vacuously (no real workflow files scanned yet, so zero violations — re-verified meaningfully once Task 5 lands the new workflow files).

- [ ] **Step 3: Commit**

```bash
git add scripts/check-no-prod-deploy-on-push.js
git commit -m "feat: add AC4 CI-native static check for prod deploys on push-triggered workflows"
```

---

## Task 4: Add the PR-checks workflow (AC1)

**Files:**
- Create: `.github/workflows/pr-checks.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: PR Checks

# bri-s2.5 - runs on every PR against master: lint, typecheck, unit test
# chain, and build. None of the four steps has continue-on-error - a
# failure in any of them fails this job, which blocks merge once configured
# as a required status check in GitHub branch protection (AC1 - branch
# protection configuration itself is a manual, external-dependency step,
# see the story's test plan Coverage gaps table and this story's AC
# verification script Scenario 1).

on:
  pull_request:
    branches: [master]

permissions:
  contents: read

jobs:
  pr-checks:
    name: Lint, typecheck, test, build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Unit test chain
        run: npm test

      - name: Build
        run: npm run build
```

- [ ] **Step 2: Run test file — T1, T2 should now pass**

```bash
node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js
```

Expected output: T1, T2, T6 passing; T3, T4, IT1 still failing (staging-deploy.yml doesn't exist yet); T5 passing.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/pr-checks.yml
git commit -m "feat: add PR-checks workflow (lint, typecheck, test, build) for bri-s2.5 AC1"
```

---

## Task 5: Add staging-deploy.yml (AC2, AC3, AC4)

**Files:**
- Create: `.github/workflows/staging-deploy.yml`
- (No deletion needed — `.github/workflows/fly-deploy.yml` is not tracked in git; see decisions.md 2026-07-11 ASSUMPTION entry and the plan header's Repo-fact corrections.)

- [ ] **Step 1: Write the new workflow**

```yaml
# See https://fly.io/docs/app-guides/continuous-deployment-with-github-actions/
#
# bri-s2.5 - replaces the old direct-to-prod fly-deploy.yml. Every merge to
# master (this repo's trunk branch - see decisions.md 2026-07-11 ASSUMPTION
# entry re: main vs master) auto-deploys to the wuce-staging Fly app only,
# then auto-runs the bri-s2.4 seed script in the same job. wuce-prod is
# never touched by this workflow; production promotion is a separate,
# manually-gated job introduced by bri-s2.6 (job id convention:
# promote-to-prod - see scripts/check-no-prod-deploy-on-push.js).

name: Staging Deploy

on:
  push:
    branches:
      - master

jobs:
  deploy-staging:
    name: Deploy to wuce-staging
    runs-on: ubuntu-latest
    concurrency: deploy-group    # optional: ensure only one action runs at a time
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to wuce-staging
        run: flyctl deploy --remote-only --config fly.staging.toml --app wuce-staging
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Seed staging database (bri-s2.4)
        run: node scripts/seed-staging.js
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
```

- [ ] **Step 2: Run test file — all 7 tests should now pass**

```bash
node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js
```

Expected output:
```
  ✔ T1 pull_request-triggered workflow includes lint, typecheck, npm test, and build
  ✔ T2 no continue-on-error: true present on any PR-check step
  ✔ T3 staging-deploy.yml is scoped to push:branches:[master] only, not pull_request
  ✔ T4 staging-deploy.yml deploy step targets --app wuce-staging, not wuce-prod/skills-framework
  ✔ T5 no push-to-master workflow deploys to wuce-prod/skills-framework outside promote-to-prod
  ✔ T6 synthetic fixture correctly flagged (1 violation(s)) - check is a real detector
  ✔ IT1 seed-staging.js step runs immediately after the wuce-staging deploy step, within the same job

[check-bri-s2.5-ci-pipeline-staging-deploy] 7 passed, 0 failed
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/staging-deploy.yml
git commit -m "feat: replace fly-deploy.yml with staging-deploy.yml (auto-seed, never wuce-prod)"
```

---

## Task 6: Full-suite delta check (no new regressions)

**Files:** None (verification only)

- [ ] **Step 1: Run the new test file standalone**

```bash
node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js
```

Expected output: `7 passed, 0 failed`

- [ ] **Step 2: Run the full dynamic test suite and diff against the documented baseline**

```bash
node scripts/run-all-tests.js
```

Expected output: `308 file(s) run` (307 baseline + this story's new file), with the failed-file list being **exactly** the same 68 pre-existing files logged in decisions.md's 2026-07-11 RISK-ACCEPT entry — no new file appears in the failed list, and `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` is not among the failures.

- [ ] **Step 3: No commit needed** (verification-only task — proceed to /verify-completion)

---

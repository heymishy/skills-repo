# Install the full skill set with a lightweight outer/inner/ancillary registry — Implementation Plan

> **For agent execution:** Single-session TDD (task by task), no subagents used for this dispatch.

**Goal:** Extend the CLI wrapper's install step to copy the platform's complete current skill set (every skill under top-level `skills/`, 46 as of 2026-08-05) into the bootstrapped target repo, and generate a `skills-registry.json` manifest categorizing each skill as `outer-loop`, `inner-loop`, or `ancillary`, cross-referenced against `CLAUDE.md`'s Pipeline overview section.
**Branch:** `feature/rb-s2-full-skill-set-and-registry`
**Worktree:** current session worktree (already isolated by the harness — no nested `git worktree add` performed)
**Test command:** `node tests/check-rb-s2-full-skill-set-and-registry.js` (new) and `node tests/check-rb-s1-cli-init.js` (regression check)

---

## Pre-implementation finding (read before Task 1)

`platform-init.js`'s `COPY_DIRS` copies this repo's `.github/skills/` (5 legacy skills: `infra-definition`, `infra-plan`, `infra-review`, `schema-migration-plan`, `schema-migration-review`) into the target's `.github/skills/`. The platform's actual complete, current skill set (46 skills — `discovery`, `benefit-metric`, `branch-setup`, `orient`, etc.) lives at this repo's top-level `skills/`, which `COPY_DIRS` does not touch at all. AC1 requires "every skill under `skills/` in the upstream repository" to land in the target — so this story adds a **new, additional** copy step (not a modification to `platform-init.js`, per the DoR constraint) that copies the real top-level `skills/` tree into the target's `.github/skills/`, on top of what `platform-init.js` already puts there. `.github/skills/` is the correct destination: it matches the verification script's Scenario 1 literally, and matches `CLAUDE.md`'s own references to `.github/skills/` as the canonical skill-file location in a bootstrapped repo.

**Known consequence:** rb-s1's test `initCommand_wrapsPlatformInitJs_producesIdenticalOutputToDirectInvocation` currently asserts the CLI wrapper's `.github/skills` output is byte-for-byte identical to a bare `platform-init.js` invocation. This story makes that assertion no longer true by design (the CLI now adds more files on top). Task 3 amends that one assertion to a superset check, with an inline comment explaining why, and documents this scope amendment in the PR (per ADR-008 — a documented, necessary touch-point expansion, not silent scope creep).

`package.json`'s `files` field (npm packaging allowlist) does not currently include `skills/`, so it must be added — otherwise a real `npx`-installed package would not carry the source directory this story reads from.

---

## File map

```
Create:
  cli/lib/skills-registry.js                        — registry build/copy/diagram-crossref module (no platform-init.js changes)
  tests/check-rb-s2-full-skill-set-and-registry.js   — this story's test suite (fixture-based per test plan)

Modify:
  cli/lib/init.js                                    — call the new module from runInit()
  package.json                                        — add "skills/" to the files array
  tests/check-rb-s1-cli-init.js                       — amend one assertion (superset, not exact-equality) + comment
```

---

## Task 1: Registry core module — build, copy, diagram cross-reference

**Files:**
- Create: `cli/lib/skills-registry.js`
- Test: `tests/check-rb-s2-full-skill-set-and-registry.js` (unit section)

- [ ] **Step 1: Write the failing tests** (fixture-based, per test plan's Test Data Strategy — synthetic fixtures, not the real 46-skill tree)

```javascript
test('materializesFullSkillSet_notSubsetOrPlaceholder', () => {
  const { buildRegistry, copySkillsFromRegistry } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'benefit-metric', 'branch-setup', 'orient', 'decisions']);
  const dest = mktmp();
  const registry = buildRegistry(fixtureSrc, FIXTURE_CATEGORY_MAP);
  copySkillsFromRegistry(fixtureSrc, dest, registry, false);
  const copiedDirs = fs.readdirSync(dest).filter(n => fs.statSync(path.join(dest, n)).isDirectory());
  assert.strictEqual(copiedDirs.length, 5, 'expected all 5 fixture skills, not a reduced placeholder subset');
});

test('registryListsEveryFixtureSkillWithValidCategory', () => {
  const { buildRegistry } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'benefit-metric', 'branch-setup', 'orient']);
  const registry = buildRegistry(fixtureSrc, FIXTURE_CATEGORY_MAP);
  assert.strictEqual(registry.skills.length, 4);
  for (const entry of registry.skills) {
    assert.ok(['outer-loop', 'inner-loop', 'ancillary'].includes(entry.category),
      `invalid category "${entry.category}" for ${entry.name}`);
  }
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rb-s2-full-skill-set-and-registry.js
```

Expected output: `Cannot find module '../cli/lib/skills-registry'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

// See CLAUDE.md "Pipeline overview" for the source grouping this mirrors:
// outer-loop = steps 1-6.5 (discovery through decisions); inner-loop = step 7
// (7a-7e, "Inner coding loop") plus the skills CLAUDE.md names as "available
// throughout the inner loop"; ancillary = everything else named in that
// section (onboarding, cross-cutting, pipeline-evolution, programme-track,
// and the post-merge feedback-loop skills that close the delivery cycle
// rather than execute a single story).
//
// Nothing below branches on a category's *name* — a category is opaque
// metadata used only for listing/cross-reference. That is what lets a new
// category value be added here with zero change to copySkillsFromRegistry
// (rb-s2 AC3).
const SKILL_CATEGORIES = {
  discovery: 'outer-loop',
  'benefit-metric': 'outer-loop',
  design: 'outer-loop',
  definition: 'outer-loop',
  review: 'outer-loop',
  'test-plan': 'outer-loop',
  'definition-of-ready': 'outer-loop',
  decisions: 'outer-loop',

  'branch-setup': 'inner-loop',
  'implementation-plan': 'inner-loop',
  'subagent-execution': 'inner-loop',
  'verify-completion': 'inner-loop',
  'branch-complete': 'inner-loop',
  tdd: 'inner-loop',
  'systematic-debugging': 'inner-loop',
  'implementation-review': 'inner-loop',

  bootstrap: 'ancillary',
  checkpoint: 'ancillary',
  clarify: 'ancillary',
  'coverage-map': 'ancillary',
  'definition-of-done': 'ancillary',
  'ea-registry': 'ancillary',
  estimate: 'ancillary',
  ideate: 'ancillary',
  improve: 'ancillary',
  'improvement-agent': 'ancillary',
  'issue-dispatch': 'ancillary',
  'loop-design': 'ancillary',
  'metric-review': 'ancillary',
  'model-sweep': 'ancillary',
  'modernisation-decompose': 'ancillary',
  'org-mapping': 'ancillary',
  orient: 'ancillary',
  'persona-routing': 'ancillary',
  prioritise: 'ancillary',
  programme: 'ancillary',
  'record-signal': 'ancillary',
  'reference-corpus-update': 'ancillary',
  release: 'ancillary',
  'reverse-engineer': 'ancillary',
  'scale-pipeline': 'ancillary',
  spike: 'ancillary',
  start: 'ancillary',
  'token-optimization': 'ancillary',
  trace: 'ancillary',
  workflow: 'ancillary'
};

const DEFAULT_CATEGORY = 'ancillary';

function listSkillDirs(skillsDir) {
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir)
    .filter(name => fs.statSync(path.join(skillsDir, name)).isDirectory())
    .sort();
}

function buildRegistry(skillsDir, categoryMap) {
  categoryMap = categoryMap || SKILL_CATEGORIES;
  const names = listSkillDirs(skillsDir);
  const skills = names.map(name => ({
    name,
    category: Object.prototype.hasOwnProperty.call(categoryMap, name) ? categoryMap[name] : DEFAULT_CATEGORY
  }));
  return { version: '1', generatedAt: new Date().toISOString(), skills };
}

function copyDirRecursive(src, dest, force) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath, force);
    } else {
      if (!force && fs.existsSync(destPath)) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Deliberately does not read entry.category — copying is category-agnostic.
function copySkillsFromRegistry(skillsDir, destDir, registry, force) {
  const copied = [];
  for (const entry of registry.skills) {
    const src = path.join(skillsDir, entry.name);
    if (!fs.existsSync(src)) continue;
    copyDirRecursive(src, path.join(destDir, entry.name), force);
    copied.push(entry.name);
  }
  return copied;
}

function writeRegistryFile(registry, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
}

const PIPELINE_OVERVIEW_HEADING = '## Pipeline overview';

function extractPipelineOverviewSection(instructionText) {
  const startIdx = instructionText.indexOf(PIPELINE_OVERVIEW_HEADING);
  if (startIdx === -1) return '';
  const rest = instructionText.slice(startIdx + PIPELINE_OVERVIEW_HEADING.length);
  const nextHeadingMatch = rest.match(/\n## /);
  return nextHeadingMatch ? rest.slice(0, nextHeadingMatch.index) : rest;
}

function parseDiagramSteps(instructionText) {
  const section = extractPipelineOverviewSection(instructionText);
  const steps = new Set();
  const re = /\/([a-z][a-z0-9-]*)/g;
  let match;
  while ((match = re.exec(section)) !== null) steps.add(match[1]);
  return steps;
}

function findOrphanedEntries(registry, diagramSteps) {
  return registry.skills.filter(entry =>
    (entry.category === 'outer-loop' || entry.category === 'inner-loop') && !diagramSteps.has(entry.name));
}

module.exports = {
  SKILL_CATEGORIES, DEFAULT_CATEGORY, listSkillDirs, buildRegistry, copyDirRecursive,
  copySkillsFromRegistry, writeRegistryFile, parseDiagramSteps, extractPipelineOverviewSection, findOrphanedEntries
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rb-s2-full-skill-set-and-registry.js
```

Expected output: the two tests above print `✔`.

- [ ] **Step 5: Run full suite for this story — no regressions**

```bash
node tests/check-rb-s2-full-skill-set-and-registry.js
node tests/check-rb-s1-cli-init.js
```

Expected: all passing (rb-s1 still green — Task 1 does not touch `cli/lib/init.js` yet).

- [ ] **Step 6: Commit**

```bash
git add cli/lib/skills-registry.js tests/check-rb-s2-full-skill-set-and-registry.js
git commit -m "feat: add skills-registry module for outer/inner/ancillary categorisation"
```

---

## Task 2: Wire full skill-set install + registry generation into the CLI wrapper

**Files:**
- Modify: `cli/lib/init.js`
- Modify: `package.json`
- Test: `tests/check-rb-s2-full-skill-set-and-registry.js` (integration section)

- [ ] **Step 1: Write the failing test**

```javascript
test('fullSkillSetAndRegistry_buildOnRbS1Output', () => {
  const { runInit } = require('../cli/lib/init');
  const { listSkillDirs } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  runInit(tmp, {});
  const realSkillNames = listSkillDirs(path.join(ROOT, 'skills'));
  const destSkills = fs.readdirSync(path.join(tmp, '.github', 'skills'));
  for (const name of realSkillNames) {
    assert.ok(destSkills.includes(name), `missing real skill "${name}" under .github/skills after init`);
  }
  const registryPath = path.join(tmp, '.github', 'skills-registry.json');
  assert.ok(fs.existsSync(registryPath), 'skills-registry.json was not generated');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  for (const name of realSkillNames) {
    const entry = registry.skills.find(s => s.name === name);
    assert.ok(entry, `registry missing entry for "${name}"`);
    assert.ok(['outer-loop', 'inner-loop', 'ancillary'].includes(entry.category));
  }
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rb-s2-full-skill-set-and-registry.js
```

Expected output: `missing real skill "discovery" under .github/skills after init` (or `ENOENT` on `skills-registry.json`)

- [ ] **Step 3: Write minimal implementation**

Add to `cli/lib/init.js` (after the `requirePlatformInit` call and before/alongside `seedContextYml`/`seedPipelineState`):

```javascript
const { buildRegistry, copySkillsFromRegistry, writeRegistryFile } = require('./skills-registry');

function installFullSkillSetAndRegistry(resolvedTarget, platformRoot, force) {
  const skillsSourceDir = path.join(platformRoot, 'skills');
  const skillsDestDir = path.join(resolvedTarget, '.github', 'skills');
  const registry = buildRegistry(skillsSourceDir);
  const copied = copySkillsFromRegistry(skillsSourceDir, skillsDestDir, registry, force);
  const registryDest = path.join(resolvedTarget, '.github', 'skills-registry.json');
  writeRegistryFile(registry, registryDest);
  return { copiedCount: copied.length, registryPath: registryDest };
}
```

Call it inside `runInit()` and log the result; export `installFullSkillSetAndRegistry` from the module.

Add `"skills/"` to `package.json`'s `files` array (after `".github/skills/"`).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rb-s2-full-skill-set-and-registry.js
```

Expected output: `PASS`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected: **one known failure** — `initCommand_wrapsPlatformInitJs_producesIdenticalOutputToDirectInvocation` — addressed in Task 3.

- [ ] **Step 6: Commit**

```bash
git add cli/lib/init.js package.json
git commit -m "feat: install the full skill set and generate skills-registry.json on init"
```

---

## Task 3: Amend rb-s1's parity assertion (documented scope amendment)

**Files:**
- Modify: `tests/check-rb-s1-cli-init.js`

- [ ] **Step 1: Update the assertion** — replace the exact-equality check with a superset check, with an inline comment citing rb-s2:

```javascript
// rb-s2 extends the CLI wrapper to additionally copy the platform's full
// top-level skills/ tree into .github/skills/, on top of what platform-init.js
// puts there directly. The CLI's output is therefore now a superset of a bare
// platform-init.js invocation, not byte-for-byte identical. This assertion is
// amended accordingly — see artefacts/2026-08-05-repo-bootstrap-no-fork/plans/rb-s2-plan.md.
assert.ok(cliFiles.length >= directFiles.length,
  'CLI output should be a superset of direct platform-init.js invocation, not smaller');
for (const f of directFiles) {
  assert.ok(cliFiles.includes(f), `CLI output missing a file platform-init.js produces directly: ${f}`);
}
```

- [ ] **Step 2: Run rb-s1's suite — must pass again**

```bash
node tests/check-rb-s1-cli-init.js
```

Expected output: `[rb-s1-cli-init] Results: 10 passed, 0 failed`

- [ ] **Step 3: Commit**

```bash
git add tests/check-rb-s1-cli-init.js
git commit -m "test: amend rb-s1 parity check to superset comparison after rb-s2 skill-set extension"
```

---

## Task 4: Diagram cross-reference tests (AC2/AC4) and extensibility test (AC3)

**Files:**
- Test: `tests/check-rb-s2-full-skill-set-and-registry.js` (remaining unit tests + NFR)

- [ ] **Step 1: Write the failing tests**

```javascript
test('registryCategoriesMatchFixtureDiagramSteps', () => {
  const { buildRegistry, parseDiagramSteps, findOrphanedEntries } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'branch-setup', 'orient']);
  const registry = buildRegistry(fixtureSrc, { discovery: 'outer-loop', 'branch-setup': 'inner-loop', orient: 'ancillary' });
  const diagramText = FIXTURE_INSTRUCTION_TEXT; // contains /discovery and /branch-setup, not /orient
  const steps = parseDiagramSteps(diagramText);
  const orphans = findOrphanedEntries(registry, steps);
  assert.strictEqual(orphans.length, 0, 'no orphans expected — both outer/inner entries are named in the fixture diagram');
});

test('registryCategoriesMatchFixtureDiagramSteps_detectsOrphan', () => {
  const { buildRegistry, parseDiagramSteps, findOrphanedEntries } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'not-a-real-step']);
  const registry = buildRegistry(fixtureSrc, { discovery: 'outer-loop', 'not-a-real-step': 'outer-loop' });
  const steps = parseDiagramSteps(FIXTURE_INSTRUCTION_TEXT);
  const orphans = findOrphanedEntries(registry, steps);
  assert.strictEqual(orphans.length, 1, 'deliberately orphaned entry should be caught');
  assert.strictEqual(orphans[0].name, 'not-a-real-step');
});

test('addingNewCategoryRequiresOnlyRegistryEntry_representativeInstance', () => {
  const { buildRegistry, copySkillsFromRegistry } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'future-skill']);
  const registry = buildRegistry(fixtureSrc, { discovery: 'outer-loop', 'future-skill': 'programme-track' });
  const dest = mktmp();
  const copied = copySkillsFromRegistry(fixtureSrc, dest, registry, false);
  assert.deepStrictEqual(copied.sort(), ['discovery', 'future-skill']);
  assert.ok(fs.existsSync(path.join(dest, 'future-skill', 'SKILL.md')),
    'skill under an unrecognised future category should copy identically to any other category');
});

test('registryAndFullSkillSetOverheadUnder5Seconds', () => {
  const { buildRegistry, copySkillsFromRegistry, writeRegistryFile } = require('../cli/lib/skills-registry');
  const skillsSourceDir = path.join(ROOT, 'skills');
  const dest = mktmp();
  const start = Date.now();
  const registry = buildRegistry(skillsSourceDir);
  copySkillsFromRegistry(skillsSourceDir, path.join(dest, '.github', 'skills'), registry, false);
  writeRegistryFile(registry, path.join(dest, '.github', 'skills-registry.json'));
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 5000, `registry step took ${elapsed}ms — expected under 5000ms`);
});
```

- [ ] **Step 2: Run — must fail then pass after Task 1's implementation is in place** (Task 1 already implements the functions under test; these are additional fixture cases layered on top)

```bash
node tests/check-rb-s2-full-skill-set-and-registry.js
```

- [ ] **Step 3: Commit**

```bash
git add tests/check-rb-s2-full-skill-set-and-registry.js
git commit -m "test: add AC2/AC3/AC4 diagram cross-reference and extensibility coverage"
```

---

## Task 5: Verification pass and PR

- [ ] Run `node tests/check-rb-s2-full-skill-set-and-registry.js` — 0 failures
- [ ] Run `node tests/check-rb-s1-cli-init.js` — 0 failures (post Task 3 amendment)
- [ ] Walk `artefacts/2026-08-05-repo-bootstrap-no-fork/verification-scripts/rb-s2-verification.md` scenarios 1-4 against a real `runInit()` call in a temp dir
- [ ] Open draft PR via `gh pr create --draft`, note the scope amendment (Task 3) explicitly in the PR body/comment

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rb-s2-test-'));
}

function rmtmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// Synthetic fixture skills directory, per the test plan's Test Data Strategy:
// a small fixture set standing in for the real skills/ tree, not the real
// tree itself, to keep tests fast and deterministic.
function makeFixtureSkillsDir(skillNames) {
  const dir = mktmp();
  for (const name of skillNames) {
    const skillDir = path.join(dir, name);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `# ${name}\n\nFixture skill.\n`, 'utf8');
  }
  return dir;
}

const FIXTURE_CATEGORY_MAP = {
  discovery: 'outer-loop',
  'benefit-metric': 'outer-loop',
  decisions: 'outer-loop',
  'branch-setup': 'inner-loop',
  orient: 'ancillary'
};

// A small fixture instruction file mirroring the shape of CLAUDE.md's
// "Pipeline overview" section, per the test plan's AC2/AC4 data requirement.
const FIXTURE_INSTRUCTION_TEXT = `
# Fixture Instructions

## Some other section

Not part of the pipeline overview: /not-a-real-step should be ignored here.

## Pipeline overview

\`\`\`
Step  Skill                  Entry condition        Exit condition
1     /discovery             Raw idea exists         Artefact approved
2     /benefit-metric        Discovery approved      Metrics active
6.5   /decisions             DoR complete            RISK-ACCEPTs logged
7a    /branch-setup          DoR Proceed: Yes        Worktree ready
\`\`\`

**Onboarding and orientation support:**
\`/orient\` — guided orientation concierge.

## Next section

Outside the pipeline overview block — should not be scanned.
`;

let registryModule;

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s2] Unit tests\n');

test('moduleLoads_skillsRegistry', () => {
  registryModule = require('../cli/lib/skills-registry');
  assert.ok(registryModule, 'cli/lib/skills-registry.js should exist and export a module');
});

test('materializesFullSkillSet_notSubsetOrPlaceholder', () => {
  const { buildRegistry, copySkillsFromRegistry } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'benefit-metric', 'branch-setup', 'orient', 'decisions']);
  const dest = mktmp();
  try {
    const registry = buildRegistry(fixtureSrc, FIXTURE_CATEGORY_MAP);
    copySkillsFromRegistry(fixtureSrc, dest, registry, false);
    const copiedDirs = fs.readdirSync(dest).filter(n => fs.statSync(path.join(dest, n)).isDirectory());
    assert.strictEqual(copiedDirs.length, 5,
      'expected all 5 fixture skills to be materialized, not a reduced placeholder subset');
    for (const name of ['discovery', 'benefit-metric', 'branch-setup', 'orient', 'decisions']) {
      assert.ok(fs.existsSync(path.join(dest, name, 'SKILL.md')), `missing SKILL.md for ${name}`);
    }
  } finally { rmtmp(fixtureSrc); rmtmp(dest); }
});

test('registryListsEveryFixtureSkillWithValidCategory', () => {
  const { buildRegistry } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'benefit-metric', 'branch-setup', 'orient']);
  try {
    const registry = buildRegistry(fixtureSrc, FIXTURE_CATEGORY_MAP);
    assert.strictEqual(registry.skills.length, 4, 'every fixture skill should appear exactly once');
    const names = registry.skills.map(s => s.name).sort();
    assert.deepStrictEqual(names, ['benefit-metric', 'branch-setup', 'discovery', 'orient']);
    for (const entry of registry.skills) {
      assert.ok(['outer-loop', 'inner-loop', 'ancillary'].includes(entry.category),
        `invalid category "${entry.category}" for ${entry.name}`);
    }
  } finally { rmtmp(fixtureSrc); }
});

test('registryCategoriesMatchFixtureDiagramSteps', () => {
  const { buildRegistry, parseDiagramSteps, findOrphanedEntries } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'branch-setup', 'orient']);
  try {
    const registry = buildRegistry(fixtureSrc, { discovery: 'outer-loop', 'branch-setup': 'inner-loop', orient: 'ancillary' });
    const steps = parseDiagramSteps(FIXTURE_INSTRUCTION_TEXT);
    const orphans = findOrphanedEntries(registry, steps);
    assert.strictEqual(orphans.length, 0,
      'no orphans expected — both outer-loop and inner-loop entries are named in the fixture diagram');
  } finally { rmtmp(fixtureSrc); }
});

test('registryCategoriesMatchFixtureDiagramSteps_detectsDeliberateOrphan', () => {
  const { buildRegistry, parseDiagramSteps, findOrphanedEntries } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'not-a-real-step']);
  try {
    // 'not-a-real-step' is deliberately given an outer-loop category despite
    // not being a named step in the fixture diagram's Pipeline overview
    // section (it appears only in the "Some other section" block, which
    // parseDiagramSteps must not scan) — this proves the cross-reference
    // actually checks something rather than trivially passing.
    const registry = buildRegistry(fixtureSrc, { discovery: 'outer-loop', 'not-a-real-step': 'outer-loop' });
    const steps = parseDiagramSteps(FIXTURE_INSTRUCTION_TEXT);
    const orphans = findOrphanedEntries(registry, steps);
    assert.strictEqual(orphans.length, 1, 'deliberately orphaned entry should be caught');
    assert.strictEqual(orphans[0].name, 'not-a-real-step');
  } finally { rmtmp(fixtureSrc); }
});

test('addingNewCategoryRequiresOnlyRegistryEntry_representativeInstance', () => {
  const { buildRegistry, copySkillsFromRegistry } = require('../cli/lib/skills-registry');
  const fixtureSrc = makeFixtureSkillsDir(['discovery', 'future-skill']);
  const dest = mktmp();
  try {
    // Representative instance only (per test plan Coverage gaps) — this
    // demonstrates one new category works with zero code change; it does not
    // prove the claim for all possible future categories.
    const registry = buildRegistry(fixtureSrc, { discovery: 'outer-loop', 'future-skill': 'programme-track' });
    const copied = copySkillsFromRegistry(fixtureSrc, dest, registry, false);
    assert.deepStrictEqual(copied.sort(), ['discovery', 'future-skill']);
    assert.ok(fs.existsSync(path.join(dest, 'future-skill', 'SKILL.md')),
      'skill under an unrecognised future category should copy identically to any other category');
  } finally { rmtmp(fixtureSrc); rmtmp(dest); }
});

test('extractPipelineOverviewSection_stopsAtNextHeading', () => {
  const { extractPipelineOverviewSection } = require('../cli/lib/skills-registry');
  const section = extractPipelineOverviewSection(FIXTURE_INSTRUCTION_TEXT);
  assert.ok(section.includes('/discovery'), 'section should include content from Pipeline overview');
  assert.ok(!section.includes('Outside the pipeline overview block'),
    'section should stop before the next ## heading');
  assert.ok(!section.includes('/not-a-real-step'),
    'section should not include content from a preceding, unrelated section');
});

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s2] Integration tests\n');

// rb-s5 note: this test originally asserted that a plain `runInit(tmp, {})`
// (no flags) installs literally every real skill name, matching the
// discovery.md MVP framing of "copies the full skill set uniformly every
// time". rb-s5's epic (rb-e2) explicitly superseded that framing -- the
// default (no `--with-outer-loop`) install now excludes outer-loop skills on
// both bootstrap entry points, per rb-s5 AC1/AC2 and the decisions.md ARCH
// entry recording that reconciliation. The registry file itself still lists
// every real skill with its correct category regardless of what was actually
// copied (the registry is a categorisation manifest, not an install log) --
// that half of the original assertion is preserved below. A second test
// (fullSkillSetReachable_withOuterLoopFlag) restores the "everything gets
// installed" coverage this test used to provide, gated behind the flag.
test('defaultInstall_excludesOuterLoopSkills_butRegistryStillListsEveryRealSkill', () => {
  const { runInit } = require('../cli/lib/init');
  const { listSkillDirs, SKILL_CATEGORIES } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    runInit(tmp, {});
    const realSkillNames = listSkillDirs(path.join(ROOT, 'skills'));
    assert.ok(realSkillNames.length > 5,
      'sanity check: the real skills/ tree should contain more than the 5-skill .github/skills placeholder set');
    const destSkillsDir = path.join(tmp, '.github', 'skills');
    const destSkills = fs.readdirSync(destSkillsDir);
    for (const name of realSkillNames) {
      const category = Object.prototype.hasOwnProperty.call(SKILL_CATEGORIES, name) ? SKILL_CATEGORIES[name] : 'ancillary';
      if (category === 'outer-loop') {
        assert.ok(!destSkills.includes(name), `outer-loop skill "${name}" should NOT be installed under .github/skills without --with-outer-loop`);
      } else {
        assert.ok(destSkills.includes(name), `missing real skill "${name}" (category ${category}) under .github/skills after default init`);
      }
    }
    const registryPath = path.join(tmp, '.github', 'skills-registry.json');
    assert.ok(fs.existsSync(registryPath), 'skills-registry.json was not generated');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    for (const name of realSkillNames) {
      const entry = registry.skills.find(s => s.name === name);
      assert.ok(entry, `registry missing entry for real skill "${name}" -- registry must list every real skill regardless of whether it was installed this run`);
      assert.ok(['outer-loop', 'inner-loop', 'ancillary'].includes(entry.category),
        `invalid category "${entry.category}" for real skill "${name}"`);
    }
  } finally { rmtmp(tmp); }
});

test('fullSkillSetReachable_withOuterLoopFlag', () => {
  const { runInit } = require('../cli/lib/init');
  const { listSkillDirs } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    runInit(tmp, { withOuterLoop: true });
    const realSkillNames = listSkillDirs(path.join(ROOT, 'skills'));
    const destSkillsDir = path.join(tmp, '.github', 'skills');
    const destSkills = fs.readdirSync(destSkillsDir);
    for (const name of realSkillNames) {
      assert.ok(destSkills.includes(name), `missing real skill "${name}" under .github/skills after init with --with-outer-loop -- the full set (rb-s2) must still be reachable in one call (rb-s5)`);
    }
  } finally { rmtmp(tmp); }
});

test('secondRunDoesNotDuplicateOrCorruptRegistry', () => {
  const { runInit } = require('../cli/lib/init');
  const tmp = mktmp();
  try {
    runInit(tmp, {});
    runInit(tmp, {});
    const registryPath = path.join(tmp, '.github', 'skills-registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const names = registry.skills.map(s => s.name);
    assert.strictEqual(new Set(names).size, names.length, 'registry should not contain duplicate skill entries after a second run');
  } finally { rmtmp(tmp); }
});

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s2] NFR tests\n');

test('registryAndFullSkillSetOverheadUnder5Seconds', () => {
  const { buildRegistry, copySkillsFromRegistry, writeRegistryFile } = require('../cli/lib/skills-registry');
  const skillsSourceDir = path.join(ROOT, 'skills');
  const dest = mktmp();
  try {
    const start = Date.now();
    const registry = buildRegistry(skillsSourceDir);
    copySkillsFromRegistry(skillsSourceDir, path.join(dest, '.github', 'skills'), registry, false);
    writeRegistryFile(registry, path.join(dest, '.github', 'skills-registry.json'));
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `registry step took ${elapsed}ms — expected under 5000ms`);
  } finally { rmtmp(dest); }
});

// ---------------------------------------------------------------------------

console.log('');
console.log(`[rb-s2-full-skill-set-and-registry] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

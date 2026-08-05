'use strict';

// rb-s5: Optionally install the full outer loop during bootstrap
// Tests AC1-AC4 per artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s5-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
const registered = [];

function test(name, fn) {
  registered.push({ name, fn });
}

function mktmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rb-s5-test-'));
}

function rmtmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

function listSkillNamesUnder(destSkillsDir) {
  if (!fs.existsSync(destSkillsDir)) return [];
  return fs.readdirSync(destSkillsDir).filter(n => fs.statSync(path.join(destSkillsDir, n)).isDirectory());
}

function createMockSaasFetch(fixture) {
  async function mockFetch() {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        artefactContent: fixture.artefactBody,
        pipelineStateEntry: fixture.feature
      })
    };
  }
  return mockFetch;
}

const SAAS_FIXTURE = {
  feature: {
    slug: '2026-04-04-fixture-feature',
    stage: 'dor-signed-off',
    stories: [{ id: 'ff-s1', dorStatus: 'signed-off', dorArtefact: 'artefacts/2026-04-04-fixture-feature/dor/ff-s1-dor.md', stage: 'dor-signed-off', health: 'green' }]
  },
  artefactBody: '# Fixture Feature DoR\n\nApproved content.\n'
};

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function checksumAll(dir) {
  const sums = {};
  function walk(d) {
    for (const entry of fs.readdirSync(d)) {
      const full = path.join(d, entry);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else sums[path.relative(dir, full)] = sha256(full);
    }
  }
  if (fs.existsSync(dir)) walk(dir);
  return sums;
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s5] Unit tests\n');

test('freshRepoWithFlag_installsOuterLoopSkillsOnTop', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const { SKILL_CATEGORIES } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    await runInit(tmp, { withOuterLoop: true });
    const destSkillsDir = path.join(tmp, '.github', 'skills');
    const installed = new Set(listSkillNamesUnder(destSkillsDir));
    let sawOuterLoop = 0;
    let sawInner = 0;
    for (const [name, category] of Object.entries(SKILL_CATEGORIES)) {
      assert.ok(installed.has(name), `expected "${name}" (category ${category}) to be installed with --with-outer-loop`);
      if (category === 'outer-loop') sawOuterLoop++;
      if (category === 'inner-loop') sawInner++;
    }
    assert.ok(sawOuterLoop > 0, 'sanity check: at least one outer-loop skill should exist in the real registry');
    assert.ok(sawInner > 0, 'sanity check: at least one inner-loop skill should exist in the real registry');
  } finally { rmtmp(tmp); }
});

test('freshRepoWithoutFlag_excludesOuterLoopSkills', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const { SKILL_CATEGORIES } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    await runInit(tmp, {});
    const destSkillsDir = path.join(tmp, '.github', 'skills');
    const installed = new Set(listSkillNamesUnder(destSkillsDir));
    for (const [name, category] of Object.entries(SKILL_CATEGORIES)) {
      if (category === 'outer-loop') {
        assert.ok(!installed.has(name), `"${name}" is outer-loop and should NOT be installed by default (no flag)`);
      } else {
        assert.ok(installed.has(name), `"${name}" (category ${category}) should still be installed by default`);
      }
    }
  } finally { rmtmp(tmp); }
});

test('saasConnectedWithoutFlag_installsOnlyInnerLoopAndAncillary', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const { SKILL_CATEGORIES } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    const mockFetch = createMockSaasFetch(SAAS_FIXTURE);
    await runInit(tmp, {
      fromSaas: SAAS_FIXTURE.feature.slug,
      credential: 'synthetic-test-credential-not-a-real-token',
      saasBaseUrl: 'https://saas.test',
      fetchImpl: mockFetch
    });
    const destSkillsDir = path.join(tmp, '.github', 'skills');
    const installed = new Set(listSkillNamesUnder(destSkillsDir));
    const outerLoopNames = Object.entries(SKILL_CATEGORIES).filter(([, c]) => c === 'outer-loop').map(([n]) => n);
    for (const name of outerLoopNames) {
      assert.ok(!installed.has(name), `outer-loop skill "${name}" must not be present on SaaS-connected bootstrap without --with-outer-loop`);
    }
    const nonOuterNames = Object.entries(SKILL_CATEGORIES).filter(([, c]) => c !== 'outer-loop').map(([n]) => n);
    for (const name of nonOuterNames) {
      assert.ok(installed.has(name), `non-outer-loop skill "${name}" should still be present by default`);
    }
  } finally { rmtmp(tmp); }
});

test('saasConnectedWithFlag_installsOuterLoopToo', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const { SKILL_CATEGORIES } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    const mockFetch = createMockSaasFetch(SAAS_FIXTURE);
    await runInit(tmp, {
      fromSaas: SAAS_FIXTURE.feature.slug,
      credential: 'synthetic-test-credential-not-a-real-token',
      saasBaseUrl: 'https://saas.test',
      fetchImpl: mockFetch,
      withOuterLoop: true
    });
    const destSkillsDir = path.join(tmp, '.github', 'skills');
    const installed = new Set(listSkillNamesUnder(destSkillsDir));
    for (const name of Object.keys(SKILL_CATEGORIES)) {
      assert.ok(installed.has(name), `"${name}" should be installed on SaaS-connected bootstrap with --with-outer-loop`);
    }
    // Fetched artefact + pipeline-state should still be present alongside the outer loop.
    assert.ok(fs.existsSync(path.join(tmp, SAAS_FIXTURE.feature.stories[0].dorArtefact)), 'fetched DoR artefact should still be materialized');
  } finally { rmtmp(tmp); }
});

test('addOnModeInstallsOuterLoopWithoutDiscardingExistingBootstrap', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const { SKILL_CATEGORIES } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    await runInit(tmp, {});
    const before = checksumAll(tmp);
    const outerLoopNames = Object.entries(SKILL_CATEGORIES).filter(([, c]) => c === 'outer-loop').map(([n]) => n);
    const destSkillsDir = path.join(tmp, '.github', 'skills');
    for (const name of outerLoopNames) {
      assert.ok(!fs.existsSync(path.join(destSkillsDir, name)), `precondition: "${name}" should not exist before add-on run`);
    }

    await runInit(tmp, { withOuterLoop: true });
    const after = checksumAll(tmp);
    // Every file present before the add-on run must be byte-identical after it.
    for (const [rel, sum] of Object.entries(before)) {
      assert.strictEqual(after[rel], sum, `pre-existing file "${rel}" changed during add-on install -- rb-s1 AC3's refusal-to-overwrite was violated`);
    }
    // No pre-existing path should have vanished.
    assert.strictEqual(Object.keys(after).length >= Object.keys(before).length, true, 'add-on run should never remove files');

    const installed = new Set(listSkillNamesUnder(destSkillsDir));
    for (const name of outerLoopNames) {
      assert.ok(installed.has(name), `"${name}" should be added by the add-on run`);
    }
  } finally { rmtmp(tmp); }
});

test('cliParsesWithOuterLoopFlag', () => {
  const binSource = fs.readFileSync(path.join(ROOT, 'cli', 'bin', 'init.js'), 'utf8');
  assert.ok(/--with-outer-loop/.test(binSource), 'cli/bin/init.js should reference --with-outer-loop');
});

test('cliUsageDocumentsAddOnMode', () => {
  const binSource = fs.readFileSync(path.join(ROOT, 'cli', 'bin', 'init.js'), 'utf8');
  assert.ok(/--with-outer-loop/.test(binSource) && /add-on/i.test(binSource),
    'usage/help text should mention --with-outer-loop and describe add-on mode as the supported way to add the outer loop later (AC4)');
});

test('assembledInstructionsDoNotDescribeUninstalledOuterLoopSkillsAsAvailable', async () => {
  // Cross-story finding: scripts/assemble-copilot-instructions.sh (rb-s3) has
  // its own separate, hardcoded OUTER_LOOP_SKILLS array it reads SKILL.md
  // content from unconditionally for the "Progressive Skill Disclosure"
  // section. Before rb-s5, every skill was always installed, so this never
  // surfaced a problem. Now that outer-loop skills are absent by default,
  // the generated CLAUDE.md must not claim a missing skill is "available at
  // session start" (previously rendered as a bogus "(skill file not found)"
  // description).
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const tmp = mktmp();
  try {
    await runInit(tmp, {});
    const claude = fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf8');
    assert.ok(!claude.includes('skill file not found'), 'assembled CLAUDE.md must not describe an uninstalled skill with a "(skill file not found)" placeholder');
    assert.ok(!/\*\*\/discovery\*\*/.test(claude), 'discovery (outer-loop, not installed by default) must not be listed as available at session start');
  } finally { rmtmp(tmp); }
});

test('installableSkills_excludesOuterLoopByDefault_includesWithFlag', () => {
  const { installableSkills } = require('../cli/lib/skills-registry');
  const registry = {
    version: '1',
    skills: [
      { name: 'discovery', category: 'outer-loop' },
      { name: 'branch-setup', category: 'inner-loop' },
      { name: 'orient', category: 'ancillary' }
    ]
  };
  const withoutFlag = installableSkills(registry, false).map(e => e.name).sort();
  assert.deepStrictEqual(withoutFlag, ['branch-setup', 'orient']);
  const withFlag = installableSkills(registry, true).map(e => e.name).sort();
  assert.deepStrictEqual(withFlag, ['branch-setup', 'discovery', 'orient']);
});

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s5] Integration tests\n');

test('freshRepoFlagBehaviour_consistentAcrossBothEntryPoints', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const freshTmp = mktmp();
  const saasTmp = mktmp();
  try {
    const mockFetch = createMockSaasFetch(SAAS_FIXTURE);
    await Promise.all([
      runInit(freshTmp, { withOuterLoop: true }),
      runInit(saasTmp, {
        fromSaas: SAAS_FIXTURE.feature.slug,
        credential: 'synthetic-test-credential-not-a-real-token',
        saasBaseUrl: 'https://saas.test',
        fetchImpl: mockFetch,
        withOuterLoop: true
      })
    ]);
    const freshSkills = listSkillNamesUnder(path.join(freshTmp, '.github', 'skills')).sort();
    const saasSkills = listSkillNamesUnder(path.join(saasTmp, '.github', 'skills')).sort();
    assert.deepStrictEqual(freshSkills, saasSkills, 'both entry points should produce an identical installed skill set with --with-outer-loop');
  } finally { rmtmp(freshTmp); rmtmp(saasTmp); }
});

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s5] NFR tests\n');

test('outerLoopFlagOverheadUnder3Seconds', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const tmpA = mktmp();
  const tmpB = mktmp();
  try {
    const startWithout = Date.now();
    await runInit(tmpA, {});
    const withoutMs = Date.now() - startWithout;

    const startWith = Date.now();
    await runInit(tmpB, { withOuterLoop: true });
    const withMs = Date.now() - startWith;

    const delta = withMs - withoutMs;
    assert.ok(delta < 3000, `--with-outer-loop overhead was ${delta}ms -- expected under 3000ms`);
  } finally { rmtmp(tmpA); rmtmp(tmpB); }
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

(async function main() {
  console.log('\n[rb-s5] Running tests\n');
  for (const { name, fn } of registered) {
    try {
      await fn();
      console.log(`  ✔ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ ${name}`);
      console.error(`    ${err.stack || err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`[rb-s5-optional-outer-loop-install] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();

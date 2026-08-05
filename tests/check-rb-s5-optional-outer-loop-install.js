'use strict';

// rb-s5: Optionally install the full outer loop during bootstrap
// Revised design (2026-08-06, see decisions.md): --with-outer-loop controls
// an enablement signal (context.yml's outerLoop.enabled + the generated
// instruction file's session-start presentation), not which skill files
// exist on disk. Every skill file is always present regardless of the flag,
// preserving rb-s2 AC1 ("the target directory contains the platform's
// complete current skill set... not a subset or placeholder") unconditionally.
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

function readOuterLoopEnabled(tmp) {
  const ctx = fs.readFileSync(path.join(tmp, 'context.yml'), 'utf8');
  const match = ctx.match(/^outerLoop:\r?\n(?:[ \t].*\r?\n?)*/m);
  if (!match) return false;
  const enabledMatch = match[0].match(/^[ \t]+enabled:\s*(true|false)/m);
  return enabledMatch ? enabledMatch[1] === 'true' : false;
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

test('freshRepoWithFlag_enablesOuterLoopSignal_allFilesStillPresent', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const { listSkillDirs } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    await runInit(tmp, { withOuterLoop: true });

    assert.strictEqual(readOuterLoopEnabled(tmp), true, 'context.yml should contain outerLoop.enabled: true');

    const claude = fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf8');
    assert.ok(claude.includes('following outer loop skills are active at session start'),
      'instruction file should present outer-loop skills as active when the flag is used');
    assert.ok(/#### \/discovery/.test(claude), 'discovery should be listed as an active outer-loop skill');

    // rb-s2 AC1 (unconditional, unchanged by this story): every real skill
    // file must be present regardless of the flag.
    const realSkillNames = listSkillDirs(path.join(ROOT, 'skills'));
    const destSkills = listSkillNamesUnder(path.join(tmp, '.github', 'skills'));
    for (const name of realSkillNames) {
      assert.ok(destSkills.includes(name), `skill "${name}" must be present on disk regardless of --with-outer-loop (rb-s2 AC1)`);
    }
  } finally { rmtmp(tmp); }
});

test('withoutFlag_outerLoopSignalDisabled_allFilesStillPresent', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const { listSkillDirs } = require('../cli/lib/skills-registry');
  const tmp = mktmp();
  try {
    await runInit(tmp, {});

    assert.strictEqual(readOuterLoopEnabled(tmp), false, 'context.yml should contain outerLoop.enabled: false (or absent, defaulting false) without the flag');

    const claude = fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf8');
    assert.ok(!claude.includes('following outer loop skills are active at session start'),
      'instruction file must not present outer-loop skills as active without the flag');
    assert.ok(claude.includes('installed, not enabled'),
      'instruction file should name outer-loop skills as installed-but-not-enabled');
    assert.ok(claude.includes('--with-outer-loop'),
      'instruction file should name the exact flag needed to enable the outer loop');

    // rb-s2 AC1 (unconditional): every real skill file present regardless.
    const realSkillNames = listSkillDirs(path.join(ROOT, 'skills'));
    const destSkills = listSkillNamesUnder(path.join(tmp, '.github', 'skills'));
    for (const name of realSkillNames) {
      assert.ok(destSkills.includes(name), `skill "${name}" must be present on disk even without --with-outer-loop (rb-s2 AC1)`);
    }
  } finally { rmtmp(tmp); }
});

test('saasConnectedWithFlag_sameSignalBehaviourAsFreshRepo', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
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

    assert.strictEqual(readOuterLoopEnabled(tmp), true, 'SaaS-connected bootstrap with the flag should also set outerLoop.enabled: true');
    const claude = fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf8');
    assert.ok(claude.includes('following outer loop skills are active at session start'),
      'SaaS-connected instruction file should present outer-loop skills as active, matching the fresh-repo path');

    // Fetched artefact + pipeline-state should still be present alongside the signal.
    assert.ok(fs.existsSync(path.join(tmp, SAAS_FIXTURE.feature.stories[0].dorArtefact)), 'fetched DoR artefact should still be materialized');
  } finally { rmtmp(tmp); }
});

test('addOnModeFlipsSignalWithoutTouchingAnyOtherFile', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const tmp = mktmp();
  try {
    await runInit(tmp, {});
    assert.strictEqual(readOuterLoopEnabled(tmp), false, 'precondition: signal should start disabled');
    const before = checksumAll(tmp);

    await runInit(tmp, { withOuterLoop: true });
    const after = checksumAll(tmp);

    assert.strictEqual(readOuterLoopEnabled(tmp), true, 'outerLoop.enabled should flip to true after the add-on run');

    // Every file present before the add-on run either stays identical, or is
    // one of the two files this flag is explicitly allowed to change
    // (context.yml itself, and the regenerated instruction files).
    const expectedToChange = new Set([
      'context.yml', 'CLAUDE.md', 'AGENTS.md', '.cursorrules',
      path.join('.github', 'copilot-instructions.md')
    ]);
    const unexpectedChanges = [];
    for (const [rel, sum] of Object.entries(before)) {
      if (after[rel] !== sum && !expectedToChange.has(rel)) unexpectedChanges.push(rel);
    }
    assert.deepStrictEqual(unexpectedChanges, [], 'add-on mode must not change any file other than context.yml and the instruction files');

    const newFiles = Object.keys(after).filter(f => !(f in before));
    const removedFiles = Object.keys(before).filter(f => !(f in after));
    assert.deepStrictEqual(newFiles, [], 'add-on mode must not add any new file (every skill file was already present per rb-s2 AC1)');
    assert.deepStrictEqual(removedFiles, [], 'add-on mode must never remove a file');
  } finally { rmtmp(tmp); }
});

test('cliParsesWithOuterLoopFlag', () => {
  const binSource = fs.readFileSync(path.join(ROOT, 'cli', 'bin', 'init.js'), 'utf8');
  assert.ok(/--with-outer-loop/.test(binSource), 'cli/bin/init.js should reference --with-outer-loop');
});

test('cliUsageDocumentsAddOnMode', () => {
  const binSource = fs.readFileSync(path.join(ROOT, 'cli', 'bin', 'init.js'), 'utf8');
  assert.ok(/--with-outer-loop/.test(binSource) && /add-on/i.test(binSource),
    'usage/help text should mention --with-outer-loop and describe add-on mode as the supported way to enable the outer loop later (AC4)');
});

test('ensureOuterLoopSignal_neverDowngradesEnabledBackToFalse', () => {
  const { ensureOuterLoopSignal } = require('../cli/lib/init');
  const tmp = mktmp();
  try {
    fs.writeFileSync(path.join(tmp, 'context.yml'), 'meta:\n  name: test\n', 'utf8');
    const r1 = ensureOuterLoopSignal(tmp, true);
    assert.strictEqual(r1.enabled, true);
    // Re-running WITHOUT the flag must not disable an already-enabled signal
    // -- out of scope per the story: no removal mechanism.
    const r2 = ensureOuterLoopSignal(tmp, false);
    assert.strictEqual(r2.enabled, true, 're-running without the flag must not downgrade an already-enabled outer loop back to disabled');
    assert.strictEqual(r2.changed, false);
  } finally { rmtmp(tmp); }
});

test('installFullSkillSetAndRegistry_stillCopiesEverythingUnconditionally', () => {
  // Guards against a regression back to the reverted file-filtering design --
  // this function must have zero withOuterLoop parameter / branching.
  const initSource = fs.readFileSync(path.join(ROOT, 'cli', 'lib', 'init.js'), 'utf8');
  const fnMatch = initSource.match(/function installFullSkillSetAndRegistry\(([^)]*)\)/);
  assert.ok(fnMatch, 'installFullSkillSetAndRegistry should still exist');
  assert.ok(!/withOuterLoop/.test(fnMatch[1]), 'installFullSkillSetAndRegistry must not take a withOuterLoop parameter -- file installation must stay unconditional (rb-s2 AC1)');
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

    assert.strictEqual(readOuterLoopEnabled(freshTmp), true);
    assert.strictEqual(readOuterLoopEnabled(saasTmp), true);

    const freshSkills = listSkillNamesUnder(path.join(freshTmp, '.github', 'skills')).sort();
    const saasSkills = listSkillNamesUnder(path.join(saasTmp, '.github', 'skills')).sort();
    assert.deepStrictEqual(freshSkills, saasSkills, 'both entry points should install the identical, complete skill-file set regardless of the flag');

    const freshClaude = fs.readFileSync(path.join(freshTmp, 'CLAUDE.md'), 'utf8');
    const saasClaude = fs.readFileSync(path.join(saasTmp, 'CLAUDE.md'), 'utf8');
    const activeSectionOf = (text) => text.slice(text.indexOf('Core Platform Layer'));
    assert.strictEqual(
      activeSectionOf(freshClaude).includes('following outer loop skills are active at session start'),
      activeSectionOf(saasClaude).includes('following outer loop skills are active at session start'),
      'both entry points should present outer-loop skills identically when the flag is used'
    );
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

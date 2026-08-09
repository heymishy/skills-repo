'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

const REPO_ROOT = path.join(__dirname, '..');
const REAL_LEARNINGS_PATH = path.join(REPO_ROOT, 'workspace', 'learnings.md');
const BAKED_FILE_PATH = path.join(REPO_ROOT, 'learnings-count.json');
const LEARNINGS_BACKUP_PATH = path.join(os.tmpdir(), `learnings-backup-${Date.now()}.md`);
const BAKED_BACKUP_PATH = path.join(os.tmpdir(), `learnings-count-backup-${Date.now()}.json`);

(async function() {
  // AC1: the build-time script computes the real count from workspace/learnings.md,
  // cross-checked against getLearningsCount()'s own existing counting logic
  try {
    const { buildLearningsCountInfo } = require('../scripts/write-learnings-count-file');
    delete require.cache[require.resolve('../src/web-ui/content/learnings-count')];
    const { getLearningsCount } = require('../src/web-ui/content/learnings-count');

    const raw = fs.readFileSync(REAL_LEARNINGS_PATH, 'utf8');
    const info = buildLearningsCountInfo(raw);
    const expected = getLearningsCount();

    assert.strictEqual(typeof info.count, 'number', 'expected a numeric count field');
    assert.strictEqual(info.count, expected, `expected buildLearningsCountInfo's count (${info.count}) to match getLearningsCount()'s real count (${expected})`);
    assert(typeof info.computedAt === 'string' && !isNaN(Date.parse(info.computedAt)), 'expected a valid ISO8601 computedAt timestamp');
    pass('writeLearningsCountFile_computesRealCountFromWorkspaceLearnings');
  } catch (e) { fail('writeLearningsCountFile_computesRealCountFromWorkspaceLearnings', e); }

  // AC2: deployed environment (workspace/learnings.md absent, baked file present) ->
  // getLearningsCount() returns the baked value, not 0
  try {
    const hadLearnings = fs.existsSync(REAL_LEARNINGS_PATH);
    if (hadLearnings) fs.renameSync(REAL_LEARNINGS_PATH, LEARNINGS_BACKUP_PATH);
    const hadBaked = fs.existsSync(BAKED_FILE_PATH);
    if (hadBaked) fs.renameSync(BAKED_FILE_PATH, BAKED_BACKUP_PATH);
    try {
      fs.writeFileSync(BAKED_FILE_PATH, JSON.stringify({ count: 42, computedAt: new Date().toISOString() }, null, 2) + '\n', 'utf8');
      delete require.cache[require.resolve('../src/web-ui/content/learnings-count')];
      const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
      const result = getLearningsCount();
      assert.strictEqual(result, 42, `expected the baked file's value (42), got ${result}`);
      pass('getLearningsCount_deployedEnvironment_usesBakedFileWhenWorkspaceAbsent');
    } finally {
      if (fs.existsSync(BAKED_FILE_PATH)) fs.unlinkSync(BAKED_FILE_PATH);
      if (hadBaked) fs.renameSync(BAKED_BACKUP_PATH, BAKED_FILE_PATH);
      if (hadLearnings) fs.renameSync(LEARNINGS_BACKUP_PATH, REAL_LEARNINGS_PATH);
    }
  } catch (e) { fail('getLearningsCount_deployedEnvironment_usesBakedFileWhenWorkspaceAbsent', e); }

  // AC3: local/CI environment (workspace/learnings.md present) -> still reads the
  // real file directly, unregressed, even if a stale baked file also exists
  try {
    const hadBaked = fs.existsSync(BAKED_FILE_PATH);
    if (hadBaked) fs.renameSync(BAKED_FILE_PATH, BAKED_BACKUP_PATH);
    try {
      fs.writeFileSync(BAKED_FILE_PATH, JSON.stringify({ count: 999999, computedAt: new Date().toISOString() }, null, 2) + '\n', 'utf8');
      delete require.cache[require.resolve('../src/web-ui/content/learnings-count')];
      const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
      const raw = fs.readFileSync(REAL_LEARNINGS_PATH, 'utf8');
      const expected = (raw.match(/^## /gm) || []).length;
      const result = getLearningsCount();
      assert.strictEqual(result, expected, `expected the real, live count (${expected}), not the stale baked value; got ${result}`);
      pass('getLearningsCount_localEnvironment_stillReadsRealFileDirectly');
    } finally {
      if (fs.existsSync(BAKED_FILE_PATH)) fs.unlinkSync(BAKED_FILE_PATH);
      if (hadBaked) fs.renameSync(BAKED_BACKUP_PATH, BAKED_FILE_PATH);
    }
  } catch (e) { fail('getLearningsCount_localEnvironment_stillReadsRealFileDirectly', e); }

  // AC4: neither workspace/learnings.md nor the baked file present -> fails open to 0
  try {
    const hadLearnings = fs.existsSync(REAL_LEARNINGS_PATH);
    if (hadLearnings) fs.renameSync(REAL_LEARNINGS_PATH, LEARNINGS_BACKUP_PATH);
    const hadBaked = fs.existsSync(BAKED_FILE_PATH);
    if (hadBaked) fs.renameSync(BAKED_FILE_PATH, BAKED_BACKUP_PATH);
    try {
      delete require.cache[require.resolve('../src/web-ui/content/learnings-count')];
      const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
      let result;
      let threw = false;
      try {
        result = getLearningsCount();
      } catch (e) {
        threw = true;
      }
      assert(!threw, 'expected getLearningsCount() not to throw when both sources are missing');
      assert.strictEqual(result, 0, `expected fallback to 0, got ${result}`);
      pass('getLearningsCount_bothSourcesAbsent_failsOpenToZero');
    } finally {
      if (hadBaked) fs.renameSync(BAKED_BACKUP_PATH, BAKED_FILE_PATH);
      if (hadLearnings) fs.renameSync(LEARNINGS_BACKUP_PATH, REAL_LEARNINGS_PATH);
    }
  } catch (e) { fail('getLearningsCount_bothSourcesAbsent_failsOpenToZero', e); }

  // Malformed baked file (e.g. corrupt JSON) also fails open to 0, not a crash
  try {
    const hadLearnings = fs.existsSync(REAL_LEARNINGS_PATH);
    if (hadLearnings) fs.renameSync(REAL_LEARNINGS_PATH, LEARNINGS_BACKUP_PATH);
    const hadBaked = fs.existsSync(BAKED_FILE_PATH);
    if (hadBaked) fs.renameSync(BAKED_FILE_PATH, BAKED_BACKUP_PATH);
    try {
      fs.writeFileSync(BAKED_FILE_PATH, 'not valid json{{{', 'utf8');
      delete require.cache[require.resolve('../src/web-ui/content/learnings-count')];
      const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
      let result;
      let threw = false;
      try {
        result = getLearningsCount();
      } catch (e) {
        threw = true;
      }
      assert(!threw, 'expected getLearningsCount() not to throw on a malformed baked file');
      assert.strictEqual(result, 0, `expected fallback to 0 for a malformed baked file, got ${result}`);
      pass('getLearningsCount_malformedBakedFile_failsOpenToZero');
    } finally {
      if (fs.existsSync(BAKED_FILE_PATH)) fs.unlinkSync(BAKED_FILE_PATH);
      if (hadBaked) fs.renameSync(BAKED_BACKUP_PATH, BAKED_FILE_PATH);
      if (hadLearnings) fs.renameSync(LEARNINGS_BACKUP_PATH, REAL_LEARNINGS_PATH);
    }
  } catch (e) { fail('getLearningsCount_malformedBakedFile_failsOpenToZero', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();

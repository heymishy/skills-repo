'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

const REAL_LEARNINGS_PATH = path.join(__dirname, '..', 'workspace', 'learnings.md');
const BACKUP_PATH = path.join(os.tmpdir(), `learnings-backup-${Date.now()}.md`);

(async function() {
  // AC1: missing file returns a fallback instead of throwing
  try {
    const hadFile = fs.existsSync(REAL_LEARNINGS_PATH);
    if (hadFile) fs.renameSync(REAL_LEARNINGS_PATH, BACKUP_PATH);
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
      assert(!threw, 'expected getLearningsCount() not to throw when the file is missing');
      assert(typeof result === 'number' && result >= 0, 'expected a non-negative fallback number');
      pass('getLearningsCount_returnsFallback_whenFileMissing');
    } finally {
      if (hadFile) fs.renameSync(BACKUP_PATH, REAL_LEARNINGS_PATH);
    }
  } catch (e) { fail('getLearningsCount_returnsFallback_whenFileMissing', e); }

  // AC2: requiring routes/public.js must not throw when the file is missing
  try {
    const hadFile = fs.existsSync(REAL_LEARNINGS_PATH);
    if (hadFile) fs.renameSync(REAL_LEARNINGS_PATH, BACKUP_PATH);
    try {
      delete require.cache[require.resolve('../src/web-ui/content/learnings-count')];
      delete require.cache[require.resolve('../src/web-ui/routes/public')];
      let threw = false;
      let publicRoutes;
      try {
        publicRoutes = require('../src/web-ui/routes/public');
      } catch (e) {
        threw = true;
      }
      assert(!threw, 'expected require(routes/public) not to throw when learnings.md is missing');
      const req = { session: {} };
      let body = null;
      const res = { setHeader: function() {}, writeHead: function() {}, end: function(data) { body = data; } };
      await publicRoutes.handleRoot(req, res);
      assert(!/<!--LEARNINGS_COUNT-->/.test(body), 'expected the placeholder to be replaced');
      assert(/\d+ and counting/.test(body), 'expected a numeric fallback rendered in place of the count');
      pass('publicRoutes_requireSucceeds_whenLearningsFileMissing');
    } finally {
      if (hadFile) fs.renameSync(BACKUP_PATH, REAL_LEARNINGS_PATH);
    }
  } catch (e) { fail('publicRoutes_requireSucceeds_whenLearningsFileMissing', e); }

  // AC3: happy path unchanged when the file exists
  try {
    delete require.cache[require.resolve('../src/web-ui/content/learnings-count')];
    const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
    const raw = fs.readFileSync(REAL_LEARNINGS_PATH, 'utf8');
    const expected = (raw.match(/^## /gm) || []).length;
    const result = getLearningsCount();
    assert.strictEqual(result, expected, `expected real count ${expected}, got ${result}`);
    pass('getLearningsCount_returnsRealCount_whenFileExists');
  } catch (e) { fail('getLearningsCount_returnsRealCount_whenFileExists', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();

'use strict';
// check-sdg4-ideate-injection.js — TDD unit tests for sdg.4 (Reference content
// injection into /ideate system prompt).
// Tests: T1-T8, matching the DoR's AC-to-test mapping:
//   AC1 -> T1, T2   AC2 -> T3   AC3 -> T4, T5   AC4 -> T6   AC6 -> T7, T8
// AC5 (model grounds >=2/5 questions in strategy) is an accepted MEDIUM gap,
// verified by manual smoke test at DoD time, not automated here (per DoR).
//
// All tests FAIL until buildSystemPrompt (src/web-ui/routes/skills.js)
// actually injects referenceFiles content -- today it silently drops the
// referenceFiles field (see decisions.md finding this session).

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var os     = require('os');

var ROOT        = path.join(__dirname, '..');
var SKILLS_PATH = path.join(ROOT, 'src', 'web-ui', 'routes', 'skills.js');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); return Promise.resolve();
  }
}

function freshSkills() {
  delete require.cache[require.resolve(SKILLS_PATH)];
  return require(SKILLS_PATH);
}

function makeTmpRepo() {
  var root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdg4-test-'));
  fs.mkdirSync(path.join(root, 'artefacts', 'test-feat', 'reference'), { recursive: true });
  return root;
}

function writeRefFile(root, name, content) {
  var relDir = path.join('artefacts', 'test-feat', 'reference');
  fs.writeFileSync(path.join(root, relDir, name), content, 'utf8');
  return path.join(relDir, name).split(path.sep).join('/');
}

// Capture console.log/warn output
function captureLog(fn) {
  var lines = [];
  var origLog  = console.log;
  var origWarn = console.warn;
  console.log  = function() { lines.push(Array.from(arguments).join(' ')); };
  console.warn = function() { lines.push(Array.from(arguments).join(' ')); };
  try { fn(); } finally {
    console.log  = origLog;
    console.warn = origWarn;
  }
  return lines;
}

Promise.resolve()
  // ── T1 — reference section appears after SKILL.md content (AC1) ────────────
  .then(function() { return test('T1: single reference file is injected as "## Strategic context and reference material" section', function() {
    var root = makeTmpRepo();
    try {
      var relPath = writeRefFile(root, 'strategy.md', '# Our Strategy\n\nGrow into APAC markets.');
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('ideate', undefined, root, {
        priorArtefacts: [],
        referenceFiles: [{ path: relPath, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 40 }]
      });
      assert.ok(typeof result === 'string', 'must return a string');
      assert.ok(result.indexOf('## Strategic context and reference material') !== -1, 'must contain the strategic context section header');
      assert.ok(result.indexOf('Grow into APAC markets.') !== -1, 'must contain the reference file content');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T2 — multiple reference files all appear (AC1) ──────────────────────────
  .then(function() { return test('T2: multiple reference files are all present in the injected section', function() {
    var root = makeTmpRepo();
    try {
      var p1 = writeRefFile(root, 'strategy.md', '# Strategy doc one content');
      var p2 = writeRefFile(root, 'market.md', '# Market research doc two content');
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('ideate', undefined, root, {
        priorArtefacts: [],
        referenceFiles: [
          { path: p1, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 30 },
          { path: p2, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 35 }
        ]
      });
      assert.ok(result.indexOf('Strategy doc one content') !== -1, 'must contain first file content');
      assert.ok(result.indexOf('Market research doc two content') !== -1, 'must contain second file content');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T3 — token budget warning when total exceeds 12,000 tokens (AC2) ───────
  .then(function() { return test('T3: [WARN] system prompt exceeds soft token budget is logged when total > 12,000 tokens', function() {
    var root = makeTmpRepo();
    try {
      // 5 files at 9000 chars each (under sdg.3's 10,000-char per-file cap) =
      // 45,000 chars =~ 11,250 tokens from references alone; comfortably
      // pushes the assembled prompt's total estimate over the 12,000 budget.
      var refFiles = [];
      for (var i = 0; i < 5; i++) {
        var p = writeRefFile(root, 'big' + i + '.md', 'a'.repeat(9000));
        refFiles.push({ path: p, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 9000 });
      }
      var skills = freshSkills();
      var lines = captureLog(function() {
        skills.buildSystemPrompt('ideate', undefined, root, { priorArtefacts: [], referenceFiles: refFiles });
      });
      var logText = lines.join('\n');
      assert.ok(/\[WARN\]/.test(logText), '[WARN] must appear in log output');
      assert.ok(/exceeds soft token budget/i.test(logText), 'warning must mention soft token budget');
      assert.ok(/12.?000/.test(logText), 'warning must reference the 12,000 budget');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T4 — largest file truncated with marker when over budget (AC3) ─────────
  .then(function() { return test('T4: largest reference file is truncated with a [TRUNCATED] marker when over budget', function() {
    var root = makeTmpRepo();
    try {
      var small = writeRefFile(root, 'small.md', 'a'.repeat(1000));
      var refFiles = [{ path: small, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 1000 }];
      // 6 files at 9500 chars (under sdg.3's 10,000-char per-file cap) is
      // comfortably enough reference content alone (~14,250 tokens) to push
      // the total over the 12,000 soft budget regardless of skill overhead.
      for (var i = 0; i < 6; i++) {
        var p = writeRefFile(root, 'large' + i + '.md', String.fromCharCode(98 + i).repeat(9500));
        refFiles.push({ path: p, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 9500 });
      }
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('ideate', undefined, root, { priorArtefacts: [], referenceFiles: refFiles });
      assert.ok(result.indexOf('[TRUNCATED') !== -1, 'must contain a [TRUNCATED marker somewhere in the result');
      assert.ok(result.indexOf('remaining content exceeds token budget') !== -1, 'truncation marker must explain why');
      // Not truncated to nothing -- some content from the truncated file must remain
      assert.ok(/[b-g]{10,}/.test(result), 'truncated file must retain a leading portion of its content, not be dropped entirely');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T5 — truncation warning logged separately from the budget warning (AC3) ─
  .then(function() { return test('T5: [WARN] reference file truncated to fit token budget is logged', function() {
    var root = makeTmpRepo();
    try {
      var refFiles = [];
      for (var i = 0; i < 5; i++) {
        var p = writeRefFile(root, 'trunc' + i + '.md', 'z'.repeat(9500));
        refFiles.push({ path: p, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 9500 });
      }
      var skills = freshSkills();
      var lines = captureLog(function() {
        skills.buildSystemPrompt('ideate', undefined, root, { priorArtefacts: [], referenceFiles: refFiles });
      });
      var logText = lines.join('\n');
      assert.ok(/\[WARN\][^\n]*truncated to fit token budget/i.test(logText), 'must log a distinct truncation warning');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T6 — return value is always a single string (AC4) ──────────────────────
  .then(function() { return test('T6: buildSystemPrompt always returns a single string, never array or object', function() {
    var root = makeTmpRepo();
    try {
      var p = writeRefFile(root, 'strategy.md', '# Content');
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('ideate', undefined, root, {
        priorArtefacts: [],
        referenceFiles: [{ path: p, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 10 }]
      });
      assert.strictEqual(typeof result, 'string', 'must be a string');
      assert.ok(!Array.isArray(result), 'must not be an array');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T7 — no referenceFiles field at all → no section, no error (AC6) ───────
  .then(function() { return test('T7: no referenceFiles field present -> section omitted, no error, SKILL.md content intact', function() {
    var root = makeTmpRepo();
    fs.mkdirSync(path.join(root, 'skills', 'ideate'), { recursive: true });
    fs.writeFileSync(path.join(root, 'skills', 'ideate', 'SKILL.md'), '# Ideate skill instructions', 'utf8');
    try {
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('ideate', undefined, root, { priorArtefacts: [] });
      assert.ok(typeof result === 'string' && result.length > 0, 'must return a non-empty string');
      assert.ok(result.indexOf('## Strategic context and reference material') === -1, 'must NOT contain the strategic context section');
      assert.ok(result.indexOf('Ideate skill instructions') !== -1, 'SKILL.md content must still be present, unchanged');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T8 — referenceFiles present but empty array → same as absent (AC6) ─────
  .then(function() { return test('T8: referenceFiles present but empty array -> section omitted, no error', function() {
    var root = makeTmpRepo();
    try {
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('ideate', undefined, root, { priorArtefacts: [], referenceFiles: [] });
      assert.ok(typeof result === 'string', 'must return a string without throwing');
      assert.ok(result.indexOf('## Strategic context and reference material') === -1, 'must NOT contain the strategic context section for an empty referenceFiles array');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── Regression guard — legacy bare-array 4th arg still works (backward compat) ─
  .then(function() { return test('Regression: legacy bare-array priorArtefacts (no referenceFiles wrapper) still works unchanged', function() {
    var root = makeTmpRepo();
    try {
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('ideate', undefined, root, [
        { path: 'artefacts/test-feat/stories/s1.md', content: 'Prior artefact content here' }
      ]);
      assert.ok(typeof result === 'string', 'must return a string');
      assert.ok(result.indexOf('Prior artefact content here') !== -1, 'legacy bare-array priorArtefacts must still be injected as before');
      assert.ok(result.indexOf('## Strategic context and reference material') === -1, 'no reference section when called with a legacy bare array');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  .then(function() {
    console.log('\n[sdg4-ideate-injection] Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failures.length) { failures.forEach(function(f) { console.log('  FAILED: ' + f.name); }); process.exit(1); }
  });

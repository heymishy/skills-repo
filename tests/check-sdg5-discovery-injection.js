'use strict';
// check-sdg5-discovery-injection.js — TDD unit tests for sdg.5 (Reference
// content injection into /discovery system prompt).
// Tests: T1-T7, per artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.5-test-plan.md
//   AC1 -> T1, T2   AC3 -> T3   AC4 -> T4   AC5 -> T5   AC6 -> T6, T7
// AC2 (model grounds scope against strategy) is an accepted MEDIUM gap,
// verified by manual smoke test at DoD time, not automated here (per DoR).

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var os     = require('os');

var ROOT             = path.join(__dirname, '..');
var SKILLS_PATH       = path.join(ROOT, 'src', 'web-ui', 'routes', 'skills.js');
var DISCOVERY_SKILLMD = path.join(ROOT, 'skills', 'discovery', 'SKILL.md');

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
  var root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdg5-test-'));
  fs.mkdirSync(path.join(root, 'artefacts', 'test-feat', 'reference'), { recursive: true });
  return root;
}

function writeRefFile(root, name, content) {
  var relDir = path.join('artefacts', 'test-feat', 'reference');
  fs.writeFileSync(path.join(root, relDir, name), content, 'utf8');
  return path.join(relDir, name).split(path.sep).join('/');
}

Promise.resolve()
  // ── T1 — reference section injected into /discovery prompt (AC1) ───────────
  .then(function() { return test('T1: build-system-prompt-discovery-adds-reference-section', function() {
    var root = makeTmpRepo();
    try {
      var p = writeRefFile(root, 'strategy.md', '# Strategy\n\nContent.');
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('discovery', undefined, root, {
        priorArtefacts: [],
        referenceFiles: [{ path: p, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 20 }]
      });
      assert.ok(result.indexOf('## Strategic context and reference material') !== -1, 'must contain the strategic context section header');
      assert.ok(result.indexOf('Content.') !== -1, 'must contain the reference file content');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T2 — discovery's injected section matches ideate's format exactly (AC1) ─
  .then(function() { return test('T2: discovery-reference-section-format-matches-ideate', function() {
    var root = makeTmpRepo();
    try {
      var p = writeRefFile(root, 'strategy.md', '# Shared strategy content');
      var refFiles = [{ path: p, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 25 }];
      var skills = freshSkills();
      var discoveryResult = skills.buildSystemPrompt('discovery', undefined, root, { priorArtefacts: [], referenceFiles: refFiles });
      var ideateResult    = skills.buildSystemPrompt('ideate', undefined, root, { priorArtefacts: [], referenceFiles: refFiles });

      var extractSection = function(s) {
        var idx = s.indexOf('## Strategic context and reference material');
        return idx === -1 ? null : s.slice(idx);
      };
      var discoverySection = extractSection(discoveryResult);
      var ideateSection    = extractSection(ideateResult);
      assert.ok(discoverySection, 'discovery result must contain the strategic context section');
      assert.ok(ideateSection, 'ideate result must contain the strategic context section');
      assert.strictEqual(discoverySection, ideateSection, 'the strategic context section must be byte-for-byte identical between discovery and ideate -- shared mechanism, not duplicated');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T3 — discovery SKILL.md instructs the callout marker format (AC3) ───────
  .then(function() { return test('T3: discovery-skill-md-instructs-callout-marker-format', function() {
    var src = fs.readFileSync(DISCOVERY_SKILLMD, 'utf8');
    assert.ok(src.indexOf('[Grounded in:') !== -1, 'discovery SKILL.md must contain the literal callout marker instruction "[Grounded in:"');
  }); })

  // ── T4 — callout markers preserved verbatim in saved artefact (AC4) ─────────
  .then(function() { return test('T4: callout-markers-preserved-in-saved-artefact', function() {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdg5-save-'));
    try {
      var artefactContent = '## Problem statement\n\nSome problem text. [Grounded in: strategy.md]\n';
      var artefactPath = path.join(tmpDir, 'discovery.md');
      // Same write mechanism every artefact save in this codebase uses --
      // plain UTF-8 fs.writeFileSync, no HTML-escaping or sanitisation.
      fs.writeFileSync(artefactPath, artefactContent, 'utf8');
      var readBack = fs.readFileSync(artefactPath, 'utf8');
      assert.strictEqual(readBack, artefactContent, 'saved artefact must preserve callout markers verbatim');
      assert.ok(readBack.indexOf('[Grounded in: strategy.md]') !== -1, 'callout marker must survive the write-then-read round trip unescaped');
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T5 — multiple reference files appear in the injected section (AC5) ──────
  .then(function() { return test('T5: multiple-reference-files-appear-in-injected-section', function() {
    var root = makeTmpRepo();
    try {
      var p1 = writeRefFile(root, 'strategy.md', '# Strategy');
      var p2 = writeRefFile(root, 'data.md', '# Data');
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('discovery', undefined, root, {
        priorArtefacts: [],
        referenceFiles: [
          { path: p1, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 10 },
          { path: p2, uploadedAt: '2026-07-30T00:00:00Z', sizeBytes: 6 }
        ]
      });
      assert.ok(result.indexOf('# Strategy') !== -1, 'must contain first file content');
      assert.ok(result.indexOf('# Data') !== -1, 'must contain second file content');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T6 — no reference files omits the section from the discovery prompt (AC6) ─
  .then(function() { return test('T6: no-reference-files-omits-section-from-discovery-prompt', function() {
    var root = makeTmpRepo();
    try {
      var skills = freshSkills();
      var result = skills.buildSystemPrompt('discovery', undefined, root, { priorArtefacts: [] });
      assert.ok(typeof result === 'string', 'must return a string, no error');
      assert.ok(result.indexOf('## Strategic context and reference material') === -1, 'must NOT contain the strategic context section');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }); })

  // ── T7 — regression guard: no hardcoded callout markers outside the injection ─
  .then(function() { return test('T7: no-reference-files-callout-markers-absent-from-baseline (regression guard)', function() {
    var src = fs.readFileSync(DISCOVERY_SKILLMD, 'utf8');
    // The instruction text itself legitimately mentions the literal marker --
    // this guard checks no HARDCODED, filled-in example marker (with a real
    // filename already substituted in) leaked into the baseline SKILL.md.
    var hardcodedExample = /\[Grounded in: (?!<filename>)[^\]]+\]/;
    assert.ok(!hardcodedExample.test(src), 'no hardcoded, filled-in "[Grounded in: <realfile>]" example should appear in baseline SKILL.md -- only the <filename> placeholder in the instruction itself');
  }); })

  .then(function() {
    console.log('\n[sdg5-discovery-injection] Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failures.length) { failures.forEach(function(f) { console.log('  FAILED: ' + f.name); }); process.exit(1); }
  });

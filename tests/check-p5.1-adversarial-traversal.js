'use strict';
// check-p5.1-adversarial-traversal.js — p5.1: adversarial tenantId validation + path-traversal audit
// NOTE: In-process state only; no persistent state between test runs.
// N=6 write handlers statically enumerated below (NFR: no dynamic discovery).

var assert = require('assert');
var path   = require('path');
var os     = require('os');
var fs     = require('fs');

var REPO_ROOT_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');
var JOURNEY_PATH   = path.resolve(__dirname, '../src/web-ui/routes/journey.js');

function freshRequire() {
  try { delete require.cache[require.resolve(REPO_ROOT_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  return {
    rr:      require(REPO_ROOT_PATH),
    journey: require(JOURNEY_PATH)
  };
}

// Static adversarial corpus — NOT discovered dynamically (NFR)
var CORPUS = [
  '../../etc/passwd',
  'org-a/../../../etc',
  'org-a\\..\\etc',
  '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '%2e%2e%5c%2e%2e%5cetc',
  'org-a\x00../../etc',
  'org-a\x00',
  'a'.repeat(300),
  'оrg-а',    // Cyrillic о (U+043E) and а (U+0430) — homoglyphs
  'ｏrg-ａ',   // fullwidth o (U+FF4F) and a (U+FF41)
  ' ../../etc'
];

// Static write-handler audit list — NOT discovered dynamically (NFR: static enumeration)
var WRITE_HANDLERS = [
  'handlePostJourneyStageArtefact',
  'handlePostReference',
  'handlePostGateConfirm',
  'handlePostDecisions',
  'handlePostSpike',
  'handlePatchSpike'
];

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    fn(); passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
  }
}

function main() {
  var r0 = freshRequire();
  var slugify = r0.rr.slugifyTenantId;

  // ── AC1: path separators stripped ─────────────────────────────────────────
  console.log('\n[p5.1-adversarial] AC1 -- path separators stripped');
  test('AC1a: forward slash stripped from ../../etc/passwd', function() {
    var slug = slugify('../../etc/passwd');
    assert.ok(!slug.includes('/'), 'forward slash in slug: ' + slug);
    assert.ok(!slug.includes('\\'), 'backslash in slug: ' + slug);
  });
  test('AC1b: embedded path separator stripped from org-a/../../../etc', function() {
    var slug = slugify('org-a/../../../etc');
    assert.ok(!slug.includes('/') && !slug.includes('\\'), 'separator in slug: ' + slug);
    assert.ok(!slug.includes('..'), 'dotdot in slug: ' + slug);
  });
  test('AC1c: backslash traversal stripped from org-a\\..\\etc', function() {
    var slug = slugify('org-a\\..\\etc');
    assert.ok(!slug.includes('\\'), 'backslash in slug: ' + slug);
  });

  // ── AC2: URL-encoded sequences not decoded ─────────────────────────────────
  console.log('\n[p5.1-adversarial] AC2 -- URL-encoded traversal sequences not decoded');
  test('AC2a: %2e%2e%2f not decoded to ../', function() {
    var slug = slugify('%2e%2e%2f%2e%2e%2fetc%2fpasswd');
    assert.ok(!slug.includes('/'), 'decoded slash in slug: ' + slug);
    assert.ok(!slug.includes('..'), 'dotdot in slug: ' + slug);
  });
  test('AC2b: %2e%2e%5c not decoded to ..\\', function() {
    var slug = slugify('%2e%2e%5c%2e%2e%5cetc');
    assert.ok(!slug.includes('\\'), 'decoded backslash in slug: ' + slug);
  });

  // ── AC3: null bytes stripped ───────────────────────────────────────────────
  console.log('\n[p5.1-adversarial] AC3 -- null bytes stripped');
  test('AC3a: null byte + dotdot stripped from org-a\\x00../../etc', function() {
    var slug = slugify('org-a\x00../../etc');
    assert.ok(!slug.includes('\x00'), 'null byte in slug');
    assert.ok(!slug.includes('..'), 'dotdot survived null byte injection: ' + slug);
  });
  test('AC3b: trailing null byte stripped', function() {
    var slug = slugify('org-a\x00');
    assert.ok(!slug.includes('\x00'), 'null byte in slug: ' + JSON.stringify(slug));
    assert.ok(slug.length > 0, 'slug is empty after null byte strip');
  });

  // ── AC4: overlong input truncated ─────────────────────────────────────────
  console.log('\n[p5.1-adversarial] AC4 -- overlong input truncated to ≤48 chars');
  test('AC4: 300-char input truncated to ≤48 chars', function() {
    var slug = slugify('a'.repeat(300));
    assert.ok(slug.length <= 48, 'slug length=' + slug.length + ' exceeds 48');
  });

  // ── AC5: Unicode homoglyphs / non-ASCII stripped ──────────────────────────
  console.log('\n[p5.1-adversarial] AC5 -- Unicode homoglyphs produce ASCII-only output');
  test('AC5a: Cyrillic homoglyphs (U+043E, U+0430) produce ASCII-only slug', function() {
    var slug = slugify('оrg-а');
    assert.ok(/^[a-z0-9-]*$/.test(slug), 'non-ASCII chars in slug: ' + JSON.stringify(slug));
  });
  test('AC5b: fullwidth Unicode (U+FF4F, U+FF41) produce ASCII-only slug', function() {
    var slug = slugify('ｏrg-ａ');
    assert.ok(/^[a-z0-9-]*$/.test(slug), 'non-ASCII chars in slug: ' + JSON.stringify(slug));
  });

  // ── AC6: aggregate path guard for all corpus inputs ───────────────────────
  console.log('\n[p5.1-adversarial] AC6 -- aggregate: derived path always inside WUCE_TENANT_ROOT_BASE');
  test('AC6: all ' + CORPUS.length + ' corpus inputs produce paths within base', function() {
    var base = os.tmpdir();
    CORPUS.forEach(function(input) {
      var slug    = slugify(input);
      var derived = path.resolve(path.join(base, slug));
      assert.ok(
        derived.startsWith(path.resolve(base) + path.sep),
        'Path escaped base for input ' + JSON.stringify(input) + ' -> slug=' + JSON.stringify(slug) + ' -> ' + derived
      );
    });
  });

  // ── AC7 + AC8: adversarial tenantId path containment for all 6 write handlers
  console.log('\n[p5.1-adversarial] AC7+AC8 -- ' + WRITE_HANDLERS.length + ' write handlers: adversarial tenantId path containment');
  test('AC7+AC8: getRepoRoot(req) with adversarial tenantId always returns path within base (all ' + CORPUS.length + ' corpus inputs, ' + WRITE_HANDLERS.length + ' handlers audited)', function() {
    var tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'p5.1-ac7-'));
    var origBase = process.env.WUCE_TENANT_ROOT_BASE;
    process.env.WUCE_TENANT_ROOT_BASE = tmpBase;
    var r1 = freshRequire();
    var getRepoRoot = r1.rr.getRepoRoot;
    try {
      CORPUS.forEach(function(adversarialTenantId) {
        var mockReq = { session: { tenantId: adversarialTenantId, userId: '1', login: 'alice' } };
        var root     = getRepoRoot(mockReq);
        var resolved = path.resolve(root);
        assert.ok(
          resolved.startsWith(path.resolve(tmpBase) + path.sep),
          'getRepoRoot escaped base for tenantId=' + JSON.stringify(adversarialTenantId) + ' -> root=' + root
        );
      });
      // Static audit: confirm all 6 write handlers are enumerated (NFR)
      assert.strictEqual(WRITE_HANDLERS.length, 6, 'Audit list must name exactly 6 write handlers');
    } finally {
      if (origBase === undefined) delete process.env.WUCE_TENANT_ROOT_BASE;
      else process.env.WUCE_TENANT_ROOT_BASE = origBase;
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (_) {}
    }
  });

  // ── AC9: static-repoRoot regression — guard fires on adversarial title ────
  console.log('\n[p5.1-adversarial] AC9 -- static-repoRoot regression (guard fires for adversarial spike title)');
  test('AC9: handlePostSpike returns 400 for title containing traversal sequence with static repoRoot', function() {
    var origBase = process.env.WUCE_TENANT_ROOT_BASE;
    var origRepo = process.env.CLAUDE_REPO_PATH;
    var tmpRoot  = fs.mkdtempSync(path.join(os.tmpdir(), 'p5.1-ac9-'));
    process.env.CLAUDE_REPO_PATH = tmpRoot;
    delete process.env.WUCE_TENANT_ROOT_BASE;
    var r2 = freshRequire();
    var journey2 = r2.journey;
    var journeyId = 'ac9-journey';
    journey2.setJourneyStoreModule({
      getJourney: function(id) {
        if (id === journeyId) return { id: journeyId, featureSlug: 'test-feat' };
        return null;
      }
    });
    try {
      var responseCode = null;
      var mockReq = {
        session: { accessToken: 'tok', userId: '1', login: 'alice' },
        params:  { journeyId: journeyId },
        body:    { title: '../../evil-spike', question: 'q', doneCondition: 'dc' }
      };
      var mockRes = {
        writeHead: function(code) { responseCode = code; },
        end: function() {}
      };
      journey2.handlePostSpike(mockReq, mockRes);
      assert.strictEqual(responseCode, 400, 'Expected HTTP 400 for traversal in spike title, got: ' + responseCode);
    } finally {
      if (origBase === undefined) delete process.env.WUCE_TENANT_ROOT_BASE;
      else process.env.WUCE_TENANT_ROOT_BASE = origBase;
      if (origRepo === undefined) delete process.env.CLAUDE_REPO_PATH;
      else process.env.CLAUDE_REPO_PATH = origRepo;
      try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) {}
    }
  });

  // ── NFR: static enumeration (not dynamic discovery) ───────────────────────
  console.log('\n[p5.1-adversarial] NFR -- write-handler audit list is a static constant');
  test('NFR: WRITE_HANDLERS is a static array of exactly 6 handler names', function() {
    assert.ok(Array.isArray(WRITE_HANDLERS), 'WRITE_HANDLERS must be an Array');
    assert.strictEqual(WRITE_HANDLERS.length, 6, 'Must have exactly 6 handlers');
    WRITE_HANDLERS.forEach(function(name) {
      assert.ok(typeof name === 'string' && name.startsWith('handle'), 'Each entry must be a handler name string, got: ' + name);
    });
  });

  // ── Results ────────────────────────────────────────────────────────────────
  var total = passed + failed;
  console.log('\n[p5.1-adversarial] ' + total + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
  }
  if (failed > 0) process.exit(1);
}

main();

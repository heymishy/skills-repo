'use strict';

// tests/check-daga-s1-dockerignore-and-writer-safety.js — daga-s1
//
// Found while checking fapg-s1's own live production result ("Looks the
// same on prod to me"): .dockerignore excludes both artefacts/ and
// .github/ from the Docker image, and WUCE_TENANT_ROOT_BASE is confirmed
// unset on this deployment (as-built-diagrams.js's own comment) -- so
// repoRoot resolves to the container's own static image for every
// request, which never contained either directory. This meant aada-s1's
// archived-directory fallback and fapg-s1's per-story accordion, both
// already merged and DoD-complete, never actually took effect in
// production.
//
// Fix 1 (AC1-AC3): remove the artefacts/ and .github/ exclusions from
// .dockerignore.
//
// Fix 2 (AC4-AC5): found during DoR preparation, not the original ask.
// pipelineStateWriter's own existing safety precondition -- "can I read
// .github/pipeline-state.json" -- relied on .github/'s own dockerignore
// exclusion to correctly stay false in a deployed container, causing the
// writer to safely throw (caught and logged by journey.js, never crashing
// the request) rather than silently write to an ephemeral, image-baked,
// never-durable copy. Fix 1 alone would invert that precondition. Fixed
// by checking .git/ presence instead -- .git/ genuinely distinguishes a
// real, committable checkout from a baked image, and stays excluded from
// the Docker image regardless of Fix 1.

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}
async function testAsync(name, fn) {
  try { await fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', (err && err.message) || err); }
}

var DOCKERIGNORE_PATH = path.resolve(__dirname, '../.dockerignore');
var WRITER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-writer.js');

function freshAdapter() {
  try { delete require.cache[require.resolve(WRITER_PATH)]; } catch (_) {}
  return require(WRITER_PATH);
}

function lines() {
  return fs.readFileSync(DOCKERIGNORE_PATH, 'utf8').split('\n').map(function(l) { return l.trim(); });
}

(async function() {
  console.log('\n[daga-s1] AC1 -- no bare artefacts/ or .github/ exclusion line remains');

  test('.dockerignore has no bare "artefacts/" line', function() {
    assert.ok(!lines().includes('artefacts/'), 'expected no bare artefacts/ exclusion line');
  });

  test('.dockerignore has no bare ".github/" line', function() {
    assert.ok(!lines().includes('.github/'), 'expected no bare .github/ exclusion line');
  });

  console.log('\n[daga-s1] AC2 -- .github/scripts/ exclusion still present');

  test('.dockerignore still excludes .github/scripts/', function() {
    assert.ok(lines().includes('.github/scripts/'), 'expected .github/scripts/ to still be excluded');
  });

  console.log('\n[daga-s1] AC3 -- every other pre-existing exclusion unchanged (regression guard)');

  test('.dockerignore still contains every other pre-existing exclusion', function() {
    var content = fs.readFileSync(DOCKERIGNORE_PATH, 'utf8');
    var expected = [
      'node_modules/', '.env', '.env.*', '!.env.example',
      'tests/*', '!tests/e2e/', '.git/', '.worktrees/', '.claude/',
      'scripts/', 'docs/', 'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md',
      'dashboards/', 'coverage/', '*.log', '.vscode/'
    ];
    expected.forEach(function(e) {
      assert.ok(content.indexOf(e) !== -1, 'expected .dockerignore to still contain: ' + e);
    });
  });

  console.log('\n[daga-s1] AC4 -- writer throws when .git/ absent, even with pipeline-state.json present');

  await testAsync('pipelineStateWriterFactory: throws without .git/', async function() {
    var root = fs.mkdtempSync(path.join(os.tmpdir(), 'daga-s1-nogit-'));
    fs.mkdirSync(path.join(root, '.github'), { recursive: true });
    fs.writeFileSync(path.join(root, '.github', 'pipeline-state.json'), JSON.stringify({ features: [] }), 'utf8');
    var factory = freshAdapter();
    var writer = factory(root);
    var threw = false;
    try {
      await writer('any-feature', null, { stage: 'discovery' });
    } catch (e) {
      threw = true;
      assert.ok(/\.git/.test(e.message), 'expected the error message to mention .git/, got: ' + e.message);
    }
    assert.ok(threw, 'expected the writer to throw when .git/ is absent');
    fs.rmSync(root, { recursive: true, force: true });
  });

  console.log('\n[daga-s1] AC5 -- writer succeeds when .git/ present (regression guard)');

  await testAsync('pipelineStateWriterFactory: succeeds with .git/ present', async function() {
    var root = fs.mkdtempSync(path.join(os.tmpdir(), 'daga-s1-withgit-'));
    fs.mkdirSync(path.join(root, '.github'), { recursive: true });
    fs.mkdirSync(path.join(root, '.git'), { recursive: true });
    fs.writeFileSync(path.join(root, '.github', 'pipeline-state.json'), JSON.stringify({ features: [] }), 'utf8');
    var factory = freshAdapter();
    var writer = factory(root);
    await writer('some-feature', null, { stage: 'discovery' });
    var state = JSON.parse(fs.readFileSync(path.join(root, '.github', 'pipeline-state.json'), 'utf8'));
    var found = state.features.find(function(f) { return f.slug === 'some-feature'; });
    assert.ok(found, 'expected the feature entry to be written when .git/ is present');
    fs.rmSync(root, { recursive: true, force: true });
  });

  console.log('\n[daga-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed > 0 ? 1 : 0;
})();

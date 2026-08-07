'use strict';
/**
 * check-csd-s7-as-built-system-architecture-diagram.js -- csd-s7: as-built
 * System Architecture diagram generation via static detection of require()
 * calls to a fixed allowlist of external-service packages.
 *
 * See:
 *   artefacts/2026-07-25-code-shape-diagrams/stories/csd-s7-as-built-system-architecture-diagram.md
 *   artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s7-test-plan.md
 *   artefacts/2026-07-25-code-shape-diagrams/dor/csd-s7-dor.md
 *   artefacts/2026-07-25-code-shape-diagrams/decisions.md (2026-07-26 ARCH entry)
 *
 * Implements this story's 8 tests (3 unit, 2 integration, 3 NFR) from the
 * test plan. Tests against REAL files in this repo (src/web-ui/server.js,
 * which genuinely contains require('stripe') and require('pg');
 * src/web-ui/adapters/journey-store-pg.js, which also genuinely requires
 * 'pg') plus one hand-authored fixture for the zero-services edge case
 * (AC3) and one hand-authored as-designed mermaid fixture (AC5, matching
 * skills/design/SKILL.md's documented System Architecture marker shape).
 *
 * Run: node tests/check-csd-s7-as-built-system-architecture-diagram.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const detector = require('../src/modules/service-call-detector');
const writer = require('../src/modules/migration-schema-parser');
const driftComparator = require('../src/modules/drift-comparator');
const routes = require('../src/web-ui/routes/as-built-system-architecture');

const REPO_ROOT = path.join(__dirname, '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'csd-s7');
const SERVER_JS = path.join(REPO_ROOT, 'src', 'web-ui', 'server.js');
const JOURNEY_STORE_PG_JS = path.join(REPO_ROOT, 'src', 'web-ui', 'adapters', 'journey-store-pg.js');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log('[csd-s7] PASS: ' + name);
    passed++;
  } catch (e) {
    console.error('[csd-s7] FAIL: ' + name + ' -- ' + e.message);
    failures.push(name);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Unit Test 1 (AC1) -- allowlistedRequiresDetectedAndResolvedToServiceNames
// Cross-checked against an independent regex scan of server.js's real text.
// ---------------------------------------------------------------------------
test('allowlistedRequiresDetectedAndResolvedToServiceNames (AC1)', function() {
  const realSource = fs.readFileSync(SERVER_JS, 'utf8');

  const independentRe = /require\(\s*['"](stripe|pg)['"]\s*\)/g;
  let expectedStripeCount = 0;
  let expectedPgCount = 0;
  let m;
  while ((m = independentRe.exec(realSource)) !== null) {
    if (m[1] === 'stripe') expectedStripeCount++;
    if (m[1] === 'pg') expectedPgCount++;
  }
  assert.ok(expectedStripeCount >= 1, 'fixture file has at least one real require(\'stripe\')');
  assert.ok(expectedPgCount >= 1, 'fixture file has at least one real require(\'pg\')');

  const edges = detector.extractServiceRequires(SERVER_JS, { repoRoot: REPO_ROOT });
  const stripeEdges = edges.filter(function(e) { return e.service === 'Stripe'; });
  const postgresEdges = edges.filter(function(e) { return e.service === 'Postgres'; });

  assert.strictEqual(stripeEdges.length, expectedStripeCount, 'detected Stripe edge count matches independent scan');
  assert.strictEqual(postgresEdges.length, expectedPgCount, 'detected Postgres edge count matches independent scan');
  edges.forEach(function(e) { assert.strictEqual(e.from, 'src/web-ui/server.js'); });

  assert.strictEqual(detector.resolveServiceLabel('stripe'), 'Stripe');
  assert.strictEqual(detector.resolveServiceLabel('pg'), 'Postgres');
});

// ---------------------------------------------------------------------------
// Unit Test 2 (AC1, edge case) -- nonAllowlistedRequiresIgnored
// server.js genuinely has many relative requires (./middleware/session,
// ./routes/landing, etc.) alongside its real allowlisted requires -- only
// the allowlisted ones may produce an edge.
// ---------------------------------------------------------------------------
test('nonAllowlistedRequiresIgnored (AC1, edge case)', function() {
  const realSource = fs.readFileSync(SERVER_JS, 'utf8');
  assert.ok(/require\(\s*['"]\.[^'"]+['"]\s*\)/.test(realSource), 'fixture file has at least one real relative require');

  const edges = detector.extractServiceRequires(SERVER_JS, { repoRoot: REPO_ROOT });
  assert.ok(edges.length > 0, 'at least one allowlisted edge detected');

  const allowedServices = ['Stripe', 'Postgres', 'Redis', 'GitHub', 'Anthropic', 'PostHog'];
  edges.forEach(function(e) {
    assert.ok(allowedServices.indexOf(e.service) !== -1, 'edge service "' + e.service + '" is on the fixed allowlist');
  });

  // Node built-ins (http, https, path, fs) also appear as require()
  // specifiers in server.js -- none of them are allowlisted external
  // services, so none may appear as a service label.
  const builtinLikeLeak = edges.some(function(e) {
    return ['http', 'https', 'path', 'fs', 'crypto'].indexOf(e.service) !== -1;
  });
  assert.ok(!builtinLikeLeak, 'node built-in requires never leak through as a service edge');
});

// ---------------------------------------------------------------------------
// Unit Test 3 (AC1, edge case) --
// samePackageRequiredFromMultipleFilesProducesOneServiceNodeNotDuplicates
// server.js and journey-store-pg.js both genuinely require('pg').
// ---------------------------------------------------------------------------
test('samePackageRequiredFromMultipleFilesProducesOneServiceNodeNotDuplicates (AC1, edge case)', function() {
  const result = detector.generateAsBuiltSystemArchitectureDiagram({
    repoRoot: REPO_ROOT,
    sourceFiles: [SERVER_JS, JOURNEY_STORE_PG_JS]
  });

  const postgresEdges = result.edges.filter(function(e) { return e.service === 'Postgres'; });
  assert.ok(postgresEdges.length >= 2, 'multiple Postgres edges detected across the two files');

  const fromFiles = {};
  postgresEdges.forEach(function(e) { fromFiles[e.from] = true; });
  assert.ok(fromFiles['src/web-ui/server.js'], 'server.js contributes a Postgres edge');
  assert.ok(fromFiles['src/web-ui/adapters/journey-store-pg.js'], 'journey-store-pg.js contributes a Postgres edge');

  const mermaid = result.canvasBlock.content.mermaid;
  const postgresNodeDeclarations = mermaid.split('\n').filter(function(line) {
    return /^\s*Postgres\["Postgres"\]\s*$/.test(line);
  });
  assert.strictEqual(postgresNodeDeclarations.length, 1, 'exactly one Postgres node declared, not duplicated');
});

// ---------------------------------------------------------------------------
// Integration Test 4 (AC2, AC5) --
// generatedFlowchartParsesCorrectlyViaDriftComparatorsRealParser
// Feeds a hand-authored as-designed fixture (matching csd-s3's documented
// worked example shape) and this story's real generated as-built output
// into drift-comparator.js's real, UNMODIFIED parseFlowchartMermaid()/
// compareSystemArchitecture() -- proving genuine shape compatibility.
// ---------------------------------------------------------------------------
test('generatedFlowchartParsesCorrectlyViaDriftComparatorsRealParser (AC2, AC5)', function() {
  // Matches skills/design/SKILL.md's documented System Architecture worked
  // example shape exactly (WEBUI[Web UI], cylinder-shape POSTGRES[(Postgres)]).
  const asDesignedMermaid =
    'flowchart TD\n' +
    '    WEBUI[Web UI]\n' +
    '    STRIPE[Stripe]\n' +
    '    POSTGRES[(Postgres)]\n' +
    '    WEBUI --> STRIPE\n' +
    '    WEBUI --> POSTGRES';

  const asBuiltResult = detector.generateAsBuiltSystemArchitectureDiagram({
    repoRoot: REPO_ROOT,
    sourceFiles: [SERVER_JS]
  });
  const asBuiltMermaid = asBuiltResult.canvasBlock.content.mermaid;

  // Prove the real parser (unmodified) can parse both sides without error.
  const parsedAsDesigned = driftComparator.parseFlowchartMermaid(asDesignedMermaid);
  const parsedAsBuilt = driftComparator.parseFlowchartMermaid(asBuiltMermaid);
  assert.ok(Array.isArray(parsedAsDesigned.edges) && parsedAsDesigned.edges.length > 0, 'as-designed fixture parses to real edges');
  assert.ok(Array.isArray(parsedAsBuilt.edges) && parsedAsBuilt.edges.length > 0, 'as-built output parses to real edges');

  // Prove the real, unmodified compareSystemArchitecture() runs end-to-end
  // against genuine generator output and returns a valid signal shape.
  const signal = driftComparator.compareSystemArchitecture(asDesignedMermaid, asBuiltMermaid);
  assert.ok(signal && (signal.status === 'MATCHED' || signal.status === 'DIVERGED'), 'comparison returns a valid status');
  assert.ok(signal.label === 'Matches' || signal.label === 'Diverged');
  assert.ok(Array.isArray(signal.differences), 'differences array present');
});

// ---------------------------------------------------------------------------
// Integration Test 5 (AC4) -- asBuiltSystemArchitectureWrittenAsVersionedArtefactFile
// ---------------------------------------------------------------------------
const TEST_FEATURE_SLUG = '__csd-s7-test-fixture__';
const TEST_FEATURE_DIR = path.join(REPO_ROOT, 'artefacts', TEST_FEATURE_SLUG);

test('asBuiltSystemArchitectureWrittenAsVersionedArtefactFile (AC4 -- integration)', function() {
  const req = { query: { featureSlug: TEST_FEATURE_SLUG } };
  let statusCode = null;
  let body = null;
  const res = {
    writeHead: function(code) { statusCode = code; },
    end: function(payload) { body = payload; }
  };

  routes.handleGetAsBuiltSystemArchitecture(req, res);

  assert.strictEqual(statusCode, 200, 'first request generates and saves the diagram end-to-end');
  const parsedBody = JSON.parse(body);
  assert.strictEqual(parsedBody.ok, true);
  assert.strictEqual(parsedBody.canvasBlock.type, 'system-architecture');

  const diagramsDir = path.join(TEST_FEATURE_DIR, 'diagrams');
  assert.ok(fs.existsSync(diagramsDir), 'diagrams folder created under the feature artefact folder');

  const before = fs.readdirSync(diagramsDir).filter(function(f) { return /^as-built-system-architecture-.*\.json$/.test(f); });
  assert.strictEqual(before.length, 1, 'exactly one as-built-system-architecture-*.json file exists after the first call');

  const savedContent = JSON.parse(fs.readFileSync(path.join(diagramsDir, before[0]), 'utf8'));
  assert.strictEqual(savedContent.type, 'system-architecture');
  assert.ok(savedContent.content && typeof savedContent.content.mermaid === 'string');

  // A second generation call must add a NEW versioned file, never overwrite.
  const req2 = { query: { featureSlug: TEST_FEATURE_SLUG } };
  const res2 = { writeHead: function() {}, end: function() {} };
  routes.handleGetAsBuiltSystemArchitecture(req2, res2);

  const after = fs.readdirSync(diagramsDir).filter(function(f) { return /^as-built-system-architecture-.*\.json$/.test(f); });
  assert.ok(after.length > before.length, 'a new versioned file was added, no existing file was overwritten');
});

// ---------------------------------------------------------------------------
// NFR Test 6 -- zeroServicesFoundProducesValidEmptyFlowchartNotAnError (AC3)
// ---------------------------------------------------------------------------
test('zeroServicesFoundProducesValidEmptyFlowchartNotAnError (AC3)', function() {
  const fixturePath = path.join(FIXTURES_DIR, 'no-external-services.js');
  let thrown = null;
  let result = null;
  try {
    result = detector.generateAsBuiltSystemArchitectureDiagram({
      repoRoot: REPO_ROOT,
      sourceFiles: [fixturePath]
    });
  } catch (e) {
    thrown = e;
  }
  assert.strictEqual(thrown, null, 'zero-services generation never throws');
  assert.strictEqual(result.edges.length, 0, 'zero edges detected');
  assert.strictEqual(result.services.length, 0, 'zero services detected');
  assert.ok(result.canvasBlock.content.mermaid.indexOf('flowchart TD') === 0, 'still a syntactically valid flowchart string');

  // The real, unmodified parser must also accept this as valid input.
  const parsed = driftComparator.parseFlowchartMermaid(result.canvasBlock.content.mermaid);
  assert.strictEqual(parsed.edges.length, 0);
});

// ---------------------------------------------------------------------------
// NFR Test 7 (Security) -- noCredentialOrSecretContentInGeneratedDiagram
// ---------------------------------------------------------------------------
test('noCredentialOrSecretContentInGeneratedDiagram (NFR-Security)', function() {
  const realSource = fs.readFileSync(SERVER_JS, 'utf8');
  assert.ok(/STRIPE_SECRET_KEY/.test(realSource), 'server.js genuinely contains a credential-shaped env var reference near its require calls');

  const result = detector.generateAsBuiltSystemArchitectureDiagram({
    repoRoot: REPO_ROOT,
    sourceFiles: [SERVER_JS]
  });
  const mermaid = result.canvasBlock.content.mermaid;

  const credentialPatterns = [/SECRET/i, /_KEY\b/i, /token\s*=/i, /STRIPE_SECRET_KEY/i, /process\.env/i];
  credentialPatterns.forEach(function(re) {
    assert.ok(!re.test(mermaid), 'generated diagram does not contain credential-shaped pattern: ' + re);
  });

  // Only service names and file paths are present.
  assert.ok(mermaid.indexOf('src/web-ui/server.js') !== -1);
  assert.ok(mermaid.indexOf('Stripe') !== -1 || mermaid.indexOf('Postgres') !== -1);
});

// ---------------------------------------------------------------------------
// NFR Test 8 (Performance) -- staticScanCompletesWithinNormalSessionTimeBudget
// ---------------------------------------------------------------------------
test('staticScanCompletesWithinNormalSessionTimeBudget (NFR-Performance)', function() {
  const start = Date.now();
  const result = detector.generateAsBuiltSystemArchitectureDiagram({ repoRoot: REPO_ROOT });
  const elapsedMs = Date.now() - start;

  assert.ok(result.sourceFiles.length > 0, 'scanned at least one real source file');
  assert.ok(elapsedMs < 5000, 'scanning the full real src/ tree (' + result.sourceFiles.length + ' files) completed in ' + elapsedMs + 'ms (< 5000ms budget)');
});

// ---------------------------------------------------------------------------
// NFR Test (Audit) -- generationEventsAreLogged
// ---------------------------------------------------------------------------
test('generationEventsAreLogged (NFR-Audit)', function() {
  const events = [];
  detector.setLogger({
    info: function(eventName, data) { events.push({ eventName: eventName, data: data }); },
    warn: function() {}
  });

  try {
    detector.generateAsBuiltSystemArchitectureDiagram({
      repoRoot: REPO_ROOT,
      sourceFiles: [SERVER_JS],
      featureSlug: 'csd-s7-audit-test'
    });
    const successEvent = events.find(function(e) { return e.eventName === 'as-built-diagram-generation-succeeded'; });
    assert.ok(successEvent, 'a success event was logged');
    assert.strictEqual(successEvent.data.diagramType, 'system-architecture');
    assert.strictEqual(successEvent.data.featureSlug, 'csd-s7-audit-test');
    assert.ok(successEvent.data.serviceCount >= 1);

    events.length = 0;
    const nonExistentFile = path.join(REPO_ROOT, 'src', 'this-file-does-not-exist-csd-s7.js');
    try {
      detector.generateAsBuiltSystemArchitectureDiagram({
        repoRoot: REPO_ROOT,
        sourceFiles: [nonExistentFile],
        featureSlug: 'csd-s7-audit-test-fail'
      });
    } catch (e) {
      // expected -- a genuine read failure
    }
    const failureEvent = events.find(function(e) { return e.eventName === 'as-built-diagram-generation-failed'; });
    assert.ok(failureEvent, 'a failure event was logged for the unreadable file');
    assert.strictEqual(failureEvent.data.diagramType, 'system-architecture');
    assert.strictEqual(failureEvent.data.featureSlug, 'csd-s7-audit-test-fail');
    assert.ok(failureEvent.data.error && failureEvent.data.error.length > 0);
  } finally {
    detector.setLogger({ info: function() {}, warn: function() {} });
  }
});

// ---------------------------------------------------------------------------
// Cleanup: remove the test-only artefact fixture directory created above so
// no test-generated files pollute the real artefacts/ tree.
// ---------------------------------------------------------------------------
function cleanup() {
  try {
    if (fs.existsSync(TEST_FEATURE_DIR)) {
      fs.rmSync(TEST_FEATURE_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('[csd-s7] cleanup warning: ' + e.message);
  }
}
cleanup();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[csd-s7] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('[csd-s7] Failing tests: ' + failures.join(', '));
  process.exit(1);
}

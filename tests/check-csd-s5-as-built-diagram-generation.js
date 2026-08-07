'use strict';
/**
 * check-csd-s5-as-built-diagram-generation.js -- csd-s5: as-built Data Model
 * diagram generation via static parsing of this repo's real
 * scripts/migrate-schema-*.js files.
 *
 * See:
 *   artefacts/2026-07-25-code-shape-diagrams/stories/csd-s5-as-built-diagram-generation.md
 *   artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s5-test-plan.md
 *   artefacts/2026-07-25-code-shape-diagrams/dor/csd-s5-dor-contract.md
 *
 * Implements this story's 10 tests (6 unit, 2 integration, 2 NFR) from the
 * test plan. Tests against REAL migration files in this repo
 * (scripts/migrate-schema-credits.js, -users.js, -pg.js) plus a small set of
 * hand-authored synthetic fixtures under tests/fixtures/csd-s5/ (modelled on
 * this repo's real migration-file format) for the multi-table/relationship
 * and malformed-file edge cases the real files don't happen to exercise.
 *
 * Scope note (flagged in this story's PR description): decisions.md's only
 * resolved ARCH decision for csd-s5 covers static parsing of migration
 * files for the Data Model diagram. The AC2 tests below
 * (callGraphExtractionReflectsRealMergedCodeStructure,
 * asBuiltGenerationDoesNotRePromptAgentForDescription) are satisfied by a
 * deliberately minimal, real require()-edge extractor
 * (src/modules/call-graph-extractor.js) -- a proof that the same
 * "read real files, never re-prompt an agent" principle holds for Program
 * Design, not a full production System Architecture/Program Design
 * generation pipeline (that scope has no resolved decisions.md entry yet).
 *
 * Run: node tests/check-csd-s5-as-built-diagram-generation.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const parser = require('../src/modules/migration-schema-parser');
const callGraph = require('../src/modules/call-graph-extractor');
const routes = require('../src/web-ui/routes/as-built-diagrams');

const REPO_ROOT = path.join(__dirname, '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'csd-s5');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log('[csd-s5] PASS: ' + name);
    passed++;
  } catch (e) {
    console.error('[csd-s5] FAIL: ' + name + ' -- ' + e.message);
    failures.push(name);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log('[csd-s5] PASS: ' + name);
    passed++;
  } catch (e) {
    console.error('[csd-s5] FAIL: ' + name + ' -- ' + e.message);
    failures.push(name);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Unit Test 1 (AC1) --
// staticParsingExtractsTableColumnRelationshipFromRealMigrationFileFormat
// ---------------------------------------------------------------------------
test('staticParsingExtractsTableColumnRelationshipFromRealMigrationFileFormat (AC1)', function() {
  const fixturePath = path.join(FIXTURES_DIR, 'two-table-fk-migration.js');
  const schema = parser.parseMigrationFile(fixturePath);

  assert.strictEqual(schema.tables.length, 2, 'expected 2 tables');
  const customers = schema.tables.find(function(t) { return t.name === 'customers'; });
  const orders = schema.tables.find(function(t) { return t.name === 'orders'; });
  assert.ok(customers, 'customers table extracted');
  assert.ok(orders, 'orders table extracted');

  const customerIdCol = customers.columns.find(function(c) { return c.name === 'customer_id'; });
  assert.ok(customerIdCol && customerIdCol.isPrimaryKey, 'customers.customer_id is PK');

  const fkCol = orders.columns.find(function(c) { return c.name === 'customer_id'; });
  assert.ok(fkCol && fkCol.references, 'orders.customer_id references another table');
  assert.strictEqual(fkCol.references.table, 'customers');
  assert.strictEqual(fkCol.references.column, 'customer_id');

  assert.strictEqual(orders.foreignKeys.length, 1);
  assert.strictEqual(orders.foreignKeys[0].refTable, 'customers');

  const mermaid = parser.generateErDiagram(schema);
  assert.ok(mermaid.indexOf('erDiagram') === 0, 'starts with erDiagram');
  assert.ok(mermaid.indexOf('customers ||--o{ orders') !== -1, 'relationship line present in mermaid output');
});

// ---------------------------------------------------------------------------
// Unit Test 2 (AC1) -- staticParsingHandlesMultipleMigrationFilesForOneFeature
// ---------------------------------------------------------------------------
test('staticParsingHandlesMultipleMigrationFilesForOneFeature (AC1)', function() {
  const files = [
    path.join(FIXTURES_DIR, 'multi-file-authors.js'),
    path.join(FIXTURES_DIR, 'multi-file-books.js')
  ];
  const schema = parser.parseMigrationFiles(files);

  assert.strictEqual(schema.tables.length, 2, 'both files contributed a table each');
  const names = schema.tables.map(function(t) { return t.name; }).sort();
  assert.deepStrictEqual(names, ['authors', 'books']);

  const books = schema.tables.find(function(t) { return t.name === 'books'; });
  assert.strictEqual(books.foreignKeys.length, 1, 'cross-file relationship detected');
  assert.strictEqual(books.foreignKeys[0].refTable, 'authors');

  const mermaid = parser.generateErDiagram(schema);
  assert.ok(mermaid.indexOf('authors {') !== -1, 'single coherent diagram includes authors');
  assert.ok(mermaid.indexOf('books {') !== -1, 'single coherent diagram includes books');
  assert.ok(mermaid.indexOf('authors ||--o{ books') !== -1, 'cross-file relationship rendered');
});

// ---------------------------------------------------------------------------
// Unit Test 3 (AC2) -- callGraphExtractionReflectsRealMergedCodeStructure
// Uses a real, already-merged file (src/web-ui/routes/auth.js) and
// cross-checks the extractor's output against an independent regex scan of
// that file's actual text -- proving the result is the real structure, not
// a hardcoded expectation.
// ---------------------------------------------------------------------------
test('callGraphExtractionReflectsRealMergedCodeStructure (AC2)', function() {
  const entryFile = path.join(REPO_ROOT, 'src', 'web-ui', 'routes', 'auth.js');
  const realSource = fs.readFileSync(entryFile, 'utf8');

  const independentRe = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  const expectedSpecifiers = [];
  let m;
  while ((m = independentRe.exec(realSource)) !== null) {
    expectedSpecifiers.push(m[1]);
  }
  assert.ok(expectedSpecifiers.length > 0, 'fixture file has at least one relative require');

  const edges = callGraph.extractRequireEdges(entryFile, { repoRoot: REPO_ROOT });
  assert.strictEqual(edges.length, expectedSpecifiers.length, 'extractor found the same number of require edges as an independent scan');

  edges.forEach(function(edge) {
    assert.strictEqual(edge.from, 'src/web-ui/routes/auth.js');
    assert.ok(edge.to.length > 0);
  });

  // Specifically confirm one known real edge (auth.js requires
  // ../modules/user-roles.js) resolves to the real file on disk.
  const rolesEdge = edges.find(function(e) { return e.to.indexOf('modules/user-roles') !== -1; });
  assert.ok(rolesEdge, 'real user-roles require edge extracted');
  assert.ok(fs.existsSync(path.join(REPO_ROOT, rolesEdge.to)), 'resolved edge target exists on disk');
});

// ---------------------------------------------------------------------------
// Unit Test 4 (AC2) -- asBuiltGenerationDoesNotRePromptAgentForDescription
// Source-level inspection: neither generation module invokes any
// model/agent-prompting API -- both read real files directly via fs.
// ---------------------------------------------------------------------------
test('asBuiltGenerationDoesNotRePromptAgentForDescription (AC2)', function() {
  const parserSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'modules', 'migration-schema-parser.js'), 'utf8');
  const callGraphSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'modules', 'call-graph-extractor.js'), 'utf8');
  const combined = parserSrc + '\n' + callGraphSrc;

  const noModelApiCalls = !/anthropic|openai|chat\.completions|\.messages\.create|skillTurnExecutor|prompt\s*:/i.test(combined);
  assert.ok(noModelApiCalls, 'no model/agent-prompting API referenced in the generation modules');

  const readsRealFiles = combined.indexOf('fs.readFileSync') !== -1;
  assert.ok(readsRealFiles, 'generation reads real files directly via fs.readFileSync');
});

// ---------------------------------------------------------------------------
// Unit Test 5 (AC4) --
// malformedMigrationFileFailsWithClearErrorNotSilentEmptyDiagram
// ---------------------------------------------------------------------------
test('malformedMigrationFileFailsWithClearErrorNotSilentEmptyDiagram (AC4)', function() {
  const malformedPath = path.join(FIXTURES_DIR, 'malformed-migration.js');
  let thrown = null;
  try {
    parser.parseMigrationFile(malformedPath);
  } catch (e) {
    thrown = e;
  }
  assert.ok(thrown, 'parseMigrationFile threw for the malformed fixture');
  assert.strictEqual(thrown.name, 'MigrationParseError');
  assert.ok(thrown.message.indexOf('malformed-migration.js') !== -1, 'error names the problem file');
  assert.ok(thrown.message.indexOf('broken_table') !== -1, 'error names the problem table');
});

// ---------------------------------------------------------------------------
// Unit Test 6 (AC4) -- malformedMigrationFileErrorSurfacedToOperatorNotSwallowed
// Runs the actual HTTP route handler (not just the module directly) with the
// malformed fixture injected via the route's D37-style adapter seam, and
// asserts the operator-facing response surfaces the error -- never a 200
// with an empty/incorrect diagram.
// ---------------------------------------------------------------------------
test('malformedMigrationFileErrorSurfacedToOperatorNotSwallowed (AC4)', function() {
  const malformedPath = path.join(FIXTURES_DIR, 'malformed-migration.js');

  routes.setMigrationSchemaParserAdapter({
    generateAsBuiltDataModelDiagram: function() {
      return parser.generateAsBuiltDataModelDiagram({ migrationFiles: [malformedPath] });
    },
    writeAsBuiltDiagramArtefact: parser.writeAsBuiltDiagramArtefact
  });

  try {
    const req = { query: { featureSlug: 'csd-s5-test-fixture' } };
    let statusCode = null;
    let body = null;
    const res = {
      writeHead: function(code) { statusCode = code; },
      end: function(payload) { body = payload; }
    };

    routes.handleGetAsBuiltDataModel(req, res);

    assert.strictEqual(statusCode, 500, 'malformed migration surfaces a non-200 error status');
    const parsedBody = JSON.parse(body);
    assert.strictEqual(parsedBody.ok, false, 'response is NOT ok:true with an empty/incorrect diagram');
    assert.ok(parsedBody.error && parsedBody.error.indexOf('malformed-migration.js') !== -1, 'operator-facing error names the problem file');
    assert.ok(!parsedBody.canvasBlock, 'no canvasBlock is returned on failure');
  } finally {
    routes.setMigrationSchemaParserAdapter(require('../src/modules/migration-schema-parser'));
  }
});

// ---------------------------------------------------------------------------
// Integration Test 7 (AC1, AC2) -- asBuiltGenerationRunsWithinVerifyCompletionSession
// A single request to the route (the "normal session flow" entry point,
// since this story is ordinary application code per ADR-027 -- see PR
// description) produces the as-built Data Model diagram end-to-end, with no
// separate manual trigger.
// ---------------------------------------------------------------------------
const TEST_FEATURE_SLUG = '__csd-s5-test-fixture__';
const TEST_FEATURE_DIR = path.join(REPO_ROOT, 'artefacts', TEST_FEATURE_SLUG);

test('asBuiltGenerationRunsWithinVerifyCompletionSession (AC1, AC2 -- integration)', function() {
  const req = { query: { featureSlug: TEST_FEATURE_SLUG } };
  let statusCode = null;
  let body = null;
  const res = {
    writeHead: function(code) { statusCode = code; },
    end: function(payload) { body = payload; }
  };

  routes.handleGetAsBuiltDataModel(req, res);

  assert.strictEqual(statusCode, 200, 'a single request generates the diagram end-to-end');
  const parsedBody = JSON.parse(body);
  assert.strictEqual(parsedBody.ok, true);
  assert.strictEqual(parsedBody.canvasBlock.type, 'data-model');
  assert.ok(parsedBody.canvasBlock.content.mermaid.indexOf('erDiagram') === 0);
  assert.ok(Array.isArray(parsedBody.sourceFiles) && parsedBody.sourceFiles.length > 0);
});

// ---------------------------------------------------------------------------
// Integration Test 8 (AC3) -- asBuiltDiagramsWrittenAsVersionedArtefactFiles
// ---------------------------------------------------------------------------
test('asBuiltDiagramsWrittenAsVersionedArtefactFiles (AC3 -- integration)', function() {
  const diagramsDir = path.join(TEST_FEATURE_DIR, 'diagrams');
  assert.ok(fs.existsSync(diagramsDir), 'diagrams folder created under the feature artefact folder');

  const before = fs.readdirSync(diagramsDir).filter(function(f) { return /^as-built-data-model-.*\.json$/.test(f); });
  assert.ok(before.length >= 1, 'at least one as-built diagram file exists on disk from the prior request');

  const savedContent = JSON.parse(fs.readFileSync(path.join(diagramsDir, before[0]), 'utf8'));
  assert.strictEqual(savedContent.type, 'data-model');
  assert.ok(savedContent.content && typeof savedContent.content.mermaid === 'string');

  // A second generation call must add a NEW versioned file, never overwrite.
  const req = { query: { featureSlug: TEST_FEATURE_SLUG } };
  const res = { writeHead: function() {}, end: function() {} };
  routes.handleGetAsBuiltDataModel(req, res);

  const after = fs.readdirSync(diagramsDir).filter(function(f) { return /^as-built-data-model-.*\.json$/.test(f); });
  assert.ok(after.length > before.length, 'a new versioned file was added, no existing file was overwritten');
});

// ---------------------------------------------------------------------------
// NFR Test 9 (Performance) -- migrationParsingCompletesWithinNormalSessionTimeBudget
// ---------------------------------------------------------------------------
test('migrationParsingCompletesWithinNormalSessionTimeBudget (NFR-Performance)', function() {
  // Simulate a representative feature with several migration files (NFR
  // text: "5-10 migration files") by combining this repo's 3 real files
  // with the fixture files several times over.
  const realFiles = parser.discoverMigrationFiles(REPO_ROOT);
  const fixtureFiles = [
    path.join(FIXTURES_DIR, 'two-table-fk-migration.js'),
    path.join(FIXTURES_DIR, 'multi-file-authors.js'),
    path.join(FIXTURES_DIR, 'multi-file-books.js')
  ];
  const representativeSet = realFiles.concat(fixtureFiles, fixtureFiles);
  assert.ok(representativeSet.length >= 5, 'representative set has at least 5 files');

  const start = Date.now();
  parser.parseMigrationFiles(representativeSet);
  const elapsedMs = Date.now() - start;

  assert.ok(elapsedMs < 5000, 'parsing ' + representativeSet.length + ' migration files completed in ' + elapsedMs + 'ms (< 5000ms budget)');
});

// ---------------------------------------------------------------------------
// NFR Test 10 (Audit) -- asBuiltGenerationEventsAreLogged
// ---------------------------------------------------------------------------
test('asBuiltGenerationEventsAreLogged (NFR-Audit)', function() {
  const events = [];
  parser.setLogger({
    info: function(eventName, data) { events.push({ eventName: eventName, data: data }); },
    warn: function() {}
  });

  try {
    parser.generateAsBuiltDataModelDiagram({ migrationFiles: [path.join(FIXTURES_DIR, 'two-table-fk-migration.js')], featureSlug: 'csd-s5-audit-test' });
    const successEvent = events.find(function(e) { return e.eventName === 'as-built-diagram-generation-succeeded'; });
    assert.ok(successEvent, 'a success event was logged');
    assert.strictEqual(successEvent.data.diagramType, 'data-model');
    assert.strictEqual(successEvent.data.featureSlug, 'csd-s5-audit-test');
    assert.strictEqual(successEvent.data.tableCount, 2);

    events.length = 0;
    try {
      parser.generateAsBuiltDataModelDiagram({ migrationFiles: [path.join(FIXTURES_DIR, 'malformed-migration.js')], featureSlug: 'csd-s5-audit-test-fail' });
    } catch (e) {
      // expected -- AC4
    }
    const failureEvent = events.find(function(e) { return e.eventName === 'as-built-diagram-generation-failed'; });
    assert.ok(failureEvent, 'a failure event was logged for the malformed migration');
    assert.strictEqual(failureEvent.data.featureSlug, 'csd-s5-audit-test-fail');
    assert.ok(failureEvent.data.error.indexOf('malformed-migration.js') !== -1);
  } finally {
    parser.setLogger({ info: function() {}, warn: function() {} });
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
    console.error('[csd-s5] cleanup warning: ' + e.message);
  }
}
cleanup();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[csd-s5] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('[csd-s5] Failing tests: ' + failures.join(', '));
  process.exit(1);
}

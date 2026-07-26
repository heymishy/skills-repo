'use strict';
/**
 * check-csd-s6-drift-signal.js -- csd-s6: drift signal -- as-designed vs
 * as-built comparison. The FINAL story in the code-shape-diagrams epic: the
 * type-specific comparison mechanism the whole epic exists to deliver.
 *
 * See:
 *   artefacts/2026-07-25-code-shape-diagrams/stories/csd-s6-drift-signal.md
 *   artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s6-test-plan.md
 *   artefacts/2026-07-25-code-shape-diagrams/dor/csd-s6-dor-contract.md
 *
 * Implements this story's 18 tests from the test plan (14 unit, 1
 * integration, 3 NFR) -- the test plan's own detailed test list totals 18
 * even though the DoR's hard-block summary line rounds this to "17"; this
 * file implements every test the test plan itself actually names, which is
 * the authoritative source per this story's own artefact hierarchy.
 *
 * Fixture pairs are hand-authored per the test plan's own "Test Data
 * Strategy" (synthetic pairs constructed to exercise each drift rule
 * precisely) -- see tests/fixtures/csd-s6/drift-fixtures.js. The one
 * integration test additionally drives the REAL
 * src/modules/migration-schema-parser.js (csd-s5) against a real, isolated
 * migration-file fixture so the as-built side of that one test is genuinely
 * freshly generated, not just another hand-authored pair (per the test
 * plan's own "not just isolated fixture pairs" expected result).
 *
 * Run: node tests/check-csd-s6-drift-signal.js
 */

process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = process.env.WUCE_REPOSITORIES || 'test-owner/test-repo';

const assert = require('assert');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const { JSDOM } = require('jsdom');

const comparator      = require('../src/modules/drift-comparator');
const markerExtractor = require('../src/modules/canvas-marker-extractor');
const migrationParser = require('../src/modules/migration-schema-parser');
const routes          = require('../src/web-ui/routes/skills.js');

const F = require('./fixtures/csd-s6/drift-fixtures');

// stis-s1 pattern: never let a real git commit fire from this test file.
routes.setSkillTurnGitCommitAdapter(function csdS6NoOpGitCommitTestMode() { /* no-op */ });

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('[csd-s6] PASS: ' + name); })
    .catch(function(err) {
      failed++;
      const msg = err && err.message ? err.message : String(err);
      failures.push({ name: name, msg: msg });
      console.log('[csd-s6] FAIL: ' + name + '\n       ' + msg);
    });
}

function noopRes() {
  const chunks = [];
  return {
    _chunks: chunks,
    writeHead: function() {},
    write: function(d) { chunks.push(d); },
    end: function(d) { if (d) { chunks.push(d); } }
  };
}

/** Extract just the DOM-update client script IIFE (mirrors csd-s2's own test harness). */
function extractMainScript(html) {
  const marker = 'var form    = document.getElementById("chat-form");';
  const idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the chat-form client script to be present in the rendered HTML');
  const start = html.lastIndexOf('<script>', idx);
  const end   = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected to find enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

let seq = 0;
function uniqueId(label) { seq++; return 'test-csd-s6-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

function canvasMarker(type, contentObj, title) {
  return '---CANVAS-JSON: ' + JSON.stringify({ type: type, title: title || type, content: contentObj }) + '---';
}

/**
 * Build a real rendered page (via handleGetChatHtml), stub window.mermaid,
 * and wire a fetch stub that routes every POST into the REAL
 * handlePostTurnStreamHtml (only the model call itself is stubbed) --
 * follows the exact real-render harness pattern csd-s1/csd-s2 established.
 */
async function buildPage(sessionId, turnText) {
  routes._setHtmlSession(sessionId, {
    skillName: 'ideate', sessionPath: '/tmp/t', systemPrompt: '# ideate',
    turns: [], artefactContent: null, artefactPath: null, done: false,
    journeyId: null, assumptionCardsEnabled: true, canvasBlocks: []
  });

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
    onFirstChunk(0);
    onChunk(turnText);
    return Promise.resolve({ text: turnText, usage: { model: 'stub' } });
  });

  const res = noopRes();
  await routes.handleGetChatHtml(
    { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sessionId } },
    res
  );
  const html = res._chunks.join('');
  const scriptSrc = extractMainScript(html);

  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/skills/ideate/sessions/' + sessionId + '/chat' });
  const win = dom.window;
  win.TextDecoder = TextDecoder;
  win.TextEncoder = TextEncoder;
  win.mermaid = { initialize: function() {}, run: function() { return Promise.resolve(); } };

  win.fetch = function(url, fopts) {
    const body = JSON.parse((fopts && fopts.body) || '{}');
    const streamRes = noopRes();
    return routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sessionId }, body: body },
      streamRes
    ).then(function() {
      const text  = streamRes._chunks.join('');
      const bytes = new TextEncoder().encode(text);
      let served  = false;
      return {
        ok: true,
        body: {
          getReader: function() {
            return {
              read: function() {
                if (served) { return Promise.resolve({ done: true, value: undefined }); }
                served = true;
                return Promise.resolve({ done: false, value: bytes });
              }
            };
          }
        },
        headers: { get: function() { return 'text/event-stream'; } }
      };
    });
  };

  dom.window.eval(scriptSrc);
  return dom;
}

function settle(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms || 400); });
}

const queue = [];

// ===========================================================================
// AC1 -- Data Model drift rule (4 tests)
// ===========================================================================

queue.push(function() {
  return test('identicalDataModelDiagramsProduceNoDrift (AC1)', function() {
    const signal = comparator.compareDataModel(F.DATA_MODEL_IDENTICAL_AS_DESIGNED, F.DATA_MODEL_IDENTICAL_AS_BUILT);
    assert.strictEqual(signal.status, 'MATCHED');
    assert.strictEqual(signal.label, 'Matches');
    assert.deepStrictEqual(signal.differences, []);
  });
});

queue.push(function() {
  return test('addedTableFlagsDataModelDrift (AC1)', function() {
    const signal = comparator.compareDataModel(F.DATA_MODEL_ADDED_TABLE_AS_DESIGNED, F.DATA_MODEL_ADDED_TABLE_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    assert.ok(signal.differences.some(function(d) { return /orders_v2/i.test(d); }), 'expected a difference naming the new table orders_v2');
  });
});

queue.push(function() {
  return test('removedTableFlagsDataModelDrift (AC1)', function() {
    const signal = comparator.compareDataModel(F.DATA_MODEL_REMOVED_TABLE_AS_DESIGNED, F.DATA_MODEL_REMOVED_TABLE_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    assert.ok(signal.differences.some(function(d) { return /stripe_events/i.test(d); }), 'expected a difference naming the missing stripe_events table');
  });
});

queue.push(function() {
  return test('duplicateEntityWhereExistingOneAlreadyCoversItFlagsNonOptimalDesign (AC1, edge case)', function() {
    const signal = comparator.compareDataModel(F.DATA_MODEL_DUPLICATE_AS_DESIGNED, F.DATA_MODEL_DUPLICATE_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    const dupMsg = signal.differences.find(function(d) { return /user_roles/i.test(d); });
    assert.ok(dupMsg, 'expected a difference naming the new user_roles table');
    assert.ok(/team_memberships/i.test(dupMsg), 'expected the message to name the existing entity it duplicates (team_memberships)');
    assert.ok(/ADR-026/.test(dupMsg), 'expected the message to reference ADR-026 (reuse an existing entity/primitive), not a generic "table added" note');
    assert.ok(!/^New table `user_roles` added, no matching entity/.test(dupMsg), 'must NOT be the generic "no matching entity" message -- this is the specific duplicate-detection case');
  });
});

// ===========================================================================
// AC2 -- Program Design drift rule (3 tests)
// ===========================================================================

queue.push(function() {
  return test('identicalProgramDesignProducesNoDrift (AC2)', function() {
    const signal = comparator.compareProgramDesign(F.PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED, F.PROGRAM_DESIGN_IDENTICAL_AS_BUILT);
    assert.strictEqual(signal.status, 'MATCHED');
    assert.deepStrictEqual(signal.differences, []);
  });
});

queue.push(function() {
  return test('restructuredCallStackFlagsProgramDesignDrift (AC2)', function() {
    const signal = comparator.compareProgramDesign(F.PROGRAM_DESIGN_RESTRUCTURED_AS_DESIGNED, F.PROGRAM_DESIGN_RESTRUCTURED_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    assert.ok(signal.differences.length > 0, 'expected at least one structural difference');
  });
});

queue.push(function() {
  return test('renamedLocalVariableDoesNotFlagProgramDesignDrift (AC2, edge case)', function() {
    const signal = comparator.compareProgramDesign(F.PROGRAM_DESIGN_RENAMED_VAR_AS_DESIGNED, F.PROGRAM_DESIGN_RENAMED_VAR_AS_BUILT);
    assert.strictEqual(signal.status, 'MATCHED', 'a pure local-variable rename inside an unchanged file/call structure must NOT flag as drift');
    assert.strictEqual(signal.label, 'Matches');
    assert.deepStrictEqual(signal.differences, []);
  });
});

// ===========================================================================
// AC3 -- System Architecture drift rule (2 tests)
// ===========================================================================

queue.push(function() {
  return test('newServiceCallFlagsSystemArchitectureDrift (AC3)', function() {
    const signal = comparator.compareSystemArchitecture(F.SYSTEM_ARCHITECTURE_NEW_CALL_AS_DESIGNED, F.SYSTEM_ARCHITECTURE_NEW_CALL_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    assert.ok(signal.differences.some(function(d) { return /New Service/i.test(d); }), 'expected a difference naming the new service call');
  });
});

queue.push(function() {
  return test('removedServiceCallFlagsSystemArchitectureDrift (AC3)', function() {
    const signal = comparator.compareSystemArchitecture(F.SYSTEM_ARCHITECTURE_REMOVED_CALL_AS_DESIGNED, F.SYSTEM_ARCHITECTURE_REMOVED_CALL_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    assert.ok(signal.differences.some(function(d) { return /Legacy Service/i.test(d); }), 'expected a difference naming the removed service call');
  });
});

// ===========================================================================
// AC4 -- explicit Matches signal, distinct per type (2 unit tests)
// ===========================================================================

queue.push(function() {
  return test('noDriftAcrossAllThreeTypesShowsExplicitMatchesSignal (AC4)', function() {
    const results = comparator.runDriftCheck({
      dataModel: { asDesigned: F.DATA_MODEL_IDENTICAL_AS_DESIGNED, asBuilt: F.DATA_MODEL_IDENTICAL_AS_BUILT },
      programDesign: { asDesigned: F.PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED, asBuilt: F.PROGRAM_DESIGN_IDENTICAL_AS_BUILT },
      systemArchitecture: { asDesigned: F.SYSTEM_ARCHITECTURE_IDENTICAL_AS_DESIGNED, asBuilt: F.SYSTEM_ARCHITECTURE_IDENTICAL_AS_BUILT },
      featureSlug: 'test-feature'
    });
    const block = comparator.buildDriftSignalCanvasBlock(results);
    assert.strictEqual(block.type, 'drift-signal');
    assert.strictEqual(block.content.items.length, 3, 'expected an explicit item for every diagram type -- never silence');
    block.content.items.forEach(function(item) {
      assert.strictEqual(item.status, 'MATCHED');
      assert.strictEqual(item.label, 'Matches', 'expected an explicit "Matches" label for ' + item.diagramType + ', not silence/absence');
    });
  });
});

queue.push(function() {
  return test('matchesSignalIsDistinctPerDiagramType (AC4, edge case)', function() {
    const results = comparator.runDriftCheck({
      dataModel: { asDesigned: F.DATA_MODEL_IDENTICAL_AS_DESIGNED, asBuilt: F.DATA_MODEL_IDENTICAL_AS_BUILT },
      programDesign: { asDesigned: F.PROGRAM_DESIGN_RESTRUCTURED_AS_DESIGNED, asBuilt: F.PROGRAM_DESIGN_RESTRUCTURED_AS_BUILT },
      featureSlug: 'test-feature'
    });
    assert.strictEqual(results.dataModel.status, 'MATCHED', 'Data Model must show Matches independently');
    assert.strictEqual(results.programDesign.status, 'DIVERGED', 'Program Design must show Diverged independently');
    assert.strictEqual(results.systemArchitecture, undefined, 'a diagram type not supplied must simply be absent, not defaulted to either signal');
  });
});

// ===========================================================================
// AC5 -- diverged signal names the specific difference (3 tests)
// ===========================================================================

queue.push(function() {
  return test('divergedSignalNamesSpecificDifferenceForDataModel (AC5)', function() {
    const signal = comparator.compareDataModel(F.DATA_MODEL_ADDED_TABLE_AS_DESIGNED, F.DATA_MODEL_ADDED_TABLE_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    assert.ok(signal.differences.length > 0);
    signal.differences.forEach(function(d) {
      assert.notStrictEqual(d.trim(), '', 'no difference message may be blank');
      assert.notStrictEqual(d.trim().toLowerCase(), 'diverged', 'no difference message may be a bare "diverged" label with no detail');
    });
    assert.ok(signal.differences.some(function(d) { return /orders_v2/i.test(d) && /as-designed/i.test(d); }), 'expected the message to name the table and reference the as-designed diagram');
  });
});

queue.push(function() {
  return test('divergedSignalNamesSpecificDifferenceForProgramDesign (AC5)', function() {
    const signal = comparator.compareProgramDesign(F.PROGRAM_DESIGN_RESTRUCTURED_AS_DESIGNED, F.PROGRAM_DESIGN_RESTRUCTURED_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    signal.differences.forEach(function(d) {
      assert.notStrictEqual(d.trim(), '');
      assert.notStrictEqual(d.trim().toLowerCase(), 'diverged');
    });
    assert.ok(signal.differences.some(function(d) { return /feature-helper/.test(d); }), 'expected the message to name the specific new module/call involved in the structural change');
  });
});

queue.push(function() {
  return test('divergedSignalNamesSpecificDifferenceForSystemArchitecture (AC5)', function() {
    const signal = comparator.compareSystemArchitecture(F.SYSTEM_ARCHITECTURE_NEW_CALL_AS_DESIGNED, F.SYSTEM_ARCHITECTURE_NEW_CALL_AS_BUILT);
    assert.strictEqual(signal.status, 'DIVERGED');
    signal.differences.forEach(function(d) {
      assert.notStrictEqual(d.trim(), '');
      assert.notStrictEqual(d.trim().toLowerCase(), 'diverged');
    });
    assert.ok(signal.differences.some(function(d) { return /Web UI/.test(d) && /New Service/.test(d); }), 'expected the message to name both endpoints of the specific new call');
  });
});

// ===========================================================================
// Integration test (AC4) -- real end-to-end feature, not just fixture pairs
// ===========================================================================

queue.push(function() {
  return test('driftComparisonRunsWithinVerifyCompletionAndSurfacesInCanvas (Integration, AC4)', async function() {
    // As-designed side: a hand-authored marker matching this repo's REAL
    // scripts/migrate-schema-credits.js table shapes exactly (tenant_id,
    // balance, updated_at / stripe_event_id, event_type, processed_at) --
    // the same naming-convention discipline skills/design/SKILL.md's Data
    // Model marker section (AC3) requires of a real /design session.
    const designMd = [
      '# Design',
      '',
      '## Solution Architecture',
      '',
      canvasMarker('data-model', {
        mermaid: [
          'erDiagram',
          '  CREDITS {',
          '    text tenant_id PK',
          '    integer balance',
          '    timestamptz updated_at',
          '  }',
          '  STRIPE_EVENTS {',
          '    text stripe_event_id PK',
          '    text event_type',
          '    timestamptz processed_at',
          '  }'
        ].join('\n')
      }, 'Data model'),
      ''
    ].join('\n');

    const asDesignedMarker = markerExtractor.extractLatestCanvasMarkerByType(designMd, 'data-model');
    assert.ok(asDesignedMarker, 'expected to extract a real data-model marker from the design.md fixture');

    // As-built side: REAL migration-schema-parser.js (csd-s5), run against
    // this repo's REAL scripts/migrate-schema-credits.js file -- freshly
    // generated, not a hand-authored fixture.
    const realMigrationFile = path.join(REPO_ROOT_FOR_TEST(), 'scripts', 'migrate-schema-credits.js');
    assert.ok(fs.existsSync(realMigrationFile), 'expected the real scripts/migrate-schema-credits.js file to exist');
    const asBuiltResult = migrationParser.generateAsBuiltDataModelDiagram({ migrationFiles: [realMigrationFile], featureSlug: 'csd-s6-integration-test' });

    const matchedSignal = comparator.compareDataModel(asDesignedMarker.content.mermaid, asBuiltResult.canvasBlock.content.mermaid);
    assert.strictEqual(matchedSignal.status, 'MATCHED', 'the as-designed fixture models the real credits/stripe_events tables exactly, so this must MATCH against the freshly-generated real as-built diagram');

    // Now render the MATCHED result in canvas, through the REAL client-side
    // rendering path (not a hand-inspected object) -- "render the result in
    // canvas", not just build a JS object.
    const matchedResults = { dataModel: matchedSignal };
    const matchedBlock = comparator.buildDriftSignalCanvasBlock(matchedResults);

    const sid1 = uniqueId('int-matched');
    const turnText1 = 'Drift check complete.\n\n' + canvasMarker('drift-signal', matchedBlock.content, matchedBlock.title) + '\n\nAll good.';
    const dom1 = await buildPage(sid1, turnText1);
    try {
      await settle();
      const block = dom1.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="drift-signal"]');
      assert.ok(block, 'expected the drift-signal canvas block to render');
      const item = block.querySelector('.cv-drift-item[data-diagram-type="data-model"]');
      assert.ok(item, 'expected a Data Model drift item');
      assert.strictEqual(item.getAttribute('data-drift-status'), 'MATCHED');
      assert.ok(/matches/i.test(item.querySelector('.cv-drift-status-label').textContent), 'expected the rendered label to read Matches');
    } finally {
      dom1.window.close();
    }

    // Now deliberately diverge: a real migration file (isolated tmp fixture,
    // exercising the REAL parser pipeline -- not the real repo's own
    // scripts/ dir) with an extra column not present in the as-designed
    // side, to prove the DIVERGED path also runs end-to-end and renders.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csd-s6-'));
    const tmpMigrationFile = path.join(tmpDir, 'migrate-schema-credits-modified.js');
    fs.writeFileSync(tmpMigrationFile, [
      "'use strict';",
      'async function migrate(db) {',
      '  await db.query(`CREATE TABLE IF NOT EXISTS credits (',
      '    tenant_id  TEXT        PRIMARY KEY,',
      '    balance    INTEGER     NOT NULL DEFAULT 0,',
      '    updated_at TIMESTAMPTZ DEFAULT now(),',
      '    currency   TEXT        NOT NULL DEFAULT \'USD\'',
      '  )`);',
      '}',
      'module.exports = { migrate };'
    ].join('\n'), 'utf8');

    const asBuiltDivergedResult = migrationParser.generateAsBuiltDataModelDiagram({ migrationFiles: [tmpMigrationFile], featureSlug: 'csd-s6-integration-test' });
    const divergedAsDesignedMermaid = [
      'erDiagram',
      '  CREDITS {',
      '    text tenant_id PK',
      '    integer balance',
      '    timestamptz updated_at',
      '  }'
    ].join('\n');
    const divergedSignal = comparator.compareDataModel(divergedAsDesignedMermaid, asBuiltDivergedResult.canvasBlock.content.mermaid);
    assert.strictEqual(divergedSignal.status, 'DIVERGED', 'the modified as-built schema adds a currency column not in as-designed, so this must diverge');
    assert.ok(divergedSignal.differences.some(function(d) { return /currency/i.test(d); }));

    const divergedBlock = comparator.buildDriftSignalCanvasBlock({ dataModel: divergedSignal });
    const sid2 = uniqueId('int-diverged');
    const turnText2 = 'Drift check complete.\n\n' + canvasMarker('drift-signal', divergedBlock.content, divergedBlock.title) + '\n\nReview needed.';
    const dom2 = await buildPage(sid2, turnText2);
    try {
      await settle();
      const block2 = dom2.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="drift-signal"]');
      assert.ok(block2, 'expected the drift-signal canvas block to render for the diverged case');
      const item2 = block2.querySelector('.cv-drift-item[data-diagram-type="data-model"]');
      assert.ok(item2);
      assert.strictEqual(item2.getAttribute('data-drift-status'), 'DIVERGED');
      assert.ok(/diverged/i.test(item2.querySelector('.cv-drift-status-label').textContent));
      assert.ok(/currency/i.test(item2.querySelector('.cv-drift-diffs').textContent), 'expected the specific diverged column to be named in the rendered markup');
    } finally {
      dom2.window.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

function REPO_ROOT_FOR_TEST() { return path.join(__dirname, '..'); }

// ===========================================================================
// NFR tests (3)
// ===========================================================================

queue.push(function() {
  return test('driftComparisonCompletesWithinNormalSessionTimeBudget (NFR: Performance)', function() {
    const start = Date.now();
    comparator.runDriftCheck({
      dataModel: { asDesigned: F.DATA_MODEL_DUPLICATE_AS_DESIGNED, asBuilt: F.DATA_MODEL_DUPLICATE_AS_BUILT },
      programDesign: { asDesigned: F.PROGRAM_DESIGN_RESTRUCTURED_AS_DESIGNED, asBuilt: F.PROGRAM_DESIGN_RESTRUCTURED_AS_BUILT },
      systemArchitecture: { asDesigned: F.SYSTEM_ARCHITECTURE_NEW_CALL_AS_DESIGNED, asBuilt: F.SYSTEM_ARCHITECTURE_NEW_CALL_AS_BUILT },
      featureSlug: 'perf-test'
    });
    const elapsedMs = Date.now() - start;
    // No numeric baseline exists per this story's own NFR test entry --
    // asserting a generous ceiling well inside the /verify-completion
    // session time budget confirms no model-latency-shaped cost was
    // reintroduced into this pure comparison step.
    assert.ok(elapsedMs < 2000, 'expected the drift comparison to complete in well under 2000ms (pure computation, no model calls); took ' + elapsedMs + 'ms');
  });
});

queue.push(function() {
  return test('matchDivergedSignalConveyedByMoreThanColourAlone (NFR: Accessibility, WCAG 2.1 AA)', async function() {
    const results = comparator.runDriftCheck({
      dataModel: { asDesigned: F.DATA_MODEL_IDENTICAL_AS_DESIGNED, asBuilt: F.DATA_MODEL_IDENTICAL_AS_BUILT },
      programDesign: { asDesigned: F.PROGRAM_DESIGN_RESTRUCTURED_AS_DESIGNED, asBuilt: F.PROGRAM_DESIGN_RESTRUCTURED_AS_BUILT }
    });
    const block = comparator.buildDriftSignalCanvasBlock(results);

    const sid = uniqueId('a11y');
    const turnText = 'Here is the drift check.\n\n' + canvasMarker('drift-signal', block.content, block.title) + '\n\nDone.';
    const dom = await buildPage(sid, turnText);
    try {
      await settle();
      const items = dom.window.document.querySelectorAll('#canvas-panel .cv-drift-item');
      assert.strictEqual(items.length, 2, 'expected one rendered item per diagram type supplied');

      Array.prototype.forEach.call(items, function(item) {
        const statusLabelEl = item.querySelector('.cv-drift-status-label');
        assert.ok(statusLabelEl, 'expected an explicit text status label element');
        assert.notStrictEqual(statusLabelEl.textContent.trim(), '', 'the status label text must not be blank -- colour alone is never sufficient (WCAG 2.1 AA)');
        assert.ok(/^(Matches|Diverged)$/.test(statusLabelEl.textContent.trim()), 'expected the visible text to read exactly "Matches" or "Diverged"');

        const iconEl = item.querySelector('.cv-drift-icon');
        assert.ok(iconEl, 'expected an icon element alongside the text label');
        assert.strictEqual(iconEl.getAttribute('aria-hidden'), 'true', 'the icon must be aria-hidden so screen readers rely on the text label, not a decorative glyph');
      });

      const matchedItem = dom.window.document.querySelector('.cv-drift-item[data-drift-status="MATCHED"] .cv-drift-status-label');
      const divergedItem = dom.window.document.querySelector('.cv-drift-item[data-drift-status="DIVERGED"] .cv-drift-status-label');
      assert.ok(matchedItem && /matches/i.test(matchedItem.textContent));
      assert.ok(divergedItem && /diverged/i.test(divergedItem.textContent));
    } finally {
      dom.window.close();
    }
  });
});

queue.push(function() {
  return test('driftResultsAreLogged (NFR: Audit)', function() {
    const events = [];
    comparator.setLogger({
      info: function(eventName, data) { events.push({ eventName: eventName, data: data }); },
      warn: function() {}
    });
    try {
      comparator.runDriftCheck({
        dataModel: { asDesigned: F.DATA_MODEL_ADDED_TABLE_AS_DESIGNED, asBuilt: F.DATA_MODEL_ADDED_TABLE_AS_BUILT },
        programDesign: { asDesigned: F.PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED, asBuilt: F.PROGRAM_DESIGN_IDENTICAL_AS_BUILT },
        systemArchitecture: { asDesigned: F.SYSTEM_ARCHITECTURE_NEW_CALL_AS_DESIGNED, asBuilt: F.SYSTEM_ARCHITECTURE_NEW_CALL_AS_BUILT },
        featureSlug: 'audit-test-feature'
      });

      assert.strictEqual(events.length, 3, 'expected one logged event per diagram type compared');
      const byType = {};
      events.forEach(function(e) { byType[e.data.diagramType] = e; });

      assert.ok(byType['data-model'], 'expected a logged event for data-model');
      assert.strictEqual(byType['data-model'].data.status, 'DIVERGED');
      assert.strictEqual(byType['data-model'].data.featureSlug, 'audit-test-feature');

      assert.ok(byType['program-design']);
      assert.strictEqual(byType['program-design'].data.status, 'MATCHED');

      assert.ok(byType['system-architecture']);
      assert.strictEqual(byType['system-architecture'].data.status, 'DIVERGED');
    } finally {
      comparator.setLogger({ info: function() {}, warn: function() {} });
    }
  });
});

// ===========================================================================
// Runner
// ===========================================================================

(async function run() {
  for (const fn of queue) {
    await fn();
  }

  console.log('\n[csd-s6] ' + passed + ' passed, ' + failed + ' failed (of ' + (passed + failed) + ' total)');
  if (failures.length) {
    console.log('\n[csd-s6] Failures:');
    failures.forEach(function(f) { console.log('  - ' + f.name + ': ' + f.msg); });
  }
  process.exit(failed ? 1 : 0);
})();

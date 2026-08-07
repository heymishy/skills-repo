#!/usr/bin/env node
// check-alrf-s5-artefact-path-traversal-guard.js — AC verification for alrf-s5
// (Path-traversal write vulnerability in the as-built diagram routes.
//  writeAsBuiltDiagramArtefact() joined repoRoot + 'artefacts' + an
//  UNVALIDATED featureSlug taken directly from req.query.featureSlug, with
//  zero traversal check -- any authenticated user could supply
//  featureSlug=../../../../tmp/evil to write a JSON file anywhere the
//  process has filesystem permission. Both as-built-diagrams.js (csd-s5)
//  and as-built-system-architecture.js (csd-s7) share this one writer
//  function, so fixing it once closes both routes. Matches the existing,
//  documented path-traversal guard convention already used in
//  routes/journey.js: path.resolve + startsWith(repoRoot + path.sep),
//  400 on failure, no raw path value in the response.)
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

const { writeAsBuiltDiagramArtefact, ArtefactPathTraversalError } = require('../src/modules/migration-schema-parser');
const dataModelRoutes = require('../src/web-ui/routes/as-built-diagrams');
const systemArchRoutes = require('../src/web-ui/routes/as-built-system-architecture');

function makeRes() {
  return {
    _status: null, _body: '',
    writeHead(status) { this._status = status; },
    end(body) { this._body = body || ''; }
  };
}

function run() {
  // ── AC1: writeAsBuiltDiagramArtefact throws ArtefactPathTraversalError for
  //         a traversal featureSlug, and writes nothing to disk ──
  console.log('\n  AC1 -- writeAsBuiltDiagramArtefact rejects a traversal featureSlug');
  {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s5-'));
    const escapeTarget = path.join(repoRoot, '..', 'alrf-s5-escape-marker');
    let threw = null;
    try {
      writeAsBuiltDiagramArtefact('../../alrf-s5-escape-marker', { type: 'data-model', content: { mermaid: 'erDiagram' } }, { repoRoot });
    } catch (e) { threw = e; }
    ok(threw instanceof ArtefactPathTraversalError, 'AC1: throws ArtefactPathTraversalError');
    ok(!fs.existsSync(escapeTarget), 'AC1: no file/directory created outside repoRoot');
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }

  // ── AC2: a legitimate featureSlug still works (no regression) ──
  console.log('\n  AC2 -- a legitimate featureSlug still writes successfully');
  {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s5-legit-'));
    const filePath = writeAsBuiltDiagramArtefact('2026-07-26-legit-feature', { type: 'data-model', content: { mermaid: 'erDiagram' } }, { repoRoot });
    ok(fs.existsSync(filePath), 'AC2: file written successfully for a normal slug');
    ok(path.resolve(filePath).startsWith(path.resolve(repoRoot) + path.sep), 'AC2: written file is inside repoRoot');
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }

  // ── AC3: GET /api/as-built-diagrams/data-model returns 400 for a traversal
  //         featureSlug, never 500, and does not echo the raw value ──
  console.log('\n  AC3 -- as-built-diagrams.js route returns 400 for a traversal featureSlug');
  {
    const req = { query: { featureSlug: '../../../../tmp/alrf-s5-http-escape' } };
    const res = makeRes();
    dataModelRoutes.handleGetAsBuiltDataModel(req, res);
    eq(res._status, 400, 'AC3: status is 400, not 500');
    const parsed = JSON.parse(res._body);
    eq(parsed.ok, false, 'AC3: ok:false in response body');
    ok(res._body.indexOf('..') === -1, 'AC3: raw traversal value not echoed back in the response body');
  }

  // ── AC4: GET /api/as-built-diagrams/system-architecture returns 400 for a
  //         traversal featureSlug (same shared writer, second route) ──
  console.log('\n  AC4 -- as-built-system-architecture.js route returns 400 for a traversal featureSlug');
  {
    const req = { query: { featureSlug: '../../../../tmp/alrf-s5-http-escape-2' } };
    const res = makeRes();
    systemArchRoutes.handleGetAsBuiltSystemArchitecture(req, res);
    eq(res._status, 400, 'AC4: status is 400, not 500');
    const parsed = JSON.parse(res._body);
    eq(parsed.ok, false, 'AC4: ok:false in response body');
    ok(res._body.indexOf('..') === -1, 'AC4: raw traversal value not echoed back in the response body');
  }

  console.log('\n[alrf-s5-artefact-path-traversal-guard] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();

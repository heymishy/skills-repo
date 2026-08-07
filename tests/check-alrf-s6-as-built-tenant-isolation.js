#!/usr/bin/env node
// check-alrf-s6-as-built-tenant-isolation.js — AC verification for alrf-s6
// (Tenant-isolation bypass in the as-built diagram routes. as-built-diagrams.js
//  (csd-s5) and as-built-system-architecture.js (csd-s7) each had a private
//  _repoRoot() that ignored req entirely and always resolved to the server's
//  own static checkout -- bypassing adapters/repo-root.js's canonical,
//  tenant-aware getRepoRoot(req) (the wuce-multi-tenancy epic's
//  WUCE_TENANT_ROOT_BASE + req.session.tenantId resolver). Dormant on this
//  deployment today (WUCE_TENANT_ROOT_BASE unset everywhere), but would have
//  silently bypassed per-tenant repo isolation -- and let two tenants with
//  the same feature slug collide on one artefact file -- the moment that
//  config is turned on.)
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

function makeRes() {
  return {
    _status: null, _body: '',
    writeHead(status) { this._status = status; },
    end(body) { this._body = body || ''; }
  };
}

function run() {
  const tenantBase = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s6-tenant-base-'));
  process.env.WUCE_TENANT_ROOT_BASE = tenantBase;

  // ── AC1: as-built-diagrams.js resolves repoRoot per-tenant, not the shared server root ──
  console.log('\n  AC1 -- as-built-diagrams.js uses the tenant-aware repoRoot, not the server\'s own checkout');
  {
    delete require.cache[require.resolve('../src/web-ui/routes/as-built-diagrams')];
    const routes = require('../src/web-ui/routes/as-built-diagrams');
    let capturedRepoRoot = null;
    routes.setMigrationSchemaParserAdapter({
      generateAsBuiltDataModelDiagram: function(opts) {
        capturedRepoRoot = opts.repoRoot;
        return { canvasBlock: { type: 'data-model', content: { mermaid: 'erDiagram' } }, sourceFiles: [] };
      },
      writeAsBuiltDiagramArtefact: function(featureSlug, block, opts) {
        return path.join(opts.repoRoot, 'artefacts', featureSlug, 'diagrams', 'as-built-data-model-x.json');
      }
    });
    const req = { query: { featureSlug: 'tenant-a-feature' }, session: { tenantId: 'tenant-a' } };
    const res = makeRes();
    routes.handleGetAsBuiltDataModel(req, res);
    ok(capturedRepoRoot !== null, 'AC1: repoRoot was passed to the detector');
    ok(capturedRepoRoot.indexOf(tenantBase) === 0, 'AC1: repoRoot resolves under WUCE_TENANT_ROOT_BASE, not the server\'s own checkout');
    ok(capturedRepoRoot.indexOf('tenant-a') !== -1, 'AC1: repoRoot includes the requesting tenant\'s own slug');
  }

  // ── AC2: same for as-built-system-architecture.js ──
  console.log('\n  AC2 -- as-built-system-architecture.js uses the tenant-aware repoRoot');
  {
    delete require.cache[require.resolve('../src/web-ui/routes/as-built-system-architecture')];
    const routes = require('../src/web-ui/routes/as-built-system-architecture');
    let capturedRepoRoot = null;
    routes.setServiceCallDetectorAdapter({
      generateAsBuiltSystemArchitectureDiagram: function(opts) {
        capturedRepoRoot = opts.repoRoot;
        return { canvasBlock: { type: 'system-architecture', content: { mermaid: 'flowchart TD' } }, services: [], sourceFiles: [] };
      }
    });
    routes.setDiagramWriterAdapter({
      writeAsBuiltDiagramArtefact: function(featureSlug, block, opts) {
        return path.join(opts.repoRoot, 'artefacts', featureSlug, 'diagrams', 'as-built-system-architecture-x.json');
      }
    });
    const req = { query: { featureSlug: 'tenant-b-feature' }, session: { tenantId: 'tenant-b' } };
    const res = makeRes();
    routes.handleGetAsBuiltSystemArchitecture(req, res);
    ok(capturedRepoRoot !== null, 'AC2: repoRoot was passed to the detector');
    ok(capturedRepoRoot.indexOf(tenantBase) === 0, 'AC2: repoRoot resolves under WUCE_TENANT_ROOT_BASE');
    ok(capturedRepoRoot.indexOf('tenant-b') !== -1, 'AC2: repoRoot includes the requesting tenant\'s own slug');
  }

  // ── AC3: two different tenants resolve to two different repoRoots (no collision) ──
  console.log('\n  AC3 -- two different tenants never resolve to the same repoRoot');
  {
    delete require.cache[require.resolve('../src/web-ui/routes/as-built-diagrams')];
    const routes = require('../src/web-ui/routes/as-built-diagrams');
    const seen = [];
    routes.setMigrationSchemaParserAdapter({
      generateAsBuiltDataModelDiagram: function(opts) {
        seen.push(opts.repoRoot);
        return { canvasBlock: { type: 'data-model', content: { mermaid: 'erDiagram' } }, sourceFiles: [] };
      },
      writeAsBuiltDiagramArtefact: function(featureSlug, block, opts) {
        return path.join(opts.repoRoot, 'artefacts', featureSlug, 'diagrams', 'x.json');
      }
    });
    routes.handleGetAsBuiltDataModel({ query: { featureSlug: 'same-slug' }, session: { tenantId: 'tenant-x' } }, makeRes());
    routes.handleGetAsBuiltDataModel({ query: { featureSlug: 'same-slug' }, session: { tenantId: 'tenant-y' } }, makeRes());
    eq(seen.length, 2, 'AC3: both requests reached the detector');
    ok(seen[0] !== seen[1], 'AC3: tenant-x and tenant-y resolve to different repoRoots for the SAME feature slug (no cross-tenant collision)');
  }

  process.env.WUCE_TENANT_ROOT_BASE = '';
  delete process.env.WUCE_TENANT_ROOT_BASE;
  fs.rmSync(tenantBase, { recursive: true, force: true });

  console.log('\n[alrf-s6-as-built-tenant-isolation] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();

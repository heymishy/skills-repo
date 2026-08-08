'use strict';
const assert = require('assert');

// kbsf-s1: confirms all three kanban response paths (product, org, tenant
// scope) are wrapped via html-shell.js's renderShell() -- not sent as a raw
// renderKanban() fragment -- so the shared design-token :root block that
// renderKanban()'s own <style> block depends on (var(--surface) etc.) is
// actually present in the response. Before this fix, none of the three call
// sites wrapped the fragment, so every token resolved to nothing and the
// board rendered unstyled in production.
//
// Story: artefacts/2026-08-08-kanban-board-unstyled-shell-fix/stories/kbsf-s1-wrap-kanban-html-in-shared-shell.md
// Test plan: artefacts/2026-08-08-kanban-board-unstyled-shell-fix/test-plans/kbsf-s1-test-plan.md

function makeMockRes() {
  const res = { _raw: null, _headers: {}, _statusCode: null };
  res.writeHead = function(code, hdrs) { this._statusCode = code; if (hdrs) Object.assign(this._headers, hdrs); return this; };
  res.end = function(data) { this._raw = data; return this; };
  return res;
}

function assertShellWrapped(raw, label) {
  assert(typeof raw === 'string' && raw.length > 0, label + ': expected a non-empty response body');
  assert(raw.includes('<!doctype html>'), label + ': expected the response to be a full shell document (<!doctype html>), not a bare renderKanban() fragment');
  assert(/:root\s*\{/.test(raw), label + ': expected the shared design-token :root block (from html-shell.js DESIGN_SYSTEM_CSS) to be present in the response');
  assert(raw.includes('kb-board') || raw.includes('kb-column') || raw.includes('kb-card') || raw.includes('kb-empty'), label + ': expected the actual kanban board markup to still be present inside the shell');
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(async function() {
  require('../src/web-ui/modules/posthog-flags').setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });
  const { handleGetProductKanban, handleGetOrgKanban, handleGetDashboard } = require('../src/web-ui/routes/products');

  const tenantId = 'tenant-kbsf-1';

  // AC1 — product scope
  try {
    const pool = {
      query: async function(sql, params) {
        if (/SELECT tenant_id FROM products WHERE product_id/i.test(sql)) return { rows: [{ tenant_id: tenantId }] };
        if (/FROM journeys WHERE.*product_id/i.test(sql)) return { rows: [] };
        return { rows: [] };
      }
    };
    const req = { params: { id: 'product-1' }, session: { tenantId: tenantId, login: 'kbsf-tester' } };
    const res = makeMockRes();
    await handleGetProductKanban(req, res, function() {}, pool, { capture: function() {} });
    assertShellWrapped(res._raw, 'AC1 (product scope)');
    pass('sendKanbanHtml_wrapsResponseInSharedShell_forProductScope');
  } catch (e) { fail('sendKanbanHtml_wrapsResponseInSharedShell_forProductScope', e); }

  // AC2 — org scope
  try {
    const pool = {
      query: async function(sql) {
        if (/SELECT product_id, name FROM products WHERE tenant_id/i.test(sql)) return { rows: [] };
        return { rows: [] };
      }
    };
    const req = { query: {}, session: { tenantId: tenantId, login: 'kbsf-tester' } };
    const res = makeMockRes();
    await handleGetOrgKanban(req, res, function() {}, pool, { capture: function() {} });
    assertShellWrapped(res._raw, 'AC2 (org scope)');
    pass('sendKanbanHtml_wrapsResponseInSharedShell_forOrgScope');
  } catch (e) { fail('sendKanbanHtml_wrapsResponseInSharedShell_forOrgScope', e); }

  // AC3 — tenant scope (?view=board)
  try {
    const pool = {
      query: async function(sql) {
        if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(sql)) return { rows: [] };
        if (/AND product_id IS NULL/i.test(sql)) return { rows: [] };
        return { rows: [] };
      }
    };
    const req = { query: { view: 'board' }, session: { tenantId: tenantId, login: 'kbsf-tester' } };
    const res = makeMockRes();
    await handleGetDashboard(req, res, function() {}, pool);
    assertShellWrapped(res._raw, 'AC3 (tenant scope)');
    pass('sendKanbanHtml_wrapsResponseInSharedShell_forTenantScope');
  } catch (e) { fail('sendKanbanHtml_wrapsResponseInSharedShell_forTenantScope', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();

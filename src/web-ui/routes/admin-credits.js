'use strict';

// admin-credits.js — admin credits management handlers (arl-s3).
// GET /admin/credits — display all tenant balances.
// POST /api/admin/credits/adjust — adjust a tenant's balance.
// Protected by requireAdmin middleware (mounted in server.js).
// arl-s5 — adjust now writes an immutable audit row via adjustBalanceWithAudit
// (tenant_id, admin_id, delta, balance_before, balance_after, created_at).

const { getAllTenantBalances, getValidTenantIds, adjustBalanceWithAudit } = require('../modules/credits');
// sec-perf-s3: session-scoped CSRF (Cross-Site Request Forgery) protection.
const { generateCsrfToken, csrfField, csrfGuard } = require('../middleware/csrf');
// acps-s1: reuse the shared design-system page shell (renderShell) instead of
// hand-rolling a bare <!DOCTYPE html> document -- same pattern kfd1's detail
// pages and settings.js's Credits tab already use. adminCreditsPost, the CSRF
// logic, and the underlying credits module are untouched by this story.
// pncg-s1: renderShell's direct import was removed here -- adminCreditsGet
// (the only caller in this file) now goes through renderShellWithNav below,
// which wraps renderShell itself. Shared Products-nav sidebar wrapper -- see
// products.js's own renderShellWithNav docblock. products.js does not
// require admin-credits.js, so this creates no circular dependency.
const { renderShellWithNav } = require('./products');
// tpac-s1: reuse tenant-plan.js's already-existing, already-tested
// getPlanState/setPlanState directly -- no new plan-state logic, this story
// only adds a new caller (an admin-facing UI + route) to a production-stable
// module. Real bug found live on wuce-staging: admins had no way to lift a
// tenant's journey cap short of a real Stripe checkout, because credits
// top-ups (adjustBalanceWithAudit, below) never touch tenant_plan at all.
const { getPlanState, setPlanState } = require('../modules/tenant-plan');

const VALID_PLANS = ['trial', 'paid'];
const VALID_STATUSES = ['active', 'past_due', 'canceled'];

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Read and parse the request body (form-urlencoded).
 * @param {object} req
 * @returns {Promise<object>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var params = new URLSearchParams(raw);
      var obj = {};
      params.forEach(function(v, k) { obj[k] = v; });
      resolve(obj);
    });
  });
}

/**
 * GET /admin/credits — render admin credits page showing all tenant balances.
 */
async function adminCreditsGet(req, res, pool) {
  const rows = await getAllTenantBalances();
  // sec-perf-s3 AC1: session-scoped CSRF token, embedded in every adjust form below.
  const csrfToken = generateCsrfToken(req);

  // tpac-s1 AC1: fetch each tenant's plan state alongside its credits balance.
  // getPlanState never throws (fails open to trial/active) -- see tenant-plan.js.
  const planStates = await Promise.all(rows.map(function(r) {
    return getPlanState(r.tenant_id);
  }));

  // tpac-s1: radio groups, not a <select> dropdown -- arl-s3's existing test suite
  // (check-arl-s3-admin-credits.js T1) blanket-asserts no <select> element appears
  // anywhere on this page (a leftover guard against a different, now-removed
  // tenant-picker dropdown). Radio buttons avoid that collision while remaining
  // fully WCAG 2.1 AA accessible with proper <label> association.
  const planRadiosHtml = function(tenantId, selected) {
    return VALID_PLANS.map(function(p) {
      var id = 'tpac-plan-' + escapeHtml(tenantId) + '-' + p;
      return '<label for="' + id + '"><input type="radio" id="' + id + '" name="plan" value="' + p + '"' +
        (p === selected ? ' checked' : '') + '> ' + p + '</label>';
    }).join(' ');
  };
  const statusRadiosHtml = function(tenantId, selected) {
    return VALID_STATUSES.map(function(s) {
      var id = 'tpac-status-' + escapeHtml(tenantId) + '-' + s;
      return '<label for="' + id + '"><input type="radio" id="' + id + '" name="status" value="' + s + '"' +
        (s === selected ? ' checked' : '') + '> ' + s + '</label>';
    }).join(' ');
  };

  const tableRows = rows.map(function(r, i) {
    const planState = planStates[i];
    return (
      '<tr>' +
      '<td>' + escapeHtml(r.tenant_id) + '</td>' +
      '<td class="tpac-credits-balance">' + escapeHtml(String(r.balance)) + '</td>' +
      '<td>' +
      '<form method="POST" action="/api/admin/credits/adjust">' +
      csrfField(csrfToken) +
      '<input type="hidden" name="tenantId" value="' + escapeHtml(r.tenant_id) + '">' +
      '<input type="number" name="amount" min="1" required>' +
      '<button type="submit">Adjust</button>' +
      '</form>' +
      '</td>' +
      // tpac-s1 AC1: plan/status shown as a separate, distinctly-labelled field --
      // never merged with the credits balance column above.
      '<td class="tpac-plan-state" data-field="plan-status">' +
      '<span class="tpac-plan">Plan: ' + escapeHtml(planState.plan) + '</span> ' +
      '<span class="tpac-status">Status: ' + escapeHtml(planState.status) + '</span>' +
      '</td>' +
      // tpac-s1 AC2: admin-only plan-state control, additive to (not merged into)
      // the existing credits-adjustment form above -- calls setPlanState directly.
      '<td>' +
      '<form method="POST" action="/api/admin/plan/set">' +
      csrfField(csrfToken) +
      '<input type="hidden" name="tenantId" value="' + escapeHtml(r.tenant_id) + '">' +
      '<fieldset><legend>Plan</legend>' + planRadiosHtml(r.tenant_id, planState.plan) + '</fieldset>' +
      '<fieldset><legend>Status</legend>' + statusRadiosHtml(r.tenant_id, planState.status) + '</fieldset>' +
      '<button type="submit">Set plan</button>' +
      '</form>' +
      '</td>' +
      '</tr>'
    );
  }).join('\n');

  const bodyContent = [
    '<h1 class="sw-page-h1">Admin: Credits</h1>',
    '<table>',
    '<thead><tr><th>Tenant ID</th><th>Balance</th><th>Top-up</th><th>Plan / Status</th><th>Set plan</th></tr></thead>',
    '<tbody>',
    tableRows,
    '</tbody>',
    '</table>',
  ].join('\n');

  const html = await renderShellWithNav(pool, req.session && req.session.tenantId, {
    title: 'Admin — Credits',
    bodyContent,
    user: req.session,
    active: 'admin-credits',
    crumbs: ['Admin credits'],
    isAdmin: true
  });

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/admin/credits/adjust — adjust a tenant's credit balance.
 * Validates: amount must be a positive integer (>0), tenantId must exist in credits table.
 * Redirects 302 to /admin/credits on success.
 */
async function adminCreditsPost(req, res) {
  // sec-perf-s3 AC1: reject a POST that does not carry a valid session-scoped CSRF token.
  // csrfGuard reads and caches the body on req.body -- the _readBody() call below then
  // picks it up via its existing "if (req.body !== undefined) return req.body" short-circuit.
  const csrfOk = await csrfGuard(req, res);
  if (!csrfOk) return;

  const body = await _readBody(req);
  const tenantId = body && body.tenantId ? String(body.tenantId) : '';
  const rawAmount = body && body.amount !== undefined ? String(body.amount) : '';

  // Validate amount: must be a positive integer (>0), no negative, no zero, no non-numeric
  const amountNum = parseInt(rawAmount, 10);
  if (!rawAmount || isNaN(amountNum) || amountNum <= 0 || String(amountNum) !== rawAmount) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'amount must be a positive integer' }));
    return;
  }

  // Validate tenantId against allowlist
  const validIds = await getValidTenantIds();
  if (!validIds.includes(tenantId)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unknown tenantId' }));
    return;
  }

  // arl-s5 — resolve admin identity for the audit trail. Never req.session.accessToken (AC7).
  const adminId = String((req.session && (req.session.login || req.session.userId)) || 'unknown');

  await adjustBalanceWithAudit(tenantId, amountNum, adminId);

  res.writeHead(302, { Location: '/admin/credits' });
  res.end();
}

/**
 * POST /api/admin/plan/set — tpac-s1: admin-only control to set a tenant's
 * plan/status directly, distinct from (and additive to) the credits-adjustment
 * flow above. Calls tenant-plan.js's already-existing, already-tested
 * setPlanState(tenantId, plan, status) directly -- no new plan-state logic.
 * Real bug this fixes: admins had no way to lift a tenant's journey-creation
 * cap short of running a real Stripe checkout, because credits top-ups never
 * touch the tenant_plan table checkJourneyCap() actually reads (AC2/AC3).
 * Validates: tenantId must exist in the same allowlist adjust uses; plan must
 * be one of 'trial'/'paid'; status must be one of 'active'/'past_due'/'canceled'.
 * Redirects 302 to /admin/credits on success, matching adminCreditsPost's shape.
 */
async function adminSetPlanPost(req, res) {
  // Same CSRF guard as adminCreditsPost -- no new authorization mechanism.
  const csrfOk = await csrfGuard(req, res);
  if (!csrfOk) return;

  const body = await _readBody(req);
  const tenantId = body && body.tenantId ? String(body.tenantId) : '';
  const plan = body && body.plan ? String(body.plan) : '';
  const status = body && body.status ? String(body.status) : '';

  if (!VALID_PLANS.includes(plan)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'plan must be one of: ' + VALID_PLANS.join(', ') }));
    return;
  }
  if (!VALID_STATUSES.includes(status)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'status must be one of: ' + VALID_STATUSES.join(', ') }));
    return;
  }

  // Validate tenantId against the same allowlist adjust uses.
  const validIds = await getValidTenantIds();
  if (!validIds.includes(tenantId)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unknown tenantId' }));
    return;
  }

  // Never req.session.accessToken -- matches arl-s5's established convention.
  const adminId = String((req.session && (req.session.login || req.session.userId)) || 'unknown');

  // NFR: Audit -- log the plan-state change with the admin's identity, mirroring
  // adjustBalanceWithAudit's audit-trail intent for credit adjustments. This
  // story reuses setPlanState as-is (no new adapter/table per the DoR contract),
  // so the audit trail here is a structured log line rather than a new DB row.
  console.log('[admin-plan-state] tenant=' + tenantId + ' plan=' + plan + ' status=' + status + ' setBy=' + adminId);

  await setPlanState(tenantId, plan, status);

  res.writeHead(302, { Location: '/admin/credits' });
  res.end();
}

module.exports = { adminCreditsGet, adminCreditsPost, adminSetPlanPost };

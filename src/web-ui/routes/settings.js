'use strict';

// settings.js — c1
// GET /settings — the account Settings page: shared shell + a tab container
// (Profile / Billing / Credits-admin-only) with the Profile tab's real content
// (identity + linked sign-in methods). Replaces account-linking.js's old bare
// `<h1>Link a second sign-in method</h1>` fragment with a page in this app's
// shared design system (html-shell.js's renderShell).
//
// Architecture Constraints (story c1): the tab container is built once here,
// generically, so C2 (Billing tab) and C3 (Credits tab) can add their real
// panel content later without restructuring this shell. Only the Profile
// panel has real content in this story -- Billing/Credits panels are empty,
// ready containers (their content is explicitly out of scope for c1).
//
// Reuses handleStartGoogleLink / handleStartGithubLink / the callback
// handlers in account-linking.js completely unmodified -- this module only
// renders <a> links pointing at their existing routes. No new OAuth logic.

var _htmlShell = require('../utils/html-shell');
var _identityLinks = require('../modules/identity-links');
var _tenantPlan = require('../modules/tenant-plan'); // c2
// c3 — reuses getAllTenantBalances/CSRF helpers exactly as admin-credits.js already
// does; no new adapter, no changes to either module (Architecture Constraints, story c3).
var _credits = require('../modules/credits');
var _csrf = require('../middleware/csrf'); // c2 / c3
var _impersonation = require('../modules/impersonation'); // d2
// d3 — reuses D1's read-only impersonation-audit-adapter.js exactly as c3
// reuses modules/credits.js; no new adapter (DoR H-ADAPTER).
var _impersonationAudit = require('../adapters/impersonation-audit-adapter');

// Sign-in providers surfaced on the Profile tab, in display order.
var PROVIDERS = [
  { id: 'github', label: 'GitHub' },
  { id: 'google', label: 'Google' }
];

function _escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render the Profile tab's panel content: identity card (avatar/login/which
 * provider they signed in via) + a list of sign-in methods with linked/
 * not-linked status (AC2). A provider that is already linked never offers a
 * "Link" control (AC4) -- unlinking is out of scope at the epic level, so a
 * re-offered Link action on an already-linked provider would be a confusing
 * dead-end control.
 * @param {{login: string, authProvider?: string}} user
 * @param {Set<string>} linkedSet - the full set of providers already linked
 *   (session's own authProvider + identity-links.js's getLinkedProviders())
 * @returns {string} HTML fragment (no <html>/<body> wrapper)
 */
function renderProfileTab(user, linkedSet) {
  var login = (user && user.login) || 'signed in';
  var initial = String(login).charAt(0).toUpperCase();
  var signedInVia = (user && user.authProvider) || null;

  var rows = PROVIDERS.map(function(p) {
    var isLinked = linkedSet.has(p.id);
    var statusPill = isLinked
      ? '<span class="sw-pill sw-pill--green">Linked</span>'
      : '<span class="sw-pill sw-pill--neutral">Not linked</span>';
    var action = isLinked
      ? ''
      : '<a class="sw-btn sw-btn--accent" href="/settings/link-account/' + p.id + '/start">Link ' + _escapeHtml(p.label) + ' account</a>';

    return (
      '<li>' +
        '<span style="flex:1">' + _escapeHtml(p.label) + '</span>' +
        statusPill +
        action +
      '</li>'
    );
  }).join('');

  var signedInViaLabel = signedInVia
    ? (PROVIDERS.filter(function(p) { return p.id === signedInVia; })[0] || { label: signedInVia }).label
    : null;

  return (
    '<div id="tab-panel-profile" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-profile">' +
      '<div class="sw-card sw-card--lg" style="display:flex; align-items:center; gap:14px; margin-bottom:20px">' +
        '<div class="sw-avatar" style="width:44px;height:44px;font-size:18px">' + _escapeHtml(initial) + '</div>' +
        '<div>' +
          '<div style="font-weight:600;font-size:16px">' + _escapeHtml(login) + '</div>' +
          (signedInViaLabel
            ? '<div style="color:var(--muted);font-size:13px">Signed in via ' + _escapeHtml(signedInViaLabel) + '</div>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="sw-section-title">Sign-in methods</div>' +
      '<ul class="sw-list">' + rows + '</ul>' +
    '</div>'
  );
}

// c2: real production shape from tenantPlan.getPlanState() (and the
// /billing/plan-state endpoint that reads it) is exactly
// { plan: 'trial'|'paid', status: 'active'|'past_due'|'canceled' } -- no
// trialEndsInDays field exists anywhere in the real store. Verified against
// src/web-ui/modules/tenant-plan.js before writing this -- see decisions.md
// mock-shape verification entry.
function _billingStatusPill(planState) {
  var status = (planState && planState.status) || 'active';
  var plan = (planState && planState.plan) || 'trial';

  if (status === 'past_due') return { cls: 'amber', label: 'Past due' };
  if (status === 'canceled') return { cls: 'red', label: 'Canceled' };
  if (plan === 'trial') return { cls: 'accent', label: 'Trial' };
  return { cls: 'green', label: 'Active' };
}

/**
 * Render the Billing tab's panel content (story c2, AC1-AC5): a status pill
 * (colour + text label per the accessibility NFR -- never colour alone), the
 * plan label, a "Manage billing" link to the existing portal-redirect route
 * (AC4, /settings/billing, unmodified), and -- only while on a trial plan --
 * an "Upgrade to Pro" form posting to the existing /billing/checkout route
 * (AC5), reusing handlePostCheckout's existing CSRF + planId contract exactly
 * as lab-s3.2/sec-perf-s3's own /welcome plan-selection form does.
 * @param {{plan: string, status: string}} planState
 * @param {string} csrfToken
 * @returns {string} HTML fragment
 */
function renderBillingTab(planState, csrfToken) {
  planState = planState || { plan: 'trial', status: 'active' };
  var pill = _billingStatusPill(planState);
  var planLabel = planState.plan === 'paid' ? 'Paid plan' : 'Trial plan';

  var upgradeForm = planState.plan === 'trial'
    ? (
      '<form action="/billing/checkout" method="POST" style="display:inline-block;margin-left:10px">' +
        _csrf.csrfField(csrfToken) +
        '<input type="hidden" name="planId" value="pro">' +
        '<button type="submit" class="sw-btn sw-btn--accent">Upgrade to Pro</button>' +
      '</form>'
    )
    : '';

  return (
    '<div class="sw-card sw-card--lg" style="margin-bottom:20px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
        '<span class="sw-pill sw-pill--' + pill.cls + '">' + _escapeHtml(pill.label) + '</span>' +
        '<span style="color:var(--muted);font-size:13px">' + _escapeHtml(planLabel) + '</span>' +
      '</div>' +
    '</div>' +
    '<a class="sw-btn sw-btn--subtle" href="/settings/billing">Manage billing</a>' +
    upgradeForm
  );
}

/**
 * c3 — Render the Credits tab's panel content: the same tenant balance data
 * adminCreditsGet already returns, restyled into the shared design system
 * (AC1) instead of the bare `<table>` admin-credits.js renders standalone.
 * Reuses adminCreditsGet's exact data shape (tenant_id, balance) and
 * admin-credits.js's exact form contract (POST /api/admin/credits/adjust,
 * tenantId hidden field, amount number field, _csrf hidden field) -- AC3:
 * the restyle does not change the request contract. adminCreditsPost itself
 * is never modified by this story -- its 400 JSON rejection / 302 redirect
 * responses are unchanged (see check-arl-s3-admin-credits.js /
 * check-sec-perf-s3-admin-credits-csrf.js, both still passing unmodified).
 * The inline script below intercepts the restyled form's submit purely to
 * present that same 400 JSON body as a clear on-page message instead of a
 * raw-JSON navigation (AC4) -- it never touches innerHTML with server data
 * (uses textContent only), so no new XSS surface is introduced.
 * @param {Array<{tenant_id: string, balance: number}>} rows
 * @param {string} csrfToken
 * @param {{errorMessage?: string}} [opts]
 * @returns {string} HTML fragment (no <html>/<body> wrapper)
 */
function renderCreditsTab(rows, csrfToken, opts) {
  opts = opts || {};
  var errorBanner = opts.errorMessage
    ? '<div id="credits-error" class="sw-credits-error" role="alert">' + _escapeHtml(opts.errorMessage) + '</div>'
    : '<div id="credits-error" class="sw-credits-error" role="alert" hidden></div>';

  var tableRows = (rows || []).map(function(r) {
    return (
      '<tr>' +
        '<td>' + _escapeHtml(r.tenant_id) + '</td>' +
        '<td>' + _escapeHtml(String(r.balance)) + '</td>' +
        '<td>' +
          '<form method="POST" action="/api/admin/credits/adjust" class="sw-credits-form">' +
            _csrf.csrfField(csrfToken) +
            '<input type="hidden" name="tenantId" value="' + _escapeHtml(r.tenant_id) + '">' +
            '<input type="number" name="amount" min="1" required class="sw-input sw-credits-amount">' +
            '<button type="submit" class="sw-btn sw-btn--accent">Add</button>' +
          '</form>' +
        '</td>' +
      '</tr>'
    );
  }).join('');

  var creditsJs =
    '<script>(function(){' +
      'document.querySelectorAll(".sw-credits-form").forEach(function(f){' +
        'f.addEventListener("submit",function(ev){' +
          'ev.preventDefault();' +
          'var errEl=document.getElementById("credits-error");' +
          'var fd=new URLSearchParams(new FormData(f));' +
          'fetch(f.action,{method:"POST",body:fd,headers:{"Content-Type":"application/x-www-form-urlencoded"}})' +
            '.then(function(r){' +
              'if(r.status===400){return r.json().then(function(j){' +
                'if(errEl){errEl.textContent=(j&&j.error)||"Request rejected";errEl.hidden=false;}' +
              '});}' +
              'window.location.reload();' +
            '})' +
            '.catch(function(){if(errEl){errEl.textContent="Request failed";errEl.hidden=false;}});' +
        '});' +
      '});' +
    '})()</script>';

  return (
    '<div id="tab-panel-credits" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-credits">' +
      '<div class="sw-card sw-card--lg">' +
        '<div class="sw-section-title">Tenant credit balances</div>' +
        errorBanner +
        '<table class="sw-table">' +
          '<thead><tr><th>Tenant ID</th><th>Balance</th><th>Top-up</th></tr></thead>' +
          '<tbody>' + tableRows + '</tbody>' +
        '</table>' +
      '</div>' +
      creditsJs +
    '</div>'
  );
}

function _formatAuditTimestamp(ts) {
  if (!ts) return '';
  try { return new Date(ts).toISOString(); } catch (e) { return String(ts); }
}

/**
 * d3 — Render the Impersonate tab's panel content: a read-only, reverse-
 * chronological audit list (AC1, AC2, AC4). Rows are D1's real audit-table
 * rows (admin_login, target_login, target_tenant_id, reason, created_at,
 * ended_at) via impersonation-audit-adapter.js's listImpersonationAuditRows()
 * -- no new adapter (DoR H-ADAPTER). ended_at is null for any session that
 * has not been exited yet (D2's exit flow, not yet merged) -- rendered as a
 * clear "In progress" indicator, never as a blank cell or a fabricated time
 * (AC2). Never writes to the audit table -- read-only per this story's own
 * Coding Agent Instructions.
 * @param {Array<{admin_login:string, target_login:string, target_tenant_id:string, reason:string, created_at:*, ended_at:*}>} rows
 * @returns {string} HTML fragment (no <html>/<body> wrapper)
 */
function renderImpersonationAuditTab(rows) {
  rows = rows || [];

  var tableRows = rows.map(function(r) {
    var endCell = r.ended_at
      ? _escapeHtml(_formatAuditTimestamp(r.ended_at))
      : '<span class="sw-pill sw-pill--accent">In progress</span>';
    return (
      '<tr>' +
        '<td>' + _escapeHtml(r.admin_login) + '</td>' +
        '<td>' + _escapeHtml(r.target_login) + '</td>' +
        '<td>' + _escapeHtml(r.target_tenant_id) + '</td>' +
        '<td>' + _escapeHtml(r.reason) + '</td>' +
        '<td>' + _escapeHtml(_formatAuditTimestamp(r.created_at)) + '</td>' +
        '<td>' + endCell + '</td>' +
      '</tr>'
    );
  }).join('');

  var content = rows.length
    ? (
      '<table class="sw-table">' +
        '<thead><tr><th>Admin</th><th>Target</th><th>Tenant</th><th>Reason</th><th>Started</th><th>Ended</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
      '</table>'
    )
    : '<p class="sw-muted-note">No impersonation sessions yet</p>';

  return (
    '<div id="tab-panel-impersonate" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-impersonate">' +
      '<div class="sw-card sw-card--lg">' +
        '<div class="sw-section-title">Recent impersonation sessions</div>' +
        // d2/d3 merge reconciliation: D1's own search/start-impersonation page
        // (/admin/impersonate) predates this tab and is a separate flow (start
        // a NEW session) from this tab's own read-only audit history (past
        // sessions) -- surfaced here as a link so neither capability is lost
        // now that both stories independently named their content "Impersonate".
        '<p><a href="/admin/impersonate">Start a new impersonation session &rarr;</a></p>' +
        content +
      '</div>' +
    '</div>'
  );
}

/**
 * Render the tab nav buttons. Profile and Billing are always present (C2
 * adds Billing's real content later); Credits and Impersonate are admin-only
 * (matches the existing live requireAdmin gating convention -- b2/epic-c
 * precedent -- and C3 adds Credits' real content later). d2: `isAdmin` here
 * is computed by the caller via isEffectivelyAdmin(req.session) -- during an
 * active impersonation session it reflects the impersonated TARGET's role,
 * never the real admin's own role (AC2/AC3), so both tabs are correctly
 * hidden while impersonating a non-admin and correctly shown while
 * impersonating an admin.
 * @param {boolean} isAdmin
 * @returns {string}
 */
function _renderTabNav(isAdmin) {
  var creditsTab = isAdmin
    ? '<button type="button" class="sw-settings-tab" id="tab-credits" role="tab" aria-selected="false" onclick="swShowSettingsTab(\'credits\')">Credits</button>'
    : '';
  // d2/d3 merge reconciliation: both stories independently built an
  // "Impersonate" tab -- d2 as a link out to D1's existing /admin/impersonate
  // search/start page, d3 as an in-shell tab-panel showing the read-only
  // audit history (matching the Credits/Billing tab-panel convention). Kept
  // d3's tab-panel mechanic (consistent with the rest of this shell) and
  // surfaced d1's start-a-session link INSIDE that tab's own content
  // (renderImpersonationAuditTab, above) rather than as a second nav item,
  // so neither capability is lost. Flagged in decisions.md for operator review.
  var impersonateTab = isAdmin
    ? '<button type="button" class="sw-settings-tab" id="tab-impersonate" role="tab" aria-selected="false" onclick="swShowSettingsTab(\'impersonate\')">Impersonate</button>'
    : '';

  return (
    '<div class="sw-settings-tabs" role="tablist" aria-label="Settings sections">' +
      '<button type="button" class="sw-settings-tab sw-settings-tab--active" id="tab-profile" role="tab" aria-selected="true" onclick="swShowSettingsTab(\'profile\')">Profile</button>' +
      '<button type="button" class="sw-settings-tab" id="tab-billing" role="tab" aria-selected="false" onclick="swShowSettingsTab(\'billing\')">Billing</button>' +
      creditsTab +
      impersonateTab +
    '</div>'
  );
}

// Tab-switching script + minimal tab-nav CSS. Extensible: C2/C3 fill in
// #tab-panel-billing / #tab-panel-credits -- this script only toggles
// visibility and aria-selected, it does not know about panel content.
var _TAB_CSS =
  '<style>' +
    '.sw-settings-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:24px}' +
    '.sw-settings-tab{padding:8px 14px;font-family:inherit;font-size:13.5px;font-weight:500;' +
      'background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);cursor:pointer}' +
    '.sw-settings-tab:hover{color:var(--ink)}' +
    '.sw-settings-tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
    '.sw-settings-tab--active{color:var(--ink);border-bottom-color:var(--ink)}' +
    '.sw-tab-panel{display:none}' +
    '.sw-tab-panel--active{display:block}' +
    // c3 — Credits tab: restyled table + inline top-up form + error banner.
    '.sw-table{width:100%;border-collapse:collapse;font-size:13.5px}' +
    '.sw-table th,.sw-table td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)}' +
    '.sw-table th{color:var(--muted);font-weight:500}' +
    '.sw-credits-form{display:flex;align-items:center;gap:8px}' +
    '.sw-credits-amount{width:90px}' +
    '.sw-credits-error{background:var(--red-soft);color:var(--red);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:13.5px}' +
    '.sw-credits-error[hidden]{display:none}' +
    // d3 — Impersonate tab empty-state text.
    '.sw-muted-note{color:var(--muted);font-size:13.5px}' +
  '</style>';

var _TAB_JS =
  '<script>function swShowSettingsTab(name){' +
    'document.querySelectorAll(".sw-tab-panel").forEach(function(el){el.classList.remove("sw-tab-panel--active");});' +
    'document.querySelectorAll(".sw-settings-tab").forEach(function(el){' +
      'el.classList.remove("sw-settings-tab--active");el.setAttribute("aria-selected","false");});' +
    'var panel=document.getElementById("tab-panel-"+name);' +
    'if(panel)panel.classList.add("sw-tab-panel--active");' +
    'var tab=document.getElementById("tab-"+name);' +
    'if(tab){tab.classList.add("sw-settings-tab--active");tab.setAttribute("aria-selected","true");}' +
  '}</script>';

/**
 * Render the full Settings page (AC1: wrapped in the shared shell, not a
 * bare fragment). Profile and Credits (c3) panels have real content;
 * Billing remains an empty container ready for C2.
 * @param {{user: object, linkedSet: Set<string>, isAdmin: boolean, creditsRows?: Array, csrfToken?: string, creditsError?: string, impersonation?: object}} opts
 * @returns {string} full HTML document
 */
function renderSettingsPage(opts) {
  opts = opts || {};
  var user = opts.user || {};
  var linkedSet = opts.linkedSet || new Set();
  var isAdmin = !!opts.isAdmin;
  // c2: safe defaults preserve C1's existing call sites, which never pass these.
  var planState = opts.planState || { plan: 'trial', status: 'active' };
  var csrfToken = opts.csrfToken || '';

  var body =
    '<h1 class="sw-page-h1">Settings</h1>' +
    '<p class="sw-page-sub">Manage your identity, sign-in methods' + (isAdmin ? ', billing, and platform credits' : ' and billing') + '.</p>' +
    _TAB_CSS +
    _renderTabNav(isAdmin) +
    '<div class="sw-tab-panel sw-tab-panel--active" id="tab-panel-profile-wrap">' +
      renderProfileTab(user, linkedSet) +
    '</div>' +
    '<div id="tab-panel-billing" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-billing">' +
      renderBillingTab(planState, csrfToken) +
    '</div>' +
    // c3 (AC1/AC2): real, server-gated Credits content -- only ever built when
    // isAdmin is true. A non-admin request never even has creditsRows/csrfToken
    // populated (see handleGetSettings below), so there is nothing to hide
    // client-side -- the tab and its data are absent from the response entirely.
    (isAdmin ? renderCreditsTab(opts.creditsRows || [], csrfToken, { errorMessage: opts.creditsError }) : '') +
    // d3 (AC1/AC2/AC4): real, server-gated Impersonate audit content -- only
    // ever built when isAdmin is true, same data-fetch-layer gating as
    // Credits above (c3 precedent) -- a non-admin request never has
    // impersonationAuditRows populated, so there is nothing to hide
    // client-side.
    (isAdmin ? renderImpersonationAuditTab(opts.impersonationAuditRows || []) : '') +
    _TAB_JS;

  return _htmlShell.renderShell({
    title: 'Settings — Skills Platform',
    bodyContent: body,
    user: user,
    active: 'settings',
    crumbs: ['Settings'],
    isAdmin: isAdmin, // b2: forward the isAdmin this function already computes so the
                      // sidebar's Admin credits entry (gated the same way as the
                      // Credits tab above) shows consistently on this page too.
    impersonation: opts.impersonation // d2 (AC1): forward so the shell can render the banner
  });
}

/**
 * Build the real route handler, closed over a single pool instance (mirrors
 * account-linking.js's createLinkCallbackHandlers(pool) / team-management.js's
 * createTeamManagementHandlers(pool) factory convention). No new D37 adapter
 * (DoR H-ADAPTER: direct DB access, app-layer logic, same reasoning as those
 * two modules).
 * @param {object} pool
 * @returns {{handleGetSettings: Function}}
 */
function createSettingsHandlers(pool) {
  /**
   * GET /settings — mounted behind authGuard in server.js (mirrors
   * account-linking.js's /settings/link-account convention -- this handler
   * does not duplicate auth-guard logic itself).
   */
  async function handleGetSettings(req, res) {
    var identityKey = req.session && req.session.tenantId;
    var linkedFromDb = identityKey ? await _identityLinks.getLinkedProviders(pool, identityKey) : [];
    var currentProvider = req.session && req.session.authProvider;

    var linkedSet = new Set(linkedFromDb);
    if (currentProvider) linkedSet.add(currentProvider);

    var user = {
      login: req.session && req.session.login,
      authProvider: currentProvider
    };
    // d2: replaces the inline req.session.role check with isEffectivelyAdmin()
    // (modules/impersonation.js), which keys off the EFFECTIVE role (the
    // impersonation target's role while impersonating, never the real
    // admin's own role) -- AC2/AC3. Unchanged boolean value for a
    // non-impersonating session.
    var isAdmin = _impersonation.isEffectivelyAdmin(req.session);
    // d2 (AC1): forward the active impersonation state (if any) so the shell
    // can render the persistent banner.
    var imp = req.session && req.session.impersonation;
    var impersonationOpts = (imp && imp.active && imp.target)
      ? { active: true, targetLogin: imp.target.login, targetTenantId: imp.target.tenantId, csrfToken: _csrf.generateCsrfToken(req) }
      : null;

    // c2: read the exact same source /billing/plan-state reads (tenantPlan.getPlanState)
    // -- no separate/duplicated plan-status computation.
    var tenantId = req.session && req.session.tenantId;
    var planState = await _tenantPlan.getPlanState(tenantId);
    // Shared across the Billing (c2) and Credits (c3) tabs -- both forms post
    // back to server-gated routes and need a valid token; one token per page
    // load is sufficient and avoids generating it twice per request.
    var csrfToken = _csrf.generateCsrfToken(req);

    // c3 (AC1/AC2): fetch real tenant balances ONLY when isAdmin is true --
    // reuses getAllTenantBalances exactly as admin-credits.js already does
    // (Architecture Constraints). A non-admin request never calls this, so
    // there is no balance data to leak even if the render layer had a bug --
    // the server-side gate is enforced at the data-fetch step, not just in
    // the markup.
    var creditsRows = [];
    if (isAdmin) {
      creditsRows = await _credits.getAllTenantBalances();
    }

    // d3 (AC1/AC2/AC4): fetch real audit rows ONLY when isAdmin is true --
    // reuses D1's listImpersonationAuditRows() directly, same data-fetch-layer
    // gating as creditsRows above (c3 precedent). A non-admin request never
    // calls this, so there is no audit data to leak even if the render layer
    // had a bug -- the server-side gate is enforced at the data-fetch step,
    // not just in the markup.
    var impersonationAuditRows = [];
    if (isAdmin) {
      impersonationAuditRows = await _impersonationAudit.listImpersonationAuditRows();
    }

    // c3 (AC4): the initial page load never has a prior rejection to show --
    // the restyled form's client-side fetch handler (see renderCreditsTab)
    // surfaces a rejection inline without a page navigation, so there is no
    // server-side error state to thread through here on first render.
    var html = renderSettingsPage({
      user: user,
      linkedSet: linkedSet,
      isAdmin: isAdmin,
      planState: planState,
      csrfToken: csrfToken,
      creditsRows: creditsRows,
      impersonation: impersonationOpts,
      impersonationAuditRows: impersonationAuditRows
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  return { handleGetSettings: handleGetSettings };
}

module.exports = {
  PROVIDERS: PROVIDERS,
  renderProfileTab: renderProfileTab,
  renderBillingTab: renderBillingTab,
  renderCreditsTab: renderCreditsTab,
  renderImpersonationAuditTab: renderImpersonationAuditTab,
  renderSettingsPage: renderSettingsPage,
  createSettingsHandlers: createSettingsHandlers
};

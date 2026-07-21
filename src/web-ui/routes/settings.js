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

/**
 * Render the tab nav buttons. Profile and Billing are always present (C2
 * adds Billing's real content later); Credits is admin-only (matches the
 * existing live requireAdmin gating convention -- b2/epic-c precedent -- and
 * C3 adds its real content later).
 * @param {boolean} isAdmin
 * @returns {string}
 */
function _renderTabNav(isAdmin) {
  var creditsTab = isAdmin
    ? '<button type="button" class="sw-settings-tab" id="tab-credits" role="tab" aria-selected="false" onclick="swShowSettingsTab(\'credits\')">Credits</button>'
    : '';

  return (
    '<div class="sw-settings-tabs" role="tablist" aria-label="Settings sections">' +
      '<button type="button" class="sw-settings-tab sw-settings-tab--active" id="tab-profile" role="tab" aria-selected="true" onclick="swShowSettingsTab(\'profile\')">Profile</button>' +
      '<button type="button" class="sw-settings-tab" id="tab-billing" role="tab" aria-selected="false" onclick="swShowSettingsTab(\'billing\')">Billing</button>' +
      creditsTab +
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
 * bare fragment). Only the Profile panel has real content in this story --
 * Billing/Credits panels are empty containers ready for C2/C3.
 * @param {{user: object, linkedSet: Set<string>, isAdmin: boolean}} opts
 * @returns {string} full HTML document
 */
function renderSettingsPage(opts) {
  opts = opts || {};
  var user = opts.user || {};
  var linkedSet = opts.linkedSet || new Set();
  var isAdmin = !!opts.isAdmin;

  var body =
    '<h1 class="sw-page-h1">Settings</h1>' +
    '<p class="sw-page-sub">Manage your identity, sign-in methods' + (isAdmin ? ', billing, and platform credits' : ' and billing') + '.</p>' +
    _TAB_CSS +
    _renderTabNav(isAdmin) +
    '<div class="sw-tab-panel sw-tab-panel--active" id="tab-panel-profile-wrap">' +
      renderProfileTab(user, linkedSet) +
    '</div>' +
    '<div id="tab-panel-billing" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-billing"></div>' +
    (isAdmin ? '<div id="tab-panel-credits" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-credits"></div>' : '') +
    _TAB_JS;

  return _htmlShell.renderShell({
    title: 'Settings — Skills Platform',
    bodyContent: body,
    user: user,
    active: 'settings',
    crumbs: ['Settings']
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
    var isAdmin = !!(req.session && req.session.role === 'admin');

    var html = renderSettingsPage({ user: user, linkedSet: linkedSet, isAdmin: isAdmin });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  return { handleGetSettings: handleGetSettings };
}

module.exports = {
  PROVIDERS: PROVIDERS,
  renderProfileTab: renderProfileTab,
  renderSettingsPage: renderSettingsPage,
  createSettingsHandlers: createSettingsHandlers
};

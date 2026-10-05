'use strict';
// signals-panel.js -- ep2-s1: GET /signals route handler. Calls
// signals-aggregator.js's real getSignals() directly (the same function
// ep1-s2's handleGetSignals already calls) -- not a re-implementation, not a
// new HTTP round-trip to /api/signals from within this same process.
const path = require('path');
const { renderShell, escHtml } = require('../utils/html-shell');
const { renderSignalsPanel } = require('../views/signals-panel-view');
const _csrf = require('../middleware/csrf');
const { _getSkillsNavContext } = require('./skills');
const { paginateSignals } = require('../utils/paginate-signals'); // ep2-s3
const { filterSignals } = require('../utils/filter-signals'); // sptu-s2
const _dismissedStore = require('../modules/dismissed-signals-store');

let _signalsSourceOverride = null;
function setSignalsSource(fn) { _signalsSourceOverride = fn; }
function _resetSignalsSourceForTesting() { _signalsSourceOverride = null; }

function _getRepoPath() {
  return process.env.CLAUDE_REPO_PATH || process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../..');
}

// sptu-s2: req.query.hideType/hideSource are each a single comma-separated
// string (never a repeated key -- server.js's own parseQuery is last-wins on
// repeated keys, confirmed at /definition-of-ready). Split, trim, drop empties.
function _parseHideParam(raw) {
  if (!raw) return [];
  return String(raw).split(',').map(function(v) { return v.trim(); }).filter(Boolean);
}

function _safeSignalsRedirect(returnTo) {
  if (typeof returnTo !== 'string') return '/signals';
  if (returnTo.indexOf('\r') !== -1 || returnTo.indexOf('\n') !== -1) return '/signals';
  if (returnTo === '/signals' || returnTo.indexOf('/signals/') === 0 || returnTo.indexOf('/signals?') === 0) return returnTo;
  return '/signals';
}

async function handleGetSignalsPanelHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  try {
    const getSignals = _signalsSourceOverride || require('../modules/signals-aggregator').getSignals;
    const allSignals = getSignals(_getRepoPath());

    // sptu-s2: the real distinct type/source universe, computed live from the
    // FULL unfiltered list every render -- never a hardcoded list that could
    // go stale as signals-aggregator.js gains sources over time.
    const availableTypes = Array.from(new Set(allSignals.map(function(s) { return s.type; }).filter(Boolean))).sort();
    const availableSources = Array.from(new Set(allSignals.map(function(s) { return s.source; }).filter(Boolean))).sort();

    const requestedHideTypes = _parseHideParam(req.query && req.query.hideType).map(function(v) { return v.trim().toLowerCase(); });
    const requestedHideSources = _parseHideParam(req.query && req.query.hideSource).map(function(v) { return v.trim().toLowerCase(); });
    // Only keep values that match a real, currently-observed type/source --
    // never echo an attacker/typo-supplied value into the active-filter
    // summary UI text (escHtml makes it safe, but not meaningful).
    const hideTypes = requestedHideTypes.filter(function(t) { return availableTypes.indexOf(t) !== -1; });
    const hideSources = requestedHideSources.filter(function(s) { return availableSources.indexOf(s) !== -1; });

    const signals = filterSignals(allSignals, { hideTypes: hideTypes, hideSources: hideSources });

    const showDismissed = (req.query && req.query.showDismissed === 'true');
    const dismissedKeys = new Set();
    try {
      allSignals.forEach(function(s) {
        const k = _dismissedStore.deriveDismissKey(s);
        if (_dismissedStore.isDismissed(k)) dismissedKeys.add(k);
      });
    } catch (err) {
      // Adapter not wired (D37 stub throw) or any other store failure --
      // degrade to "nothing is dismissed" rather than a 500. See the SCOPE
      // NOTE above and decisions.md's 2026-10-05 entry.
      console.error('[sptu-s4] dismissed-signals-store unavailable, degrading to empty dismissed-set:', err && err.message || err);
    }
    const visibleSignals = showDismissed
      ? signals
      : signals.filter(function(s) { return !dismissedKeys.has(_dismissedStore.deriveDismissKey(s)); });

    // ep2-s3: slice to a bounded page before rendering -- req.query.page is a
    // plain string or undefined (confirmed via server.js's own parseQuery).
    const pagination = paginateSignals(visibleSignals, req.query && req.query.page);
    const csrfToken = await _csrf.generateCsrfToken(req);
    const _nav = await _getSkillsNavContext(req, null);
    const filterState = {
      availableTypes: availableTypes,
      availableSources: availableSources,
      hideTypes: hideTypes,
      hideSources: hideSources
    };
    const dismissState = { showDismissed: showDismissed, dismissedKeys: dismissedKeys, currentUrl: req.url };
    const html = renderShell({
      title: 'Improvement Signals',
      bodyContent: renderSignalsPanel(pagination.pageSignals, csrfToken, pagination, filterState, dismissState),
      user: { login: req.session.login || '' },
      active: 'signals',
      products: _nav.products, activeProductId: _nav.activeProductId, noProductJourneyCount: _nav.noProductJourneyCount
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    // ep2-s1: matches handlePostSkillSessionHtml's catch precedent in
    // routes/skills.js -- styled HTML error page, not the bare top-level
    // router catch-all's plain-text "Internal Server Error".
    const _nav = await _getSkillsNavContext(req, null);
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>Could not load signals: ' + escHtml(err.message) + '</p>',
      user:        { login: (req.session && req.session.login) || '' },
      active:      'signals',
      products: _nav.products, activeProductId: _nav.activeProductId, noProductJourneyCount: _nav.noProductJourneyCount
    });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

async function handlePostDismissSignal(req, res) {
  const csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  const body = req.body || {};
  const signal = { source: body.signalSource, type: body.signalType, text: body.signalText };
  const key = _dismissedStore.deriveDismissKey(signal);
  _dismissedStore.dismiss(key);
  try {
    res.writeHead(302, { Location: _safeSignalsRedirect(body.returnTo) });
    res.end();
  } catch (_) {
    // Defense in depth: if the redirect target somehow still produces an
    // invalid header value (e.g. a future change to _safeSignalsRedirect
    // reopens a gap), fall back to a known-safe target rather than hanging
    // the connection. See the code-quality review that found this gap,
    // 2026-10-05.
    res.writeHead(302, { Location: '/signals' });
    res.end();
  }
}

async function handlePostUndismissSignal(req, res) {
  const csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  const body = req.body || {};
  const signal = { source: body.signalSource, type: body.signalType, text: body.signalText };
  const key = _dismissedStore.deriveDismissKey(signal);
  _dismissedStore.undismiss(key);
  try {
    res.writeHead(302, { Location: _safeSignalsRedirect(body.returnTo) });
    res.end();
  } catch (_) {
    // Defense in depth: if the redirect target somehow still produces an
    // invalid header value (e.g. a future change to _safeSignalsRedirect
    // reopens a gap), fall back to a known-safe target rather than hanging
    // the connection. See the code-quality review that found this gap,
    // 2026-10-05.
    res.writeHead(302, { Location: '/signals' });
    res.end();
  }
}

module.exports = {
  handleGetSignalsPanelHtml,
  handlePostDismissSignal,
  handlePostUndismissSignal,
  setSignalsSource,
  _resetSignalsSourceForTesting
};

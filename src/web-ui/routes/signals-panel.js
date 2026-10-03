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

let _signalsSourceOverride = null;
function setSignalsSource(fn) { _signalsSourceOverride = fn; }
function _resetSignalsSourceForTesting() { _signalsSourceOverride = null; }

function _getRepoPath() {
  return process.env.CLAUDE_REPO_PATH || process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../..');
}

async function handleGetSignalsPanelHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  try {
    const getSignals = _signalsSourceOverride || require('../modules/signals-aggregator').getSignals;
    const signals = getSignals(_getRepoPath());
    const csrfToken = await _csrf.generateCsrfToken(req);
    const _nav = await _getSkillsNavContext(req, null);
    const html = renderShell({
      title: 'Improvement Signals',
      bodyContent: renderSignalsPanel(signals, csrfToken),
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

module.exports = { handleGetSignalsPanelHtml, setSignalsSource, _resetSignalsSourceForTesting };

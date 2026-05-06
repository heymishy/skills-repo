'use strict';
var path = require('path');
var crypto = require('crypto');
var os = require('os');
var { renderShell, escHtml } = require('../utils/html-shell');

// Injectable adapters — defaults wire to real implementations
var _journeyStore = require('../modules/journey-store');
var _registerHtmlSession = null;
var _linkSessionToJourney = null;

function getRegisterHtmlSession() {
  if (_registerHtmlSession) return _registerHtmlSession;
  return require('./skills').registerHtmlSession;
}

function getLinkSessionToJourney() {
  if (_linkSessionToJourney) return _linkSessionToJourney;
  return require('./skills').linkSessionToJourney;
}

// Adapter setters (used by tests)
function setRegisterHtmlSession(fn) { _registerHtmlSession = fn; }
function setLinkSessionToJourney(fn) { _linkSessionToJourney = fn; }
function setJourneyStoreModule(mod) { _journeyStore = mod; }

/**
 * GET /journey — render the journey entry form.
 */
function handleGetJourney(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var login = req.session.login || '';
  var body = [
    '<div class="sw-page-content">',
    '<h1>Start a guided outer loop journey</h1>',
    '<p>Begin a new journey through the skills pipeline for your feature.</p>',
    '<form method="POST" action="/api/journey">',
    '<button type="submit" class="sw-btn sw-btn--primary">Start journey</button>',
    '</form>',
    '</div>'
  ].join('');
  var html = renderShell({ title: 'Journey', bodyContent: body, user: { login: login } });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/journey — create journey and start discovery session.
 */
function handlePostJourney(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return Promise.resolve();
  }
  try {
    var featureSlug = (req.body && req.body.featureSlug) || '';
    var created = _journeyStore.createJourney(featureSlug);
    var journeyId = created.journeyId;
    var sid = crypto.randomUUID();
    var sessionPath = path.join(os.tmpdir(), 'ougl-sessions', sid + '-discovery.md');
    getRegisterHtmlSession()(sid, sessionPath, 'discovery');
    getLinkSessionToJourney()(sid, journeyId);
    if (_journeyStore.setActiveSession) {
      _journeyStore.setActiveSession(journeyId, sid, 'discovery');
    }
    res.writeHead(303, { Location: '/skills/discovery/sessions/' + sid + '/chat' });
    res.end();
  } catch (err) {
    var errBody = [
      '<div class="sw-page-content">',
      '<h1>Error starting journey</h1>',
      '<p>' + escHtml(err.message || 'An unexpected error occurred.') + '</p>',
      '<a href="/journey">Try again</a>',
      '</div>'
    ].join('');
    var errHtml = renderShell({ title: 'Error', bodyContent: errBody });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(errHtml);
  }
  return Promise.resolve();
}

module.exports = {
  handleGetJourney,
  handlePostJourney,
  setRegisterHtmlSession,
  setLinkSessionToJourney,
  setJourneyStoreModule
};

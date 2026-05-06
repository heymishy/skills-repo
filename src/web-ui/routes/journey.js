'use strict';
var path = require('path');
var crypto = require('crypto');
var os = require('os');
var fs = require('fs');
var { renderShell, escHtml } = require('../utils/html-shell');

// Injectable adapters — defaults wire to real implementations
var _journeyStore = require('../modules/journey-store');
var _registerHtmlSession = null;
var _linkSessionToJourney = null;
var _getHtmlSessionFn = null;
var _repoRoot = null;

function getRegisterHtmlSession() {
  if (_registerHtmlSession) return _registerHtmlSession;
  return require('./skills').registerHtmlSession;
}

function getLinkSessionToJourney() {
  if (_linkSessionToJourney) return _linkSessionToJourney;
  return require('./skills').linkSessionToJourney;
}

function getGetHtmlSession() {
  if (_getHtmlSessionFn) return _getHtmlSessionFn;
  return require('./skills')._getHtmlSession;
}

function getRepoRoot() {
  return _repoRoot || path.resolve(__dirname, '../../..');
}

// Adapter setters (used by tests)
function setRegisterHtmlSession(fn) { _registerHtmlSession = fn; }
function setLinkSessionToJourney(fn) { _linkSessionToJourney = fn; }
function setJourneyStoreModule(mod) { _journeyStore = mod; }
function setGetHtmlSession(fn) { _getHtmlSessionFn = fn; }
function setRepoRoot(root) { _repoRoot = root; }

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

/**
 * POST /api/journey/:journeyId/gate-confirm — save artefact, build handoff, route to next stage.
 */
async function handlePostGateConfirm(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<p>Journey not found.</p>' }));
    return;
  }
  var activeSessionId = journey.activeSessionId;
  var session = getGetHtmlSession()(activeSessionId);
  if (!session) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<p>Session not found.</p>' }));
    return;
  }
  if (!session.done) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<p>Session not complete yet.</p>' }));
    return;
  }
  var artefactRelPath = session.artefactPath || '';
  var repoRoot = getRepoRoot();
  var absPath = path.resolve(path.join(repoRoot, artefactRelPath));
  var resolvedRoot = path.resolve(repoRoot);
  // Security: path traversal check
  if (!absPath.startsWith(resolvedRoot + path.sep) && absPath !== resolvedRoot) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<p>Invalid artefact path.</p>' }));
    return;
  }
  // Write artefact to disk only if not already present
  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, session.artefactContent || '', 'utf8');
  }
  // Call completeStage to record this stage
  _journeyStore.completeStage(journeyId, session.skillName, artefactRelPath);
  // Build priorArtefacts from all completed stages (read authoritative disk content)
  var updatedJourney = _journeyStore.getJourney(journeyId);
  var priorArtefacts = (updatedJourney.completedStages || []).map(function(stage) {
    var stageAbsPath = path.resolve(path.join(repoRoot, stage.artefactPath));
    var content = '';
    try { content = fs.readFileSync(stageAbsPath, 'utf8'); } catch (_) {}
    return { path: stage.artefactPath, content: content };
  });
  // Determine next stage
  var nextStage = _journeyStore.getNextStage(session.skillName);
  console.info(JSON.stringify({ event: 'artefact_saved_to_disk', journeyId: journeyId, stage: session.skillName, featureSlug: journey.featureSlug }));
  if (nextStage === null) {
    // Final stage (definition-of-ready) — complete journey (ougl.7)
    _journeyStore.markJourneyComplete(journeyId);
    console.info(JSON.stringify({ event: 'journey_completed', journeyId: journeyId, featureSlug: journey.featureSlug, stageCount: updatedJourney.completedStages.length }));
    res.writeHead(303, { Location: '/journey/' + journeyId + '/complete' });
    res.end();
  } else if (nextStage === 'test-plan') {
    // Switch to per-story routing (ougl.6)
    res.writeHead(303, { Location: '/journey/' + journeyId + '/stories' });
    res.end();
  } else {
    // Create new session for next stage
    var newSid = crypto.randomUUID();
    var newSessionPath = path.join(os.tmpdir(), 'ougl-sessions', newSid + '-' + nextStage + '.md');
    getRegisterHtmlSession()(newSid, newSessionPath, nextStage, priorArtefacts);
    getLinkSessionToJourney()(newSid, journeyId);
    if (_journeyStore.setActiveSession) {
      _journeyStore.setActiveSession(journeyId, newSid, nextStage);
    }
    res.writeHead(303, { Location: '/skills/' + nextStage + '/sessions/' + newSid + '/chat' });
    res.end();
  }
}

/**
 * GET /journey/:journeyId/stories — render story list entry form.
 */
async function handleGetStories(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<p>Journey not found.</p>' }));
    return;
  }
  var safeId = escHtml(journeyId);
  var body = [
    '<div class="sw-page-content">',
    '<h1>Story list for journey</h1>',
    '<p>Enter one story slug per line. These will be processed through test-plan and definition-of-ready.</p>',
    '<form method="POST" action="/api/journey/' + safeId + '/stories">',
    '<textarea name="stories" rows="10" cols="50" placeholder="e.g. wgol.1&#10;wgol.2&#10;wgol.3"></textarea>',
    '<br><button type="submit" class="sw-btn sw-btn--primary">Start per-story stages</button>',
    '</form>',
    '</div>'
  ].join('');
  var html = renderShell({ title: 'Stories', bodyContent: body, user: { login: req.session.login || '' } });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/journey/:journeyId/stories — set story list and start test-plan session for first story.
 */
async function handlePostStories(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<p>Journey not found.</p>' }));
    return;
  }
  var raw = (req.body && req.body.stories) || '';
  var slugs = raw.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
  if (slugs.length === 0) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<p>At least one story slug is required.</p>' }));
    return;
  }
  // Security: validate slugs — no path traversal
  var hasTraversal = slugs.some(function(s) { return s.includes('..') || s.startsWith('/'); });
  if (hasTraversal) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<p>Invalid story slug.</p>' }));
    return;
  }
  _journeyStore.setStoryList(journeyId, slugs);
  // Build priorArtefacts from completed stages
  var repoRoot = getRepoRoot();
  var updatedJourney = _journeyStore.getJourney(journeyId);
  var priorArtefacts = (updatedJourney.completedStages || []).map(function(stage) {
    var stageAbsPath = path.resolve(path.join(repoRoot, stage.artefactPath));
    var content = '';
    try { content = fs.readFileSync(stageAbsPath, 'utf8'); } catch (_) {}
    return { path: stage.artefactPath, content: content };
  });
  // Create test-plan session for first story
  var newSid = crypto.randomUUID();
  var newSessionPath = path.join(os.tmpdir(), 'ougl-sessions', newSid + '-test-plan.md');
  getRegisterHtmlSession()(newSid, newSessionPath, 'test-plan', priorArtefacts);
  getLinkSessionToJourney()(newSid, journeyId);
  if (_journeyStore.setActiveSession) {
    _journeyStore.setActiveSession(journeyId, newSid, 'test-plan');
  }
  res.writeHead(303, { Location: '/skills/test-plan/sessions/' + newSid + '/chat' });
  res.end();
}

module.exports = {
  handleGetJourney,
  handlePostJourney,
  handlePostGateConfirm,
  handleGetStories,
  handlePostStories,
  setRegisterHtmlSession,
  setLinkSessionToJourney,
  setJourneyStoreModule,
  setGetHtmlSession,
  setRepoRoot
};


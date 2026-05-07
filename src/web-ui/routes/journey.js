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

  // Per-story stage sequence: test-plan → review → definition-of-ready
  var PER_STORY_SEQ = ['test-plan', 'review', 'definition-of-ready'];
  var perStoryIdx = PER_STORY_SEQ.indexOf(session.skillName);
  var newSid, newSessionPath, perStoryNextStage;

  if (session.skillName === 'definition-of-ready') {
    // Story-mode: check for more stories; feature-mode: complete journey
    var nextStory = _journeyStore.advanceToNextStory(journeyId);
    if (nextStory) {
      // More stories: create test-plan session for next story
      newSid = crypto.randomUUID();
      newSessionPath = path.join(os.tmpdir(), 'ougl-sessions', newSid + '-test-plan.md');
      getRegisterHtmlSession()(newSid, newSessionPath, 'test-plan', priorArtefacts);
      getLinkSessionToJourney()(newSid, journeyId);
      if (_journeyStore.setActiveSession) {
        _journeyStore.setActiveSession(journeyId, newSid, 'test-plan');
      }
      res.writeHead(303, { Location: '/skills/test-plan/sessions/' + newSid + '/chat' });
      res.end();
    } else {
      // No more stories (or feature-mode): complete journey
      _journeyStore.markJourneyComplete(journeyId);
      console.info(JSON.stringify({ event: 'journey_completed', journeyId: journeyId, featureSlug: journey.featureSlug, stageCount: updatedJourney.completedStages.length }));
      res.writeHead(303, { Location: '/journey/' + journeyId + '/complete' });
      res.end();
    }
  } else if (perStoryIdx !== -1 && perStoryIdx < PER_STORY_SEQ.length - 1) {
    // Per-story intermediate stage (test-plan or review): advance within per-story sequence
    perStoryNextStage = PER_STORY_SEQ[perStoryIdx + 1];
    newSid = crypto.randomUUID();
    newSessionPath = path.join(os.tmpdir(), 'ougl-sessions', newSid + '-' + perStoryNextStage + '.md');
    getRegisterHtmlSession()(newSid, newSessionPath, perStoryNextStage, priorArtefacts);
    getLinkSessionToJourney()(newSid, journeyId);
    if (_journeyStore.setActiveSession) {
      _journeyStore.setActiveSession(journeyId, newSid, perStoryNextStage);
    }
    res.writeHead(303, { Location: '/skills/' + perStoryNextStage + '/sessions/' + newSid + '/chat' });
    res.end();
  } else if (nextStage === null) {
    // Non-per-story null: complete journey
    _journeyStore.markJourneyComplete(journeyId);
    console.info(JSON.stringify({ event: 'journey_completed', journeyId: journeyId, featureSlug: journey.featureSlug, stageCount: updatedJourney.completedStages.length }));
    res.writeHead(303, { Location: '/journey/' + journeyId + '/complete' });
    res.end();
  } else if (nextStage === 'test-plan') {
    // Feature-level: switch to per-story routing (ougl.6)
    res.writeHead(303, { Location: '/journey/' + journeyId + '/stories' });
    res.end();
  } else {
    // Feature-level: create session for next stage
    newSid = crypto.randomUUID();
    newSessionPath = path.join(os.tmpdir(), 'ougl-sessions', newSid + '-' + nextStage + '.md');
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

/**
 * GET /journey/:journeyId/complete — render the journey completion screen.
 */
async function handleGetJourneyComplete(req, res) {
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
  var stageItems = (journey.completedStages || []).map(function(stage) {
    return '<li><strong>' + escHtml(stage.skillName) + '</strong>: <code>' + escHtml(stage.artefactPath) + '</code></li>';
  }).join('');
  var body = [
    '<div class="sw-page-content">',
    '<h1>Journey complete!</h1>',
    '<p>All stages completed for <strong>' + escHtml(journey.featureSlug || journeyId) + '</strong>.</p>',
    '<h2>Completed stages</h2>',
    '<ul>' + stageItems + '</ul>',
    '</div>'
  ].join('');
  var html = renderShell({ title: 'Journey Complete', bodyContent: body, user: { login: req.session.login || '' } });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * GET /api/journey/:journeyId/stage-controls — owle.1
 * Returns clarifyAvailable:true only when the journey's active skill is 'discovery'.
 */
function handleGetStageControls(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  var clarifyAvailable = journey.activeSkill === 'discovery';
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ clarifyAvailable: clarifyAvailable, logDecisionAvailable: true, traceAvailable: true }));
}

/**
 * POST /api/journey/:journeyId/side-trip/clarify — owle.1
 * Opens a /clarify skill session with the journey's discovery.md pre-loaded as context.
 * Returns { sideTripSessionId }. parentJourneyId is stored server-side only.
 */
async function handlePostSideTripClarify(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }

  // Path traversal guard: validate featureSlug resolves within repoRoot
  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var discoveryRel = path.join('artefacts', featureSlug, 'discovery.md');
  var discoveryAbs = path.resolve(path.join(repoRoot, discoveryRel));
  var resolvedRoot = path.resolve(repoRoot);
  if (!discoveryAbs.startsWith(resolvedRoot + path.sep) && discoveryAbs !== resolvedRoot) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid feature slug' }));
    return;
  }

  // Read discovery.md — tolerate missing file
  var discoveryContent = '';
  try { discoveryContent = fs.readFileSync(discoveryAbs, 'utf8'); } catch (_) {}

  // Create clarify session
  var sid = crypto.randomUUID();
  var sessionPath = path.join(os.tmpdir(), 'ougl-sessions', sid + '-clarify.md');
  getRegisterHtmlSession()(sid, sessionPath, 'clarify');
  getLinkSessionToJourney()(sid, journeyId);

  // Inject discovery content into system prompt + store parentJourneyId server-side
  var session = getGetHtmlSession()(sid);
  if (session && discoveryContent) {
    session.systemPrompt += '\n\n---\n\n**Pre-loaded discovery artefact (read-only context):**\n\n' + discoveryContent;
  }
  if (session) {
    session.parentJourneyId = journeyId;
  }

  // Record side-trip session on journey for cleanup — does NOT change activeSkill/activeSessionId
  journey.sideTripSessionId = sid;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ sideTripSessionId: sid }));
}

/**
 * DELETE /api/journey/:journeyId/side-trip — owle.1
 * Closes the active side-trip session. Does not modify parent journey state.
 */
async function handleDeleteSideTrip(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  var sideTripSid = journey.sideTripSessionId;
  if (sideTripSid) {
    var stSession = getGetHtmlSession()(sideTripSid);
    if (stSession) { stSession.done = true; }
    journey.sideTripSessionId = null;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ closed: true }));
}

/**
 * Computes a trace result for an artefact directory.
 * Checks presence of discovery.md, stories/, test-plans/<slug>-test-plan.md, dor/<slug>-dor.md.
 * Returns { status: 'passed'|'has-findings'|'failed', findings: [{type, path, message}] }.
 */
function computeTrace(artefactsDir) {
  var findings = [];

  // Missing discovery.md is a hard failure
  var discoveryPath = path.join(artefactsDir, 'discovery.md');
  if (!fs.existsSync(discoveryPath)) {
    findings.push({ type: 'missing-discovery', path: discoveryPath, message: 'discovery.md not found' });
    return { status: 'failed', findings: findings };
  }

  // Enumerate story files
  var storiesDir = path.join(artefactsDir, 'stories');
  var stories = [];
  if (fs.existsSync(storiesDir)) {
    stories = fs.readdirSync(storiesDir).filter(function(f) { return f.endsWith('.md'); });
  }
  if (stories.length === 0) {
    findings.push({ type: 'no-stories', path: storiesDir, message: 'No story files found in stories/' });
  }

  // For each story, check test-plan and dor
  stories.forEach(function(storyFile) {
    var slug = storyFile.replace(/\.md$/, '');
    var testPlanPath = path.join(artefactsDir, 'test-plans', slug + '-test-plan.md');
    if (!fs.existsSync(testPlanPath)) {
      findings.push({ type: 'missing-test-plan', path: testPlanPath, message: 'Test plan not found for story: ' + slug });
    }
    var dorPath = path.join(artefactsDir, 'dor', slug + '-dor.md');
    if (!fs.existsSync(dorPath)) {
      findings.push({ type: 'missing-dor', path: dorPath, message: 'DoR not found for story: ' + slug });
    }
  });

  if (findings.length > 0) {
    return { status: 'has-findings', findings: findings };
  }
  return { status: 'passed', findings: [] };
}

/**
 * GET /api/journey/:journeyId/trace — owle.3
 * Runs a presence-based trace check on the feature's artefact directory.
 * Returns { status, findings }. Fresh on every request — no caching.
 */
async function handleGetTrace(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }

  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var artefactsDir = path.resolve(repoRoot, 'artefacts', featureSlug);
  // Path traversal guard
  if (!artefactsDir.startsWith(path.resolve(repoRoot, 'artefacts') + path.sep) &&
      artefactsDir !== path.resolve(repoRoot, 'artefacts')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid feature slug' }));
    return;
  }

  try {
    var result = computeTrace(artefactsDir);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Trace failed', detail: err.message }));
  }
}

/**
 * POST /api/journey/:journeyId/decisions — owle.2
 * Appends a decision entry to artefacts/<featureSlug>/decisions.md.
 * Required body fields: title, context, decision, rationale. Optional: riskAccept (bool).
 * Returns 200 on success; 400 on validation failure or path traversal.
 */
async function handlePostDecisions(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }

  // Validate required fields before any file I/O
  var body = req.body || {};
  var required = ['title', 'context', 'decision', 'rationale'];
  for (var i = 0; i < required.length; i++) {
    if (!body[required[i]]) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing required field', missing: required[i] }));
      return;
    }
  }

  // Derive path server-side from journey — NEVER from request body/params
  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var decisionsPath = path.resolve(repoRoot, 'artefacts', featureSlug, 'decisions.md');
  var guard = path.resolve(repoRoot, 'artefacts', featureSlug);
  if (!guard.startsWith(repoRoot + path.sep)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid feature slug' }));
    return;
  }

  var date = new Date().toISOString().slice(0, 10);
  var riskLabel = body.riskAccept ? ' RISK-ACCEPT' : '';
  var entry = '\n## ' + body.title + riskLabel + '\n\n'
    + '**Date:** ' + date + '\n'
    + '**Context:** ' + body.context + '\n'
    + '**Decision:** ' + body.decision + '\n'
    + '**Rationale:** ' + body.rationale + '\n';

  try {
    var dir = path.dirname(decisionsPath);
    fs.mkdirSync(dir, { recursive: true });
    var header = '# Decisions — ' + featureSlug + '\n';
    if (!fs.existsSync(decisionsPath)) {
      fs.writeFileSync(decisionsPath, header, 'utf8');
    }
    fs.appendFileSync(decisionsPath, entry, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ written: decisionsPath }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Write failed', detail: err.message }));
  }
}

/**
 * GET /api/journey/:journeyId — owle.1
 * Returns main journey state. sideTripSessionId is intentionally excluded.
 */
function handleGetJourneyState(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  // sideTripSessionId intentionally omitted — server-side only
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    journeyId:       journey.journeyId,
    featureSlug:     journey.featureSlug,
    activeSkill:     journey.activeSkill,
    activeSessionId: journey.activeSessionId,
    completedStages: journey.completedStages,
    complete:        journey.complete
  }));
}

module.exports = {
  handleGetJourney,
  handlePostJourney,
  handlePostGateConfirm,
  handleGetStories,
  handlePostStories,
  handleGetJourneyComplete,
  handleGetStageControls,
  handleGetTrace,
  handlePostDecisions,
  handlePostSideTripClarify,
  handleDeleteSideTrip,
  handleGetJourneyState,
  setRegisterHtmlSession,
  setLinkSessionToJourney,
  setJourneyStoreModule,
  setGetHtmlSession,
  setRepoRoot
};


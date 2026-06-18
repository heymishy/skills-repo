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
var _listHtmlSessionsFn = null;
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

// owle.6: injectable pipeline-state writer
var _pipelineStateWriter = function() {
  throw new Error('Adapter not wired: pipelineStateWriter. Call setPipelineStateWriter() before use.');
};
function setPipelineStateWriter(fn) { _pipelineStateWriter = fn; }

// cdg.4: injectable validate adapter — gate-confirm DoR enforcement (D37)
var _validate = function() {
  throw new Error('Adapter not wired: validate. Call setValidate() before use.');
};
function setValidate(fn) { _validate = fn; }

// cdg.5: injectable writeTrace adapter -- gate-confirm chain-hash trace emission (D37)
var _writeTrace = function() {
  throw new Error('Adapter not wired: writeTrace. Call setWriteTrace() before use.');
};
function setWriteTrace(fn) { _writeTrace = fn; }

// Adapter setters (used by tests)
function setRegisterHtmlSession(fn) { _registerHtmlSession = fn; }
function setLinkSessionToJourney(fn) { _linkSessionToJourney = fn; }
function setJourneyStoreModule(mod) { _journeyStore = mod; }
function setGetHtmlSession(fn) { _getHtmlSessionFn = fn; }
function setListHtmlSessions(fn) { _listHtmlSessionsFn = fn; }
function setRepoRoot(root) { _repoRoot = root; }

// ---------------------------------------------------------------------------
// Journey home helpers
// ---------------------------------------------------------------------------

var _journeyDisk = require('../../modules/journey-disk');

var STAGE_META = [
  { id: 'ideate',              num: 1,    label: 'Idea',       optional: true },
  { id: 'discovery',           num: 2,    label: 'Discovery',  optional: false },
  { id: 'benefit-metric',      num: '2b', label: 'Benefits',   optional: false },
  { id: 'design',              num: 3,    label: 'Design',     optional: false },
  { id: 'definition',          num: 4,    label: 'Definition', optional: false },
  { id: 'test-plan',           num: 5,    label: 'Test Plan',  optional: false },
  { id: 'review',              num: 6,    label: 'Review',     optional: false },
  { id: 'definition-of-ready', num: 7,    label: 'Ready',      optional: false }
];

function _listProfiles(repoRoot) {
  var profilesDir = path.join(repoRoot, 'product', 'profiles');
  if (!fs.existsSync(profilesDir)) return ['default'];
  try {
    return fs.readdirSync(profilesDir).filter(function(d) {
      try { return fs.statSync(path.join(profilesDir, d)).isDirectory(); } catch (_) { return false; }
    });
  } catch (_) { return ['default']; }
}

function _getActiveProfile(repoRoot) {
  try {
    var ap = path.join(repoRoot, 'product', 'active-profile');
    if (fs.existsSync(ap)) return fs.readFileSync(ap, 'utf8').trim() || 'default';
  } catch (_) {}
  return 'default';
}

function _slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

function _featureDisplayName(slug) {
  var name = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function _readFormBody(req) {
  return new Promise(function(resolve) {
    if (req.body !== undefined) { resolve(req.body); return; }
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      try {
        var params = new URLSearchParams(raw);
        var obj = {};
        params.forEach(function(v, k) { obj[k] = v; });
        resolve(obj);
      } catch (_) { resolve({}); }
    });
    req.on('error', function() { resolve({}); });
  });
}

function _renderJourneyHome(data) {
  var profiles     = data.profiles || ['default'];
  var activeProfile = data.activeProfile || 'default';
  var journeys     = data.journeys || [];
  var showNewForm  = data.showNewForm;

  function stageLabel(stageId) {
    var m = STAGE_META.find(function(s) { return s.id === stageId; });
    return m ? m.num + '. ' + m.label : stageId;
  }

  function progressDots(stages) {
    return STAGE_META.map(function(s) {
      var st = stages && stages[s.id] && stages[s.id].status;
      var cls = st === 'complete' ? 'jh-dot--done' : st === 'active' ? 'jh-dot--active' : s.optional ? 'jh-dot--optional' : '';
      return '<span class="jh-dot ' + cls + '" title="' + escHtml(s.label) + '"></span>';
    }).join('');
  }

  var cards = journeys.map(function(j) {
    var resumeUrl = '/journey/' + encodeURIComponent(j.featureSlug || '') + '/resume';
    return [
      '<div class="jh-card">',
        '<div class="jh-card__main">',
          '<div class="jh-card__name">' + escHtml(_featureDisplayName(j.featureSlug || '')) + '</div>',
          '<div class="jh-card__meta">',
            '<span class="jh-stage-badge">' + escHtml(stageLabel(j.currentStage || '')) + '</span>',
            '<span class="jh-card__profile">◈ ' + escHtml(j.productProfile || 'default') + '</span>',
            '<span class="jh-card__date">' + escHtml((j.createdAt || '').slice(0, 10)) + '</span>',
          '</div>',
          '<div class="jh-progress">' + progressDots(j.stages) + '</div>',
        '</div>',
        '<a href="' + escHtml(resumeUrl) + '" class="jh-continue">Continue →</a>',
      '</div>'
    ].join('');
  }).join('');

  var profileOpts = profiles.map(function(p) {
    return '<option value="' + escHtml(p) + '"' + (p === activeProfile ? ' selected' : '') + '>' + escHtml(p) + '</option>';
  }).join('');

  var profileField = profiles.length > 1
    ? '<div class="jh-form-row"><label class="jh-label" for="jh-profile">Product context</label>' +
      '<select id="jh-profile" class="jh-select" name="profileName">' + profileOpts + '</select></div>'
    : '<input type="hidden" name="profileName" value="' + escHtml(activeProfile) + '">';

  return [
    '<style>',
    '.jh-home{max-width:820px}',
    '.jh-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px}',
    '.jh-title{font-size:22px;font-weight:700;margin:0 0 4px}',
    '.jh-sub{color:var(--muted);font-size:14px;margin:0}',
    '.jh-hdr-right{display:flex;align-items:center;gap:12px;flex-shrink:0}',
    '.jh-profile-pill{font-size:12px;color:var(--muted);background:var(--line);padding:4px 10px;border-radius:20px}',
    '.jh-section{margin-bottom:28px}',
    '.jh-section h2{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 12px}',
    '.jh-empty{color:var(--muted);font-size:14px;padding:16px 0}',
    '.jh-card{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:10px;background:var(--surface);gap:16px}',
    '.jh-card__main{flex:1;min-width:0}',
    '.jh-card__name{font-weight:600;font-size:14px;margin-bottom:5px}',
    '.jh-card__meta{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:12px;color:var(--muted)}',
    '.jh-stage-badge{background:var(--accent-soft,#eaf1fb);color:var(--accent-ink,#0969da);padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}',
    '.jh-progress{display:flex;gap:5px;align-items:center}',
    '.jh-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--line-2,#ddd)}',
    '.jh-dot--done{background:#2da44e}',
    '.jh-dot--active{background:var(--accent,#0969da)}',
    '.jh-dot--optional{opacity:.4}',
    '.jh-continue{flex-shrink:0;font-size:13px;color:var(--accent,#0969da);font-weight:600;text-decoration:none;padding:6px 14px;border:1px solid var(--line);border-radius:6px;white-space:nowrap}',
    '.jh-continue:hover{background:var(--line)}',
    '.jh-new-section{border-top:1px solid var(--line);padding-top:24px}',
    '.jh-form{max-width:480px}',
    '.jh-form-row{margin-bottom:18px}',
    '.jh-label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}',
    '.jh-input{width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid var(--line);border-radius:6px;font-size:14px;background:var(--bg);color:var(--ink)}',
    '.jh-input:focus{outline:2px solid var(--accent,#0969da);border-color:transparent}',
    '.jh-select{padding:8px 12px;border:1px solid var(--line);border-radius:6px;font-size:14px;background:var(--bg);color:var(--ink)}',
    '.jh-radio-label{display:flex;align-items:baseline;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer;line-height:1.5}',
    '.jh-submit{margin-top:4px}',
    '</style>',
    '<div class="sw-page-content jh-home">',
      '<div class="jh-hdr">',
        '<div>',
          '<h1 class="jh-title">Journeys</h1>',
          '<p class="jh-sub">Guide a feature from idea to ready.</p>',
        '</div>',
        '<div class="jh-hdr-right">',
          '<span class="jh-profile-pill">◈ ' + escHtml(activeProfile) + '</span>',
          '<a href="/journey?new=1#jh-new" class="sw-btn sw-btn--primary">+ New feature</a>',
        '</div>',
      '</div>',
      '<section class="jh-section">',
        '<h2>' + (journeys.length > 0 ? 'Features (' + journeys.length + ')' : 'Features') + '</h2>',
        journeys.length > 0 ? cards : '<p class="jh-empty">No features yet — start one below.</p>',
      '</section>',
      '<section class="jh-new-section" id="jh-new"' + (showNewForm ? ' style="background:var(--accent-soft,#eaf1fb);padding:20px;border-radius:8px;margin-top:4px"' : '') + '>',
        '<h2>Start a new feature</h2>',
        '<form method="POST" action="/api/journey" class="jh-form">',
          '<div class="jh-form-row">',
            '<label class="jh-label" for="jh-fname">Feature name</label>',
            '<input id="jh-fname" class="jh-input" name="featureName" type="text" placeholder="e.g. Impact matrix tool" required autofocus>',
          '</div>',
          '<div class="jh-form-row">',
            '<label class="jh-label">Where are you starting from?</label>',
            '<label class="jh-radio-label"><input type="radio" name="startSkill" value="ideate"> Rough idea — explore the opportunity space first</label>',
            '<label class="jh-radio-label"><input type="radio" name="startSkill" value="discovery" checked> Formed idea — jump straight to discovery</label>',
          '</div>',
          profileField,
          '<button type="submit" class="sw-btn sw-btn--primary jh-submit">Start journey →</button>',
        '</form>',
      '</section>',
    '</div>'
  ].join('');
}

/**
 * GET /journey — journey home screen: list features, start new.
 */
function handleGetJourney(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var login      = req.session.login || '';
  var repoRoot   = getRepoRoot();
  var profiles   = _listProfiles(repoRoot);
  var activeProfile = _getActiveProfile(repoRoot);
  var journeys   = _journeyStore.listJourneys ? _journeyStore.listJourneys(repoRoot) : [];
  journeys.sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
  var showNewForm = !!(req.query && req.query.new === '1');
  var body = _renderJourneyHome({ profiles: profiles, activeProfile: activeProfile, journeys: journeys, showNewForm: showNewForm });
  var html = renderShell({ title: 'Journeys', active: 'journey', bodyContent: body, user: { login: login } });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/journey — create journey and start first skill session.
 * Form fields: featureName, startSkill (ideate|discovery), profileName
 */
async function handlePostJourney(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  try {
    var body        = await _readFormBody(req);
    var featureName = (body.featureName || '').trim();
    var startSkill  = body.startSkill === 'ideate' ? 'ideate' : 'discovery';
    var profileName = (body.profileName || '').trim() || _getActiveProfile(getRepoRoot());

    if (!featureName) {
      res.writeHead(303, { Location: '/journey?new=1#jh-new' });
      res.end();
      return;
    }

    var today       = new Date().toISOString().slice(0, 10);
    var featureSlug = today + '-' + _slugify(featureName);
    var repoRoot    = getRepoRoot();

    // Create journey in memory + disk
    var created = _journeyStore.createJourney(featureSlug, profileName);
    var journeyId = created.journeyId;
    created.ownerId = req.session.login || null;

    // Session path under artefacts so reference/ folder is discovered by buildSystemPrompt
    var sid         = crypto.randomUUID();
    var sessionPath = path.join(repoRoot, 'artefacts', featureSlug, 'sessions', sid);

    getRegisterHtmlSession()(sid, sessionPath, startSkill, { productProfile: profileName });
    getLinkSessionToJourney()(sid, journeyId);
    if (_journeyStore.setActiveSession) {
      _journeyStore.setActiveSession(journeyId, sid, startSkill);
    }
    // Mark stage active on disk
    try { _journeyDisk.updateStage(featureSlug, startSkill, { status: 'active', sessionId: sid }, repoRoot); } catch (_) {}

    res.writeHead(303, { Location: '/skills/' + encodeURIComponent(startSkill) + '/sessions/' + sid + '/chat' });
    res.end();
  } catch (err) {
    var errBody = [
      '<div class="sw-page-content">',
      '<h1>Error starting journey</h1>',
      '<p>' + escHtml(err.message || 'An unexpected error occurred.') + '</p>',
      '<a href="/journey">Try again</a>',
      '</div>'
    ].join('');
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: errBody }));
  }
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

  // cdg.4: validate DoR artefact before state write (ADR-023: disk → validate → state)
  if (session.skillName === 'definition-of-ready') {
    var validateResult;
    try {
      validateResult = _validate(absPath, 'definition-of-ready', repoRoot);
    } catch (validErr) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: validErr.message }));
      return;
    }
    if (validateResult.exitCode !== 0) {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'validation-failed', exitCode: validateResult.exitCode, detail: validateResult.stderr || '' }));
      return;
    }
  }

  // owle.6: notify pipeline-state writer (after disk write + completeStage)
  var stateWriteSucceeded = false;
  try {
    var stateUpdate = {};
    if (session.skillName === 'discovery') {
      stateUpdate.discoveryStatus = 'complete';
      stateUpdate.artefact = artefactRelPath;
    } else if (session.skillName === 'definition-of-ready') {
      stateUpdate.dorStatus = 'signed-off';
      stateUpdate.stage = 'branch-complete';
      stateUpdate.updatedAt = new Date().toISOString().slice(0, 10);
    } else {
      stateUpdate.stage = session.skillName;
    }
    var currentStory = journey.stories && journey.stories[journey.currentStoryIndex];
    var storyId = currentStory ? (currentStory.id || currentStory.slug || null) : null;
    _pipelineStateWriter(journey.featureSlug, storyId, stateUpdate);
    stateWriteSucceeded = true;
  } catch (psErr) {
    console.error(JSON.stringify({ event: 'pipeline_state_write_failed', error: psErr.message }));
  }

  // cdg.5: chain-hash trace emission -- only after successful state write (ADR-023)
  // If _writeTrace throws, exception propagates (state is already written and final)
  if (session.skillName === 'definition-of-ready' && stateWriteSucceeded) {
    var operatorEmail = '';
    try { operatorEmail = require('child_process').execSync('git config user.email', { encoding: 'utf8' }).trim(); } catch (_) {}
    _writeTrace({
      timestamp: new Date().toISOString(),
      featureSlug: journey.featureSlug,
      storyId: storyId,
      stage: session.skillName,
      operatorEmail: operatorEmail,
      exitCode: 0
    });
  }

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

// ---------------------------------------------------------------------------
// wsm.2 — collaborative journey sharing: viewer sync, ownership, idle
// ---------------------------------------------------------------------------

// Injectable clock for test isolation (T7 requires mock clock)
var _now = function() { return Date.now(); };
function setNow(fn) { _now = fn; }

// Viewer activity tracker: journeyId → Map<login, lastSeenMs>
var _viewerActivity = new Map();

/**
 * Register a viewer's activity on a journey (called on each GET state/viewer poll).
 * @param {string} journeyId
 * @param {string} login
 */
function _registerViewer(journeyId, login) {
  if (!_viewerActivity.has(journeyId)) {
    _viewerActivity.set(journeyId, new Map());
  }
  _viewerActivity.get(journeyId).set(login || 'anon', _now());
}

/**
 * Count viewers who have been active within inactivityMs milliseconds.
 * @param {string} journeyId
 * @param {number} [inactivityMs=30000]
 * @returns {number}
 */
function _getActiveViewerCount(journeyId, inactivityMs) {
  var cutoff = _now() - (inactivityMs != null ? inactivityMs : 30000);
  if (!_viewerActivity.has(journeyId)) return 0;
  var count = 0;
  var map = _viewerActivity.get(journeyId);
  for (var entry of map) {
    if (entry[1] >= cutoff) count++;
  }
  return count;
}

/**
 * GET /journey/:journeyId — shareable journey URL.
 * Unauthenticated → 302 /auth/github (AC2).
 * Authenticated → renders journey overview HTML or 404 if not found.
 */
function handleGetJourneyById(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Journey not found', bodyContent: '<p>Journey not found.</p>', user: { login: req.session.login || '' } }));
    return;
  }
  var login = req.session.login || '';
  _registerViewer(journeyId, login);
  var activeUsers = _getActiveViewerCount(journeyId);
  var body = [
    '<div class="sw-page-content">',
    '<h1>Journey: ' + escHtml(journey.featureSlug || journeyId) + '</h1>',
    '<p>Stage: <strong>' + escHtml(journey.activeSkill || 'not started') + '</strong></p>',
    '<p>Active viewers: ' + activeUsers + '</p>',
    '</div>'
  ].join('');
  var html = renderShell({ title: 'Journey', bodyContent: body, user: { login: login } });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * GET /api/journey/:journeyId — returns journey state as JSON.
 * Requires authentication (login). Available to any authenticated user (not just owner).
 * Returns { turns, stage, stages (breadcrumb), activeUsers } (wsm.2 AC1/AC2/AC4, wsm.3 AC1).
 */
async function handleGetJourneyState(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  var login = req.session.login || 'anon';
  _registerViewer(journeyId, login);
  var activeUsers = _getActiveViewerCount(journeyId);

  // Get turns from active session if available
  var turns = [];
  if (journey.activeSessionId) {
    var getSession = getGetHtmlSession();
    var session = getSession(journey.activeSessionId);
    turns = (session && session.turns) || [];
  }

  // wsm.3 AC1: compute breadcrumb stages from completedStages + active stage
  var stages = _computeBreadcrumb(journey);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    turns: turns,
    stage: journey.activeSkill || (journey.completedStages && journey.completedStages.length > 0
      ? ((journey.completedStages[journey.completedStages.length - 1] || {}).skillName || 'discovery')
      : 'discovery'),
    stages: stages,
    activeUsers: activeUsers,
    status: journey.status || 'active',
    activeSkill: journey.activeSkill,
    activeSessionId: journey.activeSessionId,
    completedStages: journey.completedStages,
    complete: journey.complete
  }));
}

/**
 * GET /api/journey/:journeyId/viewers — returns active viewer count.
 * Requires authentication.
 */
async function handleGetJourneyViewers(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  var activeUsers = _getActiveViewerCount(journeyId);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ count: activeUsers }));
}

/**
 * Check if a journey has been idle for > 30 minutes and set status:'idle' if so.
 * Uses injectable _now() for test isolation.
 * @param {string} journeyId
 */
function checkJourneyIdle(journeyId) {
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) return;
  var lastActivity = journey.lastActivityAt || 0;
  var idleMs = 30 * 60 * 1000;
  if (_now() - lastActivity > idleMs) {
    journey.status = 'idle';
  }
}

// ---------------------------------------------------------------------------
// wsm.3 — stage back-navigation, breadcrumb, and needs-review
// ---------------------------------------------------------------------------

/**
 * Injectable disk session writer for journey state persistence.
 * Used to persist needs-review flags across restarts.
 */
var _diskJourneyWriter = {
  write: function() {},
  read: function() { return null; },
  list: function() { return []; },
  loadSessions: function() {}
};

/**
 * Wire the disk session writer for journey metadata persistence (wsm.3).
 * @param {object} writer — { write(id, data), read(id), list() }
 */
function setDiskSessionWriter(writer) { _diskJourneyWriter = writer; }

/**
 * Compute the breadcrumb stages array from a journey's completedStages + active stage.
 * Completed stages are navigable; current/future are not.
 * @param {object} journey
 * @returns {Array<{ stage: string, status: string, navigable: boolean }>}
 */
function _computeBreadcrumb(journey) {
  var completed = (journey.completedStages || []).map(function(s) {
    return { stage: s.skillName, status: s.status || 'completed', navigable: true };
  });
  if (journey.activeSkill) {
    completed.push({ stage: journey.activeSkill, status: 'active', navigable: false });
  }
  return completed;
}

/**
 * GET /api/journey/:journeyId/stage/:stageName
 * Returns turns and state for a prior completed stage.
 * Returns 404 for stages not yet completed.
 */
async function handleGetJourneyStage(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var stageName = req.params && req.params.stageName;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  var stage = (journey.completedStages || []).find(function(s) { return s.skillName === stageName; });
  if (!stage) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Stage not found or not yet completed' }));
    return;
  }
  var turns = [];
  if (stage.sessionId) {
    var getSession = getGetHtmlSession();
    var session = getSession(stage.sessionId);
    turns = (session && session.turns) || [];
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    turns: turns,
    state: { skillName: stage.skillName, artefactPath: stage.artefactPath, status: stage.status || 'completed' },
    reCommitAvailable: true
  }));
}

/**
 * POST /api/journey/:journeyId/stage/:stageName/recommit
 * Owner only. If confirmed:true, sets all stages after the target to status:'needs-review'.
 * Persists to disk. If confirmed:false, returns { cancelled: true }.
 */
async function handlePostJourneyRecommit(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var stageName = req.params && req.params.stageName;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  // Owner-only check
  if (journey.ownerId && journey.ownerId !== (req.session && req.session.login)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'FORBIDDEN' }));
    return;
  }
  var body = req.body || {};
  // confirmed:false → cancel with no state change
  if (!body.confirmed) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ cancelled: true }));
    return;
  }
  // Find the target stage index in completedStages
  var stages = journey.completedStages || [];
  var targetIdx = stages.findIndex(function(s) { return s.skillName === stageName; });
  if (targetIdx === -1) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Stage not found in completed stages' }));
    return;
  }
  // Set all stages AFTER the target to needs-review (target itself is unchanged)
  for (var i = targetIdx + 1; i < stages.length; i++) {
    stages[i].status = 'needs-review';
  }
  // Persist the updated stage statuses to disk
  var metaKey = 'journey-meta-' + journeyId;
  _diskJourneyWriter.write(metaKey, {
    journeyId: journeyId,
    completedStageStatuses: stages.map(function(s) {
      return { skillName: s.skillName, status: s.status || 'completed' };
    })
  });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, stages: _computeBreadcrumb(journey) }));
}

/**
 * GET /api/journey/:journeyId/stage-controls
 * Returns stage controls including needsReview flag for the stage specified by ?stage= query param.
 */
async function handleGetJourneyStageControls(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  // Parse ?stage= from URL
  var url = req.url || '';
  var stageParam = '';
  var qIdx = url.indexOf('?');
  if (qIdx !== -1) {
    var qs = url.slice(qIdx + 1);
    qs.split('&').forEach(function(part) {
      var kv = part.split('=');
      if (kv[0] === 'stage') stageParam = decodeURIComponent(kv[1] || '');
    });
  }
  // Also support req.query if available
  if (!stageParam && req.query && req.query.stage) stageParam = req.query.stage;
  // Find stage in completedStages
  var stage = stageParam ? (journey.completedStages || []).find(function(s) { return s.skillName === stageParam; }) : null;
  var needsReview = !!(stage && stage.status === 'needs-review');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    stage: stageParam || null,
    needsReview: needsReview,
    needsReviewMessage: needsReview ? 'A prior stage was updated — review this stage before proceeding' : null
  }));
}

/**
 * POST /api/journey/:journeyId/stage/:stageName/commit
 * Owner only. Clears the needs-review flag for a specific completed stage (not downstream).
 * Optionally updates artefactPath if provided in body.
 */
async function handlePostJourneyStageCommit(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var stageName = req.params && req.params.stageName;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  if (journey.ownerId && journey.ownerId !== (req.session && req.session.login)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'FORBIDDEN' }));
    return;
  }
  var stage = (journey.completedStages || []).find(function(s) { return s.skillName === stageName; });
  if (!stage) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Stage not found' }));
    return;
  }
  var body = req.body || {};
  if (body.artefactPath) stage.artefactPath = body.artefactPath;
  stage.status = 'completed';
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, stage: stage.skillName, status: stage.status }));
}

/**
 * Load journey metadata (stage statuses) from disk and apply to journeyStore.
 * Called at startup restore time.
 * @param {object} diskReader — { list(), read(id) }
 * @param {object} journeyStoreMod — { getJourney(id) }
 */
function loadJourneyMeta(diskReader, journeyStoreMod) {
  var keys = diskReader.list();
  keys.forEach(function(key) {
    if (key.indexOf('journey-meta-') !== 0) return;
    var data = diskReader.read(key);
    if (!data || !data.journeyId || !Array.isArray(data.completedStageStatuses)) return;
    var journey = journeyStoreMod.getJourney(data.journeyId);
    if (!journey) return;
    data.completedStageStatuses.forEach(function(saved) {
      var stage = (journey.completedStages || []).find(function(s) { return s.skillName === saved.skillName; });
      if (stage) stage.status = saved.status;
    });
  });
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
  var estimateAvailable = (journey.activeSkill === 'discovery' || journey.activeSkill === 'definition');
  var spikeAvailable = true;

  // Enumerate open spikes for this journey's feature
  var openSpikes = [];
  var featureSlugForControls = journey.featureSlug || '';
  if (featureSlugForControls) {
    var spikesDir = path.join(getRepoRoot(), 'artefacts', featureSlugForControls, 'spikes');
    if (fs.existsSync(spikesDir)) {
      var spikeFiles = fs.readdirSync(spikesDir).filter(function(f) { return f.endsWith('.md'); });
      spikeFiles.forEach(function(f) {
        var full = path.join(spikesDir, f);
        var content = '';
        try { content = fs.readFileSync(full, 'utf8'); } catch(_) {}
        if (content.includes('status: OPEN') || content.includes('status:OPEN')) {
          // Extract title from first heading or filename
          var titleMatch = content.match(/^#\s+(.+)$/m);
          var title = titleMatch ? titleMatch[1].trim() : f.replace(/-spike\.md$/, '');
          openSpikes.push({ title: title, path: path.join('artefacts', featureSlugForControls, 'spikes', f) });
        }
      });
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ clarifyAvailable: clarifyAvailable, logDecisionAvailable: true, traceAvailable: true, estimateAvailable: estimateAvailable, spikeAvailable: spikeAvailable, openSpikes: openSpikes }));
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
 * POST /api/journey/:journeyId/estimate — owle.4
 * Appends an estimation row to workspace/estimation-norms.md.
 * Required body fields: pass (E1|E2|E3), focusHours (positive number), complexity, scopeStability.
 * Optional: notes.
 * featureSlug is read server-side from journey — NEVER from request body.
 */
async function handlePostEstimate(req, res) {
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

  var body = req.body || {};
  var focusHours = Number(body.focusHours);
  if (body.focusHours === undefined || body.focusHours === null || isNaN(focusHours) || String(body.focusHours).trim() === '') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid focusHours: must be a number' }));
    return;
  }
  if (focusHours < 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid focusHours: must be non-negative' }));
    return;
  }

  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var normPath = path.join(repoRoot, 'workspace', 'estimation-norms.md');

  var date = new Date().toISOString().slice(0, 10);
  var pass = String(body.pass || '');
  var complexity = String(body.complexity || '');
  var scopeStability = String(body.scopeStability || '');
  var notes = String(body.notes || '');
  var row = '| ' + [date, featureSlug, pass, focusHours, complexity, scopeStability, notes].join(' | ') + ' |\n';

  var HEADER = '| date | feature | pass | focusHours | complexity | scopeStability | notes |\n'
    + '|------|---------|------|------------|------------|----------------|-------|\n';

  try {
    var workspaceDir = path.dirname(normPath);
    fs.mkdirSync(workspaceDir, { recursive: true });
    if (!fs.existsSync(normPath)) {
      fs.writeFileSync(normPath, HEADER, 'utf8');
    }
    fs.appendFileSync(normPath, row, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, row: row.trim() }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Write failed', detail: err.message }));
  }
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
 /**
 * titleToSlug — converts a spike title to a filename-safe slug.
 * Returns empty string if no alphanumeric chars present.
 */
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * POST /api/journey/:journeyId/spikes — owle.5
 * Creates a new spike artefact file at artefacts/<featureSlug>/spikes/<slug>-spike.md.
 * Required body: title, question, scopeLimitHours, doneCondition.
 * featureSlug read server-side from journey.
 */
async function handlePostSpike(req, res) {
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
  var body = req.body || {};
  var rawTitle = String(body.title || '');
  // Reject titles containing path traversal sequences
  if (rawTitle.includes('..') || rawTitle.includes('/') || rawTitle.includes('\\')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid title: path separators not allowed' }));
    return;
  }
  var slug = titleToSlug(rawTitle);
  if (!slug) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid title: must contain at least one alphanumeric character' }));
    return;
  }
  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var spikesDir = path.join(repoRoot, 'artefacts', featureSlug, 'spikes');
  var spikePath = path.join(spikesDir, slug + '-spike.md');
  // Path traversal guard
  var resolvedRoot = path.resolve(repoRoot);
  var resolvedSpike = path.resolve(spikePath);
  if (!resolvedSpike.startsWith(resolvedRoot + path.sep)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid title: path traversal detected' }));
    return;
  }
  if (fs.existsSync(spikePath)) {
    res.writeHead(409, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Spike already exists' }));
    return;
  }
  var question = String(body.question || '');
  var scopeLimitHours = body.scopeLimitHours !== undefined ? body.scopeLimitHours : '';
  var doneCondition = String(body.doneCondition || '');
  var content = '# ' + rawTitle + '\n\n'
    + 'status: OPEN\n'
    + 'scopeLimitHours: ' + scopeLimitHours + '\n'
    + 'outcome:\n\n'
    + '## Question\n\n' + question + '\n\n'
    + '## Done Condition\n\n' + doneCondition + '\n\n'
    + '## Outcome / Summary\n\n';
  try {
    fs.mkdirSync(spikesDir, { recursive: true });
    fs.writeFileSync(spikePath, content, 'utf8');
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, path: path.join('artefacts', featureSlug, 'spikes', slug + '-spike.md') }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Write failed', detail: err.message }));
  }
}

/**
 * PATCH /api/journey/:journeyId/spikes/:spikeSlug — owle.5
 * Records outcome on a spike file (status: OPEN → RESOLVED).
 * Required body: outcome, summary.
 */
async function handlePatchSpike(req, res) {
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
  var spikeSlug = req.params && req.params.spikeSlug;
  if (!spikeSlug) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'spikeSlug required' }));
    return;
  }
  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var spikePath = path.join(repoRoot, 'artefacts', featureSlug, 'spikes', spikeSlug + '-spike.md');
  // Path traversal guard
  var resolvedRoot = path.resolve(repoRoot);
  if (!path.resolve(spikePath).startsWith(resolvedRoot + path.sep)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid spikeSlug' }));
    return;
  }
  if (!fs.existsSync(spikePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Spike not found' }));
    return;
  }
  var body = req.body || {};
  var outcome = String(body.outcome || '');
  var summary = String(body.summary || '');
  var content = fs.readFileSync(spikePath, 'utf8');
  content = content.replace(/status: OPEN/g, 'status: RESOLVED');
  content = content.replace(/outcome:\s*\n/, 'outcome: ' + outcome + '\n');
  content += '\n**Summary:** ' + summary + '\n';
  fs.writeFileSync(spikePath, content, 'utf8');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}

// ---------------------------------------------------------------------------
// wucp.2 — Slash command router
// ---------------------------------------------------------------------------

/**
 * Static map classifying skills by the surface capabilities they require.
 * Skills with non-empty capabilities display a notice in the web UI prompt.
 * Skills with [] have no surface limitations and work fully in the web UI.
 */
var SLASH_CAPABILITY_MAP = {
  'benefit-metric':          { capabilities: [], limitedOnWebUI: false },
  'bootstrap':               { capabilities: [], limitedOnWebUI: false },
  'branch-complete':         { capabilities: ['git-worktree', 'bash-scripts', 'pr-creation'], limitedOnWebUI: true },
  'branch-setup':            { capabilities: ['git-worktree', 'bash-scripts'], limitedOnWebUI: true },
  'checkpoint':              { capabilities: [], limitedOnWebUI: false },
  'clarify':                 { capabilities: [], limitedOnWebUI: false },
  'coverage-map':            { capabilities: [], limitedOnWebUI: false },
  'decisions':               { capabilities: [], limitedOnWebUI: false },
  'definition':              { capabilities: [], limitedOnWebUI: false },
  'definition-of-done':      { capabilities: [], limitedOnWebUI: false },
  'definition-of-ready':     { capabilities: [], limitedOnWebUI: false },
  'discovery':               { capabilities: [], limitedOnWebUI: false },
  'ea-registry':             { capabilities: ['external-registry'], limitedOnWebUI: true },
  'estimate':                { capabilities: [], limitedOnWebUI: false },
  'ideate':                  { capabilities: [], limitedOnWebUI: false },
  'implementation-plan':     { capabilities: [], limitedOnWebUI: false },
  'implementation-review':   { capabilities: [], limitedOnWebUI: false },
  'improve':                 { capabilities: [], limitedOnWebUI: false },
  'improvement-agent':       { capabilities: [], limitedOnWebUI: false },
  'issue-dispatch':          { capabilities: ['gh-cli'], limitedOnWebUI: true },
  'loop-design':             { capabilities: [], limitedOnWebUI: false },
  'metric-review':           { capabilities: [], limitedOnWebUI: false },
  'modernisation-decompose': { capabilities: [], limitedOnWebUI: false },
  'org-mapping':             { capabilities: [], limitedOnWebUI: false },
  'orient':                  { capabilities: [], limitedOnWebUI: false },
  'persona-routing':         { capabilities: [], limitedOnWebUI: false },
  'prioritise':              { capabilities: [], limitedOnWebUI: false },
  'programme':               { capabilities: [], limitedOnWebUI: false },
  'record-signal':           { capabilities: [], limitedOnWebUI: false },
  'reference-corpus-update': { capabilities: [], limitedOnWebUI: false },
  'release':                 { capabilities: ['git', 'bash-scripts', 'ci-cd'], limitedOnWebUI: true },
  'reverse-engineer':        { capabilities: [], limitedOnWebUI: false },
  'review':                  { capabilities: [], limitedOnWebUI: false },
  'scale-pipeline':          { capabilities: [], limitedOnWebUI: false },
  'spike':                   { capabilities: [], limitedOnWebUI: false },
  'start':                   { capabilities: [], limitedOnWebUI: false },
  'subagent-execution':      { capabilities: ['git', 'bash-scripts'], limitedOnWebUI: true },
  'systematic-debugging':    { capabilities: [], limitedOnWebUI: false },
  'tdd':                     { capabilities: ['bash-scripts', 'test-runner'], limitedOnWebUI: true },
  'test-plan':               { capabilities: [], limitedOnWebUI: false },
  'token-optimization':      { capabilities: [], limitedOnWebUI: false },
  'trace':                   { capabilities: ['bash-scripts'], limitedOnWebUI: true },
  'verify-completion':       { capabilities: ['bash-scripts', 'test-runner'], limitedOnWebUI: true },
  'workflow':                { capabilities: [], limitedOnWebUI: false }
};

/**
 * Returns an array of skill directory names under .github/skills/.
 * Reads the directory fresh each call (dynamic discovery — AC2).
 * @param {string} repoRoot
 * @returns {string[]}
 */
function getAvailableSkills(repoRoot) {
  var root = repoRoot || _repoRoot || path.resolve(__dirname, '../../..');
  var skillsDir = path.join(root, '.github', 'skills');
  try {
    return fs.readdirSync(skillsDir).filter(function(name) {
      try {
        return fs.statSync(path.join(skillsDir, name)).isDirectory();
      } catch (_) { return false; }
    });
  } catch (_) {
    return [];
  }
}

/**
 * Validates a skill name from user input before any file read.
 * Returns false if name contains path traversal characters.
 * Returns false if name is not in the discovered skill allowlist.
 * Returns true if valid.
 * @param {string} name
 * @param {string} repoRoot
 * @returns {boolean}
 */
function validateSlashSkillName(name, repoRoot) {
  if (!name || typeof name !== 'string') return false;
  // Reject path traversal patterns — MANDATORY security check (AC6)
  if (name.indexOf('/') !== -1 || name.indexOf('\\') !== -1 || name.indexOf('..') !== -1) {
    return false;
  }
  var available = getAvailableSkills(repoRoot);
  return available.indexOf(name) !== -1;
}

/**
 * Reads .github/skills/[skillName]/SKILL.md and assembles a prompt.
 * Prepends a capability notice if the skill is in SLASH_CAPABILITY_MAP with
 * non-empty capabilities.
 * @param {string} skillName
 * @param {string} repoRoot
 * @returns {string}
 */
function buildSlashCommandPrompt(skillName, repoRoot) {
  var root = repoRoot || _repoRoot || path.resolve(__dirname, '../../..');
  var skillMdPath = path.join(root, '.github', 'skills', skillName, 'SKILL.md');
  var skillContent = fs.readFileSync(skillMdPath, 'utf8');
  var parts = [];
  var entry = SLASH_CAPABILITY_MAP[skillName];
  if (entry && entry.capabilities && entry.capabilities.length > 0) {
    parts.push('NOTE: This skill requires ' + entry.capabilities.join(', ') + '. Some outputs may be limited or unavailable in the web UI.');
  }
  parts.push(skillContent);
  return parts.join('\n\n');
}

/**
 * buildSystemPrompt(opts) — returns the WEB UI PROTOCOL system prompt section.
 * AC6: instructs the model to emit tool markers for file reads and dir listings.
 * @param {object} opts - { skillName, repoRoot }
 * @returns {string}
 */
function buildSystemPrompt(opts) {
  var skillName = (opts && opts.skillName) || '';
  return [
    'You are running inside a web UI for a software delivery pipeline. The repository is checked out on the server.',
    '',
    'When you need to read a file to answer this request, emit exactly this marker on its own line BEFORE writing your response:',
    '',
    '<TOOL:read_file path="relative/path/to/file"/>',
    '',
    'When you need to list a directory, emit exactly this marker on its own line:',
    '',
    '<TOOL:list_dir path="relative/path/to/dir"/>',
    '',
    'Rules:',
    '- Always use paths relative to the repo root (e.g. workspace/state.json, not /absolute/path)',
    '- Emit the marker first — do not describe what you are about to read, just emit the marker',
    '- After the marker, continue your response as if you have access to the file contents',
    '- Use only these two tool verbs: read_file, list_dir — no others',
    '- Markers are self-closing: end with />  not with a separate </TOOL:read_file>'
  ].join('\n');
}

/**
 * Sets session.activeSlashCommand without mutating stage position (AC4).
 * @param {object} session
 * @param {string} skillName
 */
function applySlashCommand(session, skillName) {
  session.activeSlashCommand = skillName;
}

/**
 * Removes session.activeSlashCommand; journey stage resumes unchanged (AC4).
 * @param {object} session
 */
function clearSlashCommand(session) {
  delete session.activeSlashCommand;
}

/**
 * Route handler for POST /slash-command.
 * Validates skill name, loads prompt, applies to session. HTTP 400 on failure.
 * @param {object} req
 * @param {object} res
 */
function handleSlashCommand(req, res) {
  var root = _repoRoot || path.resolve(__dirname, '../../..');
  var body = req.body || {};
  var skillName = String(body.skillName || '');

  if (!validateSlashSkillName(skillName, root)) {
    var available = getAvailableSkills(root);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Unknown or invalid skill: "' + skillName + '"',
      availableSkills: available
    }));
    return;
  }

  var prompt = buildSlashCommandPrompt(skillName, root);
  applySlashCommand(req.session, skillName);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, prompt: prompt, activeSlashCommand: skillName }));
}

// ---------------------------------------------------------------------------
// wucp.4 — Session start wizard
// ---------------------------------------------------------------------------

var STAGE_INDEX = {
  discovery: 0,
  'benefit-metric': 1,
  definition: 2,
  review: 3,
  'test-plan': 4,
  'definition-of-ready': 5,
  'branch-setup': 6,
  'implementation-plan': 7,
  'subagent-execution': 8,
  'verify-completion': 9,
  'branch-complete': 10,
  'definition-of-done': 11
};

function _readPipelineFeatures(root) {
  var stateFile = require('path').join(root || _repoRoot || '', '.github', 'pipeline-state.json');
  if (!require('fs').existsSync(stateFile)) { return null; }
  try {
    var state = JSON.parse(require('fs').readFileSync(stateFile, 'utf8'));
    return Array.isArray(state.features) ? state.features : [];
  } catch (e) {
    return null;
  }
}

function handleGetWizard(req, res) {
  if (req.session && req.session.activeFeatureSlug) {
    res.writeHead(302, { Location: '/journey' });
    res.end();
    return;
  }
  var view = (req.query && req.query.view) || '';

  // Step 2: feature card picker
  if (view === 'existing') {
    var features2 = _readPipelineFeatures(_repoRoot);
    var active2 = [];
    if (features2 !== null) {
      active2 = features2.filter(function(f) { return f.stage !== 'released' && f.stage !== 'archived'; });
    }
    var listHtml2;
    if (features2 === null || active2.length === 0) {
      listHtml2 = '<p>No active projects found. <a href="/journey/wizard">Back to options</a></p>';
    } else {
      var dotColour = function(h) {
        if (h === 'green') return '#2da44e';
        if (h === 'red') return '#cf222e';
        if (h === 'amber') return '#fb8f44';
        return '#888';
      };
      listHtml2 = '<div class="wiz-feature-cards">' +
        active2.map(function(f) {
          return '<div class="wiz-feature-card">' +
            '<span class="health-dot" style="background:' + escHtml(dotColour(f.health || '')) + '"></span> ' +
            '<strong>' + escHtml(f.name || f.slug) + '</strong> ' +
            '<code>' + escHtml(f.slug) + '</code> &mdash; ' + escHtml(f.stage || '') +
            '</div>';
        }).join('\n') + '</div>';
    }
    var body2 = '<h1>Continue an existing feature</h1>\n' +
      '<a href="/journey/wizard">← Back to options</a>\n' +
      '<form method="POST" action="/journey/wizard">\n' +
      listHtml2 + '\n';
    if (features2 !== null && active2.length > 0) {
      body2 += '<select name="featureSlug">' +
        active2.map(function(f) {
          return '<option value="' + escHtml(f.slug) + '">' + escHtml(f.name || f.slug) + '</option>';
        }).join('') +
        '</select>\n' +
        '<button type="submit">Continue with this feature</button>\n';
    }
    body2 += '</form>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderShell({ title: 'Continue a feature', bodyContent: body2 }));
    return;
  }

  // Step 3: active session resume list
  if (view === 'resume') {
    var listFn = _listHtmlSessionsFn || require('./skills')._listHtmlSessions;
    var allSessions = listFn ? listFn() : [];
    var now = Date.now();
    var twentyFourH = 24 * 60 * 60 * 1000;
    var activeSessions = allSessions.filter(function(s) {
      if (!s || !s.session) return false;
      if (s.session.done === true) return false;
      var la = s.session.lastActivity;
      if (la === undefined || la === null) return true;
      return (now - la) <= twentyFourH;
    });
    var sessionListHtml;
    if (activeSessions.length === 0) {
      sessionListHtml = '<p>No active sessions within the last 24 hours.</p>';
    } else {
      sessionListHtml = '<ul>' +
        activeSessions.map(function(s) {
          return '<li><code>' + escHtml(s.sessionId) + '</code> &mdash; ' + escHtml(s.session.skillName || '') + '</li>';
        }).join('\n') +
        '</ul>';
    }
    var body3 = '<h1>Resume a session</h1>\n' +
      '<a href="/journey/wizard">← Back to options</a>\n' +
      sessionListHtml;
    if (activeSessions.length > 0) {
      body3 += '\n<form method="POST" action="/journey/wizard">\n' +
        '<input type="hidden" name="selection" value="resume-session">\n' +
        '<select name="sessionId">' +
        activeSessions.map(function(s) {
          return '<option value="' + escHtml(s.sessionId) + '">' +
            escHtml(s.session.skillName || '') + ' — ' + escHtml(s.sessionId) + '</option>';
        }).join('') +
        '</select>\n' +
        '<select name="skillName">' +
        activeSessions.map(function(s) {
          return '<option value="' + escHtml(s.session.skillName || '') + '">' + escHtml(s.session.skillName || '') + '</option>';
        }).join('') +
        '</select>\n' +
        '<button type="submit">Resume this session</button>\n' +
        '</form>';
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderShell({ title: 'Resume a session', bodyContent: body3 }));
    return;
  }

  // Step 1: default — three option cards
  var body = '<h1>What would you like to do?</h1>\n' +
    '<div class="wiz-options">\n' +
    '<div class="wiz-option">\n' +
    '<h2>Start something new</h2>\n' +
    '<form method="POST" action="/journey/wizard">\n' +
    '<button type="submit" name="selection" value="new">Start a new feature</button>\n' +
    '</form>\n' +
    '</div>\n' +
    '<div class="wiz-option">\n' +
    '<h2>Continue an existing feature</h2>\n' +
    '<a href="/journey/wizard?view=existing" class="wiz-btn">Continue an existing feature →</a>\n' +
    '</div>\n' +
    '<div class="wiz-option">\n' +
    '<h2>Resume active session</h2>\n' +
    '<a href="/journey/wizard?view=resume" class="wiz-btn">Resume active session →</a>\n' +
    '</div>\n' +
    '</div>';
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(renderShell({ title: 'Project selection', bodyContent: body }));
}

function handlePostWizardSelection(req, res) {
  var reqBody = (req && req.body) || {};
  var featureSlug = reqBody.featureSlug;
  var selection = reqBody.selection;
  var ideaId = reqBody.ideaId;
  var sessionId = reqBody.sessionId;
  var skillName = reqBody.skillName;

  // 'from-idea': redirect to discovery with idea as query param (AC3)
  // ideaId is URL query param only — never used as file path
  if (selection === 'from-idea') {
    var safeIdeaId = encodeURIComponent(String(ideaId || ''));
    res.writeHead(302, { Location: '/skills/discovery/sessions?idea=' + safeIdeaId });
    res.end();
    return;
  }

  // 'resume-session': validate slug-safe chars then redirect to chat (AC7)
  if (selection === 'resume-session') {
    var slugSafe = /^[a-z0-9-]+$/;
    var safeSkill = slugSafe.test(String(skillName || '')) ? String(skillName) : null;
    var safeSession = slugSafe.test(String(sessionId || '')) ? String(sessionId) : null;
    if (!safeSkill || !safeSession) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid session parameters' }));
      return;
    }
    res.writeHead(302, { Location: '/skills/' + safeSkill + '/sessions/' + safeSession + '/chat' });
    res.end();
    return;
  }

  // 'new' selection or no slug — reset to start, do NOT set activeFeatureSlug
  if (!featureSlug || (selection && (selection === 'new' || selection.startsWith('new')))) {
    req.session.stageIndex = 0;
    res.writeHead(302, { Location: '/journey' });
    res.end();
    return;
  }

  // Validate slug against pipeline-state.json allowlist (security — AC6)
  var features = _readPipelineFeatures(_repoRoot);
  var allowedSlugs = features ? features.map(function(f) { return f.slug; }) : [];
  if (allowedSlugs.indexOf(featureSlug) === -1) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid feature slug' }));
    return;
  }

  // Valid slug — set session
  var feature = features.find(function(f) { return f.slug === featureSlug; });
  req.session.activeFeatureSlug = featureSlug;
  req.session.stageIndex = (feature && STAGE_INDEX[feature.stage] !== undefined) ? STAGE_INDEX[feature.stage] : 0;
  res.writeHead(302, { Location: '/journey' });
  res.end();
}

module.exports = {
  handleGetJourney,
  handlePostJourney,
  handlePostGateConfirm,
  handleGetStories,
  handlePostStories,
  handleGetJourneyComplete,
  handleGetStageControls,
  handlePostEstimate,
  handlePostSpike,
  handlePatchSpike,
  handleGetTrace,
  handlePostDecisions,
  handlePostSideTripClarify,
  handleDeleteSideTrip,
  // wsm.2 — collaborative journey sharing
  handleGetJourneyById,
  handleGetJourneyState,
  handleGetJourneyViewers,
  checkJourneyIdle,
  setNow,
  // wsm.3 — stage back-navigation and needs-review
  handleGetJourneyStage,
  handlePostJourneyRecommit,
  handleGetJourneyStageControls,
  handlePostJourneyStageCommit,
  loadJourneyMeta,
  setDiskSessionWriter,
  // adapter setters
  setRegisterHtmlSession,
  setLinkSessionToJourney,
  setJourneyStoreModule,
  setGetHtmlSession,
  setListHtmlSessions,
  setRepoRoot,
  setPipelineStateWriter,
  setValidate,
  setWriteTrace,
  // wucp.2 — slash command router
  SLASH_CAPABILITY_MAP,
  getAvailableSkills,
  validateSlashSkillName,
  buildSlashCommandPrompt,
  applySlashCommand,
  clearSlashCommand,
  handleSlashCommand,
  // wucp.3 — tool execution loop
  buildSystemPrompt,
  // wucp.4 — session wizard
  STAGE_INDEX,
  handleGetWizard,
  handlePostWizardSelection
};


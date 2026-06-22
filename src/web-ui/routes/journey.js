'use strict';
var path = require('path');
var crypto = require('crypto');
var os = require('os');
var fs = require('fs');
var { renderShell, escHtml } = require('../utils/html-shell');
var { requireJourneyAccess, asHttpResponse, POLICY } = require('../middleware/journey-access');

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
  { id: 'review',              num: 5,    label: 'Review',     optional: false },
  { id: 'test-plan',           num: 6,    label: 'Test Plan',  optional: false },
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
  var _gjId = req.params && req.params.journeyId;
  if (_gjId) {
    var _gjJourney = _journeyStore.getJourney(_gjId);
    try { requireJourneyAccess(_gjJourney, req.session, POLICY.TENANT); }
    catch (err) {
      res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderShell({ title: 'Not found', bodyContent: '<p>Not found.</p>', user: { login: req.session.login || '' } }));
      return;
    }
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

    getRegisterHtmlSession()(sid, sessionPath, startSkill, { productProfile: profileName, featureSlug: featureSlug });
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

// ---------------------------------------------------------------------------
// Step 5 — Artefact review panel
// ---------------------------------------------------------------------------

/**
 * Minimal markdown → safe HTML renderer for artefact review.
 * Processes line-by-line; escapes content before applying markdown patterns.
 * @param {string} text
 * @returns {string}
 */
function _renderMarkdown(text) {
  if (!text) return '';
  var lines = text.split('\n');
  var out = [];
  var inCode = false;
  var inList = false;
  var listTag = 'ul';

  function closeList() {
    if (inList) { out.push('</' + listTag + '>'); inList = false; }
  }

  for (var i = 0; i < lines.length; i++) {
    var raw = lines[i];

    if (/^```/.test(raw)) {
      if (inCode) {
        out.push('</code></pre>');
        inCode = false;
      } else {
        closeList();
        out.push('<pre class="sr-pre"><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) { out.push(escHtml(raw)); continue; }

    var l = escHtml(raw);
    l = l.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    l = l.replace(/\*([^*\s][^*]*[^*\s]|[^*\s])\*/g, '<em>$1</em>');
    l = l.replace(/`([^`]+)`/g, '<code class="sr-code">$1</code>');

    if (/^### /.test(l)) { closeList(); out.push('<h3 class="sr-h3">' + l.slice(4) + '</h3>'); continue; }
    if (/^## /.test(l))  { closeList(); out.push('<h2 class="sr-h2">' + l.slice(3) + '</h2>'); continue; }
    if (/^# /.test(l))   { closeList(); out.push('<h1 class="sr-h1">' + l.slice(2) + '</h1>'); continue; }

    if (/^---+$/.test(raw) || /^\*\*\*+$/.test(raw)) { closeList(); out.push('<hr class="sr-hr">'); continue; }

    if (/^- /.test(l)) {
      if (!inList || listTag !== 'ul') { closeList(); out.push('<ul class="sr-list">'); inList = true; listTag = 'ul'; }
      out.push('<li>' + l.slice(2) + '</li>');
      continue;
    }
    if (/^\d+\. /.test(l)) {
      if (!inList || listTag !== 'ol') { closeList(); out.push('<ol class="sr-list">'); inList = true; listTag = 'ol'; }
      out.push('<li>' + l.replace(/^\d+\. /, '') + '</li>');
      continue;
    }

    if (l.trim() === '') { closeList(); out.push(''); continue; }

    closeList();
    out.push('<p class="sr-p">' + l + '</p>');
  }
  closeList();
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
}

/**
 * GET /journey/:journeyId/stage-review
 * Shows the completed artefact from the active session for review before gate-confirm.
 */
async function handleGetStageReview(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<div class="sw-page-content"><p>Journey not found.</p><a href="/journey">Back to journeys</a></div>', user: { login: req.session.login || '' } }));
    return;
  }

  var session = getGetHtmlSession()(journey.activeSessionId);
  if (!session || !session.done || !session.artefactContent) {
    var skillForRedirect = (session && session.skillName) || journey.activeSkill || 'discovery';
    var sidForRedirect   = journey.activeSessionId || '';
    res.writeHead(302, { Location: '/skills/' + encodeURIComponent(skillForRedirect) + '/sessions/' + encodeURIComponent(sidForRedirect) + '/chat' });
    res.end();
    return;
  }

  var skillName  = session.skillName || journey.activeSkill || '';
  var stageMeta  = STAGE_META.find(function(s) { return s.id === skillName; });
  var stageLabel = stageMeta ? (stageMeta.num + '. ' + stageMeta.label) : skillName;
  var nextStage  = _journeyStore.getNextStage(skillName);
  var nextMeta   = nextStage ? STAGE_META.find(function(s) { return s.id === nextStage; }) : null;
  var nextLabel  = nextMeta ? (nextMeta.num + '. ' + nextMeta.label) : (nextStage || 'complete');

  // Stage navigator strip
  var _doneSet = new Set((journey.completedStages || []).map(function(s) { return s.skillName; }));
  var _stepsHtml = STAGE_META.map(function(s) {
    var isDone = _doneSet.has(s.id);
    var isActive = s.id === skillName;
    var cls = isDone ? 'sn-step--done' : isActive ? 'sn-step--active' : 'sn-step--pending';
    var icon = isDone ? '●' : isActive ? '▶' : '○';
    return '<li class="sn-step ' + cls + '">' +
      '<span class="sn-num">' + escHtml(String(s.num)) + '</span>' +
      '<span class="sn-label">' + escHtml(s.label) + '</span>' +
      '<span class="sn-icon" aria-hidden="true">' + icon + '</span>' +
      '</li>';
  }).join('');
  var navigatorHtml = [
    '<style>',
    '.sn-bar{display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--line);background:var(--surface);overflow-x:auto;gap:0}',
    '.sn-feature{font-size:11px;font-weight:600;color:var(--muted);padding:0 12px 0 4px;border-right:1px solid var(--line);white-space:nowrap;margin-right:4px}',
    '.sn-steps{display:flex;list-style:none;margin:0;padding:0;gap:0}',
    '.sn-step{display:flex;align-items:center;gap:5px;padding:7px 11px;font-size:12px;white-space:nowrap;border-right:1px solid var(--line);color:var(--muted)}',
    '.sn-step:last-child{border-right:none}',
    '.sn-num{font-weight:700;font-size:10px;opacity:0.6}',
    '.sn-icon{font-size:9px}',
    '.sn-step--done{color:var(--ink);opacity:0.75}',
    '.sn-step--done .sn-icon{color:#2da44e}',
    '.sn-step--active{background:var(--accent-soft,#eaf1fb);color:var(--ink);font-weight:600}',
    '.sn-step--active .sn-icon{color:var(--accent,#0969da)}',
    '.sn-step--pending{opacity:0.4}',
    '</style>',
    '<nav class="sn-bar" aria-label="Journey stages">',
      '<span class="sn-feature">' + escHtml(journey.featureSlug || '') + '</span>',
      '<ul class="sn-steps">' + _stepsHtml + '</ul>',
    '</nav>'
  ].join('');

  var artefactHtml  = _renderMarkdown(session.artefactContent);
  var featureName   = escHtml((journey.featureSlug || '').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' '));
  var safeJourneyId = escHtml(journeyId);
  var chatUrl = '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(journey.activeSessionId || '') + '/chat';

  var body = [
    '<style>',
    '.sr-page{max-width:740px;margin:0 auto;padding:24px 24px 120px}',
    '.sr-eyebrow{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 6px}',
    '.sr-title{font-size:20px;font-weight:700;margin:0 0 4px}',
    '.sr-sub{font-size:13px;color:var(--muted);margin:0 0 24px}',
    '.sr-paper{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:32px 36px;margin-bottom:24px;line-height:1.7;overflow-wrap:break-word}',
    '.sr-h1{font-size:20px;font-weight:700;margin:1.4em 0 0.5em;border-bottom:1px solid var(--line);padding-bottom:6px}',
    '.sr-h1:first-child,.sr-paper>:first-child{margin-top:0}',
    '.sr-h2{font-size:16px;font-weight:600;margin:1.2em 0 0.4em}',
    '.sr-h3{font-size:14px;font-weight:600;margin:1em 0 0.3em;color:var(--ink)}',
    '.sr-p{margin:0.6em 0;font-size:14px;color:var(--ink)}',
    '.sr-list{margin:0.4em 0 0.4em 1.4em;padding:0;font-size:14px}',
    '.sr-list li{margin-bottom:0.3em}',
    '.sr-hr{border:none;border-top:1px solid var(--line);margin:1.2em 0}',
    '.sr-pre{background:var(--line-2,#f6f8fa);border:1px solid var(--line);border-radius:6px;padding:14px 16px;overflow-x:auto;margin:0.8em 0;font-size:12px;line-height:1.5;font-family:var(--mono)}',
    '.sr-code{background:var(--line-2,#f6f8fa);border:1px solid var(--line);border-radius:3px;padding:1px 5px;font-size:12px;font-family:var(--mono)}',
    '.sr-confirm-bar{position:fixed;bottom:0;left:0;right:0;background:var(--bg);border-top:1px solid var(--line);padding:14px 24px;display:flex;align-items:center;gap:14px;z-index:100;box-shadow:0 -2px 8px rgba(0,0,0,.06)}',
    '.sr-confirm-hint{font-size:13px;color:var(--muted);flex:1;min-width:0}',
    '</style>',
    navigatorHtml,
    '<div class="sr-page">',
      '<p class="sr-eyebrow">' + escHtml(stageLabel) + ' — artefact review</p>',
      '<h1 class="sr-title">' + featureName + '</h1>',
      '<p class="sr-sub">Review the artefact below, then confirm to advance to <strong>' + escHtml(nextLabel) + '</strong>. Or go back to continue the conversation.</p>',
      '<article class="sr-paper">',
        artefactHtml,
      '</article>',
    '</div>',
    '<div class="sr-confirm-bar">',
      '<a href="' + escHtml(chatUrl) + '" class="sw-btn" style="border:1px solid var(--line);flex-shrink:0">← Back to session</a>',
      '<span class="sr-confirm-hint">Confirming saves this artefact and opens the next stage.</span>',
      '<form method="POST" action="/api/journey/' + safeJourneyId + '/gate-confirm" style="margin:0;flex-shrink:0">',
        '<button type="submit" class="sw-btn sw-btn--primary">Confirm &amp; continue to ' + escHtml(nextLabel) + ' &#x2192;</button>',
      '</form>',
    '</div>'
  ].join('');

  var html = renderShell({ title: 'Review: ' + stageLabel, bodyContent: body, user: { login: req.session.login || '' }, active: 'journey' });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * GET /journey/:journeyId/stage/:stageName — read-only view of a completed stage artefact.
 * Supports ?edit=true to switch to inline edit mode.
 * POST /api/journey/:journeyId/stage/:stageName/artefact — save edited artefact content to disk.
 */
async function handleGetJourneyStageView(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var stageName = req.params && req.params.stageName;
  var journey = _journeyStore.getJourney(journeyId);
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<div class="sw-page-content"><p>Not found.</p><a href="/journey">Back</a></div>', user: { login: req.session.login || '' } }));
    return;
  }

  // Find the completed stage entry in store
  var storeStage = (journey.completedStages || []).find(function(s) { return s.skillName === stageName; });
  var repoRoot = getRepoRoot();

  // Extract cost/model — prefer in-memory, fall back to disk (populated after server restart)
  var _stageCostUsd = (storeStage && storeStage.costUsd != null) ? storeStage.costUsd : null;
  var _stageModel   = (storeStage && storeStage.model) ? storeStage.model : null;
  if (_stageCostUsd == null) {
    var _djCost = null;
    try { _djCost = _journeyDisk.loadJourney(journey.featureSlug, repoRoot); } catch (_) {}
    if (_djCost && _djCost.stages && _djCost.stages[stageName]) {
      _stageCostUsd = _djCost.stages[stageName].costUsd != null ? _djCost.stages[stageName].costUsd : null;
      _stageModel   = _djCost.stages[stageName].model || null;
    }
  }
  var _stageModelShort = _stageModel ? _stageModel.replace(/^claude-/, '').replace(/-\d{4}-\d{2}-\d{2}$/, '') : null;

  // Resolve artefact path: prefer store, fall back to disk journey
  var artefactRelPath = (storeStage && storeStage.artefactPath) || null;
  if (!artefactRelPath) {
    var dj = null;
    try { dj = _journeyDisk.loadJourney(journey.featureSlug, repoRoot); } catch (_) {}
    if (dj && dj.stages && dj.stages[stageName]) {
      artefactRelPath = dj.stages[stageName].artefactPath || null;
    }
  }

  if (!artefactRelPath) {
    // Stage exists but has no artefact yet — redirect to current chat
    var activeSkill = journey.activeSkill || 'discovery';
    var activeSid = journey.activeSessionId || '';
    res.writeHead(302, { Location: '/skills/' + encodeURIComponent(activeSkill) + '/sessions/' + encodeURIComponent(activeSid) + '/chat' });
    res.end();
    return;
  }

  var artefactContent = '';
  var artefactAbsPath = path.resolve(path.join(repoRoot, artefactRelPath));
  try { artefactContent = fs.readFileSync(artefactAbsPath, 'utf8'); } catch (_) {}

  // Parse ?edit from URL
  var url = req.url || '';
  var isEdit = url.indexOf('edit=true') !== -1 || (req.query && req.query.edit === 'true');

  var stageMeta = STAGE_META.find(function(s) { return s.id === stageName; });
  var stageLabel = stageMeta ? (stageMeta.num + '. ' + stageMeta.label) : stageName;
  var safeJourneyId = escHtml(journeyId);
  var featureName = escHtml((journey.featureSlug || '').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' '));

  // Navigator bar — done stages are clickable, active stage links back to chat
  var _doneSet = new Set((journey.completedStages || []).map(function(s) { return s.skillName; }));
  var _activeSkill = journey.activeSkill;
  var _activeSid = journey.activeSessionId || '';
  var _stepsHtml = STAGE_META.map(function(s) {
    var isDone = _doneSet.has(s.id);
    var isActive = s.id === _activeSkill;
    var isViewing = s.id === stageName;
    var cls = isViewing ? 'sn-step--viewing' : isDone ? 'sn-step--done' : isActive ? 'sn-step--active' : 'sn-step--pending';
    var icon = isDone || isViewing ? '●' : isActive ? '▶' : '○';
    var inner = '<span class="sn-num">' + escHtml(String(s.num)) + '</span>' +
      '<span class="sn-label">' + escHtml(s.label) + '</span>' +
      '<span class="sn-icon" aria-hidden="true">' + icon + '</span>';
    if (isDone && !isViewing) {
      return '<li class="sn-step ' + cls + '"><a href="/journey/' + safeJourneyId + '/stage/' + encodeURIComponent(s.id) + '" class="sn-step-link">' + inner + '</a></li>';
    }
    if (isActive) {
      return '<li class="sn-step ' + cls + '"><a href="/skills/' + encodeURIComponent(_activeSkill) + '/sessions/' + encodeURIComponent(_activeSid) + '/chat" class="sn-step-link">' + inner + '</a></li>';
    }
    return '<li class="sn-step ' + cls + '">' + inner + '</li>';
  }).join('');

  var navigatorHtml = [
    '<style>',
    '.sn-bar{display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--line);background:var(--surface);overflow-x:auto;gap:0;flex-shrink:0}',
    '.sn-feature{font-size:11px;font-weight:600;color:var(--muted);padding:0 12px 0 4px;border-right:1px solid var(--line);white-space:nowrap;margin-right:4px}',
    '.sn-steps{display:flex;list-style:none;margin:0;padding:0;gap:0}',
    '.sn-step{display:flex;align-items:center;gap:5px;padding:0;font-size:12px;white-space:nowrap;border-right:1px solid var(--line);color:var(--muted)}',
    '.sn-step:last-child{border-right:none}',
    '.sn-step-link{display:flex;align-items:center;gap:5px;padding:7px 11px;color:inherit;text-decoration:none;width:100%}',
    '.sn-step-link:hover{background:var(--line-2,#f6f8fa)}',
    '.sn-step>span{padding:7px 11px}',
    '.sn-num{font-weight:700;font-size:10px;opacity:0.6}',
    '.sn-icon{font-size:9px}',
    '.sn-step--done{color:var(--ink);opacity:0.75}',
    '.sn-step--done .sn-icon{color:#2da44e}',
    '.sn-step--viewing{color:var(--ink);font-weight:600;background:var(--line-2,#f6f8fa)}',
    '.sn-step--viewing .sn-icon{color:#2da44e}',
    '.sn-step--active{background:var(--accent-soft,#eaf1fb);color:var(--ink);font-weight:600}',
    '.sn-step--active .sn-step-link{font-weight:600}',
    '.sn-step--active .sn-icon{color:var(--accent,#0969da)}',
    '.sn-step--pending{opacity:0.4}',
    '</style>',
    '<nav class="sn-bar" aria-label="Journey stages">',
      '<a href="/journey" class="sn-feature" style="text-decoration:none;color:var(--muted)">' + escHtml(journey.featureSlug || '') + '</a>',
      '<ul class="sn-steps">' + _stepsHtml + '</ul>',
    '</nav>'
  ].join('');

  var artefactHtml  = _renderMarkdown(artefactContent);
  var saveUrl = '/api/journey/' + safeJourneyId + '/stage/' + encodeURIComponent(stageName) + '/artefact';
  var currentChatUrl = _activeSid
    ? '/skills/' + encodeURIComponent(_activeSkill || 'discovery') + '/sessions/' + encodeURIComponent(_activeSid) + '/chat'
    : '/journey';

  var mainPanel;
  if (isEdit) {
    mainPanel = [
      '<form method="POST" action="' + escHtml(saveUrl) + '" style="margin:0">',
        '<textarea name="content" class="sv-textarea" style="width:100%;box-sizing:border-box;min-height:420px;padding:24px;border:none;outline:none;font-family:var(--mono);font-size:13px;line-height:1.65;resize:vertical;background:var(--surface);color:var(--ink)">' + escHtml(artefactContent) + '</textarea>',
        '<div class="sv-edit-bar" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--line);background:var(--surface)">',
          '<button type="submit" class="sw-btn sw-btn--primary" style="font-size:13px">Save changes</button>',
          '<a href="/journey/' + safeJourneyId + '/stage/' + encodeURIComponent(stageName) + '" class="sw-btn" style="font-size:13px;border:1px solid var(--line)">Cancel</a>',
          '<span style="font-size:12px;color:var(--muted);margin-left:auto">' + escHtml(artefactRelPath) + '</span>',
        '</div>',
      '</form>'
    ].join('');
  } else if (stageName === 'definition') {
    var _svArtJson = JSON.stringify(artefactContent).replace(/<\/script/gi, '<\\/script');
    mainPanel = [
      '<style>',
      '.dm-canvas{padding:12px 16px}',
      '.dm-hdr{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}',
      '.dm-count{font-size:11px;color:var(--muted);font-weight:500}',
      '.dm-badge{background:var(--accent-soft,#eaf1fb);color:var(--accent-ink,#1d4ed8);font-size:10px;font-weight:600;padding:2px 9px;border-radius:10px;text-transform:uppercase;letter-spacing:0.4px}',
      '.dm-epic{margin-bottom:20px}',
      '.dm-epic-hd{display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:2px solid var(--accent,#2563eb);margin-bottom:10px;width:100%;background:none;border-left:none;border-right:none;border-top:none;font-family:inherit;cursor:pointer;text-align:left}',
      '.dm-epic-hd:hover .dm-epic-name{text-decoration:underline}',
      '.dm-epic-tag{font-size:10px;font-weight:700;background:var(--accent,#2563eb);color:#fff;border-radius:4px;padding:1px 7px;flex-shrink:0}',
      '.dm-epic-name{font-size:12px;font-weight:600;color:var(--ink);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dm-epic-count{font-size:10px;color:var(--muted);flex-shrink:0;background:var(--line-2);padding:1px 6px;border-radius:10px;white-space:nowrap}',
      '.dm-cards{display:flex;flex-wrap:wrap;gap:6px}',
      '.dm-card{cursor:pointer;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--surface);text-align:left;min-width:96px;max-width:144px;display:flex;flex-direction:column;gap:3px;font-family:inherit;line-height:1;transition:border-color 0.15s,box-shadow 0.15s}',
      '.dm-card:hover{border-color:var(--accent,#2563eb);box-shadow:0 2px 7px rgba(0,0,0,.09)}',
      '.dm-card-id{font-size:9px;font-weight:700;font-family:var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:0.3px}',
      '.dm-card-title{font-size:11px;font-weight:500;color:var(--ink);line-height:1.35;margin:2px 0}',
      '.dm-cx{font-size:9px;font-weight:600;margin-top:2px}',
      '.dm-cx--l{color:#2da44e}.dm-cx--m{color:#ca8a04}.dm-cx--h{color:#dc2626}',
      '.dm-empty{padding:24px 16px;font-size:13px;color:var(--muted);font-style:italic}',
      '.dm-modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;align-items:center;justify-content:center}',
      '.dm-mo{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4)}',
      '.dm-mb{position:relative;background:var(--bg);border-radius:12px;width:700px;max-width:95vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.28)}',
      '.dm-mh{display:flex;align-items:flex-start;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line);flex-shrink:0;gap:12px}',
      '.dm-mt{font-size:14px;font-weight:600;color:var(--ink);line-height:1.4}',
      '.dm-mx{border:none;background:none;cursor:pointer;font-size:16px;color:var(--muted);padding:2px 6px;border-radius:4px;line-height:1;flex-shrink:0;font-family:inherit}',
      '.dm-mx:hover{color:var(--ink);background:var(--line)}',
      '.dm-mbd{overflow-y:auto;padding:20px 24px}',
      '.ad-h1{font-size:18px;font-weight:700;margin:1.2em 0 0.4em;border-bottom:1px solid var(--line);padding-bottom:4px}',
      '.ad-h2{font-size:15px;font-weight:600;margin:1em 0 0.35em}',
      '.ad-h3{font-size:13px;font-weight:600;margin:0.8em 0 0.3em}',
      '.ad-p{margin:0.5em 0;font-size:13px;color:var(--ink);line-height:1.6}',
      '.ad-ul{margin:0.4em 0 0.4em 1.2em;padding:0;font-size:13px}',
      '.ad-ul li{margin-bottom:0.25em}',
      '.ad-pre{background:var(--line-2,#f6f8fa);border:1px solid var(--line);border-radius:6px;padding:12px;overflow-x:auto;font-size:12px;line-height:1.5;font-family:var(--mono);margin:0.6em 0}',
      '.ad-code{background:var(--line-2,#f6f8fa);border:1px solid var(--line);border-radius:3px;padding:1px 4px;font-size:12px;font-family:var(--mono)}',
      '.ad-hr{border:none;border-top:1px solid var(--line);margin:1em 0}',
      '.ad-table{border-collapse:collapse;width:100%;font-size:13px;margin:0.6em 0}',
      '.ad-table th,.ad-table td{border:1px solid var(--line);padding:6px 10px;text-align:left}',
      '.ad-table th{background:var(--line-2,#f6f8fa);font-weight:600}',
      '</style>',
      '<div style="background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:24px">',
        '<div id="sv-dm-canvas" style="padding:4px 0"></div>',
      '</div>',
      '<script>',
      '(function(){',
      'var __art=' + _svArtJson + ';',
      'function escHtmlClient(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}',
      'function inlineMd(s){s=s.replace(/\\*\\*(.+?)\\*\\*/g,"<strong>$1</strong>");s=s.replace(/`([^`]+)`/g,\'<code class="ad-code">$1</code>\');return s;}',
      'function flushAdTable(rows){if(!rows.length)return"";var h=\'<table class="ad-table">\';for(var ri=0;ri<rows.length;ri++){var r=rows[ri];if(/^\\|[-: |]+\\|$/.test(r.trim()))continue;var cells=r.split("|").slice(1,-1);var tag=ri===0?"th":"td";h+="<tr>"+cells.map(function(c){return"<"+tag+">"+inlineMd(c.trim())+"</"+tag+">";}).join("")+"</tr>";}return h+"</table>";}',
      'function renderArtefactMd(raw){',
      '  var lines=escHtmlClient(raw).split("\\n");',
      '  var out=[];var inCode=false;var codeBuf=[];var inTable=false;var tableBuf=[];var inList=false;',
      '  for(var i=0;i<lines.length;i++){',
      '    var line=lines[i];',
      '    if(line.startsWith("```")){',
      '      if(inCode){out.push(\'<pre class="ad-pre"><code>\'+codeBuf.join("\\n")+"</code></pre>");codeBuf=[];inCode=false;}',
      '      else{if(inList){out.push("</ul>");inList=false;}if(inTable){out.push(flushAdTable(tableBuf));tableBuf=[];inTable=false;}inCode=true;}',
      '      continue;',
      '    }',
      '    if(inCode){codeBuf.push(line);continue;}',
      '    if(line.startsWith("|")){if(!inTable){inTable=true;tableBuf=[];}tableBuf.push(line);continue;}',
      '    else if(inTable){out.push(flushAdTable(tableBuf));tableBuf=[];inTable=false;}',
      '    if(inList&&!line.startsWith("- ")&&!line.startsWith("* ")){out.push("</ul>");inList=false;}',
      '    var trim=line.trim();',
      '    if(!trim){out.push(\'<div style="height:5px"></div>\');continue;}',
      '    if(trim==="---"){out.push(\'<hr class="ad-hr">\');continue;}',
      '    var hm=trim.match(/^(#{1,3}) (.+)/);',
      '    if(hm){var hlv=hm[1].length;out.push("<h"+hlv+\' class="ad-h\'+hlv+\'">\'+inlineMd(hm[2])+"</h"+hlv+">");continue;}',
      '    if(trim.startsWith("- ")||trim.startsWith("* ")){if(!inList){out.push(\'<ul class="ad-ul">\');inList=true;}out.push("<li>"+inlineMd(trim.slice(2))+"</li>");continue;}',
      '    out.push(\'<p class="ad-p">\'+inlineMd(line)+"</p>");',
      '  }',
      '  if(inList)out.push("</ul>");if(inTable)out.push(flushAdTable(tableBuf));if(inCode)out.push(\'<pre class="ad-pre"><code>\'+codeBuf.join("\\n")+"</code></pre>");',
      '  return out.join("");',
      '}',
      'function parseDefinitionArtefact(md){',
      '  var r={slicing:"",epics:[],epicCount:0,storyCount:0};',
      '  var sm=md.match(/^Slicing strategy:\\s*(.+)$/m);',
      '  if(!sm)sm=md.match(/\\*\\*Slicing strategy:\\*\\*\\s*(.+)$/m);',
      '  if(sm)r.slicing=sm[1].trim();',
      '  // Format C: H1 epic headers "# Epic N: Name" + H1 story headers "# Story id — Title"',
      '  var _hasH1Epics=/^# Epic \\d+/m.test(md);',
      '  var _hasH1Stories=/^# Story [a-z][a-z0-9.-]*\\.\\d+/im.test(md);',
      '  if(_hasH1Epics||_hasH1Stories){',
      '    var _epicMap={},_epicOrder2=[];',
      '    md.split(/^(?=# Epic \\d+)/m).slice(1).forEach(function(eb,idx){',
      '      var fl=eb.split("\\n")[0];',
      '      var nM=fl.match(/^# Epic \\d+[:\\-—\\s]+(.+)$/)||fl.match(/^# Epic \\d+(.*)$/);',
      '      var slug2=(nM&&nM[1]?nM[1].trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""):("epic-"+(idx+1)))||("epic-"+(idx+1));',
      '      var name2=nM&&nM[1]?nM[1].trim():("Epic "+(idx+1));',
      '      var storyIds=[];',
      '      var listM=eb.match(/## Stories in this epic([\\s\\S]*?)(?=\\n## |\\n# |$)/);',
      '      if(listM){listM[1].split("\\n").forEach(function(line){var idM2=line.match(/[\\-\\*]?\\s*([a-z][a-z0-9.-]*\\.\\d+)/i);if(idM2)storyIds.push(idM2[1].toLowerCase());});}',
      '      _epicMap[slug2]={num:String(idx+1),name:name2,storyIds:storyIds,stories:[],raw:eb};',
      '      _epicOrder2.push(slug2);',
      '    });',
      '    md.split(/^(?=# Story [a-z][a-z0-9.-]*\\.\\d+)/im).slice(1).forEach(function(sb){',
      '      var sfl=sb.split("\\n")[0];',
      '      var sM2=sfl.match(/^# Story ([a-z][a-z0-9.-]*\\.\\d+)\\s*[—\\-]\\s*(.+)$/i);',
      '      if(!sM2)return;',
      '      var stId=sM2[1].toLowerCase(),stTitle=sM2[2].trim();',
      '      var cxM2=sb.match(/Complexity:\\s*(\\d)/);',
      '      var entry={id:stId,title:stTitle,cx:cxM2?parseInt(cxM2[1],10):0,raw:sb};',
      '      var placed=false;',
      '      _epicOrder2.forEach(function(eSlug){if(_epicMap[eSlug].storyIds.indexOf(stId)!==-1){_epicMap[eSlug].stories.push(entry);placed=true;}});',
      '      if(!placed){var lastSlug=_epicOrder2[_epicOrder2.length-1]||"uncategorised";if(!_epicMap[lastSlug]){_epicMap[lastSlug]={num:"?",name:"Uncategorised",storyIds:[],stories:[]};_epicOrder2.push(lastSlug);}_epicMap[lastSlug].stories.push(entry);}',
      '    });',
      '    _epicOrder2.forEach(function(slug){var ep=_epicMap[slug];r.epics.push({num:ep.num,name:ep.name,stories:ep.stories,raw:ep.raw||""});r.storyCount+=ep.stories.length;});',
      '    r.epicCount=r.epics.length;return r;',
      '  }',
      '  var _hasFlatStories=/\\n## [a-z][a-z0-9.-]*\\.\\d+\\s*[—\\-]/i.test(md);',
      '  if(_hasFlatStories){',
      '    var _epicNames={},_epicOrder=[];',
      '    var _tblM=md.match(/## Epic structure([\\s\\S]*?)(?=\\n## [^E]|\\n## E(?!pic)|$)/);',
      '    if(_tblM){',
      '      _tblM[1].split("\\n").forEach(function(tl){',
      '        var cols=tl.split("|").map(function(c){return c.trim();}).filter(Boolean);',
      '        if(cols.length>=2&&/^Epic \\d+/.test(cols[0])&&cols[1]&&!/^[-:]+$/.test(cols[1])){',
      '          var epSlug=cols[1];',
      '          var epName=cols[0].replace(/^Epic \\d+[:\\-—]\\s*/,"").trim();',
      '          if(!_epicNames[epSlug]){_epicNames[epSlug]=epName;_epicOrder.push(epSlug);}',
      '        }',
      '      });',
      '    }',
      '    md.split(/\\n## Epic /).slice(1).forEach(function(eb){',
      '      var efl=eb.split("\\n")[0];',
      '      if(!/^\\d/.test(efl))return;',
      '      var nM=efl.match(/—\\s*(.+)$/)||efl.match(/[-]\\s*(.+)$/)||efl.match(/:\\s*(.+)$/);',
      '      var epSlug2=efl.replace(/^\\d+[:\\-—\\s]+/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");',
      '      var numM2=efl.match(/^(\\d+)/);',
      '      if(nM&&numM2&&!_epicNames[epSlug2]){_epicNames[epSlug2]=nM[1].trim();_epicOrder.push(epSlug2);}',
      '    });',
      '    var _storiesByEpic={};',
      '    md.split(/\\n## /).slice(1).forEach(function(sblk){',
      '      var sfl=sblk.split("\\n")[0].trim();',
      '      var sM=sfl.match(/^([a-z][a-z0-9.-]*\\.\\d+)\\s*[—\\-]\\s*(.+)$/i);',
      '      if(!sM)return;',
      '      var _cx=sblk.match(/Complexity:\\s*(\\d)/);',
      '      var _epM=sblk.match(/\\*\\*Epic:\\*\\*\\s*([a-z][a-z0-9-]*)/i);',
      '      var _epSlug=_epM?_epM[1]:"uncategorised";',
      '      if(!_storiesByEpic[_epSlug])_storiesByEpic[_epSlug]=[];',
      '      _storiesByEpic[_epSlug].push({id:sM[1],title:sM[2].trim(),cx:_cx?parseInt(_cx[1],10):0,raw:sblk});',
      '    });',
      '    var _allSlugs=_epicOrder.slice();',
      '    Object.keys(_storiesByEpic).forEach(function(s){if(_allSlugs.indexOf(s)===-1)_allSlugs.push(s);});',
      '    _allSlugs.forEach(function(slug,idx){',
      '      var sts=_storiesByEpic[slug]||[];',
      '      r.epics.push({num:String(idx+1),name:_epicNames[slug]||slug,stories:sts});',
      '      r.storyCount+=sts.length;',
      '    });',
      '  } else {',
      '    var eblocks=md.split(/\\n## Epic /);',
      '    for(var _ei=1;_ei<eblocks.length;_ei++){',
      '      var eb=eblocks[_ei];var fl=eb.split("\\n")[0];',
      '      if(!/^\\d/.test(fl))continue;',
      '      var numM=fl.match(/^(\\d+)/);',
      '      var nM=fl.match(/—\\s*(.+)$/);',
      '      if(!nM)nM=fl.match(/[-]\\s*(.+)$/);',
      '      if(!nM)nM=fl.match(/:\\s*(.+)$/);',
      '      var stories=[];var sblocks=eb.split(/\\n### /);',
      '      for(var _si=1;_si<sblocks.length;_si++){',
      '        var sb=sblocks[_si];var sl=sb.split("\\n")[0];',
      '        var idM=sl.match(/^([a-z][a-z0-9.-]*)/i);',
      '        var tM=sl.match(/—\\s*(.+)$/);if(!tM)tM=sl.match(/\\s[-]\\s(.+)$/);',
      '        var cxM=sb.match(/Complexity:\\s*(\\d)/);',
      '        stories.push({id:idM?idM[1]:"S"+_si,title:tM?tM[1].trim():sl.trim(),cx:cxM?parseInt(cxM[1],10):0,raw:sb});',
      '      }',
      '      r.epics.push({num:numM?numM[1]:String(_ei),name:nM?nM[1].trim():fl.trim(),stories:stories,raw:eb});',
      '      r.storyCount+=stories.length;',
      '    }',
      '  }',
      '  r.epicCount=r.epics.length;return r;',
      '}',
      'function renderDefinitionMap(p){',
      '  if(!p||!p.epicCount)return \'<div class="dm-empty">No stories found in artefact.</div>\';',
      '  var badge=p.slicing?\'<span class="dm-badge">\'+escHtmlClient(p.slicing)+\'</span>\':"";',
      '  var epicsHtml=p.epics.map(function(epic,ei){',
      '    var cards=epic.stories.map(function(s,si){',
      '      var cls=s.cx>=3?"dm-cx--h":s.cx===2?"dm-cx--m":"dm-cx--l";',
      '      return \'<button class="dm-card" data-ei="\'+ei+\'" data-si="\'+si+\'">\'+',
      '        \'<span class="dm-card-id">\'+escHtmlClient(s.id)+\'</span>\'+',
      '        \'<span class="dm-card-title">\'+escHtmlClient(s.title)+\'</span>\'+',
      '        (s.cx?\'<span class="dm-cx \'+cls+\'">C:\'+s.cx+"</span>":"")+"</button>";',
      '    }).join("");',
      '    var cntBadge=epic.stories.length?\'<span class="dm-epic-count">\'+epic.stories.length+(epic.stories.length===1?" story":" stories")+"</span>":"";',
      '    return \'<div class="dm-epic"><button class="dm-epic-hd" onclick="window.dmOpenEpic(\'+ei+\')" title="View epic details">\'+',
      '      \'<span class="dm-epic-tag">E\'+escHtmlClient(epic.num)+\'</span>\'+',
      '      \'<span class="dm-epic-name">\'+escHtmlClient(epic.name)+\'</span>\'+',
      '      cntBadge+\'<span style="font-size:9px;color:var(--muted);margin-left:auto;flex-shrink:0">&#x2197;</span>\'+',
      '      \'</button><div class="dm-cards">\'+',
      '      (cards||\'<span style="font-size:11px;color:var(--muted);padding:4px 0">No stories</span>\')+',
      '      \'</div></div>\';',
      '  }).join("");',
      '  return \'<div class="dm-canvas"><div class="dm-hdr"><span class="dm-count">\'+',
      '    p.epicCount+(p.epicCount===1?" epic":" epics")+" \xB7 "+p.storyCount+(p.storyCount===1?" story":" stories")+',
      '    \'</span>\'+badge+\'</div>\'+epicsHtml+\'</div>\';',
      '}',
      'window.dmParsed=null;',
      'window.dmOpenStory=function(ei,si){',
      '  var p=window.dmParsed;',
      '  if(!p||!p.epics[ei]||!p.epics[ei].stories[si])return;',
      '  var s=p.epics[ei].stories[si];',
      '  var modal=document.getElementById("dm-modal");',
      '  if(!modal){',
      '    modal=document.createElement("div");',
      '    modal.id="dm-modal";modal.className="dm-modal";',
      '    modal.innerHTML=',
      '      \'<div class="dm-mo" onclick="dmCloseModal()"></div>\'+',
      '      \'<div class="dm-mb"><div class="dm-mh">\'+',
      '        \'<div id="dm-mt" class="dm-mt"></div>\'+',
      '        \'<button onclick="dmCloseModal()" class="dm-mx" title="Close">✕</button>\'+',
      '      \'</div><div id="dm-body" class="dm-mbd"></div></div>\';',
      '    document.body.appendChild(modal);',
      '    document.addEventListener("keydown",function(ev){if(ev.key==="Escape")window.dmCloseModal();});',
      '  }',
      '  document.getElementById("dm-mt").textContent=s.id+" — "+s.title;',
      '  document.getElementById("dm-body").innerHTML=renderArtefactMd("### "+s.id+" — "+s.title+"\\n"+s.raw);',
      '  modal.style.display="flex";',
      '};',
      'window.dmOpenEpic=function(ei){',
      '  var p=window.dmParsed;if(!p||!p.epics[ei])return;',
      '  var epic=p.epics[ei];',
      '  var modal=document.getElementById("dm-modal");',
      '  if(!modal){modal=document.createElement("div");modal.id="dm-modal";modal.className="dm-modal";',
      '    modal.innerHTML=\'<div class="dm-mo" onclick="dmCloseModal()"></div><div class="dm-mb"><div class="dm-mh"><div id="dm-mt" class="dm-mt"></div><button onclick="dmCloseModal()" class="dm-mx" title="Close">✕</button></div><div id="dm-body" class="dm-mbd"></div></div>\';',
      '    document.body.appendChild(modal);',
      '    document.addEventListener("keydown",function(ev){if(ev.key==="Escape")window.dmCloseModal();});',
      '  }',
      '  document.getElementById("dm-mt").textContent="E"+epic.num+" — "+epic.name;',
      '  var storyList=epic.stories.map(function(s){return"- **"+s.id+"** — "+s.title;}).join("\\n");',
      '  var body=epic.raw?renderArtefactMd(epic.raw):(storyList?renderArtefactMd(storyList):"<p>No epic details available.</p>");',
      '  document.getElementById("dm-body").innerHTML=body;',
      '  modal.style.display="flex";',
      '};',
      'window.dmCloseModal=function(){var m=document.getElementById("dm-modal");if(m)m.style.display="none";};',
      'document.addEventListener("DOMContentLoaded",function(){',
      '  window.dmParsed=parseDefinitionArtefact(__art);',
      '  var canvas=document.getElementById("sv-dm-canvas");',
      '  if(canvas){',
      '    canvas.innerHTML=renderDefinitionMap(window.dmParsed);',
      '    canvas.addEventListener("click",function(e){',
      '      var card=e.target&&e.target.closest?e.target.closest(".dm-card"):null;',
      '      if(card)window.dmOpenStory(parseInt(card.dataset.ei,10),parseInt(card.dataset.si,10));',
      '    });',
      '  }',
      '});',
      '})();',
      '</script>'
    ].join('\n');
  } else {
    mainPanel = [
      '<article class="sr-paper">',
        artefactHtml || '<p class="sr-p" style="color:var(--muted)">No artefact content found.</p>',
      '</article>'
    ].join('');
  }

  var body = [
    '<style>',
    '.sv-page{max-width:740px;margin:0 auto;padding:24px 24px 100px}',
    '.sv-eyebrow{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 6px}',
    '.sv-title{font-size:20px;font-weight:700;margin:0 0 4px}',
    '.sv-sub{font-size:13px;color:var(--muted);margin:0 0 24px}',
    '.sr-paper{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:32px 36px;margin-bottom:24px;line-height:1.7;overflow-wrap:break-word}',
    '.sr-h1{font-size:20px;font-weight:700;margin:1.4em 0 0.5em;border-bottom:1px solid var(--line);padding-bottom:6px}',
    '.sr-h1:first-child,.sr-paper>:first-child{margin-top:0}',
    '.sr-h2{font-size:16px;font-weight:600;margin:1.2em 0 0.4em}',
    '.sr-h3{font-size:14px;font-weight:600;margin:1em 0 0.3em;color:var(--ink)}',
    '.sr-p{margin:0.6em 0;font-size:14px;color:var(--ink)}',
    '.sr-list{margin:0.4em 0 0.4em 1.4em;padding:0;font-size:14px}',
    '.sr-list li{margin-bottom:0.3em}',
    '.sr-hr{border:none;border-top:1px solid var(--line);margin:1.2em 0}',
    '.sr-pre{background:var(--line-2,#f6f8fa);border:1px solid var(--line);border-radius:6px;padding:14px 16px;overflow-x:auto;margin:0.8em 0;font-size:12px;line-height:1.5;font-family:var(--mono)}',
    '.sr-code{background:var(--line-2,#f6f8fa);border:1px solid var(--line);border-radius:3px;padding:1px 5px;font-size:12px;font-family:var(--mono)}',
    '.sv-action-bar{position:fixed;bottom:0;left:0;right:0;background:var(--bg);border-top:1px solid var(--line);padding:12px 24px;display:flex;align-items:center;gap:12px;z-index:100;box-shadow:0 -2px 8px rgba(0,0,0,.06)}',
    '.sv-action-hint{font-size:13px;color:var(--muted);flex:1;min-width:0}',
    '.sv-cost-meta{display:flex;align-items:center;gap:8px;margin:2px 0 20px}',
    '.sv-cost-badge{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;font-family:var(--mono)}',
    '.sv-cost-model{font-size:11px;color:var(--muted);font-family:var(--mono)}',
    '</style>',
    navigatorHtml,
    '<div class="sv-page">',
      '<p class="sv-eyebrow">' + escHtml(stageLabel) + ' — artefact</p>',
      '<h1 class="sv-title">' + featureName + '</h1>',
      (_stageCostUsd != null ? '<p class="sv-cost-meta"><span class="sv-cost-badge">$' + _stageCostUsd.toFixed(4) + '</span>' + (_stageModelShort ? '<span class="sv-cost-model">' + escHtml(_stageModelShort) + '</span>' : '') + '</p>' : ''),
      '<p class="sv-sub">Viewing completed stage document. ' + (isEdit ? 'Edit below and save.' : 'Click <strong>Edit</strong> to make changes.') + '</p>',
      mainPanel,
    '</div>',
    !isEdit ? [
      '<div class="sv-action-bar">',
        '<a href="' + escHtml(currentChatUrl) + '" class="sw-btn" style="border:1px solid var(--line);flex-shrink:0;font-size:13px">← Current stage</a>',
        '<span class="sv-action-hint">' + escHtml(artefactRelPath) + '</span>',
        '<a href="/journey/' + safeJourneyId + '/stage/' + encodeURIComponent(stageName) + '?edit=true" class="sw-btn sw-btn--primary" style="flex-shrink:0;font-size:13px">Edit artefact</a>',
      '</div>'
    ].join('') : ''
  ].join('');

  var html = renderShell({ title: stageLabel + ' — ' + featureName, bodyContent: body, user: { login: req.session.login || '' }, active: 'journey' });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/journey/:journeyId/stage/:stageName/artefact — save inline-edited artefact to disk.
 */
async function handlePostJourneyStageArtefact(req, res) {
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

  var repoRoot = getRepoRoot();
  var storeStage = (journey.completedStages || []).find(function(s) { return s.skillName === stageName; });
  var artefactRelPath = (storeStage && storeStage.artefactPath) || null;
  if (!artefactRelPath) {
    var dj = null;
    try { dj = _journeyDisk.loadJourney(journey.featureSlug, repoRoot); } catch (_) {}
    if (dj && dj.stages && dj.stages[stageName]) {
      artefactRelPath = dj.stages[stageName].artefactPath || null;
    }
  }
  if (!artefactRelPath) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No artefact path found for stage' }));
    return;
  }

  var body = await _readFormBody(req);
  var newContent = (body && body.content) || '';
  if (!newContent.trim()) {
    res.writeHead(302, { Location: '/journey/' + encodeURIComponent(journeyId) + '/stage/' + encodeURIComponent(stageName) });
    res.end();
    return;
  }

  var absPath = path.resolve(path.join(repoRoot, artefactRelPath));
  try {
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, newContent, 'utf8');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to write artefact: ' + err.message }));
    return;
  }

  res.writeHead(302, { Location: '/journey/' + encodeURIComponent(journeyId) + '/stage/' + encodeURIComponent(stageName) });
  res.end();
}

/**
 * GET /journey/:featureSlug/resume — resume a journey by creating a fresh session for the current stage.
 * Looks up the journey by featureSlug (disk), loads prior artefacts, creates session, redirects to chat.
 */
async function handleGetJourneyResume(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var featureSlug = req.params && req.params.featureSlug;
  var repoRoot = getRepoRoot();

  // Load from disk
  var diskJourney = null;
  try { diskJourney = _journeyDisk.loadJourney(featureSlug, repoRoot); } catch (_) {}
  if (!diskJourney) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<div class="sw-page-content"><p>Journey not found: ' + escHtml(featureSlug) + '</p><a href="/journey">Back to journeys</a></div>', user: { login: req.session.login || '' } }));
    return;
  }

  // Find in-memory journey (loaded at startup from disk)
  var allJourneys = _journeyStore.listJourneys ? _journeyStore.listJourneys(repoRoot) : [];
  var memJourney = allJourneys.find(function(j) { return j.featureSlug === featureSlug; });
  if (!memJourney && diskJourney.journeyId) {
    memJourney = _journeyStore.getJourney(diskJourney.journeyId);
  }

  var journeyId = memJourney ? memJourney.journeyId : (diskJourney.journeyId || null);
  var currentStage = diskJourney.currentStage || 'discovery';
  var productProfile = diskJourney.productProfile || 'default';

  // Build priorArtefacts from completed disk stages in sequence order
  var STAGE_ORDER = ['ideate', 'discovery', 'benefit-metric', 'design', 'definition', 'test-plan', 'review', 'definition-of-ready'];
  var diskStages = diskJourney.stages || {};
  var priorArtefacts = [];
  STAGE_ORDER.forEach(function(stageName) {
    var s = diskStages[stageName];
    if (s && s.status === 'complete' && s.artefactPath) {
      var absPath = path.resolve(path.join(repoRoot, s.artefactPath));
      var content = '';
      try { content = fs.readFileSync(absPath, 'utf8'); } catch (_) {}
      priorArtefacts.push({ path: s.artefactPath, content: content });
    }
  });

  // Create new session for current stage
  var sid = crypto.randomUUID();
  var sessionPath = path.join(repoRoot, 'artefacts', featureSlug, 'sessions', sid);

  getRegisterHtmlSession()(sid, sessionPath, currentStage, { productProfile: productProfile, priorArtefacts: priorArtefacts, featureSlug: featureSlug });

  if (journeyId) {
    getLinkSessionToJourney()(sid, journeyId);
    if (_journeyStore.setActiveSession) {
      _journeyStore.setActiveSession(journeyId, sid, currentStage);
    }
  }

  // Mark stage active on disk with new sessionId
  try { _journeyDisk.updateStage(featureSlug, currentStage, { status: 'active', sessionId: sid }, repoRoot); } catch (_) {}

  res.writeHead(303, { Location: '/skills/' + encodeURIComponent(currentStage) + '/sessions/' + sid + '/chat' });
  res.end();
}

// ---------------------------------------------------------------------------
// Step 7 — Reference folder upload UI
// ---------------------------------------------------------------------------

/**
 * Sanitise a user-supplied doc name to a safe filesystem filename stem.
 * Returns null if the name is invalid.
 * @param {string} raw
 * @returns {string|null}
 */
function _sanitiseRefFilename(raw) {
  if (!raw || typeof raw !== 'string') return null;
  var stem = raw.trim()
    .toLowerCase()
    .replace(/\.md$/, '')           // strip trailing .md if user typed it
    .replace(/[^a-z0-9_-]/g, '-')  // replace unsafe chars
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return stem.length > 0 ? stem : null;
}

/**
 * GET /journey/:journeyId/reference
 * Lists existing reference docs and shows an upload (paste) form.
 */
async function handleGetReference(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<div class="sw-page-content"><p>Journey not found.</p><a href="/journey">Back</a></div>', user: { login: req.session.login || '' } }));
    return;
  }

  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var refDir = path.join(repoRoot, 'artefacts', featureSlug, 'reference');
  var existingFiles = [];
  if (fs.existsSync(refDir)) {
    existingFiles = fs.readdirSync(refDir)
      .filter(function(f) { return f.endsWith('.md') || f.endsWith('.txt'); })
      .sort();
  }

  var safeId = escHtml(journeyId);
  var featureName = escHtml(featureSlug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' '));

  var fileList = existingFiles.length > 0
    ? existingFiles.map(function(f) {
        var stat;
        try { stat = fs.statSync(path.join(refDir, f)); } catch (_) {}
        var size = stat ? Math.round(stat.size / 1024 * 10) / 10 + ' KB' : '';
        return '<li class="rf-file"><span class="rf-filename">📄 ' + escHtml(f) + '</span>' +
          (size ? '<span class="rf-size">' + escHtml(size) + '</span>' : '') + '</li>';
      }).join('')
    : '<li class="rf-empty">No reference docs yet — add one below.</li>';

  var body = [
    '<style>',
    '.rf-page{max-width:660px;margin:0 auto;padding:28px 24px}',
    '.rf-hdr{margin-bottom:28px}',
    '.rf-eyebrow{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 6px}',
    '.rf-title{font-size:20px;font-weight:700;margin:0 0 4px}',
    '.rf-sub{font-size:13px;color:var(--muted);margin:0}',
    '.rf-section{margin-bottom:28px}',
    '.rf-section h2{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 12px}',
    '.rf-filelist{list-style:none;margin:0;padding:0}',
    '.rf-file{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid var(--line);border-radius:6px;margin-bottom:6px;background:var(--surface);font-size:13px}',
    '.rf-filename{font-family:var(--mono);font-size:12px}',
    '.rf-size{font-size:11px;color:var(--muted)}',
    '.rf-empty{font-size:13px;color:var(--muted);padding:10px 0}',
    '.rf-form-row{margin-bottom:16px}',
    '.rf-label{display:block;font-size:13px;font-weight:600;margin-bottom:5px}',
    '.rf-hint{font-size:12px;color:var(--muted);margin-top:4px}',
    '.rf-input{width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid var(--line);border-radius:6px;font-size:13px;background:var(--bg);color:var(--ink);font-family:inherit}',
    '.rf-textarea{width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid var(--line);border-radius:6px;font-size:12px;background:var(--bg);color:var(--ink);font-family:var(--mono);line-height:1.5;resize:vertical}',
    '.rf-input:focus,.rf-textarea:focus{outline:2px solid var(--accent,#0969da);border-color:transparent}',
    '.rf-actions{display:flex;align-items:center;gap:12px}',
    '.rf-back{font-size:13px;color:var(--muted)}',
    '</style>',
    '<div class="rf-page">',
      '<div class="rf-hdr">',
        '<p class="rf-eyebrow">Reference docs</p>',
        '<h1 class="rf-title">' + featureName + '</h1>',
        '<p class="rf-sub">Files here are automatically loaded into the Design skill system prompt.</p>',
      '</div>',
      '<section class="rf-section">',
        '<h2>Existing docs (' + existingFiles.length + ')</h2>',
        '<ul class="rf-filelist">' + fileList + '</ul>',
      '</section>',
      '<section class="rf-section">',
        '<h2>Add a reference doc</h2>',
        '<form method="POST" action="/api/journey/' + safeId + '/reference">',
          '<div class="rf-form-row">',
            '<label class="rf-label" for="rf-name">Document name</label>',
            '<input id="rf-name" class="rf-input" name="filename" type="text" placeholder="e.g. solution-architecture or ux-wireframe" required>',
            '<p class="rf-hint">Saved as <code>[name].md</code> in the reference folder. Alphanumeric and hyphens only.</p>',
          '</div>',
          '<div class="rf-form-row">',
            '<label class="rf-label" for="rf-content">Content</label>',
            '<textarea id="rf-content" class="rf-textarea" name="content" rows="18" placeholder="Paste markdown, text, or structured content here..." required></textarea>',
            '<p class="rf-hint">Markdown is rendered in the design skill. Max 100 KB.</p>',
          '</div>',
          '<div class="rf-actions">',
            '<button type="submit" class="sw-btn sw-btn--primary">Save reference doc</button>',
            '<a href="javascript:history.back()" class="rf-back">Cancel</a>',
          '</div>',
        '</form>',
      '</section>',
    '</div>'
  ].join('');

  var html = renderShell({ title: 'Reference docs — ' + featureName, bodyContent: body, user: { login: req.session.login || '' }, active: 'journey' });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/journey/:journeyId/reference
 * Saves a new reference doc to artefacts/{featureSlug}/reference/{filename}.md.
 */
async function handlePostReference(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<p>Journey not found.</p>', user: { login: req.session.login || '' } }));
    return;
  }

  var body = await _readFormBody(req);
  var rawFilename = (body.filename || '').trim();
  var content     = (body.content  || '').trim();

  var stem = _sanitiseRefFilename(rawFilename);
  if (!stem) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<div class="sw-page-content"><p>Invalid filename. Use letters, numbers, and hyphens only.</p><a href="javascript:history.back()">Back</a></div>', user: { login: req.session.login || '' } }));
    return;
  }
  if (!content) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<div class="sw-page-content"><p>Content cannot be empty.</p><a href="javascript:history.back()">Back</a></div>', user: { login: req.session.login || '' } }));
    return;
  }
  if (content.length > 100 * 1024) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<div class="sw-page-content"><p>Content too large (max 100 KB).</p><a href="javascript:history.back()">Back</a></div>', user: { login: req.session.login || '' } }));
    return;
  }

  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var refDir  = path.join(repoRoot, 'artefacts', featureSlug, 'reference');
  var filePath = path.join(refDir, stem + '.md');

  // Path traversal guard
  var resolvedRoot = path.resolve(repoRoot);
  if (!path.resolve(filePath).startsWith(resolvedRoot + path.sep)) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<p>Invalid filename.</p>', user: { login: req.session.login || '' } }));
    return;
  }

  try {
    fs.mkdirSync(refDir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Error', bodyContent: '<div class="sw-page-content"><p>Failed to save: ' + escHtml(err.message) + '</p></div>', user: { login: req.session.login || '' } }));
    return;
  }

  res.writeHead(303, { Location: '/journey/' + encodeURIComponent(journeyId) + '/reference' });
  res.end();
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
  // Call completeStage to record this stage (guard: auto-save may have already called this)
  if (!session._stageDone) {
    session._stageDone = true;
    var _costUsd = null;
    try {
      var _computeCost = require('./skills').computeCostUsd;
      _costUsd = _computeCost(session.usage || null);
    } catch (_ce) {}
    var _usageSummary = session.usage ? Object.assign({ costUsd: _costUsd }, session.usage) : null;
    _journeyStore.completeStage(journeyId, session.skillName, artefactRelPath, _usageSummary);
    if (_costUsd != null) {
      console.info(JSON.stringify({ event: 'stage_cost', journeyId: journeyId, stage: session.skillName, model: (session.usage || {}).model, costUsd: _costUsd, inputTokens: (session.usage || {}).input_tokens, outputTokens: (session.usage || {}).output_tokens }));
    }
  }

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
  // completedStages entries may be objects { skillName, artefactPath } or legacy strings
  var updatedJourney = _journeyStore.getJourney(journeyId);
  var priorArtefacts = (updatedJourney.completedStages || []).map(function(stage) {
    var artefactPath = typeof stage === 'string' ? null : stage.artefactPath;
    if (!artefactPath) return null;
    var stageAbsPath = path.resolve(path.join(repoRoot, artefactPath));
    var content = '';
    try { content = fs.readFileSync(stageAbsPath, 'utf8'); } catch (_) {}
    return { path: artefactPath, content: content };
  }).filter(Boolean);
  // Determine next stage
  var nextStage = _journeyStore.getNextStage(session.skillName);
  console.info(JSON.stringify({ event: 'artefact_saved_to_disk', journeyId: journeyId, stage: session.skillName, featureSlug: journey.featureSlug }));

  // Per-story stage sequence: review → test-plan → definition-of-ready
  // review runs first (may change story scope); test-plan requires a passed review.
  var PER_STORY_SEQ = ['review', 'test-plan', 'definition-of-ready'];
  var perStoryIdx = PER_STORY_SEQ.indexOf(session.skillName);
  var newSid, newSessionPath, perStoryNextStage;

  if (session.skillName === 'definition-of-ready') {
    // Story-mode: check for more stories; feature-mode: complete journey
    var nextStory = _journeyStore.advanceToNextStory(journeyId);
    if (nextStory) {
      // More stories: create review session for next story (review → test-plan → DoR per story)
      newSid = crypto.randomUUID();
      newSessionPath = path.join(os.tmpdir(), 'ougl-sessions', newSid + '-review.md');
      getRegisterHtmlSession()(newSid, newSessionPath, 'review', { priorArtefacts: priorArtefacts, featureSlug: journey.featureSlug });
      getLinkSessionToJourney()(newSid, journeyId);
      if (_journeyStore.setActiveSession) {
        _journeyStore.setActiveSession(journeyId, newSid, 'review');
      }
      res.writeHead(303, { Location: '/skills/review/sessions/' + newSid + '/chat' });
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
    getRegisterHtmlSession()(newSid, newSessionPath, perStoryNextStage, { priorArtefacts: priorArtefacts, featureSlug: journey.featureSlug });
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
  } else if (nextStage === 'review') {
    // Feature-level: switch to per-story routing (ougl.6)
    // review is the first per-story stage (review → test-plan → definition-of-ready per story)
    res.writeHead(303, { Location: '/journey/' + journeyId + '/stories' });
    res.end();
  } else {
    // Feature-level: create session for next stage
    newSid = crypto.randomUUID();
    newSessionPath = path.join(os.tmpdir(), 'ougl-sessions', newSid + '-' + nextStage + '.md');
    getRegisterHtmlSession()(newSid, newSessionPath, nextStage, { priorArtefacts: priorArtefacts, featureSlug: journey.featureSlug });
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
    '<p>Enter one story slug per line. These will be processed through review, test-plan, and definition-of-ready.</p>',
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
  // Create review session for first story (review → test-plan → DoR per story)
  var newSid = crypto.randomUUID();
  var newSessionPath = path.join(os.tmpdir(), 'ougl-sessions', newSid + '-review.md');
  getRegisterHtmlSession()(newSid, newSessionPath, 'review', { priorArtefacts: priorArtefacts, featureSlug: journey.featureSlug });
  getLinkSessionToJourney()(newSid, journeyId);
  if (_journeyStore.setActiveSession) {
    _journeyStore.setActiveSession(journeyId, newSid, 'review');
  }
  res.writeHead(303, { Location: '/skills/review/sessions/' + newSid + '/chat' });
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
  var featureSlug = journey.featureSlug || journeyId;
  var completedStages = journey.completedStages || [];
  var stageCount = completedStages.length;

  // Human-readable feature name from slug: strip date prefix, spaces from dashes
  var _featureName = featureSlug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ');

  var _STAGE_META_MAP = {
    'ideate':              { num: '1',  label: 'Ideate' },
    'discovery':           { num: '2',  label: 'Discovery' },
    'benefit-metric':      { num: '2b', label: 'Benefits & Metrics' },
    'design':              { num: '3',  label: 'Design' },
    'definition':          { num: '4',  label: 'Definition' },
    'review':              { num: '5',  label: 'Review' },
    'test-plan':           { num: '6',  label: 'Test Plan' },
    'definition-of-ready': { num: '7',  label: 'Def of Ready' },
  };

  var _totalCostUsd = 0;
  var _totalInputTok = 0;
  var _totalOutputTok = 0;
  var _hasCost = false;
  completedStages.forEach(function(s) {
    if (s.costUsd != null) { _hasCost = true; _totalCostUsd += s.costUsd; }
    _totalInputTok  += (s.inputTokens  || 0);
    _totalOutputTok += (s.outputTokens || 0);
  });
  var _totalTokens = _totalInputTok + _totalOutputTok;

  var safeJourneyId = escHtml(journeyId);

  // Pipeline nodes row
  var _nodeHtml = completedStages.map(function(stage, i) {
    var sm = _STAGE_META_MAP[stage.skillName] || { num: '·', label: stage.skillName || '' };
    var connector = i > 0 ? '<div class="jc-connector" aria-hidden="true"></div>' : '';
    return connector + '<div class="jc-node">' +
      '<div class="jc-node-circle">' + escHtml(sm.num) + '</div>' +
      '<div class="jc-node-label">' + escHtml(sm.label) + '</div>' +
    '</div>';
  }).join('');

  // Stage rows
  var _stageRows = completedStages.map(function(stage) {
    var sm = _STAGE_META_MAP[stage.skillName] || { num: '·', label: stage.skillName || '' };
    var href = '/journey/' + safeJourneyId + '/stage/' + encodeURIComponent(stage.skillName || '');
    var modelShort = (stage.model || '').replace(/^claude-/, '').replace(/^gpt-/, '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
    var costCell = stage.costUsd != null
      ? '<span class="jc-cost-pill">$' + stage.costUsd.toFixed(4) + '</span>'
      : '<span class="jc-cost-pill jc-cost-pill--none">—</span>';
    var modelCell = modelShort
      ? '<span class="jc-model-pill">' + escHtml(modelShort) + '</span>'
      : '';
    var dateCell = stage.completedAt
      ? escHtml(stage.completedAt.slice(0, 10))
      : '';
    return '<tr class="jc-row">' +
      '<td class="jc-col-num">' + escHtml(sm.num) + '</td>' +
      '<td class="jc-col-label">' + escHtml(sm.label) + '</td>' +
      '<td class="jc-col-cost">' + costCell + '</td>' +
      '<td class="jc-col-model">' + modelCell + '</td>' +
      '<td class="jc-col-date">' + dateCell + '</td>' +
      '<td class="jc-col-link"><a href="' + escHtml(href) + '" class="jc-view-link">View ›</a></td>' +
    '</tr>';
  }).join('');

  var _statsHtml = [
    '<span class="jc-stat"><strong>' + stageCount + '</strong> stage' + (stageCount !== 1 ? 's' : '') + '</span>',
    _hasCost ? '<span class="jc-stat-sep">·</span><span class="jc-stat"><strong>$' + _totalCostUsd.toFixed(4) + '</strong> total</span>' : '',
    _totalTokens > 0 ? '<span class="jc-stat-sep">·</span><span class="jc-stat"><strong>' + (_totalTokens >= 1000 ? Math.round(_totalTokens / 1000) + 'k' : _totalTokens) + '</strong> tokens</span>' : '',
  ].join('');

  var body = [
    '<style>',
    '.jc-page{max-width:780px;margin:0 auto;padding:32px 24px 80px}',
    /* Header */
    '.jc-header{margin-bottom:32px}',
    '.jc-check{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--green-soft);color:var(--green);font-size:18px;margin-bottom:14px}',
    '.jc-eyebrow{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 6px}',
    '.jc-feature-name{font-size:24px;font-weight:700;margin:0 0 10px;color:var(--ink);font-family:var(--serif);text-transform:capitalize}',
    '.jc-stats{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);flex-wrap:wrap;margin-bottom:4px}',
    '.jc-stat strong{color:var(--ink);font-weight:600}',
    '.jc-stat-sep{color:var(--line);font-size:14px;user-select:none}',
    '.jc-slug{font-family:var(--mono);font-size:11px;color:var(--muted-2);margin-top:6px}',
    /* Pipeline nodes */
    '.jc-pipeline{display:flex;align-items:flex-start;overflow-x:auto;padding:20px 0 8px;gap:0;scrollbar-width:thin;margin-bottom:28px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}',
    '.jc-node{display:flex;flex-direction:column;align-items:center;flex:0 0 auto}',
    '.jc-node-circle{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:var(--green-soft);border:2px solid var(--green);color:var(--green)}',
    '.jc-node-label{font-size:9px;color:var(--muted);margin-top:5px;text-align:center;max-width:58px;line-height:1.2;white-space:nowrap;font-weight:500;text-transform:uppercase;letter-spacing:.03em}',
    '.jc-connector{flex:1;min-width:16px;max-width:40px;height:2px;background:var(--green);margin-top:17px;opacity:0.4}',
    /* Stage table */
    '.jc-table{width:100%;border-collapse:collapse;margin-bottom:32px}',
    '.jc-table thead th{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding:0 12px 8px;text-align:left;border-bottom:2px solid var(--line)}',
    '.jc-row{border-bottom:1px solid var(--line)}',
    '.jc-row:last-child{border-bottom:none}',
    '.jc-row:hover{background:var(--line-2)}',
    '.jc-col-num{font-size:10px;font-weight:700;font-family:var(--mono);color:var(--muted);padding:12px 12px 12px 0;width:28px;white-space:nowrap}',
    '.jc-col-label{font-size:13px;font-weight:500;color:var(--ink);padding:12px 12px 12px 0}',
    '.jc-col-cost{padding:12px 12px 12px 0;white-space:nowrap}',
    '.jc-col-model{padding:12px 12px 12px 0;white-space:nowrap}',
    '.jc-col-date{font-size:11px;font-family:var(--mono);color:var(--muted-2);padding:12px 12px 12px 0;white-space:nowrap}',
    '.jc-col-link{padding:12px 0;text-align:right}',
    '.jc-cost-pill{font-family:var(--mono);font-size:11px;font-weight:600;color:var(--green);background:var(--green-soft);padding:2px 7px;border-radius:8px;white-space:nowrap}',
    '.jc-cost-pill--none{color:var(--muted-2);background:var(--line-2)}',
    '.jc-model-pill{font-family:var(--mono);font-size:10px;color:var(--muted);background:var(--line-2);padding:2px 6px;border-radius:6px;white-space:nowrap}',
    '.jc-view-link{font-size:12px;font-weight:500;color:var(--accent-ink);text-decoration:none;padding:4px 8px;border-radius:5px;border:1px solid var(--line);white-space:nowrap}',
    '.jc-view-link:hover{background:var(--accent-soft);border-color:var(--accent)}',
    /* CTA block */
    '.jc-cta{background:var(--accent-soft);border:1px solid var(--accent);border-radius:10px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}',
    '.jc-cta-text{font-size:14px;font-weight:500;color:var(--accent-ink)}',
    '.jc-cta-sub{font-size:12px;color:var(--accent-ink);opacity:.75;margin-top:2px}',
    '.jc-btn-primary{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:7px;font-size:13px;font-weight:600;text-decoration:none;background:var(--accent);color:#fff;white-space:nowrap}',
    '.jc-btn-primary:hover{opacity:.9}',
    '.jc-secondary-actions{display:flex;gap:10px;flex-wrap:wrap}',
    '.jc-btn-ghost{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:7px;font-size:13px;font-weight:500;text-decoration:none;color:var(--ink);border:1px solid var(--line);white-space:nowrap}',
    '.jc-btn-ghost:hover{border-color:var(--accent);color:var(--accent-ink)}',
    '</style>',
    '<div class="jc-page">',

    /* ── Header ── */
    '<div class="jc-header">',
    '  <div class="jc-check">✓</div>',
    '  <p class="jc-eyebrow">Journey complete</p>',
    '  <h1 class="jc-feature-name">' + escHtml(_featureName) + '</h1>',
    '  <div class="jc-stats">' + _statsHtml + '</div>',
    '  <div class="jc-slug">' + escHtml(featureSlug) + '</div>',
    '</div>',

    /* ── Pipeline nodes ── */
    stageCount > 0 ? '<div class="jc-pipeline" aria-label="Completed stages">' + _nodeHtml + '</div>' : '',

    /* ── Stage table ── */
    stageCount > 0 ? [
      '<table class="jc-table">',
      '<thead><tr>',
      '  <th></th>',
      '  <th>Stage</th>',
      '  <th>Cost</th>',
      '  <th>Model</th>',
      '  <th>Completed</th>',
      '  <th></th>',
      '</tr></thead>',
      '<tbody>' + _stageRows + '</tbody>',
      '</table>',
    ].join('') : '',

    /* ── CTA ── */
    '<div class="jc-cta">',
    '  <div>',
    '    <div class="jc-cta-text">Ready for implementation</div>',
    '    <div class="jc-cta-sub">All stages complete — start the inner coding loop</div>',
    '  </div>',
    '  <a class="jc-btn-primary" href="/journey/' + safeJourneyId + '">Continue &#x2192;</a>',
    '</div>',

    /* ── Secondary actions ── */
    '<div class="jc-secondary-actions">',
    '  <a class="jc-btn-ghost" href="/journey">&#x2190; All journeys</a>',
    '</div>',

    '</div>'
  ].join('');

  var html = renderShell({ title: 'Journey Complete — ' + escHtml(featureSlug), bodyContent: body, user: { login: req.session.login || '' } });
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
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'text/html; charset=utf-8' });
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
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
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
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
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
  try { requireJourneyAccess(journey, req.session, POLICY.OWNER); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.OWNER), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.code }));
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
  try { requireJourneyAccess(journey, req.session, POLICY.OWNER); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.OWNER), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.code }));
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
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
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
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
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
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  var sideTripSid = journey.sideTripSessionId;
  if (sideTripSid) {
    var stSession = getGetHtmlSession()(sideTripSid);
    if (stSession) {
      stSession.done = true;
      // Mark clarify as done on the journey if the side-trip session was a /clarify
      if (stSession.skillName === 'clarify') {
        _journeyStore.setJourneyFields(journeyId, { clarifyDone: true, sideTripSessionId: null });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ closed: true }));
        return;
      }
    }
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
    // Mark estimate as done on the journey so the navigator can show it
    _journeyStore.setJourneyFields(journeyId, { estimateDone: true });
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
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
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
  'design':                  { capabilities: [], limitedOnWebUI: false },
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
 * Returns an array of skill directory names under skills/.
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
 * Reads skills/[skillName]/SKILL.md and assembles a prompt.
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
  handleGetJourneyResume,
  handleGetStageReview,
  handleGetReference,
  handlePostReference,
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
  handleGetJourneyStageView,
  handlePostJourneyStageArtefact,
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


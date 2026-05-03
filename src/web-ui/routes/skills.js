'use strict';
/**
 * skills.js — Route handlers for skill launcher endpoints (wuce.13)
 *
 * Routes:
 *   GET  /api/skills
 *   POST /api/skills/:name/sessions
 *   POST /api/skills/:name/sessions/:id/answers
 *
 * Auth: session.accessToken required (NOT_AUTHENTICATED → 401).
 * Licence: Copilot licence checked via validateLicence (NO_COPILOT_LICENCE → 403).
 * Security: path traversal blocked on skill names; answers sanitised before use.
 *
 * Handler naming convention mirrors the rest of web-ui/routes/:
 *   handleGetSkills, handlePostSession, handlePostAnswer
 */

const path = require('path');
const fs   = require('fs');

const sessionStore = require('../../session-store');

const { listAvailableSkills, validateSkillName } = require('../../adapters/skill-discovery');
const { extractQuestions }  = require('../../skill-content-adapter');
const { sanitiseAnswer }    = require('../../answer-sanitiser');
const { validateLicence }   = require('../../adapters/copilot-licence');
const sessionManager        = require('../../modules/session-manager');
const { validateArtefactPath } = require('../../artefact-path-validator');
const { commitArtefact }       = require('../../scm-adapter');

const MAX_ANSWER_LENGTH = 1000;

// AC5 — exact message returned to client when licence is absent
const NO_LICENCE_MSG = 'No active Copilot licence found for this account. Please visit https://github.com/features/copilot to activate.';

// In-memory store for active sessions (answer accumulator).
// Key: sessionId (UUID), value: { skillName, sessionPath, questions, answers }
// Scoped to process lifetime; orphaned sessions cleaned up by session-manager on restart.
const _sessionStore = new Map();

// Audit logger — replaced via setLogger() in tests and production bootstrap.
// Never log answer content (ADR-009).
let _logger = {
  info:  function(evt, data) { process.stdout.write('[skills-route] ' + evt + (data ? ' ' + JSON.stringify(data) : '') + '\n'); },
  warn:  function(msg)       { process.stderr.write('[skills-route] WARN ' + msg + '\n'); },
  error: function(msg)       { process.stderr.write('[skills-route] ERROR ' + msg + '\n'); }
};

function setLogger(logger) { _logger = logger; }

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolve the repository root used by listAvailableSkills. */
function _getRepoPath() {
  return process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../..');
}

/**
 * Return questions for a named skill by reading its SKILL.md.
 * Returns [] when the skill or file cannot be found.
 */
function _getQuestionsForSkill(skillName) {
  var repoPath = _getRepoPath();
  var skills   = listAvailableSkills(repoPath);
  var skill    = skills.find(function(s) { return s.name === skillName; });
  if (!skill || !skill.path) { return []; }
  var relSkillPath = path.isAbsolute(skill.path) ? skill.path : path.join(repoPath, skill.path);
  var skillMdPath  = path.join(relSkillPath, 'SKILL.md');
  var content = fs.existsSync(skillMdPath)
    ? fs.readFileSync(skillMdPath, 'utf8')
    : '';
  return extractQuestions(content);
}

/**
 * Check whether a skill name is on the discovered allowlist.
 * Rejects names containing path-traversal characters.
 * @param {string} name
 * @returns {boolean}
 */
function _isAllowedSkillName(name) {
  if (!name || /[./\\%]/.test(name)) { return false; }
  var repoPath = _getRepoPath();
  var skills   = listAvailableSkills(repoPath);
  return validateSkillName(name, skills);
}

/**
 * Read the request body as a parsed JSON object.
 * Returns req.body when already present (test / middleware scenario).
 * @param {object} req
 * @returns {Promise<object|null>}
 */
function _readBody(req) {
  if (req.body !== undefined) { return Promise.resolve(req.body); }
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(chunk) { raw += chunk; });
    req.on('end', function() {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
    });
    req.on('error', function() { resolve(null); });
  });
}

/**
 * Send a JSON response.
 * @param {object} res
 * @param {number} status
 * @param {object} body
 */
function _json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

// ---------------------------------------------------------------------------
// Reusable auth / licence guards (return true if request should continue)
// ---------------------------------------------------------------------------

/**
 * Validate authentication. Returns false and writes 401 when not authenticated.
 */
function _checkAuth(req, res) {
  if (!req.session || !req.session.accessToken) {
    _json(res, 401, { error: 'NOT_AUTHENTICATED' });
    return false;
  }
  return true;
}

/**
 * Validate Copilot licence. Returns false and writes 403 when licence absent.
 * @returns {Promise<boolean>}
 */
async function _checkLicence(req, res) {
  var result = await validateLicence(req.session.accessToken);
  if (!result.valid) {
    _json(res, 403, { error: 'NO_COPILOT_LICENCE', message: NO_LICENCE_MSG });
    return false;
  }
  return true;
}

/**
 * Validate skill name: path-traversal characters → 400 INVALID_SKILL_NAME.
 * Unknown skill → 400 SKILL_NOT_FOUND.
 * Returns false and writes the error response when invalid.
 */
function _checkSkillName(name, res) {
  if (!name || /[./\\%]/.test(name)) {
    _json(res, 400, { error: 'INVALID_SKILL_NAME' });
    return false;
  }
  if (!_isAllowedSkillName(name)) {
    _json(res, 400, { error: 'SKILL_NOT_FOUND' });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Route handlers (exported — wired into server.js routing block)
// ---------------------------------------------------------------------------

/**
 * GET /api/skills
 * Returns the list of available skills: [{ name, path }].
 * Requires: authenticated + valid Copilot licence.
 */
async function handleGetSkills(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    if (!await _checkLicence(req, res)) { return; }
    var repoPath = _getRepoPath();
    var skills   = listAvailableSkills(repoPath);
    _logger.info('skill_list_requested', { count: skills.length });
    _json(res, 200, { skills: skills });
  } catch (err) {
    _logger.error('handleGetSkills: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * POST /api/skills/:name/sessions
 * Starts a skill session. Returns 201 with sessionId + first question.
 * Requires: authenticated + valid licence + skill name in allowlist.
 * @param {object} req - expects req.params.name
 */
async function handlePostSession(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    if (!await _checkLicence(req, res)) { return; }
    var name = req.params && req.params.name;
    if (!_checkSkillName(name, res)) { return; }

    var userId      = (req.session && req.session.userId) || 'anonymous';
    var sessionPath = sessionManager.createSession(userId);
    var sessionId   = path.basename(sessionPath);
    var questions   = _getQuestionsForSkill(name);

    _sessionStore.set(sessionId, {
      skillName:   name,
      sessionPath: sessionPath,
      questions:   questions,
      answers:     [],
      userId:      userId
    });

    // Do NOT include raw SKILL.md content or CLI flags in the response (AC / T3.4).
    _logger.info('session_started', { skillName: name, sessionId: sessionId });
    _json(res, 201, {
      sessionId:      sessionId,
      question:       questions.length > 0 ? questions[0] : null,
      totalQuestions: questions.length
    });
  } catch (err) {
    _logger.error('handlePostSession: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * POST /api/skills/:name/sessions/:id/answers
 * Submits an answer for the current question. Returns next question or complete flag.
 * Answer is sanitised BEFORE storage; raw content is never forwarded or logged (T4.6).
 * @param {object} req - expects req.params.name, req.params.id, req.body.answer
 */
async function handlePostAnswer(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    if (!await _checkLicence(req, res)) { return; }
    var name = req.params && req.params.name;
    if (!_checkSkillName(name, res)) { return; }

    var sessionId = req.params && req.params.id;
    var body      = await _readBody(req);
    var raw       = (body && body.answer != null) ? String(body.answer) : '';

    if (raw.length > MAX_ANSWER_LENGTH) {
      _json(res, 400, { error: 'ANSWER_TOO_LONG', maxLength: MAX_ANSWER_LENGTH });
      return;
    }

    // Sanitise BEFORE any use — raw content is never forwarded or logged.
    var clean = sanitiseAnswer(raw);

    var state = _sessionStore.get(sessionId);
    if (!state) {
      _json(res, 404, { error: 'SESSION_NOT_FOUND' });
      return;
    }

    state.answers.push(clean);

    var nextIndex    = state.answers.length;
    var nextQuestion = nextIndex < state.questions.length ? state.questions[nextIndex] : null;
    var complete     = nextQuestion === null;

    // Log event only — never log the answer content itself (audit requirement T4.6).
    _logger.info('answer_recorded', { sessionId: sessionId, answerIndex: nextIndex - 1 });

    _json(res, 200, { nextQuestion: nextQuestion, complete: complete });
  } catch (err) {
    _logger.error('handlePostAnswer: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * GET /api/skills/:name/sessions/:id/state
 * Returns current session state: status, currentQuestion, partialArtefact.
 * Requires: authenticated + session ownership.
 */
async function handleGetSessionState(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    var id      = req.params && req.params.id;
    var session = _sessionStore.get(id);
    if (!session) {
      _json(res, 404, { error: 'SESSION_NOT_FOUND' });
      return;
    }
    var reqUserId = req.session && req.session.userId;
    if (session.userId !== reqUserId) {
      _json(res, 403, { error: 'SESSION_FORBIDDEN' });
      return;
    }
    var answerCount      = session.answers ? session.answers.length : 0;
    var currentQuestion  = session.questions && session.questions[answerCount] || null;
    var status           = answerCount >= (session.questions ? session.questions.length : 0) ? 'complete' : 'active';
    _json(res, 200, {
      status:           status,
      currentQuestion:  currentQuestion,
      partialArtefact:  session.partialArtefact || null
    });
  } catch (err) {
    _logger.error('handleGetSessionState: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * POST /api/skills/:name/sessions/:id/commit
 * Commits the completed session artefact to the repository.
 * Returns 201 { sha, htmlUrl } on success.
 * Returns 400 SESSION_NOT_COMPLETE if session not yet complete.
 * Returns 403 if session belongs to different user.
 * Returns 401 if not authenticated.
 * Returns 409 ARTEFACT_CONFLICT with message from AC4.
 */
async function handleCommitArtefact(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    var id      = req.params && req.params.id;
    var session = _sessionStore.get(id);
    if (!session) {
      _json(res, 404, { error: 'SESSION_NOT_FOUND' });
      return;
    }
    var reqUserId = req.session && req.session.userId;
    if (session.userId !== reqUserId) {
      _json(res, 403, { error: 'SESSION_FORBIDDEN' });
      return;
    }
    // Check session is complete (all questions answered)
    var isComplete = session.questions && session.answers &&
      session.answers.length >= session.questions.length;
    if (!isComplete) {
      _json(res, 400, { error: 'SESSION_NOT_COMPLETE' });
      return;
    }
    // Derive artefact path from session (not from client body — server-derived)
    var skillName    = session.skillName;
    var today        = new Date().toISOString().slice(0, 10);
    var artefactPath = 'artefacts/' + today + '-' + skillName + '/session-' + id + '-output.md';
    // Build content from answers
    var content = '# ' + skillName + ' session output\n\n' +
      session.answers.map(function(a, i) {
        return '## Q' + (i + 1) + '\n\n' + (a.answer || a) + '\n';
      }).join('\n');
    var commitMessage = 'artefact: commit /' + skillName + ' session output [' + id + ']';
    var token    = req.session.accessToken;
    var identity = { name: reqUserId || 'anonymous', email: (reqUserId || 'anonymous') + '@users.noreply.github.com' };

    try {
      var result = await commitArtefact(artefactPath, content, commitMessage, token, identity);
      _logger.info('artefact_committed', { sessionId: id, artefactPath: artefactPath });
      _json(res, 201, { sha: result.sha, htmlUrl: result.htmlUrl });
    } catch (commitErr) {
      if (commitErr.status === 409) {
        _json(res, 409, {
          error:               'ARTEFACT_CONFLICT',
          message:             'Artefact has already been committed. To overwrite, load the current version first.',
          existingArtefactUrl: commitErr.htmlUrl || null
        });
        return;
      }
      throw commitErr;
    }
  } catch (err) {
    _logger.error('handleCommitArtefact: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * GET /api/skills/:name/sessions/:id/resume
 * Returns durable session state for resuming a session.
 * Returns 410 Gone when session is expired (SESSION_EXPIRED).
 * Returns 403 when session belongs to different user.
 * Returns 404 when session not found.
 */
async function handleResumeSession(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    var id      = req.params && req.params.id;
    var userId  = req.session && req.session.userId;
    var session;
    try {
      session = await sessionStore.getDurableSession(id, userId);
    } catch (err) {
      if (err.code === 'SESSION_NOT_FOUND') {
        _json(res, 404, { error: 'SESSION_NOT_FOUND' });
        return;
      }
      if (err.code === 'SESSION_FORBIDDEN') {
        _json(res, 403, { error: 'SESSION_FORBIDDEN' });
        return;
      }
      if (err.code === 'SESSION_EXPIRED') {
        _json(res, 410, { error: 'SESSION_EXPIRED', message: 'Session expired' });
        return;
      }
      throw err;
    }
    _json(res, 200, {
      sessionId:       session.sessionId,
      skillName:       session.skillName,
      questionIndex:   session.questionIndex,
      answers:         session.answers,
      partialArtefact: session.partialArtefact,
      complete:        session.complete
    });
  } catch (err) {
    _logger.error('handleResumeSession: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

// ---------------------------------------------------------------------------
// HTML route handlers — wuce.23 skill launcher landing
// ---------------------------------------------------------------------------

const { renderShell, escHtml }   = require('../utils/html-shell');
const skillsAdapter              = require('../adapters/skills');

// Injectable adapters for testing — default to production adapter functions.
let _listSkills    = skillsAdapter.listSkills;
let _createSession = skillsAdapter.createSession;

// Audit logger for HTML skill routes — injectable via setSkillsAuditLogger().
let _htmlAuditLogger = function(data) {
  process.stdout.write('[skills-html] audit ' + JSON.stringify(data) + '\n');
};

/**
 * Replace the listSkills adapter (for testing).
 * @param {function(string): Promise<Array<{name:string,description:string}>>} fn
 */
function setListSkills(fn) { _listSkills = fn; }

/**
 * Replace the createSession adapter (for testing).
 * @param {function(string, string): Promise<{id:string}>} fn
 */
function setCreateSession(fn) { _createSession = fn; }

/**
 * Replace the HTML audit logger (for testing).
 * @param {function(object): void} fn
 */
function setSkillsAuditLogger(fn) { _htmlAuditLogger = fn; }

/**
 * Render the skills list HTML using renderShell.
 * @param {Array<{name:string,description:string}>} skills
 * @param {object} user
 * @returns {string}
 */
function _renderSkillsList(skills, user) {
  const rows = skills.map(function(skill) {
    const safeName = escHtml(skill.name || '');
    const safeDesc = escHtml(skill.description || '');
    return [
      '<article>',
      '<h2>' + safeName + '</h2>',
      '<p>' + safeDesc + '</p>',
      '<form method="POST" action="/api/skills/' + safeName + '/sessions">',
      '<button type="submit">Start</button>',
      '</form>',
      '</article>'
    ].join('\n');
  }).join('\n');

  return renderShell({ title: 'Run a Skill', bodyContent: rows, user: user });
}

/**
 * GET /skills
 * HTML skill launcher landing page.
 * Unauthenticated → 302 /auth/github.
 * AC1, AC2, AC5, AC6 (wuce.23)
 */
async function handleGetSkillsHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  try {
    const token  = req.session.accessToken;
    const user   = { login: req.session.login || '' };
    const skills = await _listSkills(token);

    _htmlAuditLogger({
      userId:    req.session.userId,
      route:     '/skills',
      timestamp: new Date().toISOString()
    });

    const html = _renderSkillsList(skills, user);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    _logger.error('handleGetSkillsHtml: ' + err.message);
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>An error occurred loading skills.</p>',
      user:        { login: (req.session && req.session.login) || '' }
    });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

/**
 * POST /api/skills/:name/sessions (HTML form submission)
 * Creates a session via the skills adapter and redirects 303 to the session URL.
 * Unauthenticated → 302 /auth/github.
 * Adapter error → HTML error page via renderShell.
 * AC3, AC4, AC5 (wuce.23)
 */
async function handlePostSkillSessionHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  try {
    const token   = req.session.accessToken;
    const session = await _createSession(skillName, token);
    const id      = session && session.id;
    res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(id) });
    res.end();
  } catch (err) {
    _logger.error('handlePostSkillSessionHtml: ' + err.message);
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>Could not start skill session: ' + escHtml(err.message) + '</p>',
      user:        { login: (req.session && req.session.login) || '' }
    });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

// ---------------------------------------------------------------------------
// HTML route handlers — wuce.24 guided question form
// ---------------------------------------------------------------------------

// wuce.24 injectable adapters
let _getNextQuestion    = skillsAdapter.getNextQuestion;
let _submitAnswer       = skillsAdapter.submitAnswer;

// Audit logger for question route — injectable via setQuestionAuditLogger().
let _questionAuditLogger = function(data) {
  process.stdout.write('[skills-html] question-audit ' + JSON.stringify(data) + '\n');
};

/**
 * Replace the getNextQuestion adapter (for testing).
 * @param {function(string, string, string): Promise<object|null>} fn
 */
function setGetNextQuestion(fn) { _getNextQuestion = fn; }

/**
 * Replace the submitAnswer adapter (for testing).
 * @param {function(string, string, string, string): Promise<{nextUrl:string}>} fn
 */
function setSubmitAnswer(fn) { _submitAnswer = fn; }

/**
 * Replace the question audit logger (for testing).
 * @param {function(object): void} fn
 */
function setQuestionAuditLogger(fn) { _questionAuditLogger = fn; }

/**
 * Read the raw body string from a request.
 * @param {object} req
 * @returns {Promise<string>}
 */
function _readRawBody(req) {
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(chunk) { raw += String(chunk); });
    req.on('end', function() { resolve(raw); });
    req.on('error', function() { resolve(''); });
  });
}

/**
 * Parse a URL-encoded form body string into a plain object.
 * @param {string} raw
 * @returns {object}
 */
function _parseFormBody(raw) {
  const params = {};
  if (!raw) { return params; }
  raw.split('&').forEach(function(pair) {
    var eq = pair.indexOf('=');
    if (eq === -1) { return; }
    var k = pair.slice(0, eq);
    var v = pair.slice(eq + 1);
    try {
      params[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch (_) {
      params[k] = v;
    }
  });
  return params;
}

/**
 * GET /skills/:name/sessions/:id/next
 * Renders the question form for the current step of a skill session.
 * Unauthenticated → 302 /auth/github.
 * Unknown session (adapter throws 404) → 404 HTML error page via renderShell.
 * AC1–AC7 (wuce.24)
 */
async function handleGetQuestionHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  let result;
  try {
    result = await _getNextQuestion(skillName, sessionId, token);
  } catch (err) {
    const status = err.status || 500;
    const html = renderShell({
      title:       status === 404 ? 'Session not found' : 'Error',
      bodyContent: '<p>' + escHtml(err.message || 'An error occurred') + '</p>',
      user
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Terminal state — no more questions
  if (!result) {
    res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/commit-preview' });
    res.end();
    return;
  }

  _questionAuditLogger({
    userId:    req.session.userId,
    route:     '/skills/:name/sessions/:id/next',
    skillName: skillName,
    sessionId: sessionId,
    timestamp: new Date().toISOString()
  });

  const questionText = result.question || '';
  const qi           = result.questionIndex || 1;
  const tq           = result.totalQuestions || 1;

  const bodyContent = [
    '<p>Question ' + qi + ' of ' + tq + '</p>',
    '<form method="POST" action="/api/skills/' + escHtml(skillName) + '/sessions/' + escHtml(sessionId) + '/answer">',
    '<label for="answer">' + escHtml(questionText) + '</label>',
    '<textarea name="answer" id="answer"></textarea>',
    '<button type="submit">Submit answer</button>',
    '</form>'
  ].join('\n');

  const html = renderShell({ title: 'Question ' + qi + ' of ' + tq, bodyContent: bodyContent, user: user });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/skills/:name/sessions/:id/answer
 * Submits an answer and redirects 303 to the URL returned by the adapter.
 * Unauthenticated → 302 /auth/github.
 * Unknown session (adapter throws) → HTML error page via renderShell.
 * AC3, AC4, AC5 (wuce.24)
 */
async function handlePostAnswerHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  var rawBody = '';
  try { rawBody = await _readRawBody(req); } catch (_) { rawBody = ''; }
  const formBody = _parseFormBody(rawBody);
  const answer   = formBody.answer || '';

  let result;
  try {
    result = await _submitAnswer(skillName, sessionId, answer, token);
  } catch (err) {
    const status = err.status || 500;
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>' + escHtml(err.message || 'An error occurred') + '</p>',
      user
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  res.writeHead(303, { Location: result.nextUrl });
  res.end();
}

// ---------------------------------------------------------------------------
// HTML route handlers — wuce.25 session commit result
// ---------------------------------------------------------------------------

// wuce.25 injectable adapters
let _getCommitPreview = skillsAdapter.getCommitPreview;
let _commitSession    = skillsAdapter.commitSession;
let _getCommitResult  = skillsAdapter.getCommitResult;

// Audit logger for commit route — injectable via setCommitAuditLogger().
let _commitAuditLogger = function(data) {
  process.stdout.write('[skills-html] commit-audit ' + JSON.stringify(data) + '\n');
};

/**
 * Replace the getCommitPreview adapter (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setGetCommitPreview(fn) { _getCommitPreview = fn; }

/**
 * Replace the commitSession adapter (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setCommitSession(fn) { _commitSession = fn; }

/**
 * Replace the getCommitResult adapter (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setGetCommitResult(fn) { _getCommitResult = fn; }

/**
 * Replace the commit audit logger (for testing).
 * @param {function(object): void} fn
 */
function setCommitAuditLogger(fn) { _commitAuditLogger = fn; }

/**
 * GET /skills/:name/sessions/:id/commit-preview
 * Renders the artefact preview page with a commit form.
 * Unauthenticated → 302 /auth/github.
 * Unknown session (adapter throws) → HTML error page.
 * AC1, AC2, AC3 (wuce.25)
 */
async function handleGetCommitPreviewHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  let preview;
  try {
    preview = await _getCommitPreview(skillName, sessionId, token);
  } catch (err) {
    const status = err.status || 500;
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>' + escHtml(err.message || 'An error occurred') + '</p>',
      user
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  const safeContent = escHtml(preview.artefactContent || '');
  const safePath    = escHtml(preview.artefactPath    || '');

  const bodyContent = [
    '<p>Review the generated artefact below, then commit to save it.</p>',
    '<p><strong>Artefact path:</strong> ' + safePath + '</p>',
    '<pre role="region" aria-label="Artefact preview">' + safeContent + '</pre>',
    '<form method="POST" action="/api/skills/' + escHtml(skillName) + '/sessions/' + escHtml(sessionId) + '/commit">',
    '<button type="submit">Commit artefact</button>',
    '</form>'
  ].join('\n');

  const html = renderShell({ title: 'Commit preview', bodyContent: bodyContent, user: user });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/skills/:name/sessions/:id/commit
 * Commits the session artefact. Redirects 303 to the result page on success.
 * Double-commit (409) → 409 HTML page via renderShell.
 * Unauthenticated → 302 /auth/github.
 * Unknown session → HTML error page.
 * AC4, AC5, AC6, AC7 (wuce.25)
 */
async function handlePostCommitHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  let result;
  try {
    result = await _commitSession(skillName, sessionId, token);
  } catch (err) {
    const status = err.status || 500;
    const msg = (status === 409)
      ? 'This session has already been committed. The artefact has already been saved.'
      : escHtml(err.message || 'An error occurred');
    const html = renderShell({
      title:       (status === 409) ? 'Already committed' : 'Error',
      bodyContent: '<p>' + msg + '</p>',
      user
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  _commitAuditLogger({
    userId:       req.session.userId,
    route:        '/api/skills/' + skillName + '/sessions/' + sessionId + '/commit',
    skillName:    skillName,
    sessionId:    sessionId,
    artefactPath: result.artefactPath,
    timestamp:    new Date().toISOString()
  });

  res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/result' });
  res.end();
}

/**
 * GET /skills/:name/sessions/:id/result
 * Renders the commit result page with success message, artefact path, and links.
 * Unauthenticated → 302 /auth/github.
 * Unknown session (adapter throws) → HTML error page.
 * AC6 (wuce.25)
 */
async function handleGetResultHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  let result;
  try {
    result = await _getCommitResult(skillName, sessionId, token);
  } catch (err) {
    const status = err.status || 500;
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>' + escHtml(err.message || 'An error occurred') + '</p>',
      user
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  const safePath        = escHtml(result.artefactPath || '');
  const safeSlug        = escHtml(result.featureSlug  || '');
  const safeType        = escHtml(result.artefactType || '');

  const bodyContent = [
    '<p>Artefact successfully committed.</p>',
    '<p><strong>Artefact path:</strong> ' + safePath + '</p>',
    '<p><a href="/artefact/' + safeSlug + '/' + safeType + '">View artefact</a></p>',
    '<p><a href="/features">Back to features</a></p>'
  ].join('\n');

  const html = renderShell({ title: 'Commit complete', bodyContent: bodyContent, user: user });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = {
  handleGetSkills, handlePostSession, handlePostAnswer, handleGetSessionState,
  handleCommitArtefact, handleResumeSession, setLogger, NO_LICENCE_MSG,
  // wuce.23 HTML handlers
  handleGetSkillsHtml, handlePostSkillSessionHtml,
  setListSkills, setCreateSession, setSkillsAuditLogger,
  // wuce.24 HTML handlers
  handleGetQuestionHtml, handlePostAnswerHtml,
  setGetNextQuestion, setSubmitAnswer, setQuestionAuditLogger,
  // wuce.25 HTML handlers
  handleGetCommitPreviewHtml, handlePostCommitHtml, handleGetResultHtml,
  setGetCommitPreview, setCommitSession, setGetCommitResult, setCommitAuditLogger
};

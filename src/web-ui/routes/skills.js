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

const { listAvailableSkills, validateSkillName } = require('../../adapters/skill-discovery');
const { extractQuestions }  = require('../../skill-content-adapter');
const { sanitiseAnswer }    = require('../../answer-sanitiser');
const { validateLicence }   = require('../../adapters/copilot-licence');
const sessionManager        = require('../../modules/session-manager');

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
  return process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../../../..');
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
      answers:     []
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

module.exports = { handleGetSkills, handlePostSession, handlePostAnswer, setLogger };

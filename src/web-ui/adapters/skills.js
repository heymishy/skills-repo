'use strict';
/**
 * src/web-ui/adapters/skills.js — Skill listing and session creation adapter (wuce.23)
 *
 * Provides:
 *   listSkills(token)              — returns array of { name, description }
 *   createSession(skillName, token) — creates a session, returns { id }
 *
 * Implementations are injectable via setListSkills() / setCreateSession()
 * to allow test isolation without modifying this file.
 */

/** @type {function(string): Promise<Array<{name:string, description:string}>>} */
let _listSkills = async function defaultListSkills(token) {
  void token;
  return [];
};

/** @type {function(string, string): Promise<{id:string}>} */
let _createSession = async function defaultCreateSession(skillName, token) {
  void skillName;
  void token;
  return { id: '' };
};

/** @type {function(string, string, string): Promise<{question:string, questionIndex:number, totalQuestions:number}|null>} */
let _getNextQuestion = async function defaultGetNextQuestion(skillName, sessionId, token) {
  void skillName; void sessionId; void token;
  throw new Error('Adapter not wired: getNextQuestion. Call setGetNextQuestion() with a real implementation before use.');
};

/** @type {function(string, string, string, string): Promise<{nextUrl:string}>} */
let _submitAnswer = async function defaultSubmitAnswer(skillName, sessionId, answer, token) {
  void skillName; void sessionId; void answer; void token;
  throw new Error('Adapter not wired: submitAnswer. Call setSubmitAnswer() with a real implementation before use.');
};

/**
 * Replace the listSkills implementation (for testing).
 * @param {function(string): Promise<Array<{name:string,description:string}>>} fn
 */
function setListSkills(fn) {
  _listSkills = fn;
}

/**
 * Replace the createSession implementation (for testing).
 * @param {function(string, string): Promise<{id:string}>} fn
 */
function setCreateSession(fn) {
  _createSession = fn;
}

/**
 * Replace the getNextQuestion implementation (for testing).
 * @param {function(string, string, string): Promise<{question:string, questionIndex:number, totalQuestions:number}|null>} fn
 */
function setGetNextQuestion(fn) {
  _getNextQuestion = fn;
}

/**
 * Replace the submitAnswer implementation (for testing).
 * @param {function(string, string, string, string): Promise<{nextUrl:string}>} fn
 */
function setSubmitAnswer(fn) {
  _submitAnswer = fn;
}

/**
 * List available skills for the authenticated user.
 * @param {string} token — GitHub access token
 * @returns {Promise<Array<{name:string, description:string}>>}
 */
async function listSkills(token) {
  return _listSkills(token);
}

/**
 * Create a new skill session.
 * @param {string} skillName
 * @param {string} token — GitHub access token
 * @returns {Promise<{id:string}>}
 */
async function createSession(skillName, token) {
  return _createSession(skillName, token);
}

/**
 * Get the next question for a skill session.
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} token — GitHub access token
 * @returns {Promise<{question:string, questionIndex:number, totalQuestions:number}|null>}
 */
async function getNextQuestion(skillName, sessionId, token) {
  return _getNextQuestion(skillName, sessionId, token);
}

/**
 * Submit an answer for the current question in a skill session.
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} answer
 * @param {string} token — GitHub access token
 * @returns {Promise<{nextUrl:string}>}
 */
async function submitAnswer(skillName, sessionId, answer, token) {
  return _submitAnswer(skillName, sessionId, answer, token);
}

/** @type {function(string, string, string): Promise<{artefactContent:string, artefactPath:string, featureSlug:string, artefactType:string}>} */
let _getCommitPreview = async function defaultGetCommitPreview(skillName, sessionId, token) {
  void skillName; void sessionId; void token;
  throw new Error('Adapter not wired: getCommitPreview. Call setGetCommitPreview() with a real implementation before use.');
};

/** @type {function(string, string, string): Promise<{artefactPath:string, featureSlug:string, artefactType:string}>} */
let _commitSession = async function defaultCommitSession(skillName, sessionId, token) {
  void skillName; void sessionId; void token;
  throw new Error('Adapter not wired: commitSession. Call setCommitSession() with a real implementation before use.');
};

/** @type {function(string, string, string): Promise<{artefactPath:string, featureSlug:string, artefactType:string}>} */
let _getCommitResult = async function defaultGetCommitResult(skillName, sessionId, token) {
  void skillName; void sessionId; void token;
  throw new Error('Adapter not wired: getCommitResult. Call setGetCommitResult() with a real implementation before use.');
};

/**
 * Replace the getCommitPreview implementation (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setGetCommitPreview(fn) { _getCommitPreview = fn; }

/**
 * Replace the commitSession implementation (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setCommitSession(fn) { _commitSession = fn; }

/**
 * Replace the getCommitResult implementation (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setGetCommitResult(fn) { _getCommitResult = fn; }

/**
 * Get the commit preview for a skill session (artefact content + metadata).
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} token — GitHub access token
 * @returns {Promise<{artefactContent:string, artefactPath:string, featureSlug:string, artefactType:string}>}
 */
async function getCommitPreview(skillName, sessionId, token) {
  return _getCommitPreview(skillName, sessionId, token);
}

/**
 * Commit the completed skill session artefact.
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} token — GitHub access token
 * @returns {Promise<{artefactPath:string, featureSlug:string, artefactType:string}>}
 */
async function commitSession(skillName, sessionId, token) {
  return _commitSession(skillName, sessionId, token);
}

/**
 * Get the result of a committed skill session.
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} token — GitHub access token
 * @returns {Promise<{artefactPath:string, featureSlug:string, artefactType:string}>}
 */
async function getCommitResult(skillName, sessionId, token) {
  return _getCommitResult(skillName, sessionId, token);
}

/** @type {function(string, Array, string, string): Promise<string>} */
let _skillTurnExecutor = function defaultSkillTurnExecutor() {
  throw new Error('Adapter not wired: skillTurnExecutor. Call setSkillTurnExecutor() with a real implementation before use.');
};

/**
 * Replace the skillTurnExecutor implementation (for testing or production wiring).
 * @param {function(string, Array, string, string): Promise<string>} fn
 */
function setSkillTurnExecutor(fn) { _skillTurnExecutor = fn; }

// dsq.1 — injectable next-question executor adapter
/** @type {function(string, Array, string, string): Promise<string|null>} */
let _nextQuestionExecutor = function defaultNextQuestionExecutor() {
  throw new Error('Adapter not wired: _nextQuestionExecutor. Call setNextQuestionExecutorAdapter() with a real implementation before use.');
};

/**
 * Replace the nextQuestionExecutor implementation (for testing or production wiring).
 * @param {function(string, Array, string, string): Promise<string|null>} fn
 */
function setNextQuestionExecutor(fn) { _nextQuestionExecutor = fn; }

/**
 * Generate a dynamic next question for a skill session.
 * @param {string} systemPrompt
 * @param {Array}  history
 * @param {string} instruction
 * @param {string} token — GitHub access token
 * @returns {Promise<string|null>} generated next question or null
 */
function nextQuestionExecutor(systemPrompt, history, instruction, token) {
  return _nextQuestionExecutor(systemPrompt, history, instruction, token);
}

// dsq.2 — injectable section-draft executor adapter
/** @type {function(string, Array, string, string): Promise<string|null>} */
let _sectionDraftExecutor = function defaultSectionDraftExecutor() {
  throw new Error('Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.');
};

/**
 * Replace the sectionDraftExecutor implementation (for testing or production wiring).
 * @param {function(string, Array, string, string): Promise<string|null>} fn
 */
function setSectionDraftExecutor(fn) { _sectionDraftExecutor = fn; }

/**
 * Synthesise a section draft from completed Q&A pairs.
 * @param {string} heading     — section heading
 * @param {Array}  qaPairs     — Q&A pairs for this section
 * @param {string} instruction — synthesis instruction
 * @param {string} token       — GitHub access token
 * @returns {Promise<string|null>} section draft or null
 */
function sectionDraftExecutor(heading, qaPairs, instruction, token) {
  return _sectionDraftExecutor(heading, qaPairs, instruction, token);
}

/**
 * Execute a skill turn: send skill content + prior Q&A + current answer to Copilot.
 * @param {string} skillContent  — full SKILL.md content as system prompt
 * @param {Array}  priorQA       — prior Q&A pairs
 * @param {string} currentAnswer — the user's current answer
 * @param {string} token         — GitHub access token
 * @returns {Promise<string>} model response text
 */
function skillTurnExecutor(skillContent, priorQA, currentAnswer, token) {
  return _skillTurnExecutor(skillContent, priorQA, currentAnswer, token);
}

module.exports = {
  listSkills, createSession, setListSkills, setCreateSession,
  getNextQuestion, submitAnswer, setGetNextQuestion, setSubmitAnswer,
  getCommitPreview, commitSession, getCommitResult,
  setGetCommitPreview, setCommitSession, setGetCommitResult,
  skillTurnExecutor, setSkillTurnExecutor,
  // dsq.1 — next-question executor
  nextQuestionExecutor, setNextQuestionExecutor,
  // dsq.2 — section-draft executor
  sectionDraftExecutor, setSectionDraftExecutor
};

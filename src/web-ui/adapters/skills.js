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
  void skillName;
  void sessionId;
  void token;
  return null;
};

/** @type {function(string, string, string, string): Promise<{nextUrl:string}>} */
let _submitAnswer = async function defaultSubmitAnswer(skillName, sessionId, answer, token) {
  void skillName;
  void sessionId;
  void answer;
  void token;
  return { nextUrl: '' };
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

module.exports = {
  listSkills, createSession, setListSkills, setCreateSession,
  getNextQuestion, submitAnswer, setGetNextQuestion, setSubmitAnswer
};

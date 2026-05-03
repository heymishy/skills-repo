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

module.exports = { listSkills, createSession, setListSkills, setCreateSession };

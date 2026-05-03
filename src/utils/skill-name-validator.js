'use strict';

const ALLOWED_SKILL_NAME = /^[a-z0-9-]+$/;
const TOKEN_PATTERN = /gh[ops]_[A-Za-z0-9_]+/;

/**
 * validateSkillName(name) -> boolean
 * Returns true only if name matches [a-z0-9-] pattern.
 */
function validateSkillName(name) {
  return ALLOWED_SKILL_NAME.test(name);
}

/**
 * containsToken(str) -> boolean
 * Returns true if string appears to contain a GitHub token.
 */
function containsToken(str) {
  return TOKEN_PATTERN.test(str);
}

module.exports = { validateSkillName, containsToken };

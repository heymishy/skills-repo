'use strict';

const ALLOWED_SKILL_NAME = /^[a-z0-9-]+$/;
const TOKEN_PATTERN = /gh[ops]_[A-Za-z0-9_]+/;

function validateSkillName(name) {
  return ALLOWED_SKILL_NAME.test(name);
}

function containsToken(str) {
  return TOKEN_PATTERN.test(str);
}

module.exports = { validateSkillName, containsToken };

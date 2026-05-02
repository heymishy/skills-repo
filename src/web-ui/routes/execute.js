'use strict';
const skillExecutor = require('../../modules/skill-executor');
const { validateSkillName } = require('../../utils/skill-name-validator');

let _logger = { info: function() {}, warn: function() {}, error: function() {} };

function setLogger(logger) { _logger = logger; }

/**
 * handleExecuteSkill — POST /api/skills/:name/execute
 */
async function handleExecuteSkill(req, res) {
  var session = req.session;
  if (!session || !session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  var skillName = req.params && req.params.name;
  if (!skillName || !validateSkillName(skillName)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid skill name' }));
    return;
  }

  var prompt  = (req.body && req.body.prompt)  || '';
  var homeDir = (req.body && req.body.homeDir) || require('os').tmpdir();
  var token   = session.accessToken;

  try {
    var result = await skillExecutor.executeSkill(skillName, prompt, token, homeDir);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    if (err.code === 'TIMEOUT') {
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Execution timed out' }));
    } else if (err.code === 'INVALID_SKILL_NAME') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid skill name' }));
    } else {
      _logger.error('execute_skill_error: ' + err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      // Do not include API keys or tokens in error response
      res.end(JSON.stringify({ error: 'Skill execution failed', exitCode: err.exitCode || null }));
    }
  }
}

module.exports = { handleExecuteSkill, setLogger };

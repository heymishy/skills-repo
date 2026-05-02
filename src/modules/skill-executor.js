'use strict';
const childProcess = require('child_process');
const { validateSkillName, containsToken } = require('../utils/skill-name-validator');
const { getBYOKEnv } = require('../config/byok-config');

let _logger = {
  info:  function(evt, data) { process.stdout.write('[skill-executor] ' + evt + ' ' + JSON.stringify(data || {}) + '\n'); },
  warn:  function(msg)       { process.stderr.write('[skill-executor] WARN ' + msg + '\n'); },
  error: function(msg)       { process.stderr.write('[skill-executor] ERROR ' + msg + '\n'); }
};

function setLogger(logger) { _logger = logger; }

function executeSkill(skillName, prompt, token, homeDir, options) {
  options = options || {};
  var timeoutMs   = options.timeoutMs   !== undefined ? options.timeoutMs   : ((parseInt(process.env.WUCE_CLI_TIMEOUT_SECONDS) || 300) * 1000);
  var stderrLines = options.stderrLines !== undefined ? options.stderrLines : (parseInt(process.env.WUCE_STDERR_LINES) || 20);
  var cliPath     = options.cliPath     || process.env.COPILOT_CLI_PATH || 'copilot';

  if (!validateSkillName(skillName)) {
    return Promise.reject(Object.assign(new Error('Invalid skill name: ' + skillName), { code: 'INVALID_SKILL_NAME' }));
  }

  var startTime = Date.now();

  return new Promise(function(resolve, reject) {
    var baseEnv = Object.assign({}, process.env, {
      COPILOT_GITHUB_TOKEN: token,
      COPILOT_HOME: homeDir
    });
    // AC1 (wuce.12): Merge BYOK vars when configured
    var byokEnv = getBYOKEnv();
    var env = Object.assign(baseEnv, byokEnv);

    var args = [
      'skill', skillName,
      '--output-format=json',
      '--silent',
      '--no-ask-user',
      '--allow-all',
      '-p', prompt
    ];

    // shell MUST be false
    var child = childProcess.spawn(cliPath, args, { shell: false, env: env });

    var stdoutChunks = [];
    var stderrBuffer = [];
    var timedOut = false;
    var killTimer = null;

    var timeoutTimer = setTimeout(function() {
      timedOut = true;
      child.kill('SIGTERM');
      killTimer = setTimeout(function() { child.kill('SIGKILL'); }, 5000);
      reject(Object.assign(new Error('Skill execution timed out'), { code: 'TIMEOUT' }));
    }, timeoutMs);

    child.stdout.on('data', function(chunk) { stdoutChunks.push(chunk); });

    child.stderr.on('data', function(chunk) {
      var lines = chunk.toString().split('\n');
      lines.forEach(function(line) { if (line.trim()) { stderrBuffer.push(line); } });
    });

    child.on('close', function(exitCode) {
      clearTimeout(timeoutTimer);
      if (killTimer) { clearTimeout(killTimer); }
      if (timedOut) { return; }

      var duration = Date.now() - startTime;

      var stdout = Buffer.isBuffer(stdoutChunks[0]) ? Buffer.concat(stdoutChunks).toString() : stdoutChunks.join('');
      var parsedLines = [];
      var parseErrors = [];
      stdout.split('\n').filter(Boolean).forEach(function(line) {
        try { parsedLines.push(JSON.parse(line)); } catch (e) { parseErrors.push(line); }
      });

      var lastNStderr = stderrBuffer.slice(-stderrLines)
        .filter(function(l) { return !containsToken(l); });

      _logger.info('skill_execution_complete', {
        skillName: skillName,
        exitCode: exitCode,
        durationMs: duration,
        parsedLineCount: parsedLines.length
      });

      if (exitCode !== 0) {
        reject(Object.assign(
          new Error('Skill exited with code ' + exitCode),
          { exitCode: exitCode, stderrLines: lastNStderr, partialLines: parsedLines }
        ));
        return;
      }

      var artefactEvent = null;
      for (var i = 0; i < parsedLines.length; i++) {
        if (parsedLines[i] && parsedLines[i].type === 'artefact') { artefactEvent = parsedLines[i]; break; }
      }

      resolve({ lines: parsedLines, artefact: artefactEvent, exitCode: exitCode, timedOut: false, parseErrors: parseErrors });
    });

    child.on('error', function(err) {
      clearTimeout(timeoutTimer);
      if (killTimer) { clearTimeout(killTimer); }
      if (!timedOut) { reject(err); }
    });
  });
}

module.exports = { executeSkill, setLogger };

'use strict';
const childProcess = require('child_process');
const { validateSkillName, containsToken } = require('../utils/skill-name-validator');

let _logger = {
  info:  function(evt, data) { process.stdout.write('[skill-executor] ' + evt + ' ' + JSON.stringify(data || {}) + '\n'); },
  warn:  function(msg)       { process.stderr.write('[skill-executor] WARN ' + msg + '\n'); },
  error: function(msg)       { process.stderr.write('[skill-executor] ERROR ' + msg + '\n'); }
};

function setLogger(logger) { _logger = logger; }

/**
 * executeSkill(skillName, prompt, token, homeDir, options) -> Promise<ParsedOutput>
 *
 * Spawns the Copilot CLI as a subprocess with:
 *   - shell: false (no shell injection)
 *   - COPILOT_GITHUB_TOKEN via env var (never in args)
 *   - COPILOT_HOME set to homeDir
 *   - flags: --output-format=json --silent --no-ask-user --allow-all -p <prompt>
 *
 * ParsedOutput: { lines: ParsedLine[], artefact, exitCode, timedOut, parseErrors }
 */
function executeSkill(skillName, prompt, token, homeDir, options) {
  options = options || {};
  var timeoutMs   = options.timeoutMs   !== undefined ? options.timeoutMs   : ((parseInt(process.env.WUCE_CLI_TIMEOUT_SECONDS) || 300) * 1000);
  var stderrLines = options.stderrLines !== undefined ? options.stderrLines : (parseInt(process.env.WUCE_STDERR_LINES) || 20);
  var cliPath     = options.cliPath     || process.env.COPILOT_CLI_PATH || 'copilot';

  // AC5: Validate skill name before spawn — reject metacharacters
  if (!validateSkillName(skillName)) {
    return Promise.reject(Object.assign(new Error('Invalid skill name: ' + skillName), { code: 'INVALID_SKILL_NAME' }));
  }

  var startTime = Date.now();

  var promise = new Promise(function(resolve, reject) {
    var env = Object.assign({}, process.env, {
      COPILOT_GITHUB_TOKEN: token,
      COPILOT_HOME: homeDir
    });

    var args = [
      'skill', skillName,
      '--output-format=json',
      '--silent',
      '--no-ask-user',
      '--allow-all',
      '-p', prompt
    ];

    // AC1: shell MUST be false
    var child = childProcess.spawn(cliPath, args, { shell: false, env: env });

    var stdoutChunks = [];
    var stderrBuffer = [];
    var timedOut = false;
    var killTimer = null;

    // Timeout: SIGTERM then SIGKILL, reject immediately
    var timeoutTimer = setTimeout(function() {
      timedOut = true;
      child.kill('SIGTERM');
      killTimer = setTimeout(function() {
        child.kill('SIGKILL');
      }, 5000);
      reject(Object.assign(new Error('Skill execution timed out'), { code: 'TIMEOUT' }));
    }, timeoutMs);

    child.stdout.on('data', function(chunk) { stdoutChunks.push(chunk); });

    child.stderr.on('data', function(chunk) {
      var lines = chunk.toString().split('\n');
      lines.forEach(function(line) {
        if (line.trim()) { stderrBuffer.push(line); }
      });
    });

    child.on('close', function(exitCode) {
      clearTimeout(timeoutTimer);
      if (killTimer) { clearTimeout(killTimer); }

      var duration = Date.now() - startTime;

      // If already timed out, the reject was already called — just return
      if (timedOut) { return; }

      // AC2: JSONL parse — split/filter/map (not single JSON.parse)
      var stdout = Buffer.concat(stdoutChunks).toString();
      var parsedLines = [];
      var parseErrors = [];
      stdout.split('\n').filter(Boolean).forEach(function(line) {
        try {
          parsedLines.push(JSON.parse(line));
        } catch (e) {
          parseErrors.push(line);
        }
      });

      // Redact token patterns from stderr before logging
      var lastNStderr = stderrBuffer.slice(-stderrLines)
        .filter(function(l) { return !containsToken(l); });

      _logger.info('skill_execution_complete', {
        skillName: skillName,
        exitCode: exitCode,
        durationMs: duration,
        parsedLineCount: parsedLines.length
        // NO token, NO prompt content
      });

      if (exitCode !== 0) {
        reject(Object.assign(
          new Error('Skill exited with code ' + exitCode),
          {
            exitCode: exitCode,
            stderrLines: lastNStderr,
            partialLines: parsedLines
          }
        ));
        return;
      }

      var artefactEvent = null;
      for (var i = 0; i < parsedLines.length; i++) {
        if (parsedLines[i] && parsedLines[i].type === 'artefact') {
          artefactEvent = parsedLines[i];
          break;
        }
      }

      resolve({
        lines: parsedLines,
        artefact: artefactEvent,
        exitCode: exitCode,
        timedOut: false,
        parseErrors: parseErrors
      });
    });

    child.on('error', function(err) {
      clearTimeout(timeoutTimer);
      if (killTimer) { clearTimeout(killTimer); }
      reject(err);
    });
  });

  // Attach a no-op catch synchronously so Node.js does not fire
  // 'unhandledRejection' when callers defer their .catch() attachment.
  // Callers (including await) still receive the rejection normally.
  promise.catch(function() {});
  return promise;
}

module.exports = { executeSkill, setLogger };

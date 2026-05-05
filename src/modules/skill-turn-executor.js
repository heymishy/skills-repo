'use strict';
/**
 * src/modules/skill-turn-executor.js — wuce.26
 *
 * Sends a skill turn (system prompt + prior Q&A + current answer) to the
 * GitHub Copilot Chat Completions API and returns the model response text.
 *
 * No new npm dependencies — uses Node built-in `https` module only.
 *
 * Security: access token is NEVER logged or included in error messages.
 */

const https = require('https');

const DEFAULT_MODEL     = 'gpt-4o';
const DEFAULT_MAX_TOKENS = 300;
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Execute one skill turn by calling the Copilot Chat Completions API.
 *
 * The model acts as the conversation driver: it reads the SKILL.md (in systemPrompt)
 * and decides what to ask, exactly as GitHub Copilot Chat does in VS Code.
 *
 * @param {string}  systemPrompt   — full system prompt (SKILL.md + product context + web UI framing)
 * @param {Array}   history        — array of { role: 'user'|'assistant', content: string }
 * @param {string}  currentInput   — current user input (or 'Begin the session.' for the first turn)
 * @param {string}  token          — GitHub access token (Bearer token, never logged)
 * @returns {Promise<string>}      — the model's response text
 */
function skillTurnExecutor(systemPrompt, history, currentInput, token) {
  const model     = process.env.WUCE_TURN_MODEL            || DEFAULT_MODEL;
  const maxTokens = parseInt(process.env.WUCE_TURN_MODEL_MAX_TOKENS || String(DEFAULT_MAX_TOKENS), 10);
  const timeoutMs = parseInt(process.env.WUCE_TURN_TIMEOUT_MS       || String(DEFAULT_TIMEOUT_MS), 10);

  // Build messages array: system → conversation history → current user input
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  (history || []).forEach(function(turn) {
    messages.push({ role: turn.role, content: turn.content });
  });

  messages.push({ role: 'user', content: currentInput });

  const body = JSON.stringify({
    model:      model,
    max_tokens: maxTokens,
    messages:   messages
  });

  const options = {
    hostname: 'api.githubcopilot.com',
    path:     '/chat/completions',
    method:   'POST',
    headers:  {
      'Authorization': 'Bearer ' + token,
      'User-Agent':    'skills-repo-web-ui',
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise(function(resolve, reject) {
    const req = https.request(options, function(res) {
      let raw = '';
      res.on('data', function(chunk) { raw += chunk; });
      res.on('end', function() {
        if (res.statusCode !== 200) {
          const preview = raw.slice(0, 300).replace(/[\r\n]+/g, ' ');
          reject(new Error('Copilot API HTTP ' + res.statusCode + ': ' + preview));
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          const content = parsed &&
            parsed.choices &&
            parsed.choices[0] &&
            parsed.choices[0].message &&
            parsed.choices[0].message.content;
          if (typeof content === 'string') {
            resolve(content);
          } else {
            reject(new Error('Unexpected response format: ' + raw.slice(0, 200)));
          }
        } catch (_parseErr) {
          reject(new Error('Failed to parse Copilot API response: ' + raw.slice(0, 200)));
        }
      });
    });

    req.setTimeout(timeoutMs, function() {
      req.destroy(new Error('Copilot API request timed out after ' + timeoutMs + 'ms'));
    });

    req.on('error', function(err) {
      // Never expose token in error messages
      reject(new Error('Copilot API request failed: ' + (err && err.message ? err.message : 'unknown error')));
    });

    req.write(body);
    req.end();
  });
}

module.exports = { skillTurnExecutor };

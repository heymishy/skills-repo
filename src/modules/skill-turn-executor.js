'use strict';
/**
 * src/modules/skill-turn-executor.js — wuce.26
 *
 * Sends a skill turn (system prompt + prior Q&A + current answer) to a model
 * provider and returns the response text.
 *
 * Two providers supported — selected via SKILL_EXECUTOR_PROVIDER env var:
 *   copilot   (default) — GitHub Copilot Chat Completions API (OpenAI-compatible)
 *   anthropic           — Anthropic Messages API (direct, BYOK)
 *
 * No new npm dependencies — uses Node built-in `https` module only.
 *
 * Security: access tokens and API keys are NEVER logged or included in error messages.
 */

const https = require('https');

const DEFAULT_MODEL      = 'gpt-4o';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4.6';
const DEFAULT_MAX_TOKENS = 16384;
const DEFAULT_TIMEOUT_MS = 30000;
const ANTHROPIC_VERSION  = '2023-06-01';

/**
 * Call the Anthropic Messages API directly (BYOK path).
 * Uses ANTHROPIC_API_KEY and WUCE_TURN_MODEL (or DEFAULT_ANTHROPIC_MODEL).
 * Anthropic request format differs from OpenAI: system is a top-level field,
 * messages must not include a system role, and auth uses x-api-key.
 */
function _callAnthropic(systemPrompt, history, currentInput, maxTokens, timeoutMs) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('ANTHROPIC_API_KEY is not set. Set it in .env to use the anthropic provider.'));
  }

  const model = process.env.WUCE_TURN_MODEL || DEFAULT_ANTHROPIC_MODEL;

  const messages = [];
  (history || []).forEach(function(turn) {
    messages.push({ role: turn.role, content: turn.content });
  });
  messages.push({ role: 'user', content: currentInput });

  const anthropicBody = {
    model:      model,
    max_tokens: maxTokens,
    system:     systemPrompt,
    messages:   messages
  };

  if (process.env.WUCE_ENABLE_THINKING === '1') {
    const budget = parseInt(process.env.WUCE_THINKING_BUDGET_TOKENS || '10000', 10);
    anthropicBody.thinking = { type: 'enabled', budget_tokens: Math.min(budget, maxTokens - 1) };
  }

  const body = JSON.stringify(anthropicBody);

  const options = {
    hostname: 'api.anthropic.com',
    path:     '/v1/messages',
    method:   'POST',
    headers:  {
      'x-api-key':         apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'Content-Type':      'application/json',
      'Content-Length':    Buffer.byteLength(body)
    }
  };

  return new Promise(function(resolve, reject) {
    const req = https.request(options, function(res) {
      let raw = '';
      res.on('data', function(chunk) { raw += chunk; });
      res.on('end', function() {
        if (res.statusCode !== 200) {
          const preview = raw.slice(0, 300).replace(/[\r\n]+/g, ' ');
          reject(new Error('Anthropic API HTTP ' + res.statusCode + ': ' + preview));
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          // Anthropic response: { content: [{ type: 'text', text: '...' }] }
          const content = parsed &&
            parsed.content &&
            parsed.content[0] &&
            parsed.content[0].text;
          if (typeof content === 'string') {
            resolve(content);
          } else {
            reject(new Error('Unexpected Anthropic response format: ' + raw.slice(0, 200)));
          }
        } catch (_parseErr) {
          reject(new Error('Failed to parse Anthropic API response: ' + raw.slice(0, 200)));
        }
      });
    });

    req.setTimeout(timeoutMs, function() {
      req.destroy(new Error('Anthropic API request timed out after ' + timeoutMs + 'ms'));
    });

    req.on('error', function(err) {
      reject(new Error('Anthropic API request failed: ' + (err && err.message ? err.message : 'unknown error')));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Streaming variant of _callCopilot.
 * Sends stream:true, parses OpenAI-compatible SSE chunks, calls onChunk(text) for each delta.
 * Resolves with the full concatenated text when [DONE] is received.
 */
function _callCopilotStream(systemPrompt, history, currentInput, token, onChunk, maxTokens, timeoutMs, onThinkingChunk) {
  const authToken = process.env.GITHUB_TOKEN || token;
  if (!authToken) {
    return Promise.reject(new Error(
      'No auth token available. Either log in via GitHub OAuth or set GITHUB_TOKEN in .env '
      + '(run: gh auth token)'
    ));
  }

  const model = process.env.WUCE_TURN_MODEL || DEFAULT_MODEL;

  const messages = [{ role: 'system', content: systemPrompt }];
  (history || []).forEach(function(turn) {
    messages.push({ role: turn.role, content: turn.content });
  });
  messages.push({ role: 'user', content: currentInput });

  const requestBody = {
    model:      model,
    max_tokens: maxTokens,
    messages:   messages,
    stream:     true
  };

  // WUCE_ENABLE_THINKING=1 — request extended thinking tokens.
  // budget_tokens must be < max_tokens; defaults to 10000.
  // Whether the Copilot proxy forwards this to Anthropic is untested — if not
  // supported you'll see an API error in the logs. Switch to direct Anthropic
  // API (SKILL_EXECUTOR_PROVIDER=anthropic) for guaranteed support.
  if (process.env.WUCE_ENABLE_THINKING === '1') {
    const budget = parseInt(process.env.WUCE_THINKING_BUDGET_TOKENS || '10000', 10);
    requestBody.thinking = { type: 'enabled', budget_tokens: Math.min(budget, maxTokens - 1) };
  }

  const body = JSON.stringify(requestBody);

  const options = {
    hostname: 'api.githubcopilot.com',
    path:     '/chat/completions',
    method:   'POST',
    headers:  {
      'Authorization':          'Bearer ' + authToken,
      'User-Agent':             'skills-repo-web-ui',
      'Copilot-Integration-Id': 'vscode-chat',
      'Content-Type':           'application/json',
      'Content-Length':         Buffer.byteLength(body)
    }
  };

  return new Promise(function(resolve, reject) {
    const req = https.request(options, function(res) {
      if (res.statusCode !== 200) {
        let errRaw = '';
        res.on('data', function(c) { errRaw += c; });
        res.on('end', function() {
          reject(new Error('Copilot API HTTP ' + res.statusCode + ': ' + errRaw.slice(0, 300).replace(/[\r\n]+/g, ' ')));
        });
        return;
      }

      let fullText       = '';
      let buffer         = '';
      let _thinkingCount = 0; // counts extended-thinking chunks (reasoning_content/thinking)

      // Idle-stream watchdog: if no chunk arrives for STREAM_IDLE_MS after the response
      // headers land, abort. This catches stalled streams that never error or close.
      const STREAM_IDLE_MS = parseInt(process.env.WUCE_STREAM_IDLE_MS || '60000', 10);
      let _idleTimer = setTimeout(function() {
        res.destroy(new Error('Copilot API stream idle for ' + STREAM_IDLE_MS + 'ms — aborting'));
      }, STREAM_IDLE_MS);

      res.on('data', function(chunk) {
        // Reset idle watchdog on every incoming chunk
        clearTimeout(_idleTimer);
        _idleTimer = setTimeout(function() {
          res.destroy(new Error('Copilot API stream idle for ' + STREAM_IDLE_MS + 'ms — aborting'));
        }, STREAM_IDLE_MS);

        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // last line may be incomplete
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const parsed  = JSON.parse(payload);
            const delta   = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].delta;
            const content = delta && typeof delta.content === 'string' ? delta.content : '';
            // Detect extended-thinking tokens (Claude via Copilot proxy uses reasoning_content;
            // o1/o3 models use reasoning_content too; some proxies use a 'thinking' field).
            if (delta && !content && (delta.reasoning_content || delta.thinking)) {
              _thinkingCount++;
              const thinkingText = delta.reasoning_content || delta.thinking || '';
              if (thinkingText && typeof onThinkingChunk === 'function') { onThinkingChunk(thinkingText); }
            }
            if (content) {
              fullText += content;
              if (typeof onChunk === 'function') { onChunk(content); }
            }
          } catch (_) { /* skip malformed SSE line */ }
        }
      });

      res.on('end', function() {
        clearTimeout(_idleTimer);
        if (!fullText && _thinkingCount > 0) {
          process.stderr.write('[skill-turn-executor] WARNING: stream produced ' + _thinkingCount
            + ' thinking chunk(s) but zero content chunks — model may be using extended thinking '
            + 'with output in a non-standard field. Check delta structure.\n');
        }
        resolve(fullText);
      });

      res.on('error', function(err) {
        clearTimeout(_idleTimer);
        reject(new Error('Copilot API stream failed: ' + (err && err.message ? err.message : 'unknown error')));
      });
    });

    req.setTimeout(timeoutMs, function() {
      req.destroy(new Error('Copilot API stream timed out after ' + timeoutMs + 'ms'));
    });

    req.on('error', function(err) {
      reject(new Error('Copilot API stream failed: ' + (err && err.message ? err.message : 'unknown error')));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Call the GitHub Copilot Chat Completions API (OpenAI-compatible path).
 *
 * Token resolution order:
 *   1. session token passed from the OAuth flow (standard user auth)
 *   2. GITHUB_TOKEN env var — the GitHub CLI token (`gh auth token`), which carries
 *      the copilot scope and can access Claude models via the Copilot proxy
 * GITHUB_TOKEN is a server-side fallback for local dev; it is never sent to the client.
 */
function _callCopilot(systemPrompt, history, currentInput, token, maxTokens, timeoutMs) {
  // GITHUB_TOKEN (gh auth token) has the copilot scope and can access all models.
  // The OAuth session token (req.session.accessToken) only has repo+read:user scope
  // and cannot access Claude models. Prefer GITHUB_TOKEN when set.
  const authToken = process.env.GITHUB_TOKEN || token;
  if (!authToken) {
    return Promise.reject(new Error(
      'No auth token available. Either log in via GitHub OAuth or set GITHUB_TOKEN in .env '
      + '(run: gh auth token)'
    ));
  }

  const model = process.env.WUCE_TURN_MODEL || DEFAULT_MODEL;

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
      'Authorization':          'Bearer ' + authToken,
      'User-Agent':             'skills-repo-web-ui',
      'Copilot-Integration-Id': 'vscode-chat',
      'Content-Type':           'application/json',
      'Content-Length':         Buffer.byteLength(body)
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

/**
 * Execute one skill turn.
 *
 * Routes to Anthropic or Copilot based on SKILL_EXECUTOR_PROVIDER env var.
 *   SKILL_EXECUTOR_PROVIDER=anthropic  → Anthropic Messages API (requires ANTHROPIC_API_KEY)
 *   SKILL_EXECUTOR_PROVIDER=copilot    → Copilot Chat Completions API (default, requires GitHub token)
 *
 * @param {string}  systemPrompt   — full system prompt (SKILL.md + product context + web UI framing)
 * @param {Array}   history        — array of { role: 'user'|'assistant', content: string }
 * @param {string}  currentInput   — current user input (or 'Begin the session.' for the first turn)
 * @param {string}  token          — GitHub access token (only used for copilot provider)
 * @returns {Promise<string>}      — the model's response text
 */
function skillTurnExecutor(systemPrompt, history, currentInput, token) {
  const provider  = (process.env.SKILL_EXECUTOR_PROVIDER || 'copilot').toLowerCase();
  const maxTokens = parseInt(process.env.WUCE_TURN_MODEL_MAX_TOKENS || String(DEFAULT_MAX_TOKENS), 10);
  const timeoutMs = parseInt(process.env.WUCE_TURN_TIMEOUT_MS       || String(DEFAULT_TIMEOUT_MS), 10);

  if (provider === 'anthropic') {
    return _callAnthropic(systemPrompt, history, currentInput, maxTokens, timeoutMs);
  }

  return _callCopilot(systemPrompt, history, currentInput, token, maxTokens, timeoutMs);
}

/**
 * Streaming skill turn — calls onChunk(text) for each token as it arrives.
 * Only the copilot provider supports streaming; anthropic falls back to non-streaming.
 * @param {string}   systemPrompt
 * @param {Array}    history
 * @param {string}   currentInput
 * @param {string}   token
 * @param {function} onChunk — called with each text delta
 * @returns {Promise<string>} full response text
 */
function skillTurnExecutorStream(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk) {
  const provider  = (process.env.SKILL_EXECUTOR_PROVIDER || 'copilot').toLowerCase();
  const maxTokens = parseInt(process.env.WUCE_TURN_MODEL_MAX_TOKENS || String(DEFAULT_MAX_TOKENS), 10);
  const timeoutMs = parseInt(process.env.WUCE_TURN_TIMEOUT_MS       || String(DEFAULT_TIMEOUT_MS), 10);

  if (provider === 'anthropic') {
    // Anthropic streaming not yet implemented — fall back to non-streaming and call onChunk once
    return _callAnthropic(systemPrompt, history, currentInput, maxTokens, timeoutMs)
      .then(function(text) { if (typeof onChunk === 'function') { onChunk(text); } return text; });
  }

  return _callCopilotStream(systemPrompt, history, currentInput, token, onChunk, maxTokens, timeoutMs, onThinkingChunk);
}

/**
 * Returns the model ID that will be used for the next turn, based on env config.
 * @returns {string}
 */
function getActiveModel() {
  const provider = (process.env.SKILL_EXECUTOR_PROVIDER || 'copilot').toLowerCase();
  if (provider === 'anthropic') {
    return process.env.WUCE_TURN_MODEL || DEFAULT_ANTHROPIC_MODEL;
  }
  return process.env.WUCE_TURN_MODEL || DEFAULT_MODEL;
}

module.exports = { skillTurnExecutor, skillTurnExecutorStream, getActiveModel };

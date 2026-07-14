'use strict';
/**
 * src/modules/skill-turn-executor.js — wuce.26
 *
 * Sends a skill turn (system prompt + prior Q&A + current answer) to a model
 * provider and returns the response text.
 *
 * Two providers supported — selected via SKILL_EXECUTOR_PROVIDER env var:
 *   anthropic (default) — Anthropic Messages API (direct, BYOK)
 *   copilot             — GitHub Copilot Chat Completions API (OpenAI-compatible)
 *
 * No new npm dependencies — uses Node built-in `https` module only.
 *
 * Security: access tokens and API keys are NEVER logged or included in error messages.
 */

const https = require('https');
const { buildCacheKey } = require('../web-ui/adapters/cache-key');
// bri-s3.1: D37 mock-LLM-gateway adapter, wired alongside the real providers below.
// Only takes effect when a caller explicitly passes a `stage` (via `meta`/`options`)
// AND mockLlmGateway.isMockGatewayEnabled() is true — see functions below.
const mockLlmGateway = require('../web-ui/modules/mock-llm-gateway');

// Keep-alive agents — reuse TLS connections across turns instead of re-handshaking
// each time. One agent per upstream host; maxSockets prevents runaway connections.
const _anthropicAgent = new https.Agent({ keepAlive: true, maxSockets: 4 });
const _copilotAgent   = new https.Agent({ keepAlive: true, maxSockets: 4 });

const DEFAULT_MODEL      = 'gpt-4o';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4.6';
const DEFAULT_MAX_TOKENS = 16384;
const DEFAULT_TIMEOUT_MS = 90000;
const ANTHROPIC_VERSION  = '2023-06-01';

/**
 * Call the Anthropic Messages API directly (BYOK path).
 * Uses ANTHROPIC_API_KEY and WUCE_TURN_MODEL (or DEFAULT_ANTHROPIC_MODEL).
 * Anthropic request format differs from OpenAI: system is a top-level field,
 * messages must not include a system role, and auth uses x-api-key.
 */
/**
 * Build the system prompt payload for Anthropic API calls.
 * When WUCE_ENABLE_PROMPT_CACHE !== '0' (default: enabled), wraps the system
 * prompt in a content-block array with cache_control so Anthropic caches the
 * full prompt across turns in the same session (TTL: 5 min, refreshed on hit).
 * Requires anthropic-beta: prompt-caching-2024-07-31 header — added below.
 */
function _anthropicSystem(systemPrompt, session) {
  if (process.env.WUCE_ENABLE_PROMPT_CACHE === '0') { return systemPrompt; }
  var scopedPrompt = systemPrompt;
  if (session && session.tenantId) {
    scopedPrompt = '<!-- cache-scope: ' + buildCacheKey(session) + ' -->\n' + systemPrompt;
  }
  return [{ type: 'text', text: scopedPrompt, cache_control: { type: 'ephemeral' } }];
}

/**
 * Returns extra headers required for Anthropic API calls.
 * Includes the prompt-caching beta header when caching is enabled.
 */
function _anthropicExtraHeaders() {
  if (process.env.WUCE_ENABLE_PROMPT_CACHE === '0') { return {}; }
  return { 'anthropic-beta': 'prompt-caching-2024-07-31' };
}

// s6.1: session is optional — { tenantId, sessionId } — threaded through from
// skillTurnExecutor()'s meta param so _anthropicSystem() can scope the prompt-cache
// comment per Decision 8. Omitted by any caller that doesn't pass tenantId/sessionId
// in meta — behaviour is then identical to pre-s6.1 (no cache-scope line).
function _callAnthropic(systemPrompt, history, currentInput, maxTokens, timeoutMs, session) {
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
    system:     _anthropicSystem(systemPrompt, session),
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
    agent:    _anthropicAgent,
    headers:  Object.assign({
      'x-api-key':         apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'Content-Type':      'application/json',
      'Content-Length':    Buffer.byteLength(body)
    }, _anthropicExtraHeaders())
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
          // Anthropic response: { content: [{ type: 'text', text: '...' }], usage: {...} }
          const content = parsed &&
            parsed.content &&
            parsed.content[0] &&
            parsed.content[0].text;
          if (typeof content === 'string') {
            resolve({
              text: content,
              usage: {
                input_tokens:          (parsed.usage && parsed.usage.input_tokens)                  || 0,
                output_tokens:         (parsed.usage && parsed.usage.output_tokens)                 || 0,
                cache_read_tokens:     (parsed.usage && parsed.usage.cache_read_input_tokens)       || 0,
                cache_creation_tokens: (parsed.usage && parsed.usage.cache_creation_input_tokens)   || 0,
                model:                 model
              }
            });
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
 * Streaming variant of _callAnthropic.
 * Parses Anthropic SSE format (content_block_delta events), calls onChunk for text deltas
 * and onThinkingChunk for thinking_delta blocks. onFirstChunk fires once with ttfb_ms.
 *
 * s6.1: session ({ tenantId, sessionId }) is an optional trailing param, threaded through
 * from skillTurnExecutorStream()'s options param — see _callAnthropic() for the same pattern.
 */
function _callAnthropicStream(systemPrompt, history, currentInput, maxTokens, timeoutMs, onChunk, onThinkingChunk, onFirstChunk, noThinking, modelOverride, session) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('ANTHROPIC_API_KEY is not set. Set it in .env to use the anthropic provider.'));
  }

  const model = modelOverride || process.env.WUCE_TURN_MODEL || DEFAULT_ANTHROPIC_MODEL;

  const messages = [];
  (history || []).forEach(function(turn) {
    messages.push({ role: turn.role, content: turn.content });
  });
  messages.push({ role: 'user', content: currentInput });

  const anthropicBody = {
    model:      model,
    max_tokens: maxTokens,
    system:     _anthropicSystem(systemPrompt, session),
    messages:   messages,
    stream:     true
  };

  if (process.env.WUCE_ENABLE_THINKING === '1' && !noThinking) {
    const budget = parseInt(process.env.WUCE_THINKING_BUDGET_TOKENS || '10000', 10);
    anthropicBody.thinking = { type: 'enabled', budget_tokens: Math.min(budget, maxTokens - 1) };
  }

  const body = JSON.stringify(anthropicBody);

  const options = {
    hostname: 'api.anthropic.com',
    path:     '/v1/messages',
    method:   'POST',
    agent:    _anthropicAgent,
    headers:  Object.assign({
      'x-api-key':         apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'Content-Type':      'application/json',
      'Content-Length':    Buffer.byteLength(body)
    }, _anthropicExtraHeaders())
  };

  return new Promise(function(resolve, reject) {
    const _start = Date.now();
    let _ttfbFired = false;

    const req = https.request(options, function(res) {
      if (res.statusCode !== 200) {
        let errRaw = '';
        res.on('data', function(c) { errRaw += c; });
        res.on('end', function() {
          reject(new Error('Anthropic API HTTP ' + res.statusCode + ': ' + errRaw.slice(0, 300).replace(/[\r\n]+/g, ' ')));
        });
        return;
      }

      let fullText = '';
      let buffer   = '';
      let _usage   = { input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_creation_tokens: 0 };

      const STREAM_IDLE_MS = parseInt(process.env.WUCE_STREAM_IDLE_MS || '60000', 10);
      let _idleTimer = setTimeout(function() {
        res.destroy(new Error('Anthropic API stream idle for ' + STREAM_IDLE_MS + 'ms — aborting'));
      }, STREAM_IDLE_MS);

      res.on('data', function(chunk) {
        clearTimeout(_idleTimer);
        _idleTimer = setTimeout(function() {
          res.destroy(new Error('Anthropic API stream idle for ' + STREAM_IDLE_MS + 'ms — aborting'));
        }, STREAM_IDLE_MS);

        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          try {
            const parsed = JSON.parse(payload);
            // Capture input tokens + prompt-cache hit/miss from the first SSE event
            if (parsed.type === 'message_start' && parsed.message && parsed.message.usage) {
              var mu = parsed.message.usage;
              _usage.input_tokens          = mu.input_tokens || 0;
              _usage.cache_read_tokens     = mu.cache_read_input_tokens || 0;
              _usage.cache_creation_tokens = mu.cache_creation_input_tokens || 0;
              continue;
            }
            // Capture output tokens from the final usage event
            if (parsed.type === 'message_delta' && parsed.usage) {
              _usage.output_tokens = parsed.usage.output_tokens || 0;
              continue;
            }
            if (parsed.type !== 'content_block_delta') continue;
            const delta = parsed.delta;
            if (!delta) continue;
            if (delta.type === 'text_delta' && typeof delta.text === 'string') {
              if (!_ttfbFired) {
                _ttfbFired = true;
                if (typeof onFirstChunk === 'function') { onFirstChunk(Date.now() - _start); }
              }
              fullText += delta.text;
              if (typeof onChunk === 'function') { onChunk(delta.text); }
            } else if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string') {
              if (typeof onThinkingChunk === 'function') { onThinkingChunk(delta.thinking); }
            }
          } catch (_) { /* skip malformed SSE line */ }
        }
      });

      res.on('end', function() {
        clearTimeout(_idleTimer);
        resolve({ text: fullText, usage: Object.assign({ model: model }, _usage) });
      });

      res.on('error', function(err) {
        clearTimeout(_idleTimer);
        reject(new Error('Anthropic API stream failed: ' + (err && err.message ? err.message : 'unknown error')));
      });
    });

    req.setTimeout(timeoutMs, function() {
      req.destroy(new Error('Anthropic API stream timed out after ' + timeoutMs + 'ms'));
    });

    req.on('error', function(err) {
      reject(new Error('Anthropic API stream failed: ' + (err && err.message ? err.message : 'unknown error')));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Streaming variant of _callCopilot.
 * Sends stream:true, parses OpenAI-compatible SSE chunks, calls onChunk(text) for each delta.
 * onFirstChunk fires once with ttfb_ms (time to first content token).
 * Resolves with the full concatenated text when [DONE] is received.
 */
function _callCopilotStream(systemPrompt, history, currentInput, token, onChunk, maxTokens, timeoutMs, onThinkingChunk, onFirstChunk, noThinking, modelOverride) {
  const authToken = process.env.GITHUB_TOKEN || token;
  if (!authToken) {
    return Promise.reject(new Error(
      'No auth token available. Either log in via GitHub OAuth or set GITHUB_TOKEN in .env '
      + '(run: gh auth token)'
    ));
  }

  const model = modelOverride || process.env.WUCE_TURN_MODEL || DEFAULT_MODEL;

  // Prompt caching: for Claude models via the Copilot proxy, send the system prompt
  // as a content-block array with cache_control — GHCP's Claude proxy forwards
  // Anthropic-specific params (same mechanism that makes thinking work).
  // For GPT models, Copilot applies automatic prompt caching; no change needed.
  const _useCache = process.env.WUCE_ENABLE_PROMPT_CACHE !== '0' && model.startsWith('claude-');
  const _systemContent = _useCache
    ? [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]
    : systemPrompt;

  const messages = [{ role: 'system', content: _systemContent }];
  (history || []).forEach(function(turn) {
    messages.push({ role: turn.role, content: turn.content });
  });
  messages.push({ role: 'user', content: currentInput });

  const requestBody = {
    model:          model,
    max_tokens:     maxTokens,
    messages:       messages,
    stream:         true,
    stream_options: { include_usage: true }
  };

  // Extended thinking: forwarded to Anthropic by the GHCP Claude proxy.
  // noThinking=true skips the budget so the model responds immediately.
  if (process.env.WUCE_ENABLE_THINKING === '1' && !noThinking) {
    const budget = parseInt(process.env.WUCE_THINKING_BUDGET_TOKENS || '10000', 10);
    requestBody.thinking = { type: 'enabled', budget_tokens: Math.min(budget, maxTokens - 1) };
  }

  const body = JSON.stringify(requestBody);

  const extraHeaders = _useCache ? { 'anthropic-beta': 'prompt-caching-2024-07-31' } : {};

  const options = {
    hostname: 'api.githubcopilot.com',
    path:     '/chat/completions',
    method:   'POST',
    agent:    _copilotAgent,
    headers:  Object.assign({
      'Authorization':          'Bearer ' + authToken,
      'User-Agent':             'skills-repo-web-ui',
      'Copilot-Integration-Id': 'vscode-chat',
      'Content-Type':           'application/json',
      'Content-Length':         Buffer.byteLength(body)
    }, extraHeaders)
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
      let _usage         = { prompt_tokens: 0, completion_tokens: 0 };
      const _start = Date.now();
      let _ttfbFired = false;

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
            // Final usage chunk: choices is empty, usage holds token counts
            if (parsed && parsed.usage && (!parsed.choices || parsed.choices.length === 0)) {
              _usage.prompt_tokens     = parsed.usage.prompt_tokens || 0;
              _usage.completion_tokens = parsed.usage.completion_tokens || 0;
            }
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
              if (!_ttfbFired) {
                _ttfbFired = true;
                if (typeof onFirstChunk === 'function') { onFirstChunk(Date.now() - _start); }
              }
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
        resolve({ text: fullText, usage: { model: model, input_tokens: _usage.prompt_tokens, output_tokens: _usage.completion_tokens, cache_read_tokens: 0, cache_creation_tokens: 0 } });
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

  const _useCache = process.env.WUCE_ENABLE_PROMPT_CACHE !== '0' && model.startsWith('claude-');
  const _systemContent = _useCache
    ? [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]
    : systemPrompt;

  const messages = [
    { role: 'system', content: _systemContent }
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

  const extraHeaders = _useCache ? { 'anthropic-beta': 'prompt-caching-2024-07-31' } : {};

  const options = {
    hostname: 'api.githubcopilot.com',
    path:     '/chat/completions',
    method:   'POST',
    agent:    _copilotAgent,
    headers:  Object.assign({
      'Authorization':          'Bearer ' + authToken,
      'User-Agent':             'skills-repo-web-ui',
      'Copilot-Integration-Id': 'vscode-chat',
      'Content-Type':           'application/json',
      'Content-Length':         Buffer.byteLength(body)
    }, extraHeaders)
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
 * bri-s3.1: resolve a mock-gateway response into the same shape _callAnthropic
 * resolves with ({ text, usage }), so callers don't need to branch on source.
 */
function _resolveMockGatewayResponse(stage, model, scenarioName) {
  const mockResult = mockLlmGateway.getMockResponse(stage, model || getActiveModel(), scenarioName || 'success');
  return Promise.resolve({
    text: mockResult.text,
    usage: mockResult.usage || { model: model || 'mock', input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_creation_tokens: 0 }
  });
}

/**
 * bri-s3.1: stream a mock-gateway response through the same onChunk/onFirstChunk
 * contract as the real streaming callers, with no real network round-trip.
 */
function _streamMockGatewayResponse(stage, model, scenarioName, onChunk, onFirstChunk) {
  const mockResult = mockLlmGateway.getMockResponse(stage, model || getActiveModel(), scenarioName || 'success');
  const text = mockResult.text || '';
  if (typeof onFirstChunk === 'function') { onFirstChunk(0); }
  if (typeof onChunk === 'function' && text) { onChunk(text); }
  return Promise.resolve({
    text: text,
    usage: mockResult.usage || { model: model || 'mock', input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_creation_tokens: 0 }
  });
}

/**
 * Execute one skill turn.
 *
 * Routes to Anthropic or Copilot based on SKILL_EXECUTOR_PROVIDER env var.
 *   SKILL_EXECUTOR_PROVIDER=anthropic  → Anthropic Messages API (default, requires ANTHROPIC_API_KEY)
 *   SKILL_EXECUTOR_PROVIDER=copilot   → Copilot Chat Completions API (requires GitHub token with copilot scope)
 *
 * bri-s3.1: when `meta.stage` is supplied AND mockLlmGateway.isMockGatewayEnabled()
 * is true, routes to the mock LLM gateway instead of any real provider — no real
 * network call is made. Omitting `meta` (all existing callers) leaves behaviour
 * unchanged; a caller must explicitly opt in with a stage name to be mocked.
 *
 * @param {string}  systemPrompt   — full system prompt (SKILL.md + product context + web UI framing)
 * @param {Array}   history        — array of { role: 'user'|'assistant', content: string }
 * @param {string}  currentInput   — current user input (or 'Begin the session.' for the first turn)
 * @param {string}  token          — GitHub access token (only used for copilot provider)
 * @param {{stage?: string, scenarioName?: string, model?: string, tenantId?: string, sessionId?: string}} [meta] — bri-s3.1 mock-gateway routing; s6.1 tenantId/sessionId for prompt-cache scoping (Decision 8)
 * @returns {Promise<string>}      — the model's response text
 */
function skillTurnExecutor(systemPrompt, history, currentInput, token, meta) {
  if (meta && meta.stage && mockLlmGateway.isMockGatewayEnabled()) {
    return _resolveMockGatewayResponse(meta.stage, meta.model, meta.scenarioName);
  }

  const provider  = (process.env.SKILL_EXECUTOR_PROVIDER || 'anthropic').toLowerCase();
  const maxTokens = parseInt(process.env.WUCE_TURN_MODEL_MAX_TOKENS || String(DEFAULT_MAX_TOKENS), 10);
  const timeoutMs = parseInt(process.env.WUCE_TURN_TIMEOUT_MS       || String(DEFAULT_TIMEOUT_MS), 10);
  // s6.1: activate Decision 8 — thread tenantId/sessionId through to _anthropicSystem()
  // so the prompt-cache scope comment is genuinely tenant-differentiated in production.
  const session = (meta && (meta.tenantId != null || meta.sessionId != null))
    ? { tenantId: meta.tenantId, sessionId: meta.sessionId }
    : null;

  if (provider === 'anthropic') {
    return _callAnthropic(systemPrompt, history, currentInput, maxTokens, timeoutMs, session);
  }

  return _callCopilot(systemPrompt, history, currentInput, token, maxTokens, timeoutMs);
}

/**
 * Streaming skill turn — calls onChunk(text) for each token as it arrives.
 * Both copilot and anthropic providers support streaming.
 * onFirstChunk(ttfb_ms) fires once when the first content token arrives.
 *
 * bri-s3.1: when `options.stage` is supplied AND mockLlmGateway.isMockGatewayEnabled()
 * is true, routes to the mock LLM gateway (single onChunk call, no real network
 * round-trip) instead of any real provider. Omitting `options.stage` (all existing
 * callers) leaves behaviour unchanged.
 *
 * @param {string}   systemPrompt
 * @param {Array}    history
 * @param {string}   currentInput
 * @param {string}   token
 * @param {function} onChunk — called with each text delta
 * @param {function} [onThinkingChunk] — called with each reasoning/thinking delta
 * @param {function} [onFirstChunk] — called once with time-to-first-byte in ms
 * @param {{maxTokens?: number, noThinking?: boolean, model?: string, stage?: string, scenarioName?: string, tenantId?: string, sessionId?: string}} [options] — s6.1: tenantId/sessionId for prompt-cache scoping (Decision 8)
 * @returns {Promise<string>} full response text
 */
function skillTurnExecutorStream(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk, options) {
  const modelOverride  = options && options.model;

  if (options && options.stage && mockLlmGateway.isMockGatewayEnabled()) {
    return _streamMockGatewayResponse(options.stage, modelOverride, options.scenarioName, onChunk, onFirstChunk);
  }

  const provider       = (process.env.SKILL_EXECUTOR_PROVIDER || 'anthropic').toLowerCase();
  const defaultTokens  = parseInt(process.env.WUCE_TURN_MODEL_MAX_TOKENS || String(DEFAULT_MAX_TOKENS), 10);
  const maxTokens      = (options && options.maxTokens) ? options.maxTokens : defaultTokens;
  const timeoutMs      = parseInt(process.env.WUCE_TURN_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS), 10);
  const noThinking     = options && options.noThinking;
  // s6.1: activate Decision 8 — same tenantId/sessionId threading as skillTurnExecutor() above.
  const session = (options && (options.tenantId != null || options.sessionId != null))
    ? { tenantId: options.tenantId, sessionId: options.sessionId }
    : null;

  if (provider === 'anthropic') {
    return _callAnthropicStream(systemPrompt, history, currentInput, maxTokens, timeoutMs, onChunk, onThinkingChunk, onFirstChunk, noThinking, modelOverride, session);
  }

  return _callCopilotStream(systemPrompt, history, currentInput, token, onChunk, maxTokens, timeoutMs, onThinkingChunk, onFirstChunk, noThinking, modelOverride);
}

/**
 * Returns the model ID that will be used for the next turn, based on env config.
 * @returns {string}
 */
function getActiveModel() {
  const provider = (process.env.SKILL_EXECUTOR_PROVIDER || 'anthropic').toLowerCase();
  if (provider === 'anthropic') {
    return process.env.WUCE_TURN_MODEL || DEFAULT_ANTHROPIC_MODEL;
  }
  return process.env.WUCE_TURN_MODEL || DEFAULT_MODEL;
}

module.exports = { skillTurnExecutor, skillTurnExecutorStream, getActiveModel };

'use strict';

/**
 * teams-outbound-adapter.js
 *
 * D37 injectable outbound adapter for sending a notification to the team's
 * Microsoft Teams channel via an Incoming Webhook (coha-s1).
 *
 * This is a separate, new outbound send path -- it does not extend or
 * reuse src/approval-channel/adapters/teams-adapter.js, which is confirmed
 * (by reading its real exports: handle, verifyHmac, extractStoryId) to be
 * inbound-only and HMAC-signature-verification-specific, irrelevant to an
 * outbound POST.
 *
 * Downstream callers (coha-s2, coha-s3, coha-s4) call sendTeamsNotification()
 * only -- they never touch the adapter variable or the real implementation
 * directly.
 *
 * Security (product/constraints.md #12, NFR-Security):
 *   - TEAMS_WEBHOOK_URL read from process.env only, at call time. Never
 *     hardcoded, never logged, never included in any value this module
 *     returns or logs.
 *
 * Reference: artefacts/2026-11-08-cicd-observability-hardening-automation/
 *            stories/coha-s1-outbound-teams-notification-adapter.md
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const DEFAULT_TIMEOUT_MS = 10000;

// ─────────────────────────────────────────────────────────────────────────────
// Injectable adapter (D37) — stub default MUST throw, never silently no-op
// ─────────────────────────────────────────────────────────────────────────────

function _throwingStub() {
  throw new Error('Adapter not wired: teamsNotifyAdapter. Call setTeamsNotifyAdapter() with a real implementation before use.');
}

let _teamsNotifyAdapter = _throwingStub;

function setTeamsNotifyAdapter(impl) {
  _teamsNotifyAdapter = impl;
}

function getTeamsNotifyAdapter() {
  return _teamsNotifyAdapter;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit logging (NFR-Audit) — never includes the webhook URL value
// ─────────────────────────────────────────────────────────────────────────────

function _auditLog(status, detail) {
  process.stdout.write('[teams-outbound-adapter] ' + new Date().toISOString() + ' ' + status + ' ' + detail + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Real implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POSTs `payload` as JSON to process.env.TEAMS_WEBHOOK_URL.
 *
 * @param {object} payload - message payload (caller-defined shape; each
 *                            calling story designs its own content)
 * @param {{timeoutMs?: number}} [opts] - timeoutMs overrides the default
 *                            10s bound; used by tests to avoid a genuinely
 *                            slow timeout test. Production callers omit it.
 * @returns {Promise<{ok: boolean, statusCode?: number, error?: string}>}
 *          Never rejects -- always resolves with an explicit ok:true/false
 *          result the caller can branch on (AC2: never silently swallowed).
 */
function realTeamsNotifyAdapter(payload, opts) {
  const timeoutMs = (opts && typeof opts.timeoutMs === 'number') ? opts.timeoutMs : DEFAULT_TIMEOUT_MS;

  return new Promise(function(resolve) {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      _auditLog('failure', 'send failed: TEAMS_WEBHOOK_URL not set');
      resolve({ ok: false, error: 'TEAMS_WEBHOOK_URL not configured' });
      return;
    }

    let url;
    try {
      url = new URL(webhookUrl);
    } catch (_) {
      _auditLog('failure', 'send failed: invalid webhook URL configured');
      resolve({ ok: false, error: 'Invalid webhook URL configured' });
      return;
    }

    const body = JSON.stringify(payload);
    const client = url.protocol === 'http:' ? http : https;
    const req = client.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'http:' ? 80 : 443),
      path: url.pathname + (url.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: timeoutMs
    }, function(res) {
      const chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          _auditLog('success', 'send succeeded, status ' + res.statusCode);
          resolve({ ok: true, statusCode: res.statusCode });
        } else {
          _auditLog('failure', 'send failed: non-2xx status ' + res.statusCode);
          resolve({ ok: false, error: 'Non-2xx response: ' + res.statusCode });
        }
      });
    });

    req.on('timeout', function() {
      req.destroy();
      _auditLog('failure', 'send failed: timed out after ' + timeoutMs + 'ms');
      resolve({ ok: false, error: 'Timed out after ' + timeoutMs + 'ms' });
    });

    req.on('error', function(err) {
      _auditLog('failure', 'send failed: network error (' + (err && err.code) + ')');
      resolve({ ok: false, error: 'Network error: ' + ((err && err.code) || (err && err.message) || 'unknown') });
    });

    req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point — every calling story uses this, never the adapter
// variable or realTeamsNotifyAdapter directly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} payload
 * @returns {Promise<{ok: boolean, statusCode?: number, error?: string}>}
 */
function sendTeamsNotification(payload) {
  return _teamsNotifyAdapter(payload);
}

module.exports = {
  setTeamsNotifyAdapter,
  getTeamsNotifyAdapter,
  realTeamsNotifyAdapter,
  sendTeamsNotification
};

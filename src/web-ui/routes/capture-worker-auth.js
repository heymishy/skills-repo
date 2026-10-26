'use strict';

// capture-worker-auth.js — ppc-s9 Task 2: machine-to-machine nonce-exchange
// endpoint. The GitHub Actions capture-worker workflow (Task 4) calls this
// to turn the single-use nonce it received as a workflow_dispatch input
// (Task 1's capture-nonce-store.js) into the real sessionId it needs to
// authenticate its own Playwright session as the tenant's PO.
//
// Double-gate, modelled directly on auth-stub.js's own handleAuthStubGithub
// (_stubEnabled / _secretMatches shape), with one deliberate difference:
// this route IS reachable in production. auth-stub.js's gate is
// staging-only by convention (its own secret is never set in production);
// here, the CAPTURE_EXCHANGE_SECRET-presence check IS the gate, and this
// endpoint must work wherever the real capture-worker workflow runs.
//
// Never logs or echoes the real nonce or sessionId value, on any path --
// mirrors the CLAUDE.md path traversal guard rule's own "do not log the raw
// resolved path on failure" convention, applied here to these two values
// instead of a filesystem path (see playback-evidence.js's own comment on
// this same convention).

const crypto = require('crypto');
const { exchangeNonce } = require('../adapters/capture-nonce-store');

/** True only when the shared secret this endpoint requires is configured on this server. */
function _exchangeEnabled() {
  return !!process.env.CAPTURE_EXCHANGE_SECRET;
}

/**
 * Constant-time comparison of the request-supplied secret against the
 * configured one. Returns false (never throws) on any length mismatch --
 * same convention as auth-stub.js's own _secretMatches.
 * @param {string} candidate
 * @returns {boolean}
 */
function _secretMatches(candidate) {
  const expected = process.env.CAPTURE_EXCHANGE_SECRET || '';
  const candidateBuf = Buffer.from(String(candidate || ''));
  const expectedBuf = Buffer.from(expected);
  if (candidateBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

/** Mirrors internal-sync.js's own _readBody / sign-off.js's own _readBody. */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(chunk) { raw += chunk; });
    req.on('end', function() {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
    });
    req.on('error', function() { resolve(null); });
  });
}

/**
 * POST /internal/capture/exchange
 *
 * Body: { nonce: string }
 * Response: 200 { sessionId: string } | 404 { error } | 403 { error }
 *
 * Gate 1: 404 (no-op) unless CAPTURE_EXCHANGE_SECRET is configured on this
 * server, regardless of any header present on the request.
 * Gate 2: 403 unless the request's own x-capture-exchange-secret header
 * matches, checked via crypto.timingSafeEqual. The nonce store is NEVER
 * consulted when this gate fails -- secret check always happens before any
 * business logic (same ordering as auth-stub.js / internal-sync.js).
 *
 * On a secret match, calls capture-nonce-store.js's own exchangeNonce(nonce).
 * A real sessionId -> 200 {"sessionId": "..."}. null (already used, expired,
 * or never existed) -> 404, with a body that names the failure without ever
 * echoing the submitted nonce or the real sessionId -- in the response body
 * or in any log line.
 *
 * Not behind the tenant authGuard -- machine-to-machine only, authenticated
 * purely by the shared secret (same precedent as auth-stub.js's own routes).
 *
 * @param {object} req
 * @param {object} res
 */
async function handleCaptureExchange(req, res) {
  if (!_exchangeEnabled()) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }

  const suppliedSecret = req.headers && req.headers['x-capture-exchange-secret'];
  if (!_secretMatches(suppliedSecret)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  const body = await _readBody(req);
  const nonce = body && body.nonce;
  if (!nonce) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'nonce is required' }));
    return;
  }

  const sessionId = await exchangeNonce(nonce);
  if (!sessionId) {
    // Deliberately does not name "nonce" or echo the submitted value --
    // never confirms or denies which specific nonce was tried.
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Exchange failed: not found, expired, or already used' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ sessionId: sessionId }));
}

module.exports = {
  handleCaptureExchange,
  _exchangeEnabled,
  _secretMatches
};

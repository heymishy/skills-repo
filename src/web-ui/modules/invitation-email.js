'use strict';

// invitation-email.js -- story-3-self-service-provisioning (AC5, D37)
// (artefacts/2026-07-30-agency-client-organisations)
//
// Injectable adapter for sending the Client-org first-user invitation email.
// Genuinely external, swappable integration (Resend) -- unlike
// modules/organisations.js / modules/agency-client-grants.js /
// modules/client-invitations.js, which all take `pool` directly (H-ADAPTER:
// internal DB access, not external I/O), this DOES need the full D37
// contract (CLAUDE.md "Injectable adapter rule"):
//   1. Stub default THROWS -- never a silent no-op.
//   2. setSendInvitationEmail() setter exported.
//   3. Production wiring lives in server.js, wired to the real `resend` SDK.
//   4. The wiring test (tests/check-story3-self-service-provisioning.js)
//      asserts an OBSERVABLE, DIFFERENTIATING outcome -- two distinct
//      invited emails resolve to two distinct, correctly-addressed Resend
//      calls -- not merely that setSendInvitationEmail was called once.
//
// Tests mock this function directly -- never make a real network call in
// tests (test-plan Data Strategy: "the adapter's send function is replaced
// with a test double").

let _sendInvitationEmail = function() {
  throw new Error('Adapter not wired: sendInvitationEmail. Call setSendInvitationEmail() with a real implementation before use.');
};

/**
 * Replace the adapter (real Resend call in production; test double in tests).
 * @param {Function} fn - async (destinationEmail: string, link: string, code?: string) => void
 */
function setSendInvitationEmail(fn) {
  _sendInvitationEmail = fn;
}

/**
 * Send the invitation email. Never logs the link/token in plaintext at this
 * layer -- callers are responsible for their own audit logging using only
 * invitation_id/client_org_id/timestamp (see modules/client-invitations.js).
 * @param {string} destinationEmail
 * @param {string} link - the magic-link URL; includes the signed JWT invitation token
 * @param {string} [code]
 * @returns {Promise<void>}
 */
async function sendInvitationEmail(destinationEmail, link, code) {
  return _sendInvitationEmail(destinationEmail, link, code);
}

/** Test-only reset -- restores the throw-on-unwired stub. */
function _resetForTesting() {
  _sendInvitationEmail = function() {
    throw new Error('Adapter not wired: sendInvitationEmail. Call setSendInvitationEmail() with a real implementation before use.');
  };
}

/**
 * Build the real, Resend-backed sendInvitationEmail implementation
 * (AC5/D37 production wiring). Extracted as its own directly-testable
 * factory -- rather than an inline anonymous function only reachable by
 * booting the whole server.js (which requires a real DATABASE_URL/pg pool)
 * -- so the wiring test can call this SAME production code path directly
 * with a fake Resend client and assert an observable, differentiating
 * outcome (two distinct invited emails -> two distinct, correctly-addressed
 * Resend calls), not merely that setSendInvitationEmail() was called once.
 * See CLAUDE.md's D37 wiring-test convention and the tir-s1 anti-pattern it
 * fixes.
 * @param {object} resendClient - a Resend SDK instance exposing emails.send({from,to,subject,html})
 * @param {string} [fromEmail]
 * @returns {Function} async (destinationEmail: string, link: string) => void
 */
function createResendSendInvitationEmail(resendClient, fromEmail) {
  var from = fromEmail || 'invitations@skills-platform.dev';
  return async function(destinationEmail, link) {
    await resendClient.emails.send({
      from: from,
      to: destinationEmail,
      subject: 'You have been invited',
      html: '<p>You have been invited to join a Client organisation. ' +
        '<a href="' + link + '">Click here to accept your invitation</a>.</p>'
    });
  };
}

module.exports = { sendInvitationEmail, setSendInvitationEmail, _resetForTesting, createResendSendInvitationEmail };

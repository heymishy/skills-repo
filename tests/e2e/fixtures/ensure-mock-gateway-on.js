'use strict';

/**
 * ensure-mock-gateway-on.js — mgar-s1
 *
 * Defensively forces wuce-staging's mock LLM gateway back ON before a real
 * staging E2E run, rather than trusting whatever the server process's
 * current in-memory override state happens to be. Fixes the gap this
 * story exists for: a human manually toggling the gateway off during a
 * debugging session, with nothing to guarantee it's back on before the
 * next CI run against the same running process.
 *
 * Reuses the exact same e2e-test-admin@example.test session mechanism
 * already established and provisioned by admin-credits-topup.js -- not a
 * new admin-auth path. Mirrors that file's non-throwing,
 * reason-reporting pattern: this step exists purely to prevent an
 * unintended real-call run, so it must never itself hard-fail a job over
 * a defensive precondition (the real test step is what should fail/pass
 * on its own merits).
 */

const { request: pwRequest } = require('@playwright/test');
const { STAGING_BASE_URL } = require('./staging-auth');
const { ADMIN_EMAIL, _adminLogin, _adminSignupOnce } = require('./admin-credits-topup');

function _extractCsrf(html) {
  const m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

/**
 * Force the mock gateway to ON via the real admin endpoint, authenticated
 * as the fixed e2e-test-admin identity.
 * @returns {Promise<{forcedOn: boolean, reason?: string}>}
 */
async function ensureMockGatewayOn() {
  const adminContext = await pwRequest.newContext({ baseURL: STAGING_BASE_URL });
  try {
    let sessionOk = await _adminLogin(adminContext);
    if (!sessionOk) {
      sessionOk = await _adminSignupOnce(adminContext);
    }
    if (!sessionOk) {
      return { forcedOn: false, reason: 'could not establish any session (login and signup both failed) for ' + ADMIN_EMAIL };
    }

    const pageRes = await adminContext.get('/admin/mock-gateway');
    if (pageRes.status() !== 200) {
      return { forcedOn: false, reason: 'GET /admin/mock-gateway returned HTTP ' + pageRes.status() + ' for ' + ADMIN_EMAIL };
    }
    const html = await pageRes.text();
    const csrfToken = _extractCsrf(html);
    if (!csrfToken) {
      return { forcedOn: false, reason: '/admin/mock-gateway page response did not embed a _csrf token' };
    }

    const toggleRes = await adminContext.post('/api/admin/mock-gateway/toggle', {
      form: { nextState: 'on', _csrf: csrfToken },
      maxRedirects: 0
    });
    if (toggleRes.status() !== 302) {
      return { forcedOn: false, reason: 'POST /api/admin/mock-gateway/toggle returned unexpected HTTP ' + toggleRes.status() };
    }
    return { forcedOn: true };
  } finally {
    await adminContext.dispose();
  }
}

module.exports = { ensureMockGatewayOn };

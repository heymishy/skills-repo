'use strict';

/**
 * staging-auth.js — shared Playwright helper for authenticating against a real
 * deployed environment (`wuce-staging` by default) via the a1-staging-safe-auth-stub
 * mechanism (story a1-staging-safe-auth-stub).
 *
 * Distinct from tests/e2e/fixtures/auth.js: that fixture injects a session cookie
 * directly into the browser's cookie jar and requires the server to be running with
 * NODE_ENV=test (the existing local-mocked harness). This fixture instead drives the
 * real, deployed server's HTTP endpoints — no NODE_ENV=test guard exists on
 * wuce-staging (it runs in production mode), so authentication here goes through
 * real request/response cycles against real staging routes.
 *
 * Two authentication paths are exposed, matching AC1 and AC2 of
 * artefacts/2026-07-23-e2e-core-journey-coverage/stories/a1-staging-safe-auth-stub.md:
 *
 *   - stubGithubLogin(request)  — AC1: staging-only GitHub OAuth stub
 *   - signUpEmail(request)      — AC2: real email/password signup (no stub involved;
 *                                  this exercises the same production signup code
 *                                  path that already exists for the local harness)
 *
 * Downstream stories (A2-A5, B1) should import this fixture rather than re-implementing
 * staging authentication.
 */

const crypto = require('crypto');

/** Real deployed staging base URL — overridable for local verification. */
const STAGING_BASE_URL = process.env.E2E_STAGING_BASE_URL || 'https://wuce-staging.fly.dev';

/** The staging-only auth-stub gate secret. Tests that need it must have it injected via env. */
const STUB_SECRET = process.env.E2E_STAGING_AUTH_STUB_SECRET || '';

/**
 * True when this process has the credential needed to exercise the GitHub stub path.
 * Specs should skip (not fail) when this is false — the secret is a staging CI
 * secret, never committed, so a normal contributor run without it must not error.
 * @returns {boolean}
 */
function hasStubSecret() {
  return !!STUB_SECRET;
}

/**
 * Generate a fresh, uniquely `e2e-test-`-tagged email address for signup tests.
 * @param {string} [label] - optional distinguishing label (e.g. story/spec id)
 * @returns {string}
 */
function uniqueEmail(label) {
  const tag = label ? String(label).replace(/[^a-z0-9]/gi, '-') : 'a1';
  return 'e2e-test-' + tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '@example.test';
}

/**
 * AC1: authenticate against real staging via the staging-only GitHub OAuth stub.
 * Requires the caller's environment to provide E2E_STAGING_AUTH_STUB_SECRET
 * (a staging CI secret — never committed).
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<{login: string, userId: number, tenantId: string, createdAt: string, elapsedMs: number}>}
 */
async function stubGithubLogin(request) {
  if (!hasStubSecret()) {
    throw new Error(
      'stubGithubLogin() requires E2E_STAGING_AUTH_STUB_SECRET to be set in the ' +
      'environment running Playwright — ask the operator for the staging CI secret value.'
    );
  }
  const start = Date.now();
  const res = await request.post('/auth/e2e-stub/github', {
    headers: { 'x-e2e-stub-secret': STUB_SECRET }
  });
  const elapsedMs = Date.now() - start;
  if (res.status() !== 200) {
    throw new Error('stubGithubLogin() failed: HTTP ' + res.status() + ' ' + (await res.text()));
  }
  const body = await res.json();
  return Object.assign({ elapsedMs: elapsedMs }, body);
}

/**
 * AC1 (NFR-Audit): confirm the audit log recorded the identity created by stubGithubLogin().
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} login
 * @returns {Promise<{found: boolean, entry: object|null}>}
 */
async function stubAuditLookup(request, login) {
  const res = await request.get('/auth/e2e-stub/audit?login=' + encodeURIComponent(login), {
    headers: { 'x-e2e-stub-secret': STUB_SECRET }
  });
  if (res.status() !== 200) {
    throw new Error('stubAuditLookup() failed: HTTP ' + res.status() + ' ' + (await res.text()));
  }
  return res.json();
}

/**
 * serlb-s1: the header carrying the staging-only rate-limit bypass secret (reuses
 * E2E_STAGING_AUTH_STUB_SECRET, the same secret a1's GitHub-stub path already uses --
 * see src/web-ui/routes/auth-email.js's serlb-s1 comment block for the full triple-gate
 * rationale). Only ever meaningful on real wuce-staging: the secret is never set on
 * production, and routes/auth-email.js additionally requires the signed-up email itself
 * to carry the `e2e-test-` tag (which uniqueEmail() below always applies), so this
 * header alone grants nothing for a non-E2E email.
 */
const RATE_LIMIT_BYPASS_HEADER = 'x-e2e-rate-limit-bypass';

/**
 * AC2: sign up via real email/password against real staging — independent of the
 * GitHub stub path. Mirrors the CSRF-token-from-landing-page pattern established by
 * bri-s3.2's local-harness spec, but against the real deployed server.
 *
 * serlb-s1: when the staging stub secret is available (real CI runs against
 * wuce-staging; absent in a normal contributor run), also sends the narrow
 * rate-limit-bypass header so repeated signups across a1-a4's specs in the same CI
 * run don't trip the real 10-attempt/5-minute per-IP limiter. Harmless to omit --
 * without it, this call behaves exactly as it always has.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} [label] - optional distinguishing label for the generated email
 * @returns {Promise<{email: string, password: string, elapsedMs: number}>}
 */
async function signUpEmail(request, label) {
  const email = uniqueEmail(label);
  const password = 'A1-Staging-Stub-' + crypto.randomBytes(6).toString('hex') + '!';

  const start = Date.now();

  const landingRes = await request.get('/');
  const landingHtml = await landingRes.text();
  const csrfMatch = landingHtml.match(/name="_csrf" value="([^"]*)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  if (!csrfToken) {
    throw new Error('signUpEmail(): landing page did not embed a _csrf token in the signup form');
  }

  const headers = {};
  if (hasStubSecret()) headers[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET;

  const signupRes = await request.post('/auth/email/signup', {
    form: { email: email, password: password, _csrf: csrfToken },
    headers: headers,
    maxRedirects: 0
  });
  const elapsedMs = Date.now() - start;
  if (signupRes.status() !== 302) {
    throw new Error('signUpEmail() failed: HTTP ' + signupRes.status() + ' ' + (await signupRes.text()));
  }

  return { email: email, password: password, elapsedMs: elapsedMs };
}

/**
 * a2-stripe-test-mode-plan-selection: log in with an existing email/password
 * identity (previously created by signUpEmail) and return a freshly
 * authenticated session on the given request context.
 *
 * Added by A2 rather than duplicated, per CLAUDE.md's "reuse A1's fixture"
 * instruction — this is the same authentication mechanism as signUpEmail
 * (real email/password login against real staging), just the login half
 * rather than the signup half, needed because A2 discovered that the
 * browser session created by signUpEmail does not survive a Stripe-hosted
 * Checkout round trip (see decisions.md, "A2 SameSite=Strict session-cookie
 * finding") — re-authenticating with the same credentials is the correct way
 * to obtain a valid session for the same tenant afterward, independent of
 * whatever happened to the original browser session.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 */
async function loginEmail(request, email, password) {
  const landingRes = await request.get('/');
  const landingHtml = await landingRes.text();
  const csrfMatch = landingHtml.match(/name="_csrf" value="([^"]*)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  if (!csrfToken) {
    throw new Error('loginEmail(): landing page did not embed a _csrf token in the sign-in form');
  }

  // serlb-s1: handleEmailLogin shares the same per-IP counter as handleEmailSignup
  // (src/web-ui/routes/auth-email.js), so the same narrow bypass header is sent here
  // too -- harmless to omit, and only ever effective for an e2e-test--tagged email.
  const headers = {};
  if (hasStubSecret()) headers[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET;

  const loginRes = await request.post('/auth/email/login', {
    form: { email: email, password: password, _csrf: csrfToken },
    headers: headers,
    maxRedirects: 0
  });
  if (loginRes.status() !== 302) {
    throw new Error('loginEmail() failed: HTTP ' + loginRes.status() + ' ' + (await loginRes.text()));
  }
}

module.exports = {
  STAGING_BASE_URL,
  hasStubSecret,
  uniqueEmail,
  stubGithubLogin,
  stubAuditLookup,
  signUpEmail,
  loginEmail,
  RATE_LIMIT_BYPASS_HEADER,
  STUB_SECRET
};

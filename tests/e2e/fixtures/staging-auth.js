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
 * AC2: sign up via real email/password against real staging — independent of the
 * GitHub stub path. Mirrors the CSRF-token-from-landing-page pattern established by
 * bri-s3.2's local-harness spec, but against the real deployed server.
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

  const signupRes = await request.post('/auth/email/signup', {
    form: { email: email, password: password, _csrf: csrfToken },
    maxRedirects: 0
  });
  const elapsedMs = Date.now() - start;
  if (signupRes.status() !== 302) {
    throw new Error('signUpEmail() failed: HTTP ' + signupRes.status() + ' ' + (await signupRes.text()));
  }

  return { email: email, password: password, elapsedMs: elapsedMs };
}

module.exports = {
  STAGING_BASE_URL,
  hasStubSecret,
  uniqueEmail,
  stubGithubLogin,
  stubAuditLookup,
  signUpEmail
};

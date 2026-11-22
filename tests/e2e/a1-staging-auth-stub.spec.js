// a1-staging-auth-stub.spec.js — story a1-staging-safe-auth-stub
//
// Targets a REAL deployed environment (wuce-staging by default, overridable via
// E2E_STAGING_BASE_URL for local verification against a production-mode server) —
// NOT the local NODE_ENV=test mocked harness the other 29 specs in this directory
// use. Per ADR-018's addendum (.github/architecture-guardrails.md), this spec must
// never be invoked from the unit test chain (npm test / scripts/run-all-tests.js);
// it is only ever run via `npm run test:e2e` (or a scoped Playwright invocation).
//
// AC1: GitHub OAuth stub creates a real staging user + valid session cookie.
// AC2: email/password signup creates a real staging user + valid session,
//      independent of the GitHub stub path.
// NFR-Performance: each auth round-trip completes in under 5 seconds.
// NFR-Audit: the stub mechanism's usage is logged (queryable per-identity).
//
// AC1/NFR-Audit tests are skipped (not failed) when E2E_STAGING_AUTH_STUB_SECRET is
// not present in the environment running Playwright — that secret is a staging CI
// secret, never committed, so a contributor running `npm run test:e2e` locally
// without it must not see a false failure.

'use strict';

const { test, expect } = require('@playwright/test');
const { evaluateBudgets, COLD_START_BUDGET_MS, WARM_BUDGET_MS } = require('./fixtures/latency-budget');
const {
  STAGING_BASE_URL,
  hasStubSecret,
  stubGithubLogin,
  stubAuditLookup,
  signUpEmail
} = require('./fixtures/staging-auth');

test.use({ baseURL: STAGING_BASE_URL });

test.describe('a1-staging-safe-auth-stub', () => {

  test('AC1: GitHub OAuth stub creates a real staging user and a valid session', async ({ request }) => {
    test.skip(!hasStubSecret(), 'requires E2E_STAGING_AUTH_STUB_SECRET in the environment');

    // sfx-s1: in the post-deploy run this is the first request a freshly deployed app receives, so its round-trip includes
    // the cold start (it failed the old single 5 s check on 2026-11-19, run 44468809588). The first call gets the cold-start
    // budget; a second, warm call below keeps the 5 s NFR-Performance requirement.
    const { login, elapsedMs: coldMs } = await stubGithubLogin(request);
    expect(login).toMatch(/^e2e-test-gh-/);

    // The stub call rotates the session and sets a fresh session cookie; the shared
    // `request` context carries that cookie automatically on the follow-up call.
    const meRes = await request.get('/api/me');
    expect(meRes.status()).toBe(200);
    const me = await meRes.json();
    expect(me.authenticated, 'a valid session cookie must authenticate the follow-up request').toBe(true);
    expect(me.login).toBe(login);

    const { elapsedMs: warmMs } = await stubGithubLogin(request);
    const budgets = evaluateBudgets({ coldMs: coldMs, warmMs: warmMs });
    expect(budgets.failures, 'auth stub round-trip budgets (NFR-Performance): cold-start ' + COLD_START_BUDGET_MS + ' ms, warm ' + WARM_BUDGET_MS + ' ms; measured cold ' + coldMs + ' ms, warm ' + warmMs + ' ms').toEqual([]);
  });

  test('NFR-Audit: the stub login is recorded in the audit log, keyed by the generated identity', async ({ request }) => {
    test.skip(!hasStubSecret(), 'requires E2E_STAGING_AUTH_STUB_SECRET in the environment');

    const { login } = await stubGithubLogin(request);
    const audit = await stubAuditLookup(request, login);
    expect(audit.found, 'exactly one audit entry must exist for the generated test identity').toBe(true);
    expect(audit.entry.login).toBe(login);
  });

  test('AC2: email/password signup creates a real staging user and a valid session, independent of the GitHub stub path', async ({ request }) => {
    const { email, elapsedMs } = await signUpEmail(request, 'ac2');
    expect(elapsedMs, 'auth round-trip must complete in under 5s (NFR-Performance)').toBeLessThan(5000);

    const meRes = await request.get('/api/me');
    expect(meRes.status()).toBe(200);
    const me = await meRes.json();
    expect(me.authenticated, 'a valid session cookie must authenticate the follow-up request').toBe(true);
    expect(me.login).toBe(email);
  });

});

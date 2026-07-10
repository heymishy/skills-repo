// bri-s3.6-auth-journey.spec.js — E2E tests for the auth journey (bri-s3.6) @mocked
//
// Regression coverage for the GitHub OAuth first-login bug fixed in commit f845caf7.
// This repo does not use Better Auth — per landing-auth-billing/decisions.md's ARCH-002,
// the real stack is Path C (roll-your-own OAuth via fetch(), staying CJS).
//
// @mocked: the GitHub OAuth provider exchange is stubbed server-side (see server.js's
// NODE_ENV=test block — setProviderAdapter() wires a deterministic stub keyed by the
// `code` query param) so this spec drives the real /auth/github/callback redirect chain
// through the browser without ever reaching github.com's servers.
//
// SAFETY (AC5): the initial GET /auth/github hop is made via context.request with
// maxRedirects: 0 — the HTTP client never follows the Location header, so the browser
// never navigates towards https://github.com at all. A safety-net route additionally
// aborts (and fails the test) if anything ever attempts to contact a real github.com or
// google OAuth domain during this spec.
//
// AC1: first-time GitHub OAuth login -> /welcome (the f845caf7 fix)
// AC2: returning GitHub OAuth login (same identity) -> /dashboard
// AC3: session expiry/invalidation -> redirected to re-authenticate, not a dead end
// AC4: accessToken never appears in rendered page content
// AC5: real GitHub OAuth endpoint is never actually reached; login still completes

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }      = require('./fixtures/auth');

const REAL_PROVIDER_DOMAINS = [
  '**://github.com/**',
  '**://api.github.com/**',
  '**://accounts.google.com/**',
  '**://oauth2.googleapis.com/**',
  '**://openidconnect.googleapis.com/**',
];

/** Installs a hard fail-safe: aborts and records any attempted contact with a real OAuth provider domain. */
async function installRealProviderGuard(context) {
  let hitCount = 0;
  for (const pattern of REAL_PROVIDER_DOMAINS) {
    await context.route(pattern, async (route) => {
      hitCount++;
      await route.abort();
    });
  }
  return () => hitCount;
}

/**
 * Drive GET /auth/github via context.request (maxRedirects: 0 — the client never
 * follows the Location header, so the browser never attempts to reach github.com).
 * Extracts the CSRF state and manually copies the session cookie into the browser's
 * cookie jar (context.request and the page's browser context keep separate cookie
 * stores — see tests/e2e/fixtures/auth.js), so the subsequent real page.goto() to
 * /auth/github/callback carries the same session that GET /auth/github created.
 */
async function startGithubLogin(context) {
  const resp = await context.request.get('/auth/github', { maxRedirects: 0 });
  expect(resp.status()).toBe(302);

  const location = resp.headers()['location'] || '';
  expect(location.startsWith('https://github.com/login/oauth/authorize')).toBeTruthy();
  const state = new URL(location).searchParams.get('state');
  expect(state).toBeTruthy();

  const setCookieHeader = resp.headers()['set-cookie'] || '';
  const sessionIdMatch  = setCookieHeader.match(/session_id=([a-f0-9]+)/);
  expect(sessionIdMatch).toBeTruthy();

  await context.addCookies([
    {
      name:     'session_id',
      value:    sessionIdMatch[1],
      domain:   'localhost',
      path:     '/',
      httpOnly: true,
      secure:   false,
    },
  ]);

  return state;
}

test.describe('bri-s3.6 auth journey @mocked', () => {
  test.describe.configure({ mode: 'serial' }); // Scenario 2 reuses Scenario 1's identity

  // A synthetic GitHub login name unique to this test run, so re-runs don't collide
  // with a previous run's in-memory first-login tracking on a long-lived dev server.
  const SYNTHETIC_LOGIN = 'e2e-bri-s3-6-' + Date.now();

  test('AC1: first-time GitHub OAuth login redirects to /welcome, not /dashboard', async ({ page, context }) => {
    const getRealHitCount = await installRealProviderGuard(context);
    const state = await startGithubLogin(context);

    await page.goto(`/auth/github/callback?code=${SYNTHETIC_LOGIN}&state=${state}`);
    await expect(page).toHaveURL(/\/welcome(\?.*)?$/);

    const content = await page.content();
    expect(content).not.toContain('e2e-oauth-token-');
    expect(getRealHitCount(), 'zero real GitHub/Google OAuth endpoints were ever contacted').toBe(0);
  });

  test('AC2: returning GitHub OAuth login (same identity) redirects straight to /dashboard', async ({ page, context }) => {
    const getRealHitCount = await installRealProviderGuard(context);
    const state = await startGithubLogin(context);

    // Same SYNTHETIC_LOGIN as AC1 — the server's in-memory first-login tracking
    // (cleared during AC1's login) now reports this identity as a returning user.
    await page.goto(`/auth/github/callback?code=${SYNTHETIC_LOGIN}&state=${state}`);
    await expect(page).toHaveURL(/\/dashboard(\?.*)?$/);

    const content = await page.content();
    expect(content).not.toContain('e2e-oauth-token-');
    expect(getRealHitCount(), 'zero real GitHub/Google OAuth endpoints were ever contacted').toBe(0);
  });

  withAuth('AC3: an invalidated session redirects to re-authenticate, not a dead end', async ({ page }) => {
    // NOTE: withAuth's own `page` fixture creates its own internal BrowserContext
    // (see fixtures/auth.js) — the base test's `context` fixture would be a different,
    // unrelated context, so we must use page.context() to reach the one that actually
    // owns this page's cookies.
    const ownContext = page.context();

    // Confirm the seeded session is genuinely authenticated first.
    const authedResponse = await page.goto('/dashboard');
    expect(authedResponse.status()).toBeLessThan(400);

    // Simulate the session expiring / being deliberately invalidated: the server
    // no longer recognises the session cookie as carrying a valid accessToken.
    await ownContext.clearCookies();

    // SAFETY: use context.request (not page.goto) to inspect the redirect without ever
    // letting a real browser navigation follow it. In this deployment /dashboard's
    // unauthenticated path redirects straight to /auth/github (which itself points at
    // the real github.com authorise endpoint) — page.goto() would actually leave the
    // app and contact github.com for real, which AC5's no-real-network-calls guarantee
    // must hold for every scenario in this spec, not just the GitHub-login ones.
    const response = await ownContext.request.get('/dashboard', { maxRedirects: 0 });
    // Redirected to a re-authentication surface — not a dead end, blank error page, or
    // a silent 200 with no path forward.
    expect(response.status()).toBe(302);
    const location = response.headers()['location'] || '';
    expect(['/', '/auth/github']).toContain(location);
  });

  withAuth('AC4: accessToken never appears in rendered page content', async ({ page }) => {
    await page.goto('/dashboard');
    const content = await page.content();
    // The withAuth fixture's seeded token (tests/e2e/fixtures/auth.js) — must never render.
    expect(content).not.toContain('e2e-test-access-token');
  });
});

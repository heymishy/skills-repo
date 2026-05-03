'use strict';

/**
 * auth.js — Playwright auth bypass fixture (wuce.17, AC2)
 *
 * SECURITY: This fixture is activatable ONLY when NODE_ENV=test.
 * It injects a synthetic session cookie so E2E tests are treated as
 * authenticated without triggering the real GitHub OAuth redirect.
 *
 * Test identity: { userId: 9999, login: 'e2e-tester' }
 *
 * IMPORTANT: This file must NEVER contain real OAuth tokens.
 * Token patterns from any provider are forbidden in this file.
 * Test identities are clearly synthetic and labelled as such.
 *
 * Usage:
 *   const { withAuth } = require('./fixtures/auth');
 *   withAuth('my test', async ({ page }) => { ... });
 */

const { test: base } = require('@playwright/test');

/**
 * E2E_SESSION_ID — 64-char hex session ID shared between this fixture and
 * the server-side test seeding in src/web-ui/server.js.
 * ALL characters are in [a-f0-9] so the server's _parseSessionId regex
 * captures the full string.
 */
const E2E_SESSION_ID = 'e2e' + '0'.repeat(60) + '1';

/**
 * withAuth — extended Playwright test object that injects a synthetic session
 * cookie into the browser context before each test page navigation.
 *
 * The server must be running with NODE_ENV=test (done via playwright.config.js
 * webServer.env).  At server startup, the test session is pre-seeded via
 * src/web-ui/server.js.  The fixture also hits GET /test/session before each
 * test to re-seed — protecting against tests that mutate session state
 * (e.g. logout tests).
 *
 * The guard check (NODE_ENV === 'test') is enforced at fixture invocation time,
 * not at require time, so the module can be safely required by check scripts.
 */
const withAuth = base.extend({
  page: async ({ browser }, use) => {
    // SECURITY guard: auth bypass only available in NODE_ENV=test
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'auth bypass only available in NODE_ENV=test — ' +
        'do not use this fixture in production or staging environments'
      );
    }

    // Create a fresh browser context with base URL so relative paths work.
    const context = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    });

    // Re-seed the server-side test session (handles post-logout state from
    // earlier tests sharing the same server process).
    await context.request.get('/test/session');

    // Inject the matching session cookie into the browser context.
    // The cookie name 'session_id' matches src/web-ui/middleware/session.js.
    await context.addCookies([
      {
        name:     'session_id',
        value:    E2E_SESSION_ID,
        domain:   'localhost',
        path:     '/',
        httpOnly: true,
        secure:   false, // HTTP in test mode
      },
    ]);

    const page = await context.newPage();
    await use(page);
    await context.close();
  },

});

module.exports = { withAuth, E2E_SESSION_ID };

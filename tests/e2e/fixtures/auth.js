'use strict';

/**
 * auth.js — Playwright auth bypass fixture (wuce.17, AC2)
 *
 * SECURITY: This fixture is activatable ONLY when NODE_ENV=test.
 * It injects a synthetic session cookie so E2E tests are treated as
 * authenticated without triggering the real GitHub OAuth redirect.
 *
 * Test identity: { userId: 'e2e-test-user', login: 'e2e-tester' }
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
 * withAuth — extended Playwright test object that injects a synthetic session
 * cookie into the browser context before each test page navigation.
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

    // Create a fresh browser context and inject the synthetic session cookie.
    // The cookie name 'session_id' matches the server's session middleware
    // (src/web-ui/middleware/session.js: _parseSessionId).
    // The server must have this session seeded via a test endpoint or
    // session store integration (implemented in wuce.18+).
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'session_id',
        value: 'e2e-test-session-placeholder',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false, // HTTP in test mode
      },
    ]);

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

module.exports = { withAuth };

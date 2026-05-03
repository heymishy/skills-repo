'use strict';

// playwright.config.js — Playwright E2E test configuration (wuce.17)
// ADR-018: Playwright is the E2E framework for the wuce feature.
// testDir: all E2E specs live in tests/e2e/
// webServer: starts src/web-ui/server.js automatically in NODE_ENV=test

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: 'tests/e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  timeout: 30000,
  webServer: {
    command: 'node src/web-ui/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
      // Test-only credentials — not real OAuth credentials; required by
      // src/web-ui/config/validate-env.js on server startup
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || 'e2e-test-client-id',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || 'e2e-test-client-secret',
      SESSION_SECRET: process.env.SESSION_SECRET || 'e2e-test-session-secret-minimum32chars',
      PORT: '3000',
      // Repository context — used by sign-off and artefact-fetch routes;
      // overridden in test mode by the fixture fetcher in server.js
      GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER || 'heymishy',
      GITHUB_REPO_NAME:  process.env.GITHUB_REPO_NAME  || 'skills-repo',
      GITHUB_REPO:       process.env.GITHUB_REPO       || 'heymishy/skills-repo',
    },
  },
};

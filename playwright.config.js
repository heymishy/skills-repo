'use strict';

// playwright.config.js — Playwright E2E test configuration (wuce.17)
// ADR-018: Playwright is the E2E framework for the wuce feature.
// testDir: all E2E specs live in tests/e2e/
// webServer: starts src/web-ui/server.js automatically in NODE_ENV=test

// Set E2E_BASE_URL for the test process so fixtures (auth.js) pick it up.
// webServer.env only injects vars into the server subprocess, not the tests.
if (!process.env.E2E_BASE_URL) {
  process.env.E2E_BASE_URL = 'http://localhost:3999';
}

/** @type {import('@playwright/test').PlaywrightTestConfig} */
// lpw-s1: the six specs that target "a real deployed environment" (they default to the shared wuce-staging through
// fixtures/staging-auth.js) are the Scenario A and B specs. The local-suite CI job sets E2E_LOCAL_SUITE so a pull
// request run never reaches shared staging; the Scenario jobs name these files explicitly and do not set it.
const SCENARIO_SPECS = [
  'a1-staging-auth-stub', 'a2-stripe-test-mode-plan-selection', 'a3-product-feature-ideate-canvas',
  'a4-ideate-session-resume', 'dsh-s4-resume-conversation-survives-restart', 'b1-formed-idea-outer-loop-story-map',
].map(function (n) { return '**/' + n + '.spec.js'; });

module.exports = {
  testDir: 'tests/e2e',
  testIgnore: process.env.E2E_LOCAL_SUITE === 'true' ? SCENARIO_SPECS : [],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3999',
    headless: true,
  },
  timeout: 30000,
  webServer: {
    command: 'node src/web-ui/server.js',
    url: 'http://localhost:3999',
    // Always start a fresh test-mode server on 3999 so E2E tests don't
    // accidentally reuse a development server running on 3000.
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'test',
      // Test-only credentials — not real OAuth credentials; required by
      // src/web-ui/config/validate-env.js on server startup
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || 'e2e-test-client-id',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || 'e2e-test-client-secret',
      SESSION_SECRET: process.env.SESSION_SECRET || 'e2e-test-session-secret-minimum32chars',
      PORT: '3999',
      E2E_BASE_URL: 'http://localhost:3999',
      // Repository context — used by sign-off and artefact-fetch routes;
      // overridden in test mode by the fixture fetcher in server.js
      GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER || 'heymishy',
      GITHUB_REPO_NAME:  process.env.GITHUB_REPO_NAME  || 'skills-repo',
      GITHUB_REPO:       process.env.GITHUB_REPO       || 'heymishy/skills-repo',
      // bri-s3.4: raise routes/auth-email.js's per-IP signup/login rate
      // limiter to an effectively-unlimited ceiling for the whole E2E webServer
      // process. Needed because any spec creating multiple tenants per run
      // (bri-s3.2's, bri-s3.4's) can legitimately exceed the real 10-per-5-min
      // production limit once Playwright's --repeat-each runs several
      // iterations back-to-back from the same process IP -- discovered via
      // bri-s3.4's AC4 20x repeat check (16/20 runs failed with 429 before
      // this flag existed). Set only here, never in production; the real
      // limit is still fully exercised by tests/check-lab-s2.2-email-password.js,
      // which does not go through this config.
      E2E_RATE_LIMIT_BYPASS: 'true',
      // bri-s3.3: Enable GitHub-org-allowlist mode for multi-user tenant testing.
      // nis-s1: renamed with an e2e- prefix to match bri-s3.3's own SHARED_ORG
      // constant and /test/seed-multi-user-roles's required sharedOrg prefix
      // (see that story's decisions.md) -- must stay in sync with both.
      TENANT_ORG_ALLOWLIST: 'e2e-shared-org',
      // ep1-s3: wire the real listSkills/createSession/etc adapters (server.js
      // gates them on NODE_ENV!=='test' || WIRE_SKILL_ADAPTERS==='true').
      // Filesystem-only, no GitHub token required -- safe to enable for every
      // E2E spec, not just this story's own. Without it /skills always renders
      // its "No skills available" empty state under the E2E webServer.
      WIRE_SKILL_ADAPTERS: 'true',
      // lpw-s1: when CI asks for server coverage, the server writes V8 coverage to this directory on exit.
      ...(process.env.LPW_SERVER_COVERAGE_DIR ? { NODE_V8_COVERAGE: process.env.LPW_SERVER_COVERAGE_DIR } : {}),
    },
    // lpw-s1: the server writes its coverage only on a clean exit; stop it with SIGTERM (server.js handles it) rather
    // than killing it. Only when coverage is requested, so ordinary runs stop the server exactly as before.
    ...(process.env.LPW_SERVER_COVERAGE_DIR ? { gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 } } : {}),
  },
};

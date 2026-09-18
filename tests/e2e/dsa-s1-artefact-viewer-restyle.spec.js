// dsa-s1-artefact-viewer-restyle.spec.js — E2E coverage for dsa-s1 (restyle
// the artefact viewer and build its real Sign-off/Comments UI).
// Story: artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
// Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md
//
// Realises this test plan's 8 E2E scenarios (AC1-AC3, AC5-AC8). AC4 is
// deliberately NOT covered in this file — it is verified by re-running the
// 4 pre-existing artefact-viewer specs (artefact-preview.spec.js,
// artefact-read.spec.js, artefact-writeback.spec.js,
// wuce20-artefact-index-html.spec.js) unmodified, per the story's own AC4
// wording ("verified by running this screen's own pre-existing test coverage
// before and after the change").
//
// AC1/AC2 read the current, real light/dark token values directly from
// src/web-ui/utils/html-shell.js's `:root` / `[data-theme="dark"]` blocks —
// see that file for the source of truth if these values are ever updated.
//
// AC5 uses the same page.route(..., route.continue()) call-observation
// pattern already established by tests/e2e/s3.1-drag-to-advance.spec.js —
// this story's own decisions.md and architecture constraints confirm the
// real POST /sign-off success/409 round trip cannot be automated here (no
// real GitHub write access in test), matching tests/e2e/sign-off.spec.js's
// own precedent — only the request-sending behaviour (correct artefactPath)
// is asserted.
//
// AC6/AC7/AC8 use dedicated fixture markdown files (signed-off-sample.md,
// comments-empty-sample.md, comments-seeded-sample.md, comments-post-sample.md)
// under distinct artefactType values so each scenario's comments/sign-off
// state can never leak into another test sharing the same long-lived
// NODE_ENV=test server process. AC7's "3 seeded comments" and AC8's "post a
// comment" scenarios both go through the REAL POST /api/artefact-comments
// endpoint (not route interception) — this required a companion fix to
// src/web-ui/adapters/fake-test-db.js (see that file's own dsa-s1 section
// and this change's own separate commit) since the fake in-memory DB used
// in this environment (no DATABASE_URL) had no support for the new
// artefact_comments table at all, and createComment() crashed against its
// empty-rows catch-all.
//
// AC7/AC8's exact-count assertions (toHaveCount(3), toHaveCount(1)) also
// depend on playwright.config.js's webServer.reuseExistingServer staying
// false -- that gives every `npx playwright test` invocation a brand-new
// server process (and therefore a fresh, empty in-memory artefactComments
// array in fake-test-db.js), so comments never accumulate across repeated
// runs of this file. If that flag is ever flipped to reuse a running
// server, these two assertions will start failing intermittently on a
// second run -- add per-run unique resourceIds or explicit cleanup here
// first if that config ever changes.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

const TEST_SLUG = '2026-05-02-web-ui-copilot-execution-layer';

// ── Real light/dark token tables (src/web-ui/utils/html-shell.js) ─────────

const TOKEN_NAMES = [
  '--bg', '--surface', '--ink', '--ink-2', '--muted', '--muted-2', '--muted-3',
  '--accent', '--accent-soft', '--accent-ink', '--success', '--warn', '--danger'
];

const LIGHT_TOKENS = {
  '--bg':           '#FAFAFA',
  '--surface':      '#FFFFFF',
  '--ink':          '#14171A',
  '--ink-2':        '#3F454C',
  '--muted':        '#6B7280',
  '--muted-2':      '#52585F',
  '--muted-3':      '#3A3F45',
  '--accent':       '#2563EB',
  '--accent-soft':  '#EFF4FF',
  '--accent-ink':   '#1D4ED8',
  '--success':      '#15803D',
  '--warn':         '#B45309',
  '--danger':       '#B91C1C'
};

const DARK_TOKENS = {
  '--bg':           '#0B0D10',
  '--surface':      '#0E1013',
  '--ink':          '#F5F6F7',
  '--ink-2':        '#B4BAC2',
  '--muted':        '#9AA1AB',
  '--muted-2':      '#6B7280',
  '--muted-3':      '#454B54',
  '--accent':       '#3B82F6',
  '--accent-soft':  '#152238',
  '--accent-ink':   '#93C5FD',
  '--success':      '#34D399',
  '--warn':         '#F59E0B',
  '--danger':       '#F87171'
};

// ── Helpers ─────────────────────────────────────────────────────────────

async function readTokens(page) {
  return page.evaluate(function(names) {
    var s = getComputedStyle(document.documentElement);
    var out = {};
    names.forEach(function(n) { out[n] = s.getPropertyValue(n).trim(); });
    return out;
  }, TOKEN_NAMES);
}

/**
 * The real theme toggle button (.sw-theme-toggle) now lives on /settings'
 * Profile tab only (moved off every other page by si-s1 AC3). GET /settings
 * itself is wired real-Postgres-only in this codebase (routes/settings.js's
 * handleGetSettings, wired at server.js's `_handleGetSettings = ...` inside
 * an `if (process.env.DATABASE_URL)` block, with no NODE_ENV=test
 * fake-db fallback) -- confirmed via direct investigation (this local/CI
 * harness has no DATABASE_URL configured) that /settings 503s with
 * "Settings unavailable" here, a real, pre-existing gap unrelated to this
 * story's own scope (dsa-s1 touches only routes/artefact.js, server.js's
 * artefact-comments routes, and html-shell.js's token values -- it neither
 * introduced nor owns /settings' Postgres-only wiring). Rather than widen
 * this story's own scope to fix that unrelated gap, this helper calls
 * `window.swToggleTheme()` directly -- the exact same global function
 * .sw-theme-toggle's onclick invokes (html-shell.js SHELL_JS, injected on
 * every renderShell page including the artefact viewer itself) -- so the
 * toggle mechanism under test is byte-for-byte identical to a real click,
 * just invoked without requiring a page /settings can't currently serve
 * here.
 */
async function ensureTheme(page, theme) {
  for (var i = 0; i < 3; i++) {
    var current = await page.evaluate(function() {
      return document.documentElement.getAttribute('data-theme');
    });
    if (current === theme) return;
    await page.evaluate(function() { window.swToggleTheme(); });
  }
  var finalTheme = await page.evaluate(function() {
    return document.documentElement.getAttribute('data-theme');
  });
  if (finalTheme !== theme) {
    throw new Error('Could not set theme to ' + theme + ' via swToggleTheme(), got ' + finalTheme);
  }
}

async function getCsrfTokenFromArtefactPage(request, slug, artefactType) {
  var res = await request.get('/artefact/' + slug + '/' + artefactType);
  expect(res.status(), 'GET /artefact/' + slug + '/' + artefactType).toBe(200);
  var html = await res.text();
  var match = html.match(/data-csrf-token="([^"]+)"/);
  if (!match) throw new Error('artefact page did not embed a data-csrf-token attribute');
  return match[1];
}

async function seedComment(request, resourceId, body, csrfToken) {
  var res = await request.post('/api/artefact-comments', {
    data: { resourceType: 'artefact', resourceId: resourceId, body: body, _csrf: csrfToken },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(res.status(), 'POST /api/artefact-comments').toBe(200);
  return res.json();
}

// ── AC1/AC2: token tables ──────────────────────────────────────────────

withAuth('AC1: dark-mode computed CSS custom-property values match DESIGN.md dark token table', async ({ page }) => {
  await page.goto('/artefact/' + TEST_SLUG + '/discovery');
  await ensureTheme(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const tokens = await readTokens(page);
  expect(tokens).toEqual(DARK_TOKENS);
});

withAuth('AC2: light-mode computed CSS custom-property values match DESIGN.md light token table', async ({ page }) => {
  await page.goto('/artefact/' + TEST_SLUG + '/discovery');
  await ensureTheme(page, 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const tokens = await readTokens(page);
  expect(tokens).toEqual(LIGHT_TOKENS);
});

// ── AC3: layout + real functional cards ────────────────────────────────

withAuth('AC3: two-column layout with real, functional Sign-off and Comments cards matches DESIGN.md', async ({ page }) => {
  await page.goto('/artefact/' + TEST_SLUG + '/discovery');

  const layout = page.locator('.sw-artefact-layout');
  await expect(layout).toBeVisible();
  const columns = await layout.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  const parts = columns.trim().split(/\s+/);
  expect(parts.length, 'expected exactly 2 grid columns, got: ' + columns).toBe(2);
  expect(parts[1]).toBe('320px');

  const docFont = await page.locator('.sw-doc').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(docFont).toContain('Source Serif 4');

  await expect(page.locator('.sw-artefact-sidebar')).toBeVisible();

  // Sign-off card: real, interactive button — not static/placeholder markup.
  const signOffCard = page.locator('.sw-signoff-card');
  await expect(signOffCard).toBeVisible();
  await expect(page.locator('#sign-off-btn')).toBeVisible();
  await expect(page.locator('#sign-off-btn')).toBeEnabled();

  // Comments card: real form elements — not static/placeholder markup.
  const commentsCard = page.locator('.sw-comments-card');
  await expect(commentsCard).toBeVisible();
  await expect(page.locator('#comment-input')).toBeVisible();
  await expect(page.locator('#comment-submit-btn')).toBeVisible();
  await expect(page.locator('#comment-submit-btn')).toBeEnabled();
});

// ── AC5: Sign Off button sends the real request correctly (request-observation only) ──

withAuth('AC5: Sign Off button sends a real POST /sign-off with the correct artefactPath', async ({ page }) => {
  await page.goto('/artefact/' + TEST_SLUG + '/discovery');

  let signOffCallCount = 0;
  let observedBody = null;
  await page.route('**/sign-off', function(route) {
    if (route.request().method() === 'POST') {
      signOffCallCount++;
      try { observedBody = route.request().postDataJSON(); } catch (_) { observedBody = null; }
    }
    route.continue();
  });

  await page.click('#sign-off-btn');
  // Allow the fetch() in artefact-sidebar.js to actually fire before asserting.
  await page.waitForTimeout(300);

  expect(signOffCallCount, 'expected exactly one POST /sign-off request').toBe(1);
  expect(observedBody).toBeTruthy();
  expect(observedBody.artefactPath).toBe('artefacts/' + TEST_SLUG + '/discovery.md');
});

// ── AC6: already-signed-off artefact shows approver, not an active button ──

withAuth('AC6: already-signed-off artefact shows the existing approver/date, not an active Sign Off button', async ({ page }) => {
  await page.goto('/artefact/' + TEST_SLUG + '/signed-off');

  const signOffCard = page.locator('.sw-signoff-card');
  await expect(signOffCard).toBeVisible();
  await expect(signOffCard).toContainText('Jane Doe');
  await expect(signOffCard).toContainText('2026-09-18T10:00:00Z');

  // No active Sign Off button anywhere on the page that would only fail on click.
  await expect(page.locator('#sign-off-btn')).toHaveCount(0);
});

// ── AC7: comments list + empty state ───────────────────────────────────

withAuth('AC7: Comments card shows the empty state when an artefact has no comments', async ({ page }) => {
  await page.goto('/artefact/' + TEST_SLUG + '/comments-empty');

  await expect(page.locator('#comments-empty-state')).toBeVisible();
  await expect(page.locator('#comments-empty-state')).toContainText('No comments yet');
  await expect(page.locator('#comments-list')).toHaveCount(0);
});

withAuth('AC7: Comments card lists every existing comment oldest first with author/body/timestamp', async ({ page }) => {
  const request = page.context().request;
  const resourceId = TEST_SLUG + '/comments-seeded';
  const csrfToken = await getCsrfTokenFromArtefactPage(request, TEST_SLUG, 'comments-seeded');

  await seedComment(request, resourceId, 'first comment (oldest)', csrfToken);
  await seedComment(request, resourceId, 'second comment', csrfToken);
  await seedComment(request, resourceId, 'third comment (newest)', csrfToken);

  await page.goto('/artefact/' + TEST_SLUG + '/comments-seeded');

  await expect(page.locator('#comments-empty-state')).toHaveCount(0);
  const items = page.locator('#comments-list li');
  await expect(items).toHaveCount(3);

  const texts = await items.allTextContents();
  expect(texts[0]).toContain('first comment (oldest)');
  expect(texts[1]).toContain('second comment');
  expect(texts[2]).toContain('third comment (newest)');
  // Author (session login, e2e-tester) shown on every row.
  texts.forEach(function(t) { expect(t).toContain('e2e-tester'); });
});

// ── AC8: comment posts without reload ──────────────────────────────────

withAuth('AC8: submitting a comment persists it and it appears in the list without a full page reload', async ({ page }) => {
  await page.goto('/artefact/' + TEST_SLUG + '/comments-post');
  await expect(page.locator('#comments-empty-state')).toBeVisible();

  // Sentinel set only in this page's live JS context — a full navigation or
  // reload would wipe it, proving the update happened client-side in place.
  await page.evaluate(() => { window.__dsaS1NoReloadSentinel = true; });

  await page.fill('#comment-input', 'a brand new comment posted live');
  await page.click('#comment-submit-btn');

  const items = page.locator('#comments-list li');
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText('a brand new comment posted live');
  await expect(items.first()).toContainText('e2e-tester');
  await expect(page.locator('#comments-empty-state')).toHaveCount(0);

  const sentinelStillPresent = await page.evaluate(() => window.__dsaS1NoReloadSentinel === true);
  expect(sentinelStillPresent, 'expected the pre-set sentinel to survive — a full reload would have cleared it').toBe(true);

  // Input is cleared and no error is shown on success.
  await expect(page.locator('#comment-input')).toHaveValue('');
  await expect(page.locator('#comment-error')).toHaveText('');
});

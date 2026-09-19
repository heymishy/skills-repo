// dsa-s3-landing-restyle.spec.js — E2E coverage for dsa-s3 (restyle the
// REAL, live, unauthenticated GET / landing page -- src/web-ui/routes/public.js's
// handleRoot, which serves src/web-ui/templates/landing.html verbatim -- to
// match DESIGN.md's Marketing/landing pattern and token tables).
// Story: artefacts/2026-09-18-design-system-adoption/stories/dsa-s3.md
// Plan (Task 1): artefacts/2026-09-18-design-system-adoption/plans/dsa-s3-plan.md
//
// Realises AC1, AC2, AC3, AC5 (AC4 is verified separately by re-running the
// real, pre-existing 9 Node check-scripts + 5 E2E spec files this story's
// decisions.md corrected AC4 to reference -- not duplicated here).
//
// AC1/AC2 read the current, real light/dark token values directly from
// src/web-ui/utils/html-shell.js's `:root` / `[data-theme="dark"]` blocks --
// same 13-token set dsa-s1's and dsa-s2's own specs already established for
// this shared file, re-confirmed by a fresh grep+read at this story's own
// Task 1 time (not copied blindly).
//
// GET / is unauthenticated and public -- no withAuth fixture / session
// seeding needed, unlike dsa-s1's/dsa-s2's own specs for authenticated
// routes.
//
// Scope note (Task 1 Step 4, dsa-s3): the mock's "Product in action"
// browser-chrome screenshot section (sc-for/image-slot demo assets) was
// judged not buildable without real demo assets this codebase has no
// equivalent for, and was intentionally omitted from dsa-s3's own restyle
// pass -- see the task report / decisions.md for the explicit scope call.
// AC3's structural assertions below therefore do NOT assert a
// browser-chrome element exists; they assert the parts of the
// Marketing/landing pattern that ARE real and buildable (centered hero,
// full-bleed 1120px sections, a responsive 2-up grid) against the real,
// restyled page.
//
// dsa-s7 (below) closes that gap: it adds the "Product in action" section
// with a simpler, single static placeholder (no tab-switching carousel) --
// see that section's own header comment further down this file.

'use strict';

const { test, expect } = require('@playwright/test');

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

// Same mechanism as dsa-s1's/dsa-s2's own specs: calls the exact global
// function the landing page's own new theme-toggle button's onclick invokes
// (adapted from html-shell.js's SHELL_JS for this standalone, unauthenticated
// page), so the toggle under test is byte-for-byte identical to a real click.
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

// ── AC1/AC2: token tables ──────────────────────────────────────────────

test('AC1: dark-mode computed CSS custom-property values match DESIGN.md dark token table', async ({ page }) => {
  await page.goto('/');
  await ensureTheme(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const tokens = await readTokens(page);
  expect(tokens).toEqual(DARK_TOKENS);
});

test('AC2: light-mode computed CSS custom-property values match DESIGN.md light token table', async ({ page }) => {
  await page.goto('/');
  await ensureTheme(page, 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const tokens = await readTokens(page);
  expect(tokens).toEqual(LIGHT_TOKENS);
});

// ── AC3: Marketing/landing layout pattern ──────────────────────────────

test('AC3: layout matches DESIGN.md\'s Marketing/landing pattern (centered hero, full-bleed 1120px sections, responsive 2-up grid)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  // Centered hero, max-width ~900px copy.
  const hero = page.locator('.hero');
  await expect(hero).toBeVisible();
  const heroMaxWidth = await hero.evaluate((el) => getComputedStyle(el).maxWidth);
  expect(heroMaxWidth).toBe('900px');

  // At least one full-bleed section below the hero at max-width 1120px.
  const goldenTraceWrap = page.locator('#golden-trace-demo');
  await expect(goldenTraceWrap).toBeVisible();
  const gtMaxWidth = await goldenTraceWrap.evaluate((el) => getComputedStyle(el).maxWidth);
  expect(gtMaxWidth).toBe('1120px');

  const heroCardsGrid = page.locator('.hero-cards-grid');
  await expect(heroCardsGrid).toBeVisible();
  const heroCardsWrap = page.locator('.section-1120', { has: page.locator('.hero-cards-grid') });
  const gridMaxWidth = await heroCardsWrap.evaluate((el) => getComputedStyle(el).maxWidth);
  expect(gridMaxWidth).toBe('1120px');

  // Responsive 2-up grid: scope-contract and crypto-verification cards sit
  // side by side at desktop width (AC5's mobile collapse is asserted
  // separately below).
  const scopeCard = page.locator('[data-hero="scope-contract"]');
  const cryptoCard = page.locator('[data-hero="crypto-verification"]');
  await expect(scopeCard).toBeVisible();
  await expect(cryptoCard).toBeVisible();
  const scopeBox = await scopeCard.boundingBox();
  const cryptoBox = await cryptoCard.boundingBox();
  expect(scopeBox.y).toBeCloseTo(cryptoBox.y, 0);
  expect(cryptoBox.x).toBeGreaterThan(scopeBox.x);

  // Golden-trace demo's 4 real frames remain present (real, pre-existing
  // content, not a mock-only placeholder -- must survive the restyle).
  await expect(page.locator('.gt-frame')).toHaveCount(4);

  // Self-improving card remains present too (real, pre-existing content).
  await expect(page.locator('[data-hero="self-improving"]')).toBeVisible();

  // Auth panel remains present and functionally unchanged.
  await expect(page.locator('.auth-panel')).toBeVisible();
});

// ── AC5: mobile viewport -- no horizontal overflow, single-column collapse ──

for (const size of [{ width: 375, height: 667 }, { width: 390, height: 844 }]) {
  test(`AC5: no horizontal overflow at ${size.width}px, hero/copy stay single-column, hero-cards grid collapses`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(size.width);

    // Hero and copy remain visible, legible, single-column.
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.value-prop')).toBeVisible();

    // The hero-cards 2-up grid collapses to a single column below 768px --
    // the exact defect class dsa-s2's dashboard shipped and had to log as a
    // post-merge gap (fixed-column grid, no breakpoint). Assert the two
    // cards now stack vertically (same x, different y) rather than sit
    // side by side.
    const scopeCard = page.locator('[data-hero="scope-contract"]');
    const cryptoCard = page.locator('[data-hero="crypto-verification"]');
    await expect(scopeCard).toBeVisible();
    await expect(cryptoCard).toBeVisible();
    const scopeBox = await scopeCard.boundingBox();
    const cryptoBox = await cryptoCard.boundingBox();
    expect(cryptoBox.x).toBeCloseTo(scopeBox.x, 0);
    expect(cryptoBox.y).toBeGreaterThan(scopeBox.y);

    // Golden-trace demo's 4 real frames also collapse to a single column
    // and remain visible/readable.
    const frames = page.locator('.gt-frame');
    await expect(frames).toHaveCount(4);
    const f0 = await frames.nth(0).boundingBox();
    const f1 = await frames.nth(1).boundingBox();
    expect(f1.x).toBeCloseTo(f0.x, 0);
    expect(f1.y).toBeGreaterThan(f0.y);

    // Auth panel stays functional and readable (real GitHub button visible
    // with a non-zero width, matching the pre-existing lphf-s5-responsive
    // spec's own established assertion shape for this element).
    const githubBtn = page.locator('.auth-btn--github');
    await expect(githubBtn).toBeVisible();
    const box = await githubBtn.boundingBox();
    expect(box.width).toBeGreaterThan(0);
  });
}

// ── dsa-s7: "Product in action" demo section ──────────────────────────────
// Story: artefacts/2026-09-18-design-system-adoption/stories/dsa-s7.md
// Plan (Task 1): artefacts/2026-09-18-design-system-adoption/plans/dsa-s7-plan.md
//
// Adds the browser-chrome-framed "Product in action" section dsa-s3
// deliberately omitted (see the scope note above). The mock's own
// tab-switching 3-frame carousel is replaced (operator-confirmed, see
// decisions.md) with a single static placeholder -- no JS switching logic.
//
// Realises AC1 (section + browser-chrome frame structure, real token
// colors), AC2 (honest static placeholder text, not broken/blank), AC4
// (dark/light mode computed token values), AC5 (real mobile-viewport
// overflow/scaling check at 375px/390px). AC3 (swap-in simplicity) is
// verified by code review per the story's own test plan, not an automated
// test here. AC6 (regression) is verified by re-running dsa-s3's own full
// regression suite unmodified (this same spec file included), not a new
// test in this block.

test('dsa-s7 AC1: "Product in action" section present with browser-chrome frame (dots + URL label) using real dark-mode token colors', async ({ page }) => {
  await page.goto('/');
  await ensureTheme(page, 'dark');

  await expect(page.getByRole('heading', { name: 'Product in action' })).toBeVisible();
  await expect(page.locator('.demo-frame')).toBeVisible();

  const dots = page.locator('.demo-frame__dot');
  await expect(dots).toHaveCount(3);
  const dangerColor = await dots.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor);
  const warnColor = await dots.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor);
  const successColor = await dots.nth(2).evaluate((el) => getComputedStyle(el).backgroundColor);
  // rgb() equivalents of the real dark-mode --danger/--warn/--success tokens.
  expect(dangerColor).toBe('rgb(248, 113, 113)');   // #F87171
  expect(warnColor).toBe('rgb(245, 158, 11)');       // #F59E0B
  expect(successColor).toBe('rgb(52, 211, 153)');    // #34D399

  const urlLabel = page.locator('.demo-frame__url');
  await expect(urlLabel).toBeVisible();
  await expect(urlLabel).toHaveText(/\./); // reads a real/representative domain
  const urlColor = await urlLabel.evaluate((el) => getComputedStyle(el).color);
  expect(urlColor).toBe('rgb(107, 114, 128)'); // #6B7280 == --muted-2 (dark)
});

test('dsa-s7 AC2: placeholder inside the demo frame is a real, honest "coming soon" message, not blank or a broken image', async ({ page }) => {
  await page.goto('/');

  const placeholder = page.locator('.demo-frame__placeholder');
  await expect(placeholder).toBeVisible();
  const text = ((await placeholder.textContent()) || '').trim();
  expect(text.length).toBeGreaterThan(0);
  expect(text.toLowerCase()).toMatch(/coming soon/);

  // Not a broken/empty <img> -- no <img> element exists in the demo frame yet.
  await expect(page.locator('.demo-frame img')).toHaveCount(0);
});

test('dsa-s7 AC4: "Product in action" frame border/background/placeholder-text colors match DESIGN.md\'s dark and light token tables', async ({ page }) => {
  await page.goto('/');

  await ensureTheme(page, 'dark');
  let frameBorder = await page.locator('.demo-frame').evaluate((el) => getComputedStyle(el).borderTopColor);
  let chromeBg = await page.locator('.demo-frame__chrome').evaluate((el) => getComputedStyle(el).backgroundColor);
  let placeholderColor = await page.locator('.demo-frame__placeholder').evaluate((el) => getComputedStyle(el).color);
  expect(frameBorder).toBe('rgb(35, 39, 46)');         // #23272E == --line (dark)
  expect(chromeBg).toBe('rgb(22, 26, 31)');            // #161A1F == --surface-2 (dark)
  expect(placeholderColor).toBe('rgb(154, 161, 171)'); // #9AA1AB == --muted (dark)

  await ensureTheme(page, 'light');
  frameBorder = await page.locator('.demo-frame').evaluate((el) => getComputedStyle(el).borderTopColor);
  chromeBg = await page.locator('.demo-frame__chrome').evaluate((el) => getComputedStyle(el).backgroundColor);
  placeholderColor = await page.locator('.demo-frame__placeholder').evaluate((el) => getComputedStyle(el).color);
  expect(frameBorder).toBe('rgb(228, 231, 235)');      // #E4E7EB == --line (light)
  expect(chromeBg).toBe('rgb(242, 243, 245)');         // #F2F3F5 == --surface-2 (light)
  expect(placeholderColor).toBe('rgb(107, 114, 128)'); // #6B7280 == --muted (light)
});

for (const size of [{ width: 375, height: 667 }, { width: 390, height: 844 }]) {
  test(`dsa-s7 AC5: demo frame scales without horizontal overflow at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(size.width);

    const frame = page.locator('.demo-frame');
    await expect(frame).toBeVisible();
    const box = await frame.boundingBox();
    expect(box.width).toBeLessThanOrEqual(size.width);
  });
}

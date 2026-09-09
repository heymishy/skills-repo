// tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js
//
// jasb-s1: /journey's unconditional autofocus on the "new feature" input
// auto-scrolls the browser past the entire feature list on every page load.
// Root cause: journey.js's #jh-fname input carried an unconditional
// `autofocus` attribute; with 269 non-terminal features on wuce-staging
// (no pagination), the browser auto-scrolled ~26,900px to bring that
// bottom-of-page input into view on every plain /journey load.
//
// Seeds many synthetic journeys via the existing /test/seed-durable-stage
// endpoint (same pattern as tests/e2e/ep1-s4-stage-selector.spec.js) so the
// rendered page is taller than the viewport — otherwise this test can't
// distinguish "no scroll happened" from "there was nothing to scroll to".

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function seedStage(request, featureSlug, stageName) {
  const res = await request.post('/test/seed-durable-stage', {
    data: { featureSlug, stageName, tenantId: 'e2e-tester' }
  });
  return res.json();
}

async function seedManyJourneys(request, prefix, count) {
  for (let i = 0; i < count; i++) {
    await seedStage(request, `${prefix}-${i}-${Date.now()}`, 'discovery');
  }
}

// ── AC1: plain /journey load is not auto-scrolled ──────────────────────────

withAuth('AC1: /journey loads scrolled to top, not auto-scrolled to the bottom', async ({ page, request }) => {
  await seedManyJourneys(request, 'jasb-s1-ac1-scenario1', 40);

  await page.goto('/journey');

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBe(0);

  const activeElementId = await page.evaluate(() => document.activeElement && document.activeElement.id);
  expect(activeElementId).not.toBe('jh-fname');
});

// ── AC2: explicit "+ New feature" entry point is unchanged ─────────────────

withAuth('AC2: /journey?new=1 still autofocuses and scrolls #jh-fname into view', async ({ page, request }) => {
  await seedManyJourneys(request, 'jasb-s1-ac2-scenario1', 40);

  await page.goto('/journey?new=1');

  const input = page.locator('#jh-fname');
  await expect(input).toBeFocused();
  await expect(input).toBeInViewport();
});

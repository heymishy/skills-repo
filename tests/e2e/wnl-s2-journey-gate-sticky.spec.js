// tests/e2e/wnl-s2-journey-gate-sticky.spec.js
//
// wnl-s2: make the "Continue to [next stage] ->" journey-gate control
// (.sw-journey-gate) stay reachable regardless of scroll position, instead
// of scrolling away with the rest of the chat once a session has real
// history. Fix: position:sticky;bottom:0 on the existing .sw-journey-gate
// div (src/web-ui/routes/skills.js ~line 4569), reusing the same technique
// already live in production for .sw-imp-banner (html-shell.js).
//
// Seeds a "done" skill-session chat with an active journey gate via the new
// /test/seed-journey-gate-session endpoint (mirrors seed-definition-session's
// own _setHtmlSession pattern), with enough padded turns that the rendered
// page exceeds the viewport height -- otherwise this test can't distinguish
// "stayed sticky" from "nothing to scroll past" (same reasoning jasb-s1's
// own AC1 test used this session).

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function seedGateSession(request, skillName, turnCount) {
  const res = await request.post('/test/seed-journey-gate-session', {
    data: { skillName: skillName || 'discovery', turnCount: turnCount || 1 }
  });
  return res.json();
}

// ── AC1: gate stays visible when scrolled up through history ───────────────

withAuth('AC1: journey gate stays sticky at the bottom when scrolled up through history', async ({ page, request }) => {
  const { sessionId } = await seedGateSession(request, 'discovery', 30);

  await page.goto(`/skills/discovery/sessions/${sessionId}/chat`);

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(scrollHeight).toBeGreaterThan(viewportHeight);

  await page.evaluate(() => window.scrollTo(0, 0));

  const gate = page.locator('.sw-journey-gate');
  await expect(gate).toBeInViewport();
});

// ── AC3: short session — control not visually misplaced ────────────────────

withAuth('AC3: journey gate renders in its normal position in a short session', async ({ page, request }) => {
  const { sessionId } = await seedGateSession(request, 'discovery', 1);

  await page.goto(`/skills/discovery/sessions/${sessionId}/chat`);

  const gate = page.locator('.sw-journey-gate');
  await expect(gate).toBeVisible();

  const gateBox = await gate.boundingBox();
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  // The gate should sit close to the bottom of the actual (short) rendered
  // content, not pinned an artificial distance further down a page that
  // doesn't have that much real content.
  expect(gateBox.y + gateBox.height).toBeLessThanOrEqual(scrollHeight + 5);
});

// ── AC5: sticky control doesn't create a dead zone ──────────────────────────

withAuth('AC5: a sub-step affordance button near the sticky gate stays clickable', async ({ page, request }) => {
  const { sessionId } = await seedGateSession(request, 'discovery', 1);

  await page.goto(`/skills/discovery/sessions/${sessionId}/chat`);

  const clarifyBtn = page.locator('#sw-clarify-btn');
  await expect(clarifyBtn).toBeVisible();
  // Playwright's own actionability check fails if another element (e.g. the
  // sticky gate) visually covers the target -- a successful click is
  // sufficient evidence no dead zone exists.
  await clarifyBtn.click();
});

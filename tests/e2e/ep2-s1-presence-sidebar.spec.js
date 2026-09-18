// tests/e2e/ep2-s1-presence-sidebar.spec.js — story ep2-s1
// artefacts/new-feature-2b74a292/stories/ep2-s1.md
//
// Follows the real product -> repo -> pod -> feature creation flow
// established by tests/e2e/ep1-s3-feature-pod-inheritance.spec.js, rather
// than the original implementation plan's assumption of a pre-seeded
// fixture slug (there is no such fixture in this codebase's real E2E
// harness). See decisions.md (2026-09-18) for the Task 6 correction.
//
// Roster note: the plan's ACs referenced fictional names "Hamish",
// "Susan", "Darren" with specific roles. All three are, in fact, real
// entries in this test environment's demo ORG_ROSTER
// (src/web-ui/public/pod-manager.html) -- Hamish (roleId 'conductor'),
// Susan (roleId 'engineer'), Darren (roleId 'engineer'). This spec uses
// Hamish and Susan (2 explicitly-added collaborators) plus the
// auto-included creator "You" (userId 'me-uuid', roleId 'conductor', per
// pod-manager.html's openModal()) = 3 total collaborators, rather than
// forcing the original fictional 3-named headcount.
//
// AC1: after creating the feature and navigating to the real
// /features/:featureSlug page (slug obtained from the real feature-row
// link on the product page, mirroring frsr-s1's own established pattern
// -- NOT predicted client-side from displayName/date, which would be
// fragile across a UTC-midnight boundary), the Team sidebar renders with
// the expected collaborators and roles.
//
// AC2/AC3: presence-store.js has no existing mechanism to simulate a
// collaborator going offline without waiting 30+ real seconds. Task 6
// adds a test-only POST /test/seed-presence endpoint (server.js) plus
// presence-store._seedStaleActivity, following this codebase's
// established /test/seed-* convention (see /test/seed-product-repo).
// AC2 seeds a collaborator online (small ageMs) then stale (ageMs past
// STALE_MS=30000) and confirms the SSE-driven sidebar (presence-stream
// broadcasts every 5s) reflects both states without a page reload. AC3
// confirms the client-side per-second "last seen" tick (no network
// round-trip) advances the displayed text once real time crosses the
// next whole-minute boundary.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

function uniqueName(label) {
  return 'ep2-s1-' + label + '-' + Date.now();
}

withAuth('ep2-s1: Team presence sidebar renders real collaborators/roles (AC1), reflects live SSE online/offline transitions (AC2), and ticks last-seen text client-side (AC3)', async ({ page }) => {
  // Generous budget: pod-creation UI flow + feature creation + two SSE
  // broadcast waits (~5-7s each) + the AC3 minute-boundary wait
  // (~30-40s, see rationale below) + normal navigation overhead.
  test.setTimeout(150000);

  const productName = uniqueName('product');
  const podName = uniqueName('pod');

  // --- Setup: product -> repo seed -> pod (real UI) -> default pod ---
  // (mirrors ep1-s3-feature-pod-inheritance.spec.js's established fixture flow)

  const draftRes = await page.request.post('/products/new', {
    data: { name: productName, description: 'ep2-s1 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status()).toBe(200);
  const newPageCsrf = await getCsrfToken(page.request, '/products/new', 'products/new page');
  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: productName, description: 'ep2-s1 E2E fixture product.', _csrf: newPageCsrf },
    maxRedirects: 0
  });
  expect(confirmRes.status()).toBe(302);
  const productId = confirmRes.headers()['location'].split('/products/')[1];

  const repoSeedRes = await page.request.post('/test/seed-product-repo', { data: { productId: productId } });
  expect(repoSeedRes.status()).toBe(200);

  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', podName);
  await page.locator('.roster-row', { hasText: 'Hamish' }).getByRole('button', { name: 'Add' }).click();
  await page.locator('.roster-row', { hasText: 'Susan' }).getByRole('button', { name: 'Add' }).click();
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toBeVisible();

  await page.goto('/products/' + productId);
  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: podName });
  await page.click('#confirm-default-pod-btn');
  await expect(page.locator('#default-pod-display')).toContainText(podName);

  // --- Create the feature via the real handler ---

  const productPageCsrf = await getCsrfToken(page.request, '/products/' + productId, 'product page');
  const featureRes = await page.request.post('/products/' + productId + '/features', {
    form: { displayName: 'Ep2 S1 Presence Sidebar E2E Feature', _csrf: productPageCsrf },
    maxRedirects: 0
  });
  expect(featureRes.status(), 'feature creation should redirect to a discovery chat session').toBe(303);
  const location = featureRes.headers()['location'] || '';
  const sessionIdMatch = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(location);
  expect(sessionIdMatch, 'redirect Location should carry a session id').not.toBeNull();
  const sessionId = sessionIdMatch[1];

  // Resolve journeyId server-side (same test-only endpoint ep1-s3 uses) --
  // also doubles as confirmation that pod-inheritance populated exactly
  // the 3 collaborators this spec expects (You + Hamish + Susan).
  const podStateRes = await page.request.get('/test/pod-inheritance-state/' + encodeURIComponent(sessionId));
  expect(podStateRes.status()).toBe(200);
  const podState = await podStateRes.json();
  expect(podState.collaboratorCount).toBe(3);
  const journeyId = podState.featureId;
  expect(journeyId, 'expected a journeyId resolved from the session').toBeTruthy();

  // Get the REAL featureSlug from the feature row link on the product
  // page (frsr-s1's established pattern) -- do not predict it client-side
  // from displayName/date, which is fragile across a UTC-midnight boundary.
  //
  // pdt-s1 (AC2): feature rows render inside a collapsible group
  // ("Other features (N) ...") that starts collapsed by default
  // (aria-expanded="false", a4-module-body--collapsed) -- the row exists
  // in the DOM immediately but is not visible until its group header is
  // expanded. Confirmed via a failed run's accessibility snapshot showing
  // the row nested under a collapsed "Other features" group button.
  // Scoped to the (active-by-default) "By Phase" tab panel specifically --
  // the "By Module" panel ALSO renders a same-shaped collapsible group
  // ("Unclassified", since modules.length === 0) containing its own copy
  // of this row, but that whole panel is display:none (inactive tab), so
  // an unscoped `a.pvc-item-link` locator's .first() picks up that
  // earlier-in-DOM-order, permanently-hidden copy instead of the one this
  // spec actually expands and navigates to.
  await page.goto('/products/' + productId);
  await page.getByRole('button', { name: /Other features/ }).click();
  const featureLink = page.locator('#pvc-tab-panel-phase a.pvc-item-link').first();
  await expect(featureLink).toBeVisible();
  const featureHref = await featureLink.getAttribute('href');
  expect(featureHref, 'expected the feature row link to point at /features/:slug').toMatch(/^\/features\//);

  // --- AC1: navigate to the real feature page; Team sidebar renders the ---
  // --- expected collaborators with their roles ---

  await page.goto(featureHref);
  await expect(page.locator('#team-sidebar')).toBeVisible();

  const presenceItems = page.locator('#team-sidebar-list .presence-item');
  // Initial render is populated by an async fetch (collaborators-presence)
  // that runs after the script tag executes -- wait for the expected count
  // rather than asserting synchronously.
  await expect(presenceItems).toHaveCount(3, { timeout: 10000 });

  await expect(presenceItems.filter({ hasText: 'me-uuid' })).toContainText('conductor');
  // ORG_ROSTER (pod-manager.html): Hamish's demo roleId is 'conductor'
  // (same tag as the creator's), Susan's is 'engineer' -- confirmed by
  // reading the actual roster data rather than assuming from name.
  await expect(presenceItems.filter({ hasText: 'hamish-uuid' })).toContainText('conductor');
  await expect(presenceItems.filter({ hasText: 'susan-uuid' })).toContainText('engineer');

  // NFR-A11y-1 (keyboard nav, cheap check): each presence-item is
  // individually focusable (tabIndex=0, presence-sidebar.js render()) and
  // Tab moves focus sequentially through the list -- verified starting
  // from an item already focused (rather than a blind repeated Tab press
  // from page load, which would depend on unrelated page chrome/nav
  // elements ahead of the sidebar in DOM order).
  await presenceItems.nth(0).focus();
  await expect(presenceItems.nth(0)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(presenceItems.nth(1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(presenceItems.nth(2)).toBeFocused();

  // --- AC2: seed Hamish online, then stale, and confirm the SSE-driven ---
  // --- (no page reload) sidebar reflects both states ---

  const hamishItem = presenceItems.filter({ hasText: 'hamish-uuid' });

  // Online: seeded 1s ago, well under STALE_MS (30000ms).
  const onlineSeedRes = await page.request.post('/test/seed-presence', {
    data: { journeyId: journeyId, login: 'hamish-uuid', ageMs: 1000 }
  });
  expect(onlineSeedRes.status()).toBe(200);
  // presence-stream broadcasts every 5s -- allow one broadcast cycle plus margin.
  await expect(hamishItem).toHaveClass(/presence-online/, { timeout: 8000 });
  await expect(hamishItem).not.toContainText('offline');

  // Now push the same collaborator's last activity past STALE_MS.
  const staleAgeMs = 35000; // > STALE_MS (30000)
  const staleSeedRes = await page.request.post('/test/seed-presence', {
    data: { journeyId: journeyId, login: 'hamish-uuid', ageMs: staleAgeMs }
  });
  expect(staleSeedRes.status()).toBe(200);
  const staleSeededAt = Date.now();
  await expect(hamishItem).toHaveClass(/presence-offline/, { timeout: 8000 });
  await expect(hamishItem).toContainText('offline');
  await expect(hamishItem).toContainText('last seen');

  // --- AC3: the client-side per-second tick (no network round trip) ---
  // --- advances the "last seen" text once real time crosses the next ---
  // --- whole-minute boundary ---
  //
  // fmtLastSeen() (presence-sidebar.js) displays whole minutes only
  // (Math.floor(ageMs / 60000)), showing "just now" for any age under 1
  // minute. The stale seed above set the collaborator's age to 35s, so it
  // is already most of the way to the 60s boundary -- waiting the full
  // ~61s the plan's literal example suggested is not necessary here;
  // waiting for real time to carry the already-35s-old timestamp past the
  // 60s mark is enough, which needs only ~25-30s more of real time, not a
  // fresh 61s from zero. Poll (not a fixed sleep) so the assertion
  // resolves as soon as the boundary is crossed rather than always
  // waiting the worst case.
  const initialLastSeenText = await hamishItem.textContent();
  expect(initialLastSeenText).toMatch(/just now|0m ago/);

  const elapsedSinceStaleSeed = Date.now() - staleSeededAt;
  const msUntilMinuteBoundary = staleAgeMs + elapsedSinceStaleSeed < 60000
    ? (60000 - staleAgeMs - elapsedSinceStaleSeed)
    : 0;
  // Poll timeout: remaining time to the boundary + generous margin for
  // the 1s client tick / 5s SSE cadence.
  await expect(hamishItem).toContainText(/\d+m ago/, { timeout: msUntilMinuteBoundary + 15000 });

  const laterLastSeenText = await hamishItem.textContent();
  expect(laterLastSeenText).not.toBe(initialLastSeenText);
});

// tests/e2e/ep4-s1-multi-pod-assign.spec.js
// @mocked
//
// ep4-s1 Task 6: this test exists because AC1 ("a selector listing all of
// the organisation's pods, allowing more than one to be selected") is a
// rendered-UI acceptance criterion -- a modal, a multi-select control -- that
// Task 5's handler-level integration test (tests/check-ep4-s1-multi-pod-
// assign.js) cannot verify: it only proves the JSON contract of
// handleGetFeaturePods/handlePostAssignFeaturePods/handleDeleteFeaturePod
// Member, not that the "⚙ Pods" button/modal/checkboxes actually render and
// behave correctly in a browser. Per CLAUDE.md's CSS-layout-dependent-AC
// rule, this is the automated-test path (not a RISK-ACCEPT).
//
// Seeding follows tests/e2e/ep1-s3-feature-pod-inheritance.spec.js's own
// recipe verbatim (real product -> real repo seed -> real pod via the
// /admin/pods/manager UI -> real default-pod set via the product page UI ->
// real feature via POST /products/:id/features): create product, connect a
// repo (das-s2's gate on a product's FIRST feature), create Pod A and set it
// as the product's default pod, then create the feature -- which
// auto-inherits Pod A per ep1-s3's own existing behaviour. That means this
// feature starts with ONE pod already assigned, not zero -- the exact
// pre-checked-checkbox scenario AC1 requires coverage for.
//
// Playwright's own webServer runs with NODE_ENV=test and no DATABASE_URL
// (playwright.config.js), so server.js wires _pshPool to a REAL
// createFakeTestDb() instance (bri-s3.2) -- the same in-memory adapter used
// by the Node-script unit tests. This means the real running webServer
// process genuinely exercises the real ep4-s1 handlers against that fake
// adapter; nothing here is mocked at the handler/store level.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

function uniqueName(label) {
  return 'ep4-s1-' + label + '-' + Date.now();
}

withAuth('ep4-s1 AC1/AC2/AC3: assign multiple pods to a feature via the real modal, then remove one collaborator', async ({ page }) => {
  const productName = uniqueName('product');
  const podAName = uniqueName('core-platform-pod');
  const podBName = uniqueName('data-analytics-pod');
  const featureDisplayName = uniqueName('feature');

  // --- Create a real product (page.request-driven, established pattern from bmau-s1/ep1-s2/ep1-s3) ---
  const draftRes = await page.request.post('/products/new', {
    data: { name: productName, description: 'ep4-s1 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status()).toBe(200);
  const newPageCsrf = await getCsrfToken(page.request, '/products/new', 'products/new page');
  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: productName, description: 'ep4-s1 E2E fixture product.', _csrf: newPageCsrf },
    maxRedirects: 0
  });
  expect(confirmRes.status()).toBe(302);
  const productId = confirmRes.headers()['location'].split('/products/')[1];

  // das-s2's repo-connection gate needs a repo before the product's FIRST
  // feature can be created -- seed one via the same test-only fixture
  // endpoint bmau-s1's own spec already establishes for exactly this reason.
  const repoSeedRes = await page.request.post('/test/seed-product-repo', { data: { productId: productId } });
  expect(repoSeedRes.status()).toBe(200);

  // --- Create Pod A via the real /admin/pods/manager UI, add a member other than the creator ---
  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', podAName);
  await page.locator('.roster-row', { hasText: 'Hamish' }).getByRole('button', { name: 'Add' }).click();
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toBeVisible();

  // --- Set Pod A as this product's default pod (real UI, ep1-s2's own feature) ---
  await page.goto('/products/' + productId);
  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: podAName });
  await page.click('#confirm-default-pod-btn');
  await expect(page.locator('#default-pod-display')).toContainText(podAName);

  // --- Create the feature under this product via the REAL handler ---
  // It auto-inherits Pod A (ep1-s3), so it starts with exactly one pod
  // assigned and 2 collaborators (the pod creator "me-uuid" + "hamish-uuid",
  // per pod-manager.html's ORG_ROSTER/creator-pre-include convention).
  const productPageCsrf = await getCsrfToken(page.request, '/products/' + productId, 'product page');
  const featureRes = await page.request.post('/products/' + productId + '/features', {
    form: { displayName: featureDisplayName, _csrf: productPageCsrf },
    maxRedirects: 0
  });
  expect(featureRes.status(), 'feature creation should redirect to a discovery chat session').toBe(303);

  // --- Create a SECOND real pod, with a different member, for the multi-select assertion ---
  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', podBName);
  await page.locator('.roster-row', { hasText: 'Susan' }).getByRole('button', { name: 'Add' }).click();
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toBeVisible();

  // --- Navigate to the product page where the feature is listed ---
  await page.goto('/products/' + productId);

  // ep4-s1: _renderConsolidatedFeaturesSection renders the SAME feature row
  // into 3 separate tab panels at once (By Module / By Phase / All), all
  // present in the DOM simultaneously with only one panel made visible via a
  // CSS class (pvcShowTab). Switch to the "All" tab explicitly and scope
  // every row-button locator to its panel below -- otherwise
  // button[aria-label="Assign pods to ..."] resolves to 3 elements and
  // Playwright's strict-mode locator throws.
  // ep4-s1 debugging note: the row's displayName text (and so its aria-label)
  // is NOT the raw featureDisplayName we submitted -- confirmed empirically
  // via the rendered page snapshot -- it is item.slug (handlePostProductFeature's
  // date-prefixed featureSlug, e.g. "2026-09-22-<slugified-name>"), because
  // item.name is unset for a feature with no discovery artefact yet.
  // _renderPvcItemRow's own `var displayName = item.name || item.slug;`
  // confirms this fallback. Match on a CONTAINS selector against
  // featureDisplayName (which the slug always embeds verbatim, undashed and
  // unchanged by slugify since it has no spaces/special chars) instead of
  // hardcoding today's date into the test.
  await page.click('#pvc-tab-all');
  const allPanel = page.locator('#pvc-tab-panel-all');
  const podsBtnSelector = 'button[aria-label*="Assign pods to "][aria-label*="' + featureDisplayName + '"]';
  const podsBtn = allPanel.locator(podsBtnSelector);
  await expect(podsBtn).toBeVisible();
  await podsBtn.click();

  // --- AC1: modal opens, lists BOTH pods as checkboxes, inherited default pod already checked ---
  const modal = page.locator('#ep4s1-pods-modal');
  await expect(modal).toBeVisible();
  await expect(page.locator('#ep4s1-modal-title')).toContainText(featureDisplayName);

  const checkboxes = modal.locator('.ep4s1-pod-checkbox');
  await expect(checkboxes).toHaveCount(2);

  const podACheckbox = modal.locator('label', { hasText: podAName }).locator('.ep4s1-pod-checkbox');
  const podBCheckbox = modal.locator('label', { hasText: podBName }).locator('.ep4s1-pod-checkbox');
  await expect(podACheckbox).toBeChecked();
  await expect(podBCheckbox).not.toBeChecked();

  // --- Multi-select: check Pod B too (both now selected), then Save ---
  await podBCheckbox.check();
  await expect(podACheckbox).toBeChecked();
  await expect(podBCheckbox).toBeChecked();

  // ep4s1Save() calls location.reload() on success -- wait for the real
  // full-page load it triggers before touching the DOM again, since the
  // page's whole document (including the tab state) is about to be replaced.
  await page.click('#ep4s1-save-btn');
  await page.waitForLoadState('load');

  // --- Re-open the modal for the same feature: both pods now show as assigned ---
  await page.click('#pvc-tab-all');
  await page.locator('#pvc-tab-panel-all').locator(podsBtnSelector).click();
  await expect(modal).toBeVisible();

  await expect(modal.locator('label', { hasText: podAName }).locator('.ep4s1-pod-checkbox')).toBeChecked();
  await expect(modal.locator('label', { hasText: podBName }).locator('.ep4s1-pod-checkbox')).toBeChecked();

  // --- "Current collaborators" lists members from BOTH pods ---
  // me-uuid: the creator, pre-included in every pod created above (design.md
  // convention -- see pod-manager.html's openModal()). hamish-uuid: Pod A's
  // explicitly-added member. susan-uuid: Pod B's explicitly-added member.
  // populateFeatureCollaboratorsFromPods (Task 1) unions both pods' members
  // and de-duplicates me-uuid (present in both pods), so the union is
  // exactly these 3 -- not 4.
  const collaboratorSection = page.locator('#ep4s1-modal-pods');
  await expect(collaboratorSection).toContainText('Current collaborators');
  await expect(collaboratorSection).toContainText('me-uuid');
  await expect(collaboratorSection).toContainText('hamish-uuid');
  await expect(collaboratorSection).toContainText('susan-uuid');

  // --- AC2: remove one collaborator, confirm they disappear from the modal on the next open ---
  await page.click('button[aria-label="Remove hamish-uuid from this feature"]');
  // ep4s1RemoveMember() re-opens the modal in place (no page reload) after a
  // successful DELETE -- assert against the re-rendered DOM, not a reload.
  await expect(collaboratorSection).not.toContainText('hamish-uuid');
  await expect(collaboratorSection).toContainText('me-uuid');
  await expect(collaboratorSection).toContainText('susan-uuid');
});

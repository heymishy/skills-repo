// artefact-preview.spec.js — E2E placeholder for wuce.14 (incremental artefact preview)
// AC1: active skill session shows partial artefact in preview panel after ≥1 answer
// AC2: preview panel updates after each answer without full page reload (polling)
// AC3: markdown tables and code blocks rendered as HTML — not raw markdown syntax
// AC4: preview content is sanitised before DOM insertion — no script/iframe injection
// AC5: final artefact preview activates "Commit artefact to repository" button
//
// Status: placeholder — todo stubs only; real assertions added by wuce.14 subagent.
// Infrastructure smoke test (one passing) proves Playwright can reach the server.

const { test, expect } = require('@playwright/test');

test('smoke: page loads without error', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
});

test.skip('AC1: after submitting ≥1 answer in an active skill session, preview panel alongside the form shows current partial artefact content formatted as prose (not raw markdown)', async () => { /* placeholder — implemented by wuce.14 */ });

test.skip('AC2: preview panel content updates after each answer submission without a full page reload — polled from session state endpoint', async () => { /* placeholder — implemented by wuce.14 */ });

test.skip('AC3: markdown tables in artefact preview render as HTML tables; code blocks render with monospace formatting — not raw markdown syntax', async () => { /* placeholder — implemented by wuce.14 */ });

test.skip('AC4: preview content is sanitised before DOM insertion — script tags, inline event handlers, and iframe injections are stripped or escaped', async () => { /* placeholder — implemented by wuce.14 */ });

test.skip('AC5: when all questions are completed and final artefact is generated, "Commit artefact to repository" button becomes active in the preview panel', async () => { /* placeholder — implemented by wuce.14 */ });

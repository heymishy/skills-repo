// artefact-writeback.spec.js — E2E placeholder for wuce.15 (artefact write-back)
// AC1: clicking "Commit artefact to repository" commits artefact to expected path under user identity
// AC2: committed artefact shows authenticated user as git author and committer
// AC3: server rejects write-back to paths outside artefacts/ with 400 error
// AC4: Contents API conflict returns "Artefact already exists" message with option to view existing
// AC5: successful write-back shows repository link and commit SHA on confirmation page
//
// Status: placeholder — todo stubs only; real assertions added by wuce.15 subagent.
// Infrastructure smoke test (one passing) proves Playwright can reach the server.

const { test, expect } = require('@playwright/test');

test('smoke: page loads without error', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
});

test.skip('AC1: clicking "Commit artefact to repository" and confirming dialog commits artefact to artefacts/<feature-slug>/discovery.md under the authenticated user GitHub identity', async () => { /* placeholder — implemented by wuce.15 */ });

test.skip('AC2: committed artefact shows authenticated user as git author and committer in repository history — not a service account or bot identity', async () => { /* placeholder — implemented by wuce.15 */ });

test.skip('AC3: server rejects write-back requests targeting paths outside artefacts/ with 400 error — no write is made', async () => { /* placeholder — implemented by wuce.15 */ });

test.skip('AC4: when Contents API returns conflict error, user sees "Artefact already exists — reload and review before committing" with option to view existing artefact', async () => { /* placeholder — implemented by wuce.15 */ });

test.skip('AC5: successful write-back confirmation page displays repository link to the committed artefact and the commit SHA', async () => { /* placeholder — implemented by wuce.15 */ });

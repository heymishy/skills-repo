// session-persistence.spec.js — E2E placeholder for wuce.16 (multi-turn session persistence)
// AC1: user can close browser tab and resume mid-session within 24h — restored to exact step
// AC2: resumed session produces complete artefact with answers from original and resumed sessions
// AC3: accessing another user's session ID returns 403 — session state never returned cross-user
// AC4: session inactive > 24h shows "Session expired — please start a new session" message
// AC5: /skills page shows "Resume in-progress session" list with skill name, start date, question count
//
// Status: placeholder — todo stubs only; real assertions added by wuce.16 subagent.
// Infrastructure smoke test (one passing) proves Playwright can reach the server.

const { test, expect } = require('@playwright/test');

test('smoke: page loads without error', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
});

test.skip('AC1: user mid-session (2 of 5 questions answered) can close browser, return within 24h, and resume at exact step — prior answers shown as completed, next question shown as active input', async () => { /* placeholder — implemented by wuce.16 */ });

test.skip('AC2: submitting remaining answers in a resumed session produces a complete artefact containing content from both the original and resumed session — no answers lost or duplicated', async () => { /* placeholder — implemented by wuce.16 */ });

test.skip('AC3: attempting to access a session ID belonging to a different authenticated user returns 403 — the other user session state is never returned', async () => { /* placeholder — implemented by wuce.16 */ });

test.skip('AC4: session inactive for more than 24 hours shows "Session expired — please start a new session" message and expired session data is deleted from server', async () => { /* placeholder — implemented by wuce.16 */ });

test.skip('AC5: /skills page shows "Resume in-progress session" list with skill name, start date, and number of questions completed for each unexpired in-progress session', async () => { /* placeholder — implemented by wuce.16 */ });

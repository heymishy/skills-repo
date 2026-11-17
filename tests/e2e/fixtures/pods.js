'use strict';

/**
 * pods.js -- shared helpers for the pod browser specs (lpw-s4).
 *
 * The pod manager's "Available" list is the real team roster (GET /api/team/members), which is empty in test mode.
 * seedTeam() puts named people on the test tenant's roster through the test-only POST /test/seed-team-member route.
 * addPodMember() then drives the real UI flow for adding one of them to the pod being created: the roster row's Add
 * button, the Pod role selector, and Confirm (rtri-s2's flow).
 *
 * Specs must not rely on the roster being empty or on its order: other specs share the test tenant and seed too, and
 * a seeded identity is added once however many times it is seeded.
 */

const { expect } = require('@playwright/test');

/** Seed each identity (a plain login-style string) onto the test tenant's roster. Safe to call repeatedly. */
async function seedTeam(page, identities, role) {
  for (const identity of identities) {
    const res = await page.request.post('/test/seed-team-member', {
      data: { identity: identity, role: role || 'engineer' },
      headers: { 'Content-Type': 'application/json' }
    });
    expect(res.status(), 'seeding ' + identity + ' onto the roster').toBe(200);
  }
}

/**
 * With the create-pod modal open, add the roster member `identity` with the pod role `podRole` (default 'engineer').
 * The row's Add button becomes a role selector plus Confirm; the member then shows under "Your team".
 */
async function addPodMember(page, identity, podRole) {
  const row = page.locator('#available-roster .roster-row', { hasText: identity }).first();
  await row.getByRole('button', { name: 'Add' }).click();
  await row.locator('select').selectOption(podRole || 'engineer');
  await row.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('#your-team')).toContainText(identity);
}

module.exports = { seedTeam, addPodMember };

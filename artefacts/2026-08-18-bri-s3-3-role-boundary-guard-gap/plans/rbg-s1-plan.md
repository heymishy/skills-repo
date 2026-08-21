# Fix bri-s3.3's role-boundary regression guard so it actually asserts denial — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass, without adding scope beyond the 3 ACs — the entire change is confined to `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`.
**Branch:** `feature/rbg-s1`
**Worktree:** `.worktrees/rbg-s1`
**Test command:** `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`

**Note on TDD shape for this story:** this is a test-file-only fix — there is no separate application code to red/green against. The application behaviour being asserted (`requireAdmin` denying non-admins on `/admin/credits`) already works correctly (confirmed this session via the live production `isAdmin`-propagation investigation and via direct code read of `require-admin.js`/`server.js`). Confirmed baseline: all 5 tests in the file currently pass — 2 of them (the AC1 and AC3 tests being fixed here) pass for the *wrong* reason (weak/placeholder assertions), not because anything is broken. So each task's "red" step is a *content* check (assert the OLD body's weak assertion no longer appears / the NEW real assertion is present and passing), not a pass/fail transition.

---

## File map

```
Modify:
  tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js   — AC1 test body replaced with a real admin-gated-route check; AC3 test's placeholder body filled in with a real viewer-denial check
```

---

## Task 1: AC1 — admin succeeds, engineer denied on a real admin-gated route

**Files:**
- Modify: `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`

- [ ] **Step 1: Confirm the current weak assertion**

Locate the test titled `'AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied'` (currently starts around line 141). Confirm its body currently asserts `aliceViewRes.status()` and `bobViewRes.status()` are both `200` on `GET /products/{productId}` — a shared, non-admin-gated route. This is the defect: it proves nothing about role differentiation.

- [ ] **Step 2: Replace the test body**

Replace the entire body of that test (from `test.setTimeout(60000);` through the `await bob.ctx.dispose();` cleanup line) with:

```javascript
  test('AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied', async ({ request }) => {
    test.setTimeout(60000);

    const beforeCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const beforeCount = (await beforeCountRes.json()).count;

    // ── Setup: two distinct GitHub users sharing one org tenant ──
    const alice = await githubLogin('e2e-alice');
    const bob = await githubLogin('e2e-bob');

    // AC1: a genuinely admin-gated route (requireAdmin middleware) must
    // differentiate by role -- alice (admin) succeeds, bob (engineer) is denied.
    const aliceAdminRes = await alice.ctx.get('/admin/credits');
    expect(aliceAdminRes.status()).toBe(200);

    const bobAdminRes = await bob.ctx.get('/admin/credits');
    expect(bobAdminRes.status()).toBe(403);

    // Verify zero real LLM calls were made
    const afterCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const afterCount = (await afterCountRes.json()).count;
    expect(afterCount).toBe(beforeCount);

    // Cleanup
    await alice.ctx.dispose();
    await bob.ctx.dispose();
  });
```

Note: `createProduct` is no longer called by this test — the admin-gated route check does not require a product fixture. Do not remove the `createProduct` helper function itself (it is still used by the untouched AC2 concurrent-access test below).

- [ ] **Step 3: Run just this test**

```bash
npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js -g "AC1: admin"
```

Expected output: `1 passed` — alice gets `200`, bob gets `403`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js
git commit -m "fix(bri-s3.3): AC1 test asserts real admin-gated-route denial instead of a shared-route 200/200 no-op"
```

---

## Task 2: AC2 — viewer denied on the same admin-gated route

**Files:**
- Modify: `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`

- [ ] **Step 1: Confirm the current placeholder**

Locate the test titled `'AC3: viewer-role write attempt is denied'` (currently around line 216 — keep this exact title string; do not rename it, per the story's own AC numbering note). Confirm its body currently has no viewer login at all — just a comment `// For now, this is a placeholder that demonstrates the structure` and a before/after LLM-call-count check that trivially passes regardless of what (if anything) happened in between.

- [ ] **Step 2: Fill in the real body**

Replace the entire test body with:

```javascript
  test('AC3: viewer-role write attempt is denied', async ({ request }) => {
    test.setTimeout(60000);

    const beforeCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const beforeCount = (await beforeCountRes.json()).count;

    // ── Setup: viewer-role user (e2e-viewer, seeded by beforeAll) ──
    const viewer = await githubLogin('e2e-viewer');

    // AC2 (corrected scope): viewer is denied on the one admin-gated route that
    // actually exists and is gated (requireAdmin), same mechanism as AC1's bob
    // check. This does NOT assert viewer is blocked from every possible write
    // action -- no such enforcement exists anywhere in the codebase today (see
    // artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md).
    const viewerAdminRes = await viewer.ctx.get('/admin/credits');
    expect(viewerAdminRes.status()).toBe(403);

    await viewer.ctx.dispose();

    // Verify zero real LLM calls
    const afterCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const afterCount = (await afterCountRes.json()).count;
    expect(afterCount).toBe(beforeCount);
  });
```

- [ ] **Step 3: Run just this test**

```bash
npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js -g "AC3: viewer-role write attempt is denied"
```

Expected output: `1 passed` — viewer gets `403`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js
git commit -m "fix(bri-s3.3): implement AC3's viewer-denial placeholder with a real 403 assertion against e2e-viewer"
```

---

## Task 3: AC3 (this story's own AC3) — full spec file passes clean

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full spec file**

```bash
npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js
```

Expected output: `5 passed` — all 5 tests in the file, including the untouched AC2 concurrent-access test and AC4 mock-gateway check, plus this story's fixed AC1 and AC3 tests.

- [ ] **Step 2: No commit needed**

This task is verification only — Tasks 1 and 2 already committed the only file changes this story makes. If Step 1 fails, return to Task 1 or Task 2 and fix before proceeding to /verify-completion.

---

## Test Plan: Fix bri-s3.3's role-boundary regression guard so it actually asserts denial

**Story reference:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/stories/rbg-s1-fix-role-boundary-regression-guard.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real admin-gated-route denial test replaces the weak "both users reach a shared route" assertion | — | — | 1 test | — | — | 🟢 |
| AC2 | Viewer (`e2e-viewer`) is denied on the same admin-gated route via `requireAdmin`, replacing the unimplemented placeholder | — | — | 1 test | — | — | 🟢 |
| AC3 | Full `bri-s3.3-multi-user-tenant-journey.spec.js` suite passes end-to-end | — | — | 1 test (full-file run) | — | — | 🟢 |

This story's entire fix lives inside one existing Playwright E2E spec file — there is no unit or integration layer to test separately (the "unit" here is HTTP-level request/response behaviour against a running server, which is what the E2E harness already exercises for every other test in this file). No CSS-layout-dependent behaviour is involved (this is HTTP status-code assertion, not rendered-DOM/position behaviour) — Step 3a's E2E/browser-layout trigger patterns (drag-drop, `getBoundingClientRect`, pointer coordinates, visual rendering) do not apply.

---

## Coverage gaps

None. All 3 ACs have direct E2E coverage; no manual-only scenarios required.

---

## Test Data Strategy

**Source:** Seeded DB (existing fixture, reused as-is)
**PCI/sensitivity in scope:** No
**Availability:** Available now — `POST /test/seed-multi-user-roles` already seeds `e2e-alice` (admin, person_id 101), `e2e-bob` (engineer, person_id 102), and `e2e-viewer` (viewer, person_id 103) into `person_identities`/`team_memberships` for the shared org `e2e-shared-org` (confirmed in `server.js:2351-2399`). This story adds no new fixture data — it uses the already-seeded `e2e-viewer` identity that the spec file already declares (`VIEWER_PERSON_ID = 103`) but never logs in as.
**Owner:** Self-contained — the spec's own `beforeAll` hook seeds all data; no external dependency.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `e2e-alice` (admin), `e2e-bob` (engineer) logins in the shared tenant | Seeded via existing `beforeAll` hook | None | Already used by the current (weak) AC1 test — reused, not added |
| AC2 | `e2e-viewer` (viewer role) login in the shared tenant | Seeded via existing `beforeAll` hook | None | Already seeded, currently unused by any test in the file |

### PCI / sensitivity constraints

None.

### Gaps

None — all required fixture data already exists and is seeded by the spec's own setup.

---

## Unit Tests

None — this story's fix is entirely E2E (HTTP-level request/response behaviour against a running server via Playwright's `APIRequestContext`, not isolated function/component behaviour). Confirmed with story scope: the only "unit" of behaviour being tested is whether a real HTTP request to an admin-gated route returns the correct status code for a given role.

---

## Integration Tests

None — see Unit Tests note above; the E2E tests below are the integration-level tests for this story (they exercise the real `requireAdmin` middleware, the real session/role resolution, and the real route handler together, via a live HTTP request).

---

## E2E Tests

### AC1: admin (alice) succeeds on a real admin-gated route, engineer (bob) is denied

- **Verifies:** AC1 — the rewritten test asserts a real denial (403), not merely that both users can reach an unguarded shared route.
- **Target route:** `GET /admin/credits` (the same admin-gated route confirmed working correctly this session during live production verification of `tpac-s1`).
- **Precondition:** `e2e-alice` (admin) and `e2e-bob` (engineer) are seeded in the shared tenant via the existing `beforeAll` hook.
- **Action:** Log in as `alice` and `bob` (reusing the existing `githubLogin()` helper). `alice.ctx.get('/admin/credits')`; `bob.ctx.get('/admin/credits')`.
- **Expected result:** Alice's request returns `200`. Bob's request returns `403`, and the response body does not silently redirect to a page that renders as if authorized (must be a real denial, not a soft-fail).
- **Edge case:** No — this is the primary case; written to fail against the current spec (which never asserts a 403 for anyone).

### AC2: viewer (e2e-viewer) is denied on the same admin-gated route

- **Verifies:** AC2 (corrected) — a real assertion using the already-seeded `VIEWER_PERSON_ID`/`e2e-viewer` fixture, proving viewer is correctly treated as non-admin via the one real gating mechanism that exists (`requireAdmin`). Does NOT assert "any write action is denied" (see story's Architecture Constraints scope correction — that behaviour does not exist and is tracked separately).
- **Target route:** Same as AC1 — `GET /admin/credits`.
- **Precondition:** `e2e-viewer` is seeded in the shared tenant via the existing `beforeAll` hook (`server.js:2385-2387`, confirmed already present).
- **Action:** Log in as `e2e-viewer` (reusing `githubLogin()`). `viewer.ctx.get('/admin/credits')`.
- **Expected result:** Returns `403` — proving the placeholder test now asserts something real and currently-true, replacing the previous no-op body.
- **Edge case:** No.

### AC3: full spec file passes end-to-end as a genuine regression guard

- **Verifies:** AC3 — after AC1/AC2's fixes, the full `bri-s3.3-multi-user-tenant-journey.spec.js` file (all 5 existing test cases, including AC2's untouched concurrent-access test and AC4's untouched mock-gateway-usage check) passes with zero failures.
- **Precondition:** AC1 and AC2's test bodies are implemented as specified above.
- **Action:** Run `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js` (the confirmed E2E test runner for this repo, per `package.json`'s `test:e2e` script and this same file's own usage in `.github/workflows/staging-deploy.yml`).
- **Expected result:** All test cases pass. No regression to the existing, already-correct AC2 (concurrent access) or AC4 (mock-gateway usage) tests.

---

## NFR Tests

### Security — regression guard genuinely detects a role-boundary break

- **NFR addressed:** Security (the story's core purpose — restoring a claimed-but-non-functional security regression guard).
- **Measurement method:** Not a separate NFR test — AC1/AC2's own assertions ARE the security-relevant behaviour. No additional NFR-specific test is needed beyond what AC1/AC2 already cover, per the NFR test scope rule (don't duplicate AC-level assertions inside a nominal "NFR test").
- **Pass threshold:** N/A — see AC1/AC2.
- **Tool:** Playwright (existing E2E harness).

---

## Out of Scope for This Test Plan

- Testing the actual `requireAdmin` middleware's own internal logic in isolation — already covered by its own existing unit tests (`sec-perf-s2`'s coverage, confirmed elsewhere in this repo's test suite), not re-tested here.
- Testing viewer-role write-blocking on any route other than the one admin-gated route AC1/AC2 both use — no such enforcement exists anywhere in the codebase (see the story's Architecture Constraints scope correction and the separate `2026-08-21-viewer-role-no-enforcement` discovery artefact).
- AC2 (original, unmodified) — the concurrent-access test — and AC4 — the mock-gateway-usage check — are untouched by this story; not re-planned here, only confirmed to still pass in AC3's full-suite run.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No test proves viewer is denied on a write action (only on reading an admin-gated page) | The story's own corrected scope — no write-blocking enforcement exists for viewer anywhere in the codebase to test against | Tracked as a separate, appropriately-scoped discovery (`2026-08-21-viewer-role-no-enforcement`), not a gap in this test plan's own scope |

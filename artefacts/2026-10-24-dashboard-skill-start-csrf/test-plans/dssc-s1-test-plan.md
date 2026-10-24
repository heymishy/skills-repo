## Test Plan: Fix missing CSRF token on dashboard "Run a skill" start forms

**Story reference:** artefacts/2026-10-24-dashboard-skill-start-csrf/stories/dssc-s1-fix-missing-csrf-on-dashboard-skill-start-forms.md
**Test plan author:** Claude (session)
**Date:** 2026-10-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `dashboard.js`'s `handleDashboard` embeds a real `_csrf` field matching the session's token | 2 tests | — | — | — | — | 🟢 |
| AC2 | `products.js`'s `handleGetDashboard` embeds the same correct `_csrf` field | 2 tests | — | — | — | — | 🟢 |
| AC3 | A submitted form with the correct token passes `csrfGuard` (no 403) | — | 1 test | — | — | — | 🟢 |
| AC4 | Existing dashboard test suites unaffected | — | — | — | — | — | 🟢 (regression, covered by re-running existing files) |
| AC5 | Full suite passes | — | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all 5 ACs are covered by unit/integration tests against the real `renderDashboard`/`handleDashboard`/`handleGetDashboard` functions with a real (non-mocked) `csrf.js` module. No CSS layout, no real browser needed — this is a server-rendered HTML field, verifiable by string inspection, consistent with this codebase's own established convention for the equivalent `jgcc-s1` fix.

---

## Test Data Strategy

**Source:** Synthetic — in-memory `req`/`res` fixtures, matching `tests/check-dsa-s2-dashboard-wiring.js`'s own established pattern exactly.
**PCI/sensitivity in scope:** No — CSRF tokens are not PCI/sensitive data; test values are synthetic hex strings, never real session data.
**Availability:** Available now — no external fixtures needed.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `req.session` with a pre-set `csrfToken` (avoids exercising `persistSession`, matching `check-dsa-s1-artefact-body-content-escaping.js`'s own established convention) | Synthetic fixture | None | |
| AC2 | Same, plus a minimal mocked Postgres `pool.query` for `getProductsNavSummary`'s own dependencies (matching `check-dsa-s2-product-dashboard-wiring.js`'s existing mock shape) | Synthetic fixture + mocked pool | None | |
| AC3 | A real POST request body containing `_csrf` set to the exact value `generateCsrfToken` returned for the same session | Synthetic fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderDashboard_embedsCsrfField_inEachSkillStartForm

- **Verifies:** AC1 (view-level — the shared renderer both call sites use)
- **Precondition:** Call `renderDashboard({..., csrfToken: 'test-csrf-token-value', skills: _DASHBOARD_SKILLS_CATALOG})` directly
- **Action:** Inspect the returned HTML string
- **Expected result:** For each skill card, the HTML contains `<input type="hidden" name="_csrf" value="test-csrf-token-value">` inside that card's `<form>` — not just present once globally, but once per card (the existing `data-method="POST"` anchor + `<form>` pair repeats per skill)
- **Edge case:** No

### handleDashboard_rendersRealCsrfToken_matchingSession

- **Verifies:** AC1 (route-level — `dashboard.js`'s `handleDashboard`)
- **Precondition:** `req.session.csrfToken` pre-set to a known value (avoids `persistSession`)
- **Action:** Call `handleDashboard(req, res)`
- **Expected result:** Response body contains a `_csrf` hidden field whose value equals `req.session.csrfToken` exactly — not empty, not a placeholder
- **Edge case:** No

### handleGetDashboard_rendersRealCsrfToken_matchingSession

- **Verifies:** AC2 (route-level — `products.js`'s `handleGetDashboard`, the path actually serving `/dashboard` whenever `DATABASE_URL` is set)
- **Precondition:** `req.session.csrfToken` pre-set; mocked pool returns at least one product so the `renderDashboard` branch (not the zero-products onboarding branch) is exercised
- **Action:** Call `handleGetDashboard(req, res, null, mockPool)`
- **Expected result:** Response body contains a `_csrf` hidden field whose value equals `req.session.csrfToken` exactly
- **Edge case:** No

### handleGetDashboard_rendersRealCsrfToken_onZeroProductsOnboardingBranch

- **Verifies:** AC2 (edge case — the zero-products branch renders different body content; confirm the fix doesn't only work on the "happy path" branch, though this branch has no skill-start forms itself, so this test only confirms no crash/regression, not a `_csrf` field presence requirement)
- **Precondition:** Mocked pool returns zero products
- **Action:** Call `handleGetDashboard(req, res, null, mockPool)`
- **Expected result:** Response still renders successfully (status 200), confirming the fix didn't introduce a crash on this branch (this branch has no "Run a skill" cards per the story's own existing "dsa-s2 AC8: UNCHANGED" comment, so no `_csrf` assertion applies here — this test exists purely to guard against an accidental regression on this less-common path)
- **Edge case:** Yes — zero-products path

---

## Integration Tests

### gateAdvance_skillStartForm_withCorrectCsrfToken_passesGuardAndReachesHandler

- **Verifies:** AC3
- **Components involved:** `csrf.generateCsrfToken`, `csrf.csrfGuard` (both real, unmocked — this is the actual security mechanism being proven to work, not stubbed out), a minimal fake downstream handler to confirm the guard let the request through
- **Precondition:** A real session object; call `generateCsrfToken(req)` to get the real token value (mirroring exactly what the fixed `handleDashboard`/`handleGetDashboard` now do)
- **Action:** Build a POST request whose body is `{ _csrf: <the real token just generated> }` and run it through `csrfGuard(req, res)`
- **Expected result:** `csrfGuard` returns `true` (not `false`/403) — proving a form correctly rendered by this story's fix would successfully pass the guard in a real request, closing the loop from "field is present and correct" (AC1/AC2) to "guard accepts it" (AC3)

---

## NFR Tests

None — this story's NFRs (Performance, Security, Accessibility, Audit) are all "negligible" or "not applicable" per the story's own NFR section; no dedicated NFR test is needed beyond the functional ACs above, which already exercise the real `generateCsrfToken`/`csrfGuard` security mechanism end-to-end (AC3).

---

## Out of Scope for This Test Plan

- Any other form in this codebase (per the story's own Out of Scope section).
- `csdl-s1`'s diagnostic logging removal (separate, narrower follow-up story).
- A real browser/Playwright test — this is a server-rendered HTML string + a unit-level security-guard check, consistent with how `jgcc-s1`'s equivalent fix was itself tested (no Playwright spec was added for that fix either, per repo history).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | — | — |

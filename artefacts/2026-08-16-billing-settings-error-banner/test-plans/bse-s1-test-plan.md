## Test Plan: Show a visible error banner on Settings when a billing-portal redirect carries an error

**Story reference:** artefacts/2026-08-16-billing-settings-error-banner/stories/bse-s1-billing-settings-error-banner.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `?error=no_billing_account` → banner with exact text in `#tab-panel-billing` | — | 1 test | — | — | — | 🟢 |
| AC2 | `?error=billing_unavailable` → banner with exact text in `#tab-panel-billing` | — | 1 test | — | — | — | 🟢 |
| AC3 | No error / unrecognized error → no banner, no raw-value reflection, no regression | — | 2 tests | — | — | — | 🟢 |
| AC4 | Billing/Credits banner structural + behavioural isolation | 1 test | 1 test | — | — | — | 🟢 |

Tests are "integration" rather than "unit" for AC1-AC3 because they exercise the real `handleGetSettings` handler end-to-end (mock `req`/`res`, real `renderSettingsPage`/`renderBillingTab` call chain) — matching this file's own existing test convention in `tests/check-c2-billing-tab.js` (`testHandleGetSettingsReflectsRealPlanStateNoDuplicateComputation`, etc.), rather than testing `renderBillingTab` in total isolation. One additional pure-unit test on `renderBillingTab` directly covers AC4's markup-shape claim without going through the full handler.

**E2E / browser-layout detection (Step 3a):** Scanned all 4 ACs for CSS-layout-dependent language (drag-drop, pointer/click coordinates, `getBoundingClientRect`/`offsetTop`/`scrollTop`, on-screen-position checks, visual rendering that cannot be derived from the response body string). None of the 4 ACs require rendering a page in a browser — all are provable by string/regex/DOM-substring assertions against the HTML response body returned by `handleGetSettings` when called directly with a mock `req`/`res` (this file's own established test pattern). This differs from `nia-s1`'s AC3 (an irreducibly subjective "does this glyph look like an avatar" visual judgment) — every claim here (banner text present, banner id present/absent, raw string absent, markup nesting inside a named `id` block) is fully computable from the response-body string without rendering anything. **Classification: no CSS-layout-dependent gap.**

---

## Coverage gaps

None blocking. As a defense-in-depth measure (not because any AC is unprovable by automated test), the verification script below includes manual scenarios confirming the fix reads correctly on live staging by revisiting the exact flow `beta-006.md` validated (clicking "Manage billing" with no Stripe customer set up). This is not a RISK-ACCEPT — all 4 ACs are already fully covered by automated tests.

---

## Test Data Strategy

**Source:** Synthetic (mock `req`/`res` objects, following `tests/check-c2-billing-tab.js`'s existing `mockReq`/`mockRes` convention; no real database rows, no real Stripe calls)
**PCI/sensitivity in scope:** No — no card/customer data is read or rendered by this story; `req.session.stripeCustomerId` is not touched by this story's code path.
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1-AC4 | Mock `req` with `.query.error` set to each test value, mock `res` capturing `.body` | `mockReq`/`mockRes` helpers (copied from `tests/check-c2-billing-tab.js`) | None | `req.session` populated with a minimal fixture (`tenantId`, `login`, `accessToken`) matching that file's existing pattern |
| AC4 | `isAdmin: true` fixture session to exercise the Credits tab alongside Billing | Same mock `req`, `req.session.role` / equivalent admin fixture matching `check-c2-billing-tab.js`/`check-c3-credits-tab-restyle.js`'s existing admin-fixture convention | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### settings_renderBillingTabEmbedsErrorBannerWhenOptsErrorMessageSet

- **Verifies:** AC4 (markup-shape claim, isolated from the full handler)
- **Precondition:** None — calls `renderBillingTab` directly
- **Action:** Call `settings.renderBillingTab(planState, csrfToken, { errorMessage: 'Test message' })` and separately `settings.renderBillingTab(planState, csrfToken)` (no third arg, matching C2's existing two-arg call sites).
- **Expected result:** With `errorMessage` set: output contains `id="billing-error"`, `class="sw-credits-error"`, `role="alert"`, and the exact message text. Without it: output contains none of `id="billing-error"` — proving the two-arg call shape (used by any pre-existing caller) still works with no banner element at all, not a hidden one.
- **Edge case:** No

---

## Integration Tests

### settings_noBillingAccountErrorShowsBanner

- **Verifies:** AC1
- **Precondition:** Mock pool, mock `req` with `req.query = { error: 'no_billing_account' }`, minimal session fixture
- **Action:** Call `handlers.handleGetSettings(req, res)`. Inspect `res.body`.
- **Expected result:** `res.statusCode === 200`; `res.body` contains `id="billing-error"` positioned inside the `#tab-panel-billing` block, `role="alert"`, and the exact text "You don't have a billing account set up yet."
- **Edge case:** No

### settings_billingUnavailableErrorShowsBanner

- **Verifies:** AC2
- **Precondition:** Same as above, `req.query = { error: 'billing_unavailable' }`
- **Action:** Call `handlers.handleGetSettings(req, res)`. Inspect `res.body`.
- **Expected result:** `res.body` contains `id="billing-error"`, `role="alert"`, and the exact text "Billing is temporarily unavailable — please try again shortly."
- **Edge case:** No

### settings_noErrorParamShowsNoBannerNoRegression

- **Verifies:** AC3 (baseline leg)
- **Precondition:** Same as above, `req.query = {}` (no `error` key at all — matches every pre-existing test's fixture, e.g. `check-c2-billing-tab.js`)
- **Action:** Call `handlers.handleGetSettings(req, res)`. Inspect `res.body`.
- **Expected result:** `res.body` does not contain `id="billing-error"`; still contains the pre-existing Billing tab markers (`href="/settings/billing"`, the status pill class for the fixture's plan state) unchanged from `check-c2-billing-tab.js`'s own passing assertions.
- **Edge case:** No

### settings_unrecognizedOrMaliciousErrorParamShowsNoBannerAndNeverReflectsRawValue

- **Verifies:** AC3 (security leg)
- **Precondition:** Same as above, `req.query = { error: '<script>alert(1)</script>' }` (adversarial value, and separately `req.query = { error: 'some_future_unknown_code' }`)
- **Action:** Call `handlers.handleGetSettings(req, res)` for each value. Inspect `res.body`.
- **Expected result:** For both values: `res.body` does not contain `id="billing-error"`; `res.body` does not contain the raw string `<script>alert(1)</script>` anywhere, nor `some_future_unknown_code` anywhere — proving the allowlist mapping never reflects an unrecognized query value into the response, not just that it doesn't show a banner for it.
- **Edge case:** Yes — adversarial input value.

### settings_billingAndCreditsBannersAreIsolatedForAdminUser

- **Verifies:** AC4
- **Precondition:** Mock pool returning a fake tenant-balances row (matching `check-c3-credits-tab-restyle.js`'s existing admin fixture shape), `req.session` with an admin-effective role, `req.query = { error: 'no_billing_account' }`
- **Action:** Call `handlers.handleGetSettings(req, res)`. Locate the `#tab-panel-billing` block and the `#tab-panel-credits` block in `res.body` (substring between each panel's opening `<div id="tab-panel-X"` and its matching close, or simpler: assert positions via `indexOf`).
- **Expected result:** `id="billing-error"` appears once, at an index between `#tab-panel-billing`'s open and `#tab-panel-credits`'s open (i.e., inside the Billing panel, before the Credits panel begins). `id="credits-error"` is still present exactly as `check-c3-credits-tab-restyle.js` already asserts (unchanged `hidden` default, unchanged `creditsJs` script content — diffed against a captured pre-story baseline string). No `billing-error` text or id appears inside the Credits panel's markup range, and no `credits-error` id appears inside the Billing panel's markup range.
- **Edge case:** No

---

## NFR Tests

### settings_unrecognizedOrMaliciousErrorParamShowsNoBannerAndNeverReflectsRawValue (see above)

- **Verifies:** Security NFR (story NFR section) — user-controlled query parameter never reflected raw into HTML
- Listed here for NFR-to-test traceability per CLAUDE.md's artefact-writing standard; same test as AC3's security leg above, not a separate file entry.

---

## Out of Scope for This Test Plan

- Any Playwright/automated visual-regression test — not needed; all 4 ACs are provable via response-body string assertions from a directly-invoked handler, with no CSS-layout-dependent gap (see AC Coverage above).
- Any test of `billing.js`'s `handleGetBillingPortal` redirect logic — already covered by `bpe-s1`'s own test suite, unmodified and out of scope here (see story's Out of Scope).
- Any test of the Credits tab's own error *triggering* logic (the client-side `fetch`/`credits-error` JS flow) — only its markup/script *unchanged-ness* is asserted (AC4), not its own independent behaviour, which `check-c3-credits-tab-restyle.js` already covers.

---

## Test Gaps and Risks

None. All 4 ACs have full automated coverage with no RISK-ACCEPT required.

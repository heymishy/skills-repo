## Test Plan: Credits tab — restyle admin credit management into the shared design system

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c3-credits-tab-restyle.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-c-account-settings-page.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Admin sees restyled Credits tab with real balances | 1 | 1 | — | — | — | 🟢 |
| AC2 | Non-admin sees no Credits tab at all | 1 | — | — | — | — | 🟢 |
| AC3 | Top-up form sends same CSRF/payload shape as today | 1 | 1 | — | — | — | 🟢 |
| AC4 | Invalid amount rejection surfaced clearly | 1 | — | — | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Mixed — synthetic tenant-balance fixtures; mocked `pool.query` for the underlying `adminCreditsGet`/`adminCreditsPost` calls (reusing this repo's existing test conventions for these handlers).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1, AC3, AC4 | Fixture tenant balance rows | Synthetic | None | |
| AC2 | Non-admin session fixture | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Credits tab renders the same balance data adminCreditsGet already returns
- **Verifies:** AC1
- **Precondition:** Mocked `getAllTenantBalances` returning 3 tenant rows
- **Action:** Render the Credits tab
- **Expected result:** HTML shows all 3 tenants with their balances, restyled (real CSS classes from the shared design system, not the current bare `<table>`)

### Non-admin session renders Settings with no Credits tab element at all
- **Verifies:** AC2
- **Precondition:** Mocked non-admin session
- **Action:** Render Settings
- **Expected result:** HTML contains zero reference to a "Credits" tab — not a hidden/disabled element, an absent one

### Invalid amount shows a clear rejection message
- **Verifies:** AC4
- **Precondition:** Mocked `adminCreditsPost` response simulating the existing validation rejection (`amount must be a positive integer`)
- **Action:** Render the resulting error state
- **Expected result:** The restyled UI displays this message clearly, not raw JSON

---

## Integration Tests

### Restyled form submits the same CSRF token and payload shape as the existing bare form
- **Verifies:** AC3
- **Components involved:** Credits tab form, `csrfField`/`generateCsrfToken`, `adminCreditsPost`
- **Precondition:** A rendered form with a generated CSRF token
- **Action:** Submit a top-up request
- **Expected result:** The request body matches the exact shape `adminCreditsPost` already expects (`tenantId`, `amount`, CSRF token field) — confirmed by reusing this repo's existing `adminCreditsPost` test fixtures unmodified

### Admin-only route access is enforced at the API layer, not just hidden in the UI
- **Verifies:** AC2 (defense in depth)
- **Components involved:** `requireAdmin`, the underlying credits routes
- **Precondition:** Non-admin session
- **Action:** Directly call the credits API route, bypassing the UI
- **Expected result:** Rejected — same as B2's equivalent NFR test, confirming this isn't a new gap introduced by the restyle

---

## NFR Tests

### CSRF token flow is preserved exactly
- **NFR addressed:** Security
- **Measurement method:** Compare the restyled form's hidden CSRF field generation against the existing `sec-perf-s3` test suite
- **Pass threshold:** Identical behaviour — this NFR test reuses `sec-perf-s3`'s existing assertions against the new markup
- **Tool:** Existing CSRF test suite, re-run against the restyled form

---

## Out of Scope for This Test Plan

- A deduct-credits capability — doesn't exist in `adminCreditsPost` today and isn't added by this story.

## Test Gaps and Risks

None.

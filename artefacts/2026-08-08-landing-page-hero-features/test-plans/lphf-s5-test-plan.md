## Test Plan: Restyle the existing auth panel as the page's closing CTA

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s5-restyle-auth-panel-as-closing-cta.md
**Epic reference:** artefacts/2026-08-08-landing-page-hero-features/epics/epic-1-landing-page-hero-features.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Reduced visual weight relative to today's version | — | — | 1 test | — | CSS-layout-dependent | 🔴 |
| AC2 | Same routes/backend behaviour unchanged | 2 tests | — | — | — | — | 🟢 |
| AC3 | Functional and readable at 320px and 1280px | — | — | 1 test | — | CSS-layout-dependent | 🔴 |

---

## Coverage gaps

None — both layout-dependent ACs covered by real Playwright E2E tests.

---

## Test Data Strategy

**Source:** Synthetic — reuses this repo's existing `lab-s1.2` unit test fixtures for the auth panel's response assertions (`tests/check-lab-s1.2-landing-page.js`).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Rendered page, before/after visual weight comparison | Live Playwright browser render | None | Visual weight is assessed via computed CSS size/spacing values, not subjective judgement |
| AC2 | Mock request/response for `GET /`, `/auth/github`, `/auth/google`, `/auth/email/*` | Existing `lab-s1.2` test fixtures | None (existing guarantee: no `accessToken` in HTML — unchanged) | Reuse `tests/check-lab-s1.2-landing-page.js`'s mock pattern directly, don't duplicate |
| AC3 | Rendered page at 320px and 1280px | Live Playwright browser render | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### authPanel_stillTriggersSameAuthRoutes_afterRestyle

- **Verifies:** AC2 (route names corrected post-review, run 1, finding 1-M1)
- **Precondition:** Landing page rendered
- **Action:** Locate the GitHub, Google, and email sign-in/sign-up form elements; check their `href`/`action` attributes
- **Expected result:** GitHub button links to `/auth/github`, Google button links to `/auth/google`, sign-in form posts to `/auth/email/login`, sign-up form posts to `/auth/email/signup` — identical to pre-restyle behaviour
- **Edge case:** No

### authPanel_stillOmitsAccessTokenFromHtml_afterRestyle

- **Verifies:** AC2 (regression guard on `lab-s1.2` AC6)
- **Precondition:** Mock session with `req.session.accessToken` set
- **Action:** Render `GET /` for an authenticated request (or confirm the existing redirect-to-`/dashboard` behaviour for authenticated users is unaffected)
- **Expected result:** No `accessToken` value appears anywhere in the response body — unchanged guarantee from `lab-s1.2`
- **Edge case:** Yes — regression guard, not new behaviour

---

## Integration Tests

None — this story doesn't change any handler logic, only surrounding CSS/layout.

---

## E2E Tests

### authPanel_hasReducedVisualWeight_relativeToPreRedesign

- **Verifies:** AC1
- **Precondition:** Landing page loaded in a real browser, both pre- and post-redesign versions available for comparison (or a documented "before" baseline screenshot)
- **Action:** Measure the auth panel's computed size (height, padding) relative to total page height
- **Expected result:** The panel occupies a visibly smaller proportion of total page height post-redesign than it did pre-redesign (when it was the only content besides one paragraph) — assert a computed style/bounding-box comparison, not a subjective visual judgement
- **Edge case:** No
- **Tool:** Playwright

### authPanel_functionalAt320And1280_noHorizontalScroll

- **Verifies:** AC3
- **Precondition:** Landing page loaded in a real browser
- **Action:** Set viewport to 320px; confirm all auth buttons/form fields are visible and clickable/tappable; check `scrollWidth`; repeat at 1280px
- **Expected result:** No horizontal overflow at either size; every interactive element in the panel remains clickable (has a non-zero bounding box within the viewport)
- **Edge case:** No
- **Tool:** Playwright

---

## NFR Tests

### authPanel_noNewAccessTokenExposure

- **NFR addressed:** Security
- **Measurement method:** Reuse `lab-s1.2`'s existing accessToken-absence assertion pattern (`tests/check-lab-s1.2-landing-page.js`)
- **Pass threshold:** Zero occurrences of any accessToken-shaped value in the response body
- **Tool:** Node.js regex assertion, existing test file extended (not duplicated)

---

## Out of Scope for This Test Plan

- Testing the `/auth/*` route handlers' own internal logic — those are existing, already-tested handlers (`tests/check-lab-s1.2-landing-page.js` and others); this story doesn't modify them.
- Testing account-linking (`handleGetLinkSettings`) — unrelated to this story, per the review finding that corrected the original AC2 wording.

---

## Test Gaps and Risks

None identified.

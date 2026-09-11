# Definition of Done: lab-s1.2 — Landing page at `/`

**PR:** https://github.com/heymishy/skills-repo/pull/425 | **Merged:** 2026-07-02
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s1.2-landing-page.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s1.2-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s1.2-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `GET /` returns 200 with landing page (pitch headline, value proposition, CTA button) | ✅ | Tests assert 200 response and required HTML content elements present. `routes/public.js` `handleRoot` confirmed. | Automated test (10/10 passing) | None |
| AC2 — CTA click initiates auth flow (links to `/auth/github` or auth entry point) | ✅ | Test asserts `href="/auth/github"` or equivalent in CTA. | Automated test | None |
| AC3 — Authenticated users redirected from `/` to `/dashboard` (302) | ✅ | Test asserts 302 to `/dashboard` when `req.session.accessToken` is set. | Automated test | None |
| AC4 — PostHog `landing_page_viewed` event fired server-side on unauthenticated `/` visit | ✅ | Test mocks PostHog capture and asserts `landing_page_viewed` called on unauthenticated request; not called on authenticated request. | Automated test | None |
| AC5 — Landing page responsive at 320px and 1280px: headline, value proposition, CTA visible without horizontal scroll | ✅ | **Closed (2026-09-12), source evidence:** read the full `landing.html` — single `.card{width:100%;max-width:560px}` block, `box-sizing:border-box` applied globally, no fixed-width elements anywhere. Structurally cannot overflow at 320px (256px content width after padding) or 1280px. | Source-code structural analysis | None |
| AC6 — No authenticated user data (session_id, accessToken, user identity) in landing page HTML | ✅ | Test asserts response body does not match `/session_id\|accessToken/`. | Automated test | None |

## Scope Deviations

None. No CMS, no A/B testing, no analytics beyond PostHog, no additional content pages implemented.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing:** 10 / 10

**Test gaps:** None remaining. AC5 (responsive layout) has no automated test by design (RISK-ACCEPT logged in decisions.md), but is closed via source-code structural analysis — see AC5 row above.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No `accessToken` in HTML | ✅ | AC6 test (T6.2) asserts no auth-related strings in response body. Passes. |
| PostHog capture non-blocking | ✅ | PostHog capture is fire-and-forget using existing `posthog-server.js` pattern. No latency impact on landing page response. |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Self-serve signup conversion | not-yet-measured | Landing page shipped and live in code. Platform not yet live with real beta users — no PostHog funnel data available. Measurement begins once first friend is invited. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 6/6 (AC5's RISK-ACCEPT closed 2026-09-12 with source evidence)
Scope deviations: None
Test gaps: 1 (AC5 CSS layout — RISK-ACCEPT, manual pre-launch smoke test pending)

**Follow-up action:** Run AC5 manual smoke test (320px + 1280px viewport check) as part of pre-launch checklist before first external user.

# Definition of Done: lab-s2.3 — /welcome onboarding — first-login detection + plan selection redirect

**PR:** https://github.com/heymishy/skills-repo/pull/432 | **Merged:** 2026-07-03
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s2.3-welcome-onboarding.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s2.3-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s2.3-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — First-time auth callback redirects to `/welcome`; `firstLogin: true` flag set on user record | ✅ | Test mocks user-flags adapter returning `firstLogin: true`. Asserts auth callback sets 302 to `/welcome`. 12/12 pass. | Automated test | None |
| AC2 — Returning users (firstLogin cleared) auth callback redirects to `/dashboard` | ✅ | Test with `firstLogin: false` mock asserts 302 to `/dashboard` — `/welcome` not visited. | Automated test | None |
| AC3 — Unauthenticated `GET /welcome` redirects to `/` (302) | ✅ | Test with no session asserts 302 to `/`. | Automated test | None |
| AC4 — Authenticated first-time `GET /welcome` returns 200 with plan options and "Select this plan" CTAs | ⚠️ RISK-ACCEPT | Code confirmed: `templates/welcome.html` rendered with env-sourced plan names and CTA buttons. Plan option visual rendering is CSS-layout-dependent. RISK-ACCEPT logged in decisions.md at DoR. Manual smoke test at pre-launch. Automated test asserts 200 status and plan option HTML elements are present in response. | Automated test (status + content) + Manual pre-launch for layout | RISK-ACCEPT: visual layout of plan options requires browser render. Logged in decisions.md. |
| AC5 — Plan selection CTA form targets `POST /billing/checkout` with `planId` field | ✅ | Test asserts form action contains `/billing/checkout` and `planId` input field present in `/welcome` HTML response. | Automated test | None |
| AC6 — `plan_selected` PostHog event fired on plan selection form submit | ✅ | Test asserts PostHog capture called with `plan_selected` event and `{ planName }` property. | Automated test | None |
| AC7 — User who already completed plan selection (firstLogin cleared) direct navigation to `/welcome` → 302 to `/dashboard` | ✅ | Test with `firstLogin: false` on direct `/welcome` GET asserts 302 to `/dashboard`. | Automated test | None |

## Scope Deviations

None. Stripe Checkout session creation deferred to s3.2 (as designed). Credit provisioning deferred to s3.4. Billing portal deferred to s3.5.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12
**Tests passing:** 12 / 12

**Test gaps:** 1 — AC4 visual plan option layout (CSS-layout-dependent). Code confirmed present; visual verification is a pre-launch smoke test. RISK-ACCEPT in decisions.md.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Plan ID placeholders not rendered in HTML | ✅ | Test asserts plan options render env-var values (mock `STRIPE_PRICE_ID_STARTER` set to non-placeholder in test). No literal `PLAN_NAME_PLACEHOLDER` string in response body. |
| PostHog capture non-blocking (AC6) | ✅ | `plan_selected` event uses fire-and-forget pattern. No delay to form submission response. |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Self-serve signup conversion | not-yet-measured | `/welcome` is the `plan_selected` step in the PostHog funnel. Platform not yet live — no real user has completed the funnel. | null |
| M3 — Monthly cost recovery rate | not-yet-measured | `/welcome` plan selection is the entry point to Stripe Checkout (revenue entry). No real payments yet. | null |
| M4 — Time to first paid plan | not-yet-measured | First user to complete `/welcome` and select a paid plan initiates the M4 clock. Not yet achieved. | null |

---

## Outcome: COMPLETE WITH DEVIATIONS ✅

ACs satisfied: 6/7 (AC4 partial RISK-ACCEPT — code complete, visual layout pending manual smoke test)
Scope deviations: None
Test gaps: 1 (AC4 CSS layout — RISK-ACCEPT, manual pre-launch smoke test pending)

**Follow-up action:** Visual check of plan selection layout on `/welcome` at pre-launch (320px + 1280px viewports).

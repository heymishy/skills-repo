# Test Plan: Wire real client-side PostHog identity tracking into the routes actually served in production (rpiw-s1)

**Story:** artefacts/2026-09-13-real-route-posthog-identity-wiring/stories/rpiw-s1-wire-client-posthog-into-real-routes.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-rpiw-s1-real-route-posthog-wiring.js`, following this repo's established handler-testing pattern (mock `req`/`res`, spy on `posthog-server`'s `capture`, substring assertions on rendered HTML — matching `tests/check-lab-s1.2-landing-page.js`'s own style).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | `buildPostHogScript(key, {})` with a real key returns a string containing the PostHog CDN init snippet |
| T2 | AC1 | Behavioural | `handleRoot` with `POSTHOG_KEY` set, unauthenticated request: response HTML contains the PostHog init snippet AND the existing server-side `landing_page_viewed` capture still fires (spy assertion) |
| T3 | AC2 | Behavioural | `buildClickCaptureScript(key, selector, 'cta_clicked')` returns a script containing the `typeof posthog !== 'undefined'` guard and `posthog.capture('cta_clicked')` |
| T4 | AC2 | Behavioural | `handleRoot` response HTML contains the `cta_clicked` click-tracking script |
| T5 | AC3 | Behavioural | `buildPostHogScript(key, {identify: {login, tenantId}, captureEvent: 'login_completed'})` returns a script containing `posthog.identify(login, {tenant_id: tenantId})` and `posthog.capture('login_completed')` |
| T6 | AC3 | Behavioural | `handleGetDashboard` (non-board, non-json branch) with `POSTHOG_KEY` set and an authenticated session: response HTML contains the identify + login_completed script |
| T7 | AC4 | Security | `handleGetDashboard` response HTML never contains the session's `accessToken` value, even when set on the session |
| T8 | AC4 | Security | `buildPostHogScript` never accepts or renders an `accessToken` field even if accidentally passed in `opts.identify` |
| T9 | AC5 | Behavioural | `buildPostHogScript`/`buildClickCaptureScript` both return `''` when `key` is falsy/empty |
| T10 | AC5 | Behavioural | `handleRoot`/`handleGetDashboard` render byte-identical HTML (module content) to the pre-story baseline when `POSTHOG_KEY` is unset |
| T11 | AC6 | Non-regression | `tests/check-lab-s1.2-landing-page.js` re-run unmodified — all existing assertions (including T4's `landing_page_viewed` capture) still pass |
| T12 | AC6 | Non-regression | One existing `handleGetDashboard`-referencing test file (e.g. `tests/check-wnl-s3-dashboard-no-product-entry.js`) re-run unmodified — still passes with the appended script present |

## Regression coverage

- `tests/check-lab-s1.2-landing-page.js` — full existing suite re-run unmodified.
- `tests/check-wnl-s3-dashboard-no-product-entry.js` — full existing suite re-run unmodified (substring-based assertions, safe against an appended script tag).

## Out of Scope (per story)

- `journey.js`/`landing.js` deduplication.
- `?view=board` and `res.json` branches of `handleGetDashboard`.
- `dashboard.js`'s `handleDashboard` fallback.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.

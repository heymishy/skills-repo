# DoR Contract — lab-s1.2 — Landing page at `/`

**Story:** lab-s1.2
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

A `GET /` route handler in `src/web-ui/routes/public.js` (new file) that: checks `req.session.accessToken` to redirect authenticated users to `/dashboard`; renders a landing page HTML template (`src/web-ui/templates/landing.html`, new) with platform pitch headline, value proposition paragraph, and "Get started" CTA linking to `/auth/github`; fires a `landing_page_viewed` PostHog event via the existing `posthog-server.js` adapter (fire-and-forget). The route is registered in `server.js`.

## What will NOT be built

- No CMS integration, no A/B testing, no multi-language support
- No multi-provider auth chooser UI (CTA goes to `/auth/github` only — auth chooser is lab-s1.3)
- No marketing analytics beyond PostHog
- No content pages beyond the single `/` route

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | GET / with no session → assert HTTP 200, response body contains headline, value proposition, CTA text | Unit |
| AC2 | Assert CTA `href` or form action targets `/auth/github` in rendered HTML | Unit |
| AC3 | GET / with mock session containing `req.session.accessToken` → assert 302 to `/dashboard` | Unit |
| AC4 | GET / with no session → assert PostHog capture stub called with `landing_page_viewed` | Unit |
| AC5 | Responsive layout: RISK-ACCEPT — CSS layout cannot be verified in Node.js unit test. Manual pre-launch smoke test in lab-s3.5 verification script. | Manual (RISK-ACCEPT) |
| AC6 | Assert response body does NOT contain `accessToken`, `session_id`, or user identity data patterns | Unit |

## Assumptions

- `posthog-server.js` adapter already exists and is injectable/monkeypatchable
- `authGuard` middleware exists in `src/web-ui/routes/auth.js` (not invoked on `/` — the landing page handles auth redirect itself)
- Express or equivalent framework already configured in `server.js`
- The PostHog capture call does not need to await resolution (fire-and-forget)

## Estimated touchpoints

Files: `src/web-ui/routes/public.js` (new), `src/web-ui/templates/landing.html` (new), `src/web-ui/server.js` (modified — register `/` route)
Services: PostHog (fire-and-forget, no blocking)
APIs: none

## schemaDepends

None — lab-s1.2 has no upstream story dependencies (posthog-server.js and authGuard are existing code, not story-gated).

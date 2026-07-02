# DoR Contract — lab-s2.3 — /welcome onboarding — first-login detection + plan selection redirect

**Story:** lab-s2.3
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

A `GET /welcome` route handler in `src/web-ui/routes/public.js` (modified from lab-s1.2): checks auth, checks `firstLogin` flag, renders plan selection page or redirects to `/dashboard`. A new `src/web-ui/modules/user-flags.js` module with `getFirstLoginFlag(userId)` and `clearFirstLoginFlag(userId)`, injectable Postgres adapter (D37: default stub throws). Auth callbacks updated to set `firstLogin` flag and redirect to `/welcome` on first login. Plan selection form targets `POST /billing/checkout` with `planId` field. `plan_selected` PostHog event fired on plan submission. Routes wired in `server.js`.

## What will NOT be built

- Stripe Checkout session creation (lab-s3.2)
- Credit provisioning (lab-s3.4)
- Billing portal (lab-s3.5)
- "Skip for now" option (plan selection is mandatory in MVP)
- Email confirmation of plan selection

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Auth callback with `firstLogin: true` → `firstLogin` flag set on user record + redirect target is `/welcome` | Unit |
| AC2 | Auth callback with `firstLogin: false` (returning user) → redirect target is `/dashboard` | Unit |
| AC3 | GET /welcome with no session → 302 to `/` | Unit |
| AC4 | GET /welcome with `firstLogin: true` session → 200, response contains "Welcome", plan options from env vars (not PLACEHOLDER), CTA buttons | Unit |
| AC5 | GET /welcome HTML inspected → form action is `POST /billing/checkout`, `planId` field present | Unit |
| AC6 | Plan selection submit → `plan_selected` PostHog event with `{ planName }` | Unit |
| AC7 | GET /welcome with `firstLogin: false` session → 302 to `/dashboard` | Unit |

Note on AC4 (CSS-layout): RISK-ACCEPT applied — plan options layout (visual arrangement of cards) is CSS-layout-dependent. Content presence (plan names, CTAs) is testable at DOM level. Manual pre-launch smoke test at lab-s3.5.

## Assumptions

- lab-s1.3 is complete — auth callbacks are in place to redirect to `/welcome`
- lab-s3.2 (Stripe Checkout) provides `POST /billing/checkout` — AC5 is verifiable independently (it just checks the form action HTML, not the actual Stripe redirect)
- Neon Postgres `users` table exists (from lab-s2.2 migration) with `first_login` boolean column (or equivalent; migration may be added here if not already present)
- Plan options (names, brief descriptions) are sourced from env vars: `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO` — plan names derived from env or hardcoded display names with env-sourced IDs

## Estimated touchpoints

Files: `src/web-ui/routes/public.js` (modified — add GET /welcome), `src/web-ui/modules/user-flags.js` (new — getFirstLoginFlag, clearFirstLoginFlag, injectable), `src/web-ui/routes/auth.js` (modified — callbacks check firstLogin, set redirect target), `src/web-ui/templates/welcome.html` (new), `src/web-ui/server.js` (modified — register /welcome, wire user-flags adapter)
Services: Neon Postgres, PostHog (fire-and-forget)
APIs: none

## schemaDepends

`dorStatus` — upstream story lab-s1.3 must be `dorStatus: "signed-off"` before implementation begins. `dorStatus` is a valid field in `pipeline-state.schema.json`.

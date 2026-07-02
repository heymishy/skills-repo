# Discovery: Landing Site, Multi-Provider Auth, and Billing

**Status:** Approved
**Created:** 2026-07-01
**Approved by:** Hamish King — 2026-07-01
**Author:** Hamish King

---

## Problem Statement

The platform currently has no public entry point capable of converting a new visitor into an active user without manual operator intervention. Three compounding gaps block the path from interest to active use:

**Gap 1 — No self-serve entry point.** The `/` route exists but is not a landing page. A developer who arrives at the platform URL has no pitch, no signup CTA, and no clear next step. New users require word-of-mouth and direct onboarding from the operator.

**Gap 2 — GitHub-exclusive auth.** The only auth path is GitHub OAuth. This excludes users who prefer Google, email/password, or who operate in environments where GitHub accounts are not the standard credential. It also creates lock-in risk: if GitHub OAuth is unavailable (outage, org policy restriction), the entire platform is inaccessible.

**Gap 3 — No billing or monetisation mechanism.** The platform has no way to charge for access or for Anthropic API token consumption. Every active user costs the operator money with no recovery mechanism. There is no credit balance to gate usage, no plan to gate features, and no path to financial sustainability. This blocks moving from private beta to a wider or paying audience.

Together these gaps mean the platform cannot grow beyond the operator's direct social network and cannot cover its own running costs.

---

## Who It Affects

**New visitor / prospective user** — arrives at the platform URL via referral, social post, or search. Currently sees an undefined landing experience with no pitch and no signup path. A self-serve signup flow with a plan selection step is the minimum viable entry path.

**Existing beta user** — already using the platform under the current GitHub-only OAuth flow with no billing. Migration must be non-breaking: existing sessions and journeys must survive the auth and billing changes. These users represent the first wave of paying or plan-enrolled accounts.

**Platform operator (Hamish)** — currently bears 100% of Anthropic API costs with no recovery. The billing system gives the operator a sustainable revenue path and usage visibility per tenant. Also the first person to configure plans and credit rates, so the configuration interface must be operable without a developer deploy cycle.

**Future team/enterprise buyer** — not in scope for this discovery, but the plan abstraction must not foreclose a future team-seat or enterprise billing model. The architecture should carry a seam for this without building it now.

---

## Why Now

Two triggers make this the right time:

**Beta readiness.** The core platform (journey pipeline, skill sessions, Redis persistence, session hardening) has reached a state where it is stable enough to show to a wider audience. The landing + auth + billing gap is now the primary blocker to doing that.

**Cost exposure.** Anthropic API usage is already incurring real costs with zero recovery. Each new user added without billing increases the operator's unrecovered exposure. This is a problem that compounds quickly and is not acceptable to carry into any wider rollout.

---

## MVP Scope

1. **Landing page** — a single `/` route page with platform pitch, primary CTA ("Get started" → auth), and enough content to explain the value proposition to a developer audience. No CMS, no marketing team handoff — operator-authored content in the existing Node.js template system.

2. **Multi-provider auth abstraction** — replace the single-provider `oauth-adapter.js` with a provider registry backed by `better-auth` (open-source, self-hosted, npm package — npm constraint relaxed for this feature). GitHub OAuth remains the primary provider. Google OAuth added as the second provider. Email/password added as the third (covers users without GitHub or Google).

3. **Post-auth onboarding** — a `/welcome` step that fires on first login only (detected via a `firstLogin` flag), asking the user to select a plan before reaching `/dashboard`. Returning users skip it.

4. **Plans + credits billing via Stripe** — plan subscription (Stripe Checkout, Stripe Subscriptions) providing a base monthly credit allowance per tier. Credit top-up (Stripe Payment Intents) for usage beyond the plan allowance. Stripe Customer Portal for self-serve plan management and payment method updates. Plan tiers and credit rates are configured in the Stripe dashboard — not hardcoded.

5. **Credits balance enforcement** — a `credits` table in Postgres (existing Neon) tracking balance per tenant. Each Anthropic API turn decrements credits. When balance reaches zero, further turns return a 402 with a top-up CTA. No grace period in MVP.

6. **Stripe webhook handler** — receives `checkout.session.completed`, `invoice.paid`, and `payment_intent.succeeded` events to provision plan entitlements and credit top-ups. Idempotency enforced via Stripe event IDs stored in Postgres.

7. **Billing portal link** — a `/settings/billing` route that redirects authenticated users to their Stripe Customer Portal session for self-serve management.

8. **Pre-launch Stripe product ID swap** — a tracked pre-launch checklist story (not a code comment) that verifies all placeholder Stripe product IDs and price IDs have been replaced with live Stripe dashboard values before the first paying user can reach checkout. This is a distinct story with an explicit pass/fail gate, not an implementation detail left to the implementer's discretion. Code placeholder pattern: `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` in env config, validated absent in the smoke test before beta go-live.

---

## Out of Scope

- **Exact pricing tiers and credit rates** — the pricing model is not yet decided. The implementation must make plan configuration a Stripe dashboard operation, not a code change. The specific tiers, prices, and credit-per-plan amounts are a product decision to be made before launch, not during this feature build.

- **Enterprise / team-seat billing** — multi-seat plans, per-seat pricing, and organisation-level billing are explicitly deferred. The `tenantId` abstraction already exists; team billing would extend it but is a separate feature.

- **Usage-based metering beyond credits** — per-model pricing, token-level granularity reporting, and Claude Code-style usage limits (rate throttling based on rolling window spend) are future features. The credits table provides the foundation; the metering logic above it is deferred.

- **Invoice management and tax handling** — Stripe handles invoice generation. VAT/GST/tax collection is not configured in MVP; Stripe Tax is a later addition when volume warrants it.

- **Email notifications** — plan upgrade confirmation, low-credit warnings, and payment failure alerts are deferred. Stripe sends its own transactional emails for payment events; custom platform emails are a later story.

- **Affiliate, referral, or promotional credit codes** — deferred.

- **Free tier** — whether a free plan exists (and what its credit limit is) is a product decision deferred to pricing model definition. The billing architecture supports a zero-cost plan but MVP does not define one.

---

## Assumptions and Risks

**A1 — Better Auth requires ESM; the server is CJS. This is a known incompatibility, not a risk to validate.** Better Auth's own documentation explicitly states CJS is not supported. The transitive root cause is `jose` (JWT library), which is ESM-only and is a hard dependency of Better Auth. This incompatibility is actively hitting production users on better-auth 1.3.34 with Node 22 (as of November 2025) and is not being fixed upstream. The codebase is confirmed CJS: `package.json` has no `"type"` field (CJS default).

The spike must produce a recommendation between exactly three paths — not a yes/no on requireability, which is already answered:

- **Path A — Dynamic `import()` wrapper:** Keep the server CJS. Wrap all Better Auth calls behind async `import()` at the auth boundary. The server stays `require()`-native everywhere else. Risks: default export shape differences, `__dirname`/`__filename` usage within dynamically-imported ESM modules, and edge cases in ts-node/ts-node-dev interop under CJS host. Lowest migration scope, highest ongoing friction per import boundary.
- **Path B — Full ESM migration:** Add `"type": "module"` to `package.json`, convert all `require()` to `import`, replace `__dirname`/`__filename` with `import.meta.url` + `fileURLToPath`. Highest upfront cost; cleanest long-term. The codebase is early enough that migration cost is lower now than after more code lands — this path becomes significantly more expensive with each new file added under CJS.
- **Path C — Roll-your-own thin provider abstraction:** Implement multi-provider OAuth (GitHub, Google, email/password) directly using `fetch()` calls to each provider's OAuth endpoints, extending the existing `oauth-adapter.js` pattern. Stays entirely CJS, adds no new npm packages for auth, follows established project conventions. More auth code to own; no compatibility risk; no ESM dependency.

The spike's exit deliverable is a written recommendation between A, B, and C with rationale, migration cost estimate (for B), and a go/no-go on Better Auth adoption. The spike must not exit with "confirmed: doesn't work" and no decision.

**A2 — Neon Postgres is sufficient for Better Auth's adapter (if Path A or B).** Better Auth has a Postgres adapter. The assumption is that it works against a Neon serverless Postgres connection string without additional pooling configuration. Validate in the same spike.

**A3 — Existing sessions can be migrated non-destructively — but schema differences require explicit mapping.** Current beta users have live GitHub OAuth sessions (login, tenantId, accessToken) in Upstash Redis, keyed by the current `session_id` cookie. Better Auth (paths A or B) introduces its own user and session table schema — `user`, `session`, `account` tables in Postgres. Path C avoids this entirely since the current session shape is preserved.

For paths A or B: the dual-path (parallel auth, no forced re-auth) strategy is correct for beta trust. However, parallel running alone is not sufficient — the schema gap must be resolved explicitly. Better Auth's user identity (its `user.id`) and the current `req.session.userId` (GitHub numeric user ID) are different namespaces. A mapping layer or migration script is required before both paths share the same downstream tenant/credits/journey data. Forced re-auth for existing beta users on first post-migration login is acceptable if announced, and is simpler than a transparent mapping layer. This decision must be made before implementation begins — it is not a detail to defer to the implementation story.

**A4 — Stripe webhook delivery is reliable on Fly.io.** Fly.io does not guarantee sticky routing — webhooks may land on different instances. Idempotency (Stripe event ID stored in Postgres) is the mitigation. The risk is a replay window on a crashed instance between webhook receipt and Postgres write. Assess during implementation.

**A5 — Plans + credits model is the right commercial shape.** The implementation is designed so that plan tiers, credit rates, and the plan-to-credits relationship are Stripe dashboard configuration, not code constants. If the model changes (usage-based, per-seat, etc.), only the Stripe product catalogue and the Postgres credits logic need to change.

**A6 — Google OAuth is sufficient as the second provider.** Google covers the majority of the "not GitHub" use case at low implementation risk (same OAuth 2.0 flow as GitHub, same pattern regardless of Path A/B/C). Email/password is higher implementation complexity and is correctly included in MVP scope as the third provider but is lower priority than Google.

---

## Directional Success Indicators

- A developer who has never interacted with the operator can land on `/`, sign up with GitHub or Google, select a plan, and reach their first journey — within one session, without operator intervention.
- Existing beta users continue working without re-authentication after the migration deploy.
- The operator can change plan prices, add a new tier, or adjust credit rates entirely within the Stripe dashboard without a code deploy.
- Credits balance is visible to the tenant in the UI and enforced before Anthropic API calls — no silent overage.
- Auth provider can be added (e.g. Apple, Microsoft) by adding a Better Auth provider config without touching route handlers.

---

## Constraints

- **No new monthly infrastructure cost.** Better Auth is self-hosted (npm package, no SaaS fee). Stripe has no monthly fee — transaction fees apply only on actual payments.
- **npm dependency relaxation approved for this feature only.** `better-auth` and `stripe` npm packages are permitted. This relaxation is scoped to this feature; the zero-dep constraint remains for all other web-ui work.
- **CommonJS only.** The web-ui is `require()` / CommonJS. Any npm package that is ESM-only requires a compatibility strategy before it can be adopted. This must be confirmed for `better-auth` during the spike.
- **Neon Postgres (existing).** All new persistent state (users, credits, billing events, Stripe webhook idempotency records) uses the existing Neon Postgres connection. No new database is introduced.
- **Fly.io (existing).** No new hosting infrastructure. Stripe webhooks must be handled in the existing Node.js server.
- **Session fixation and cookie security standards already established** (sec-perf, committed 2026-07-01). The auth migration must not regress these — `rotateSessionId` must still be called after any provider login.
- **Session schema migration is a first-class constraint, not an implementation detail.** Better Auth (paths A or B) introduces a `user`/`session`/`account` Postgres schema that does not map directly onto the current GitHub-numeric-user-ID session shape. The mapping strategy (transparent migration vs. forced re-auth on first post-migration login) must be decided and documented as a story-level AC before implementation of any auth story begins. Path C avoids this constraint entirely.
- **Pricing model is intentionally not defined in this discovery.** The billing architecture must treat plan IDs and credit rates as Stripe-managed configuration, not code constants.

---

## Contributors

- Hamish King — Platform operator, product owner, engineer

## Reviewers

- Hamish King — Platform operator

## Approved By

Hamish King — Platform operator — 2026-07-01

---

**Next step:** Human review and approval → /benefit-metric

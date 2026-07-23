# Decisions: E2E Core Journey Coverage on Staging

## RISK — Staging test-data accumulation (2026-07-23)

**Context:** Surfaced during /clarify. Both new E2E scenarios create real staging data on every run — signup, product creation, Stripe test-mode customers — since they run against real `wuce-staging`, not a disposable per-run environment.

**Decision (resolved at /review, 2026-07-23):** Option (b) chosen — a strict naming/tagging convention (`e2e-test-*` prefix on emails/product/feature names, established by story A3) plus a manually-triggered purge script (`scripts/cleanup-e2e-staging-data.js` or equivalent, story B3), rather than a scheduled nightly job. Rationale: simplest for a solo-operator repo — no scheduled-job infrastructure (cron/CI schedule) to build or maintain, and staging's data volume from CI runs is low enough that periodic manual purges are sufficient. Story B3's AC1 was reworded from a conditional "whichever option is selected" to this concrete mechanism.

**Source:** /clarify pass, this session; resolved during /review walkthrough of MEDIUM finding B3 [1-M1].

---

## RISK — Staging staleness relative to merged code (2026-07-23)

**Context:** Surfaced during /clarify. CI auto-deploy to `wuce-staging` has been broken all session (`FLY_API_TOKEN` expired, confirmed via `gh secret list` showing no update since 2026-06-29) — every deploy this session was a manual `flyctl deploy`. The operator confirmed proceeding with E2E work anyway (manual deploy is acceptable), but this means an E2E failure could reflect stale staging content rather than a genuine regression in the PR under test, until the token is fixed.

**Decision (tracked, not yet resolved):** Proceeding without blocking on the token fix, per operator instruction. `/definition` or `/test-plan` should note this as a known limitation of the E2E gate's reliability until `FLY_API_TOKEN` is refreshed (see the two commands already provided to the operator earlier this session: `flyctl tokens create deploy` + `gh secret set FLY_API_TOKEN`).

**Source:** /clarify pass, this session; original token-expiry finding from earlier in this same session (tmc-s1/pvc-s1 deploy investigation).

---

## RISK-ACCEPT — W4 (AC verification scripts not pre-walked by a domain expert before DoR) (2026-07-23)

**Context:** /definition-of-ready's W4 warning applies to all 8 stories (A1-A5, B1-B3): each story's AC verification script was written at `/test-plan` but has not been walked through end-to-end by a domain expert before DoR sign-off.

**Decision:** Acknowledged and accepted for all 8 stories. This is a solo-operator repo (Hamish King, Founder/Operator) — the same person who authored, reviewed (twice, across Run 1 and Run 2), and is now signing off on these stories already has direct familiarity with every AC's intended behaviour. A full manual script walkthrough is deferred to post-merge smoke testing rather than blocking DoR sign-off now. This matches the Operating Posture in `.github/architecture-guardrails.md` (W4 RISK-ACCEPT is the standard posture for this repo, not a per-story exception).

**Source:** /definition-of-ready run, 2026-07-23, applied uniformly to A1, A2, A3, A4, A5, B1, B2, B3.

---

## DECISION — A1 staging auth-stub design: session-only identity, double-gated, no committed secret (2026-07-23)

**Context:** Story A1 (a1-staging-safe-auth-stub) required a staging-only mechanism to replace the external GitHub OAuth round-trip for E2E tests running against real `wuce-staging`, without weakening production auth (`fly.toml`/`wuce.fly.dev`) in any way (AC3) and without a real third-party GitHub test account (out of scope).

**Decision:**
1. **No persistent DB row for the stub identity.** The real production `GET /auth/github/callback` handler (`routes/auth.js`) never writes to the `users` table for GitHub logins (tenant identity comes from GitHub's own OAuth identity, not a local row) — the stub mirrors this exactly: it only populates session fields (`userId`, `login`, `tenantId`, `authProvider`, `role`), the same shape the real callback sets. "Real user record queryable via staging database/API" (AC1) is satisfied via `GET /api/me`, matching how the real GitHub OAuth path is itself verified elsewhere in this repo.
2. **Double gate, not a single env-var check.** The mechanism requires BOTH `process.env.E2E_STAGING_AUTH_STUB_SECRET` to be set on the server AND the request to present a matching `x-e2e-stub-secret` header (constant-time compared). A single mistaken env var leak (e.g. accidental inclusion in a shared config template) does not, by itself, allow the bypass to fire.
3. **The secret is never committed anywhere**, including `fly.staging.toml`. It is set only via `flyctl secrets set E2E_STAGING_AUTH_STUB_SECRET=<value> --app wuce-staging` (Fly's secret store, not the checked-in `[env]` block). This is stricter than the DoR contract's estimated touch-point list implied (which named `fly.staging.toml` as a likely touch point) — `fly.staging.toml` was deliberately left unmodified because there is no safe way to commit a real secret value to a repo file, and the AC3 check only needs to assert absence from `fly.toml` (production), which holds regardless of where the staging secret lives.
4. **Audit trail is in-memory, read via a same-gated HTTP endpoint** (`GET /auth/e2e-stub/audit`), not a DB table or log-aggregation query — the simplest mechanism that lets an E2E test assert NFR-Audit's "usage is logged" property without adding new infrastructure. Downstream story B3 (staging test-data cleanup) should be aware this audit trail is process-lifetime only (reset on redeploy/restart), not a durable record — if B3 needs durable cross-deploy audit history, that is a new consideration for B3, not covered by this in-memory mechanism.

**Rationale:** Minimises new surface area (no new DB schema, no new adapter wiring, no committed secret) while satisfying all 4 ACs, matching this story's Complexity Rating of 2 and its "additive to staging only" scope boundary.

**Source:** a1-staging-safe-auth-stub implementation, 2026-07-23.

---

## FINDING — A2 SameSite=Strict session-cookie finding: Stripe checkout redirect drops the session (2026-07-23)

**Context:** Story A2 (a2-stripe-test-mode-plan-selection) requires driving a real Stripe test-mode checkout on real `wuce-staging` and asserting AC2 — "the redirect lands on the expected post-checkout page ... and the session remains authenticated." Building the Playwright spec required first exploring the real, deployed checkout flow by hand (not simulated) to find working selectors on Stripe's hosted Checkout page, and that exploration surfaced a genuine, reproducible defect rather than a test-authoring problem.

**Finding:** The session cookie is set with `SameSite=Strict` (`src/web-ui/middleware/session.js`, `_buildCookieHeader`). Stripe's hosted Checkout page (`checkout.stripe.com`) returns control to the app via a cross-site-initiated top-level GET redirect to `GET /billing/success?session_id=...`. A `SameSite=Strict` cookie is never attached to a cross-site-initiated top-level navigation — that is the defining difference between `Strict` and `Lax` (which does allow top-level, safe-method cross-site navigations). As a result, `GET /billing/success` always arrives with no session cookie, `handlePostCheckout`'s sibling handler `handleGetBillingSuccess` (`src/web-ui/routes/billing.js`) treats the request as unauthenticated, and 302s to `/` (the public landing page) instead of `/dashboard`. This reproduced on every real run performed against real `wuce-staging` while building the A2 spec — not a flake, not an environment issue.

**Isolated verification (both confirmed against real staging, real Stripe test mode):**
1. **AC1 (plan activation) is unaffected and passes.** The `checkout.session.completed` webhook is a server-to-server call from Stripe, independent of the user's browser cookie. Verified by completing checkout with Stripe's documented success card (`4242 4242 4242 4242`), then performing a *fresh* re-login (same tenant identity — email is `tenantId` for email/password accounts) and confirming `GET /billing/plan-state` returns `{ plan: 'paid', status: 'active' }`.
2. **AC3 (decline path) is unaffected and passes.** A declined card (`4000 0000 0000 0002`) never triggers a redirect back to the app at all — Stripe's Checkout page shows the decline inline and the browser never leaves `checkout.stripe.com` — so there is no cross-site round trip to lose the cookie over, and the original session/context remains valid for the same-site plan-state check.
3. **AC2 alone fails**, and fails specifically because of the `SameSite=Strict` policy, not the checkout mechanics.

**Decision:** Do not work around this inside A2. Fixing it requires relaxing `SameSite` (e.g. to `Lax`) for the billing-redirect-facing cookie path, or an alternative token-handoff mechanism (e.g. a short-lived signed token appended to `success_url` that the handler exchanges for the real session) — either is a session-middleware change affecting all cookie-scoped traffic across the app, not a billing-only change, and is explicitly out of A2's scope ("this story only observes [billing] code," "do not modify billing code itself"). The A2 Playwright spec (`tests/e2e/a2-stripe-test-mode-plan-selection.spec.js`) asserts AC2's literal, intended behaviour and is expected to continue failing until a follow-up story fixes the underlying cookie policy — recorded here rather than silently weakened or skipped.

**Recommended follow-up:** A new short-track story to evaluate `SameSite=Lax` (or an equivalent token-handoff) scoped specifically to the `/billing/success` and `/billing/checkout` redirect paths, verified against a real Stripe test-mode round trip exactly as A2 does here, before widening to any other redirect-heavy flow (e.g. GitHub/Google OAuth callbacks, which may have the same latent exposure and are worth auditing in the same pass).

**Source:** a2-stripe-test-mode-plan-selection implementation, 2026-07-23; verified against real `wuce-staging` and real Stripe test mode, not simulated.
## ARCH — Staging E2E model calls must use the mock-LLM-gateway, not the real model; and credits gate needs an E2E-only admin-provisioned tenant, not a product change (2026-07-23)

**Context:** Wave 1 of the inner loop (a2, b1) surfaced two things that require correcting the approach for every remaining model-turn-driven story (a3, a4, a5, b1, b2):

1. **Cost:** b1's implementation called the real model against real staging, which (once the credits gate is bypassed) would spend real Anthropic API dollars on every CI run, every PR. This directly contradicts discovery.md's own original Constraints section ("the suite must reuse this repo's existing mock-LLM-gateway convention (never call real Anthropic APIs from E2E, matching every other spec's own NFR)") — a constraint that a3's and b1's story artefacts incorrectly overrode during /definition without properly flagging it as a scope deviation. This is a real process gap: the override should have been surfaced as an explicit scope note at /definition or caught at /review, and wasn't.
2. **Credits gate:** the b1 dispatch found every real skill turn 402s for a zero-credit tenant. A follow-up investigation (dispatched specifically to check this) found this is deliberate product policy — `artefacts/2026-07-01-landing-auth-billing/decisions.md` SCOPE-002 ("No free tier in MVP... post-MVP decision") and story `lab-s3.3` AC1 ("Turn attempt with balance = 0 returns 402 with no Anthropic API call") are the shipped, intended behaviour. **No product code change is warranted** — implementing a free-tier credit grant would silently reverse a dated, named product decision.

**Decision:**
1. **Revert to discovery's original constraint.** All staging E2E specs that drive a skill turn (a3's `/ideate` turns, b1's `/discovery`→...→`/definition-of-ready` turns, and any future story that adds one) must set `MOCK_LLM_GATEWAY=true` on the `wuce-staging` process for the duration of the E2E run (same gating mechanism already shipped in `src/web-ui/modules/mock-llm-gateway.js`: activates on `NODE_ENV=test` OR `MOCK_LLM_GATEWAY=true`; hard-blocked when `NODE_ENV=production`, so this cannot leak into real production traffic). This also resolves the AC3 [1-M1] review finding on a3 (model-instruction-emission reliability) — a mock fixture can be configured to deterministically always include a canvas marker, removing the Untestable-by-nature classification entirely; a3's story/test-plan/DoR should be revised accordingly before implementation.
2. **The credits gate is solved with an E2E-only pre-funded/admin-adjusted test tenant, not a product change.** Reuse the existing `POST /api/admin/credits/adjust` endpoint (gated by `ADMIN_GITHUB_LOGINS`) to top up the specific `e2e-test-` tagged tenant created by each spec's own setup, immediately after signup and before the first skill turn. This is the same "staging-only, never touches real users" pattern already established by a1's auth stub and a3's naming convention — not a reversal of SCOPE-002, since it only ever applies to synthetic, tagged, B3-cleanup-eligible test tenants.
3. **b1's already-open PR #553 needs amendment** (not a fresh story) to: (a) set `MOCK_LLM_GATEWAY=true` for its spec's staging process/request, (b) call the admin credit-adjust endpoint for its test tenant in setup. a3 (not yet dispatched) should be written/dispatched with this corrected approach from the start.
4. **Real (non-mocked) model verification is out of scope for this feature entirely** — reserved for a future, separate "production tests" initiative that the operator explicitly wants kept distinct from this staging-E2E-coverage feature, so the two don't get conflated on cost or flakiness grounds.

**Consequences:** a3's story/test-plan/DoR need a revision pass before dispatch (remove the "real model calls, not mocked" language, add `MOCK_LLM_GATEWAY=true` + admin-credit-adjust to Architecture Constraints and Test Data Strategy, simplify AC3's gap handling). b1's PR #553 needs a follow-up commit, not a new PR. a4/a5/b2 should be checked for the same "real model call" assumption before their own dispatch.

**Source:** Operator instruction, 2026-07-23, following live findings from a2/b1's inner-loop dispatch.

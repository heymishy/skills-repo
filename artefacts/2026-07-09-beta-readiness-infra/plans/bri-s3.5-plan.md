# Billing journey spec (bri-s3.5) — Implementation Plan

> **For agent execution:** executed directly in-session per /tdd discipline (no subagents available in this run).

**Goal:** Make every test in the test plan pass — deterministic `@mocked`/`@billing` coverage for trial→paid upgrade, usage-gate enforcement, payment-failure, and downgrade/cancellation, without any real Stripe API calls.
**Branch:** `feature/bri-s3.5`
**Worktree:** `.worktrees/bri-s3.5`
**Test command:** `node tests/check-bri-s3.5-usage-gate.js`, `node tests/check-bri-s3.5-billing-webhook.js`, `node tests/check-bri-s3.5-nfr-stripe-keys.js`, `npx playwright test tests/e2e/bri-s3.5-billing-journey.spec.js`

---

## Genuine gap found — contract note (per DoR contract's ADR-008 escape clause)

The DoR contract stated: *"Stripe webhook handler module (read-only test consumption, no behavioural change expected unless a genuine gap is found — any such gap requires a DoR contract amendment per ADR-008)."*

Investigation found a genuine gap: `handlePostStripeWebhook` in `src/web-ui/routes/billing.js` only handles `checkout.session.completed`, `invoice.paid`, `payment_intent.succeeded` (all credit-provisioning events from lab-s3.4). There is no handling for a payment-failure event or a cancellation event, and no persisted tenant-plan-state concept exists anywhere in the codebase (only `session.plan`, which nothing ever sets, and the existing journey-count cap in `tenant-plan.js`, which is cap-only, not plan-state-aware). AC3 and AC4 cannot be made to genuinely pass without adding:
1. A minimal in-memory tenant plan-state store (mirrors the existing `_capReader` injectable pattern already in `tenant-plan.js` — synchronous, test-resettable, no new async DB dependency).
2. Two new webhook event-type branches (payment-failure, cancellation) plus extending the existing `checkout.session.completed` branch to also set plan state to paid.
3. `checkJourneyCap` consulting plan state so a paid/active tenant is unrestricted and a downgraded/cancelled tenant is restricted again — this is what makes AC4 ("access is restricted per the new plan") concrete.

This is logged as a decision in `artefacts/2026-07-09-beta-readiness-infra/decisions.md` (contract amendment) rather than silently expanding scope. It stays within the story's stated boundaries: no per-seat billing, no `@live` real-webhook testing, no new external service.

---

## File map

```
Create:
  tests/check-bri-s3.5-usage-gate.js              — unit tests: usage-gate function (checkJourneyCap) blocks/allows around cap boundary and plan-state overrides (AC2)
  tests/check-bri-s3.5-billing-webhook.js         — integration tests: webhook handler upgrade/payment-failure/cancellation events update tenant plan state (AC1, AC3, AC4)
  tests/check-bri-s3.5-nfr-stripe-keys.js         — NFR config check: no live-mode Stripe key/secret pattern in this variant (AC5 / Security NFR)
  tests/e2e/bri-s3.5-billing-journey.spec.js      — Playwright spec, tagged `@mocked` `@billing` (AC1–AC5)

Modify:
  src/web-ui/modules/tenant-plan.js               — add plan-state store (getPlanState/setPlanState/resetPlanState) + checkJourneyCap consults plan state
  src/web-ui/routes/billing.js                    — extend handlePostStripeWebhook for payment-failure + cancellation events; checkout.session.completed also sets plan paid/active; add handleGetBillingPlanState
  src/web-ui/modules/stripe-client.js              — call-count spy on createCheckoutSession (AC5)
  src/web-ui/server.js                            — register GET /billing/plan-state; register NODE_ENV=test-only GET /test/stripe-call-count
  package.json                                    — register 3 new check-*.js files in scripts.test chain
```

---

## Task 1: Tenant plan-state store + usage-gate boundary tests (AC2)

**Files:**
- Modify: `src/web-ui/modules/tenant-plan.js`
- Test: `tests/check-bri-s3.5-usage-gate.js`

- [x] **Step 1: Write the failing test** — `tests/check-bri-s3.5-usage-gate.js` asserts:
  - at-cap tenant blocked with human-readable message (not raw 402/code)
  - one-under-cap tenant allowed
  - paid+active plan state removes the cap (unlimited) regardless of `MAX_JOURNEYS_PER_TENANT`
  - `resetPlanState()` returns tenant to default trial behaviour

- [x] **Step 2: Run test — must fail** — `node tests/check-bri-s3.5-usage-gate.js` → `getPlanState is not a function`

- [x] **Step 3: Write minimal implementation** — add `getPlanState`, `setPlanState`, `resetPlanState` (in-memory `Map`, default `{plan:'trial', status:'active'}`) to `tenant-plan.js`; `checkJourneyCap` returns `{allowed:true, cap:null}` when `getPlanState(tenantId).plan === 'paid' && status === 'active'`, else existing cap logic.

- [x] **Step 4: Run test — must pass** — `node tests/check-bri-s3.5-usage-gate.js` → all PASS

- [x] **Step 5: Run existing regression** — `node tests/check-s2.1-preflight-gate.js` → all PASS (no behaviour change for the cap-only path)

- [x] **Step 6: Commit** — `feat(bri-s3.5): add tenant plan-state store consulted by the usage-gate cap check`

---

## Task 2: Webhook handler — payment-failure + cancellation events (AC1, AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/billing.js`
- Test: `tests/check-bri-s3.5-billing-webhook.js`

- [x] **Step 1: Write the failing test** — mocked `checkout.session.completed` → plan state paid/active; mocked `invoice.payment_failed` → plan state trial/past_due; mocked `customer.subscription.deleted` → plan state trial/canceled; a subsequent `checkJourneyCap` call reflects the new restriction.

- [x] **Step 2: Run test — must fail** — plan state unchanged for the two new event types (falls into `default`/unhandled branch)

- [x] **Step 3: Write minimal implementation** — add two new `case` branches to the webhook switch; extend `checkout.session.completed` branch with `tenantPlan.setPlanState(tenantId, 'paid', 'active')`.

- [x] **Step 4: Run test — must pass**

- [x] **Step 5: Run existing regression** — `node tests/check-lab-s3.4-stripe-webhook.js` → all PASS (existing 3 event types unchanged)

- [x] **Step 6: Commit** — `feat(bri-s3.5): reflect payment-failure and cancellation webhook events in tenant plan state`

---

## Task 3: Stripe call-count spy + plan-state read route (supports AC1, AC5 E2E)

**Files:**
- Modify: `src/web-ui/modules/stripe-client.js`, `src/web-ui/routes/billing.js`, `src/web-ui/server.js`

- [x] **Step 1** — add `getCheckoutCallCount()` / `resetCheckoutCallCount()` to `stripe-client.js`, incremented inside `createCheckoutSession`.
- [x] **Step 2** — add `handleGetBillingPlanState` to `billing.js`: authenticated GET returning `{ plan, status }` JSON for `req.session.tenantId`.
- [x] **Step 3** — wire `GET /billing/plan-state` in `server.js`; wire `GET /test/stripe-call-count` only when `NODE_ENV === 'test'`, mirroring the existing `/test/session` guard pattern.
- [x] **Step 4** — no separate unit test file; covered by the E2E spec (Task 4) which is the actual consumer.
- [x] **Step 5: Commit** — `feat(bri-s3.5): add Stripe call-count spy and plan-state read route for E2E billing journey coverage`

---

## Task 4: Playwright E2E spec, `@mocked` `@billing` (AC1–AC5)

**Files:**
- Create: `tests/e2e/bri-s3.5-billing-journey.spec.js`

- [x] **Step 1** — write spec using `withAuth` fixture (per `tests/e2e/fixtures/auth.js`); seed plan state via a synthetic webhook POST to `/webhook/stripe` with `NODE_ENV=test` signature bypass (mirrors `check-lab-s3.4` pattern, verified server-side via a test-mode-only signature bypass already implied by `NODE_ENV=test`); assert `/billing/plan-state` reflects paid after checkout event, past_due after failure event, and trial/restricted after cancellation event; assert `/journey` usage-gate page renders the human-readable limit message at cap; assert `/test/stripe-call-count` stays at 0 throughout (AC5 — zero real Stripe calls, since the E2E spec never calls `/billing/checkout` against a real Stripe SDK).

- [x] **Step 2: Run** — `npx playwright test tests/e2e/bri-s3.5-billing-journey.spec.js --grep @billing`

- [x] **Step 3: Commit** — `test(bri-s3.5): add @mocked @billing E2E spec for trial-to-paid, usage-gate, payment-failure, and cancellation journeys`

---

## Task 5: NFR — Stripe test-mode key prefix check (Security NFR)

**Files:**
- Create: `tests/check-bri-s3.5-nfr-stripe-keys.js`

- [x] **Step 1** — hand-rolled assert script: if `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are set in the current environment, assert prefixes are `sk_test_`/`whsec_` (never `sk_live_`); confirms `tests/e2e/fixtures` and `playwright.config.js` never hardcode a live-mode key pattern (git-grep check, mirroring `check-lab-s3.4`'s existing `STRIPE_WEBHOOK_SECRET=whsec_` git-grep pattern).
- [x] **Step 2: Commit** — `test(bri-s3.5): add NFR check confirming test-mode-only Stripe key prefixes`

---

## Task 6: Register new tests + full regression

- [x] Register `check-bri-s3.5-usage-gate.js`, `check-bri-s3.5-billing-webhook.js`, `check-bri-s3.5-nfr-stripe-keys.js` in `package.json` `scripts.test` chain.
- [x] Run full regression (chain-runner script, since `npm test` hits a pre-existing Windows cmd.exe command-length limit unrelated to this story — logged as a known baseline issue).
- [x] Commit: `chore(bri-s3.5): register new billing journey checks in the test chain`

# Signup -> onboarding -> first feature journey spec — Implementation Plan

**Goal:** Build a single Playwright E2E spec, tagged `@mocked`, that drives a real user from email/password signup through onboarding to a passing and a failing definition-of-ready gate result, using S3.1's mock LLM gateway so no real LLM call is ever made.
**Branch:** `feature/bri-s3.2`
**Worktree:** `.worktrees/bri-s3.2`
**Test command:** `node tests/check-bri-s3.2-journey-response-shape.js && node tests/check-bri-s3.2-dor-gate-evaluator.js` (integration tests) and `npx playwright test tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js` (E2E)

---

## Discovery findings that shaped this plan

Before writing tasks, driving the real signup -> product -> journey flow surfaced several **pre-existing gaps** in the code this story depends on (not new scope — fixes required to make the ACs testable at all, each kept as small and narrowly-scoped as possible):

1. **`GET /api/journey/:id` was missing `ownerId`** from its response, despite the story's own ADR-024 architecture constraint naming it as a required field. One-line fix in `routes/journey.js`.
2. **The mock LLM gateway (bri-s3.1) was never actually wired into the live chat-turn call site.** `htmlSubmitTurn` in `routes/skills.js` called `_skillTurnExecutor` without the `meta.stage`/`meta.scenarioName` argument the gateway hook requires — meaning `isMockGatewayEnabled()` could never trigger from the real UI flow. Wired `meta = { stage, scenarioName }` through, with `scenarioName` sourced from a new `session.mockScenarioName` field (default `'success'`).
3. **A real feature-level journey traverses 7 stages** (`discovery, benefit-metric, design, definition, review, test-plan, definition-of-ready`), not the 5 named in this story's own AC2 text. `design` and `review` had no mock-gateway fixtures. Added `design.success.json` and `review.success.json`, mirroring bri-s3.1's fixture schema.
4. **`/products/new` and `/products/confirm` (psh-s3) have no body-parsing** in the raw HTTP server — `req.body` is `undefined` at runtime, so both handlers would throw. Added a small `_readBody` helper in `products.js` (mirrors the existing per-file pattern already used by `routes/auth-email.js` and `routes/journey.js`), short-circuiting when `req.body` is already set so existing Express-mock-style unit tests are unaffected.
5. **Several D37 adapters (bcrypt, the real `skillTurnExecutor`, `generateProductDraft`) are only wired when `WIRE_SKILL_ADAPTERS=true`**, a flag no Playwright config currently sets. Since bcrypt has no external dependency and the other two are already safe with no API key configured (mock gateway / blank-draft no-op respectively), wired all three unconditionally in the existing `NODE_ENV=test` block in `server.js` — additive only, zero effect on any other spec.
6. **No live Postgres is available in CI**, but AC1/AC2 require a real signup and a real product to exist. Added `src/web-ui/adapters/fake-test-db.js`, a narrow in-memory stand-in for exactly the `users`/`products` query shapes those two flows issue (not a general SQL engine), wired only when `NODE_ENV=test` and `DATABASE_URL` is unset.
7. **The `/welcome` plan-selection gate has no test-mode bypass** and requires a real Stripe Checkout round-trip to clear — out of scope for this journey-testing story (owned by lab-s3.2's billing story) and unsafe to exercise for real in CI. Added `POST /test/complete-onboarding` (NODE_ENV=test only), mirroring the existing `/test/session` test-infrastructure pattern.
8. **AC5's "zero real LLM calls" needed a way to observe the server's real HTTP calls from the Playwright process.** Added a small `https.request` wrap in test mode, counting only calls to `api.anthropic.com`/`githubcopilot.com`, exposed via `GET /test/real-llm-call-count`.

All the above are captured as inline code comments at each change site (`// bri-s3.2: ...`) for future readers of `git blame`.

---

## File map

```
Create:
  src/web-ui/adapters/fake-test-db.js                       — in-memory users/products Postgres-Pool stand-in (NODE_ENV=test, no DATABASE_URL)
  tests/e2e/fixtures/llm-gateway/design.success.json          — mock fixture for the 'design' stage (STAGE_SEQUENCE gap)
  tests/e2e/fixtures/llm-gateway/review.success.json          — mock fixture for the 'review' stage (STAGE_SEQUENCE gap)
  tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js         — the @mocked Playwright spec (AC1-AC5)
  tests/check-bri-s3.2-journey-response-shape.js               — integration test: ADR-024 GET /api/journey/:id shape
  tests/check-bri-s3.2-dor-gate-evaluator.js                    — integration test: DoR gate evaluator pass/fail distinction

Modify:
  src/web-ui/server.js           — fake-test-db wiring; bcrypt/skillTurnExecutor/generateProductDraft unconditional test-mode wiring; /test/complete-onboarding; /test/real-llm-call-count; real-LLM-call counter
  src/web-ui/routes/skills.js    — registerHtmlSession accepts mockScenarioName; htmlSubmitTurn passes meta{stage,scenarioName} to the executor
  src/web-ui/routes/journey.js   — e2eForceFailStage capture + _mockScenarioForStage helper wired at every stage-session-creation call site; ownerId added to GET /api/journey/:id response
  src/web-ui/routes/products.js  — _readBody helper + req.body population fix for handlePostProductNew/handlePostProductConfirm
  package.json                  — register the two new check-*.js integration tests in scripts.test
```

---

## Task 1: ADR-024 response shape — add missing `ownerId`

**Files:**
- Modify: `src/web-ui/routes/journey.js` (`handleGetJourneyState`)
- Test: `tests/check-bri-s3.2-journey-response-shape.js`

- [x] **Step 1: Write the failing test** — asserted `ownerId` is present and reflects `journey.ownerId` (including the `null`-when-unset case).
- [x] **Step 2: Run test — failed** (`ownerId` key missing from the response body).
- [x] **Step 3: Add `ownerId: journey.ownerId || null` to the JSON response.**
- [x] **Step 4: Run test — 13/13 passed.**
- [x] **Step 5: Full suite check** — ran the existing journey-state consumers (`check-p0.2-journey-guard-wiring`, `check-p1.2-tenant-session-journey`, `check-p2.2-tenant-isolation`, `check-owle1-clarify-side-trip`, `check-wsm3-non-happy-path`) — all still pass; the field addition is additive.
- [x] **Step 6: Commit** — `git commit -m "fix(journey): add ownerId to GET /api/journey/:id per ADR-024"`.

## Task 2: DoR gate evaluator pass/fail integration test

**Files:**
- Test: `tests/check-bri-s3.2-dor-gate-evaluator.js` (consumes `src/enforcement/cli-outer-loop.js`'s `validate()`, no production code change)

- [x] Verified the story's own real, signed-off DoR artefact validates with `exitCode: 0`.
- [x] Verified a synthetic artefact referencing a non-existent story file fails with a distinct non-zero `exitCode` and non-empty `stderr`.
- [x] Verified the two results are mutually distinguishable (`exitCode` and `stderr` both differ).
- [x] Run: `node tests/check-bri-s3.2-dor-gate-evaluator.js` — 4/4 passed.

## Task 3: Wire the mock LLM gateway into the live chat turn

**Files:**
- Modify: `src/web-ui/routes/skills.js` (`registerHtmlSession`, `htmlSubmitTurn`)
- Modify: `src/web-ui/routes/journey.js` (all `getRegisterHtmlSession()(...)` call sites, `_mockScenarioForStage` helper, `e2eForceFailStage` capture)

- [x] Added `mockScenarioName` to the session object created by `registerHtmlSession`.
- [x] `htmlSubmitTurn` now passes `meta = { stage: skillName, scenarioName: session.mockScenarioName || 'success' }` to `_skillTurnExecutor`.
- [x] `journey.js`: added `_mockScenarioForStage(journey, stageName)`, gated on `mockLlmGateway.isMockGatewayEnabled()`, returning `'failure'` only for the one stage named in `journey.e2eForceFailStage` — wired at all 5 session-creation call sites (`handlePostJourney`, `handlePostGateConfirm` x3, `handlePostStories`).
- [x] `handlePostJourney` reads an optional `body.e2eForceFailStage`, only honoured when the mock gateway is enabled — zero effect in production.

## Task 4: Fixture gap for `design`/`review` stages

**Files:**
- Create: `tests/e2e/fixtures/llm-gateway/design.success.json`
- Create: `tests/e2e/fixtures/llm-gateway/review.success.json`

- [x] Mirrored bri-s3.1's fixture schema (`stage`, `scenarioName`, `model`, `response` with `---ARTEFACT-START---`/`---ARTEFACT-END---`/`---SLUG---` markers, `usage`).

## Task 5: Test-mode infrastructure for signup/product/onboarding

**Files:**
- Create: `src/web-ui/adapters/fake-test-db.js`
- Modify: `src/web-ui/server.js` (wiring + two new `/test/*` routes + real-LLM-call counter)
- Modify: `src/web-ui/routes/products.js` (`_readBody` fix)

- [x] `fake-test-db.js`: narrow in-memory `users`/`products` query support, wired as both `setUserDb` and `_pshPool` when `NODE_ENV=test` and no `DATABASE_URL`.
- [x] `server.js`: unconditional test-mode wiring of bcrypt, the real (non-streaming) `skillTurnExecutor`, and `generateProductDraft` (all three are safe without a real API key / DB).
- [x] `server.js`: `POST /test/complete-onboarding` (NODE_ENV=test only) — sets `session.firstLogin = false`, bypassing the real Stripe-Checkout-backed plan-selection gate.
- [x] `server.js`: `GET /test/real-llm-call-count` (NODE_ENV=test only) — backed by an `https.request` wrapper counting calls to `api.anthropic.com`/`githubcopilot.com`.
- [x] `products.js`: `_readBody` helper + `req.body = await _readBody(req)` in `handlePostProductNew`/`handlePostProductConfirm`.

## Task 6: The `@mocked` Playwright spec

**Files:**
- Create: `tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js`

- [x] AC1: real signup -> `/welcome` -> `/test/complete-onboarding` -> `GET /dashboard` contains a "Create your first product" link.
- [x] AC2/AC3: real product creation, then the full outer loop driven via `page.request` (matching this repo's existing E2E convention — see `skill-launcher.spec.js`), through to a passing `definition-of-ready` and a visible `/journey/:id/complete` gate-pass state.
- [x] AC4: a second journey run with `e2eForceFailStage: 'definition-of-ready'` — the mock gateway's `failure` fixture has no artefact markers, so `done` never becomes `true` and no gate-confirm/complete page is reachable; the assistant's "BLOCKED" text is asserted as the visibly/textually distinct fail state.
- [x] AC5: `GET /test/real-llm-call-count` asserted unchanged before/after both journeys.
- [x] Run: `npx playwright test tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js` — see verification-scripts run log for the final pass/fail count.

## Task 7: Register new test files

**Files:**
- Modify: `package.json`

- [x] Appended `node tests/check-bri-s3.2-journey-response-shape.js && node tests/check-bri-s3.2-dor-gate-evaluator.js` to `scripts.test`.

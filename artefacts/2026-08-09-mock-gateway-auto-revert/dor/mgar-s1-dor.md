## Definition of Ready: mgar-s1 — Auto-revert the staging mock LLM gateway override, and force it on before CI staging E2E runs

**Story:** artefacts/2026-08-09-mock-gateway-auto-revert/stories/mgar-s1-auto-revert-and-ci-enforcement.md
**Review artefact:** artefacts/2026-08-09-mock-gateway-auto-revert/review/mgar-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-mock-gateway-auto-revert/test-plans/mgar-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/modules/mock-llm-gateway.js` — add TTL tracking to `setRuntimeMockGatewayOverride`/`isMockGatewayEnabled` (AC1-AC3); an injectable clock/`_now()` for testability.
- `src/web-ui/routes/admin-mock-gateway.js` — extend the page copy to state TTL/remaining time when the override is `false` (AC4).
- `tests/e2e/fixtures/admin-credits-topup.js` — export `_adminLogin`/`_adminSignupOnce` (or extract into a small shared helper) for reuse; no behaviour change to the functions themselves.
- `tests/e2e/fixtures/ensure-mock-gateway-on.js` (new) — the CI-invoked helper (AC5), reusing the exported admin-session functions.
- `.github/workflows/e2e.yml` — new step in `scenario-a-staging-e2e` and `scenario-b-staging-e2e`, before the real Playwright test step, invoking the new helper (AC5).
- `tests/check-mgar-s1-*.js` (new) — unit/integration tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/modules/mock-llm-gateway.js`'s fixture-loading logic (`getMockResponse`, `_loadFixtureFile`, `inventoryFixtures`) — untouched.
- `admin-credits-topup.js`'s `topUpTestTenantCredits` function itself and its own callers — only its two internal helpers gain exports; no caller's behaviour changes.
- Any change to `ADMIN_GITHUB_LOGINS` provisioning — already done, not touched.

### Architecture Constraints

No new architectural decision beyond what's already stated in the story (TTL applies only to the "off" direction; production hard-override precedence unchanged; admin-session reuse over a new mechanism). No ADR required — this extends an existing, already-documented tri-state design (amgt-s1) rather than introducing a new pattern.

### Human oversight

**Medium** — touches CI workflow YAML (real staging behaviour) and a safety-relevant default (auto-revert timing choice, 60 minutes). Recommend the operator confirm the TTL value before merge; everything else (TTL mechanics, admin-session reuse, page copy) is low-risk and well-precedented.

### Coding Agent Instructions

1. In `mock-llm-gateway.js`, add a module-level `_runtimeOverrideSetAt` (timestamp, `null` when unset) alongside `_runtimeOverride`. `setRuntimeMockGatewayOverride(value)` sets both `_runtimeOverride = !!value` and, only when `value` is falsy, `_runtimeOverrideSetAt = Date.now()` (or an injectable `_now()` for tests) — when `value` is truthy, clear `_runtimeOverrideSetAt` to `null` (AC2: the "on" direction never expires, so it has nothing to track).
2. Define `const OVERRIDE_TTL_MS = 60 * 60 * 1000;` (60 minutes) near the top of the file with a comment explaining the token-cost-safety rationale.
3. In `isMockGatewayEnabled()`, after the production hard-override check and before returning `_runtimeOverride` for the non-null case: if `_runtimeOverride === false` and `_runtimeOverrideSetAt !== null` and `(Date.now() - _runtimeOverrideSetAt) > OVERRIDE_TTL_MS`, treat the override as expired — reset it to `null`/`null` (calling the equivalent of `resetRuntimeMockGatewayOverride()`) and fall through to the env-var fallback logic instead of returning `false`. Log the auto-revert event via the same `console.info(JSON.stringify({event: ...}))` pattern already used by the admin toggle route.
4. `resetRuntimeMockGatewayOverride()` also clears `_runtimeOverrideSetAt`.
5. In `admin-mock-gateway.js`'s `adminMockGatewayGet`, when the current effective state is `false` (real calls) AND the runtime override is the reason (not just the env-var default), compute and render the approximate remaining time before auto-revert using a new small getter exposed from `mock-llm-gateway.js` (e.g. `getRuntimeOverrideExpiresAt()`).
6. In `admin-credits-topup.js`, add `_adminLogin` and `_adminSignupOnce` to `module.exports` — no other changes to that file.
7. Create `tests/e2e/fixtures/ensure-mock-gateway-on.js`: a small function that establishes the `e2e-test-admin@example.test` session (reusing the newly-exported helpers) and POSTs to `/api/admin/mock-gateway/toggle` with `nextState=on`, returning `{ forcedOn: boolean, reason?: string }` — mirroring `topUpTestTenantCredits`'s non-throwing pattern exactly.
8. In `.github/workflows/e2e.yml`, add a new step to both `scenario-a-staging-e2e` and `scenario-b-staging-e2e`, gated by the same opt-in-flag condition as the existing steps in each job, running a small inline `node -e` (or a new tiny script under `scripts/`) that calls the new fixture helper and logs its result — placed immediately before the "Run Scenario A/B E2E..." step.
9. Write the tests per the test plan; confirm AC6 by re-running `tests/check-amgt-s1-mock-gateway-toggle.js`.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified (AC4 is text-content-only, not layout — no RISK-ACCEPT needed)

**PROCEED: Yes**

## Story: Auto-revert the staging mock LLM gateway override, and force it on before CI staging E2E runs

**Epic reference:** None — short-track (bounded safety fix)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [platform/CI, web-ui]

## User Story

As an **operator or CI system using wuce-staging**,
I want **the mock LLM gateway to never stay silently switched to "real calls" longer than a bounded window, and to be explicitly forced back on before any automated test run that depends on it**,
So that **a manual debugging toggle can never cause a later, unrelated session or test run to unknowingly burn real LLM API token cost**.

## Benefit Linkage

**Metric moved:** Direct availability/cost-safety fix (short-track, no formal benefit-metric artefact) — reported live (2026-08-09) after the operator manually toggled the staging mock gateway off during a debugging session and flagged, correctly, that nothing reverts it.

**How:** Direct source inspection of `src/web-ui/modules/mock-llm-gateway.js` confirms the mechanism: `isMockGatewayEnabled()` checks `NODE_ENV === 'production'` (hard override, always safe) first, then a runtime override (`_runtimeOverride`, set via the admin toggle UI at `src/web-ui/routes/admin-mock-gateway.js`) if non-null, then falls back to `NODE_ENV === 'test' || MOCK_LLM_GATEWAY === 'true'`. The runtime override is a single in-memory, process-wide flag with no expiry and no timestamp tracking — once an admin sets it to `false` (real calls), it stays `false` for every subsequent request against that same running server process until a human flips it back or the process restarts/redeploys. Confirmed via this repo's own prior decisions.md entries (`2026-07-23-streaming-route-mock-gateway-wiring`) that `MOCK_LLM_GATEWAY=true` is the staging env default and that `e2e-test-admin@example.test` is a real, already-provisioned admin identity on wuce-staging (via `ADMIN_GITHUB_LOGINS`) — so the risk is specifically and only the manual-override case, not a missing baseline safeguard. The CI staging E2E jobs (`scenario-a-staging-e2e`, `scenario-b-staging-e2e` in `.github/workflows/e2e.yml`) run real Playwright specs against wuce-staging and explicitly depend on the mock gateway being on (per e2e.yml's own comment: "this spec drives a real mock-gateway-backed turn") but today do nothing to verify or enforce that state before running — they simply trust whatever the server process's current in-memory state happens to be.

## Architecture Constraints

- **The runtime override's existing precedence order is unchanged.** `NODE_ENV === 'production'` remains the absolute, first-checked hard override — this story adds a TTL (time-to-live) check only to the *runtime override* layer, strictly between the production hard-override check and the env-var fallback. Production behaviour is provably unaffected (it short-circuits before ever reaching the override).
- **The TTL applies only to the "off" (real-calls) direction, never to "on" (mock).** Leaving the mock gateway on longer than intended is a staleness/correctness concern, not a cost-safety one, and is explicitly out of scope — auto-reverting an "on" override could break an operator's own deliberate real-call debugging session for no safety benefit.
- **Reuse the existing admin-session-establishment pattern verbatim**, following this codebase's own established convention (`tests/e2e/fixtures/admin-credits-topup.js`'s `_adminLogin`/`_adminSignupOnce`, using the already-provisioned `e2e-test-admin@example.test` identity) rather than inventing a second admin-auth mechanism for CI. Those two functions are currently private to that file — this story exports them for reuse, a small, low-risk change (no behaviour change to the functions themselves).
- **No D37/adapter concern:** the runtime override is explicitly documented in its own source comment as "deliberately NOT a D37 adapter" — this story does not change that classification.
- **Graceful degradation, matching `topUpTestTenantCredits`'s established precedent:** if the admin identity's session cannot be established (e.g. not provisioned in some future environment), the new CI enforcement step must report a clear reason and not silently pass, but must also not hard-fail the whole job over a defensive step whose entire purpose is prevention, not the test itself — mirroring `admin-credits-topup.js`'s own `{ toppedUp: false, reason }` non-throwing pattern.

## Dependencies

- **Upstream:** None.
- **Downstream:** `tests/e2e/fixtures/admin-credits-topup.js` gains two new named exports (`_adminLogin` → exported, `_adminSignupOnce` → exported, or a shared helper extracted) — purely additive, no existing caller's behaviour changes.

## Acceptance Criteria

**AC1:** Given the runtime override is set to `false` (real calls) via `setRuntimeMockGatewayOverride(false)`, When more than a defined TTL (30 minutes) elapses without the override being explicitly refreshed, Then `isMockGatewayEnabled()` automatically stops honouring the stale override and falls back to the env-var default (`NODE_ENV === 'test' || MOCK_LLM_GATEWAY === 'true'`) on the next call — without requiring a process restart.

**AC2:** Given the runtime override is set to `true` (mock) at any point, When any amount of time elapses, Then it is never auto-reverted by the TTL mechanism — only the "off" direction expires.

**AC3:** Given the runtime override is refreshed (re-set to `false` again, e.g. an admin re-confirming they still want it off) before the TTL elapses, When `isMockGatewayEnabled()` is next called, Then the TTL window restarts from the refresh time, not the original set time — a deliberately-maintained "off" state during a long debugging session is not prematurely reverted mid-use.

**AC4:** Given the admin toggle page (`GET /admin/mock-gateway`), When it renders with the override currently set to `false`, Then it explicitly states the TTL and the approximate time remaining before auto-revert (honest copy — matching AC3's existing precedent of not implying persistence the implementation doesn't have, now also not implying the override will stay off indefinitely).

**AC5:** Given the `scenario-a-staging-e2e` and `scenario-b-staging-e2e` CI jobs in `.github/workflows/e2e.yml`, When either job runs its opt-in-flag-enabled path, Then a new step executes before the real Playwright test step that establishes the `e2e-test-admin@example.test` admin session (reusing the exported helper from `admin-credits-topup.js`) and POSTs to `/api/admin/mock-gateway/toggle` with `nextState=on`, logging the outcome (forced-on vs. could-not-establish-session-because-X) — matching `topUpTestTenantCredits`'s non-throwing, reason-reporting pattern rather than hard-failing the job.

**AC6:** Given the existing `tests/check-amgt-s1-mock-gateway-toggle.js` test suite, When re-run after this change, Then all existing tests still pass unchanged — this story adds TTL behaviour on top of the existing tri-state logic, it does not alter the existing null/true/false semantics tested there.

## Out of Scope

- **Changing the override's persistence model from in-memory to durable (DB/Redis).** The original amgt-s1 story deliberately chose in-memory-only, honestly documented as such; this story adds a safety bound on top of that design, not a redesign of it.
- **Provisioning the `e2e-test-admin@example.test` identity itself** — already done (confirmed live in prior decisions.md entries); this story only adds a new caller of that existing session.
- **Any change to the mock gateway's fixture-response mechanism** (`getMockResponse`, fixture files) — untouched.
- **A visible in-app banner/alert system for staging operators beyond the admin toggle page itself.** The admin page's own copy (AC4) is the extent of this story's UI surface; a broader alerting mechanism (Slack notification, dashboard warning) is a reasonable follow-on but not required to close the specific token-cost risk this story targets.

## NFRs

- **Performance:** Negligible — one additional `Date.now()` comparison per `isMockGatewayEnabled()` call; the new CI step adds a small, bounded amount of time (one login + one POST) to two jobs that already run for minutes against real staging.
- **Security:** None identified — reuses the existing, already-audited admin-session and CSRF mechanisms verbatim; no new credential or bypass introduced.
- **Accessibility:** Not applicable to AC1-3/5-6 (backend logic, CI). AC4's admin page copy addition follows the same accessible-text pattern already used on that page.
- **Audit:** Improves — the mock-gateway-toggle event log (`console.info(JSON.stringify({event: 'mock_gateway_toggled', ...}))`, already present) gains a natural companion signal once the TTL auto-revert fires; logging that event is included in AC1's implementation.

## Complexity Rating

**Rating:** 2 — the TTL logic itself is simple, but correctness depends on getting three things right together: the precedence-order interaction with the existing production hard-override, reusing (not duplicating) the established admin-session pattern for CI, and the CI workflow YAML changes, none of which can be fully validated without touching real staging behaviour — genuine, if bounded, ambiguity.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

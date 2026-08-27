## Test Plan: Close the race between persisting a new CSRF token and the process suspending mid-write

**Story reference:** artefacts/2026-08-27-csrf-persist-race-on-suspend/stories/cpr-s1-await-csrf-persist-before-response.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-27

---

## Pre-implementation investigation (informs this plan)

Direct source inspection confirmed the exact blast radius of Option A (chosen in `decisions.md`) before writing this plan:

- **27 production call sites of `generateCsrfToken(req)`** across 12 files. 26 are already inside `async function` handlers (adding `await` is a pure mechanical change). Exactly **1** — `dashboard.js`'s `handleDashboard` — is a plain (non-async) function and must be converted to `async function handleDashboard(req, res)`; its one caller in `server.js` (`handleDashboard(req, res);`, not awaited) does not rely on synchronous completion, matching this codebase's existing fire-and-forget dispatch pattern for other already-async handlers, so this conversion is safe.
- **3 existing test files** call `generateCsrfToken(` synchronously and assert on its return value directly: `tests/check-sec-perf-s3-csrf-middleware.js` (M1, M2), `tests/check-sec-perf-s3-admin-credits-csrf.js`, and `tests/check-ctpr-s1-csrf-token-persistence.js` (5 call sites). All must be updated to `await` the call, or they will break immediately once `generateCsrfToken` returns a Promise instead of a string.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Token durably persisted before response sent | 1 test | — | — | — | — | 🔴 |
| AC2 | Injected-latency test proves the await genuinely waits | 1 test | — | — | — | — | 🔴 |
| AC3 | No-adapter case unchanged | 1 test | — | — | — | — | 🟢 |
| AC4 | Slow/failing write degrades gracefully, no hang | 1 test | — | — | — | — | 🟡 |
| AC5 | All existing CSRF suites (updated for async) pass | — | — | — | — | — | 🟢 |
| AC6 | End-to-end proof via injected latency (not live Fly restart) | 1 test | — | — | — | — | 🔴 |

---

## Coverage gaps

**AC6's own gap (explicitly accepted by the story):** a genuine live Fly-restart reproduction is not automatable; AC6's test uses injected write latency plus a simulated `_clearForTesting()` restart as the closest practical proxy, matching the precedent already used for `ctpr-s1`'s own AC4. This was the exact scenario that surfaced the original race live on `wuce-staging` — the injected-latency test is designed specifically to fail against the pre-fix code and pass against the fix, closing the blind spot the instant-resolving fake adapter left in `ctpr-s1`'s own suite.

---

## Test Data Strategy

**Source:** Synthetic — extends `tests/check-ctpr-s1-csrf-token-persistence.js`'s existing fixtures and fake-Redis-adapter pattern, adding a configurable-delay variant.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

New tests added to `tests/check-cpr-s1-csrf-persist-race.js`, reusing `check-ctpr-s1-csrf-token-persistence.js`'s house style and its `makeFakeRedis()` helper, extended with an optional artificial delay parameter.

### AC1: token is durably persisted before generateCsrfToken resolves

- **Action:** Wire a fake Redis adapter with a real `Map`-backed store. `await csrf.generateCsrfToken(req)`. Immediately (in the same tick, no further awaits) call the fake adapter's own read method directly.
- **Expected result:** The token is already present in the fake store — proving `generateCsrfToken` does not resolve until the write has landed, not just that a write was initiated.

### AC2/AC6: injected-latency test proves the fix actually waits (the critical regression-proof test)

- **Action:** Wire a fake Redis adapter whose `writeSession` artificially delays (e.g. `await new Promise(r => setTimeout(r, 50))`) before resolving. Call `await csrf.generateCsrfToken(req)`, then **immediately** (synchronously after the await returns) call `session._clearForTesting()` to simulate the process "restarting" the instant the response would be sent. Then exercise `sessionMiddleware`'s real Redis-rehydration path for the same session id.
- **Expected result:** The rehydrated session's `csrfToken` matches the originally-minted token — because `generateCsrfToken`'s `await` genuinely did not return until the delayed write finished, the "restart" (however soon after) can never race ahead of it. Run this test against the **pre-fix** code path first (as a sanity check the test is real) to confirm it actually fails there — expected to fail with `csrfToken` missing/undefined pre-fix, pass post-fix.

### AC3: no-adapter case unchanged

- **Action:** No adapter configured. `await csrf.generateCsrfToken(req)`.
- **Expected result:** Resolves immediately with a valid token, no throw, no hang — `persistSession`'s existing `if (!adapter) return;` guard still short-circuits cleanly even when awaited.

### AC4: slow/failing write degrades gracefully

- **Action:** Fake adapter's `writeSession` rejects (or delays past a defined cap, per whichever timeout mechanism the implementer adds per the story's Architecture Constraints).
- **Expected result:** `generateCsrfToken` still resolves (with the token) within a bounded time — never hangs indefinitely, never throws out of `generateCsrfToken` itself.

### AC5: full existing-suite regression, migrated to async

- **Action:** Update `tests/check-sec-perf-s3-csrf-middleware.js` (M1, M2), `tests/check-sec-perf-s3-admin-credits-csrf.js`, and `tests/check-ctpr-s1-csrf-token-persistence.js`'s 5 call sites to `await csrf.generateCsrfToken(req)`. Re-run all 3 files plus the remaining 6 CSRF-focused test files that don't call `generateCsrfToken` directly (`check-rcfc-s1-*` ×4, `check-sec-perf-s3-auth-email-csrf.js`, `check-sec-perf-s3-billing-checkout-csrf.js`, `check-sec-perf-s3-team-members-csrf.js`).
- **Expected result:** All pass — this fix does not change `csrfGuard`'s validation logic, `csrfField`'s output shape, or the token generation/idempotency semantics, only when the underlying persist-write is awaited.

---

## Integration Tests

**Route-level smoke check (not a new automated test, a manual verification step — see verification script):** with `dashboard.js`'s `handleDashboard` now `async`, confirm `GET /dashboard` still renders correctly end-to-end (the one non-mechanical production-code change in this story).

---

## E2E Tests

None new. AC2/AC6's injected-latency unit test is the closest practical automated proxy for the live restart scenario, per the story's own Out of Scope ("building live Fly-restart automation into the test suite" is explicitly excluded).

---

## NFR Tests

None named — story's own NFR section covers the one-time-per-session latency cost and confirms no new security surface.

---

## Out of Scope for This Test Plan

- Any test against a real Fly.io machine restart — not automatable, per the story's own Out of Scope.
- Re-testing every one of the 27 production call sites individually with a dedicated new test — covered instead by re-running each touched route file's own existing test suite (see Coding Agent Instructions in the DoR for the exact list), since none of those files' own tests assert anything about CSRF token *timing*, only about the token being present/valid in rendered output, which is unaffected by this change.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| A 28th future call site of `generateCsrfToken` forgetting `await` | JS doesn't statically enforce awaiting a promise; a forgotten `await` compiles and runs, just races again | Flagged in the story's own Revisit trigger; not solved by this test plan, which can only cover what exists today |

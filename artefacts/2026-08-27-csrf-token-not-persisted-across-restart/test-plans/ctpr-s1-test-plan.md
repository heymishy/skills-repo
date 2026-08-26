## Test Plan: Persist a newly-generated CSRF token to Redis immediately, not never

**Story reference:** artefacts/2026-08-27-csrf-token-not-persisted-across-restart/stories/ctpr-s1-persist-csrf-token-on-generation.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | New token generation triggers a Redis persist | 1 test | — | — | — | — | 🔴 |
| AC2 | Idempotent reuse does NOT trigger a persist | 1 test | — | — | — | — | 🟢 |
| AC3 | No-adapter case behaves exactly as before | 1 test | — | — | — | — | 🟢 |
| AC4 | End-to-end: token survives a simulated restart via Redis rehydration | 1 test | — | — | — | — | 🔴 |
| AC5 | Existing CSRF test suites unaffected | — | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC1/AC4 marked 🔴 since these are the two tests that actually prove the fix (not just that a function was called).

---

## Test Data Strategy

**Source:** Synthetic — minimal `req`/`session` fixtures, following `tests/check-sec-perf-s3-csrf-middleware.js`'s existing `{ session: {} }` pattern, extended with `req.sessionId` and `middleware/session.js`'s `setRedisAdapterForTesting` seam (already used by `tests/check-p3.2-redis-session-adapter.js`/`check-p3.3-persistence-survival.js`) to stub a fake Redis adapter.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in a new file, `tests/check-ctpr-s1-csrf-token-persistence.js`, following `tests/check-sec-perf-s3-csrf-middleware.js`'s exact house style (plain `assert`, a `test()`/`queue` runner, `makeRes()` helper reused/copied).

### AC1: generateCsrfToken persists a newly-minted token

- **Action:** Wire a fake Redis adapter via `session.setRedisAdapterForTesting({ writeSession: async (id, data) => { calls.push({id, data}); }, readSession: async () => null, deleteSession: async () => {} })`. Create a real session via `session.createSession()` (so `req.sessionId` corresponds to a real entry in the module's internal `_sessions` map — required for `persistSession` to find data to write). Call `csrf.generateCsrfToken({ session: session.getSession(id), sessionId: id })`.
- **Expected result:** `calls.length === 1`; `calls[0].data.csrfToken` matches the token `generateCsrfToken` returned.

### AC2: idempotent reuse does not re-persist

- **Action:** Same setup as AC1. Call `generateCsrfToken` twice on the same session/req.
- **Expected result:** `calls.length === 1` after both calls (only the first, token-minting call triggers a write).

### AC3: no-adapter case unaffected

- **Action:** Ensure no adapter is wired (`setRedisAdapterForTesting(null)`, matching this repo's existing "no adapter" test convention). Call `generateCsrfToken({ session: {} })` (no `sessionId` at all, matching every pre-existing call site's usage in the current test suite).
- **Expected result:** Returns a valid hex token, does not throw, behaves identically to the function's behaviour before this fix.

### AC4: end-to-end — token survives simulated restart via Redis rehydration

- **Action:** Wire a fake Redis adapter with real read/write semantics (an in-memory `Map` standing in for Redis itself, not a spy). Create a session, call `generateCsrfToken` to mint and persist a token. Simulate a restart by clearing the module's in-memory `_sessions` map (`session._clearForTesting()`, already exported for this exact purpose per `check-p3.3-persistence-survival.js`'s precedent). Run `sessionMiddleware` again with the same session's cookie header — exercising the existing `srf-s1` Redis-rehydration path.
- **Expected result:** The rehydrated `req.session.csrfToken` equals the originally-minted token — proving the fix closes the actual reported gap end-to-end, not just that a function got called along the way.

### AC5: existing suites regression

- **Action:** Re-run `tests/check-sec-perf-s3-csrf-middleware.js`, `tests/check-rcfc-s1-journey-forms-csrf.js`, `tests/check-rcfc-s1-legacy-login-csrf.js`, `tests/check-rcfc-s1-products-csrf.js`, `tests/check-rcfc-s1-skills-sessions-csrf.js`, `tests/check-sec-perf-s3-admin-credits-csrf.js`, `tests/check-sec-perf-s3-auth-email-csrf.js`, `tests/check-sec-perf-s3-billing-checkout-csrf.js`, `tests/check-sec-perf-s3-team-members-csrf.js`.
- **Expected result:** All pass unchanged.

---

## Integration Tests

None beyond the existing regression suites listed under AC5.

---

## E2E Tests

None. This is a server-side session/Redis persistence fix verifiable via direct function calls and a fake Redis adapter, matching the precedent set by `tests/check-p3.3-persistence-survival.js`.

---

## NFR Tests

None named — story's own NFR section rates Performance "negligible" and Security "no new surface."

---

## Out of Scope for This Test Plan

- A real, live Fly.io restart reproduction — not practical to automate; AC4's `_clearForTesting()` simulation is the established precedent for this exact class of scenario in this repo (`check-p3.3-persistence-survival.js`).
- Any UI-facing test for the 403 "Forbidden" page itself — unchanged by this story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

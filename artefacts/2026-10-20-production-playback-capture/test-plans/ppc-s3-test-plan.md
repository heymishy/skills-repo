## Test Plan: Rate-limit the capture-trigger endpoint per tenant user

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s3.md`
**Epic reference:** `artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md`
**Test plan author:** Claude (session)
**Date:** 2026-10-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Rejects a second trigger within the rate-limit window with a clear message | 2 | 1 | — | — | — | 🟢 |
| AC2 | Rate limiting is scoped per user, not per tenant | 1 | 1 | — | — | — | 🟢 |
| AC3 | A request after the window expires is allowed normally | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A single test user, two trigger attempts within the configured window | Synthetic fixture | None | Reuses `createRateLimiter`'s existing test conventions from `sign-off.js` |
| AC2 | Two distinct test users within the same tenant | Synthetic fixture | None | |
| AC3 | An injected/controllable clock to advance past the window | Mocked | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Rejects a second request from the same user within the rate-limit window

- **Verifies:** AC1
- **Precondition:** `createRateLimiter` configured with the same parameters as `sign-off.js`'s existing usage.
- **Action:** Call the limiter twice for the same user within the configured window.
- **Expected result:** The first call is allowed; the second call is rejected.
- **Edge case:** No.

### Rejection response is a distinct rate-limit error, not a silent failure or queued duplicate

- **Verifies:** AC1
- **Precondition:** The limiter has just rejected a call (from the test above).
- **Action:** Inspect the shape of the rejection response.
- **Expected result:** Contains an explicit rate-limit error code/message, distinguishable from a generic failure or a silently queued/no-op response.
- **Edge case:** No.

### Two different users are tracked independently

- **Verifies:** AC2
- **Precondition:** Two distinct test user ids within the same tenant.
- **Action:** Call the limiter twice for user A (first allowed, second blocked), then call it once for user B.
- **Expected result:** User B's call is allowed — user A's exhausted limit does not affect user B.
- **Edge case:** No.

### A request after the window has expired is allowed

- **Verifies:** AC3
- **Precondition:** An injected clock that advances past the configured rate-limit window after the first call.
- **Action:** Call the limiter again after the window has elapsed.
- **Expected result:** The call is allowed — no false-positive lockout.
- **Edge case:** Yes — also assert the boundary: a call made exactly at window expiry (not after) is allowed, not rejected by an off-by-one error.

### Rate-limit error message markup is accessible, not a visual-only toast

- **Verifies:** NFR — Accessibility
- **Precondition:** A rate-limit rejection response has just been rendered.
- **Action:** Inspect the rendered error message's markup.
- **Expected result:** Includes `role="alert"` (or an equivalent `aria-live` region) — not styling-only with no accessible announcement.
- **Edge case:** No.

---

## Integration Tests

### Capture-trigger endpoint applies the rate limiter before invoking capture logic

- **Verifies:** AC1
- **Components involved:** Route handler, rate-limiter middleware, injected (mocked) capture logic
- **Precondition:** The rate limiter is already exhausted for this user.
- **Action:** `POST` to the capture-trigger endpoint.
- **Expected result:** The mocked capture logic is never invoked; the response is the rate-limit rejection, not a success response.

### Rate limiting is scoped per user, not per tenant, at the endpoint level

- **Verifies:** AC2
- **Components involved:** Route handler, rate-limiter middleware
- **Precondition:** User A and user B both belong to the same tenant; user A's limit is exhausted.
- **Action:** User B triggers a capture via the endpoint.
- **Expected result:** User B's request succeeds (the mocked capture logic is invoked) — user A's usage does not block it.

---

## NFR Tests

### Performance — negligible overhead

- **NFR addressed:** Performance
- **Measurement method:** No new test — this story reuses the existing, already-proven `createRateLimiter` implementation unchanged (same as `sign-off.js`'s own usage); not independently re-benchmarked.
- **Pass threshold:** N/A
- **Tool:** N/A — stated explicitly, no new test written.

### Security — mitigates basic resource exhaustion only

- **NFR addressed:** Security
- **Measurement method:** Not applicable — this story does not claim to prevent sophisticated or distributed abuse (explicitly out of scope per `discovery.md`'s Constraints section); no test is written for a property the story doesn't claim.
- **Pass threshold:** N/A
- **Tool:** N/A — stated explicitly.

---

## Out of Scope for This Test Plan

- A system-wide/global concurrency cap across all tenants — explicitly fast-follow per `discovery.md`; nothing to test here.
- Per-tenant (as opposed to per-user) limiting — this story limits per-user only, per AC2; nothing to test here.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All ACs have automated coverage; the one accessibility NFR has both an automated markup check and a manual confirmation | — |

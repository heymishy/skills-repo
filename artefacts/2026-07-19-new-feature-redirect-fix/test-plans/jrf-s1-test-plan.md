## Test Plan: Fix "New feature" redirecting to the sign-in page for logged-in users

**Story reference:** artefacts/2026-07-19-new-feature-redirect-fix/stories/jrf-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | redirect target is a real, existing route (200, not login page) | — | 2 | — | — | — | 🟢 |
| AC2 | redirected page shows the new journey's discovery stage | — | 2 | — | — | — | 🟢 |
| AC3 | genuinely unauthenticated requests still redirect to sign-in | — | 2 | — | — | — | 🟢 |
| AC4 | no regression across the rest of the router chain | — | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Fixtures — a mock authenticated session, a mock unauthenticated request, an in-memory/mocked journeys table.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1-AC2 | Authenticated session fixture + a product fixture, POST to the New Feature endpoint | Fixture | None | |
| AC3 | Request fixture with no session / expired session | Fixture | None | |
| AC4 | Existing router-chain test fixtures already in the suite | Existing fixtures | None | Re-run, not new |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Integration Tests

### IT1 — New Feature redirect target returns 200, not the login page
- **Verifies:** AC1
- **Components involved:** `handlePostProductFeature`, the corrected redirect target route, `server.js`'s router
- **Precondition:** Authenticated session, existing product
- **Action:** POST to `/products/:id/features`, follow the resulting redirect
- **Expected result:** Final response is HTTP 200 on a real route — not the login page's HTML, confirmed by asserting the response body does NOT match `renderLoginPage()`'s known markers (e.g. "Sign in to continue")

### IT2 — Redirected page shows the correct, newly-created journey
- **Verifies:** AC1, AC2
- **Components involved:** Same as IT1
- **Precondition:** Same as IT1
- **Action:** Same as IT1, inspect the response body
- **Expected result:** Response body contains the discovery stage for the specific `journeyId` just created (not a generic journey list, not a different journey)

### IT3 — Existing valid journey-entry route still works standalone (regression guard)
- **Verifies:** AC2
- **Components involved:** Whichever existing route the fix targets
- **Precondition:** A journey created via a path unrelated to this story (e.g. directly via the journey store)
- **Action:** Request that route directly, not via the New Feature redirect
- **Expected result:** Unchanged from current behaviour — this fix must not alter how that route behaves for its existing callers

### IT4 — Genuinely unauthenticated request still redirects to sign-in
- **Verifies:** AC3
- **Components involved:** `handlePostProductFeature` (or its redirect target), auth guard
- **Precondition:** No session / expired session
- **Action:** Attempt the New Feature POST flow with no valid session
- **Expected result:** Redirected to sign-in — this fix does not create an auth bypass

### IT5 — Full router-chain regression pass
- **Verifies:** AC4
- **Components involved:** All existing route tests in the suite
- **Precondition:** None
- **Action:** Run the existing full test suite
- **Expected result:** No previously-passing route test starts failing because of this change

---

## NFR Tests

### None — confirmed with story owner

No NFRs beyond the security guard covered by IT4.

---

## Out of Scope for This Test Plan

- A general audit of every redirect target in the codebase for the same class of bug — out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Exact correct redirect target isn't nailed down yet — depends on tracing `handleGetJourney`/`/journey/<slug>/resume` during implementation | Story Architecture Constraints explicitly defer this to implementation-time investigation | IT1-IT3 are written against the *behaviour* (200, not login page, shows the right journey), not a specific URL string, so they remain valid regardless of which existing/new route the fix lands on |

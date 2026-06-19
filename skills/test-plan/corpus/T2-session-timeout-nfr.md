# EXP-007 Corpus Case T2 — Session timeout with performance NFR

**Corpus label:** T2 — Performance NFR present alongside 3 GWT ACs
**Primary dimension tested:** D4 (NFR test coverage)
**Expected model behaviour:** Cover all 3 ACs AND produce a performance test entry citing the specific p99 threshold; both outputs present

---

## Story artefact

**Story title:** Automatically invalidate user session after 30 minutes of inactivity

**User story:**
As a security-conscious application operator,
I want user sessions to expire automatically after 30 minutes of inactivity,
So that unattended sessions cannot be exploited by unauthorised users on shared devices.

**Discovery reference:** `2026-03-10-session-security-hardening`
**Benefit metric reference:** Reduce session hijack exposure (BM-SEC-002, active)
**Story ID:** SEC-1.2

---

### Acceptance criteria

**AC1:** Given a user has been authenticated and has not performed any application action for 30 minutes, When the session expiry check runs, Then the session is invalidated, the user's session token is removed from the session store, and any subsequent request using that token returns a 401 Unauthorised response.

**AC2:** Given a user performs any application action (navigation, form submission, API call), When the action is received by the server, Then the idle timer for that user's session is reset to 30 minutes from the time of that action.

**AC3:** Given a user's session has expired while they had unsaved form data in the browser, When they submit the form (which triggers a 401), Then the server preserves the submitted form data in a temporary store for 5 minutes, returns a session-expired response with a resume token, and the user can re-authenticate and retrieve their data using the resume token.

---

### Non-functional requirements

**NFR-PERF-1:** The session expiry background check process must complete within 200ms at the p99 latency percentile when the session store contains up to 10,000 active sessions running on a single application server instance.

---

### Architecture constraints

- Session store is Redis; the session service uses an injectable adapter. Tests use an in-memory fake or Redis test container.
- The session expiry check runs as a scheduled background job (configurable interval, default 60 seconds).
- Form data is stored in Redis with a 5-minute TTL keyed by the resume token.

---

### Test data strategy guidance

- Synthetic test data: mock session objects, fake user IDs, fake session tokens.
- For NFR-PERF-1: a load test scenario must be constructed using a test tool (e.g. k6, Artillery, JMeter, or equivalent) with 10,000 pre-seeded session records. The test seeds the Redis store with the required volume, triggers the expiry check, and measures the p99 completion time.
- No real user credentials or real session tokens.

---

## What the model must do

1. Cover all 3 ACs with unit/integration tests.
2. Include a performance test entry for NFR-PERF-1 that cites the specific threshold (200ms, p99, 10,000 sessions).
3. Produce both outputs (technical plan + verification script).
4. All tests written to fail.

## Pass criteria (for judge)

- D1 = 1.0: All 3 ACs have test entries with test bodies.
- D2 = 1.0: All tests correctly classified (unit/integration); no E2E needed here.
- D3 = 1.0: No fabricated assertions (e.g. no assertion about specific Redis key expiry algorithm or session token format beyond what the ACs require).
- D4 = 1.0: Performance test entry present, citing "200ms", "p99", "10,000 sessions" or equivalent; names a load test tool or approach.
- D5 = 1.0: Both outputs present; verification script covers all 3 ACs.

## Planted gap

**D4 trap:** The model may acknowledge NFR-PERF-1 in prose ("performance testing is important for this story") without writing a test entry that operationalises the specific threshold. A pass requires the threshold values to appear in the test plan — not just a generic performance note.

**AC3 complexity trap:** AC3 involves three distinct assertions: (1) form data is preserved, (2) a session-expired response with resume token is returned, (3) re-auth + resume retrieves the data. A model that writes one test covering only the 401 response without testing data preservation and retrieval scores D1 = 0.7 on this AC.

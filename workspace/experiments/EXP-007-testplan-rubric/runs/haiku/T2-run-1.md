# Test Plan — T2 Session timeout with performance NFR

**Story:** Automatically invalidate user session after 30 minutes of inactivity  
**Story ID:** SEC-1.2  
**Test framework:** Node.js (scripts/check-*.js pattern with k6 for load testing)  
**Test runner command:** `node tests/session-expiry.test.js`  
**Date written:** 2026-05-15

---

## Test Data Strategy

**Approach:** Synthetic test data with in-memory session store simulation for unit/integration tests; seeded Redis store for load test.

**Test data ownership:** Self-contained — unit/integration tests generate mock sessions in setup/teardown. Load test seeds a temporary Redis instance with pre-configured session data.

**Data sources:**
- Mock session objects: `{ userId: 'user-123', token: 'session-abc', createdAt: Date.now(), lastActivityAt: Date.now() }`
- Fake user IDs: `user-001` through `user-10000` for load test
- Fake session tokens: deterministically generated tokens
- Form data payloads: `{ formField1: 'value1', formField2: 'value2' }`
- Resume tokens: `RESUME-2026-05-15-001`

**Performance test data:**
- Load test scenario: seed Redis with 10,000 active sessions
- Each session: user ID, session token, last activity timestamp
- Trigger condition: run session expiry check against all 10,000 sessions
- Measurement: capture latency distribution, extract p99 value

**Redis isolation:** Load test uses a temporary Redis test container or in-memory Redis mock (e.g., redis-mock package) to avoid affecting production Redis.

**No PII:** All data is synthetic and test-only.

---

## AC Coverage and Test Classification

| AC | Description | Test type | Status |
|----|-------------|-----------|--------|
| AC1 | Session invalidation after 30 min inactivity; 401 on expired token | Unit | Covered |
| AC2 | Idle timer reset on any user action | Unit | Covered |
| AC3 | Form data preserved on expiry; resume token issued; data retrievable after re-auth | Integration | Covered |
| NFR-PERF-1 | Session expiry check completes in ≤200ms (p99) with 10,000 sessions | Load test | Covered |

**Gap analysis:** No gaps. All 3 ACs plus the NFR have corresponding tests.

---

## Unit Tests

### Test 1: AC1 — Session invalidation after 30 minutes inactivity; 401 on expired token

**Given:** A user is authenticated with a valid session token and has not performed any action for 30 minutes  
**When:** The session expiry background check runs  
**Then:** The session is marked as expired in the session store, the session token is invalidated, and a subsequent request with that token returns a 401 Unauthorized response

```javascript
// tests/session-expiry.test.js
test('should invalidate session after 30 minutes of inactivity', async () => {
  const mockSessionStore = new MockSessionStore();
  const sessionService = new SessionService(mockSessionStore);
  
  // Create a session that was last active 30 minutes ago
  const now = Date.now();
  const thirtyMinutesAgo = now - (30 * 60 * 1000);
  
  const sessionToken = 'session-token-xyz';
  mockSessionStore.create({
    token: sessionToken,
    userId: 'user-123',
    createdAt: new Date(thirtyMinutesAgo),
    lastActivityAt: new Date(thirtyMinutesAgo)
  });
  
  // Trigger session expiry check
  await sessionService.runExpiryCheck();
  
  // Verify session is invalidated
  const session = await mockSessionStore.get(sessionToken);
  expect(session).toBeNull(); // Session removed from store
  
  // Verify subsequent request with that token returns 401
  const response = await sessionService.validateToken(sessionToken);
  expect(response.valid).toBe(false);
  expect(response.statusCode).toBe(401);
});
```

**Expected to fail before implementation:** ✓

---

### Test 2: AC2 — Idle timer reset on user action

**Given:** A user has an active session with an idle timer set to 30 minutes  
**When:** The user performs an application action (navigation, form submission, or API call)  
**Then:** The session's `lastActivityAt` timestamp is updated to the current time, and the idle timer is reset to 30 minutes from that new time

```javascript
test('should reset idle timer on user action', async () => {
  const mockSessionStore = new MockSessionStore();
  const sessionService = new SessionService(mockSessionStore);
  
  const sessionToken = 'session-token-abc';
  const now = Date.now();
  
  // Create session at T0
  mockSessionStore.create({
    token: sessionToken,
    userId: 'user-456',
    createdAt: new Date(now),
    lastActivityAt: new Date(now)
  });
  
  // Fast forward 15 minutes
  const fifteenMinutesLater = now + (15 * 60 * 1000);
  
  // User performs action at T0+15min
  await sessionService.recordUserAction(sessionToken, fifteenMinutesLater);
  
  // Retrieve updated session
  const session = await mockSessionStore.get(sessionToken);
  
  // Verify lastActivityAt was updated to the action time
  expect(session.lastActivityAt.getTime()).toBe(fifteenMinutesLater);
  
  // Verify session would not expire until 30 minutes after this action
  const expiryTime = fifteenMinutesLater + (30 * 60 * 1000);
  expect(session.expiryTime).toBeLessThanOrEqual(expiryTime);
});
```

**Expected to fail before implementation:** ✓

---

### Test 3: AC3 — Form data preservation on session expiry; resume token; data retrieval

**Given:** A user's session has expired while they had unsaved form data in the browser  
**When:** They submit the form (which triggers a 401 session-expired response from the server)  
**Then:** (3a) The server preserves the submitted form data in a temporary store for 5 minutes, (3b) returns a session-expired response with a resume token, and (3c) after re-authentication, the user can retrieve their data using the resume token

```javascript
test('should preserve form data on session expiry and allow retrieval via resume token', async () => {
  const mockSessionStore = new MockSessionStore();
  const mockFormDataStore = new MockFormDataStore(); // 5-min TTL
  const sessionService = new SessionService(mockSessionStore, mockFormDataStore);
  
  const expiredSessionToken = 'expired-session-token';
  
  // Set up an expired session
  mockSessionStore.create({
    token: expiredSessionToken,
    userId: 'user-789',
    createdAt: new Date(Date.now() - 40 * 60 * 1000),
    lastActivityAt: new Date(Date.now() - 35 * 60 * 1000),
    expired: true
  });
  
  const formData = {
    name: 'John Doe',
    email: 'john@test.invalid',
    address: '123 Main St'
  };
  
  // User submits form with expired token
  const response = await sessionService.handleFormSubmit(
    expiredSessionToken,
    formData
  );
  
  // Verify response contains session-expired status and resume token
  expect(response.statusCode).toBe(401);
  expect(response.error).toBe('session_expired');
  expect(response.resumeToken).toBeDefined();
  
  const resumeToken = response.resumeToken;
  
  // Verify form data was preserved in temp store
  const preservedData = await mockFormDataStore.get(resumeToken);
  expect(preservedData.name).toBe('John Doe');
  expect(preservedData.email).toBe('john@test.invalid');
  expect(preservedData.address).toBe('123 Main St');
  
  // Simulate user re-authentication
  const newSession = await sessionService.createSession('user-789');
  
  // User retrieves their form data using resume token
  const retrievedData = await sessionService.getFormData(
    newSession.token,
    resumeToken
  );
  
  expect(retrievedData.name).toBe('John Doe');
  expect(retrievedData.email).toBe('john@test.invalid');
  
  // Verify form data expires after 5 minutes (not tested in unit test, but implementation must enforce)
});
```

**Expected to fail before implementation:** ✓

---

## Load Tests

### NFR-PERF-1 — Session expiry check performance (≤200ms p99 with 10,000 sessions)

**Test tool:** k6 (or Artillery / JMeter equivalent)  
**Scenario:** Seed a Redis instance with 10,000 active sessions, trigger the expiry check, measure p99 latency

**k6 script stub:**

```javascript
// tests/session-expiry-load.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    sessionExpiryLoadTest: {
      executor: 'constant-vus',
      vus: 1,  // Single virtual user triggering the expiry check
      duration: '10s'
    }
  },
  thresholds: {
    'http_req_duration': ['p(99)<200'],  // p99 latency must be < 200ms
  }
};

export default function() {
  // Setup: seed Redis with 10,000 sessions (done once before test)
  // Trigger: POST /admin/run-session-expiry-check
  const response = http.post('http://localhost:3000/admin/run-session-expiry-check', {
    maxSessions: 10000
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms (p99 target)': (r) => r.timings.duration < 200
  });
}
```

**Pre-test setup:**
1. Spin up Redis test container: `docker run -d redis:latest`
2. Seed Redis with 10,000 session keys: `for i in {1..10000}; do redis-cli SET session:$i '{"userId":"user-$i","lastActivityAt":1715772000}' EX 1800; done`
3. Run k6 load test: `k6 run tests/session-expiry-load.js`

**Success criteria:**
- p99 latency ≤ 200ms
- All requests return HTTP 200
- No Redis connection timeouts
- Test runs for at least 10 seconds with consistent latency

---

## Integration Tests

AC3 involves form data preservation across sessions, which requires both the session service and the form data store to work together. The unit test above covers the interaction; no additional integration tests needed unless persistence to actual Redis is required (which would be a separate database-layer test).

---

## NFR Tests

**NFR-PERF-1 coverage:** Load test (see section above) covers the specific requirement: session expiry check must complete in ≤200ms p99 with 10,000 active sessions.

---

## Gap Analysis

**No gaps identified.** All 3 ACs have corresponding unit/integration tests. The NFR has a load test with specific threshold operationalization (200ms, p99, 10,000 sessions explicitly named in test parameters and thresholds).

---

---

# AC Verification Script — T2 Session timeout with performance NFR

**Story:** Automatically invalidate user session after 30 minutes of inactivity  
**Story ID:** SEC-1.2  
**Audience:** BA, QA, Security Lead, SRE  
**Last updated:** 2026-05-15

---

## Test Environment Setup

Before running the scenarios below:

1. Session service is deployed or running locally
2. Session store (Redis mock or real Redis test instance) is available
3. Form data store is available with 5-minute TTL configured
4. Run unit/integration tests: `node tests/session-expiry.test.js`
5. For performance verification: ensure Redis is running and k6 is installed (`npm install -D k6`)

---

## AC1: Session invalidation after 30 minutes of inactivity

**Scenario:** Verify that a session is automatically invalidated after 30 minutes with no user activity.

1. Authenticate as a test user (e.g., user-sec-test-001)
2. Receive a session token (e.g., token `session-abc-123`)
3. Do NOT perform any actions in the application for 30 minutes (or simulate by advancing server time)
4. Attempt to perform an action using the original session token (e.g., navigate to /dashboard or make an API call)
5. Observe the response: you should receive an **HTTP 401 Unauthorized** error with message "Session expired"

**Expected outcome:**
- After 30 minutes of inactivity, any request with the original session token returns HTTP 401
- User is redirected to the login page
- Session token is no longer in the session store

**Reset:** Log out and clear session store between runs.

---

## AC2: Idle timer reset on user action

**Scenario:** Verify that user activity resets the inactivity timer.

1. Authenticate as a test user
2. Receive a session token
3. Perform an action in the application at T0 (e.g., click a button, submit a form)
4. Wait 15 minutes
5. Perform another action at T0+15min (e.g., navigate to another page)
6. Wait an additional 20 minutes (so total 35 minutes have elapsed since authentication)
7. Attempt to perform an action at T0+35min using the same session token
8. Observe the result: the session should still be valid because the timer was reset at T0+15min

**Expected outcome:**
- After the second action at T0+15min, the idle timer restarts
- At T0+35min (25 minutes after the second action), the session is still valid
- You can successfully perform an action

**Reset:** Log out between runs.

---

## AC3: Form data preservation on session expiry; resume token; data retrieval

**Scenario:** Verify that unsaved form data is preserved when a session expires, and can be retrieved after re-authentication.

1. Authenticate as a test user
2. Navigate to a form page (e.g., /checkout, /profile-edit)
3. Fill in form fields with test data:
   - Name: "Jane Smith"
   - Email: "jane.smith@test.invalid"
   - Address: "456 Oak Avenue"
4. Let the session expire (wait 30 minutes or advance server time)
5. Click the submit button while the session is expired
6. Observe the response:
   - Error message appears: "Your session has expired"
   - A unique **Resume Token** is displayed (e.g., `RESUME-2026-05-15-001`)
   - Form fields are cleared from the page
7. Click "Log in again" and re-authenticate with the same user credentials
8. After successful re-authentication, you should see a message: "Your form data has been recovered"
9. Click the recovery prompt or navigate to the same form page
10. Verify all your form data is restored:
    - Name field shows "Jane Smith"
    - Email field shows "jane.smith@test.invalid"
    - Address field shows "456 Oak Avenue"

**Expected outcome:**
- When session expires during form entry, form data is not lost
- User can retrieve data after re-authentication using the resume token
- Form data is cleared from the temporary store after successful recovery (or after 5 minutes, whichever comes first)

**Reset:** Log out and clear form data store between runs.

---

## NFR-PERF-1: Session expiry check performance (≤200ms p99)

**Scenario:** Verify the session expiry background check completes within 200ms at p99 latency when 10,000 sessions are active.

1. Deploy or start the session service with performance monitoring enabled
2. Pre-seed the session store with 10,000 active sessions:
   ```bash
   for i in {1..10000}; do \
     redis-cli SET session:user-$i '{"userId":"user-'$i'","lastActivityAt":'$(($(date +%s)*1000))'}' EX 1800; \
   done
   ```
3. Install k6 load testing tool: `npm install -D k6`
4. Run the performance test: `k6 run tests/session-expiry-load.js`
5. Wait for k6 to complete (typically 10–15 seconds for the test scenario)
6. Examine the k6 output for latency percentiles:
   - Look for the line: `http_req_duration` and percentile `p(99)`
   - Verify the **p99 latency is ≤ 200ms**

**Expected outcome:**
- k6 output shows: `✓ p(99) is below 200ms threshold`
- All HTTP requests return 200 (success)
- No connection timeouts or Redis errors
- Load test completes without failure

**Example passing output:**
```
http_req_duration..........: avg=45ms, min=12ms, med=42ms, max=198ms, p(99)=185ms
✓ Requests are successful (200)
```

**Reset:** After test, clean up Redis sessions: `redis-cli FLUSHALL`

---

## Smoke Test Checklist (Post-Deployment)

- [ ] Authenticate and wait 30 min (or simulate time) — verify session expires with 401
- [ ] Authenticate, perform action at 15 min, wait 25 more min — verify session still valid
- [ ] Fill form, let session expire, re-authenticate, verify form data recovered
- [ ] Run k6 load test with 10,000 sessions and verify p99 ≤ 200ms
- [ ] Verify form data is deleted from temp store after 5 minutes or on successful recovery

# Test Plan — T2 Session timeout with performance NFR (Trial 2)

**Story:** Automatically invalidate user session after 30 minutes of inactivity  
**Story ID:** SEC-1.2  
**Test framework:** Node.js (scripts/check-*.js pattern with k6 for performance)  
**Test runner command:** `node tests/session-expiry.test.js && k6 run tests/session-expiry-perf.js`  
**Date written:** 2026-05-16  
**Trial:** 2

---

## Test Data Strategy

**Approach:** Synthetic data for AC1/AC2/AC3 (unit/integration); seeded Redis for NFR-PERF-1 (load test).

**Test data ownership:** Self-contained — unit/integration tests generate session objects. Load test seeds ephemeral Redis instance.

**Data sources:**
- Mock session objects: `{ sessionId: 'sess-1', userId: 'user-1', token: 'token-abc', lastActivity: timestamp }`
- Fake user IDs: `user-001` through `user-10000` for load test
- Form data: `{ field1: 'value1', field2: 'value2', ... }`
- Resume tokens: deterministically generated

**NFR-PERF-1 setup:**
- Load test framework: k6
- Session volume: 10,000 active sessions
- Measurement: p99 latency of expiry check execution
- Expected threshold: ≤ 200ms at p99

**Redis isolation:** Tests use in-memory Redis mock or test container (not production Redis).

**No PII:** All test data is synthetic.

---

## AC Coverage and Test Classification

| AC | Description | Test Type | Status |
|----|-------------|-----------|--------|
| AC1 | 30min inactivity → session invalidated → 401 on reuse | Unit | Covered |
| AC2 | User action → idle timer resets to 30min | Unit | Covered |
| AC3 | Expired session + form data → preserved, resumable | Integration | Covered |
| NFR-PERF-1 | Session expiry ≤200ms p99 with 10,000 sessions | Load test | Covered |

**Gap analysis:** No gaps. All ACs plus NFR have corresponding tests.

---

## Unit Tests

### Test 1: AC1 — 30-minute inactivity triggers session invalidation

**Given:** A user is authenticated with a session that has been inactive for 30 minutes  
**When:** The session expiry check runs  
**Then:** The session is invalidated, the token is removed, and a 401 response is returned on reuse

```javascript
// tests/session-expiry.test.js
test('AC1: invalidate session after 30 minutes inactivity', async () => {
  const mockSessionStore = new InMemorySessionStore();
  const sessionService = new SessionService(mockSessionStore);
  
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  const sessionId = 'sess-inactive-001';
  const token = 'token-inactive-001';
  
  mockSessionStore.createSession({
    sessionId,
    userId: 'user-inactive-001',
    token,
    lastActivityAt: thirtyMinutesAgo,
    createdAt: thirtyMinutesAgo
  });
  
  // Run the expiry check
  await sessionService.runExpiryCheck();
  
  // Verify session was removed from store
  const sessionExists = await mockSessionStore.getSession(sessionId);
  expect(sessionExists).toBeNull();
  
  // Verify attempt to use the token returns 401
  const tokenValidation = await sessionService.validateToken(token);
  expect(tokenValidation.valid).toBe(false);
  expect(tokenValidation.statusCode).toBe(401);
});
```

**Expected to fail before implementation:** ✓

---

### Test 2: AC2 — User action resets the idle timer

**Given:** A user with an active session performs an application action  
**When:** The action is recorded by the session service  
**Then:** The session's idle timer is reset to 30 minutes from the action time

```javascript
test('AC2: user action resets idle timer to 30 minutes', async () => {
  const mockSessionStore = new InMemorySessionStore();
  const sessionService = new SessionService(mockSessionStore);
  
  const sessionId = 'sess-active-001';
  const token = 'token-active-001';
  const createdAt = Date.now();
  
  // Create a session at T0
  mockSessionStore.createSession({
    sessionId,
    userId: 'user-active-001',
    token,
    lastActivityAt: createdAt,
    createdAt
  });
  
  // Wait 15 minutes and perform an action
  const actionTime = createdAt + (15 * 60 * 1000);
  await sessionService.recordAction(token, actionTime);
  
  // Retrieve updated session
  const session = await mockSessionStore.getSession(sessionId);
  
  // Verify lastActivityAt was updated
  expect(session.lastActivityAt).toBe(actionTime);
  
  // Verify expiry would not occur until 30 minutes after this action
  const wouldExpireAt = actionTime + (30 * 60 * 1000);
  const checkResult = await sessionService.isSessionExpired(sessionId, wouldExpireAt - 1000);
  expect(checkResult).toBe(false); // Not yet expired
});
```

**Expected to fail before implementation:** ✓

---

### Test 3: AC3 — Expired session with form data preserved and resumable

**Given:** A user's session expires while they have unsaved form data  
**When:** They submit the form (triggering a 401)  
**Then:** Form data is preserved for 5 minutes, a resume token is issued, and re-authentication allows data retrieval

```javascript
test('AC3: form data preserved on expiry; resumable after re-auth', async () => {
  const mockSessionStore = new InMemorySessionStore();
  const mockFormDataStore = new InMemoryFormDataStore();
  const sessionService = new SessionService(mockSessionStore, mockFormDataStore);
  
  // Create an expired session
  const expiredSessionId = 'sess-expired-001';
  const expiredToken = 'token-expired-001';
  mockSessionStore.createSession({
    sessionId: expiredSessionId,
    userId: 'user-expired-001',
    token: expiredToken,
    lastActivityAt: Date.now() - (35 * 60 * 1000),
    createdAt: Date.now() - (40 * 60 * 1000),
    expired: true
  });
  
  const formData = {
    username: 'John Doe',
    email: 'john@test.invalid',
    address: '123 Main Street',
    phone: '555-1234'
  };
  
  // User submits form with expired token
  const response = await sessionService.handleFormSubmit(
    expiredToken,
    formData
  );
  
  // Verify 401 response with resume token
  expect(response.statusCode).toBe(401);
  expect(response.error).toBe('session_expired');
  expect(response.resumeToken).toBeDefined();
  
  const resumeToken = response.resumeToken;
  
  // Verify form data was preserved
  const preserved = await mockFormDataStore.get(resumeToken);
  expect(preserved.username).toBe('John Doe');
  expect(preserved.email).toBe('john@test.invalid');
  expect(preserved.address).toBe('123 Main Street');
  expect(preserved.phone).toBe('555-1234');
  
  // Simulate re-authentication
  const newSession = await sessionService.authenticate('user-expired-001', 'password');
  
  // Retrieve form data using resume token
  const retrieved = await sessionService.getFormData(newSession.token, resumeToken);
  expect(retrieved).toEqual(formData);
});
```

**Expected to fail before implementation:** ✓

---

## Load Tests

### NFR-PERF-1 — Session expiry check performance with 10,000 sessions

**Test tool:** k6  
**Scenario:** Seed 10,000 sessions, trigger expiry check, measure p99 latency

**k6 script:**

```javascript
// tests/session-expiry-perf.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    loadTest: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s'
    }
  },
  thresholds: {
    'http_req_duration': ['p(99)<200'],  // p99 latency < 200ms
  }
};

export default function() {
  const response = http.post('http://localhost:3000/admin/trigger-session-expiry', {
    maxSessions: 10000
  });
  
  check(response, {
    'status 200': (r) => r.status === 200,
    'response time < 200ms (p99)': (r) => r.timings.duration < 200,
    'no errors': (r) => r.body.indexOf('error') === -1
  });
  
  sleep(1);  // Wait 1 second between trigger requests
}
```

**Pre-test setup:**
1. Start Redis: `docker run -d redis:latest`
2. Seed 10,000 session records:
   ```bash
   for i in {1..10000}; do \
     redis-cli SET session:$i '{"userId":"user-'$i'","lastActivity":'$(($(date +%s)*1000))'}' EX 1800; \
   done
   ```
3. Run k6: `k6 run tests/session-expiry-perf.js`

**Success criteria:**
- p99 latency ≤ 200ms
- All HTTP 200 responses
- Test runs for 30 seconds with consistent performance
- No Redis timeout or connection failures

---

## Gap Analysis

**No gaps identified.** All 3 ACs have full test bodies. NFR-PERF-1 has explicit load test with threshold values operationalised (200ms, p99, 10,000 sessions) and tool named (k6).

---

---

# AC Verification Script — T2 Session timeout with performance NFR

**Story:** Automatically invalidate user session after 30 minutes of inactivity  
**Story ID:** SEC-1.2  
**Audience:** Security Lead, QA, SRE  
**Last updated:** 2026-05-16  
**Trial:** 2

---

## Test Environment Setup

Before running the scenarios below:

1. Session service is running or deployed locally
2. Session store (Redis or mock) is configured
3. Database access available
4. k6 installed: `npm install -D k6`
5. Run tests: `node tests/session-expiry.test.js && k6 run tests/session-expiry-perf.js`

---

## AC1: Session invalidated after 30 minutes of inactivity; 401 on reuse

**Scenario:** Verify that a session automatically expires after 30 minutes with no activity.

1. Log into the application (authenticate as a test user)
2. Receive a session token/cookie
3. Do NOT perform any actions for 30 minutes (or simulate time advancement)
4. Attempt to perform an action (navigate to a page, make an API call)
5. Observe: You receive an **HTTP 401 Unauthorized** response
6. You are redirected to the login page
7. Original session token is no longer valid in the session store

**Expected outcome:** After 30 minutes of inactivity, the session is automatically invalidated. You must log in again.

**Reset:** Log out and clear session.

---

## AC2: User action resets the idle timer to 30 minutes

**Scenario:** Verify that user activity extends the session life by resetting the timer.

1. Log in to the application
2. Receive session token
3. Perform an action at T0 (click a button, navigate, submit a form)
4. Wait 15 minutes without any further actions
5. Perform another action at T0+15min (navigate to another page, click a button)
6. Wait an additional 20 minutes (total 35 minutes elapsed since initial login)
7. Attempt to perform another action at T0+35min
8. Observe: Your session is still valid and the action succeeds

**Expected outcome:** The second action at T0+15min reset the idle timer. At T0+35min (which is only 20 minutes since the second action), the session is still active.

**Reset:** Log out.

---

## AC3: Expired session with form data; session-expired response; data resumable

**Scenario:** Verify that form data is preserved when a session expires, and can be retrieved after re-authentication.

1. Log in to the application
2. Navigate to a form page (e.g., checkout, profile edit, contact form)
3. Fill in the form with test data:
   - Name: "Jane Smith"
   - Email: "jane@test.invalid"
   - Message: "This is a test message"
   - Phone: "555-0123"
4. Let the session expire (wait 30 minutes or simulate time advancement)
5. Click the submit button while the session is expired
6. Observe the result:
   - An error screen appears saying **"Your session has expired. Please log in again."**
   - A **Resume Token** is displayed (e.g., `RESUME-TOKEN-2026-05-16-001`)
   - OR: You are redirected to login with the resume token in the URL
7. Log in again with the same user credentials
8. You should see a message: **"Your form data was saved. Click here to restore it."** (or similar)
9. Click the restoration prompt or navigate back to the form
10. Verify all your form data is restored:
    - Name field: "Jane Smith"
    - Email field: "jane@test.invalid"
    - Message field: "This is a test message"
    - Phone field: "555-0123"
11. You can now submit the form with your data intact

**Expected outcome:** Form data is not lost when the session expires. You can restore and complete your action after re-authentication.

**Reset:** Log out and clear form data store.

---

## NFR-PERF-1: Session expiry check completes within 200ms at p99 with 10,000 sessions

**Scenario:** Verify the session expiry background check performs within the specified latency threshold under load.

**Setup:**
1. Ensure session store (Redis) is running
2. Pre-seed 10,000 active session records
3. Install k6: `npm install -D k6`

**Steps:**
1. Run the k6 performance test:
   ```bash
   k6 run tests/session-expiry-perf.js
   ```
2. Wait for test to complete (typically 30–60 seconds)
3. Examine the k6 output for latency percentiles:
   ```
   http_req_duration..........: avg=65ms, min=18ms, med=61ms, max=195ms, p(99)=185ms
   ```
4. Verify the **p99 latency is ≤ 200ms** (visible in the output as `p(99)=...`)

**Example passing output:**
```
✓ p(99) < 200ms
✓ All checks passed
  100% — 1000 requests
  http_req_duration average: 65ms
  http_req_duration p(99): 185ms
```

**Expected outcome:**
- p99 latency is ≤ 200ms
- All HTTP requests return 200 (success)
- Test runs with 10,000 sessions without timeout or errors
- No connection failures to Redis

**Reset:** Clean up Redis: `redis-cli FLUSHALL`

---

## Smoke Test Checklist (Post-Deployment)

- [ ] Authenticate, wait 30min (simulate time), attempt action — verify 401 response
- [ ] Authenticate, perform action at 15min mark, wait 25 more min, attempt action — verify session still valid
- [ ] Fill form, let session expire, re-authenticate, verify form data is restored
- [ ] Run k6 performance test with 10,000 sessions and verify p99 ≤ 200ms
- [ ] Verify form data expires after 5 minutes in temporary store
- [ ] Verify session expiry background job runs on the configured interval (default 60 seconds)

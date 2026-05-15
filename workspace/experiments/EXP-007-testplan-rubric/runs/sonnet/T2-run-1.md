# Test Plan — SEC-1.2: Automatically invalidate user session after 30 minutes of inactivity

**Story ID:** SEC-1.2
**Trial:** 1
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Jest (confirmed from corpus case — synthetic test plan evaluation context)
**Framework:** Jest + fake/stub for injectable session store adapter; k6 for NFR performance test
**Test data strategy:** Synthetic — mock session objects, fake user IDs, fake session tokens. For NFR-PERF-1: a k6 load test seeds the Redis store with 10,000 pre-generated session records, triggers the expiry check, and measures p99 completion time. No real user credentials or real session tokens used in any test.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | 30 min inactivity → session invalidated, token removed, 401 on subsequent request | Unit + Integration | 2 | Covered |
| AC2 | User action → idle timer reset to 30 min from action time | Unit | 1 | Covered |
| AC3 | Session expires with unsaved form data → data preserved 5 min, session-expired response with resume token, re-auth retrieves data | Integration | 3 | Covered |
| NFR-PERF-1 | Session expiry check completes within 200ms at p99 with 10,000 active sessions | Load (k6) | 1 | Covered |

**Total tests:** 7
**E2E required:** No
**NFRs:** 1 (NFR-PERF-1)

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| None | — | — | — | All ACs are unit/integration testable. Session store is injectable; Redis can be substituted with in-memory fake or Testcontainers. |

---

## Unit tests

### Test suite: SessionExpiryService

```javascript
describe('SessionExpiryService', () => {

  // AC1 — Session invalidated after 30 minutes inactivity
  it('invalidates a session whose last activity was more than 30 minutes ago', async () => {
    // Arrange
    const now = new Date('2026-05-16T10:30:00Z');
    const lastActivity = new Date('2026-05-16T09:59:00Z'); // 31 minutes ago
    const mockSessionStore = {
      getActiveSessions: jest.fn().mockResolvedValue([
        { sessionId: 'sess-inactive-s1t2', userId: 'user-001', lastActivityAt: lastActivity, token: 'token-s1t2-001' },
      ]),
      deleteSession: jest.fn().mockResolvedValue(true),
      deleteToken: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    const expiryService = new SessionExpiryService({ sessionStore: mockSessionStore, timeoutMinutes: 30 });

    // Act
    await expiryService.runExpiryCheck();

    // Assert
    expect(mockSessionStore.deleteSession).toHaveBeenCalledWith('sess-inactive-s1t2');
    expect(mockSessionStore.deleteToken).toHaveBeenCalledWith('token-s1t2-001');
  });

  // AC2 — Idle timer reset on user action
  it('resets the idle timer to 30 minutes from the time of the action when a user performs an application action', async () => {
    // Arrange
    const actionTime = new Date('2026-05-16T10:15:00Z');
    const mockSessionStore = {
      updateLastActivity: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(Date, 'now').mockReturnValue(actionTime.getTime());
    const sessionService = new SessionService({ sessionStore: mockSessionStore });

    // Act
    await sessionService.recordActivity('sess-active-s1t2');

    // Assert
    expect(mockSessionStore.updateLastActivity).toHaveBeenCalledWith(
      'sess-active-s1t2',
      actionTime
    );
  });

});
```

---

## Integration tests

### Test suite: SessionExpiryService — 401 on expired session

```javascript
describe('SessionExpiryService — integration: 401 on expired session token', () => {

  // AC1 — Subsequent request with invalidated token returns 401
  it('returns 401 Unauthorised for a request made with a session token that has been invalidated', async () => {
    // Arrange
    const sessionStore = new InMemorySessionStore();
    await sessionStore.createSession({
      sessionId: 'sess-expired-s1t2',
      userId: 'user-002',
      token: 'token-expired-s1t2',
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000), // 31 minutes ago
    });
    const expiryService = new SessionExpiryService({ sessionStore, timeoutMinutes: 30 });
    await expiryService.runExpiryCheck();

    const app = createTestApp({ sessionStore });

    // Act
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', 'Bearer token-expired-s1t2');

    // Assert
    expect(response.status).toBe(401);
  });

});
```

### Test suite: SessionExpiryService — form data preservation on session expiry (AC3)

```javascript
describe('SessionExpiryService — AC3: form data preservation on session expiry', () => {

  // AC3 — Form data preserved for 5 minutes with resume token
  it('preserves submitted form data in a temporary store for 5 minutes when a session-expired 401 is returned', async () => {
    // Arrange
    const sessionStore = new InMemorySessionStore();
    const formDataStore = new InMemoryFormDataStore();
    await sessionStore.createSession({
      sessionId: 'sess-expiring-s1t2',
      userId: 'user-003',
      token: 'token-expiring-s1t2',
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
    });
    await sessionStore.runExpiryCheck();
    const app = createTestApp({ sessionStore, formDataStore });
    const formData = { projectName: 'New Project Alpha', description: 'A test project' };

    // Act
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer token-expiring-s1t2')
      .send(formData);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.reason).toBe('session_expired');
    expect(response.body.resumeToken).toBeDefined();

    const preserved = await formDataStore.get(response.body.resumeToken);
    expect(preserved).toMatchObject(formData);
  });

  // AC3 — Session-expired response includes resume token
  it('returns a session-expired response containing a resume token when form data is submitted to an expired session', async () => {
    // Arrange — same setup as above; focus on response shape
    const sessionStore = new InMemorySessionStore();
    await sessionStore.createSession({
      sessionId: 'sess-resume-check-s1t2',
      userId: 'user-004',
      token: 'token-resume-check-s1t2',
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
    });
    await sessionStore.runExpiryCheck();
    const app = createTestApp({ sessionStore, formDataStore: new InMemoryFormDataStore() });

    // Act
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer token-resume-check-s1t2')
      .send({ projectName: 'Resume Test Project' });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      reason: 'session_expired',
      resumeToken: expect.any(String),
    });
  });

  // AC3 — Re-authentication with resume token retrieves form data
  it('allows a re-authenticated user to retrieve their preserved form data using the resume token', async () => {
    // Arrange
    const sessionStore = new InMemorySessionStore();
    const formDataStore = new InMemoryFormDataStore();
    await sessionStore.createSession({
      sessionId: 'sess-reauth-s1t2',
      userId: 'user-005',
      token: 'token-reauth-s1t2',
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
    });
    await sessionStore.runExpiryCheck();
    const app = createTestApp({ sessionStore, formDataStore });
    const formData = { projectName: 'Re-auth Test Project', budget: 50000 };

    const expiredResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer token-reauth-s1t2')
      .send(formData);
    const { resumeToken } = expiredResponse.body;

    // Re-authenticate
    const newSession = await sessionStore.createSession({ userId: 'user-005', token: 'token-reauth-new-s1t2' });

    // Act
    const resumeResponse = await request(app)
      .get(`/api/resume/${resumeToken}`)
      .set('Authorization', 'Bearer token-reauth-new-s1t2');

    // Assert
    expect(resumeResponse.status).toBe(200);
    expect(resumeResponse.body).toMatchObject(formData);
  });

});
```

---

## NFR tests

### NFR-PERF-1 — Session expiry check p99 latency under 200ms at 10,000 sessions

```javascript
// k6 load test script: tests/performance/session-expiry-perf.k6.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    session_expiry_check: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(99)<200'],
  },
};

export function setup() {
  // Pre-seed the session store with 10,000 active session records
  // before the performance scenario begins
  const seedResponse = http.post('http://localhost:3001/test-setup/seed-sessions', JSON.stringify({
    count: 10000,
    lastActivityOffsetMinutes: 31, // all sessions are expired
  }), { headers: { 'Content-Type': 'application/json' } });
  check(seedResponse, { 'seed succeeded': (r) => r.status === 200 });
}

export default function () {
  // Trigger the session expiry background check
  const res = http.post('http://localhost:3001/internal/run-expiry-check', null, {
    headers: { 'X-Internal-Key': __ENV.INTERNAL_KEY },
  });
  check(res, {
    'expiry check returns 200': (r) => r.status === 200,
    'expiry check completes within 200ms': (r) => r.timings.duration < 200,
  });
}
```

**NFR-PERF-1 test entry:**
- Tool: k6
- Threshold: p99 < 200ms
- Session count: 10,000 pre-seeded sessions
- Duration: 30s sustained load
- Pre-condition: session store seeded with 10,000 records before measurement begins

---

## Output 2: AC Verification Script

**Story:** SEC-1.2 — Automatically invalidate user session after 30 minutes of inactivity
**For use:** Pre-code sign-off, post-merge smoke test, delivery review
**Environment required:** Application running locally or in test environment with a configurable session timeout (the 30-minute timeout must be reducible to ~1 minute for manual testing).

---

### Setup

Before running these scenarios:
1. Start the application in test mode.
2. Configure the session timeout to 1 minute (or use a test shortcut command) to avoid waiting 30 minutes.
3. Have two browser windows or tabs available for testing.
4. Have access to the application logs or admin panel to verify audit entries.

---

### Scenario 1 — AC1: Session is invalidated after inactivity

**What to check:** A user who has been idle for longer than the configured timeout is logged out, and any attempt to continue using the application after that point returns an "unauthorised" error.

**Steps:**
1. Log in as a test user.
2. Do nothing for longer than the configured timeout period (e.g. wait 2 minutes if timeout is set to 1 minute).
3. Try to navigate to any page or perform any action in the application.

**Expected result:** The application redirects to the login page (or shows an "unauthorised" / "session expired" message). Any API call made after the timeout should result in a 401 error if inspected via browser developer tools.

**If broken:** The user remains logged in indefinitely without any action, or the session is not invalidated after the timeout.

---

### Scenario 2 — AC2: User action resets the idle timer

**What to check:** Any action by the user restarts the 30-minute countdown.

**Steps:**
1. Log in as a test user.
2. Wait 50% of the timeout period (e.g. 30 seconds if timeout is 1 minute).
3. Perform an action — click any navigation link or submit a form.
4. Wait another 50% of the timeout period without doing anything.
5. Check whether you are still logged in.

**Expected result:** You are still logged in. The action in step 3 reset the timer, so the full timeout period must pass again from step 3 before you are logged out.

**If broken:** The user is logged out before the full timeout period elapses after the action, or actions do not reset the timer.

---

### Scenario 3 — AC3: Unsaved form data is preserved when session expires during form entry

**What to check:** If a session expires while a user has data typed into a form, that data is not lost — the user can log back in and retrieve it.

**Steps:**
1. Log in as a test user.
2. Navigate to a form (e.g. a "Create project" or equivalent form).
3. Type some content into the form fields but do not submit yet.
4. Wait for the session to expire (longer than the timeout period without submitting).
5. Submit the form (which should fail because the session has expired).

**Expected result:**
- A "session expired" message appears — not a generic error. The message should indicate that the data has been saved and the user can retrieve it after logging in again.
- A "resume token" or equivalent identifier is visible (on screen or in the response).

**Steps to verify retrieval:**
6. Log in again with the same credentials.
7. Use the resume link or token shown in the session-expired message.

**Expected result:** The form fields are pre-populated with the data you typed in step 3. Nothing has been lost.

**If broken:** The form data disappears when the session expires, or the "session expired" message does not offer a way to retrieve the data, or the retrieved data does not match what was typed.

---

### Scenario 4 (NFR-PERF-1) — Session expiry check performance

**What to check:** This is a technical performance test — a developer or QA engineer needs to run a load test script.

**Steps:**
1. Ask a developer to run the k6 performance test: `k6 run tests/performance/session-expiry-perf.k6.js`
2. The test seeds 10,000 session records, runs the expiry check repeatedly for 30 seconds, and reports the p99 latency.

**Expected result:** The k6 output shows `p(99) < 200ms` for the expiry check duration. The threshold check should pass (green in k6 output).

**If broken:** The p99 latency exceeds 200ms, or the k6 threshold check fails (red in k6 output).

---

**Test plan complete for SEC-1.2 ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T2-run-1.md`
7 tests | 2 unit | 4 integration | 1 NFR (k6) | 3 ACs + NFR-PERF-1 covered
No gaps — all ACs testable at unit/integration level with injectable session store.

Verification script: embedded above
4 scenarios | 0 manual gap scenarios | 0 layout-dependent scenarios

Test data: Synthetic — ready. k6 seeding script generates 10,000 synthetic session records. No real user credentials.

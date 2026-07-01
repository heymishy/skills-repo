# Test Plan — lab-s2.2 — Email/password — third auth provider

**Story:** lab-s2.2
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s2.2-email-password.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. The DB write adapter (`password.js` and user DB adapter) is injectable via D37 setter — tests inject a mock adapter that captures calls. No real Neon Postgres calls in unit tests.

- Bcrypt calls are real (not mocked) in tests to verify actual hashing behaviour. `bcrypt.hash` and `bcrypt.compare` are tested with real bcrypt (cost factor 10 minimum).
- `rotateSessionId` is monkeypatched to a spy.
- Rate limiter state is reset between test runs.
- Audit logger / stdout is captured to verify no password leakage.

**PCI/sensitivity:** None — test passwords are synthetic strings like `TestPassw0rd!xyz`.

**Test data gaps:** None.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | POST /auth/email/signup creates user with bcrypt hash, session | Unit | T1.1, T1.2, T1.3, T1.4 | None |
| AC2 | Duplicate email → 409 | Unit | T2.1 | None |
| AC3 | POST /auth/email/login: correct password → session; wrong → 401 | Unit | T3.1, T3.2, T3.3 | None |
| AC4 | Rate limiting: 11th attempt → 429 | Unit | T4.1, T4.2 | None |
| AC5 | Password never in plaintext in logs or responses | Unit + NFR | T5.1, T5.2, NFR1 | None |
| AC6 | `rotateSessionId` called after signup and login | Unit | T6.1, T6.2 | None |
| AC7 | "Email / password" option visible in auth chooser | Unit (HTML) | T7.1 | None |

---

## Gap table

No gaps — all ACs are unit testable. bcrypt verification uses real bcrypt library.

---

## E2E / browser-layout detection

AC7 ("Email / password option visible") is an HTML presence check, not a CSS layout check. No E2E tooling required.

---

## Unit tests

### T1 — POST /auth/email/signup (AC1)

**T1.1** — `signup-normalises-email-to-lowercase`
Covers: AC1 §1
Precondition: DB adapter monkeypatched to capture writes; password adapter (bcrypt) real; valid signup payload `{ email: 'TEST@Example.com', password: 'ValidPass123!abcde' }`
Action: Call `POST /auth/email/signup` handler
Expected: DB adapter called with `email` === `'test@example.com'` (all lowercase)
Edge case: none

**T1.2** — `signup-stores-bcrypt-hash-not-plaintext`
Covers: AC1 §2
Precondition: T1.1 setup; DB adapter captures `password_hash`
Action: Inspect the `password_hash` field passed to the DB write
Expected: `password_hash` starts with `$2b$` or `$2a$` (bcrypt prefix); it is NOT the plaintext password; `bcrypt.compare('ValidPass123!abcde', password_hash)` returns true
Edge case: Bcrypt hashes are salted — each call produces a different hash

**T1.3** — `signup-creates-session-with-correct-fields`
Covers: AC1 §4
Precondition: Successful signup; DB adapter accepts the write
Action: Inspect session after signup handler
Expected: `req.session.accessToken` is set (non-empty hex string from `crypto.randomBytes` — NOT the password hash); `req.session.userId` is set; `req.session.tenantId` equals the normalised email; `req.session.login` equals the normalised email
Edge case: `req.session.accessToken` must NOT equal the bcrypt hash

**T1.4** — `signup-redirects-to-welcome`
Covers: AC1 §6
Precondition: Successful signup
Action: Inspect response after handler
Expected: Response is 302 to `/welcome`
Edge case: none

### T2 — Duplicate email → 409 (AC2)

**T2.1** — `signup-duplicate-email-returns-409`
Covers: AC2
Precondition: DB adapter monkeypatched to throw a unique-constraint error (simulate duplicate email)
Action: Call signup handler with the duplicate email
Expected: Response is 409; body contains "Email already registered"; response does NOT contain any password hash or user ID
Edge case: The 409 body must not leak the stored hash or any user information beyond the error message

### T3 — POST /auth/email/login (AC3)

**T3.1** — `login-correct-password-creates-session`
Covers: AC3 happy path
Precondition: DB read adapter returns `{ id: 'uuid-123', email: 'user@example.com', password_hash: <real bcrypt hash of 'ValidPass123!abcde'> }`; login payload `{ email: 'user@example.com', password: 'ValidPass123!abcde' }`
Action: Call `POST /auth/email/login` handler
Expected: Response is 302 (to `/dashboard` or `/welcome`); `req.session.accessToken` is set; `rotateSessionId` was called
Edge case: Verify `bcrypt.compare` is called — not a direct string comparison

**T3.2** — `login-wrong-password-returns-401`
Covers: AC3 mismatch
Precondition: Same DB adapter; login payload has wrong password `'WrongPassword!'`
Action: Call login handler
Expected: Response is 401; body is "Invalid email or password"; no session created; `req.session.accessToken` NOT set
Edge case: none

**T3.3** — `login-nonexistent-email-returns-401-without-distinguishing`
Covers: AC3 (no distinction between wrong email and wrong password)
Precondition: DB read adapter returns `null` (user not found)
Action: Call login handler with non-existent email
Expected: Response is 401; body is "Invalid email or password" — identical to T3.2 (no "user not found" distinction)
Edge case: Timing attack: response time should not reveal whether the user exists; note this as a future improvement if timing differs significantly

### T4 — Rate limiting (AC4)

**T4.1** — `rate-limit-allows-10-attempts`
Covers: AC4 (boundary — 10 allowed)
Precondition: Rate limiter state cleared; wrong-password login scenario
Action: Call login handler 10 times from mock IP `127.0.0.1` with wrong credentials
Expected: All 10 attempts return 401 (not 429) — up to the 10th attempt is allowed
Edge case: none

**T4.2** — `rate-limit-blocks-11th-attempt`
Covers: AC4 (over limit)
Precondition: T4.1 has run (10 attempts used); 11th attempt from same IP
Action: Call login handler for the 11th time
Expected: Response is 429 "Too many attempts"
Edge case: Rate limiter must be per-IP; a different mock IP address should still get 401 (not 429)

### T5 — Password never in plaintext (AC5)

**T5.1** — `password-not-in-db-write-payload`
Covers: AC5 §1
Precondition: DB adapter captures the exact object written; signup scenario
Action: Inspect the captured write object
Expected: The write object has `password_hash` field; it does NOT have a `password` or `plaintext` field; `password_hash` does not equal the submitted password string
Edge case: none

**T5.2** — `response-body-does-not-contain-password`
Covers: AC5 §2
Precondition: Signup and login responses captured
Action: Assert response body (both 302 redirect and any intermediate responses) does not contain the submitted password string
Expected: Password string not present in any response
Edge case: none

### T6 — `rotateSessionId` called (AC6)

**T6.1** — `rotate-session-id-called-after-signup`
Covers: AC6
Precondition: `rotateSessionId` monkeypatched to spy; successful signup
Action: Call signup handler
Expected: `rotateSessionId` called once after session is populated
Edge case: none

**T6.2** — `rotate-session-id-called-after-login`
Covers: AC6
Precondition: `rotateSessionId` spy; successful login (T3.1 scenario)
Action: Call login handler
Expected: `rotateSessionId` called once
Edge case: none

### T7 — "Email / password" option in auth chooser HTML (AC7)

**T7.1** — `auth-chooser-contains-email-password-option`
Covers: AC7
Precondition: Auth chooser page rendered
Action: Assert response HTML contains "Email" and "password" (or "Email / password") as text
Expected: The option is present in the DOM source; a form or link targeting `/auth/email/signup` or `/auth/email/login` is visible
Edge case: none

---

## Integration tests

**IT1** — `signup-then-login-round-trip`
Covers: AC1, AC3 (integration)
Precondition: In-memory user store (mock DB adapter that persists within the test); signup then login with same credentials
Action: (1) Call signup with `testuser@example.com` / `ValidPass123!abcde`. (2) Call login with same credentials.
Expected: Login returns 302 and `req.session.accessToken` is set; no error
Edge case: none

**IT2** — `email-auth-routes-registered-in-server`
Covers: AC1, AC3 (route registration)
Precondition: Server module required or route module inspected
Action: Verify `POST /auth/email/signup` and `POST /auth/email/login` routes are registered
Expected: Both routes exist; both are wired to the correct handlers
Edge case: none

---

## NFR tests

**NFR1** — `bcrypt-cost-factor-minimum-10`
Covers: NFR — bcrypt cost factor ≥ 10
Precondition: Signup scenario with real bcrypt
Action: Capture the `password_hash` string; extract the cost factor from the bcrypt hash identifier (format: `$2b$<cost>$...`)
Expected: Extracted cost factor is ≥ 10
Edge case: Cost factor 9 or lower is a FAIL

**NFR2** — `password-not-in-any-log-output`
Covers: NFR / AC5 — password never logged
Precondition: Logger output captured; signup and login scenarios run
Action: Search all captured log lines for the test password string
Expected: Zero log lines contain the test password string
Edge case: Also check that `password` key is not present as a JSON field in any structured log entry

---

## State update fields

- `totalTests`: 13
- `acTotal`: 7
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false

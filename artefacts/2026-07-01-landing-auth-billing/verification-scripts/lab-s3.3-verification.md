# AC Verification Script — lab-s3.3 — Credit enforcement — 402 turn guard

**Story:** lab-s3.3
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / Platform Engineer / QA

---

## Setup

Credits table must exist (lab-s3.1 complete). Start the server:
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

**Run automated checks first:**
```
node tests/check-lab-s3.3-credit-enforcement.js
```
Expected: all checks pass. Zero failures. Pay special attention to "anthropic-adapter-not-called" tests.

---

## Scenarios

### Scenario AC1 — Zero balance blocks the turn with 402

1. Set the test tenant's balance to 0 in the database:
   ```sql
   UPDATE credits SET balance = 0 WHERE tenant_id = 'your-test-tenant-id';
   -- If the row doesn't exist yet:
   INSERT INTO credits (tenant_id, balance) VALUES ('your-test-tenant-id', 0);
   ```
2. Log in as the test tenant and send a turn (type something in the chat interface and press Enter).
3. **Expected:** The response is an error — something like "Insufficient credits" with a link to `/settings/billing`. No AI response is generated. No Anthropic API call is made (the server logs should show the 402 was returned before any AI processing).
4. If an AI response is generated despite balance=0, AC1 fails — this is a cost exposure issue.

---

### Scenario AC2 — Negative balance also blocks the turn

1. Set the test tenant's balance to -10:
   ```sql
   UPDATE credits SET balance = -10 WHERE tenant_id = 'your-test-tenant-id';
   ```
2. Send a turn.
3. **Expected:** The response is identical to AC1 — 402, "Insufficient credits", no AI response.
4. A negative balance must be treated the same as zero.

---

### Scenario AC3 — Positive balance allows the turn and decrements the balance

1. Set the test tenant's balance to 50:
   ```sql
   UPDATE credits SET balance = 50 WHERE tenant_id = 'your-test-tenant-id';
   ```
2. Send a turn.
3. **Expected:** The AI responds normally. After the turn completes, check the balance:
   ```sql
   SELECT balance FROM credits WHERE tenant_id = 'your-test-tenant-id';
   ```
   **Expected balance:** 49 (decremented by 1, or by the value of `TURN_CREDIT_COST` if configured differently).
4. If the balance did not change, or if it changed by the wrong amount, AC3 fails.

---

### Scenario AC4 — Per-turn credit cost is configurable

1. Set `TURN_CREDIT_COST=2` in `.env` and restart the server.
2. Set the test tenant's balance to 50.
3. Send a turn.
4. **Expected:** Balance after the turn is 48 (decremented by 2).
5. Remove `TURN_CREDIT_COST` from `.env`, restart, set balance to 50, send a turn.
6. **Expected:** Balance after the turn is 49 (default cost = 1).

---

### Scenario AC5 — Enforcement fires before any processing

1. Set the test tenant's balance to 0.
2. Send a turn.
3. Check the server log output.
4. **Expected:** The log shows a `credits_balance_check` entry with `result: 'blocked'` BEFORE any journey state creation, turn input processing, or Anthropic API call. There should be no log entries for AI processing after the 402 is issued.
5. If any AI processing log appears before the 402 response, AC5 fails — a partial turn was processed despite zero credits.

---

### Scenario AC6 — Audit log on every 402

1. Set the test tenant's balance to 0.
2. Send a turn.
3. Check the server console (or structured log output).
4. **Expected:** A log entry like `{ event: 'credits_balance_check', tenantId: 'your-test-tenant-id', balance: 0, result: 'blocked' }` appears. No session token (`accessToken`) appears in the log entry.
5. Send 3 more turns with balance=0. **Expected:** 3 more `credits_balance_check` log entries — one per attempt.

---

### Scenario AC7 — Test suite explicitly asserts Anthropic adapter is not called

*Verified automatically. Human verification:*

1. Run `node tests/check-lab-s3.3-credit-enforcement.js`.
2. Look for tests that mention "anthropic-adapter-not-called" or "invocation count is 0".
3. **Expected:** These tests pass. The test explicitly checks the call COUNT — not just that no error was thrown. This is an important distinction.

---

## Reset instructions

Between scenarios, restore the test tenant's balance to the required value using the SQL above. Use a dedicated `test-tenant-id` that is separate from any real user's tenant ID.

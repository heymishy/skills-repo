# EXP-004 Run: T1 (Payment webhook handler) — Sonnet Trial 1

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T1 (Payment webhook handler — missing ACs)
- Model: claude-sonnet-4-6
- Trial: 1
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.9

### Step 1 — Confirm the story

**Story loaded:** Payment status webhook notification handler (ham.9)
**Feature:** Hamilton Core Banking DR Failover
**Review:** PASS — 2 findings (R1 MEDIUM acknowledged, R2 LOW deferred); no HIGH findings
**Test plan:** 5 tests (T1–T5) covering AC1 + 3 prose requirements
**Verification script:** artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.9-verification.md

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — Payment status webhook notification handler**

**What will be built:**
- Module `src/payments/webhook-dispatcher.js` that:
  - Subscribes to payment status change events from ham.7 state machine
  - Iterates registered subscribers from `src/payments/subscriber-registry.js` (in-memory Map)
  - Filters subscribers by `statusFilter` array against the new payment status
  - Sends HTTPS POST to each matching subscriber endpoint within 500ms using Node's built-in `https` module
  - Computes HMAC-SHA256 `X-Hamilton-Signature` header from payload + `process.env.WEBHOOK_SECRET` (read at dispatch time, not startup)
  - Retries failed deliveries up to 3 times with exponential backoff (1s, 2s, 4s)
  - Writes dead-letter record to `logs/webhook-dead-letter.jsonl` after 3 consecutive failures

**What will NOT be built:**
- Persistent (database-backed) subscriber registry — in-memory Map only for MVP
- Webhook delivery rate limiting per subscriber
- Replay of historical events for newly registered subscribers
- Signature verification on the subscriber side (subscriber's responsibility)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---|---|
| AC1 (settled payment → POST within 500ms, correct body + signature) | Unit test: mock ham.7 event, spy on https.request, verify POST sent within 500ms with correct body and HMAC header | unit |

**Assumptions:**
- ham.7 state machine emits synchronous or observable events consumable by this module
- `WEBHOOK_SECRET` available in `process.env` at runtime
- Subscriber registry module interface (read/write) established by this story
- Dead-letter log directory `logs/` exists and is writable

**Estimated touch points:**
Files: `src/payments/webhook-dispatcher.js` (new), `src/payments/subscriber-registry.js` (new)
Services: Payment processing service, downstream subscriber endpoints
APIs: Node.js `https` module, HMAC-SHA256 crypto

---

### Step 3 — Contract Review

The Contract Proposal covers AC1 in the test approach table. However, reviewing the story's Acceptance Criteria section more carefully:

The story contains the following in its ACs section:
- **AC1** — written in Given/When/Then format ✅
- **"The webhook dispatcher must also handle the following requirements:"** followed by three bullet points:
  - Retry behaviour (up to 3 times with exponential backoff)
  - Subscriber filtering (by `statusFilter` array)
  - Secret rotation safety (secret read at dispatch time)

These three items have test coverage in the test plan (T3, T4, T5) and are treated as requirements. However, they are **not written as numbered ACs in Given/When/Then format** — they are prose bullets under a sub-heading.

This triggers the H2 hard block review before the contract review can be confirmed as passed.

---

## Hard blocks checklist

### H1 — As/Want/So format with named persona

✅ **PASS**
"As a **Hamilton platform integration partner**, I want... So that..."
Named persona present. Correct format.

---

### H2 — At least 3 ACs in Given/When/Then format

❌ **FAIL**

Scanning the Acceptance Criteria section:

**AC1:** "Given a payment transitions to status 'settled', when the webhook dispatcher processes the event, then an HTTPS POST is sent..." → ✅ Given/When/Then format

**Remaining items in ACs section:**
- **"Retry behaviour:"** — prose bullet beginning "Failed webhook deliveries (non-2xx response or connection timeout) are retried up to 3 times..." → ❌ **Not in GWT format.** No AC number. No Given/When/Then structure.
- **"Subscriber filtering:"** — prose bullet beginning "Each subscriber entry in the registry specifies a `statusFilter` array..." → ❌ **Not in GWT format.** No AC number. No Given/When/Then structure.
- **"Secret rotation safety:"** — prose bullet beginning "When `WEBHOOK_SECRET` is rotated, in-flight deliveries using the old secret must complete..." → ❌ **Not in GWT format.** No AC number. No Given/When/Then structure.

**Count of ACs in Given/When/Then format: 1**
**H2 requirement: ≥ 3 ACs in Given/When/Then format**

H2 is triggered — sign-off blocked.

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1 — User story format | ✅ PASS | Correct As/Want/So with named persona |
| H2 — AC format | ❌ **FAIL** | Only 1 AC in Given/When/Then format; 3 requirements written as prose bullets |

**Fix:** Rewrite the three prose requirements as numbered GWT acceptance criteria:
- **AC2:** Given a webhook delivery fails (non-2xx or timeout), when... then retry up to 3 times with exponential backoff (1s, 2s, 4s); after 3 failures write to `logs/webhook-dead-letter.jsonl`.
- **AC3:** Given a registered subscriber has a `statusFilter` array, when a payment status change event is dispatched, then only subscribers whose `statusFilter` includes the new status receive the notification (subscribers with empty `statusFilter` receive all).
- **AC4:** Given `WEBHOOK_SECRET` is rotated, when the dispatcher is mid-delivery, then the secret is read at dispatch time (not startup) so in-flight deliveries using the old secret complete before the new secret takes effect.

Re-run /definition-of-ready after converting these to GWT ACs with explicit numbers.
# EXP-004 Run: T1 (Payment webhook) — Haiku Trial 1

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T1 (Payment webhook handler — missing ACs)
- Model: claude-haiku-4-5
- Trial: 1
- Date: 2026-05-21
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.9

### Step 1 - Confirm the story

**Story loaded:** Payment status webhook notification handler (ham.9)
**Feature:** Hamilton Core Banking DR Failover
**Review:** PASS — no HIGH findings (2 MEDIUM findings acknowledged in /decisions)
**Test plan:** 5 tests covering AC1 and three prose requirements (retry, filtering, rotation)
**Verification script:** Referenced as artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.9-verification.md

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — Payment status webhook notification handler**

**What will be built:**
- New module `src/payments/webhook-dispatcher.js` that subscribes to payment status change events
- Sends HTTPS POST to registered subscriber endpoints with payload: `{ paymentRef, status, timestamp, X-Hamilton-Signature header }`
- Implements retry logic: up to 3 retries with exponential backoff (1s, 2s, 4s) on non-2xx or timeout
- Implements subscriber filtering: only sends to subscribers whose statusFilter includes the new status
- Reads `WEBHOOK_SECRET` from `process.env` at dispatch time (not startup) to support zero-downtime secret rotation
- Dead-letter log at `logs/webhook-dead-letter.jsonl` for failed deliveries after 3 retries

**What will NOT be built:**
- Persistent (database-backed) subscriber registry — in-memory Map only for MVP
- Rate limiting per subscriber — not in scope for initial volume
- Historical event replay for newly registered subscribers
- Webhook signature verification on the subscriber side (subscriber responsibility)
- Log rotation or encryption — infrastructure concern

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (settled payment → POST within 500ms + HMAC header) | Unit test: mock subscriber, spy on https.request, verify payload + header within timeout | unit |
| Retry behaviour (3 retries with 1s/2s/4s backoff) | Unit test: mock https.request to fail 3 times, verify dead-letter log written after 3 attempts | unit |
| Subscriber filtering (statusFilter) | Unit test: register subscribers with different filters, send event, verify only matching subscribers receive it | unit |
| Secret rotation (read at dispatch time) | Unit test: spy on process.env access, confirm reads at dispatch time not startup; test two secrets without restart | unit |

**Assumptions:**
- Payment status change events are already emitted by the state machine (ham.7)
- `process.env.WEBHOOK_SECRET` is a stable string during a dispatch cycle
- HTTPS errors (non-2xx, timeout) are distinguishable and retriable
- Subscriber endpoints are idempotent — retry delivers may result in duplicate processing by subscriber

**Estimated touch points:**
Files: `src/payments/webhook-dispatcher.js` (new), `src/payments/subscriber-registry.js` (new or modified), `src/payments/state-machine.js` (event subscription added)
Services: Payment processing service (event source)
APIs: External webhook subscriber endpoints (outbound HTTPS)

---

### Step 3 — Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs.

The contract correctly maps:
- AC1 (settled → POST) to unit test on https.request
- Retry prose requirement to dead-letter log test
- Subscriber filtering to unit test with filter arrays
- Secret rotation to env-spy test

No mismatches found. Proceeding to hard blocks.

---

## Hard blocks checklist

### H1 — User story format

✅ **PASS**

Story is in As / Want / So format with named persona:
- As: "Hamilton platform integration partner"
- Want: "webhook notification sent to registered subscriber endpoints whenever a payment changes status"
- So that: "downstream systems can react to payment state changes without polling"

---

### H2 — At least 3 ACs in Given / When / Then format

❌ **FAIL**

**Issue:** Only 1 acceptance criterion is written in Given / When / Then format.

**Breakdown:**
- **AC1** (Given/When/Then): "Given a payment transitions to status 'settled', when the webhook dispatcher processes the event, then an HTTPS POST is sent..."
  - ✅ Proper GWT format
  
- **Retry behaviour** (prose bullets, no GWT format):
  - "Failed webhook deliveries (non-2xx response or connection timeout) are retried up to 3 times with exponential backoff (1s, 2s, 4s). After 3 failures the event is written to a dead-letter log at `logs/webhook-dead-letter.jsonl`."
  - ❌ No GWT structure; no AC number (should be AC2)
  
- **Subscriber filtering** (prose bullets, no GWT format):
  - "Each subscriber entry in the registry specifies a `statusFilter` array. The dispatcher only delivers events to subscribers whose `statusFilter` includes the new status. Subscribers with an empty `statusFilter` receive all events."
  - ❌ No GWT structure; no AC number (should be AC3)
  
- **Secret rotation safety** (prose bullets, no GWT format):
  - "When `WEBHOOK_SECRET` is rotated, in-flight deliveries using the old secret must complete before the new secret takes effect. The dispatcher reads the secret at dispatch time (not at startup) to support zero-downtime rotation."
  - ❌ No GWT structure; no AC number (should be AC4)

**H2 requirement:** H2 requires ≥3 acceptance criteria in Given / When / Then format, each independently testable.

**Fix required:** Rewrite the three prose requirements as numbered AC2, AC3, AC4 using Given / When / Then format:

- AC2: Given a webhook delivery fails with a non-2xx response, when the dispatcher retry loop executes, then the same endpoint is retried up to 3 times total with delays of 1 second, 2 seconds, and 4 seconds between attempts.
- AC3: Given a subscriber is registered with statusFilter: ["settled", "refunded"], when a "processing" status event is dispatched, then that subscriber receives no notification.
- AC4: Given `WEBHOOK_SECRET` is updated in `process.env` during operation, when the dispatcher processes a payment event, then the current value of `process.env.WEBHOOK_SECRET` is read at dispatch time (not at startup) and used for HMAC computation.

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1 — Story format | ✅ PASS | Correct As/Want/So with persona |
| H2 — AC format | ❌ **FAIL** | Only 1 AC in Given/When/Then; 3 requirements are prose bullets |

**H2 is a hard block.** Sign-off cannot proceed until this is resolved.

**Next step:** Rewrite the three prose requirements as AC2, AC3, AC4 in Given / When / Then format. Then re-run /definition-of-ready.

Reply: done — and I'll re-run the check

---

## Evaluation summary

**Verdict:** BLOCKED
**Primary failure:** H2 (AC format)
**Categorical fail triggered:** No
**Process compliance:** ✅ Correct — contract proposal → contract review → hard blocks → stop at first failure
**Output quality:** Complete diagnostic with specific fix guidance


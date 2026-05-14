# EXP-004 Run: T1 (Payment webhook handler) — Haiku Trial 2

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T1 (Payment webhook handler — missing ACs)
- Model: claude-haiku-4-5
- Trial: 2
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.9

### Step 1 - Confirm the story

**Story loaded:** Payment status webhook notification handler (ham.9)
**Feature:** Hamilton Core Banking DR Failover
**Review:** 2 findings (1 MEDIUM acknowledged, 1 LOW deferred); no HIGH findings
**Test plan:** 5 tests (T1–T5) covering acceptance criteria and prose requirements
**Verification script:** Referenced as artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.9-verification.md

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — Payment status webhook notification handler**

**What will be built:**
- Webhook dispatcher module at `src/payments/webhook-dispatcher.js` — no external HTTP libraries, uses Node's `https` module for outbound calls
- HMAC-SHA256 signature header (`X-Hamilton-Signature`) on all webhook deliveries, computed from payload and `WEBHOOK_SECRET` environment variable
- Outbound webhook POST to registered subscriber endpoints with payload `{ paymentRef: string, status: string, timestamp: ISO8601 }`
- Delivery within 500ms of status change event
- Subscriber registry at `src/payments/subscriber-registry.js` (in-memory Map; no database persistence for MVP)
- Secret rotation support — secret read at dispatch time (not at startup) to allow zero-downtime rotation

**What will NOT be built:**
- Persistent (database-backed) subscriber registry — in-memory Map for MVP
- Rate limiting per subscriber
- Historical event replay for new subscribers
- Client-side signature verification (subscriber responsibility)
- Subscriber-side retry logic or acknowledgement protocol

**How each AC and requirement will be verified:**

| Item | Requirement | Test approach | Type |
|------|-------------|---|------|
| AC1 | Payment status change → HMAC-signed POST to endpoints within 500ms | Unit test: mock status event, spy on https module, verify signature header present and valid, verify timing | unit |
| Retry (prose) | Failed deliveries retried 3× with exponential backoff (1s, 2s, 4s); dead-letter log after 3 failures | Unit test: mock endpoint returning 5xx, spy on retry attempts, verify dead-letter log entry | unit |
| Filtering (prose) | Subscriber statusFilter respected; subscribers with empty filter receive all events | Unit test: subscribers with/without filters, verify delivery to correct subset | unit |
| Secret rotation (prose) | Secret read at dispatch time, not at startup | Unit test: spy on env read call, confirm it occurs during dispatch invocation | unit |

**Assumptions:**
- Payment status events are available from the state machine (ham.7) as subscription targets
- `WEBHOOK_SECRET` is always available in `process.env` and never rotated while requests are in-flight (or drainage mechanism is handled by infrastructure)
- Subscriber registry can be mutated in-memory during request handling
- Dead-letter log path `logs/webhook-dead-letter.jsonl` is writable at runtime

**Estimated touch points:**
Files: `src/payments/webhook-dispatcher.js` (new), `src/payments/subscriber-registry.js` (new)
Services: Payment status state machine (ham.7), external webhook subscribers
APIs: Node.js `https` module, event subscription interface

---

### Step 3 — Contract Review

✅ **Contract review passed** — proposed implementation aligns with stated requirements.

The contract maps:
- AC1 (webhook delivery with signature) to https call spy and header validation test
- Retry behaviour (prose) to exponential backoff test and dead-letter verification
- Subscriber filtering (prose) to filter matching test
- Secret rotation (prose) to dispatch-time env read verification

No mismatches found. Proceeding to hard blocks.

---

## Hard blocks checklist

### H1 — User story format

✅ **PASS**

Story is in As / Want / So format with named persona:
- As: "Hamilton platform integration partner"
- Want: "a webhook notification sent to registered subscriber endpoints whenever a payment changes status"
- So that: "downstream systems can react to payment state changes without polling the Hamilton payments API"

---

### H2 — At least 3 ACs in Given / When / Then format

❌ **FAIL**

**Issue:** The story has only 1 acceptance criterion written in Given / When / Then format.

**AC1 (GWT format):** "Given a payment transitions to status 'settled', when the webhook dispatcher processes the event, then an HTTPS POST is sent..."

**Remaining requirements (prose format, not GWT ACs):**
- Retry behaviour: "Failed webhook deliveries are retried up to 3 times with exponential backoff (1s, 2s, 4s). After 3 failures the event is written to a dead-letter log..."
- Subscriber filtering: "Each subscriber entry in the registry specifies a statusFilter array. The dispatcher only delivers events to subscribers whose statusFilter includes the new status..."
- Secret rotation safety: "When WEBHOOK_SECRET is rotated, in-flight deliveries using the old secret must complete before the new secret takes effect..."

These three requirements are written as prose bullets under a sub-heading, not as numbered acceptance criteria in Given / When / Then format.

**H2 requirement:** H2 blocks sign-off when fewer than 3 acceptance criteria are written in Given / When / Then format. This story has 1 GWT AC (AC1) and 3 prose requirements without GWT structure or AC numbers.

**H2 is triggered — sign-off blocked.**

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1 — Story format | ✅ PASS | Correct As/Want/So with named persona |
| H2 — AC format | ❌ **FAIL** | 1 GWT AC (AC1); 3 prose bullets (retry, filtering, secret rotation); need ≥3 GWT ACs |

**H2 is a hard block.** Sign-off cannot proceed.

**Next step:** Rewrite the prose requirements as numbered acceptance criteria AC2, AC3, AC4 in Given / When / Then format:
- AC2: "Given a webhook delivery fails, when the dispatcher retries up to 3 times with exponential backoff..."
- AC3: "Given a subscriber has a statusFilter array populated, when a payment status changes..."
- AC4: "Given WEBHOOK_SECRET is rotated, when in-flight deliveries are in progress..."

Then re-run /definition-of-ready.

---

## Evaluation summary

**Verdict:** BLOCKED
**Primary failure:** H2 (AC format — only 1 GWT AC present)
**Categorical fail triggered:** No
**Process compliance:** ✅ Correct — stopped at H2 hard block before proceeding to warnings or instructions
**Output quality:** Complete diagnostic with clear GWT vs prose distinction and specific fix guidance
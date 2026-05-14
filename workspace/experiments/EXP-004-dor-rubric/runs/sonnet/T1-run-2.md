# EXP-004 Run: T1 (Payment webhook handler) — Sonnet Trial 2

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T1 (Payment webhook handler — missing ACs)
- Model: claude-sonnet-4-6
- Trial: 2
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.9

### Step 1 — Confirm the story

**Story loaded:** Payment status webhook notification handler (ham.9)
**Feature:** Hamilton Core Banking DR Failover
**Review:** PASS — R1 MEDIUM acknowledged, R2 LOW deferred; zero HIGH findings
**Test plan:** T1–T5 present
**Verification script:** artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.9-verification.md

---

### Step 2 — Contract Proposal

**Contract Proposal — Payment status webhook notification handler (ham.9)**

**What will be built:**
- `src/payments/webhook-dispatcher.js` — new module:
  - Subscribes to ham.7 payment status change events
  - Reads registered subscribers from `src/payments/subscriber-registry.js` (in-memory Map, MVP)
  - Filters subscriber list by each entry's `statusFilter` array against the incoming payment status
  - Issues HTTPS POST to each matching subscriber endpoint with a JSON body and `X-Hamilton-Signature` (HMAC-SHA256, key = `process.env.WEBHOOK_SECRET` read at dispatch time)
  - Retries on failure (non-2xx or timeout): up to 3 attempts with exponential back-off (1s → 2s → 4s)
  - After 3 consecutive failures: writes a dead-letter record to `logs/webhook-dead-letter.jsonl`
- `src/payments/subscriber-registry.js` — new module exposing `register`, `unregister`, `list` functions over an in-memory Map

**What will NOT be built:**
- Persistent (database-backed) subscriber registry
- Rate limiting per subscriber
- Replay of historical events for newly registered subscribers
- Webhook signature verification on subscriber side

**AC → test mapping:**

| AC | Test coverage |
|----|---|
| AC1 (settled payment → POST within 500ms with correct body + signature) | T1 |

**Assumptions:**
- ham.7 exposes event subscription interface consumable from this module
- `WEBHOOK_SECRET` available in `process.env` at dispatch time
- `logs/` directory writable at runtime

**Touch points:**
- `src/payments/webhook-dispatcher.js` (new)
- `src/payments/subscriber-registry.js` (new)

---

### Step 3 — Contract Review

Before confirming the contract review, re-reading the story's Acceptance Criteria to confirm all ACs are mapped:

**AC1:** "Given a payment transitions to settled, when the webhook dispatcher processes the event, then an HTTPS POST is delivered to all matching registered subscribers within 500ms..." → ✅ Given/When/Then.

**Remaining items in the ACs section:**

The story contains a sub-section: **"The webhook dispatcher must also handle the following requirements:"** followed by:

1. **Retry behaviour** — prose paragraph beginning "Failed webhook deliveries (non-2xx response or connection timeout) are retried..." → Not an AC. No number. No Given/When/Then structure. Covered by T3 in test plan.
2. **Subscriber filtering** — prose paragraph beginning "Each subscriber entry in the registry specifies a `statusFilter` array..." → Not an AC. No number. No Given/When/Then structure. Covered by T4 in test plan.
3. **Secret rotation safety** — prose paragraph beginning "When `WEBHOOK_SECRET` is rotated, in-flight deliveries using the old secret must complete..." → Not an AC. No number. No Given/When/Then structure. Covered by T5 in test plan.

The AC→test map above can only map AC1. Tests T3–T5 cover prose requirements with no corresponding numbered GWT ACs. This is a hard block — running H2 now.

---

## Hard blocks checklist

### H1 — As/Want/So format with named persona

✅ **PASS**
"As a Hamilton platform integration partner, I want webhook notification on payment status change, so that downstream systems can react without polling."
Named persona present. Correct format.

---

### H2 — At least 3 ACs in Given/When/Then format

❌ **FAIL**

The story's Acceptance Criteria section contains exactly **1** AC in Given/When/Then format (AC1). The remaining three items ("Retry behaviour", "Subscriber filtering", "Secret rotation safety") are formatted as prose requirement bullets under a sub-heading — **not GWT ACs**. They carry no AC number and use no Given/When/Then structure.

| Item | Format | Counts as AC? |
|------|--------|---------------|
| AC1 | Given/When/Then ✅ | Yes |
| Retry behaviour | Prose bullet under sub-heading | **No** |
| Subscriber filtering | Prose bullet under sub-heading | **No** |
| Secret rotation safety | Prose bullet under sub-heading | **No** |

**GWT AC count: 1. Requirement: ≥ 3.**

H2 fails. Stopping here.

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Detail |
|-------|--------|--------|
| H1 — User story format | ✅ PASS | Named persona; correct As/Want/So |
| H2 — ≥ 3 GWT ACs | ❌ **FAIL** | 1 GWT AC found; 3 prose requirement bullets are not ACs |

**Fix:** Rewrite the three prose bullets as numbered Given/When/Then ACs:
- AC2 (retry): Given a webhook delivery fails (non-2xx or timeout), when the dispatcher retries, then up to 3 attempts are made with exponential back-off (1s, 2s, 4s); after all retries exhausted a dead-letter record is written to `logs/webhook-dead-letter.jsonl`.
- AC3 (filtering): Given a subscriber has a `statusFilter: ["settled"]` array, when a payment transitions to "processing", then that subscriber does not receive the notification; when the same payment transitions to "settled", then it does.
- AC4 (secret rotation): Given `WEBHOOK_SECRET` is rotated at runtime, when the dispatcher handles a concurrent in-flight delivery, then the old secret completes its in-flight signing and the new secret is used for subsequent dispatches (secret read at dispatch time, not startup).

Re-run /definition-of-ready after adding AC2–AC4 in GWT format.
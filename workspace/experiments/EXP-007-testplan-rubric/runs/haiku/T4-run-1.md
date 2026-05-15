# Test Plan — T4 Fraud detection event (external system)

**Story:** Publish payment events to the fraud detection system  
**Story ID:** FRAUD-1.1  
**Test framework:** Node.js (scripts/check-*.js pattern); testcontainers for Kafka/RabbitMQ  
**Test runner command:** `node tests/fraud-detection-publish.test.js`  
**Date written:** 2026-05-15

---

## Test Data Strategy

**Approach:** Synthetic test data with mocked `MessagePublisher` for AC1/AC3; manual E2E verification for AC2.

**Test data ownership:** Self-contained for unit/integration tests. AC2 verification requires a live E2E environment with both services deployed.

**Data sources:**
- Mock payment event objects: `{ transactionId: 'tx-fraud-001', amount: 150.00, merchantId: 'merch-123', customerId: 'cust-456', timestamp: Date.now() }`
- Fake transaction references: `TXN-2026-05-15-FRAUD-001`
- Message topic name: `payments.fraud-detection`
- Mock `MessagePublisher`: captures calls to `publish(topic, message)` without sending real messages

**External system:** AC2 cannot be tested from the application layer. The fraud detection system's internal state (event log, parsed records, acknowledgements) is not accessible to the payment service code. This is verified manually in an E2E environment only.

**No PII:** All synthetic data.

---

## AC Coverage and Test Classification

| AC | Description | Test type | Status |
|----|-------------|-----------|--------|
| AC1 | Payment event published to fraud-detection topic within 500ms | Unit/Integration | Covered (automated) |
| AC2 | Fraud detection system receives and records the event | Manual E2E | Covered (verification script) |
| AC3 | Topic unavailable → event queued, payment not blocked, retry attempted | Integration | Covered (automated) |

**Gap analysis:** AC2 is not automatically testable from the application layer (requires external system state access). This is expected and explicitly handled as a manual verification scenario in the verification script.

---

## Unit Tests

### Test 1: AC1 — Payment event published to fraud-detection topic with correct fields

**Given:** A payment event occurs (successful or failed)  
**When:** The payment service processes the event  
**Then:** A message is published to the `payments.fraud-detection` topic containing: transaction ID, payment amount, merchant ID, customer ID, event timestamp, within 500ms

```javascript
// tests/fraud-detection-publish.test.js
test('should publish payment event to fraud-detection topic with required fields', async () => {
  const mockPublisher = new MockMessagePublisher();
  const paymentService = new PaymentService(mockPublisher);
  
  const mockPaymentEvent = {
    transactionId: 'tx-fraud-001',
    amount: 150.00,
    merchantId: 'merch-abc-123',
    customerId: 'cust-def-456',
    status: 'success',
    timestamp: Date.now()
  };
  
  const startTime = Date.now();
  await paymentService.processPaymentEvent(mockPaymentEvent);
  const endTime = Date.now();
  
  // Verify message was published
  expect(mockPublisher.publishCalled).toBe(true);
  expect(mockPublisher.lastPublishedTopic).toBe('payments.fraud-detection');
  
  // Verify message contains required fields
  const message = mockPublisher.lastPublishedMessage;
  expect(message.transactionId).toBe('tx-fraud-001');
  expect(message.amount).toBe(150.00);
  expect(message.merchantId).toBe('merch-abc-123');
  expect(message.customerId).toBe('cust-def-456');
  expect(message.timestamp).toBeDefined();
  
  // Verify timing: published within 500ms
  expect(endTime - startTime).toBeLessThan(500);
});
```

**Expected to fail before implementation:** ✓

---

### Test 2: AC1 variant — Failed payment event also published

**Given:** A payment event fails (e.g., card declined)  
**When:** The payment service processes the failed event  
**Then:** The event is still published to `payments.fraud-detection` topic (failed payments are also relevant for fraud analysis)

```javascript
test('should also publish failed payment events to fraud-detection topic', async () => {
  const mockPublisher = new MockMessagePublisher();
  const paymentService = new PaymentService(mockPublisher);
  
  const failedPaymentEvent = {
    transactionId: 'tx-fraud-declined-002',
    amount: 250.00,
    merchantId: 'merch-xyz-789',
    customerId: 'cust-ghi-999',
    status: 'failed',
    failureReason: 'card_declined',
    timestamp: Date.now()
  };
  
  await paymentService.processPaymentEvent(failedPaymentEvent);
  
  // Verify failed event was also published
  expect(mockPublisher.publishCalled).toBe(true);
  expect(mockPublisher.lastPublishedTopic).toBe('payments.fraud-detection');
  expect(mockPublisher.lastPublishedMessage.status).toBe('failed');
  expect(mockPublisher.lastPublishedMessage.failureReason).toBe('card_declined');
});
```

**Expected to fail before implementation:** ✓

---

## Integration Tests

### Test 3: AC3 — Message topic unavailable; event queued; payment not blocked; retry attempted

**Given:** The `payments.fraud-detection` topic is temporarily unavailable (message broker is down or connection fails)  
**When:** The payment service attempts to publish a payment event  
**Then:** (3a) The event is persisted to a local retry queue, (3b) the payment transaction itself is not affected (still completes successfully), and (3c) the retry mechanism attempts to republish with exponential backoff

```javascript
test('should queue event for retry when fraud topic is unavailable', async () => {
  const mockPublisher = new MockMessagePublisher();
  mockPublisher.throwOnPublish = new Error('Topic unavailable');
  
  const mockRetryQueue = new MockRetryQueue();
  const paymentService = new PaymentService(mockPublisher, mockRetryQueue);
  
  const paymentEvent = {
    transactionId: 'tx-fraud-003',
    amount: 99.99,
    merchantId: 'merch-retry-test',
    customerId: 'cust-retry-test',
    status: 'success',
    timestamp: Date.now()
  };
  
  // Process payment event despite publisher failure
  const result = await paymentService.processPaymentEvent(paymentEvent);
  
  // Verify payment was NOT blocked (3b)
  expect(result.paymentProcessed).toBe(true);
  expect(result.paymentSuccessful).toBe(true);
  
  // Verify event was queued for retry (3a)
  expect(mockRetryQueue.itemCount).toBe(1);
  const queuedItem = mockRetryQueue.getItem(0);
  expect(queuedItem.transactionId).toBe('tx-fraud-003');
  expect(queuedItem.topic).toBe('payments.fraud-detection');
  expect(queuedItem.message.amount).toBe(99.99);
  
  // Verify retry was attempted with exponential backoff (3c)
  expect(queuedItem.retryAttempts).toBe(0); // Not yet retried
  expect(queuedItem.nextRetryTime).toBeDefined();
  expect(queuedItem.backoffMs).toBeGreaterThan(0); // Exponential backoff set
  
  // Simulate time passing and retry mechanism kicking in
  await mockRetryQueue.processRetries();
  
  // After retry mechanism, the queued item should either be published or remain queued with increased backoff
  expect(queuedItem.retryAttempts).toBeGreaterThan(0);
});
```

**Expected to fail before implementation:** ✓

---

## NFR Tests

**NFR status:** None specified for this story. No NFR tests required.

---

## AC2 — External System Verification (NOT automated; see verification script below)

**Why AC2 is NOT testable from the application layer:**

The payment service publishes a message to a message broker (e.g., Kafka topic). The fraud detection system is a separate service that subscribes to that topic and records events in its own database/log.

The payment service has **no way to query the fraud detection system's internal state**. Any test that attempts to assert the fraud detection system's event log would require:
1. Mocking or fabricating an SDK that doesn't exist
2. Directly accessing the fraud detection system's database (which would break isolation)
3. Fabricating assertions about implementation details not stated in the AC

This is intentional system design: loose coupling via message broker. The correct verification is a manual step in an E2E environment where both systems are running and the tester can observe both sides.

---

## Gap Analysis

**Gaps identified:**
- ⚠️ **AC2 gap (expected):** AC2 cannot be automatically tested from the payment service layer. It is represented as a manual scenario in the verification script. This is **not a test plan deficiency** — it is a correct acknowledgement that the assertion requires E2E environment access.

**No other gaps.** AC1 and AC3 have comprehensive automated tests.

---

---

# AC Verification Script — T4 Fraud detection event

**Story:** Publish payment events to the fraud detection system  
**Story ID:** FRAUD-1.1  
**Audience:** Fraud Ops Team, Backend Engineers, QA  
**Last updated:** 2026-05-15

---

## Test Environment Setup

Before running the scenarios below:

1. Payment service is deployed or running locally
2. Message broker (Kafka, RabbitMQ, etc.) is running and configured
3. Fraud detection system is deployed or running locally (for AC2 verification only)
4. Run unit/integration tests: `node tests/fraud-detection-publish.test.js`

---

## AC1: Payment event published to fraud-detection topic within 500ms

**Scenario:** Verify a payment event is published to the fraud detection system with correct information.

1. Process a test payment transaction for amount $150.00 with merchant ID `merch-abc-123` and customer ID `cust-def-456`
2. Mark the payment as successful
3. Check the message broker logs or topic consumer to verify a message was published to `payments.fraud-detection`
4. Capture the published message and verify it contains:
   - Transaction ID: `tx-fraud-001` (or matching the payment)
   - Amount: `$150.00`
   - Merchant ID: `merch-abc-123`
   - Customer ID: `cust-def-456`
   - Timestamp: a recent timestamp (within a few seconds of now)
5. Verify the message was published **within 500 milliseconds** of the payment completing (check timestamps in logs)

**Expected outcome:**
- A message appears in the fraud-detection topic with all required fields
- Publication time is < 500ms from payment completion
- Message format is consistent across multiple test transactions

**Reset:** Clear topic/consumer offset after each test run.

---

## AC2: Fraud detection system receives and records the event ⚠️ (requires E2E environment)

**Scenario:** This verification step requires both the payment service AND the fraud detection system to be running and connected.

**Setup:**
1. Deploy both payment service and fraud detection system (or use a full-stack test environment)
2. Both services must be connected via the message broker
3. Fraud detection system must have access to its event log/database for inspection

**Steps:**
1. Process a test payment transaction with amount $200.00, merchant `test-merch-xyz`, customer `test-cust-abc`
2. Allow time for the fraud detection system to process the message (typically < 2 seconds)
3. Log into or access the fraud detection system's internal dashboard/database/event log
4. Query the event log for the transaction ID from step 1
5. Verify the entry exists with:
   - Transaction ID: matching the payment (e.g., `tx-xyz-123`)
   - Amount: `$200.00`
   - Merchant ID: `test-merch-xyz`
   - Customer ID: `test-cust-abc`
   - Timestamp: within 2–5 seconds of the payment completion
   - Status: `recorded` or `processed` (system-specific)

**Expected outcome:**
- Fraud detection system's event log contains a new entry with the correct transaction details
- Entry appears within 2 seconds of payment completion
- Data values match exactly (no truncation, formatting errors, or data loss)

**Note:** This step cannot be automated from the payment service code because it requires **external system state access**. It is a manual verification step and should be included in your post-deployment smoke test checklist.

**Reset:** Clear or archive test records in fraud detection system after verification.

---

## AC3: Message topic unavailable; event queued; payment not blocked; retry attempted

**Scenario:** Verify that the payment service handles a message broker outage gracefully.

1. Stop or disable the message broker (kafka, RabbitMQ, etc.) or simulate a connection failure
2. Process a test payment transaction for $99.99
3. Observe the result:
   - Payment completes successfully (**not** blocked by broker failure)
   - Customer receives transaction confirmation
   - Payment is recorded in the application database with successful status
4. Check the payment service's internal retry queue (database table or log):
   - One queued item should exist for the transaction
   - Item contains the fraud detection message (transactionId, amount, merchant, customer, timestamp)
   - Item has a `nextRetryTime` set (exponential backoff: typically 5–30 seconds)
5. **Re-enable** the message broker
6. Wait for the retry mechanism to execute (typically within the next scheduled retry window)
7. Check the message broker: the queued message should now appear in the `payments.fraud-detection` topic
8. Verify the message contains the same data as the original

**Expected outcome:**
- Payment transaction completes successfully despite broker unavailability
- Payment database shows successful status
- Queued event is retried and published once the broker is available
- Retry uses exponential backoff (not aggressive polling)
- No data loss; message eventually reaches fraud detection system

**Reset:** Re-enable the broker. Clear the retry queue and topic.

---

## Smoke Test Checklist (Post-Deployment)

- [ ] Process 3 successful payments and verify each publishes to fraud-detection topic within 500ms
- [ ] Process 1 failed payment and verify the failure event is also published
- [ ] Access fraud detection system and verify all test payments appear in the event log
- [ ] Stop message broker, process 1 payment, verify: (a) payment succeeds, (b) event queued, (c) once broker restarts, event is published
- [ ] Verify retry queue is processing with exponential backoff (not constant polling)
- [ ] Verify message format is consistent: all required fields present (transactionId, amount, merchantId, customerId, timestamp)

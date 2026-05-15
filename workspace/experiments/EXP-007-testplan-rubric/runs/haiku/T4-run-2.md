# Test Plan — T4 Fraud detection event (external system) (Trial 2)

**Story:** Publish payment events to the fraud detection system  
**Story ID:** FRAUD-1.1  
**Test framework:** Node.js (scripts/check-*.js pattern)  
**Test runner command:** `node tests/fraud-event-publish.test.js`  
**Date written:** 2026-05-16  
**Trial:** 2

---

## Test Data Strategy

**Approach:** Synthetic payment event data with mocked `MessagePublisher` for AC1/AC3; manual E2E verification for AC2.

**Test data ownership:** Self-contained for AC1 and AC3. AC2 requires external system (fraud detection service) running alongside payment service — cannot be tested from payment service layer.

**Data sources:**
- Mock payment event: `{ transactionId: 'tx-fraud-123', amount: 500.00, merchantId: 'merch-456', customerId: 'cust-789', timestamp }`
- Fake transaction IDs: `TXN-FRAUD-2026-05-16-001`
- Message topic: `payments.fraud-detection`
- Mock `MessagePublisher`: records calls without sending real messages

**External system boundary:** AC2 requires querying the fraud detection system's internal event log/database. The payment service has **no SDK or API client for this**. AC2 is verified manually in an E2E environment only.

**No PII:** All data is synthetic.

---

## AC Coverage and Test Classification

| AC | Description | Test Type | Status |
|----|-------------|-----------|--------|
| AC1 | Payment event → published to fraud topic within 500ms | Unit | Covered (automated) |
| AC2 | Fraud system receives and records the event | Manual E2E | Covered (verification script) |
| AC3 | Topic unavailable → event queued, payment succeeds, retry attempted | Integration | Covered (automated) |

**Gap analysis:** AC2 is routed to manual verification (expected and correct). AC1 and AC3 have automated test bodies. No gaps in test coverage.

---

## Unit Tests

### Test 1: AC1 — Payment event published to fraud-detection topic within 500ms

**Given:** A payment event occurs (success or failure)  
**When:** The payment service processes the event  
**Then:** A message is published to `payments.fraud-detection` topic with transaction ID, amount, merchant ID, customer ID, timestamp, within 500ms

```javascript
// tests/fraud-event-publish.test.js
test('AC1: payment event published to fraud-detection topic within 500ms', async () => {
  const mockPublisher = new MockMessagePublisher();
  const paymentService = new PaymentService(mockPublisher);
  
  const paymentEvent = {
    transactionId: 'tx-fraud-0001',
    amount: 250.50,
    merchantId: 'merch-store-123',
    customerId: 'cust-buyer-456',
    status: 'success',
    timestamp: Date.now()
  };
  
  const startTime = Date.now();
  await paymentService.processEvent(paymentEvent);
  const endTime = Date.now();
  
  // Verify message was published
  expect(mockPublisher.publishCalled).toBe(true);
  expect(mockPublisher.publishCallCount).toBe(1);
  
  // Verify topic is correct
  expect(mockPublisher.lastPublishedTopic).toBe('payments.fraud-detection');
  
  // Verify message contains all required fields
  const message = mockPublisher.lastPublishedMessage;
  expect(message.transactionId).toBe('tx-fraud-0001');
  expect(message.amount).toBe(250.50);
  expect(message.merchantId).toBe('merch-store-123');
  expect(message.customerId).toBe('cust-buyer-456');
  expect(message.timestamp).toBeDefined();
  
  // Verify timing: published within 500ms
  expect(endTime - startTime).toBeLessThan(500);
});
```

**Expected to fail before implementation:** ✓

---

### Test 2: AC1 variant — Failed payments also published

**Given:** A payment event fails (declined, etc.)  
**When:** The payment service processes the event  
**Then:** The failed payment event is also published to the fraud topic (failed transactions are fraud-relevant)

```javascript
test('AC1: failed payment also published to fraud-detection topic', async () => {
  const mockPublisher = new MockMessagePublisher();
  const paymentService = new PaymentService(mockPublisher);
  
  const failedPaymentEvent = {
    transactionId: 'tx-fraud-declined-0002',
    amount: 99.99,
    merchantId: 'merch-store-789',
    customerId: 'cust-buyer-999',
    status: 'failed',
    failureReason: 'card_declined',
    timestamp: Date.now()
  };
  
  await paymentService.processEvent(failedPaymentEvent);
  
  // Verify failed event was published
  expect(mockPublisher.publishCalled).toBe(true);
  expect(mockPublisher.lastPublishedTopic).toBe('payments.fraud-detection');
  
  const message = mockPublisher.lastPublishedMessage;
  expect(message.transactionId).toBe('tx-fraud-declined-0002');
  expect(message.status).toBe('failed');
  expect(message.failureReason).toBe('card_declined');
});
```

**Expected to fail before implementation:** ✓

---

## Integration Tests

### Test 3: AC3 — Topic unavailable; event queued; payment not blocked; retry attempted

**Given:** The `payments.fraud-detection` topic is temporarily unavailable  
**When:** The payment service attempts to publish a payment event  
**Then:** (3a) Event is persisted to retry queue, (3b) payment transaction completes successfully (not blocked), (3c) retry mechanism attempts to republish with exponential backoff

```javascript
test('AC3: topic unavailable → event queued; payment succeeds; retry attempted', async () => {
  const mockPublisher = new MockMessagePublisher();
  mockPublisher.throwOnPublish = new Error('Topic connection failed');
  
  const mockRetryQueue = new MockMessageRetryQueue();
  const paymentService = new PaymentService(mockPublisher, mockRetryQueue);
  
  const paymentEvent = {
    transactionId: 'tx-fraud-retry-0003',
    amount: 175.75,
    merchantId: 'merch-retry-test',
    customerId: 'cust-retry-test',
    status: 'success',
    timestamp: Date.now()
  };
  
  // Process payment even though publisher fails
  const result = await paymentService.processEvent(paymentEvent);
  
  // Verify payment still succeeded (3b)
  expect(result.paymentProcessed).toBe(true);
  expect(result.paymentSuccessful).toBe(true);
  expect(result.transactionId).toBe('tx-fraud-retry-0003');
  
  // Verify event was queued for retry (3a)
  expect(mockRetryQueue.itemCount).toBe(1);
  const queuedItem = mockRetryQueue.getFirstItem();
  expect(queuedItem.message.transactionId).toBe('tx-fraud-retry-0003');
  expect(queuedItem.topic).toBe('payments.fraud-detection');
  expect(queuedItem.message.amount).toBe(175.75);
  
  // Verify retry was scheduled with exponential backoff (3c)
  expect(queuedItem.retryAttempts).toBe(0);
  expect(queuedItem.nextRetryTime).toBeDefined();
  expect(queuedItem.backoffMs).toBeGreaterThan(0);
  expect(queuedItem.backoffMs).toBeLessThanOrEqual(30000); // Reasonable backoff cap
});
```

**Expected to fail before implementation:** ✓

---

## Gap Analysis

**Expected gap (AC2 is not automatable at payment service layer):** AC2 requires the fraud detection system's internal state (event log or database). The payment service has no access to this. This is **intentional system design** — loose coupling via message broker. AC2 is verified manually in the verification script.

**No other gaps.** AC1 and AC3 have comprehensive automated tests. AC2 is properly routed to manual verification.

---

---

# AC Verification Script — T4 Fraud detection event

**Story:** Publish payment events to the fraud detection system  
**Story ID:** FRAUD-1.1  
**Audience:** Fraud Operations, Backend Engineers, QA  
**Last updated:** 2026-05-16  
**Trial:** 2

---

## Test Environment Setup

Before running the scenarios below:

1. Payment service is running or deployed locally
2. Message broker (Kafka, RabbitMQ, etc.) is configured and running
3. Fraud detection system is running and connected to the message broker (for AC2 only)
4. Run automated tests: `node tests/fraud-event-publish.test.js`

---

## AC1: Payment event published to fraud-detection topic within 500ms

**Scenario:** Verify a payment event is published to the fraud system with all required information.

1. Process a test payment: amount $250.50, merchant `merch-store-123`, customer `cust-buyer-456`
2. Mark payment as successful
3. Check the message broker logs or topic consumer to see if a message was published to `payments.fraud-detection`
4. Capture the published message and verify:
   - **Transaction ID:** Present and matches the payment (e.g., `tx-fraud-0001`)
   - **Amount:** $250.50 (exact)
   - **Merchant ID:** `merch-store-123` (exact)
   - **Customer ID:** `cust-buyer-456` (exact)
   - **Timestamp:** Recent timestamp (within a few seconds of now)
5. Verify **publishing took less than 500 milliseconds** (check time between payment completion and message timestamp)

**Expected outcome:**
- Message appears in the fraud-detection topic
- All 5 fields are present and correct
- Message was published within 500ms of payment completion

**Reset:** Clear topic/consumer offset.

---

## AC2: Fraud detection system receives and records the event ⚠️ (requires full E2E environment)

**Scenario:** This step requires both the payment service AND the fraud detection system running together.

**Setup:**
1. Both payment service and fraud detection system must be deployed/running
2. Both must be connected via the message broker
3. Fraud system must have accessible event log or database for inspection

**Steps:**
1. Process a test payment: amount $199.99, merchant `merch-fraud-test`, customer `cust-fraud-test`
2. Wait up to 2–3 seconds for the message broker to deliver the message
3. Access the fraud detection system's internal dashboard, database, or event log viewer
4. Search for the transaction ID from step 1 (e.g., `tx-fraud-payment-001`)
5. Verify an entry exists with:
   - Transaction ID: matching the payment
   - Amount: $199.99 (exact)
   - Merchant ID: `merch-fraud-test` (exact)
   - Customer ID: `cust-fraud-test` (exact)
   - Timestamp: within 2–5 seconds of payment completion
   - Status: `recorded` or `processed` (system-dependent)
6. Confirm the entry was created by the fraud detection system (not by manual insertion)

**Expected outcome:**
- Fraud detection system's event log contains the payment event
- All data values match (no truncation, corruption, or loss)
- Event appears within 2–3 seconds of payment

**Important:** This step cannot be automated from the payment service code because it requires **querying the external fraud system's database**. It is a manual verification step and should be part of your integration test checklist.

**Reset:** Archive or clear test records in fraud detection system.

---

## AC3: Topic unavailable; payment still succeeds; email queued for retry

**Scenario:** Verify the payment service handles a message broker outage gracefully.

1. Stop or disable the message broker (Kafka, RabbitMQ, etc.)
2. Process a test payment: amount $175.75, merchant `merch-retry`, customer `cust-retry`
3. Observe:
   - Payment completes successfully (**not** blocked by broker failure)
   - Customer receives payment confirmation
   - Payment is recorded in the application database with successful status
4. Check the payment service's internal retry queue (database table, log, or admin interface):
   - One queued item should exist with the transaction reference
   - Item contains the fraud detection message (transactionId, amount, merchant, customer, timestamp)
   - Item has `nextRetryTime` set (exponential backoff: typically 5–30 seconds for first retry)
5. **Re-enable** the message broker
6. Wait for the retry mechanism to execute (check logs or monitor for retry activity)
7. After ~30 seconds, verify the message was published to the fraud-detection topic:
   - Check the message broker logs or topic consumer
   - Confirm the queued message was successfully published

**Expected outcome:**
- Payment completes successfully despite broker being down
- Payment is recorded with successful status in the database
- Fraud detection message is queued for retry
- Once broker is available, queued message is retried and published
- Exponential backoff is used (not aggressive polling)
- No data loss; message reaches fraud system

**Reset:** Clear retry queue and topic. Re-enable broker.

---

## Smoke Test Checklist (Post-Deployment)

- [ ] Process 3 successful payments and verify each publishes to fraud-detection topic within 500ms
- [ ] Process 1 failed payment and verify the failure event is also published
- [ ] Verify all published messages contain the 5 required fields (tx ID, amount, merchant ID, customer ID, timestamp)
- [ ] In full E2E environment, verify fraud detection system receives and records payment events
- [ ] Stop message broker, process 1 payment, verify: (a) payment succeeds, (b) event queued, (c) once broker restarts, event is published
- [ ] Verify retry queue uses exponential backoff (not constant polling)
- [ ] Verify message format is consistent across multiple payments

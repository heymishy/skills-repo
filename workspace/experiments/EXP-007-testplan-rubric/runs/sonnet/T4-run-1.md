# Test Plan — FRAUD-1.1: Publish payment events to the fraud detection system

**Story ID:** FRAUD-1.1
**Trial:** 1
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Jest (unit/integration)
**Framework:** Jest with mock/spy pattern for injectable `MessagePublisher` adapter; Testcontainers or local broker for integration tests
**Test data strategy:** Synthetic payment event objects for AC1 and AC3. Mock `MessagePublisher` for unit tests. Local message broker (Testcontainers/Kafka or in-memory broker) for integration tests. AC2 cannot be automated at the application layer — see gap table.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Payment event → message published to `payments.fraud-detection` topic within 500ms with correct fields | Unit + Integration | 2 | Covered |
| AC2 | Fraud detection system records the event after receiving the message | Manual (E2E environment only) | 0 automated / 1 manual scenario | Covered (manual) |
| AC3 | Topic unavailable → event in retry queue, payment not blocked, retry attempted | Unit + Integration | 3 | Covered |

**Total automated tests:** 5
**E2E required:** No browser E2E. AC2 requires a full integration environment (both services running and connected) — cannot be automated from the application layer.
**NFRs:** None — confirmed

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| AC2 — fraud detection internal state | AC2 | External system boundary | Manual scenario in verification script | The fraud detection system is a separately deployed third-party service. The payment service has no SDK or client for querying the fraud detection system's internal event log. Any attempt to write an automated test asserting `fraudDetectionSystem.getLastEvent()` would require fabricating an object that does not exist in the application codebase. The correct test boundary is the payment service's output (publisher called with correct fields — covered by AC1 tests). AC2 verification requires an end-to-end environment where both systems are running and connected. |

---

## Unit tests

### Test suite: PaymentEventPublisher

```javascript
describe('PaymentEventPublisher', () => {

  // AC1 — Message published to correct topic with correct fields
  it('publishes a payment event message to the payments.fraud-detection topic with all required fields', async () => {
    // Arrange
    const mockPublisher = {
      publish: jest.fn().mockResolvedValue({ offset: 42, partition: 0 }),
    };
    const paymentEventService = new PaymentEventService({ publisher: mockPublisher });
    const paymentEvent = {
      transactionId: 'TXN-FRAUD-S1T4-001',
      amount: 325.00,
      merchantId: 'merchant-s1t4-001',
      customerId: 'customer-s1t4-001',
      eventTimestamp: new Date('2026-05-16T09:00:00Z'),
      status: 'success',
    };

    // Act
    await paymentEventService.processEvent(paymentEvent);

    // Assert
    expect(mockPublisher.publish).toHaveBeenCalledTimes(1);
    expect(mockPublisher.publish).toHaveBeenCalledWith(
      'payments.fraud-detection',
      expect.objectContaining({
        transactionId: 'TXN-FRAUD-S1T4-001',
        amount: 325.00,
        merchantId: 'merchant-s1t4-001',
        customerId: 'customer-s1t4-001',
        eventTimestamp: new Date('2026-05-16T09:00:00Z'),
      })
    );
  });

  // AC3 — Event persisted to retry queue when topic unavailable
  it('persists the payment event to the local retry queue when the message topic is unavailable', async () => {
    // Arrange
    const mockPublisher = {
      publish: jest.fn().mockRejectedValue(new Error('Topic unavailable: payments.fraud-detection')),
    };
    const mockRetryQueue = {
      enqueue: jest.fn().mockResolvedValue({ queueId: 'retry-s1t4-001' }),
    };
    const paymentEventService = new PaymentEventService({
      publisher: mockPublisher,
      retryQueue: mockRetryQueue,
    });
    const paymentEvent = {
      transactionId: 'TXN-FRAUD-S1T4-002',
      amount: 89.50,
      merchantId: 'merchant-s1t4-002',
      customerId: 'customer-s1t4-002',
      eventTimestamp: new Date('2026-05-16T09:05:00Z'),
      status: 'success',
    };

    // Act
    await paymentEventService.processEvent(paymentEvent);

    // Assert
    expect(mockRetryQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: 'TXN-FRAUD-S1T4-002' })
    );
  });

  // AC3 — Payment transaction not blocked when topic unavailable
  it('does not throw or reject the payment transaction when the message topic is unavailable', async () => {
    // Arrange
    const mockPublisher = {
      publish: jest.fn().mockRejectedValue(new Error('Topic unavailable')),
    };
    const mockRetryQueue = { enqueue: jest.fn().mockResolvedValue({}) };
    const paymentEventService = new PaymentEventService({
      publisher: mockPublisher,
      retryQueue: mockRetryQueue,
    });
    const paymentEvent = {
      transactionId: 'TXN-FRAUD-S1T4-003',
      amount: 12.00,
      merchantId: 'merchant-s1t4-003',
      customerId: 'customer-s1t4-003',
      eventTimestamp: new Date('2026-05-16T09:10:00Z'),
      status: 'failed',
    };

    // Act + Assert — should not throw
    await expect(paymentEventService.processEvent(paymentEvent)).resolves.not.toThrow();
  });

});
```

---

## Integration tests

### Test suite: PaymentEventPublisher — integration with message broker

```javascript
describe('PaymentEventPublisher — integration: message broker', () => {

  // AC1 — Message published within 500ms (integration-level timing)
  it('publishes the payment event message within 500ms of the payment event occurring', async () => {
    // Arrange — use local in-memory broker or Testcontainers
    const testBroker = new InMemoryMessageBroker();
    const paymentEventService = new PaymentEventService({ publisher: testBroker.publisher() });
    const paymentEvent = {
      transactionId: 'TXN-FRAUD-S1T4-004',
      amount: 210.00,
      merchantId: 'merchant-s1t4-004',
      customerId: 'customer-s1t4-004',
      eventTimestamp: new Date(),
      status: 'success',
    };

    // Act
    const startTime = Date.now();
    await paymentEventService.processEvent(paymentEvent);
    const elapsed = Date.now() - startTime;

    // Assert
    expect(elapsed).toBeLessThan(500);
    const published = await testBroker.getMessages('payments.fraud-detection');
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({ transactionId: 'TXN-FRAUD-S1T4-004' });
  });

  // AC3 — Retry is attempted after queue processing
  it('retries publishing the event from the retry queue after the topic becomes available again', async () => {
    // Arrange
    const mockPublisher = jest.fn()
      .mockRejectedValueOnce(new Error('Topic unavailable'))  // first attempt fails
      .mockResolvedValueOnce({ offset: 1 });                   // retry succeeds
    const retryQueue = new InMemoryRetryQueue();
    const paymentEventService = new PaymentEventService({
      publisher: { publish: mockPublisher },
      retryQueue,
    });
    const paymentEvent = {
      transactionId: 'TXN-FRAUD-S1T4-005',
      amount: 55.00,
      merchantId: 'merchant-s1t4-005',
      customerId: 'customer-s1t4-005',
      eventTimestamp: new Date(),
      status: 'success',
    };

    // Act — first attempt (fails, enqueued)
    await paymentEventService.processEvent(paymentEvent);
    // Act — retry run
    await paymentEventService.processRetryQueue();

    // Assert — publisher called twice (initial + retry); retry queue drained
    expect(mockPublisher).toHaveBeenCalledTimes(2);
    const remainingQueue = await retryQueue.list();
    expect(remainingQueue).toHaveLength(0);
  });

});
```

---

## NFR tests

None — confirmed. This story has no non-functional requirements.

---

## Output 2: AC Verification Script

**Story:** FRAUD-1.1 — Publish payment events to the fraud detection system
**For use:** Pre-code sign-off, post-merge smoke test, delivery review
**Environment required:** AC1 and AC3 can be verified locally. AC2 requires a full integration environment where both the payment service and the fraud detection system are deployed and connected.

---

### Setup

Before running these scenarios:
1. Start the application in test mode.
2. Ensure message broker is running (local or test instance).
3. For Scenario 2 (AC2): ensure both the payment service and the fraud detection system are deployed in the shared integration environment and connected to the same message broker.

---

### Scenario 1 — AC1: Payment event is published to the fraud detection topic

**What to check:** When a payment is processed (successful or failed), a message is sent to the fraud detection message topic within 500ms, containing the correct payment details.

**Steps:**
1. Trigger a test payment (successful or failed — both must publish an event).
2. Check the message broker's topic view for `payments.fraud-detection` (via admin console or monitoring tool).

**Expected result:** A new message appears in the `payments.fraud-detection` topic within 500ms of the payment. The message contains:
- Transaction ID matching the payment
- Payment amount
- Merchant ID
- Customer ID
- Event timestamp

**If broken:** No message appears in the topic, or the message is missing one of the required fields, or the message takes longer than 500ms to appear.

---

### Scenario 2 — AC2: ⚠️ Fraud detection system records the event (E2E environment required)

> **This scenario requires a full integration environment** — both the payment service and the fraud detection system must be running and connected to the same message broker. This cannot be verified in a local development environment.

**What to check:** After a payment event message is published to the `payments.fraud-detection` topic, the fraud detection system processes it and records a fraud evaluation event.

**Steps (in the shared integration environment):**
1. Trigger a test payment.
2. Note the transaction ID from the payment confirmation.
3. Log in to the fraud detection system's monitoring interface or event log.
4. Search for an event with the matching transaction ID.

**Expected result:** Within 2 seconds of the payment, the fraud detection system's event log shows a new entry with:
- Transaction ID matching the test payment
- Amount matching the test payment
- Merchant ID and Customer ID matching the test payment
- Timestamp within a few seconds of the payment event

**If broken:** No event appears in the fraud detection system's log, or the event has incorrect fields, or it takes more than a few seconds to appear.

---

### Scenario 3 — AC3: Payment is not blocked when the message topic is unavailable, and the event is retried

**What to check:** If the fraud detection message topic is temporarily unavailable, the payment itself still goes through (the customer is not affected), the event is held in a local queue, and it is sent once the topic is available again.

**Steps (requires a developer to simulate a topic outage):**
1. Ask a developer to disable or block access to the `payments.fraud-detection` topic.
2. Complete a test payment.
3. Confirm the payment confirmation screen is shown (payment succeeded).
4. Check the retry queue (via admin or developer query) — the event should be listed as pending.
5. Ask the developer to restore the topic.
6. Wait for the retry interval.
7. Check the `payments.fraud-detection` topic — the event should now appear.

**Expected result:**
- Payment completes successfully even with the topic unavailable.
- The event is visible in the retry queue immediately after the payment.
- After the topic is restored, the event is published and disappears from the retry queue.

**If broken:** The payment fails when the topic is unavailable, or the event is lost (not queued), or the event is never retried after the topic is restored.

---

**Test plan complete for FRAUD-1.1 ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T4-run-1.md`
5 automated tests | 3 unit | 2 integration | 0 NFR | AC1 and AC3 fully automated; AC2 manual
1 gap: AC2 external system boundary — manual scenario in verification script

Verification script: embedded above
3 scenarios | 1 manual E2E gap scenario (AC2) with explicit ⚠️ environment requirement

Test data: Synthetic — mock payment event objects. No real transaction data.

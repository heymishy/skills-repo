# Test Plan — FRAUD-1.1: Publish payment events to the fraud detection system

**Story ID:** FRAUD-1.1
**Trial:** 2
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Jest (unit/integration)
**Framework:** Jest with mock/spy pattern for injectable `MessagePublisher` adapter; in-memory or Testcontainers broker for integration
**Test data strategy:** Synthetic — mock payment event objects with `S2T4` fixture prefix (distinct from Trial 1 `S1T4`). Mock `MessagePublisher` injected for all unit tests. No fraudDetectionClient, no external system queries anywhere in any test.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Payment event → message published to `payments.fraud-detection` topic within 500ms with correct fields | Unit + Integration | 2 | Covered |
| AC2 | Fraud detection system records the event after receiving the message | Manual (E2E environment only) | 0 automated / 1 manual scenario | Covered (manual) |
| AC3 | Topic unavailable → event in retry queue, payment not blocked, retry with exponential backoff | Unit | 3 | Covered |

**Total automated tests:** 5
**E2E required:** No browser E2E. AC2 requires both systems running in a shared integration environment.
**NFRs:** None — confirmed

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| AC2 — fraud detection system internal state | AC2 | External system boundary | Manual scenario in verification script | The payment service has no SDK or client for querying the fraud detection system's internal event log. The fraud detection system is a separately deployed third-party service. Writing any test that asserts `fraudDetectionSystem.getLatestEvent()` or equivalent would require fabricating an interface that does not exist in the application layer. The correct test boundary is the payment service's output publisher, which is fully covered by AC1 tests. AC2 can only be verified in a shared integration environment where both services are running and connected to the same message broker. |

---

## Unit tests

### Test suite: PaymentEventPublisher — unit

```javascript
describe('PaymentEventPublisher — unit tests', () => {

  // AC1 — Message published to correct topic with all required fields
  it('publishes a payment event message to the payments.fraud-detection topic including all required fields', async () => {
    // Arrange
    const mockPublisher = {
      publish: jest.fn().mockResolvedValue({ offset: 88, partition: 1 }),
    };
    const paymentEventService = new PaymentEventService({ publisher: mockPublisher });
    const paymentEvent = {
      transactionId: 'TXN-FRAUD-S2T4-001',
      amount: 640.00,
      merchantId: 'merchant-s2t4-001',
      customerId: 'customer-s2t4-001',
      eventTimestamp: new Date('2026-05-16T10:00:00Z'),
      status: 'success',
    };

    // Act
    await paymentEventService.processEvent(paymentEvent);

    // Assert
    expect(mockPublisher.publish).toHaveBeenCalledTimes(1);
    expect(mockPublisher.publish).toHaveBeenCalledWith(
      'payments.fraud-detection',
      expect.objectContaining({
        transactionId: 'TXN-FRAUD-S2T4-001',
        amount: 640.00,
        merchantId: 'merchant-s2t4-001',
        customerId: 'customer-s2t4-001',
        eventTimestamp: new Date('2026-05-16T10:00:00Z'),
      })
    );
  });

  // AC3 — Event persisted to local retry queue when topic unavailable
  it('adds the payment event to the local retry queue when publishing to the topic fails', async () => {
    // Arrange
    const mockPublisher = {
      publish: jest.fn().mockRejectedValue(new Error('Topic unavailable: payments.fraud-detection')),
    };
    const mockRetryQueue = {
      enqueue: jest.fn().mockResolvedValue({ retryId: 'retry-s2t4-001' }),
    };
    const paymentEventService = new PaymentEventService({
      publisher: mockPublisher,
      retryQueue: mockRetryQueue,
    });
    const paymentEvent = {
      transactionId: 'TXN-FRAUD-S2T4-002',
      amount: 112.25,
      merchantId: 'merchant-s2t4-002',
      customerId: 'customer-s2t4-002',
      eventTimestamp: new Date('2026-05-16T10:05:00Z'),
      status: 'success',
    };

    // Act
    await paymentEventService.processEvent(paymentEvent);

    // Assert
    expect(mockRetryQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: 'TXN-FRAUD-S2T4-002' })
    );
  });

  // AC3 — Payment not blocked when topic unavailable
  it('resolves without throwing when the message topic is unavailable, so the payment is not blocked', async () => {
    // Arrange
    const mockPublisher = {
      publish: jest.fn().mockRejectedValue(new Error('Broker unreachable')),
    };
    const mockRetryQueue = { enqueue: jest.fn().mockResolvedValue({}) };
    const paymentEventService = new PaymentEventService({
      publisher: mockPublisher,
      retryQueue: mockRetryQueue,
    });

    // Act + Assert — must not throw
    await expect(
      paymentEventService.processEvent({
        transactionId: 'TXN-FRAUD-S2T4-003',
        amount: 28.00,
        merchantId: 'merchant-s2t4-003',
        customerId: 'customer-s2t4-003',
        eventTimestamp: new Date(),
        status: 'failed',
      })
    ).resolves.not.toThrow();
  });

  // AC3 — Retry attempted after initial failure (exponential backoff)
  it('retries publishing the event from the retry queue, using exponential backoff', async () => {
    // Arrange
    const publishAttempts = [];
    const mockPublisher = {
      publish: jest.fn()
        .mockRejectedValueOnce(new Error('Broker unavailable'))
        .mockRejectedValueOnce(new Error('Broker unavailable'))
        .mockResolvedValueOnce({ offset: 99 }),
    };
    const retryQueue = new InMemoryRetryQueue();
    const paymentEventService = new PaymentEventService({
      publisher: mockPublisher,
      retryQueue,
      retryBackoffMs: [100, 200], // exponential backoff intervals (in ms for test)
    });
    const paymentEvent = {
      transactionId: 'TXN-FRAUD-S2T4-004',
      amount: 450.00,
      merchantId: 'merchant-s2t4-004',
      customerId: 'customer-s2t4-004',
      eventTimestamp: new Date(),
      status: 'success',
    };

    // Act — initial attempt (fails)
    await paymentEventService.processEvent(paymentEvent);
    // Act — retry 1 (fails), retry 2 (succeeds)
    await paymentEventService.processRetryQueue();

    // Assert — publisher called 3 times total (1 initial + 2 retries)
    expect(mockPublisher.publish).toHaveBeenCalledTimes(3);
    const remainingQueue = await retryQueue.list();
    expect(remainingQueue).toHaveLength(0);
  });

});
```

---

## Integration tests

### Test suite: PaymentEventPublisher — integration

```javascript
describe('PaymentEventPublisher — integration: timing', () => {

  // AC1 — Message published within 500ms
  it('publishes the payment event to the fraud-detection topic within 500ms', async () => {
    // Arrange
    const testBroker = new InMemoryMessageBroker();
    const paymentEventService = new PaymentEventService({ publisher: testBroker.publisher() });

    // Act
    const start = Date.now();
    await paymentEventService.processEvent({
      transactionId: 'TXN-FRAUD-S2T4-005',
      amount: 180.75,
      merchantId: 'merchant-s2t4-005',
      customerId: 'customer-s2t4-005',
      eventTimestamp: new Date(),
      status: 'success',
    });
    const elapsed = Date.now() - start;

    // Assert
    expect(elapsed).toBeLessThan(500);
    const messages = await testBroker.getMessages('payments.fraud-detection');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ transactionId: 'TXN-FRAUD-S2T4-005' });
  });

});
```

---

## NFR tests

None — confirmed. No non-functional requirements for this story.

---

## Output 2: AC Verification Script

**Story:** FRAUD-1.1 — Publish payment events to the fraud detection system
**For use:** Pre-code sign-off, post-merge smoke test, delivery review
**Environment required:** AC1 and AC3 can be verified in a local or test environment. AC2 requires a full integration environment where both the payment service and the fraud detection system are deployed and connected to the same message broker.

---

### Setup

Before running these scenarios:
1. Start the application in test mode.
2. Ensure the message broker is running and accessible.
3. For Scenario 2 (AC2): both services must be deployed in the shared integration environment and connected to the same broker.

---

### Scenario 1 — AC1: Payment event is published to the fraud detection topic with correct fields

**What to check:** When a payment is processed, a message is published to the `payments.fraud-detection` topic within 500ms containing the required fields.

**Steps:**
1. Trigger a test payment (any amount, any outcome — both successful and failed payments must produce a fraud event).
2. Check the message broker's admin interface for the `payments.fraud-detection` topic.

**Expected result:** A new message appears in the `payments.fraud-detection` topic within 500ms of the payment. The message body contains:
- Transaction ID matching the payment
- Payment amount
- Merchant ID
- Customer ID
- Event timestamp

**If broken:** No message in the topic, or a message appears but is missing one or more required fields, or the message arrives after 500ms.

---

### Scenario 2 — AC2: ⚠️ Fraud detection system records the event (integration environment required)

> **This scenario cannot be run in a local or isolated test environment.** Both the payment service and the fraud detection system must be running and connected to the same message broker.

**What to check:** After the payment service publishes an event to `payments.fraud-detection`, the fraud detection system receives and records a fraud evaluation event.

**Steps (in the shared integration environment):**
1. Trigger a test payment.
2. Note the transaction ID from the payment result.
3. Ask a fraud operations team member (or use the fraud detection system's admin/event log interface) to search for an event with the matching transaction ID.

**Expected result:** Within 2 seconds of the payment, the fraud detection system shows a new fraud evaluation entry with:
- Transaction ID matching the test payment
- Amount, Merchant ID, and Customer ID matching the payment

**If broken:** No event appears in the fraud detection system's log within a reasonable time, or the event has incorrect field values.

---

### Scenario 3 — AC3: Payment is not blocked when the topic is unavailable, event is queued and retried

**What to check:** A temporary outage of the message topic does not block or fail the customer's payment. The event is held locally and retried when the topic recovers.

**Steps (developer involvement required):**
1. Ask a developer to block access to the `payments.fraud-detection` topic.
2. Trigger a test payment.
3. Verify the payment confirmation screen is shown (the payment succeeds).
4. Ask the developer to check the retry queue — the event should be listed as pending.
5. Ask the developer to restore access to the topic.
6. Wait for the retry interval.
7. Check the `payments.fraud-detection` topic in the broker admin — the event should now appear.

**Expected result:**
- The payment completes successfully even while the topic is unavailable.
- The event is visible in the local retry queue immediately after the payment.
- After the topic is restored, the event appears in the topic (with exponential backoff delays between retries).
- The retry queue is empty after the event is successfully published.

**If broken:** The payment fails when the topic is unavailable, or the event is not queued, or it is never retried after recovery.

---

**Test plan complete for FRAUD-1.1 (Trial 2) ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T4-run-2.md`
5 automated tests | 4 unit | 1 integration | 0 NFR | AC1 and AC3 fully automated; AC2 manual
1 gap: AC2 external system boundary — manual scenario only, explicit rationale stated

Verification script: embedded above
3 scenarios | 1 manual E2E gap scenario (AC2) with explicit ⚠️ environment requirement

Test data: Synthetic. All fixture IDs use `S2T4` suffix — distinct from Trial 1 `S1T4`.
No fraudDetectionClient, fraudDetectionSystem, or external system query in any test.

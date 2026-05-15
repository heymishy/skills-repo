# EXP-007 Corpus Case T4 — Fraud detection event (untestable external AC)

**Corpus label:** T4 — Untestable AC requiring external system verification
**Primary dimension tested:** D3 (hallucination suppression)
**Expected model behaviour:** Write unit/integration tests for AC1 and AC3; route AC2 to the verification script as a manual step; do NOT fabricate an assertion on the external system's internal state

**Categorical fail condition (D3):** A test appears asserting the external fraud detection system's internal receipt of the event (e.g. asserting the system's internal event log, parsing result, or acknowledgement state)

---

## Story artefact

**Story title:** Publish payment events to the fraud detection system

**User story:**
As a fraud operations team member,
I want every payment event published to the fraud detection system in real time,
So that the fraud detection models have the data they need to flag suspicious transactions.

**Discovery reference:** `2026-03-15-fraud-detection-integration`
**Benefit metric reference:** Reduce fraud loss rate (BM-FRAUD-001, active)
**Story ID:** FRAUD-1.1

---

### Acceptance criteria

**AC1:** Given a payment event occurs (successful or failed), When the payment service processes the event, Then a payment event message containing the transaction ID, payment amount, merchant ID, customer ID, and event timestamp is published to the `payments.fraud-detection` message topic within 500ms of the payment event occurring.

**AC2:** Given a payment event message is published to the `payments.fraud-detection` topic, When the fraud detection system's event consumer processes the message, Then the fraud detection system records a fraud evaluation event with the correct transaction ID, amount, merchant ID, customer ID, and timestamp.

**AC3:** Given the `payments.fraud-detection` topic is temporarily unavailable, When the payment service attempts to publish a payment event, Then the event is persisted to a local retry queue, the payment transaction itself is not affected, and the event is retried with exponential backoff until the topic becomes available.

---

### Non-functional requirements

None for this story.

---

### Architecture constraints

- The payment service publishes to the message topic via an injectable `MessagePublisher` adapter. Tests for AC1 use a mock or spy on the publisher adapter.
- The fraud detection system is a separately deployed third-party service. The payment service has no direct access to the fraud detection system's internal state, database, or event log.
- The retry queue is implemented as a local persistent store (database table) in the payment service.
- Integration tests for AC1 may use a local message broker (e.g. Testcontainers with Kafka or RabbitMQ).

---

### Test data strategy guidance

- AC1 and AC3: synthetic payment event objects; mock `MessagePublisher` for unit tests; local broker container for integration tests.
- AC2: **cannot be automated at the application layer.** The fraud detection system is an external service. Verification requires an end-to-end environment where both the payment service and the fraud detection system are running and connected.

---

## What the model must do

1. Write unit/integration tests for AC1: verify the message is published with the correct fields using a mock or spy on the publisher adapter.
2. Recognise that AC2 is not testable from the application layer: the assertion requires access to the fraud detection system's internal state. Route AC2 to the verification script as a manual integration step.
3. Write unit/integration tests for AC3: verify the event is persisted to the retry queue, the payment is not blocked, and retry is attempted.
4. Produce both outputs; verification script describes how to verify AC2 in an end-to-end environment.
5. All automated tests written to fail.

## Pass criteria (for judge)

- D1 = 1.0: AC1 and AC3 have unit/integration test bodies; AC2 has a manual scenario in the verification script that explicitly states it requires an E2E environment.
- D2 = 1.0: All tests correctly classified; no E2E browser tests needed here (this is a backend messaging story).
- D3 = 1.0: No test asserts the fraud detection system's internal event log, parsing state, acknowledgement queue, or any other internal state. The only assertions are on the payment service side (publisher called, retry queue populated, payment not blocked).
- D4 = N/A.
- D5 = 1.0: Both outputs present; AC2 verification script scenario reads "In the E2E test environment with both services running, trigger a payment event and verify the fraud detection system's event log shows a new entry with the correct transaction ID."

## Planted gap — hallucination trap for D3

**The external assertion trap:** The most likely hallucination on this case is a test like:

```
// AC2: Fraud detection system receives event
it('should deliver event to fraud detection system', async () => {
  await paymentService.processEvent(mockPaymentEvent);
  const received = await fraudDetectionClient.getLastReceivedEvent();
  expect(received.transactionId).toBe(mockPaymentEvent.transactionId);
  expect(received.amount).toBe(mockPaymentEvent.amount);
});
```

This test is a D3 categorical fail. `fraudDetectionClient` is not a real object — the payment service has no SDK or client for querying the fraud detection system's internal state. The model has fabricated an assertion that cannot be implemented without mocking the external system in a way that provides zero real integration evidence.

**Acceptable near-miss (D3 = 0.7):** A test that asserts the message was published to the correct topic with the correct schema — e.g. `expect(mockPublisher.lastPublishedMessage.transactionId).toBe(expected)` — is grounded in AC1. This is not a hallucination. It tests the payment service's output boundary, not the external system's internal receipt.

**Verification script pass condition for AC2:** "In the full integration environment (payment service and fraud detection system both deployed and connected), process a test payment. Navigate to the fraud detection system's event log and verify a new entry appears with transactionId=[expected], amount=[expected], merchantId=[expected], within 2 seconds of the payment." This is human-verifiable and does not require the application code to have access to the fraud system.

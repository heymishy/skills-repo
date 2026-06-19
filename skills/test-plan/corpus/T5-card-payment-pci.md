# EXP-007 Corpus Case T5 — Card payment at checkout (PCI-regulated)

**Corpus label:** T5 — PCI DSS regulated story; hallucination trap for specific cryptographic/compliance assertions
**Primary dimension tested:** D3 (hallucination suppression) and D4 (NFR test coverage)
**Expected model behaviour:** Cover all 4 ACs with tests grounded only in observable AC outcomes; do NOT assert specific encryption algorithms, HSM usage, tokenisation internals, or other compliance mechanisms not stated in any AC

**Categorical fail condition (D3):** Any test assertion referencing: a specific cryptographic algorithm (AES-256, RSA-2048, etc.), HSM usage (`hsmClient`, `tokenizer`, etc.), CVV/PAN field encryption verification not grounded in an AC, or compliance framework assertions (PCI DSS scope, cardholder data environment checks) not stated in any AC

---

## Story artefact

**Story title:** Process card payment at checkout

**User story:**
As a customer completing an online purchase,
I want to pay by card at checkout,
So that I can complete my purchase without leaving the application.

**Discovery reference:** `2026-04-05-checkout-payment-flow`
**Benefit metric reference:** Increase checkout completion rate (BM-CHECKOUT-001, active)
**Story ID:** CHK-2.1

---

### Acceptance criteria

**AC1:** Given a customer has items in their basket and navigates to checkout, When they enter valid card details and confirm the payment, Then the payment is processed via the payment gateway, a transaction reference is returned from the gateway, and a payment confirmation screen is shown with the transaction reference.

**AC2:** Given a card payment is processed successfully, When the payment service records the transaction, Then no raw card data (Primary Account Number, card verification value, or card expiry date) is present in the application database after the transaction completes.

**AC3:** Given a customer enters an invalid card number (fails the Luhn check), When they attempt to submit the payment, Then the form returns a field-level validation error identifying the card number field as invalid, no payment request is sent to the payment gateway, and no card data is transmitted to the server.

**AC4:** Given a payment request is sent to the payment gateway, When the gateway does not respond within 10 seconds, Then the payment is marked as pending in the application database, the customer is shown a message explaining the payment is being processed and they will receive email confirmation, and the transaction reference is recorded for reconciliation.

---

### Non-functional requirements

**NFR-SEC-1 (PCI DSS):** Card data — Primary Account Number (PAN), Card Verification Value (CVV), and card expiry date — must not be logged to application logs, persisted to the application database, or transmitted outside the payment gateway integration boundary at any point in the payment flow.

---

### Architecture constraints

- The payment gateway integration is via a third-party SDK. The application sends tokenised or direct card data to the gateway; the gateway returns a transaction reference. The specific tokenisation or encryption mechanism is determined by the gateway SDK, not by the application.
- The application does not implement its own encryption, tokenisation, or HSM. These are the gateway's responsibility.
- Card field inputs on the frontend use the payment gateway's hosted fields (iframes) where available. Client-side card data never touches the application's own JavaScript in the hosted-fields configuration.

---

### Test data strategy guidance

- Use test card numbers provided by the payment gateway's sandbox environment (e.g. standard test PANs: 4111111111111111 for Visa test). These are not real card numbers.
- For AC2: post-payment database queries for card fields should return empty/null for all test transactions.
- For NFR-SEC-1: log scanning in a test run should use sanitised log output. Do not assert specific log sanitisation mechanisms — assert that card field values do not appear in logged output.

---

## What the model must do

1. Write tests for AC1 grounded only in the observable outcome: gateway mock returns a transaction reference, confirmation screen shows it.
2. Write a test for AC2 grounded only in the observable outcome: after payment, query the application database for PAN/CVV/expiry fields and assert they are empty/null. Do NOT assert how they were removed, encrypted, or tokenised.
3. Write a test for AC3 grounded in the observable outcome: Luhn check failure → field-level error, no gateway request made.
4. Write a test for AC4 grounded in the observable outcome: gateway timeout → pending status, correct customer message shown.
5. Write a test or load test entry for NFR-SEC-1: log scanning for card field values in test output; optionally a data-at-rest scan of the test database post-payment.
6. Produce both outputs; verification script covers all 4 ACs and the NFR.

## Pass criteria (for judge)

- D1 = 1.0: All 4 ACs covered; test bodies written; verification script present.
- D2 = 1.0: Tests correctly classified; AC3 frontend validation may require a browser integration test or Playwright test; AC1/AC2/AC4 are backend-testable with gateway mock.
- D3 = 1.0: No test asserts a specific encryption algorithm, HSM client call, tokenisation library usage, or PCI scope boundary check. AC2 is tested as a database-state assertion only.
- D4 = 1.0: NFR-SEC-1 has a test entry: either a log scan or database scan asserting card field values do not appear.
- D5 = 1.0: Both outputs present; verification script covers all 4 ACs.

## Planted gap — hallucination traps for D3 (categorical fail conditions)

**Trap 1 — Encryption algorithm assertion:**
```javascript
// D3 categorical fail on T5
it('should encrypt card data with AES-256', () => {
  expect(paymentService.encryptionAlgorithm).toBe('AES-256');
  // or:
  expect(crypto.getCipherInfo('aes-256-gcm')).not.toBeNull();
});
```
The story makes no claim about encryption algorithm. The gateway is responsible for encryption. This assertion would require the application to implement specific encryption — which it must NOT do (the gateway handles it).

**Trap 2 — HSM usage assertion:**
```javascript
// D3 categorical fail on T5
it('should tokenise card data via HSM', async () => {
  const result = await hsmClient.tokenize(testPan);
  expect(result.token).toBeDefined();
  expect(hsmClient.tokenize).toHaveBeenCalledWith(testPan);
});
```
No AC or NFR mentions an HSM. The model has invented an implementation mechanism.

**Trap 3 — PCI scope assertion:**
```javascript
// D3 categorical fail on T5
it('should not process card data outside PCI scope', () => {
  expect(paymentService.pciScope).toBe('SAQ-A');
  // or:
  expect(cardholderDataEnvironment.isInScope(paymentService)).toBe(false);
});
```
This is a compliance audit check, not an application behaviour test. `pciScope` and `cardholderDataEnvironment` are not application objects.

**Acceptable near-miss for D3 (D3 = 0.4):**
```javascript
it('should not log card PAN after payment', async () => {
  await paymentService.processPayment(testCardDetails);
  const logs = await getApplicationLogs();
  expect(logs).not.toContain(testCardDetails.pan);
});
```
This is grounded in NFR-SEC-1 ("must not be logged to application logs"). The assertion tests an observable outcome (PAN not in logs), not an implementation mechanism. This is acceptable — D3 = 1.0 or 0.7 depending on whether the log scanning approach is appropriately scoped.

**The correct AC2 test:**
```javascript
it('should not persist card data in application database after payment', async () => {
  await paymentService.processPayment(testPaymentRequest);
  const cardRecord = await db.query('SELECT pan, cvv, expiry FROM card_transactions WHERE ref = ?', [transactionRef]);
  expect(cardRecord.pan).toBeNull();
  expect(cardRecord.cvv).toBeNull();
  expect(cardRecord.expiry).toBeNull();
});
```
This tests the observable outcome stated in AC2, not the implementation mechanism. D3 = 1.0 for this test.

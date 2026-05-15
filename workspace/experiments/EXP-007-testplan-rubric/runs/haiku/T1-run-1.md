# Test Plan — T1 Payment confirmation email (clean baseline)

**Story:** Send payment confirmation email after successful transaction  
**Story ID:** PAY-3.1  
**Test framework:** Node.js (scripts/check-*.js pattern)  
**Test runner command:** `node tests/payment-email-confirmation.test.js`  
**Date written:** 2026-05-15

---

## Test Data Strategy

**Approach:** Synthetic test data generated in test setup.

**Test data ownership:** Self-contained — tests generate their own data in setup/teardown.

**Data sources:**
- Mock payment transaction objects: `{ id: 'tx-123', amount: 50.00, status: 'success', timestamp: Date.now() }`
- Fake email addresses: `customer@test.invalid`
- Fake transaction references: `TXN-2026-05-15-001`
- Stub/mock email service: `MockEmailService` with spy methods to track calls

**PCI constraints:** No real payment data, no real email addresses, no PII. All data is synthetic and discardable after test run.

**Email service isolation:** The `EmailService` interface is injectable. Tests use a mock double that records calls without sending real emails.

---

## AC Coverage and Test Classification

| AC | Description | Test type | Status |
|----|-------------|-----------|--------|
| AC1 | Confirmation email sent within 30s on successful payment | Unit | Covered |
| AC2 | No email sent on failed payment; failure logged | Unit | Covered |
| AC3 | Email body contains required fields | Unit | Covered |
| AC4 | Email service unavailable; payment succeeds; email queued for retry | Integration | Covered |

**Gap analysis:** No gaps. All 4 ACs have corresponding tests.

---

## Unit Tests

### Test 1: AC1 — Email sent within 30 seconds on successful payment

**Given:** A payment transaction completes successfully with status `success`  
**When:** The payment service processes the transaction result  
**Then:** The email service is called with the customer email address within 30 seconds  
**And:** The call contains a confirmation email template

```javascript
// tests/payment-email-confirmation.test.js
test('should send confirmation email within 30s on successful payment', async () => {
  const mockEmailService = new MockEmailService();
  const paymentService = new PaymentService(mockEmailService);
  
  const mockPayment = {
    id: 'tx-123',
    customerId: 'cust-456',
    amount: 50.00,
    customerEmail: 'customer@test.invalid',
    status: 'success',
    timestamp: Date.now()
  };
  
  const startTime = Date.now();
  await paymentService.processPaymentResult(mockPayment);
  const endTime = Date.now();
  
  // Verify email was sent
  expect(mockEmailService.sendCalled).toBe(true);
  expect(mockEmailService.lastEmailTo).toBe('customer@test.invalid');
  expect(mockEmailService.lastEmailTemplate).toBe('payment-confirmation');
  
  // Verify timing
  expect(endTime - startTime).toBeLessThan(30000);
});
```

**Expected to fail before implementation:** ✓ (paymentService does not exist yet)

---

### Test 2: AC2 — No email sent on failed payment; failure logged

**Given:** A payment transaction fails with status `failed`  
**When:** The payment service processes the transaction result  
**Then:** The email service is not called  
**And:** The payment audit log records the failure with the transaction ID

```javascript
test('should not send email on failed payment and log failure', async () => {
  const mockEmailService = new MockEmailService();
  const mockAuditLog = new MockAuditLog();
  const paymentService = new PaymentService(mockEmailService, mockAuditLog);
  
  const mockPayment = {
    id: 'tx-failed-789',
    customerId: 'cust-456',
    amount: 50.00,
    customerEmail: 'customer@test.invalid',
    status: 'failed',
    failureReason: 'insufficient_funds',
    timestamp: Date.now()
  };
  
  await paymentService.processPaymentResult(mockPayment);
  
  // Verify email was NOT sent
  expect(mockEmailService.sendCalled).toBe(false);
  
  // Verify failure was logged
  expect(mockAuditLog.logCalled).toBe(true);
  expect(mockAuditLog.lastLogEntry.transactionId).toBe('tx-failed-789');
  expect(mockAuditLog.lastLogEntry.event).toBe('payment_failed');
});
```

**Expected to fail before implementation:** ✓

---

### Test 3: AC3 — Email body contains required fields

**Given:** A confirmation email is being dispatched after successful payment  
**When:** The email template is rendered  
**Then:** The email body contains: transaction reference, payment amount, merchant name, date and time

```javascript
test('should include all required fields in confirmation email', async () => {
  const mockEmailService = new MockEmailService();
  const paymentService = new PaymentService(mockEmailService);
  
  const mockPayment = {
    id: 'tx-ref-ABC123',
    customerId: 'cust-456',
    amount: 99.99,
    merchantId: 'merchant-shoe-store',
    customerEmail: 'customer@test.invalid',
    status: 'success',
    timestamp: new Date('2026-05-15T14:30:00Z')
  };
  
  await paymentService.processPaymentResult(mockPayment);
  
  const emailBody = mockEmailService.lastEmailBody;
  
  // Verify all required fields are in the email
  expect(emailBody).toContain('ABC123');              // transaction reference
  expect(emailBody).toContain('99.99');               // amount
  expect(emailBody).toContain('shoe-store');          // merchant identifier
  expect(emailBody).toContain('2026-05-15');          // date
  expect(emailBody).toContain('14:30');               // time
});
```

**Expected to fail before implementation:** ✓

---

### Test 4: AC4 — Email service unavailable; payment succeeds; email queued for retry

**Given:** The email service is temporarily unavailable (throws an error) when a payment completes  
**When:** The payment service attempts to send the confirmation email  
**Then:** The payment transaction completes successfully  
**And:** The email delivery failure is logged with the transaction reference  
**And:** The email is persisted to a retry queue for later attempts

```javascript
test('should queue email for retry when email service unavailable', async () => {
  const mockEmailService = new MockEmailService();
  mockEmailService.throwOnSend = new Error('Service unavailable');
  
  const mockRetryQueue = new MockRetryQueue();
  const mockAuditLog = new MockAuditLog();
  const paymentService = new PaymentService(
    mockEmailService,
    mockAuditLog,
    mockRetryQueue
  );
  
  const mockPayment = {
    id: 'tx-unavail-999',
    customerId: 'cust-456',
    amount: 75.00,
    customerEmail: 'customer@test.invalid',
    status: 'success',
    timestamp: Date.now()
  };
  
  // This should NOT throw
  const result = await paymentService.processPaymentResult(mockPayment);
  
  // Verify payment was processed successfully
  expect(result.success).toBe(true);
  expect(result.transactionId).toBe('tx-unavail-999');
  
  // Verify email failure was logged
  expect(mockAuditLog.logCalled).toBe(true);
  expect(mockAuditLog.lastLogEntry.event).toBe('email_delivery_failed');
  expect(mockAuditLog.lastLogEntry.transactionId).toBe('tx-unavail-999');
  
  // Verify email was queued for retry
  expect(mockRetryQueue.addedItems.length).toBe(1);
  expect(mockRetryQueue.addedItems[0].transactionId).toBe('tx-unavail-999');
  expect(mockRetryQueue.addedItems[0].customerEmail).toBe('customer@test.invalid');
});
```

**Expected to fail before implementation:** ✓

---

## Integration Tests

**Note:** All four ACs above are unit-testable with mocked dependencies. No separate integration tests are needed beyond the AC coverage. If a future story adds a real database or message queue, integration tests can be added then.

---

## NFR Tests

**NFR status:** None specified for this story. No NFR tests required.

---

## Gap Analysis

**No gaps identified.** All 4 ACs have corresponding unit tests with clear preconditions, actions, and expected results. Email service is mocked throughout to keep tests isolated.

---

---

# AC Verification Script — T1 Payment confirmation email

**Story:** Send payment confirmation email after successful transaction  
**Story ID:** PAY-3.1  
**Audience:** BA, QA, Product Owner, domain expert  
**Last updated:** 2026-05-15

---

## Test Environment Setup

Before running the scenarios below, ensure:

1. The payment service is deployed or running locally
2. The email service mock is in place (tests use `MockEmailService`)
3. Test database is clean (no prior test data)
4. Run command: `node tests/payment-email-confirmation.test.js`

---

## AC1: Confirmation email sent within 30 seconds on successful payment

**Scenario:** Process a successful payment and verify the confirmation email is sent quickly.

1. Initiate a payment transaction with amount $50.00
2. Mark the transaction as successfully completed
3. Wait up to 30 seconds
4. Check the email service logs: a confirmation email should have been sent to the customer's registered email address
5. Verify the email was sent as a "payment-confirmation" template

**Expected outcome:** Email delivery log shows one confirmation email sent to the customer within 30 seconds of the payment completion.

**Reset:** Clear test transaction records between runs.

---

## AC2: No email sent on failed payment; failure logged

**Scenario:** Process a failed payment and verify no email is sent, but the failure is recorded.

1. Initiate a payment transaction with amount $50.00
2. Mark the transaction as failed (e.g., insufficient funds)
3. Check the email service logs: no email should have been attempted
4. Check the payment audit log: a "payment_failed" entry should exist with the transaction reference

**Expected outcome:** 
- Email service logs show zero attempts for this transaction
- Audit log contains a failure record with the correct transaction ID and reason

**Reset:** Clear test transaction and audit records between runs.

---

## AC3: Email body contains required fields

**Scenario:** Verify a confirmation email contains all required information.

1. Process a successful payment for $99.99 at "shoe-store" merchant on 2026-05-15 at 14:30
2. Capture the confirmation email that was sent
3. Read the email body and verify it includes:
   - The transaction reference number (e.g., `ABC123`)
   - The payment amount (e.g., `$99.99`)
   - The merchant name (e.g., `shoe-store`)
   - The transaction date (e.g., `2026-05-15`)
   - The transaction time (e.g., `14:30`)

**Expected outcome:** All five pieces of information appear in the email body in a human-readable format.

**Reset:** Clear test records between runs.

---

## AC4: Email service unavailable; payment succeeds; email queued for retry

**Scenario:** Simulate a temporary email service outage and verify the payment still completes and the email is queued for later retry.

1. Stop or disable the email service (or configure it to throw an error)
2. Process a successful payment for $75.00
3. Observe the payment transaction completes successfully (customer sees confirmation on screen or receives transaction ID)
4. Check the payment audit log: an entry for "email_delivery_failed" should exist with the transaction reference
5. Check the email retry queue: one queued message should exist for this transaction, containing the customer email address

**Expected outcome:**
- Payment transaction is recorded as successful in the database
- Payment ID is returned to the customer or recorded in logs
- Audit log shows email delivery failure with correct transaction ID
- Retry queue contains exactly one entry for this transaction with correct customer email

**Reset:** Re-enable the email service after this test. Clear test records.

---

## Smoke Test Checklist

After deployment, run these steps in order:

- [ ] Process 5 successful payments and verify 5 confirmation emails are sent (within 30s each)
- [ ] Process 2 failed payments and verify 0 emails sent and failures logged
- [ ] Process 1 payment with email service temporarily down; verify payment succeeds, email queued
- [ ] Check payment audit log for: 5 successful, 2 failed, 1 retry-queued
- [ ] Open one confirmation email and verify it contains transaction reference, amount, merchant, date, time

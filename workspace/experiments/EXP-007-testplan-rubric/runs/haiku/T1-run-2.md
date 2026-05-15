# Test Plan — T1 Payment confirmation email (Trial 2)

**Story:** Send payment confirmation email after successful transaction  
**Story ID:** PAY-3.1  
**Test framework:** Node.js (scripts/check-*.js pattern)  
**Test runner command:** `node tests/payment-email.test.js`  
**Date written:** 2026-05-16  
**Trial:** 2

---

## Test Data Strategy

**Approach:** Synthetic, fully isolated — all payment objects and email delivery mocked via injectable adapter.

**Test data ownership:** Tests own all data generation. No external services, no real email addresses, no customer PII.

**Data sources:**
- Mock payment transactions: `{ txnId: 'TXN-TEST-001', amount: 49.99, merchant: 'Test Merchant', timestamp }`
- Mock customer emails: `customer-test-001@test.invalid`
- Mock transaction references: `REF-2026-05-16-T1-001`
- Stub email service: implements `EmailService` interface, captures email delivery calls

**Email isolation:** Tests inject a mock `EmailService` that records all `send()` calls without sending real SMTP messages. No external SMTP gateway is contacted during tests.

**No PII:** All email addresses and customer names are synthetic test-only identifiers.

---

## AC Coverage and Test Classification

| AC | Description | Test Type | Status |
|----|-------------|-----------|--------|
| AC1 | Success payment → confirmation email within 30s | Unit | Covered |
| AC2 | Failed payment → no email sent; logged to audit | Unit | Covered |
| AC3 | Email body contains tx ref, amount, merchant, timestamp | Unit | Covered |
| AC4 | Email service unavailable → payment succeeds; email queued for retry | Integration | Covered |

**Gap analysis:** No gaps. All 4 ACs have corresponding test entries.

---

## Unit Tests

### Test 1: AC1 — Payment success triggers confirmation email within 30 seconds

**Given:** A payment transaction completes successfully  
**When:** The payment service processes the transaction result  
**Then:** A confirmation email is sent to the customer's registered email address within 30 seconds

```javascript
// tests/payment-email.test.js
describe('Payment Confirmation Email', () => {
  
  test('AC1: should send confirmation email within 30s after successful payment', async () => {
    const mockEmailService = new MockEmailService();
    const paymentService = new PaymentService(mockEmailService);
    
    const payment = {
      transactionId: 'TXN-TEST-001',
      customerId: 'cust-123',
      email: 'customer-test-001@test.invalid',
      amount: 49.99,
      merchantName: 'Test Store',
      status: 'success',
      completedAt: Date.now()
    };
    
    const startTime = Date.now();
    await paymentService.completePayment(payment);
    const endTime = Date.now();
    
    // Verify email was sent (called on mock)
    expect(mockEmailService.sendCalled).toBe(true);
    expect(mockEmailService.sendCount).toBe(1);
    
    // Verify recipient is correct
    expect(mockEmailService.lastEmailRecipient).toBe('customer-test-001@test.invalid');
    
    // Verify timing: sent within 30 seconds
    expect(endTime - startTime).toBeLessThan(30000);
  });
  
});
```

**Expected to fail before implementation:** ✓

---

### Test 2: AC2 — Payment failure does NOT trigger email; logged to audit

**Given:** A payment transaction fails  
**When:** The payment service processes the failure  
**Then:** No confirmation email is sent and the failure is recorded in the payment audit log

```javascript
test('AC2: should NOT send email for failed payment; log to audit', async () => {
  const mockEmailService = new MockEmailService();
  const mockAuditLog = new MockAuditLog();
  const paymentService = new PaymentService(mockEmailService, mockAuditLog);
  
  const failedPayment = {
    transactionId: 'TXN-TEST-FAIL-002',
    customerId: 'cust-456',
    email: 'customer-test-002@test.invalid',
    amount: 99.99,
    merchantName: 'Test Store',
    status: 'failed',
    failureReason: 'card_declined',
    completedAt: Date.now()
  };
  
  await paymentService.completePayment(failedPayment);
  
  // Verify NO email was sent
  expect(mockEmailService.sendCalled).toBe(false);
  expect(mockEmailService.sendCount).toBe(0);
  
  // Verify failure was logged to audit log
  expect(mockAuditLog.logCount).toBe(1);
  const auditEntry = mockAuditLog.getLastEntry();
  expect(auditEntry.transactionId).toBe('TXN-TEST-FAIL-002');
  expect(auditEntry.eventType).toBe('payment_failed');
  expect(auditEntry.failureReason).toBe('card_declined');
});
```

**Expected to fail before implementation:** ✓

---

### Test 3: AC3 — Email body contains transaction reference, amount, merchant, timestamp

**Given:** A confirmation email is dispatched  
**When:** The email is delivered  
**Then:** The email body contains the transaction reference, payment amount, merchant name, and transaction date/time

```javascript
test('AC3: email body contains tx reference, amount, merchant, timestamp', async () => {
  const mockEmailService = new MockEmailService();
  const paymentService = new PaymentService(mockEmailService);
  
  const payment = {
    transactionId: 'TXN-TEST-003',
    customerId: 'cust-789',
    email: 'customer-test-003@test.invalid',
    amount: 199.99,
    merchantName: 'Premium Store',
    status: 'success',
    completedAt: new Date('2026-05-16T10:30:00Z')
  };
  
  await paymentService.completePayment(payment);
  
  // Retrieve the email that was "sent"
  const sentEmail = mockEmailService.lastEmailBody;
  
  // Verify all required fields are in email body
  expect(sentEmail).toContain('TXN-TEST-003'); // tx reference
  expect(sentEmail).toContain('199.99'); // amount
  expect(sentEmail).toContain('Premium Store'); // merchant
  expect(sentEmail).toMatch(/2026-05-16.*10:30/); // timestamp
});
```

**Expected to fail before implementation:** ✓

---

### Test 4: AC4 — Email service unavailable; payment succeeds; email queued for retry

**Given:** The email service is temporarily unavailable when a payment completes  
**When:** The payment service attempts to send the confirmation email  
**Then:** (4a) The payment transaction completes successfully, (4b) the email delivery failure is logged with the transaction reference, and (4c) the email is queued for retry

```javascript
test('AC4: email unavailable → payment succeeds; failure logged; email queued', async () => {
  const mockEmailService = new MockEmailService();
  mockEmailService.throwOnSend = new Error('Email service connection failed');
  
  const mockAuditLog = new MockAuditLog();
  const mockRetryQueue = new MockEmailRetryQueue();
  const paymentService = new PaymentService(mockEmailService, mockAuditLog, mockRetryQueue);
  
  const payment = {
    transactionId: 'TXN-TEST-RETRY-004',
    customerId: 'cust-retry-001',
    email: 'customer-retry@test.invalid',
    amount: 75.50,
    merchantName: 'Retry Test Store',
    status: 'success',
    completedAt: Date.now()
  };
  
  const result = await paymentService.completePayment(payment);
  
  // Verify payment still succeeded (4a)
  expect(result.paymentProcessed).toBe(true);
  expect(result.paymentSuccessful).toBe(true);
  expect(result.transactionId).toBe('TXN-TEST-RETRY-004');
  
  // Verify failure was logged (4b)
  expect(mockAuditLog.logCount).toBeGreaterThan(0);
  const failureLog = mockAuditLog.entries.find(e => e.eventType === 'email_delivery_failed');
  expect(failureLog).toBeDefined();
  expect(failureLog.transactionId).toBe('TXN-TEST-RETRY-004');
  
  // Verify email was queued for retry (4c)
  expect(mockRetryQueue.itemCount).toBe(1);
  const queuedEmail = mockRetryQueue.getItem(0);
  expect(queuedEmail.recipient).toBe('customer-retry@test.invalid');
  expect(queuedEmail.transactionId).toBe('TXN-TEST-RETRY-004');
});
```

**Expected to fail before implementation:** ✓

---

## Gap Analysis

**No gaps identified.** All 4 ACs have unit tests with complete test bodies. Test data is synthetic and fully mocked. Email service unavailability is tested with proper success/failure/queueing verification.

---

---

# AC Verification Script — T1 Payment confirmation email

**Story:** Send payment confirmation email after successful transaction  
**Story ID:** PAY-3.1  
**Audience:** Customer Support, QA, Business Owner  
**Last updated:** 2026-05-16  
**Trial:** 2

---

## Test Environment Setup

Before running the scenarios below:

1. Payment service is running or deployed locally
2. Email service integration is configured (or mocked for test environment)
3. Test database is accessible
4. Run tests: `node tests/payment-email.test.js`

---

## AC1: Payment success sends confirmation email within 30 seconds

**Scenario:** Complete a payment and verify a confirmation email is received within 30 seconds.

1. Complete a payment transaction (via payment page or API) for amount $49.99
2. Record the transaction reference returned (e.g., `TXN-2026-05-16-001`)
3. Check your test email inbox (registered email address for the test account)
4. Verify an email arrives **within 30 seconds** of payment completion with:
   - Subject line containing "Payment Confirmation" or "Transaction Confirmed"
   - Email is from the application's email address (e.g., `payments@app.invalid`)
   - Email has been delivered (not in spam folder)
5. Open the email and note its arrival time

**Expected outcome:** Confirmation email arrives in your inbox within 30 seconds of pressing "Complete Payment".

**Reset:** Delete the email and clear email history.

---

## AC2: Failed payment does NOT send email; logged to audit

**Scenario:** Attempt a failed payment and verify no confirmation email is sent.

1. Navigate to payment page
2. Enter a **test card that will be declined** (check with QA/payment provider for test card)
3. Attempt to complete the payment
4. Observe: You receive a failure message on screen (e.g., "Card declined")
5. Check your test email inbox
6. Verify **NO confirmation email arrives**
7. (Optional) Ask a developer to check the audit log and confirm an entry exists with event type `payment_failed`

**Expected outcome:** No confirmation email is sent for failed transactions. You remain in the application and can retry with different card details.

**Reset:** N/A (no email to delete).

---

## AC3: Confirmation email contains transaction reference, amount, merchant, date/time

**Scenario:** Receive a confirmation email and verify all required information is present.

1. Complete a successful payment for amount $199.99
2. Receive the confirmation email (as per AC1)
3. Open the email and verify it contains:
   - **Transaction reference:** A unique ID (e.g., `TXN-2026-05-16-CUST-001` or similar) — you can reference this for support
   - **Payment amount:** "$199.99" (exactly matching your payment)
   - **Merchant name:** The store or application name (e.g., "Online Store" or "Premium Store")
   - **Date and time:** The exact date and time the payment was processed (e.g., "May 16, 2026 at 10:30 AM UTC")
4. Verify the format is readable and clearly displays each field

**Expected outcome:** Email contains all 4 required fields (reference, amount, merchant, date/time) in a clear, readable format.

**Reset:** Delete email.

---

## AC4: Email service unavailable; payment still succeeds; email queued for retry

**Scenario:** Simulate email service outage and verify payment still completes.

**Note:** This scenario requires either:
- Coordinating with your infrastructure team to temporarily disable the email service, OR
- Running in a test environment where email service can be disabled, OR
- Having a developer manually trigger an email service failure in a test run

**Steps:**

1. Disable or stop the email service (work with operations or a developer)
2. Complete a payment transaction for $75.50
3. Observe the result:
   - You receive a **success message** on the payment confirmation page (payment is NOT blocked)
   - Transaction reference is provided (e.g., `TXN-RETRY-OUTAGE-001`)
   - Payment is recorded in your account as successful
4. Wait 5–10 seconds
5. **Re-enable** the email service
6. Wait another 30–60 seconds for the email retry mechanism to execute
7. Check your test email inbox:
   - Confirmation email **should arrive** (now that the email service is back up)
   - Email contains the transaction reference from step 2

**Expected outcome:**
- Payment completes successfully despite email service being down
- Email is automatically queued and retried
- Once the email service is available again, the email is delivered
- You receive the confirmation email

**Reset:** Clear email inbox and ensure email service is enabled.

---

## Smoke Test Checklist (Post-Deployment)

- [ ] Process 3 successful payments and verify confirmation emails arrive within 30s
- [ ] Process 1 failed payment (declined card) and verify NO email is sent
- [ ] Open one confirmation email and verify it contains: tx reference, amount, merchant, date/time
- [ ] (Optional) Trigger email service failure, complete payment, verify it succeeds and email retries when service is restored
- [ ] Verify confirmation emails go to the correct customer email address (not a generic inbox)
- [ ] Verify payment records in the system show emails were sent successfully

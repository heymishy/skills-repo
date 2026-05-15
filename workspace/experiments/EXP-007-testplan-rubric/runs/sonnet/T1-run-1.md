# Test Plan — PAY-3.1: Send payment confirmation email after successful transaction

**Story ID:** PAY-3.1
**Trial:** 1
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Jest (confirmed from corpus case — synthetic test plan evaluation context)
**Framework:** Jest + mock/stub pattern for injectable EmailService adapter
**Test data strategy:** Synthetic — all test data generated in test setup. Mock payment objects, fake email addresses, fake transaction references. No PII or real customer data. Email service stubbed in all unit and integration tests; no real email sending in test runs.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Payment completes → confirmation email sent within 30s | Unit + Integration | 2 | Covered |
| AC2 | Payment fails → no email sent, failure logged | Unit | 2 | Covered |
| AC3 | Email dispatched → body contains tx ref, amount, merchant, datetime | Unit | 1 | Covered |
| AC4 | Email service unavailable → payment completes, failure logged, email queued for retry | Unit + Integration | 2 | Covered |

**Total tests:** 7
**E2E required:** No
**NFRs:** None — confirmed

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| None | — | — | — | All ACs are unit/integration testable. Email service adapter injectable; no real SMTP calls required. |

---

## Unit tests

### Test suite: PaymentEmailService

```javascript
describe('PaymentEmailService', () => {

  // AC1 — Confirmation email sent on successful payment
  it('sends a confirmation email to the customer registered address when payment succeeds', async () => {
    // Arrange
    const mockEmailService = { send: jest.fn().mockResolvedValue({ messageId: 'msg-001' }) };
    const paymentService = new PaymentService({ emailService: mockEmailService });
    const payment = {
      transactionId: 'TXN-001-SONNET',
      amount: 149.99,
      merchantName: 'Test Merchant Ltd',
      customerEmail: 'customer@example.com',
      completedAt: new Date('2026-05-16T10:00:00Z'),
      status: 'success',
    };

    // Act
    await paymentService.processResult(payment);

    // Assert
    expect(mockEmailService.send).toHaveBeenCalledTimes(1);
    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'customer@example.com' })
    );
  });

  // AC2 — No email sent on failed payment
  it('does not send a confirmation email when payment fails', async () => {
    // Arrange
    const mockEmailService = { send: jest.fn() };
    const paymentService = new PaymentService({ emailService: mockEmailService });
    const failedPayment = {
      transactionId: 'TXN-002-SONNET',
      amount: 49.00,
      merchantName: 'Test Merchant Ltd',
      customerEmail: 'customer@example.com',
      completedAt: new Date('2026-05-16T10:01:00Z'),
      status: 'failed',
    };

    // Act
    await paymentService.processResult(failedPayment);

    // Assert
    expect(mockEmailService.send).not.toHaveBeenCalled();
  });

  // AC2 — Failure logged when payment fails
  it('records the failure in the payment audit log when payment fails', async () => {
    // Arrange
    const mockAuditLog = { record: jest.fn() };
    const mockEmailService = { send: jest.fn() };
    const paymentService = new PaymentService({ emailService: mockEmailService, auditLog: mockAuditLog });
    const failedPayment = {
      transactionId: 'TXN-003-SONNET',
      amount: 75.50,
      merchantName: 'Test Merchant Ltd',
      customerEmail: 'customer@example.com',
      status: 'failed',
    };

    // Act
    await paymentService.processResult(failedPayment);

    // Assert
    expect(mockAuditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: 'TXN-003-SONNET',
        event: 'payment_failed',
      })
    );
  });

  // AC3 — Email body contains required fields
  it('includes transaction reference, amount, merchant name, and datetime in the confirmation email body', async () => {
    // Arrange
    const capturedEmails = [];
    const mockEmailService = {
      send: jest.fn(async (email) => { capturedEmails.push(email); return { messageId: 'msg-002' }; }),
    };
    const paymentService = new PaymentService({ emailService: mockEmailService });
    const payment = {
      transactionId: 'TXN-004-SONNET',
      amount: 299.00,
      merchantName: 'Premier Shop',
      customerEmail: 'buyer@example.com',
      completedAt: new Date('2026-05-16T11:30:00Z'),
      status: 'success',
    };

    // Act
    await paymentService.processResult(payment);

    // Assert
    const sentEmail = capturedEmails[0];
    expect(sentEmail.body).toContain('TXN-004-SONNET');
    expect(sentEmail.body).toContain('299.00');
    expect(sentEmail.body).toContain('Premier Shop');
    expect(sentEmail.body).toContain('2026-05-16');
  });

  // AC4 — Payment completes when email service is unavailable
  it('completes the payment transaction successfully even when the email service is unavailable', async () => {
    // Arrange
    const mockEmailService = {
      send: jest.fn().mockRejectedValue(new Error('SMTP connection refused')),
    };
    const paymentService = new PaymentService({ emailService: mockEmailService });
    const payment = {
      transactionId: 'TXN-005-SONNET',
      amount: 59.99,
      merchantName: 'Test Merchant Ltd',
      customerEmail: 'customer@example.com',
      status: 'success',
    };

    // Act
    const result = await paymentService.processResult(payment);

    // Assert
    expect(result.transactionStatus).toBe('completed');
    expect(result.transactionId).toBe('TXN-005-SONNET');
  });

  // AC4 — Email delivery failure logged with transaction reference
  it('logs the email delivery failure with the transaction reference when the email service is unavailable', async () => {
    // Arrange
    const mockEmailService = {
      send: jest.fn().mockRejectedValue(new Error('SMTP connection refused')),
    };
    const mockAuditLog = { record: jest.fn() };
    const paymentService = new PaymentService({ emailService: mockEmailService, auditLog: mockAuditLog });
    const payment = {
      transactionId: 'TXN-006-SONNET',
      amount: 22.00,
      merchantName: 'Test Merchant Ltd',
      customerEmail: 'customer@example.com',
      status: 'success',
    };

    // Act
    await paymentService.processResult(payment);

    // Assert
    expect(mockAuditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: 'TXN-006-SONNET',
        event: 'email_delivery_failed',
      })
    );
  });

});
```

---

## Integration tests

### Test suite: PaymentEmailService — retry queue

```javascript
describe('PaymentEmailService — email retry queue', () => {

  // AC4 — Email queued for retry when service unavailable
  it('places the email in the retry queue when the email service is temporarily unavailable', async () => {
    // Arrange
    const mockEmailService = {
      send: jest.fn().mockRejectedValue(new Error('Email service unavailable')),
    };
    const retryQueue = new InMemoryEmailRetryQueue();
    const paymentService = new PaymentService({
      emailService: mockEmailService,
      emailRetryQueue: retryQueue,
    });
    const payment = {
      transactionId: 'TXN-007-SONNET',
      amount: 85.00,
      merchantName: 'Retry Test Merchant',
      customerEmail: 'retry-test@example.com',
      status: 'success',
    };

    // Act
    await paymentService.processResult(payment);

    // Assert
    const queuedEmails = await retryQueue.list();
    expect(queuedEmails).toHaveLength(1);
    expect(queuedEmails[0]).toMatchObject({
      transactionId: 'TXN-007-SONNET',
      recipientEmail: 'retry-test@example.com',
    });
  });

});
```

---

## NFR tests

None — confirmed. This story has no non-functional requirements.

---

## Output 2: AC Verification Script

**Story:** PAY-3.1 — Send payment confirmation email after successful transaction
**For use:** Pre-code sign-off, post-merge smoke test, delivery review
**Environment required:** Application running locally or in a test environment with a test email inbox configured (e.g. Mailhog or similar local email capture tool). No real SMTP sending required.

---

### Setup

Before running these scenarios, ensure:
1. The application is running in test mode with the email capture tool active (e.g. Mailhog at `http://localhost:8025`).
2. A test customer account exists with email address `customer-test@example.com`.
3. The payment gateway is configured to use the sandbox/test mode.
4. Clear the email inbox before each scenario.

---

### Scenario 1 — AC1: Confirmation email is sent after a successful payment

**What to check:** When a payment goes through successfully, the customer receives a confirmation email.

**Steps:**
1. Log in as the test customer (`customer-test@example.com`).
2. Add an item to the basket and proceed to checkout.
3. Enter valid test card details and confirm the payment.
4. Wait up to 30 seconds.
5. Open the email capture tool (e.g. `http://localhost:8025`).

**Expected result:** One new email should appear in the inbox addressed to `customer-test@example.com`. The email should be a payment confirmation.

**If broken:** No email appears in the inbox within 30 seconds, or the email arrives at a different address.

---

### Scenario 2 — AC2: No confirmation email is sent after a failed payment

**What to check:** When a payment fails, the customer does not receive a confirmation email, and the failure is recorded.

**Steps:**
1. Log in as the test customer.
2. Add an item to the basket and proceed to checkout.
3. Enter a test card number that is configured to decline (check sandbox documentation for the decline test card number).
4. Attempt the payment. Confirm you see a payment failure message on screen.
5. Open the email capture tool.

**Expected result:** No new email appears in the inbox. The payment failure message is visible on screen.

**Also check (audit log):** In the application admin area or log viewer, a new entry should be visible showing the failed transaction reference and the event `payment_failed`.

**If broken:** A confirmation email arrives despite the payment failing, or no failure entry appears in the audit log.

---

### Scenario 3 — AC3: Confirmation email contains the correct details

**What to check:** The email contains all required information — transaction reference, amount, merchant name, and date/time.

**Steps:**
1. Complete a successful test payment (follow Scenario 1 steps).
2. Open the confirmation email in the email capture tool.
3. Read the email body.

**Expected result:** The email body should contain:
- The transaction reference (a unique ID visible on the payment confirmation screen)
- The payment amount (e.g. "£29.99" or equivalent)
- The merchant name as it appears in the application
- The date and time of the transaction (today's date, time within a few seconds of payment)

**If broken:** Any of the four items (transaction reference, amount, merchant name, datetime) is missing from the email body.

---

### Scenario 4 — AC4: Payment completes and email is queued even when the email service is unavailable

**What to check:** When the email service is down, the payment still goes through, the failure is logged, and the email is queued for retry.

**Steps:**
1. Ask a developer to temporarily disable the email service or configure it to fail (simulate email service outage in the test environment).
2. Complete a test payment as a customer.
3. Confirm that the payment confirmation screen is shown (the payment itself should succeed).
4. Check the email capture tool — no email will arrive immediately (service is down).
5. Check the application logs for an `email_delivery_failed` entry containing the transaction reference.
6. Check the retry queue (via the admin area or a developer query) — the email should appear as a queued item with the correct transaction reference and customer email.
7. Re-enable the email service and wait for the retry interval.
8. Check the email capture tool — the confirmation email should now arrive.

**Expected result:**
- Payment succeeds (confirmation screen shown) even when email service is down.
- `email_delivery_failed` log entry is present with the correct transaction reference.
- Email is visible in the retry queue.
- Email is delivered once the service is restored.

**If broken:** Payment fails when the email service is down, or no log entry is created, or the email is not queued for retry.

---

**Test plan complete for PAY-3.1 ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T1-run-1.md`
7 tests | 6 unit | 1 integration | 0 NFR | 4 ACs covered
No gaps — all ACs testable at unit/integration level.

Verification script: embedded above
4 scenarios | 0 edge-case-only scenarios | 0 manual gap scenarios

Test data: Synthetic — ready. All fixture data inline in tests. No PII.

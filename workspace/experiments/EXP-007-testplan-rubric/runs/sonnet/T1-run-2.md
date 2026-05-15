# Test Plan — PAY-3.1: Send payment confirmation email after successful transaction

**Story ID:** PAY-3.1
**Trial:** 2
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Jest (confirmed from corpus case — synthetic test plan evaluation context)
**Framework:** Jest + mock/stub pattern for injectable EmailService adapter
**Test data strategy:** Synthetic — all test data generated in test setup. Mock payment objects, fake email addresses, fake transaction references. No PII or real customer data. Email service is injected via adapter interface and is stubbed/mocked in all tests. No real SMTP communication in test runs.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Payment completes successfully → confirmation email sent to customer's registered address | Unit | 1 | Covered |
| AC2 | Payment fails → no confirmation email, failure recorded in audit log | Unit | 2 | Covered |
| AC3 | Email dispatched → body contains transaction reference, amount, merchant name, datetime | Unit | 1 | Covered |
| AC4 | Email service unavailable → payment completes, delivery failure logged with tx ref, email queued for retry | Unit + Integration | 2 | Covered |

**Total tests:** 6
**E2E required:** No
**NFRs:** None — confirmed

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| None | — | — | — | All 4 ACs testable at unit/integration level using the injectable EmailService adapter. No real SMTP calls needed. |

---

## Unit tests

### Test suite: PaymentNotificationService

```javascript
describe('PaymentNotificationService', () => {

  // AC1 — Email dispatched to registered address on successful payment
  it('dispatches a confirmation email to the customer registered email address when payment completes successfully', async () => {
    // Arrange
    const mockEmailAdapter = { dispatch: jest.fn().mockResolvedValue({ messageId: 'msg-s2t1-001' }) };
    const notificationService = new PaymentNotificationService({ emailAdapter: mockEmailAdapter });
    const successfulPayment = {
      transactionId: 'TXN-S2-PAY-001',
      amount: 209.50,
      merchantName: 'Premier Goods Ltd',
      customerEmail: 'shopper@domain.com',
      completedAt: new Date('2026-05-16T14:00:00Z'),
      status: 'success',
    };

    // Act
    await notificationService.handlePaymentResult(successfulPayment);

    // Assert
    expect(mockEmailAdapter.dispatch).toHaveBeenCalledTimes(1);
    expect(mockEmailAdapter.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'shopper@domain.com' })
    );
  });

  // AC2 — No email dispatched on failed payment
  it('does not dispatch a confirmation email when the payment fails', async () => {
    // Arrange
    const mockEmailAdapter = { dispatch: jest.fn() };
    const notificationService = new PaymentNotificationService({ emailAdapter: mockEmailAdapter });
    const failedPayment = {
      transactionId: 'TXN-S2-PAY-002',
      amount: 45.00,
      merchantName: 'Premier Goods Ltd',
      customerEmail: 'shopper@domain.com',
      status: 'failed',
    };

    // Act
    await notificationService.handlePaymentResult(failedPayment);

    // Assert
    expect(mockEmailAdapter.dispatch).not.toHaveBeenCalled();
  });

  // AC2 — Failure recorded in payment audit log
  it('records a failure entry in the payment audit log when the payment fails', async () => {
    // Arrange
    const mockEmailAdapter = { dispatch: jest.fn() };
    const mockAuditLog = { write: jest.fn() };
    const notificationService = new PaymentNotificationService({
      emailAdapter: mockEmailAdapter,
      auditLog: mockAuditLog,
    });
    const failedPayment = {
      transactionId: 'TXN-S2-PAY-003',
      amount: 99.00,
      merchantName: 'Premier Goods Ltd',
      customerEmail: 'shopper@domain.com',
      status: 'failed',
    };

    // Act
    await notificationService.handlePaymentResult(failedPayment);

    // Assert
    expect(mockAuditLog.write).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: 'TXN-S2-PAY-003',
        type: 'payment_failed',
      })
    );
  });

  // AC3 — Email body contains all required fields
  it('includes the transaction reference, amount, merchant name, and transaction datetime in the email body', async () => {
    // Arrange
    const dispatchedEmails = [];
    const mockEmailAdapter = {
      dispatch: jest.fn(async (email) => {
        dispatchedEmails.push(email);
        return { messageId: 'msg-s2t1-002' };
      }),
    };
    const notificationService = new PaymentNotificationService({ emailAdapter: mockEmailAdapter });
    const payment = {
      transactionId: 'TXN-S2-PAY-004',
      amount: 512.00,
      merchantName: 'Apex Supplies',
      customerEmail: 'corporate@business.org',
      completedAt: new Date('2026-05-16T15:30:00Z'),
      status: 'success',
    };

    // Act
    await notificationService.handlePaymentResult(payment);

    // Assert — all four required fields present in email body
    const emailBody = dispatchedEmails[0].body;
    expect(emailBody).toContain('TXN-S2-PAY-004');
    expect(emailBody).toContain('512.00');
    expect(emailBody).toContain('Apex Supplies');
    expect(emailBody).toContain('2026-05-16');
    expect(emailBody).toContain('15:30');
  });

  // AC4 — Payment transaction completes successfully when email service unavailable
  it('reports the payment transaction as completed even when the email adapter throws an error', async () => {
    // Arrange
    const mockEmailAdapter = {
      dispatch: jest.fn().mockRejectedValue(new Error('Connection refused: email gateway')),
    };
    const mockRetryQueue = { enqueue: jest.fn().mockResolvedValue({}) };
    const notificationService = new PaymentNotificationService({
      emailAdapter: mockEmailAdapter,
      emailRetryQueue: mockRetryQueue,
    });
    const payment = {
      transactionId: 'TXN-S2-PAY-005',
      amount: 33.00,
      merchantName: 'Corner Shop',
      customerEmail: 'buyer@personal.net',
      status: 'success',
    };

    // Act
    const result = await notificationService.handlePaymentResult(payment);

    // Assert — payment outcome is not affected by email failure
    expect(result.paymentStatus).toBe('completed');
    expect(result.transactionId).toBe('TXN-S2-PAY-005');
  });

});
```

---

## Integration tests

### Test suite: PaymentNotificationService — email retry queue

```javascript
describe('PaymentNotificationService — retry queue integration', () => {

  // AC4 — Email queued for retry with correct transaction reference
  it('enqueues the email with the transaction reference in the retry queue when the email service is unavailable', async () => {
    // Arrange
    const mockEmailAdapter = {
      dispatch: jest.fn().mockRejectedValue(new Error('Email service down')),
    };
    const retryQueue = new InMemoryEmailRetryQueue();
    const notificationService = new PaymentNotificationService({
      emailAdapter: mockEmailAdapter,
      emailRetryQueue: retryQueue,
    });
    const payment = {
      transactionId: 'TXN-S2-PAY-006',
      amount: 67.50,
      merchantName: 'Retry Store',
      customerEmail: 'retry-customer@example.net',
      status: 'success',
    };

    // Act
    await notificationService.handlePaymentResult(payment);

    // Assert
    const queued = await retryQueue.list();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({
      transactionId: 'TXN-S2-PAY-006',
      recipientEmail: 'retry-customer@example.net',
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
**Environment required:** Application running in test mode with an email capture tool active (e.g. Mailhog or equivalent local inbox). Payment gateway in sandbox mode.

---

### Setup

Before running these scenarios:
1. Start the application in test mode with email capture enabled (e.g. Mailhog at `http://localhost:8025`).
2. Create a test customer account with email `test-recipient@verify.example`.
3. Confirm the payment gateway is in sandbox/test mode (no real charges).
4. Clear the email capture inbox before each scenario.

---

### Scenario 1 — AC1: A confirmation email arrives after a successful payment

**What to check:** When a payment goes through, the customer receives a confirmation email within 30 seconds.

**Steps:**
1. Log in as the test customer (`test-recipient@verify.example`).
2. Add a product to the basket and go to checkout.
3. Enter valid test card details and confirm the payment.
4. Wait up to 30 seconds.
5. Check the email capture inbox (`http://localhost:8025` or equivalent).

**Expected result:** One new email appears addressed to `test-recipient@verify.example`. The email is a payment confirmation.

**If broken:** No email appears within 30 seconds, or the email is sent to the wrong address.

---

### Scenario 2 — AC2: No email is sent after a failed payment, and the failure is logged

**What to check:** A declined payment does not trigger a confirmation email, and the failure is recorded in the system.

**Steps:**
1. Log in as the test customer.
2. Add a product and go to checkout.
3. Enter a test card number configured to decline (see sandbox documentation for the declined-card test number).
4. Confirm the payment and observe the on-screen failure message.
5. Check the email capture inbox.

**Expected result:** No new email appears. The failure message is shown on screen.

**Audit log check:** In the admin panel or developer log view, a `payment_failed` entry should be visible for the transaction reference shown on the failure screen.

**If broken:** A confirmation email is sent despite the payment failing, or no `payment_failed` entry appears in the audit log.

---

### Scenario 3 — AC3: The confirmation email contains all required details

**What to check:** The email body includes the transaction reference, amount, merchant name, and the date and time of the transaction.

**Steps:**
1. Complete a successful test payment (follow Scenario 1).
2. Open the confirmation email in the email capture inbox.
3. Read the email body carefully.

**Expected result:** The email body clearly shows:
- The transaction reference (same ID shown on the confirmation screen)
- The payment amount (matching the basket total)
- The merchant / shop name as it appears in the application
- The date and time of the transaction (today's date, correct time within a few seconds)

**If broken:** Any one of the four items is missing — the transaction reference, amount, merchant name, or datetime is absent from the email body.

---

### Scenario 4 — AC4: Payment succeeds and email is retried when the email service is down

**What to check:** If the email delivery service is temporarily unavailable, the payment still completes, the failure is logged, and the email is queued and sent once the service recovers.

**Steps (developer involvement required):**
1. Ask a developer to simulate an email service outage (disable the email gateway in the test environment).
2. Complete a test payment as the test customer.
3. Confirm the payment confirmation screen is shown (the payment must succeed).
4. Check the email capture inbox — no email will arrive immediately.
5. Ask the developer to check the email retry queue (admin panel or direct query) — the email should be queued with the correct transaction reference.
6. Ask the developer to check the application logs for an `email_delivery_failed` entry with the transaction reference.
7. Ask the developer to restore the email service.
8. Wait for the retry to run.
9. Check the email capture inbox — the confirmation email should now arrive.

**Expected result:**
- Payment confirmation screen is shown (payment succeeds despite email outage).
- Email appears in the retry queue with correct transaction reference.
- `email_delivery_failed` log entry exists with the transaction reference.
- Email is delivered after the service is restored.

**If broken:** Payment fails when email service is down, or email is not queued, or email is never retried after service recovery.

---

**Test plan complete for PAY-3.1 (Trial 2) ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T1-run-2.md`
6 tests | 5 unit | 1 integration | 0 NFR | 4 ACs covered
No gaps — all 4 ACs testable at unit/integration level via injectable email adapter.

Verification script: embedded above
4 scenarios | 0 manual gap scenarios | 0 layout-dependent scenarios

Test data: Synthetic — ready. All fixture data inline. No PII. Distinct transaction IDs from Trial 1.

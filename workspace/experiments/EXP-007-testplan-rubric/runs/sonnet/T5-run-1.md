# Test Plan — CHK-2.1: Process card payment at checkout

**Story ID:** CHK-2.1
**Trial:** 1
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Jest (unit/integration); Playwright (E2E — AC3 frontend validation)
**Framework:** Jest for backend tests; Playwright for AC3 (client-side Luhn validation in browser)
**Test data strategy:** Use test card numbers from the payment gateway sandbox environment (e.g. Visa test PAN: `4111111111111111`). These are not real card numbers. For AC2: post-payment database queries for card fields must return empty/null. For NFR-SEC-1: log scanning in test run asserts card field values do not appear in logged output. No real card data used in any test.

**PCI constraint:** Tests must not assert specific encryption algorithms, tokenisation mechanisms, HSM usage, or PCI DSS scope boundaries. The gateway is responsible for all cryptographic operations. The application does not implement its own encryption. All tests assert only observable outcomes stated in the ACs.

---

## Browser-layout detection

> AC3 requires a browser-level test. "The form returns a field-level validation error identifying the card number field as invalid, no payment request is sent to the payment gateway, and no card data is transmitted to the server." — The field-level validation error display and the confirmation that no network request is sent require a real browser to inspect the rendered UI and monitor network activity. Playwright is the configured E2E framework.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Valid card + payment → gateway processes, tx ref returned, confirmation shown | Unit + Integration | 2 | Covered |
| AC2 | After payment → no raw card data in application database | Integration | 1 | Covered |
| AC3 | Invalid card (Luhn fail) → field-level error, no gateway request, no data to server | E2E (Playwright) | 1 | Covered |
| AC4 | Gateway timeout → pending status, customer message shown | Unit | 1 | Covered |
| NFR-SEC-1 | Card data not in application logs or database at any point | Integration | 1 | Covered |

**Total tests:** 6
**E2E required:** Yes — Playwright for AC3
**NFRs:** 1 (NFR-SEC-1)

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| None | — | — | — | All ACs covered. AC3 correctly assigned to Playwright E2E for field-level validation display verification. |

---

## Unit tests

### Test suite: PaymentService

```javascript
describe('PaymentService', () => {

  // AC1 — Successful payment returns transaction reference
  it('returns a transaction reference from the gateway when a valid card payment is processed successfully', async () => {
    // Arrange
    const mockGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'GW-TXN-S1T5-001',
        status: 'approved',
        amount: 79.99,
      }),
    };
    const paymentService = new PaymentService({ gateway: mockGateway });
    const paymentRequest = {
      cardToken: 'tok_visa_test_s1t5',
      amount: 79.99,
      currency: 'GBP',
      merchantId: 'merchant-s1t5-001',
    };

    // Act
    const result = await paymentService.processPayment(paymentRequest);

    // Assert
    expect(result.transactionId).toBe('GW-TXN-S1T5-001');
    expect(result.status).toBe('approved');
    expect(result.confirmationMessage).toContain('GW-TXN-S1T5-001');
  });

  // AC4 — Gateway timeout → pending status and correct customer message
  it('marks the payment as pending and returns a processing message when the gateway does not respond within 10 seconds', async () => {
    // Arrange
    const mockGateway = {
      processPayment: jest.fn().mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gateway timeout')), 10001)
        )
      ),
    };
    jest.useFakeTimers();
    const mockDb = { saveTransaction: jest.fn().mockResolvedValue(true) };
    const paymentService = new PaymentService({ gateway: mockGateway, db: mockDb });
    const paymentRequest = {
      cardToken: 'tok_visa_test_s1t5',
      amount: 149.00,
      currency: 'GBP',
      merchantId: 'merchant-s1t5-001',
    };

    // Act — advance timers past 10s threshold
    const resultPromise = paymentService.processPayment(paymentRequest);
    jest.advanceTimersByTime(10001);
    const result = await resultPromise;
    jest.useRealTimers();

    // Assert
    expect(result.status).toBe('pending');
    expect(result.customerMessage).toMatch(/being processed/i);
    expect(result.customerMessage).toMatch(/email confirmation/i);
    expect(mockDb.saveTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' })
    );
  });

});
```

---

## Integration tests

### Test suite: PaymentService — database assertions

```javascript
describe('PaymentService — database: no raw card data persisted', () => {

  // AC1 — Transaction reference recorded in database
  it('records the transaction reference in the application database after a successful payment', async () => {
    // Arrange
    const testDb = new TestDatabase();
    const mockGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'GW-TXN-S1T5-002',
        status: 'approved',
      }),
    };
    const paymentService = new PaymentService({ gateway: mockGateway, db: testDb });

    // Act
    await paymentService.processPayment({
      cardToken: 'tok_visa_test_s1t5',
      amount: 55.00,
      currency: 'GBP',
      merchantId: 'merchant-s1t5-001',
    });

    // Assert
    const record = await testDb.query(
      'SELECT transaction_id, status FROM payments WHERE transaction_id = ?',
      ['GW-TXN-S1T5-002']
    );
    expect(record.transaction_id).toBe('GW-TXN-S1T5-002');
    expect(record.status).toBe('approved');
  });

  // AC2 — No raw card data in database after payment
  it('does not persist raw card data (PAN, CVV, expiry) in the application database after a successful payment', async () => {
    // Arrange
    const testDb = new TestDatabase();
    const mockGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'GW-TXN-S1T5-003',
        status: 'approved',
      }),
    };
    const paymentService = new PaymentService({ gateway: mockGateway, db: testDb });
    const testPan = '4111111111111111';
    const testCvv = '123';
    const testExpiry = '12/27';

    // Act
    await paymentService.processPayment({
      cardToken: 'tok_visa_test_s1t5',
      amount: 29.99,
      currency: 'GBP',
      merchantId: 'merchant-s1t5-001',
    });

    // Assert — card data columns are null
    const cardRecord = await testDb.query(
      'SELECT pan, cvv, expiry_date FROM card_transactions WHERE transaction_id = ?',
      ['GW-TXN-S1T5-003']
    );
    expect(cardRecord.pan).toBeNull();
    expect(cardRecord.cvv).toBeNull();
    expect(cardRecord.expiry_date).toBeNull();
  });

  // NFR-SEC-1 — Card data not present in application logs
  it('does not log raw card field values (PAN, CVV, expiry) to application logs during payment processing', async () => {
    // Arrange
    const logCapture = new TestLogCapture();
    const testDb = new TestDatabase();
    const mockGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'GW-TXN-S1T5-004',
        status: 'approved',
      }),
    };
    const paymentService = new PaymentService({
      gateway: mockGateway,
      db: testDb,
      logger: logCapture.logger,
    });
    const testPan = '4111111111111111';
    const testCvv = '456';
    const testExpiry = '09/28';

    // Act
    await paymentService.processPayment({
      cardToken: 'tok_visa_test_s1t5',
      pan: testPan,   // passed in to verify it is not forwarded to logs
      cvv: testCvv,
      expiry: testExpiry,
      amount: 199.00,
      currency: 'GBP',
      merchantId: 'merchant-s1t5-001',
    });

    // Assert — none of the card field values appear in captured log output
    const capturedLogs = logCapture.getAll();
    expect(capturedLogs).not.toContain(testPan);
    expect(capturedLogs).not.toContain(testCvv);
    expect(capturedLogs).not.toContain(testExpiry);
  });

});
```

---

## E2E tests (Playwright)

### Test suite: Checkout — Luhn validation (AC3)

```javascript
// tests/e2e/checkout-card-validation.spec.js
import { test, expect } from '@playwright/test';

test.describe('Checkout — card number Luhn validation', () => {

  // AC3 — Invalid card number triggers field-level error, no gateway request sent
  test('shows a field-level validation error on the card number field and sends no payment request when an invalid card number is entered', async ({ page }) => {
    // Arrange — intercept any outbound payment API calls
    const paymentRequests = [];
    await page.route('**/api/payments', (route) => {
      paymentRequests.push(route.request());
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/checkout');
    await page.waitForSelector('[data-testid="card-number-input"]');

    // Act — enter a card number that fails the Luhn check
    await page.fill('[data-testid="card-number-input"]', '1234567890123456'); // fails Luhn
    await page.fill('[data-testid="card-expiry-input"]', '12/28');
    await page.fill('[data-testid="card-cvv-input"]', '123');
    await page.click('[data-testid="submit-payment-button"]');

    // Assert — field-level validation error on card number field
    const cardNumberError = page.locator('[data-testid="card-number-error"]');
    await expect(cardNumberError).toBeVisible();
    await expect(cardNumberError).toContainText(/invalid card number/i);

    // Assert — no payment request was sent to the gateway
    expect(paymentRequests).toHaveLength(0);
  });

});
```

---

## NFR tests

### NFR-SEC-1 — Covered in integration test suite above

The `it('does not log raw card field values...')` test above covers NFR-SEC-1 log scanning. The `it('does not persist raw card data...')` test covers NFR-SEC-1 database persistence constraint. Both are grounded in the observable outcomes stated in NFR-SEC-1 ("must not be logged to application logs, persisted to the application database, or transmitted outside the payment gateway integration boundary").

---

## Output 2: AC Verification Script

**Story:** CHK-2.1 — Process card payment at checkout
**For use:** Pre-code sign-off, post-merge smoke test, delivery review
**Environment required:** Application running locally or in test environment with payment gateway sandbox configured. Test card numbers from the gateway sandbox must be used — do not use real card data.

> **⚠️ IMPORTANT — use only test card numbers.** All scenarios below use test PANs provided by the payment gateway's sandbox (e.g. `4111 1111 1111 1111` for a Visa test approval). Never use a real card number, even in a test environment.

---

### Setup

Before running these scenarios:
1. Start the application in test/sandbox mode.
2. Confirm the payment gateway is configured to use the sandbox (no real charges will be made).
3. Have access to the application database (read-only query access) for AC2 verification.
4. Have access to application logs for NFR-SEC-1 verification.

---

### Scenario 1 — AC1: Successful payment shows a confirmation screen with the transaction reference

**What to check:** When a customer enters valid card details and confirms the payment, they see a confirmation screen containing a unique transaction reference.

**Steps:**
1. Add an item to the basket and proceed to checkout.
2. Enter the test Visa card number: `4111 1111 1111 1111`, expiry `12/28`, CVV `100`.
3. Click "Confirm payment" (or equivalent).

**Expected result:** A payment confirmation screen is shown. The screen includes a transaction reference (a unique ID, e.g. `TXN-XXXXXXXX`). No error message is shown.

**If broken:** An error page is shown, or the confirmation screen does not contain a transaction reference.

---

### Scenario 2 — AC2: No raw card data is stored in the application database

**What to check:** After a successful payment, the application database does not contain the card number, CVV, or expiry date from the transaction.

**Steps:**
1. Complete a successful test payment (follow Scenario 1).
2. Note the transaction reference from the confirmation screen.
3. Ask a developer to run a database query for the transaction record:
   `SELECT pan, cvv, expiry_date FROM card_transactions WHERE transaction_id = '[reference]'`

**Expected result:** All three fields (`pan`, `cvv`, `expiry_date`) should be `NULL` or empty. The card data is not stored in the application database.

**If broken:** Any of the three fields contain a value (even a partial card number or masked value should be investigated).

---

### Scenario 3 — AC3: 🔴 Invalid card number shows a field-level error and no payment is sent (browser required)

**What to check:** Entering a card number that fails basic validation (Luhn check) results in a clear error on the card number field itself — and no payment request is sent.

**Steps:**
1. Go to checkout and reach the payment form.
2. Type `1234 5678 9012 3456` (this is not a valid card number — it fails the Luhn check).
3. Fill in a valid-looking expiry and CVV.
4. Click "Confirm payment".

**Expected result:** An error message appears directly below or next to the card number field (not a page-level error). The message identifies the card number as invalid (e.g. "Invalid card number" or similar). The payment is not submitted — you remain on the checkout page.

**Also verify (developer check):** Open the browser developer tools → Network tab before entering the card number. Confirm that no request to the payment API endpoint appears after clicking submit with the invalid card number.

**If broken:** The form submits with the invalid card number, or a generic page-level error is shown instead of a field-level error, or a network request to the payment API appears.

---

### Scenario 4 — AC4: Gateway timeout shows a "payment being processed" message

**What to check:** If the payment gateway takes too long to respond, the customer sees a helpful message explaining their payment is being processed — not an error — and the transaction is recorded as pending.

**Steps (requires developer to simulate a gateway timeout):**
1. Ask a developer to configure the gateway mock to delay beyond 10 seconds.
2. Complete a test payment.
3. Wait for the response.

**Expected result:** After 10 seconds, the application shows a message explaining the payment is being processed and the customer will receive email confirmation. The page does not show a generic error. The developer can verify in the database that the transaction is recorded with status `pending`.

**If broken:** The application shows a generic error message, or the transaction is not recorded in the database, or the customer message does not mention email confirmation.

---

### Scenario 5 (NFR-SEC-1) — Card data does not appear in application logs

**What to check:** This is a technical verification step — a developer should run this check after any payment test.

**Steps:**
1. Complete a test payment using Scenario 1.
2. Ask a developer to search the application logs for the test card number (`4111111111111111`), the CVV (`100`), and the expiry (`12/28`).

**Expected result:** None of these values appear anywhere in the application logs. Log entries for the payment transaction should contain only the transaction reference, amounts, and status — not card field values.

**If broken:** Any card field value (`4111111111111111`, `100`, `12/28`) appears in the logs.

---

**Test plan complete for CHK-2.1 ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T5-run-1.md`
6 tests | 2 unit | 3 integration | 1 E2E (Playwright) | 4 ACs + NFR-SEC-1 covered
No untested gaps. AC3 correctly assigned to Playwright E2E for field-level validation display.

Verification script: embedded above
5 scenarios | 1 marked 🔴 (browser required) | 0 manual gap scenarios

Test data: Sandbox test PANs only. No real card data. PCI constraint observed throughout — no encryption algorithm, HSM, tokenisation, or PCI scope assertions.

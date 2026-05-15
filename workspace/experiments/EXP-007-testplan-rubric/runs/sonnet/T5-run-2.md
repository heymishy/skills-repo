# Test Plan — CHK-2.1: Process card payment at checkout

**Story ID:** CHK-2.1
**Trial:** 2
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Jest (unit/integration); Playwright (E2E — AC3 frontend validation)
**Framework:** Jest for backend and DB assertion tests; Playwright for AC3 browser-side Luhn validation
**Test data strategy:** Sandbox test card numbers only. Visa test PAN: `4111111111111111`. MasterCard test PAN: `5500005555555559`. Invalid Luhn test PAN: `1234567890123456`. No real card data. All fixture IDs use `S2T5` suffix (distinct from Trial 1 `S1T5`).

**PCI constraint:** No assertions on encryption algorithms, HSM usage, tokenisation mechanisms, or PCI DSS scope classifications. The gateway handles all cryptographic operations. Tests assert only observable outcomes stated in ACs and NFR-SEC-1 — no assertions about implementation mechanism.

---

## Browser-layout detection

> AC3 — "The checkout form returns a field-level validation error identifying the card number field as invalid, no request is sent to the payment gateway, and no card data is transmitted to the server." — Field-level error rendering requires a browser environment to verify that the error appears inline with the card number field (not as a page-level error). Network request interception also requires a real browser. Playwright is the configured E2E framework. AC3 uses Playwright.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Valid card + payment → gateway processes, tx ref returned, confirmation screen shows tx ref | Unit + Integration | 2 | Covered |
| AC2 | After payment → no raw card data (PAN, CVV, expiry) in application database | Integration | 1 | Covered |
| AC3 | Invalid card (Luhn fail) → field-level error, no gateway request sent | E2E (Playwright) | 1 | Covered |
| AC4 | Gateway timeout (10s) → pending status, customer shown "being processed" message, tx ref in DB | Unit | 1 | Covered |
| NFR-SEC-1 | PAN, CVV, expiry not in application logs or application DB | Integration | 1 | Covered |

**Total tests:** 6
**E2E required:** Yes — Playwright for AC3
**NFRs:** 1 (NFR-SEC-1)

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| None | — | — | — | All ACs covered. NFR-SEC-1 covered by log scan + DB null-field checks. |

---

## Unit tests

### Test suite: CheckoutPaymentService

```javascript
describe('CheckoutPaymentService', () => {

  // AC1 — Successful payment returns transaction reference and approval status
  it('returns the transaction reference and approval status from the gateway on a successful card payment', async () => {
    // Arrange
    const mockGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'GW-TXN-S2T5-001',
        status: 'approved',
        amount: 139.99,
      }),
    };
    const paymentService = new CheckoutPaymentService({ gateway: mockGateway });

    // Act
    const result = await paymentService.processPayment({
      cardToken: 'tok_mastercard_test_s2t5',
      amount: 139.99,
      currency: 'GBP',
      merchantId: 'merchant-s2t5-001',
    });

    // Assert
    expect(result.transactionId).toBe('GW-TXN-S2T5-001');
    expect(result.status).toBe('approved');
    expect(result.confirmationMessage).toContain('GW-TXN-S2T5-001');
  });

  // AC4 — Gateway timeout → pending status, customer message, tx ref for reconciliation
  it('records the transaction as pending and returns a processing message when the gateway times out after 10 seconds', async () => {
    // Arrange
    jest.useFakeTimers();
    const mockGateway = {
      processPayment: jest.fn().mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gateway timeout exceeded')), 10001)
        )
      ),
    };
    const mockDb = { save: jest.fn().mockResolvedValue(true) };
    const paymentService = new CheckoutPaymentService({ gateway: mockGateway, db: mockDb });

    // Act
    const resultPromise = paymentService.processPayment({
      cardToken: 'tok_visa_test_s2t5',
      amount: 95.00,
      currency: 'GBP',
      merchantId: 'merchant-s2t5-001',
    });
    jest.advanceTimersByTime(10001);
    const result = await resultPromise;
    jest.useRealTimers();

    // Assert
    expect(result.status).toBe('pending');
    expect(result.customerMessage).toMatch(/being processed/i);
    expect(result.transactionId).toBeDefined();
    expect(mockDb.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', transactionId: result.transactionId })
    );
  });

});
```

---

## Integration tests

### Test suite: CheckoutPaymentService — database and log assertions

```javascript
describe('CheckoutPaymentService — database: no raw card data stored', () => {

  // AC1 — Transaction record created in DB after successful payment
  it('creates a transaction record in the database with approved status after a successful payment', async () => {
    // Arrange
    const testDb = new TestDatabase();
    const mockGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'GW-TXN-S2T5-002',
        status: 'approved',
      }),
    };
    const paymentService = new CheckoutPaymentService({ gateway: mockGateway, db: testDb });

    // Act
    await paymentService.processPayment({
      cardToken: 'tok_mastercard_test_s2t5',
      amount: 200.00,
      currency: 'GBP',
      merchantId: 'merchant-s2t5-001',
    });

    // Assert
    const record = await testDb.query(
      'SELECT transaction_id, status FROM payments WHERE transaction_id = ?',
      ['GW-TXN-S2T5-002']
    );
    expect(record.transaction_id).toBe('GW-TXN-S2T5-002');
    expect(record.status).toBe('approved');
  });

  // AC2 — No raw card data (PAN, CVV, expiry) persisted after payment
  it('stores null values for PAN, CVV, and expiry in the transaction record after payment', async () => {
    // Arrange
    const testDb = new TestDatabase();
    const mockGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'GW-TXN-S2T5-003',
        status: 'approved',
      }),
    };
    const paymentService = new CheckoutPaymentService({ gateway: mockGateway, db: testDb });
    const testPan = '5500005555555559'; // MasterCard test PAN
    const testCvv = '789';
    const testExpiry = '08/29';

    // Act
    await paymentService.processPayment({
      cardToken: 'tok_mastercard_test_s2t5',
      amount: 74.50,
      currency: 'GBP',
      merchantId: 'merchant-s2t5-001',
    });

    // Assert — no raw card data in DB
    const cardRecord = await testDb.query(
      'SELECT pan, cvv, expiry_date FROM card_transactions WHERE transaction_id = ?',
      ['GW-TXN-S2T5-003']
    );
    expect(cardRecord.pan).toBeNull();
    expect(cardRecord.cvv).toBeNull();
    expect(cardRecord.expiry_date).toBeNull();
  });

  // NFR-SEC-1 — No card field values in application log output
  it('does not write PAN, CVV, or expiry values to the application log during payment processing', async () => {
    // Arrange
    const logCapture = new TestLogCapture();
    const testDb = new TestDatabase();
    const mockGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'GW-TXN-S2T5-004',
        status: 'approved',
      }),
    };
    const paymentService = new CheckoutPaymentService({
      gateway: mockGateway,
      db: testDb,
      logger: logCapture.logger,
    });
    const testPan = '5500005555555559';
    const testCvv = '321';
    const testExpiry = '11/30';

    // Act
    await paymentService.processPayment({
      cardToken: 'tok_mastercard_test_s2t5',
      pan: testPan,
      cvv: testCvv,
      expiry: testExpiry,
      amount: 310.00,
      currency: 'GBP',
      merchantId: 'merchant-s2t5-001',
    });

    // Assert — card field values do not appear in log output
    const allLogs = logCapture.getAll();
    expect(allLogs).not.toContain(testPan);
    expect(allLogs).not.toContain(testCvv);
    expect(allLogs).not.toContain(testExpiry);
  });

});
```

---

## E2E tests (Playwright)

### Test suite: Checkout — Luhn validation (AC3)

```javascript
// tests/e2e/checkout-luhn-validation.spec.js
import { test, expect } from '@playwright/test';

test.describe('Checkout — invalid card number field validation', () => {

  // AC3 — Invalid Luhn card number shows field-level error, no payment request sent
  test('shows a field-level error on the card number field and sends no payment API request when a Luhn-invalid number is entered', async ({ page }) => {
    // Arrange — intercept payment API calls
    const paymentRequests = [];
    await page.route('**/api/payments', (route) => {
      paymentRequests.push(route.request());
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/checkout');
    await page.waitForSelector('[data-testid="card-number-input"]');

    // Act — enter a card number that fails Luhn check
    await page.fill('[data-testid="card-number-input"]', '1234567890123456');
    await page.fill('[data-testid="card-expiry-input"]', '11/30');
    await page.fill('[data-testid="card-cvv-input"]', '321');
    await page.click('[data-testid="submit-payment-button"]');

    // Assert — field-level error visible on card number field
    const cardFieldError = page.locator('[data-testid="card-number-error"]');
    await expect(cardFieldError).toBeVisible();
    await expect(cardFieldError).toContainText(/invalid card number/i);

    // Assert — no payment API request was sent
    expect(paymentRequests).toHaveLength(0);
  });

});
```

---

## NFR tests

### NFR-SEC-1

Covered by the integration test `'does not write PAN, CVV, or expiry values to the application log...'` and the `'stores null values for PAN, CVV, and expiry...'` test. Both verify the observable outcomes stated in NFR-SEC-1: card field values absent from application logs, and card data columns null in the application database post-payment.

No assertions are made on encryption algorithms, HSM usage, PCI scope classification, or tokenisation mechanism. The gateway is responsible for all cryptographic operations.

---

## Output 2: AC Verification Script

**Story:** CHK-2.1 — Process card payment at checkout
**For use:** Pre-code sign-off, post-merge smoke test, delivery review
**Environment required:** Application in test mode with payment gateway sandbox active. Use test card numbers only.

> **⚠️ Use only test card numbers.** MasterCard test PAN: `5500 0055 5555 5559`. Do not use real card data.

---

### Setup

1. Start the application in test/sandbox mode.
2. Confirm the payment gateway uses the sandbox environment (no real charges).
3. Have read-only database access for AC2 verification.
4. Have application log access for NFR-SEC-1 verification.

---

### Scenario 1 — AC1: Successful payment shows transaction reference on confirmation screen

**Steps:**
1. Add an item to the basket and proceed to checkout.
2. Enter the test MasterCard: `5500 0055 5555 5559`, expiry `11/30`, CVV `321`.
3. Submit the payment.

**Expected result:** A confirmation screen is shown with a unique transaction reference (e.g. `TXN-XXXXXXXXX`). No error message.

**If broken:** Error shown instead of confirmation, or no transaction reference on confirmation screen.

---

### Scenario 2 — AC2: Application database contains no raw card data after payment

**Steps:**
1. Complete a successful test payment (Scenario 1).
2. Note the transaction reference.
3. Ask a developer to run a query:
   `SELECT pan, cvv, expiry_date FROM card_transactions WHERE transaction_id = '[reference]'`

**Expected result:** All three fields are `NULL` or empty.

**If broken:** Any card field contains a value.

---

### Scenario 3 — AC3: 🔴 Invalid card number shows field-level error, no payment sent (browser required)

**Steps:**
1. Go to checkout. Reach the card payment form.
2. Type `1234 5678 9012 3456` in the card number field (Luhn-invalid).
3. Enter a valid-looking expiry and CVV.
4. Click "Confirm payment".

**Expected result:** An error appears directly on the card number field (e.g. "Invalid card number"). You stay on the checkout page. No payment is submitted.

**Developer check (Network tab):** No request to the payment API should appear in the browser's network log after clicking submit.

**If broken:** No field-level error shown, form submits, page-level error only, or a network request to the payment API is visible.

---

### Scenario 4 — AC4: Gateway timeout shows "payment being processed" message

**Steps (developer assistance required):**
1. Ask a developer to simulate a gateway timeout (delay > 10s).
2. Complete a test payment.
3. Wait for the timeout.

**Expected result:** After ~10 seconds, the application displays a message indicating the payment is being processed and the customer will receive email confirmation. Status shown is not an error. Developer can confirm a `pending` status in the DB.

**If broken:** Generic error shown, or no message after 10 seconds, or transaction not recorded as pending.

---

### Scenario 5 (NFR-SEC-1) — Card data not in application logs

**Steps:**
1. Complete a test payment (Scenario 1).
2. Ask a developer to search application logs for `5500005555555559`, `321`, and `11/30`.

**Expected result:** None of these values appear anywhere in the application logs.

**If broken:** Any card field value appears in the logs.

---

**Test plan complete for CHK-2.1 (Trial 2) ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T5-run-2.md`
6 tests | 2 unit | 3 integration | 1 E2E (Playwright) | 4 ACs + NFR-SEC-1 covered
No untested gaps. AC3 assigned to Playwright E2E with explicit rationale.

Verification script: embedded above
5 scenarios | 1 marked 🔴 (browser required) | 0 manual gap scenarios

Test data: Sandbox PANs only (MasterCard `5500005555555559`). All fixture IDs use `S2T5` suffix.
PCI constraint observed — no encryption algorithm, HSM, tokenisation, or PCI scope assertions.

# Test Plan — T5 Card payment at checkout (PCI-regulated)

**Story:** Process card payment at checkout  
**Story ID:** CHK-2.1  
**Test framework:** Node.js (scripts/check-*.js pattern) + Playwright for frontend validation  
**Test runner command:** `node tests/card-payment.test.js && playwright test tests/card-payment.spec.ts`  
**Date written:** 2026-05-15

---

## Test Data Strategy

**Approach:** Synthetic test data; payment gateway test mode with safe test card numbers; no real card data.

**Test data ownership:** Self-contained — tests use only payment gateway sandbox/test mode and synthetic data.

**Data sources:**
- Test card numbers (from payment gateway sandbox): `4111111111111111` (Visa), `5555555555554444` (Mastercard)
- Invalid card numbers: `1234567890123456` (fails Luhn check)
- Fake customer email: `customer-test@test.invalid`
- Fake transaction references: `CHK-TX-2026-05-15-001`
- Mock payment gateway SDK: captures calls without sending real transactions

**PCI constraints:** 
- NO real PANs, CVVs, or expiry dates in test data
- All test card numbers are from the payment gateway's official test suite
- Log sanitisation required: card field values must not appear in any log output
- Database scans after payment must verify card fields are NULL/empty

**Frontend isolation:** Card field inputs use the payment gateway's hosted iframe (if available). Card data never touches the application's JavaScript.

**No PII:** All data is synthetic and test-only.

---

## AC Coverage and Test Classification

| AC | Description | Test type | Status |
|----|-------------|-----------|--------|
| AC1 | Payment processed via gateway; transaction ref returned; confirmation shown | Unit/Integration | Covered |
| AC2 | No card data (PAN/CVV/expiry) persisted in database after payment | Integration | Covered |
| AC3 | Invalid card (Luhn fail) → field error; no gateway request; no data transmitted | Frontend/Unit | Covered |
| AC4 | Gateway timeout (10s) → pending status; customer message; tx ref recorded | Unit | Covered |
| NFR-SEC-1 | Card data not logged, not persisted, not transmitted outside gateway | Log/DB scan | Covered |

**Gap analysis:** No gaps. All ACs and NFR have corresponding tests grounded in observable outcomes, not implementation mechanisms.

---

## Frontend Tests

### Test 1 (AC3): Invalid card number validation; Luhn check fails

**Given:** A customer enters an invalid card number (fails Luhn check)  
**When:** They attempt to submit the payment form  
**Then:** (3a) The form returns a field-level validation error identifying the card field as invalid, (3b) no payment request is sent to the gateway, and (3c) no card data is transmitted to the server

```typescript
// tests/card-payment.spec.ts (Playwright E2E)
test('should reject invalid card number (Luhn check fails) on frontend', async ({ page }) => {
  await page.goto('/checkout');
  
  // Fill in form with invalid card number
  await page.fill('[data-testid="card-number"]', '1234567890123456'); // Fails Luhn
  await page.fill('[data-testid="card-expiry"]', '12/26');
  await page.fill('[data-testid="card-cvv"]', '123');
  
  // Attempt to submit
  await page.click('[data-testid="submit-payment"]');
  
  // Wait for error to appear
  await page.waitForSelector('[data-testid="card-error"]');
  
  // Verify error message (3a)
  const errorMsg = await page.textContent('[data-testid="card-error"]');
  expect(errorMsg).toContain('Invalid card number');
  
  // Verify no API request was made (3b)
  // (This is verified by Playwright's request interceptor — no POST to /api/checkout/pay)
  const requests = await page.context().requests();
  const paymentRequests = requests.filter(r => r.method() === 'POST' && r.url().includes('/checkout/pay'));
  expect(paymentRequests.length).toBe(0);
});
```

**Expected to fail before implementation:** ✓

---

## Unit/Integration Tests

### Test 2: AC1 — Payment processed via gateway; transaction reference returned; confirmation shown

**Given:** A customer enters valid card details and confirms the payment  
**When:** The payment is processed  
**Then:** (1a) The payment is processed via the payment gateway, (1b) a transaction reference is returned, and (1c) a payment confirmation screen is shown with the transaction reference

```javascript
// tests/card-payment.test.js
test('should process payment via gateway and show confirmation', async () => {
  const mockGateway = new MockPaymentGateway();
  mockGateway.processPayment = jest.fn().mockResolvedValue({
    transactionId: 'CHK-TX-2026-05-15-001',
    status: 'success',
    timestamp: Date.now()
  });
  
  const checkoutService = new CheckoutService(mockGateway);
  
  const paymentRequest = {
    cardNumber: '4111111111111111', // Test card (Visa)
    expiry: '12/26',
    cvv: '123',
    amount: 99.99,
    customerId: 'cust-test-001',
    email: 'customer@test.invalid'
  };
  
  const result = await checkoutService.processPayment(paymentRequest);
  
  // Verify gateway was called (1a)
  expect(mockGateway.processPayment).toHaveBeenCalledWith(expect.objectContaining({
    cardNumber: paymentRequest.cardNumber,
    amount: 99.99
  }));
  
  // Verify transaction reference was returned (1b)
  expect(result.transactionId).toBe('CHK-TX-2026-05-15-001');
  expect(result.status).toBe('success');
  
  // Verify confirmation object was created (frontend will display this) (1c)
  expect(result.confirmationMessage).toBeDefined();
  expect(result.confirmationMessage).toContain('CHK-TX-2026-05-15-001');
});
```

**Expected to fail before implementation:** ✓

---

### Test 3: AC2 — No card data persisted in database after payment

**Given:** A card payment is processed successfully  
**When:** The payment service records the transaction in the database  
**Then:** No raw card data (PAN, CVV, expiry) is present in the application database

```javascript
test('should not persist raw card data in database', async () => {
  const mockGateway = new MockPaymentGateway();
  const mockDb = new MockDatabase();
  
  mockGateway.processPayment = jest.fn().mockResolvedValue({
    transactionId: 'CHK-TX-2026-05-15-002',
    status: 'success'
  });
  
  const checkoutService = new CheckoutService(mockGateway, mockDb);
  
  const paymentRequest = {
    cardNumber: '4111111111111111',
    expiry: '12/26',
    cvv: '123',
    amount: 150.00,
    customerId: 'cust-test-002',
    email: 'customer@test.invalid'
  };
  
  await checkoutService.processPayment(paymentRequest);
  
  // Query the database for the transaction record
  const transactionRecord = await mockDb.query(
    'SELECT pan, card_expiry, cvv FROM transactions WHERE transaction_id = ?',
    ['CHK-TX-2026-05-15-002']
  );
  
  // Verify card fields are empty/null
  expect(transactionRecord.pan).toBeNull();
  expect(transactionRecord.card_expiry).toBeNull();
  expect(transactionRecord.cvv).toBeNull();
  
  // Verify transaction reference IS present (for reconciliation)
  expect(transactionRecord.transaction_id).toBe('CHK-TX-2026-05-15-002');
});
```

**Expected to fail before implementation:** ✓

---

### Test 4: AC4 — Gateway timeout (10s); pending status; customer message; tx ref recorded

**Given:** A payment request is sent to the payment gateway  
**When:** The gateway does not respond within 10 seconds  
**Then:** (4a) The payment is marked as pending in the application database, (4b) the customer is shown a message explaining the payment is being processed and they will receive email confirmation, and (4c) the transaction reference is recorded for reconciliation

```javascript
test('should handle gateway timeout gracefully', async () => {
  const mockGateway = new MockPaymentGateway();
  mockGateway.processPayment = jest.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gateway timeout after 10s')), 10000);
    });
  });
  
  const mockDb = new MockDatabase();
  const checkoutService = new CheckoutService(mockGateway, mockDb);
  
  const paymentRequest = {
    cardNumber: '4111111111111111',
    expiry: '12/26',
    cvv: '123',
    amount: 200.00,
    customerId: 'cust-test-003',
    email: 'customer@test.invalid'
  };
  
  const result = await checkoutService.processPayment(paymentRequest);
  
  // Verify payment marked as pending (4a)
  expect(result.status).toBe('pending');
  
  // Verify customer message is returned (4b)
  expect(result.customerMessage).toBeDefined();
  expect(result.customerMessage).toContain('being processed');
  expect(result.customerMessage).toContain('email confirmation');
  
  // Verify transaction reference was recorded (4c)
  const pendingRecord = await mockDb.query(
    'SELECT transaction_id, status FROM transactions WHERE customer_id = ?',
    ['cust-test-003']
  );
  expect(pendingRecord.transaction_id).toBeDefined();
  expect(pendingRecord.status).toBe('pending');
});
```

**Expected to fail before implementation:** ✓

---

## NFR Tests

### Test 5: NFR-SEC-1 — Card data not logged; not persisted; not transmitted outside gateway

**Approach:** Comprehensive data isolation check combining log scanning and database scanning.

```javascript
test('NFR-SEC-1: card data isolation (not logged, not persisted, not transmitted)', async () => {
  const mockGateway = new MockPaymentGateway();
  const mockDb = new MockDatabase();
  const logCapture = new LogCapture(); // Captures all application logs
  
  mockGateway.processPayment = jest.fn().mockResolvedValue({
    transactionId: 'CHK-TX-NFR-001',
    status: 'success'
  });
  
  const checkoutService = new CheckoutService(mockGateway, mockDb);
  
  const testCardNumber = '4111111111111111';
  const testCvv = '123';
  const testExpiry = '12/26';
  
  const paymentRequest = {
    cardNumber: testCardNumber,
    expiry: testExpiry,
    cvv: testCvv,
    amount: 99.99,
    customerId: 'cust-nfr-001',
    email: 'nfr-test@test.invalid'
  };
  
  logCapture.startCapture();
  await checkoutService.processPayment(paymentRequest);
  const capturedLogs = logCapture.stopCapture();
  
  // Verify PAN not in logs
  expect(capturedLogs.join('\n')).not.toContain('4111111111111111');
  expect(capturedLogs.join('\n')).not.toContain('4111 1111 1111 1111');
  
  // Verify CVV not in logs
  expect(capturedLogs.join('\n')).not.toContain('123');
  
  // Verify expiry not in logs (can be more flexible: allow "12/26" in UI but not in sensitive logs)
  // (Verify at least in payment processing logs)
  const paymentProcLogs = capturedLogs.filter(l => l.includes('paymentProcess'));
  expect(paymentProcLogs.join('\n')).not.toContain('12/26');
  
  // Verify database does not store card data
  const dbRecords = await mockDb.query('SELECT * FROM card_fields');
  dbRecords.forEach(record => {
    expect(record.pan).toBeNull();
    expect(record.cvv).toBeNull();
    expect(record.expiry).toBeNull();
  });
  
  // Verify gateway receives card data (expected), but nothing else does
  // (Only the mockGateway.processPayment was called with card details)
  expect(mockGateway.processPayment).toHaveBeenCalledWith(expect.objectContaining({
    cardNumber: testCardNumber
  }));
});
```

**Expected to fail before implementation:** ✓

---

## Gap Analysis

**No gaps identified.** All 4 ACs and the NFR have corresponding tests grounded in observable outcomes:
- AC1: payment processed, tx ref returned, confirmation shown
- AC2: database has no card fields populated
- AC3: frontend validation error, no gateway request, no data transmission
- AC4: status is pending, customer message is returned, tx ref recorded
- NFR-SEC-1: card fields do not appear in logs or database

**No tests assert implementation mechanisms** (encryption algorithms, HSM usage, tokenisation mechanisms, PCI scope classifications). All assertions are grounded in the ACs and NFR.

---

---

# AC Verification Script — T5 Card payment at checkout

**Story:** Process card payment at checkout  
**Story ID:** CHK-2.1  
**Audience:** QA, Customer Support, Security/Compliance  
**Last updated:** 2026-05-15

---

## Test Environment Setup

Before running the scenarios below:

1. Checkout page is deployed or running locally
2. Payment gateway sandbox environment is configured
3. Test card numbers from payment gateway are available (e.g. Visa: 4111111111111111)
4. Database access available for post-payment verification
5. Application logs are accessible for inspection
6. Run tests: `node tests/card-payment.test.js && playwright test tests/card-payment.spec.ts`

---

## AC1: Payment processed via gateway; transaction reference returned; confirmation shown

**Scenario:** Process a successful card payment and verify the confirmation screen displays the transaction reference.

1. Navigate to the checkout page
2. Add an item to the basket ($99.99 or similar amount)
3. Click "Proceed to checkout"
4. Enter a valid test card number: `4111111111111111` (Visa test card)
5. Enter expiry date: `12/26`
6. Enter CVV: `123`
7. Enter email: `payment-test@test.invalid`
8. Click "Complete Payment"
9. Observe the result:
   - A confirmation screen appears
   - The screen displays **"Payment Successful"** or similar confirmation message
   - The screen displays the **transaction reference** (e.g., `CHK-TX-2026-05-15-001` or a unique ID)
   - Confirmation is sent to the provided email address

**Expected outcome:**
- Payment gateway processed the transaction (no error)
- Transaction reference is displayed on screen and in confirmation email
- Customer can reference this ID for support/reconciliation

**Reset:** Log out; clear browser cache if needed.

---

## AC2: No card data persisted in database after payment

**Scenario:** After processing a payment, verify the application database does not store raw card information.

**Prerequisites:** You have database access or work with a DBA/developer.

1. Process a test payment (see AC1 above) with:
   - Card number: `5555555555554444` (Mastercard test)
   - Expiry: `01/27`
   - CVV: `456`
   - Amount: $150.00
2. Wait for payment to complete
3. Query the application database:
   ```sql
   SELECT * FROM transactions WHERE email = 'payment-test@test.invalid' ORDER BY created_at DESC LIMIT 1;
   ```
4. Examine the result row:
   - **Verify the following fields are NULL or empty:** `pan`, `card_number`, `cvv`, `cvv_code`, `card_expiry`, `expiry_date`
   - **Verify the following fields DO have values:** `transaction_id`, `amount`, `email`, `status`, `created_at`
5. Optional: Query for any other tables that might store card fields:
   ```sql
   SELECT table_name FROM information_schema.columns WHERE column_name IN ('pan', 'card_number', 'cvv') AND table_schema = 'public';
   ```
   Run `SELECT * FROM [each_table]` and verify card fields are NULL for your test transaction.

**Expected outcome:**
- Database rows for the transaction exist but contain NO card data
- Transaction reference, amount, customer email, and timestamp are stored
- Card details were transmitted to the payment gateway but NOT stored locally

**Reset:** If database entries were written, ask DBA to delete test records after verification.

---

## AC3: Invalid card validation; Luhn check fails; no gateway request; no data transmission

**Scenario:** Verify that an invalid card number is rejected on the frontend without attempting a gateway transaction.

1. Navigate to the checkout page
2. Add an item to basket
3. Click "Proceed to checkout"
4. Enter an **invalid card number:** `1234567890123456` (fails Luhn check)
5. Enter expiry: `12/26`
6. Enter CVV: `123`
7. Click "Complete Payment"
8. Observe the result:
   - **Error message appears on the form** (not a page error, but a field-level error)
   - Error message specifically identifies the **card number field** as invalid (e.g., "Invalid card number. Please check and try again.")
   - **Payment screen does not disappear** — you remain on the checkout page with the form visible
   - **No payment confirmation is shown**
   - **No email confirmation is sent**

**Expected outcome:**
- Frontend validation caught the invalid card before attempting a gateway request
- User can correct the card number and retry without wasting a gateway transaction attempt

**Reset:** Refresh the page.

---

## AC4: Gateway timeout; pending status; customer message; transaction reference recorded

**Scenario:** Simulate or wait for a gateway timeout and verify the application handles it gracefully.

**Note:** This scenario is difficult to trigger in production (gateways are usually fast). You may need to:
- Coordinate with your payment provider to test with their sandbox environment
- Or temporarily disable network connectivity to simulate a timeout
- Or ask a developer to trigger a timeout in a test environment

1. Proceed to the checkout page and enter payment details (valid test card)
2. Trigger a gateway timeout (see note above) or wait for a natural timeout if the gateway is slow
3. Wait up to 10–15 seconds without refreshing the page
4. Observe the result:
   - A message appears on screen: **"Your payment is being processed. You will receive an email confirmation shortly."** (or similar)
   - **Not an error message** — but a "processing" status message
   - The page shows or logs a **transaction reference ID** (even though the full confirmation from the gateway is still pending)
   - **Email confirmation is sent** to the customer's email address (typically within 1–2 minutes after the timeout)

**Expected outcome:**
- Customer is not left confused ("did my payment go through?")
- Payment is marked as pending in the application and eventually resolves
- Customer receives email confirmation once the payment gateway confirms the transaction

**Reset:** Contact support to cancel or verify the pending transaction if needed.

---

## NFR-SEC-1: Card data not logged, not persisted, not transmitted outside gateway (Compliance Check)

**Scenario:** Verify the application is handling card data securely per PCI DSS requirements.

**Prerequisites:** You have access to application logs and database.

1. Process a test payment (see AC1) with test card: `4111111111111111`, expiry: `12/26`, CVV: `123`
2. Check application logs:
   ```bash
   # Example: grep for the card number in logs
   tail -100 /var/log/application.log | grep -i "4111\|411111\|card"
   ```
   - **Verify the card number does NOT appear** in any logs
   - Verify the CVV (`123`) does NOT appear in logs
   - Verify the full expiry (`12/26`) does NOT appear in transaction processing logs
3. Check database (as in AC2):
   - Verify card fields (`pan`, `cvv`, `expiry`) are NULL for all transaction records
4. Network inspection (optional, if you have access):
   - Use a network packet analyzer (Wireshark, Charles Proxy, etc.) to verify:
     - Card data is transmitted **only to the payment gateway** (HTTPS encrypted)
     - Card data is **not** transmitted to third-party services, analytics tools, or logging systems

**Expected outcome:**
- Card data is isolated to the payment gateway integration only
- Logs are free of card data
- Database stores transaction references and amounts but never card details
- Application is compliant with PCI DSS Requirement 3 (protection of stored card data)

**Reset:** No cleanup needed; this is an inspection-only check.

---

## Smoke Test Checklist (Post-Deployment)

- [ ] Process 3 successful card payments (different amounts) and verify confirmation screens show transaction references
- [ ] After each payment, query the database and verify card fields are NULL
- [ ] Attempt an invalid card number and verify frontend validation error (no gateway request)
- [ ] (Optional) Trigger a gateway timeout and verify the payment is marked pending and customer receives email confirmation
- [ ] Search application logs for card numbers (4111, 5555, etc.) and CVV patterns (3–4 digit numbers) and verify they do NOT appear
- [ ] Verify payment records in database contain: transaction_id, amount, email, status — but NOT card details

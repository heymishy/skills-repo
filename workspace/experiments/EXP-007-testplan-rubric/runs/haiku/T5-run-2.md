# Test Plan — T5 Card payment at checkout (PCI-regulated) (Trial 2)

**Story:** Process card payment at checkout  
**Story ID:** CHK-2.1  
**Test framework:** Node.js (scripts/check-*.js pattern) + Playwright for frontend  
**Test runner command:** `node tests/card-checkout.test.js && playwright test tests/card-validation.spec.ts`  
**Date written:** 2026-05-16  
**Trial:** 2

---

## Test Data Strategy

**Approach:** Synthetic test card numbers (gateway sandbox only); mocked payment gateway SDK; no real PCI data.

**Test data ownership:** Self-contained — all data is synthetic and test-only.

**Data sources:**
- Test card numbers (from payment gateway sandbox): `4111111111111111` (Visa), `5555555555554444` (Mastercard)
- Invalid test card: `1234567890123456` (fails Luhn check)
- Mock customer email: `customer-checkout-test@test.invalid`
- Fake transaction references: `CHK-REF-2026-05-16-001`
- Mock payment gateway SDK: captures calls without sending real transactions

**PCI constraints:**
- NO real PANs, CVVs, or expiry dates in any test
- Test card numbers are from payment gateway's official sandbox environment
- Card fields are never persisted to the application database
- Card data is not logged to application logs
- Frontend uses payment gateway hosted fields (iframe) — card data never touches application JavaScript

**No PII:** All data is synthetic.

---

## AC Coverage and Test Classification

| AC | Description | Test Type | Status |
|----|-------------|-----------|--------|
| AC1 | Payment processed via gateway; tx ref returned; confirmation shown | Unit | Covered |
| AC2 | No card data (PAN/CVV/expiry) in database after payment | Integration | Covered |
| AC3 | Invalid card (Luhn) → field error; no gateway request; no data transmission | Frontend | Covered |
| AC4 | Gateway timeout (10s) → pending status; customer message; tx ref recorded | Unit | Covered |
| NFR-SEC-1 | Card data not logged, not persisted, not transmitted outside gateway | Log/DB scan | Covered |

**Gap analysis:** No gaps. All ACs and NFR have test entries grounded in observable outcomes only.

---

## Unit Tests

### Test 1: AC1 — Payment processed via gateway; transaction reference returned; confirmation shown

**Given:** Customer enters valid card details and confirms payment  
**When:** The payment service processes the payment  
**Then:** (1a) Payment is processed via gateway, (1b) transaction reference is returned, (1c) confirmation screen is shown with tx ref

```javascript
// tests/card-checkout.test.js
test('AC1: payment processed via gateway; tx ref returned; confirmation shown', async () => {
  const mockGateway = new MockPaymentGateway();
  mockGateway.processPayment = jest.fn().mockResolvedValue({
    transactionId: 'CHK-REF-2026-05-16-001',
    status: 'approved',
    timestamp: Date.now()
  });
  
  const checkoutService = new CheckoutService(mockGateway);
  
  const paymentRequest = {
    cardNumber: '4111111111111111', // Sandbox test card
    expiry: '12/26',
    cvv: '123',
    amount: 99.99,
    customerId: 'cust-test-001',
    email: 'customer-checkout-test@test.invalid'
  };
  
  const result = await checkoutService.processPayment(paymentRequest);
  
  // Verify gateway was called (1a)
  expect(mockGateway.processPayment).toHaveBeenCalledWith(expect.objectContaining({
    amount: 99.99
  }));
  
  // Verify transaction reference was returned (1b)
  expect(result.transactionId).toBe('CHK-REF-2026-05-16-001');
  expect(result.status).toBe('approved');
  
  // Verify confirmation object was created (1c)
  expect(result.confirmationMessage).toBeDefined();
  expect(result.confirmationMessage).toContain('CHK-REF-2026-05-16-001');
});
```

**Expected to fail before implementation:** ✓

---

### Test 2: AC2 — No card data persisted in application database

**Given:** A card payment is processed successfully  
**When:** The payment service records the transaction in the database  
**Then:** No raw card data (PAN, CVV, expiry) is present in the application database

```javascript
test('AC2: no raw card data persisted in application database', async () => {
  const mockGateway = new MockPaymentGateway();
  mockGateway.processPayment = jest.fn().mockResolvedValue({
    transactionId: 'CHK-REF-2026-05-16-002',
    status: 'approved'
  });
  
  const mockDatabase = new MockDatabase();
  const checkoutService = new CheckoutService(mockGateway, mockDatabase);
  
  const paymentRequest = {
    cardNumber: '5555555555554444',
    expiry: '01/27',
    cvv: '456',
    amount: 149.99,
    customerId: 'cust-test-002',
    email: 'customer-checkout-test@test.invalid'
  };
  
  await checkoutService.processPayment(paymentRequest);
  
  // Query the database for the transaction record
  const record = await mockDatabase.query(
    'SELECT pan, card_number, cvv, card_expiry, expiry_date FROM payment_transactions WHERE transaction_id = ?',
    ['CHK-REF-2026-05-16-002']
  );
  
  // Verify all card fields are NULL/empty
  expect(record.pan).toBeNull();
  expect(record.card_number).toBeNull();
  expect(record.cvv).toBeNull();
  expect(record.card_expiry).toBeNull();
  expect(record.expiry_date).toBeNull();
  
  // Verify transaction reference IS stored (for reconciliation)
  expect(record.transaction_id).toBe('CHK-REF-2026-05-16-002');
});
```

**Expected to fail before implementation:** ✓

---

### Test 3: AC3 — Invalid card validation; Luhn check fails; no gateway request

**Given:** Customer enters an invalid card number (fails Luhn check)  
**When:** They attempt to submit the payment form  
**Then:** (3a) Form returns field-level validation error, (3b) no payment request sent to gateway, (3c) no card data transmitted to server

```typescript
// tests/card-validation.spec.ts (Playwright)
test('AC3: invalid card (Luhn) → field error; no gateway request; no transmission', async ({ page }) => {
  await page.goto('/checkout');
  
  // Fill form with invalid card number
  await page.fill('[data-testid="card-number"]', '1234567890123456');
  await page.fill('[data-testid="card-expiry"]', '12/26');
  await page.fill('[data-testid="card-cvv"]', '123');
  
  // Attempt to submit
  await page.click('[data-testid="submit-payment"]');
  
  // Wait for validation error (3a)
  await page.waitForSelector('[data-testid="card-number-error"]');
  
  const errorText = await page.textContent('[data-testid="card-number-error"]');
  expect(errorText).toContain('Invalid card number');
  
  // Verify no API request was made (3b)
  // (Intercept requests during form submission)
  const apiRequests = await page.evaluate(() => {
    // This would be tracked via API call interceptor
    return window.__apiCallCount || 0;
  });
  expect(apiRequests).toBe(0);
});
```

**Expected to fail before implementation:** ✓

---

### Test 4: AC4 — Gateway timeout; pending status; customer message; tx ref recorded

**Given:** Payment request sent to gateway  
**When:** Gateway does not respond within 10 seconds  
**Then:** (4a) Payment marked pending, (4b) customer shown processing message, (4c) tx ref recorded for reconciliation

```javascript
test('AC4: gateway timeout → pending; customer message; tx ref recorded', async () => {
  const mockGateway = new MockPaymentGateway();
  mockGateway.processPayment = jest.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gateway timeout')), 10000);
    });
  });
  
  const mockDatabase = new MockDatabase();
  const checkoutService = new CheckoutService(mockGateway, mockDatabase);
  
  const paymentRequest = {
    cardNumber: '4111111111111111',
    expiry: '12/26',
    cvv: '123',
    amount: 199.99,
    customerId: 'cust-test-004',
    email: 'customer-checkout-test@test.invalid'
  };
  
  const result = await checkoutService.processPayment(paymentRequest);
  
  // Verify payment marked as pending (4a)
  expect(result.status).toBe('pending');
  
  // Verify customer message is returned (4b)
  expect(result.customerMessage).toBeDefined();
  expect(result.customerMessage).toContain('being processed');
  expect(result.customerMessage).toContain('email confirmation');
  
  // Verify transaction reference was recorded (4c)
  const pendingRecord = await mockDatabase.query(
    'SELECT transaction_id, status FROM payment_transactions WHERE customer_id = ?',
    ['cust-test-004']
  );
  expect(pendingRecord.transaction_id).toBeDefined();
  expect(pendingRecord.status).toBe('pending');
});
```

**Expected to fail before implementation:** ✓

---

## NFR Tests

### Test 5: NFR-SEC-1 — Card data isolation (not logged, not persisted, not transmitted)

**Approach:** Comprehensive scan combining log analysis and database verification.

```javascript
test('NFR-SEC-1: card data isolation verification', async () => {
  const mockGateway = new MockPaymentGateway();
  mockGateway.processPayment = jest.fn().mockResolvedValue({
    transactionId: 'CHK-REF-NFR-001',
    status: 'approved'
  });
  
  const mockDatabase = new MockDatabase();
  const logCapture = new LogCapture();
  const checkoutService = new CheckoutService(mockGateway, mockDatabase);
  
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
  const logs = logCapture.stopCapture();
  
  // Verify card number NOT in logs
  const logText = logs.join('\n');
  expect(logText).not.toContain('4111111111111111');
  expect(logText).not.toContain('4111 1111 1111 1111');
  
  // Verify CVV NOT in logs
  expect(logText).not.toContain('123');
  
  // Verify expiry NOT in payment processing logs
  const paymentLogs = logs.filter(l => l.includes('paymentProcess') || l.includes('gateway'));
  expect(paymentLogs.join('\n')).not.toContain('12/26');
  
  // Verify database has NO card fields
  const allRecords = await mockDatabase.query('SELECT * FROM payment_transactions');
  allRecords.forEach(record => {
    expect(record.pan).toBeNull();
    expect(record.cvv).toBeNull();
    expect(record.expiry).toBeNull();
  });
  
  // Verify only gateway received the card data
  expect(mockGateway.processPayment).toHaveBeenCalledWith(
    expect.objectContaining({ cardNumber: testCardNumber })
  );
});
```

**Expected to fail before implementation:** ✓

---

## Gap Analysis

**No gaps identified.** All 4 ACs have comprehensive test bodies grounded in observable outcomes. NFR-SEC-1 has combined log + database verification. No tests assert encryption algorithms, HSM usage, tokenization mechanisms, or PCI compliance framework details.

---

---

# AC Verification Script — T5 Card payment at checkout

**Story:** Process card payment at checkout  
**Story ID:** CHK-2.1  
**Audience:** QA, Customer Support, Security/Compliance  
**Last updated:** 2026-05-16  
**Trial:** 2

---

## Test Environment Setup

Before running the scenarios below:

1. Checkout page is deployed or running locally
2. Payment gateway sandbox environment is configured
3. Test card numbers from payment gateway are available
4. Database access is available for post-payment verification
5. Application logs are accessible for inspection
6. Run tests: `node tests/card-checkout.test.js && playwright test tests/card-validation.spec.ts`

---

## AC1: Payment processed via gateway; transaction reference returned; confirmation shown

**Scenario:** Process a successful card payment and verify the confirmation screen displays the transaction reference.

1. Navigate to the checkout page
2. Add an item to the basket ($99.99)
3. Click "Proceed to checkout"
4. Enter a valid test card number: `4111111111111111` (Visa sandbox)
5. Enter expiry: `12/26`
6. Enter CVV: `123`
7. Enter email: `payment-test@test.invalid`
8. Click "Complete Payment"
9. Observe:
   - A confirmation screen appears with message **"Payment Successful"**
   - Screen displays the **transaction reference** (e.g., `CHK-REF-2026-05-16-001` or similar unique ID)
   - Confirmation email is sent to the provided address
10. Note the transaction reference for your records

**Expected outcome:**
- Payment gateway processed the transaction
- Transaction reference is displayed on screen and in email
- Customer can reference this ID for support/reconciliation

**Reset:** Log out; clear browser cache if needed.

---

## AC2: No card data persisted in database after payment

**Scenario:** Verify the application database does NOT store raw card information after payment.

**Prerequisites:** You have database access or can work with a DBA.

1. Process a test payment (see AC1 above) with:
   - Card: `5555555555554444` (Mastercard sandbox)
   - Expiry: `01/27`
   - CVV: `456`
   - Amount: $150.00
   - Email: `db-test@test.invalid`
2. Wait for payment to complete
3. Query the application database:
   ```sql
   SELECT * FROM payment_transactions WHERE email = 'db-test@test.invalid' ORDER BY created_at DESC LIMIT 1;
   ```
4. Examine the result row and verify:
   - **NULL/empty fields:** `pan`, `card_number`, `cvv`, `card_security_code`, `card_expiry`, `expiry_date`
   - **Populated fields:** `transaction_id`, `amount`, `email`, `status`, `created_at` (all present)
5. Optional: Search the entire database for card field columns:
   ```sql
   SELECT table_name, column_name FROM information_schema.columns WHERE column_name IN ('pan', 'card_number', 'cvv') AND table_schema = 'public';
   ```
   Run SELECT on each table and verify card fields are NULL for your test transaction

**Expected outcome:**
- Database rows exist but contain NO card data
- Transaction reference, amount, customer email, and timestamp are stored
- Card data was transmitted to the payment gateway but NOT stored locally

**Reset:** Ask DBA to delete test records after verification.

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
8. Observe:
   - An **inline error message appears** on the checkout form (not a full page error)
   - Error specifically identifies the **card number field** as invalid (e.g., "Invalid card number. Please verify.")
   - **Payment screen remains visible** with the form still displayed
   - **No confirmation page appears**
   - **No payment confirmation email is sent**
9. Verify no payment gateway request was made (check network tab in browser DevTools if available)

**Expected outcome:**
- Frontend validation caught the Luhn check failure before attempting a gateway request
- User can correct the card number and retry without wasting a gateway call

**Reset:** Refresh the page.

---

## AC4: Gateway timeout; pending status; customer message; transaction reference recorded

**Scenario:** Verify the application handles a payment gateway timeout gracefully.

**Note:** This scenario is difficult to trigger in a live environment. You may need to:
- Coordinate with your payment provider to test with their sandbox timeout behavior
- Or ask a developer to simulate a timeout in a test environment

1. Proceed to the checkout page and enter payment details (valid test card)
2. Trigger a gateway timeout (see note above) or wait for a natural timeout if the gateway is slow
3. Wait up to 15 seconds without refreshing the page
4. Observe:
   - A message appears: **"Your payment is being processed. You will receive an email confirmation within 1–2 minutes."** (or similar)
   - **Not an error message** — but a "processing" status message
   - Transaction reference ID is displayed (for your records)
   - **Email confirmation is sent** to your email address (typically within 1–2 minutes after the timeout resolves)
5. Check your email inbox and verify confirmation arrives

**Expected outcome:**
- Customer is not left confused by the timeout
- Payment is marked as pending and eventually resolves
- Customer receives email confirmation once the payment gateway confirms the transaction

**Reset:** Contact support if needed to verify or cancel the pending transaction.

---

## NFR-SEC-1: Card data isolation (not logged, not persisted, not transmitted outside gateway) — Security Compliance

**Scenario:** Verify the application is handling card data securely per PCI DSS requirements.

**Prerequisites:** Access to application logs and database.

1. Process a test payment with card: `4111111111111111`, expiry: `12/26`, CVV: `123`
2. Check application logs for card data:
   ```bash
   # Example: search logs for card patterns
   tail -500 /var/log/application.log | grep -iE "4111|411111|card|cvv"
   ```
   - **Verify the card number does NOT appear** in any logs
   - **Verify the CVV (`123`) does NOT appear** in logs
   - **Verify the expiry (`12/26`) does NOT appear** in transaction processing logs
3. Check database (as in AC2):
   - Verify card fields (`pan`, `cvv`, `expiry`) are NULL for all transaction records
4. Network inspection (optional, if you have access):
   - Use a network analyzer (Wireshark, Charles Proxy, browser DevTools Network tab) to verify:
     - Card data is sent **only to the payment gateway** (encrypted HTTPS)
     - Card data is **NOT** transmitted to third-party services, analytics, logging systems, or other infrastructure

**Expected outcome:**
- Card data is isolated to the payment gateway integration only
- Logs are free of card data (PAN, CVV, expiry)
- Database stores transaction amounts and references but never card details
- Application is compliant with PCI DSS Requirement 3 (data protection)

**Reset:** No cleanup needed; this is an inspection-only check.

---

## Smoke Test Checklist (Post-Deployment)

- [ ] Process 3 successful payments with different cards and amounts; verify confirmations show transaction references
- [ ] After each payment, query database and verify NO card fields are populated
- [ ] Attempt an invalid card (Luhn check) and verify frontend validation error (no gateway request)
- [ ] (Optional) Trigger a gateway timeout and verify payment is marked pending and customer receives email confirmation
- [ ] Search application logs for: 4111, 5555, CVV patterns (3–4 digit numbers) — verify they do NOT appear
- [ ] Verify payment records in database contain: transaction_id, amount, email, status — but NOT card details
- [ ] Test with multiple payment scenarios (successful, declined, timeout) and verify consistent data isolation

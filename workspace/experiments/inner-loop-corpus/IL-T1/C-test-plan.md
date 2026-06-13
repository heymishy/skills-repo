# IL-T1 Test Plan — retry.1 Failure Classification

**Feature:** 2026-06-13-payment-retry-processor
**Story:** retry.1 — Classify and route failed payments
**Test framework:** Jest (`npm test`)
**Test data strategy:** Synthetic — generated in test setup; no real payment data

---

## AC coverage table

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 — retryable code | T1: TIMEOUT maps to retryable; T2: ISSUER_TEMP_UNAVAIL maps to retryable | Full | — |
| AC2 — permanent code | T3: INSUFFICIENT_FUNDS maps to permanent; T4: CARD_BLOCKED maps to permanent; T5: FRAUD_DECLINE maps to permanent | Full | — |
| AC3 — unknown code | T6: unknown code maps to permanent; T7: console.warn emitted for unknown code | Full | — |
| NFRs | None — confirmed | N/A | No NFRs defined for this story |

No test plan gaps.

---

## Unit tests

### T1 — TIMEOUT maps to retryable

**AC:** AC1
**Precondition:** Payment object with `failureCode: 'TIMEOUT'`
**Action:** Call `classifyFailure(payment)`
**Expected result:** Returns `{ ...payment, status: 'retryable', retryCount: 0 }`

### T2 — ISSUER_TEMP_UNAVAIL maps to retryable

**AC:** AC1
**Precondition:** Payment object with `failureCode: 'ISSUER_TEMP_UNAVAIL'`
**Action:** Call `classifyFailure(payment)`
**Expected result:** Returns `{ ...payment, status: 'retryable', retryCount: 0 }`

### T3 — INSUFFICIENT_FUNDS maps to permanent

**AC:** AC2
**Precondition:** Payment object with `failureCode: 'INSUFFICIENT_FUNDS'`
**Action:** Call `classifyFailure(payment)`
**Expected result:** Returns `{ ...payment, status: 'permanent' }`

### T4 — CARD_BLOCKED maps to permanent

**AC:** AC2
**Precondition:** Payment object with `failureCode: 'CARD_BLOCKED'`
**Action:** Call `classifyFailure(payment)`
**Expected result:** Returns `{ ...payment, status: 'permanent' }`

### T5 — FRAUD_DECLINE maps to permanent

**AC:** AC2
**Precondition:** Payment object with `failureCode: 'FRAUD_DECLINE'`
**Action:** Call `classifyFailure(payment)`
**Expected result:** Returns `{ ...payment, status: 'permanent' }`

### T6 — Unknown code maps to permanent (fail-safe)

**AC:** AC3
**Precondition:** Payment object with `failureCode: 'UNKNOWN_CODE_XYZ'`
**Action:** Call `classifyFailure(payment)`
**Expected result:** Returns `{ ...payment, status: 'permanent' }`

### T7 — Unknown code emits console.warn

**AC:** AC3
**Precondition:** `jest.spyOn(console, 'warn').mockImplementation(() => {})`; payment with `failureCode: 'UNKNOWN_CODE_XYZ'`
**Action:** Call `classifyFailure(payment)`
**Expected result:** `console.warn` called with a string containing `'UNKNOWN_CODE_XYZ'`

---

## Gap table

No gaps.

---

## Test data strategy

**Strategy:** Synthetic — all test inputs are constructed inline using plain JavaScript objects with `{ id, failureCode }` shape. No PCI-DSS scope (failure codes are not card data). Self-contained — tests generate their own data in setup.

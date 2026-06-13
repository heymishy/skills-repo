# IL-T1 AC Verification Script — retry.1

**Story:** retry.1 — Classify and route failed payments
**Setup:** Run `npm test` from the project root. No server required.

---

## Scenario 1 — Retryable failure codes are classified correctly (AC1)

**What to check:** A payment with a temporary failure code comes out of the classifier marked as retryable.

**Steps:**
1. Run `npm test tests/payments/failure-classifier.test.js`
2. Confirm T1 and T2 both pass

**Expected result:** Both T1 and T2 show `✓ TIMEOUT maps to retryable` and `✓ ISSUER_TEMP_UNAVAIL maps to retryable` in the test output. The returned payment object has `status: "retryable"` and `retryCount: 0`.

**What failure looks like:** T1 or T2 fails with `expected 'permanent' to be 'retryable'` — the failure code is miscategorised.

---

## Scenario 2 — Permanent failure codes stay in manual review queue (AC2)

**What to check:** Insufficient funds, blocked card, and fraud decline codes all produce `permanent` status.

**Steps:**
1. Confirm T3, T4, and T5 all pass in the test output

**Expected result:** All three tests pass with `status: "permanent"` returned. The payment object is otherwise unchanged.

**What failure looks like:** Any of T3–T5 returns `retryable` — a fraud decline or blocked card being retried is a significant business and compliance error.

---

## Scenario 3 — Unknown codes fail safe to manual review (AC3)

**What to check:** Any code not in the known retryable or permanent set results in permanent status AND a warning is logged.

**Steps:**
1. Confirm T6 passes (unknown code → permanent)
2. Confirm T7 passes (console.warn called with the unknown code string)

**Expected result:** T6 and T7 both pass. The warning message contains the unknown failure code.

**What failure looks like:** T6 fails because unknown code was classified as `retryable` (unsafe) — or T7 fails because no warning was logged (silent failure, hard to debug in production).

---

## Reset between scenarios

No reset needed — all tests are stateless unit tests. Each test constructs its own input.

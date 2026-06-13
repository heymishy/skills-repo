# IL-T1 DoR Artefact — retry.1

**Feature:** 2026-06-13-payment-retry-processor
**Story:** retry.1 — Classify and route failed payments
**DoR verdict:** Proceed: Yes
**DoR run:** Run 1 — 2026-06-13
**Oversight level:** Low
**Hard blocks:** 13/13 passed
**Warnings:** None

---

## Contract Proposal

**What will be built:**
A `classifyFailure(payment)` function exported from `src/payments/failure-classifier.js`. The function reads `payment.failureCode` and returns a modified payment object with:
- `payment.status = "retryable"` and `payment.retryCount = 0` for codes in the retryable set
- `payment.status = "permanent"` for codes in the permanent set or any unknown code
- A `console.warn` emitted for unknown codes

**What will NOT be built:**
- Retry scheduling or exponential backoff (retry.2)
- Any modification to the payments queue persistence layer
- Any network calls or external system integration

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — retryable code → retryable status | Unit test: `classifyFailure({ failureCode: 'TIMEOUT' })` returns `{ status: 'retryable', retryCount: 0 }` | Unit |
| AC2 — permanent code → permanent status | Unit test: `classifyFailure({ failureCode: 'INSUFFICIENT_FUNDS' })` returns `{ status: 'permanent' }` | Unit |
| AC3 — unknown code → permanent + warn | Unit test with `jest.spyOn(console, 'warn')`: unknown code returns `{ status: 'permanent' }` and triggers warn | Unit |

**Assumptions:**
- Failure codes are string constants; the retryable/permanent sets are defined in the classifier (not injected)
- The `payment` object shape: `{ id, failureCode, ...otherFields }`; function returns a shallow clone with status added

**Estimated touch points:**
- Create: `src/payments/failure-classifier.js`
- Create: `tests/payments/failure-classifier.test.js`

---

## Hard Block Results

| Block | Status | Notes |
|-------|--------|-------|
| H1 (As/Want/So + named persona) | ✅ PASS | "payment operations engineer" is a named persona |
| H2 (≥3 ACs in G/W/T format) | ✅ PASS | 3 ACs, all G/W/T |
| H3 (every AC has ≥1 test) | ✅ PASS | Test plan covers all 3 ACs |
| H4 (out-of-scope populated) | ✅ PASS | 5 explicit out-of-scope items with reasons |
| H5 (benefit linkage) | ✅ PASS | M1 triage time metric referenced |
| H6 (complexity rated) | ✅ PASS | Complexity 1 |
| H7 (no unresolved HIGH review findings) | ✅ PASS | Review passed |
| H8 (no uncovered ACs) | ✅ PASS | All 3 ACs covered in test plan |
| H8-ext (schema dependency check) | ✅ PASS | Dependencies: None — schema check not required |
| H9 (Architecture Constraints populated) | ✅ PASS | "None identified" with reason |
| H-E2E (browser-layout-dependent ACs) | ✅ PASS | No browser-layout ACs |
| H-NFR (NFR profile or explicit None) | ✅ PASS | "NFRs: None — confirmed" |
| H-NFR2 (compliance NFR with human sign-off) | ✅ PASS | No compliance NFRs |
| H-NFR3 (data classification not blank) | ✅ PASS | No personal data; PCI-DSS not in scope for this step |
| H-GOV (discovery Approved By populated) | ✅ PASS | Discovery approved by Hamish King — Product Lead |
| H-ADAPTER (injectable adapter wiring) | ✅ PASS | No adapters |

---

## Coding Agent Instructions

**Goal:** Implement the `classifyFailure` function that maps payment failure codes to retryable/permanent status.

**Branch:** `feature/retry.1`
**Worktree:** `.worktrees/retry.1`
**Test command:** `npm test`
**Oversight:** Low — proceed without sign-off

**ACs to implement:**
1. AC1 — `{ failureCode: 'TIMEOUT' }` or `'ISSUER_TEMP_UNAVAIL'` → `{ status: 'retryable', retryCount: 0 }`
2. AC2 — `{ failureCode: 'INSUFFICIENT_FUNDS' }`, `'CARD_BLOCKED'`, `'FRAUD_DECLINE'` → `{ status: 'permanent' }`
3. AC3 — unknown code → `{ status: 'permanent' }` + `console.warn(unknownCode)`

**Files to touch:**
- Create: `src/payments/failure-classifier.js`
- Create: `tests/payments/failure-classifier.test.js`

**Scope boundary:** Do NOT implement retry scheduling, exponential backoff, queue persistence, or external integrations.

**Out of scope (hard boundary):** Circuit breakers, fraud screening, merchant dashboard, upstream error handling.

**Architecture Constraints:** None. Pure function — no external dependencies.

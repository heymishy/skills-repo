# IL-S13 Test Plan — payments.aml-screener-1 Dual-AML Screener

**Framework:** Jest (`npm test -- tests/aml/dual-aml-screener.test.js`)
**Test data strategy:** Synthetic — mock `rbnzClient`, `austracClient`, and `auditLogger` via Jest; controlled match/clear responses

---

## AC coverage table

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 — RBNZ match blocks; AUSTRAC not called | T1: RBNZ match → blocked; T2: AUSTRAC mock NOT called | Full | Early exit path |
| AC2 — RBNZ clear; AUSTRAC match blocks | T3: RBNZ clear + AUSTRAC match → blocked by AUSTRAC | Full | |
| AC3 — Both clear; audit log entry written | T4: both clear → not blocked; T5: auditLogger called | Full | |
| NFR-1 — Sequential order (RBNZ before AUSTRAC) | T6: call order tracking via Jest mock index | Full | Critical test for C7 |
| NFR-2 — Audit log on every screening call | T5, T7: log called for RBNZ block, AUSTRAC block, clear | Full | |

No test plan gaps. T6 is the critical test for C7 — it verifies that RBNZ completes before AUSTRAC is invoked. Without T6, a `Promise.all` implementation would satisfy AC1-AC3 and produce identical results while violating C7.

---

## Unit tests (T1–T7)

### T1 — RBNZ match returns blocked with correct blockedBy (AC1)

**AC:** AC1
**Precondition:** `rbnzClient.screen` mock returns `{ match: true, listName: 'RBNZ_SANCTIONED' }`; payment: `{ paymentId: 'pmnt-001', creditorAccount: 'ACC-123', debtorAccount: 'ACC-456', amount: 10000 }`
**Expected:** `screenCrossBorder(payment)` resolves to `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }`

### T2 — AUSTRAC not called when RBNZ blocks (AC1)

**AC:** AC1
**Precondition:** Same as T1 (`rbnzClient.screen` mock returns match)
**Expected:** `austracClient.screen` mock was NOT called (`.toHaveBeenCalledTimes(0)`)

### T3 — RBNZ clear + AUSTRAC match returns blocked by AUSTRAC (AC2)

**AC:** AC2
**Precondition:** `rbnzClient.screen` mock returns `{ match: false }`; `austracClient.screen` mock returns `{ match: true, listName: 'AUSTRAC_WATCHLIST' }`
**Expected:** `screenCrossBorder(payment)` resolves to `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }`

### T4 — Both clear returns not blocked (AC3)

**AC:** AC3
**Precondition:** RBNZ mock returns `{ match: false }`; AUSTRAC mock returns `{ match: false }`
**Expected:** `screenCrossBorder(payment)` resolves to `{ blocked: false, blockedBy: null }`

### T5 — Audit log entry written on clear result (AC3 + NFR-2)

**AC:** AC3, NFR-2
**Precondition:** Both mocks return `{ match: false }`
**Expected:** `auditLogger.log` called with object containing `{ paymentId: 'pmnt-001', blocked: false, timestamp: expect.any(Number) }`; `rbnzResult.match === false`; `austracResult.match === false`

### T6 — RBNZ called before AUSTRAC; call order verifiable (NFR-1 / C7)

**AC:** NFR-1 (C7)
**Precondition:** Both mocks return `{ match: false }`; track call sequence using a shared call-order array: both mocks append their name when invoked
**Expected:** Call order array is `['rbnz', 'austrac']` — RBNZ first, AUSTRAC second

**Note:** This test specifically cannot be satisfied by `Promise.all([rbnzClient.screen, austracClient.screen])` which would schedule both calls simultaneously and produce a non-deterministic order. Sequential `await` guarantees RBNZ resolves before AUSTRAC is called.

### T7 — Audit log written on RBNZ block (NFR-2)

**AC:** NFR-2
**Precondition:** RBNZ mock returns `{ match: true }`
**Expected:** `auditLogger.log` called once with `{ paymentId: 'pmnt-001', blocked: true, austracResult: null, timestamp: expect.any(Number) }`; `austracResult` is `null` because AUSTRAC was not called

---

## Gap table

No gaps. T6 (sequential call order) is explicitly required — it cannot be inferred from result correctness tests alone. A model that uses `Promise.all` would pass T1–T5 and T7 but fail T6, correctly exposing the C7 violation.

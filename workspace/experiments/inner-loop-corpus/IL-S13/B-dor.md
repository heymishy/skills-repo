# IL-S13 DoR Artefact — payments.aml-screener-1

**Feature:** 2026-09-01-trans-tasman-payments
**Story:** payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (AML compliance module — compliance team added as reviewer; no CRO sign-off needed for isolated screening module)
**Hard blocks:** 9/9 passed
**H-NFR1 (Sequential screening):** PASS — NFR-1 sequential RBNZ-before-AUSTRAC is a hard RBNZ regulatory obligation; the screener must not parallelise these calls
**H-NFR2 (Audit trail):** PASS — NFR-2 audit log is required on every screening call for AML compliance audit trail
**H-C7 (RBNZ ordering):** PASS — C7 ordering constraint acknowledged; `Promise.all` parallelisation is prohibited
**Warnings:** W1 — `rbnzClient` and `austracClient` are existing modules; screener must not modify them; mock them in tests

---

## Contract Proposal

**What will be built:**

A dual-AML screener module `src/aml/dual-aml-screener.js` that exports a single function `screenCrossBorder(payment)` which:
- Calls `rbnzClient.screen(payment)` first (C7 — RBNZ domestic regulator obligation)
- If RBNZ returns a match → immediately returns `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }` without calling AUSTRAC
- If RBNZ clears → calls `austracClient.screen(payment)` second
- If AUSTRAC returns a match → returns `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }`
- If both clear → returns `{ blocked: false, blockedBy: null }`
- On every call: logs audit entry via `auditLogger.log({ paymentId, rbnzResult, austracResult, blocked, timestamp })` (C8)

**What will NOT be built:**
- Payment routing logic (`routePayment`, trans-Tasman routing branch)
- SWIFT notification artefact (`artefacts/swift/routing-notification-draft.md`)
- AUSTRAC transaction reporting API calls
- FX reporting to RBNZ
- DIA registration checks

**How each AC will be verified:**

| AC / NFR | Test approach | Type |
|----------|---------------|------|
| AC1 — RBNZ match blocks; AUSTRAC not called | T1: RBNZ mock returns match → return `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }`; T2: verify AUSTRAC mock NOT called | Unit |
| AC2 — RBNZ clear; AUSTRAC match blocks | T3: RBNZ clear + AUSTRAC match → `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }` | Unit |
| AC3 — Both clear; audit log written | T4: both clear → `{ blocked: false, blockedBy: null }`; T5: `auditLogger.log` called with correct fields | Unit |
| NFR-1 — Sequential RBNZ → AUSTRAC order | T6: track call order via Jest spy → RBNZ call index precedes AUSTRAC call index | Unit |
| NFR-2 — Audit log on every call | T5, T7: `auditLogger.log` called on RBNZ match, AUSTRAC match, and clear result | Unit |

**Estimated touch points:**
- Create: `src/aml/dual-aml-screener.js`
- Create: `tests/aml/dual-aml-screener.test.js`

---

## Coding Agent Instructions

**Goal:** Implement the dual-AML screener module for the trans-Tasman payment channel.

**Branch:** `feature/payments.aml-screener-1`
**Test command:** `npm test -- tests/aml/dual-aml-screener.test.js`
**Oversight:** Medium

**Architecture Constraint (C7 — RBNZ AML/CFT ACT):** RBNZ screening MUST precede AUSTRAC screening. Do NOT use `Promise.all([rbnzClient.screen(payment), austracClient.screen(payment)])` — this parallelises the calls and violates C7 by removing the guaranteed RBNZ-first ordering in audit logs. The screener must use sequential `await` calls: `rbnzClient.screen()` completes before `austracClient.screen()` is called.

**Architecture Constraint (C8 — AUDIT LOGGER):** All screening outcomes must be logged via `src/audit/audit-logger.js`. The module already exists — `require('../audit/audit-logger')`. Use `auditLogger.log({ paymentId, rbnzResult, austracResult, blocked, timestamp })` on every call. Do NOT write logs to console or a custom mechanism.

**NFR-1 (Sequential order):** `rbnzClient.screen()` → (if clear) → `austracClient.screen()`. RBNZ match → early return without calling AUSTRAC. No parallelisation.

**NFR-2 (Audit log completeness):** Log on EVERY call: blocked by RBNZ, blocked by AUSTRAC, and both-clear. If RBNZ blocks early, `austracResult` is `null` in the audit entry.

**Files to touch:**
- Create: `src/aml/dual-aml-screener.js` (screener implementation)
- Create: `tests/aml/dual-aml-screener.test.js` (Jest test suite)

**Out of scope:** Payment routing, SWIFT notification artefact, AUSTRAC transaction reporting, FX reporting, DIA registration.

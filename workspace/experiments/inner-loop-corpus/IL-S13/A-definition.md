# IL-S13 Definition Artefact — Dual-AML Screener Module

**Feature:** 2026-09-01-trans-tasman-payments
**Epic:** Cross-Border Payment Infrastructure
**Story slug:** payments.aml-screener-1
**Slicing strategy:** Infrastructure slice — standalone screener module; routing and SWIFT notification are separate stories

---

## Story: payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel

**As a** payments engineering team,
**I want** a dedicated dual-AML screener module that checks payments against both RBNZ and AUSTRAC watchlists in the correct regulatory order,
**So that** the trans-Tasman payment channel has a testable, auditable AML screening component that satisfies RBNZ and AUSTRAC regulatory obligations independently of routing logic.

### Acceptance Criteria

**AC1:** Given a payment where `rbnzClient.screen()` returns `{ match: true }`, when `screenCrossBorder(payment)` is called, then it returns `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }` and does NOT call `austracClient.screen()`.

**AC2:** Given a payment where RBNZ clears and `austracClient.screen()` returns `{ match: true }`, when `screenCrossBorder(payment)` is called, then it returns `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }`.

**AC3:** Given both RBNZ and AUSTRAC return `{ match: false }`, when `screenCrossBorder(payment)` is called, then it returns `{ blocked: false, blockedBy: null }` and an audit log entry is written via `auditLogger.log()`.

### Out of Scope

- Payment routing logic (handled by `src/payments/payment-router.js` — separate story)
- SWIFT notification artefact production (separate story)
- AUSTRAC transaction reporting API (separate AML story)
- FX reporting to RBNZ (separate regulatory story)
- DIA payment services registration (operational story)

### NFRs

**NFR-1 (RBNZ AML/CFT Act — Sequential Screening):** RBNZ screening MUST precede AUSTRAC screening. The ordering is mandated by the RBNZ domestic regulator obligation — RBNZ must be evidenced first in audit logs. Do NOT use `Promise.all` or any form of parallelisation. Screening must be strictly sequential: `await rbnzClient.screen()` completes before `austracClient.screen()` is called.

**NFR-2 (Compliance Audit Trail):** One audit log entry must be written on every call to `screenCrossBorder()`, regardless of outcome, via `auditLogger.log()`. Entry must include: `{ paymentId, rbnzResult, austracResult, blocked, timestamp }`. If RBNZ blocks early, `austracResult` is `null`.

### Architecture Constraints

**C7 (RBNZ AML/CFT Act — mandatory sequential order):** RBNZ screening MUST precede AUSTRAC screening. This order is not implementation preference — it is the RBNZ domestic regulator obligation. Parallelising the calls (e.g., `Promise.all`) would satisfy AML checks but violate C7 by removing the guaranteed audit-log ordering, and is therefore prohibited.

**C8 (Audit logger integration):** All screening outcomes must be logged via `src/audit/audit-logger.js`. The screener module must `require` and use the audit logger — do NOT write to stdout or a custom log mechanism.

### Complexity

2 — sequential async calls with early exit; audit logging; no state management.

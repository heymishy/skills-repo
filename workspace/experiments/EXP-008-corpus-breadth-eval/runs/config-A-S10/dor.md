# Definition of Ready: Core Banking Loan Migration — LoanLedger-NZ Decommission

**Status:** Signed off (eval-mode — EXP-008-corpus-breadth-eval / Config A / S10)
**Feature slug:** core-banking-loan-migration
**Date:** 2026-05-17
**Skill version:** /definition-of-ready
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S10
**Prior artefacts read:** discovery.md ✅, definition.md ✅, review.md ✅, test-plan.md ✅

---

## Hard blocks check

| Block | Check | Result |
|-------|-------|--------|
| H1 — Problem statement present | Discovery has a clear problem statement naming the forcing function (vendor deadline), regulatory obligations (RBNZ BS11, CCCFA), and the C5 blocker (BS11 notification not filed — immediate remediation action named) | ✅ PASS |
| H2 — Acceptance criteria present | All 5 stories have ACs; all ACs are observable and testable | ✅ PASS |
| H3 — Constraints propagated | C1 (RBNZ BS11) named in discovery, Story 1.1, Story 1.2, test-plan T-BS11-* series, and DoR gate; C2 (CCCFA 7-year retention) named in discovery, Story 2.2, test-plan T-MCON-* series; C5 named as [BLOCKER] in discovery with immediate remediation actions, propagated to Story 1.1 AC3 (development gate) and T-BS11-003, T-BS11-007 | ✅ PASS |
| H4 — Test plan exists | test-plan.md complete with 21 named tests covering all 5 stories | ✅ PASS |
| H5 — Review passed | review.md complete; 3 HIGH findings all resolved in review (resolutions reflected in test plan and story ACs) | ✅ PASS |
| H6 — Non-functional requirements specified | T-NFR-001 (audit log query performance), T-NFR-002 (7-year retention enforcement), T-NFR-003 (compliance dashboard rendering); rollback SLA named (4 hours) in H1 resolution | ✅ PASS |
| H7 — Out-of-scope items named | Discovery lists 6 explicit out-of-scope exclusions; definition scope accumulator confirms no drift | ✅ PASS |
| H8 — No ambiguous ACs | All ACs reviewed — see warnings section below for one AC with residual interpretation risk | ⚠️ SEE W1 |
| H9 — Architecture guardrails consulted | EA registry injection confirms system classification as CRITICAL / Restricted; BS11 data classification and migration constraints consulted throughout. Migration architecture decision (transactional batch boundary, rollback mechanism) recorded in H1 resolution. | ✅ PASS |
| H-E2E — E2E test coverage for critical paths | T-BS11-003 (development gate), T-PPSR-001 (migration commencement gate), T-DECOMM-001 (decommission gate) cover the three critical regulatory path gates end-to-end | ✅ PASS |
| H-NFR — NFR specificity | All NFRs have specific thresholds: rollback ≤ 4 hours, audit log queries < 500ms / 5s, 7-year retention enforced, parallel reporting ≥ 1 cycle | ✅ PASS |
| H-NFR2 — Security NFRs | Vendor contract requires read-only JDBC + NDA (T-TOOL-003); migration audit log is restricted access; source data read-only after cutover (T-MCON-005) | ✅ PASS |
| H-NFR3 — Data classification confirmed | LoanLedger-NZ classified Restricted (customer credit data, payment history, security registrations) — confirmed via EA registry injection | ✅ PASS |

---

## Warnings

**W1 — Story 3.1 AC1 "written legal opinion from qualified New Zealand solicitor" requires manual verification**

AC1 specifies the legal opinion must be "in writing and signed by a qualified New Zealand solicitor." This is a document review condition, not an automated test condition. T-TOOL-003 uses the same manual-review pattern for vendor contract provisions. The test plan does not include an automated test for legal opinion content quality — this is appropriately flagged as a compliance review step in the plain-language verification script. The DoR gate resolves this by requiring Compliance Officer sign-off before the gate opens. The interpretive element is "qualified New Zealand solicitor" — the DoR names the responsible party (Legal Counsel) and the sign-off condition (legal opinion filed and Legal Counsel sign-off recorded in Story 3.1 AC2). **Acknowledged — does not block sign-off.**

**W2 — Story 1.1 AC3 project governance tool not named (I2 from review)**

The review I2 finding noted that the project governance tool is not named. The DoR gates the development gate on `BS11_NOTIFICATION_STATUS = ACK_RECEIVED` — the implementation mechanism (Jira workflow guard, GitHub Projects automation, or equivalent) is left to the coding agent to confirm with the operator. The gate contract is clear: no Story 2.x or 3.x sprint formally commences without BS11 acknowledgement. The coding agent must confirm the project governance tool in the implementation plan and implement the gate accordingly. **Acknowledged — the operator must confirm the project governance tool before the first implementation sprint.**

---

## DoR contract and Coding Agent Instructions

### Scope contract

**In scope — files the coding agent must touch:**
- `src/compliance/bs11-notification.js` (or equivalent) — BS11 notification record, status machine, s.4.3 checklist, supervisory meeting tracking
- `src/compliance/bs11-gates.js` — development gate enforcement, cutover gate enforcement, decommission gate enforcement
- `src/migration/toolchain.js` — migration toolchain deployment integration, pilot run orchestration, reconciliation
- `src/migration/account-migration.js` — staged migration execution, field-level reconciliation, audit log writes
- `src/migration/ppsr.js` — PPSR disposition schedule, classification, migration hold enforcement
- `src/reporting/report-equivalence.js` — parallel reporting orchestration, report status tracking, RBNZ sign-off gate
- `src/dashboards/compliance-dashboard.js` — BS11 notification display, report equivalence status display
- `tests/` — all test files corresponding to T-BS11-*, T-MCON-*, T-RPT-*, T-PPSR-*, T-TOOL-*, T-NFR-*, T-DECOMM-* series

**Out of scope — files the coding agent must NOT touch:**
- `src/loan-origination/` — new loan origination features are explicitly excluded from migration MVP scope
- `src/products/` — no lending product changes in this feature
- `src/customer-communications/` — customer-facing migration communications not in MVP scope
- `src/hardship/` — Hardship Operations System re-platforming not in scope
- `src/analytics/` — Analytics Platform re-architecture not in scope
- Any existing Credit Collections System code beyond the re-pointing configuration

### Regulated constraint gates (mandatory — must be verified before PR merge)

**C1 gate (RBNZ BS11 advance notification):**
- Gate condition: `BS11_NOTIFICATION_STATUS = ACK_RECEIVED` before any Story 2.x or 3.x development sprint commences
- Gate owner: Compliance Officer (files the notification; records RBNZ acknowledgement reference)
- Verification: T-BS11-003 passes; compliance dashboard shows ACK_RECEIVED status
- Hard gate: the coding agent must implement the gate such that it cannot be bypassed without a populated `rbnz_acknowledgement_reference` (T-BS11-003 adversarial case must pass)

**C2 gate (CCCFA zero data loss):**
- Gate condition: Migration reconciliation report shows FAILED_DROPPED = 0 and FAILED_INTEGRITY = 0 for every weekend migration batch before the next batch proceeds
- Gate owner: Data Architect (signs off each batch reconciliation report) and Retail Lending Operations Lead (co-signs)
- Verification: T-MCON-001, T-MCON-002, T-MCON-006 (rollback adversarial case) all pass
- Hard gate: No weekend batch may advance to the next batch without both sign-offs confirmed

**C5 gate (RBNZ BS11 notification timing — immediate remediation):**
- Gate condition: `self_disclosure_filed: true` on BS11 notification record AND `BS11_NOTIFICATION_STATUS` transitions to ACK_RECEIVED before any Story 2.x work commences
- Gate owner: CRO / Compliance Officer (self-disclosure is a senior executive obligation under BS11 s.5.1)
- Verification: T-BS11-007 passes (late-filing self-disclosure required); T-BS11-003 passes (development blocked until ACK_RECEIVED)
- Hard gate: A notification filed without `self_disclosure_filed: true` must not be accepted by the system when the project initiation date is more than 30 business days before the filing date

**PPSR gate:**
- Gate condition: PPSR disposition schedule (Story 3.1 AC2) signed off by Legal Counsel before Weekend 1 migration commences
- Gate owner: Legal Counsel
- Verification: T-PPSR-001 passes

**Decommission gate:**
- Gate condition: All six Story 3.1 AC4 conditions confirmed before decommission command executes
- Gate owner: RBNZ Relationship Manager (condition f) and CRO/CTO (condition g) — both named executive sign-offs required
- Verification: T-DECOMM-001 passes; T-DECOMM-001a adversarial case passes (12-month retention period calculated from `final_cutover_date`, not a manually-set boolean)

### Additional coding agent instructions

1. **BS11 self-disclosure flag (C5 remediation):** Implement `self_disclosure_filed` as a mandatory field on the BS11 notification record. When the calculated elapsed time between `project_initiation_date` and `filing_date` exceeds 30 business days, the system must require `self_disclosure_filed = true` before the notification can be submitted. This field must not be settable via a UI toggle alone — it must require the senior officer accountable to confirm the self-disclosure as part of the notification submission flow. Do not implement a workaround that allows `self_disclosure_filed` to be set without the date validation check passing.

2. **Development gate is a hard gate (C5 enforcement):** Story 1.1 AC3 is the primary C5 remediation gate in the system — no development can proceed until BS11 is acknowledged. Implement this as a pre-sprint hook, not a warning or advisory. The gate must check `rbnz_acknowledgement_reference` is a non-empty string, not just that `notification_status` = ACK_RECEIVED (to prevent status spoofing). Test T-BS11-003 adversarial case covers this requirement.

3. **PPSR cross-story gate (H3 resolution):** The PPSR disposition schedule sign-off (Story 3.1) is a pre-condition for the staged migration commencement (Story 2.2). Implement this as a cross-story dependency check in the migration commencement flow: query `ppsr_disposition_schedule_status` before allowing the first weekend migration batch to be opened. T-PPSR-001 covers this gate.

4. **Reporting completeness flag (H2 resolution):** Implement `reporting_completeness_confirmed` as an explicit gate field in the cutover approval flow. The field is computed, not manually set: it is true only when all 14 report types have `rbnz_sign_off_received: true`. A manual override of this field (setting to true programmatically without all 14 sign-offs) must be rejected.

5. **req.session.accessToken is the canonical field name** for any routes reading the GitHub token from session. Do not use `req.session.token`.

### Sign-off

**Oversight level:** High (regulated infrastructure migration — RBNZ BS11, CCCFA, PPSR obligations; immediate C5 blocker; 280,000 customer accounts at risk)

**DoR result: Proceed — with mandatory C5 pre-condition**

The C5 pre-condition is: BS11 notification must be filed and self-disclosure confirmed BEFORE the coding agent is dispatched for Stories 2.x or 3.x implementation. Story 1.1 (the tracking infrastructure and gate enforcement) can be implemented immediately as it is the system that enforces the gate. However, the project cannot advance to data migration engineering until BS11 acknowledgement is received from RBNZ.

**Compliance Officer sign-off:** Required on BS11 notification content before filing
**CRO/CTO sign-off:** Required as senior officer accountable named in the notification (BS11 s.4.3(e))
**Legal Counsel engagement:** Required before PPSR disposition schedule is produced (Story 3.1)

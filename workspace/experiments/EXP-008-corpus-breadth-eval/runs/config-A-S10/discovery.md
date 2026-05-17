# Discovery: Core Banking Loan Migration — LoanLedger-NZ Decommission

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S10)
**Feature slug:** core-banking-loan-migration
**Date:** 2026-05-17
**Skill version:** /discovery
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S10

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**
- `S10-ea-registry-loan-ledger-legacy.md` — EA registry entry for LoanLedger-NZ (legacy) and CoreBanking-NXT (target). Migration constraints (MCON-001 to MCON-006), regulatory obligations table including RBNZ BS11, CCCFA, PPSR, interface map. Active throughout all pipeline stages.
- `S10-rbnz-bs11-excerpt.md` — Synthetic regulatory excerpt from RBNZ BS11 Outsourcing and Technology Risk Policy: Section 4 (Material Change Notification — 30-business-day advance notification, trigger at project initiation), Section 5 (Self-disclosure of late notification), Section 6 (Core system migration data integrity and regulatory reporting continuity obligations). Active throughout all pipeline stages.

**Injection design test result (pre-flight):**
- EA registry file (`S10-ea-registry-loan-ledger-legacy.md`): PASS ✅ — MCON-003 signals the RBNZ BS11 30-business-day notification obligation and that it applies at "start of migration work," but does not state that the notification has not been filed. The model must connect the brief's follow-up context ("We have not filed a formal notification") to MCON-003 to infer the timing violation.
- BS11 excerpt (`S10-rbnz-bs11-excerpt.md`): PASS ✅ — Section 4.2 explains the notification timing rule (triggered at project initiation/commitment, not cutover) and Section 5 covers self-disclosure of late notification, but neither section states that this specific institution has not filed. C5 requires model inference from the brief plus regulatory framework. Evaluator note on document confirms C5 is not included in the injection.

**C5 surfacing classification:** Both files pass the injection design test. C5 surfacing in this run is attributable to model reasoning, not injection-aided.

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated.

---

## Step 1 — Initial clarifying questions (eval-mode: brief read verbatim with follow-up context)

Operator brief read. Follow-up context provided. Key follow-up signals processed:

1. **RBNZ notification:** Team has not filed a formal BS11 notification. Team understood RBNZ involvement as end-stage regulatory report validation, not a pre-project obligation. **This is a C5 trigger — see [BLOCKER] section below.**
2. **Migration toolset:** Vendor's CoreBanking-NXT migration utility not yet procured or deployed. Vendor reference implementations involved 50,000–80,000 accounts (versus 280,000 here — scale gap not yet assessed).
3. **PPSR registrations:** 62,000 home loan accounts have perfected security interests registered. Legal opinion on transfer requirements not obtained.
4. **Regulatory reports:** 3 of 14 RBNZ-prescribed report types require custom development on CoreBanking-NXT. Scope not confirmed.

No additional clarifying questions required — brief and follow-up together supply sufficient information to proceed with the following critical caveat: the [BLOCKER] below must be resolved before development activity proceeds.

---

## [BLOCKER] — Immediate Regulatory Action Required: RBNZ BS11 Notification Not Filed

The RBNZ BS11 Outsourcing and Technology Risk Policy (Section 4.1) classifies the decommission of a core banking system that processes 280,000 retail loan accounts as a **material change** on multiple grounds: (a) decommissioning a system supporting a critical business function; (b) migration of customer account data at a scale where disruption could cause material customer harm or a statutory data retention breach (s.4.1(e) — 100,000+ account threshold explicitly cited); (c) change to the system generating regulated outputs (BS3, BS7 prudential reports).

**Section 4.2 notification timing requirement:** The institution must notify RBNZ at least 30 business days before the material change is implemented. For a core system decommission project, the 30-business-day notification window is triggered "at the earliest phase that constitutes an irreversible commitment — in practice, at the point development or procurement activity commences, not at the point of cutover." The team has allocated engineering resource, engaged with the vendor migration toolset (even pre-procurement), and established formal project governance. The notification window **has already opened**.

**Current status:** The team has confirmed no formal BS11 notification has been filed. The team was treating RBNZ as a validation partner at the end of the project (month 10) for regulatory report equivalence confirmation — not as a pre-project precondition.

**This is a continuing breach of BS11 s.4.2 for every day the project proceeds without filing.**

**Required immediate actions (before any further development or procurement activity):**

1. **File BS11 notification this week.** Content per Section 4.3: project description and scope (LoanLedger-NZ decommission, 280,000 accounts); full project timeline (initiation → 6-month parallel operation start → cutover → 12-month decommission); risk assessment covering data integrity, regulatory reporting continuity, service continuity, and fallback capabilities; governance approvals to date (board or risk committee); name of senior officer accountable; RBNZ contact details.
2. **Self-disclose the late filing per BS11 s.5.1.** Delay in self-disclosure after becoming aware of the obligation aggravates the breach. The self-disclosure acknowledgement should accompany the notification filing.
3. **Plan three supervisory engagement meetings with RBNZ.** For migrations exceeding 100,000 accounts (280,000 here), RBNZ expects minimum three update meetings: project initiation, start of parallel operation, 30 days before planned cutover (BS11 s.4.4).

**Effect on project timeline:** The 30-business-day clock runs from filing, not from today. Filing immediately gives the project the maximum runway within the 12-month vendor deadline. If RBNZ raises supervisory concerns, they may require project pause or modification (BS11 s.4.4) — early filing maximises time to respond.

---

## Problem Statement

The enterprise must decommission LoanLedger-NZ, an 18-year-old legacy loan ledger system hosting 280,000 active loan accounts (personal, home, and commercial), before the vendor support contract expires in 12 months. After that date, the system operates without patches, security updates, or vendor support — an unacceptable risk posture for a system holding regulated credit records and producing RBNZ prudential reports.

The forcing functions are non-negotiable: the vendor contract end-date is fixed, the vendor is withdrawing the product from market, and no extension is available. The business has an 18-month window total: 12 months to cutover, plus 6 months post-cutover to formally decommission. The migration must be complete, validated, and RBNZ-approved within the vendor deadline.

The problem is compound: it is simultaneously a regulatory compliance emergency (BS11 notification not filed, 3 RBNZ report types not yet confirmed for the new platform), a data integrity obligation (280,000 active accounts plus ~1.4 million historical records under CCCFA 7-year retention), a legal obligation (62,000 PPSR security registrations with unknown transfer requirements), and a technology execution challenge (vendor migration toolset not yet deployed, scale exceeds vendor reference implementations).

---

## Personas

| Persona | Role in this feature |
|---------|---------------------|
| CRO / CTO | Accountable executive for migration risk and BS11 notification senior officer |
| RBNZ Relationship Manager | BS11 notification contact, supervisory engagement owner, regulatory report equivalence sign-off |
| Compliance Officer | BS11 notification preparation, CCCFA records compliance, PPSR legal opinion coordination |
| Retail Lending Operations Lead | Business sign-off on parallel operation, cutover readiness, account integrity validation |
| Data Architect | Migration toolchain design, data mapping, integrity reconciliation framework |
| Platform Engineering Lead | CoreBanking-NXT migration implementation, parallel operation technical design |
| New Platform Vendor (migration team) | CoreBanking-NXT migration utility provider, custom report development |
| Legal Counsel | PPSR transfer legal opinion, CCCFA records obligation confirmation |
| Loan Account Holders (280,000) | Customers whose loan records must be migrated without data loss, service interruption, or security registration lapse |

---

## Current State

LoanLedger-NZ has been operating for 18 years. It hosts 280,000 active loan accounts across personal loans, home loans, and commercial lending. All RBNZ prudential reporting (BS3 Asset Quality, BS7 Statistical Return and 12 other report types) is generated from the legacy system's internal reporting modules. The system processes repayment receipts via the Direct Debit Processing batch interface, pushes arrears flags to the Credit Collections System, feeds security registration references to the Mortgage Register Integration, and delivers account data to the Customer Statements System and Analytics Platform.

CoreBanking-NXT has been in production for deposit accounts for 14 months. It produces 11 of the 14 RBNZ-prescribed report types as standard. Three report types require configuration or custom development — this work is not scoped. The vendor migration toolset (JDBC read from legacy, write to CoreBanking-NXT) has not been procured or deployed.

RBNZ involvement has been scoped as end-stage: the RBNZ relationship team planned to confirm regulatory report equivalence at month 10. No BS11 advance notification has been filed.

---

## MVP Scope

The MVP is not a product feature — it is a regulated infrastructure migration. Scope is defined by what must happen before the vendor support deadline:

1. **BS11 notification filed and RBNZ supervisory engagement maintained** throughout the project lifecycle (three mandatory meetings for 280,000-account scale)
2. **All 14 RBNZ regulatory report types confirmed producible from CoreBanking-NXT** before cutover (including the 3 requiring custom development), with parallel reporting completed for one full cycle
3. **Migration toolchain deployed and validated** with a pilot run on representative accounts before parallel operation begins
4. **All 280,000 active loan accounts migrated** with full history (plus closed accounts within 7-year CCCFA window) — zero data loss, reconciliation-verified, audit trail maintained per BS11 s.6.1
5. **PPSR security registration legal opinion obtained** and all 62,000 home loan security registrations confirmed as preserved through migration
6. **LoanLedger-NZ decommissioned** within the vendor support deadline, with 12-month post-cutover source data retention per BS11 s.6.1(c)

**Explicitly out of scope:**
- New loan origination features on CoreBanking-NXT (already handled by Loan Origination System redirect)
- New lending product types, pricing changes, or product launches
- Customer-facing migration communications beyond regulatory obligations
- Hardship Operations System re-platforming (beyond the re-pointing of LLNZ-UP-003)
- Analytics Platform re-architecture (beyond LLNZ-DN-005 re-pointing at cutover)
- Credit Collections System product changes (beyond LLNZ-DN-002 re-pointing)

---

## Constraints

| ID | Constraint | Source |
|----|-----------|--------|
| C1 | **RBNZ BS11 — 30-business-day advance notification for material change to core banking system. Notification window has already opened (project initiated). Filing is an immediate pre-project obligation, not end-stage validation.** | RBNZ BS11 s.4.1, s.4.2 — notification triggered at project initiation, before development/procurement commences |
| C2 | Zero data loss — all 280,000 active loan records with full history (plus closed loans within 7-year CCCFA window, estimated 1.4 million records total) must be migrated without loss or corruption. Any data loss constitutes a breach under CCCFA s.20 (7-year credit contract record retention obligation). | CCCFA 2003 s.20; BS11 s.6.1 |
| C3 | Vendor support contract hard deadline — legacy system support ends in 12 months with no extension available; the vendor is withdrawing the product from market. Operating beyond this date on unpatched, unsupported core banking software is an unacceptable security and operational risk. | Vendor contract — binding, no extension |
| C4 | RBNZ parallel operation expectation — for migrations of this scale (280,000 accounts, > 100,000-account threshold), RBNZ expects a minimum parallel operation period of 3 months. The planned 6-month period satisfies this, but must be documented in the BS11 notification and run to completion with documented sign-off before cutover. A shorter period requires written RBNZ agreement. | RBNZ BS11 s.6.3; RBNZ prudential guidance |
| C5 | **[BLOCKER — IMMEDIATE] RBNZ BS11 notification has not been filed. The notification window opened at project initiation (binding commitment: engineering resource allocated, vendor engagement commenced, project governance established). The team has been treating RBNZ as a validation partner at project end (month 10) — this is a fundamental misreading of the BS11 obligation. Filing must occur immediately, accompanied by self-disclosure of late filing per BS11 s.5.1.** | RBNZ BS11 s.4.2 (trigger at initiation), s.5.1 (self-disclosure obligation) |

---

## Assumptions

| ID | Assumption | Risk if wrong |
|----|-----------|---------------|
| A1 | RBNZ will acknowledge the BS11 notification and proceed with supervisory engagement rather than directing project pause. Risk is elevated by late filing — early self-disclosure and a well-prepared notification reduce this risk. | RBNZ may direct project pause under BS11 s.4.4 until governance is demonstrated to be adequate. Timeline impact: potentially significant. |
| A2 | The 3 RBNZ report types requiring custom development can be built and validated within the 12-month project window. If custom development scope is larger than estimated, report equivalence verification may not complete before cutover. | RBNZ prudential reporting continuity breach — CoreBanking-NXT cannot go live for loans without RBNZ report equivalence sign-off. |
| A3 | The 62,000 PPSR security registrations are transferable or re-registerable without requiring court orders or customer consent. A legal opinion must confirm this before cutover proceeds. | Security interests may lapse on migration, creating priority risk for the enterprise. PPSR Act obligations not met. |
| A4 | The vendor's migration toolset can handle 280,000 accounts at the required fidelity. Vendor reference implementations involved 50,000–80,000 accounts — 3.5–5.6× smaller than this migration. A pilot run on a representative sample must be completed before parallel operation begins. | Data integrity failure at scale; migration timeline extension; potential CCCFA breach if records are corrupted. |
| A5 | All 8 downstream interfaces (LLNZ-DN-001 to LLNZ-DN-005 plus LLNZ-UP-001 to LLNZ-UP-003) can be re-pointed to CoreBanking-NXT before or at cutover without service interruption. | Downstream systems (Credit Collections, Customer Statements, Analytics) lose data feed; customer service disruption. |
| A6 | The enterprise's Board Risk Committee has already approved the migration project. BS11 notification requires board-level governance approval documented. If board approval has only been in principle, a formal risk committee resolution is required before filing. | BS11 notification filing may be incomplete if governance approvals are not formally documented. |

---

## Success Indicators

| Indicator | Measurable condition |
|-----------|---------------------|
| RBNZ BS11 notification filed | Notification filed within 5 business days of discovery approval; RBNZ acknowledgement received before first development sprint commences |
| Zero data loss at migration | Reconciliation report confirms 100% of active loan records (280,000) and all closed records within 7-year window migrated with field-level integrity verification; zero records with corruption, omission, or data type mismatch |
| Regulatory reporting continuity | All 14 RBNZ-prescribed report types produced from CoreBanking-NXT; parallel reporting for one full calendar month; RBNZ prudential reporting team written acknowledgement received before first CoreBanking-NXT return submitted |
| PPSR security interests preserved | Legal opinion on PPSR transfer obtained; all 62,000 registrations confirmed as preserved (or re-registered) before cutover proceeds |
| Legacy system decommissioned within deadline | LoanLedger-NZ formally decommissioned by month 12; vendor support contract ended; 12-month post-cutover source data retained per BS11 s.6.1(c) |
| RBNZ supervisory engagement maintained | Three supervisory meetings completed (project initiation, parallel operation start, 30 days pre-cutover) as required for 280,000-account scale |

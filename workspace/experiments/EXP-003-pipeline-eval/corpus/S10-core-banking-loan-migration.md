# S10 — Core Banking Loan Migration: RBNZ Notification Timing Gap

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Tests CPF for a large-scale regulated infrastructure migration. The brief embeds the RBNZ Technology Risk Policy's 30-business-day advance notification requirement as a partially-signalled constraint (C1) and as a hidden timing violation (C5): by the time the brief is written, the notification window has already opened and the team has not filed. The model must infer that "decommissioning a core system" triggers a specific RBNZ notification obligation that starts before development begins, not at cutover.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — We are decommissioning the enterprise's legacy loan ledger system, which has been in production for 18 years. Approximately 280,000 active loan accounts — personal loans, home loans, and commercial lending — are currently managed by this system. We have been running a new core banking platform for deposit accounts for 14 months and it is working well. We want to migrate all loan accounts to the same platform so we can retire the legacy system and operate a single core.

The legacy system vendor has confirmed that their support contract ends in 12 months. After that date, the system receives no patches, no security updates, and no vendor support. Extending the contract is not an option — the vendor is withdrawing the product from the market. The 12-month window is our hard cutover deadline.

Our migration plan calls for a 6-month parallel operation period. During this period both systems will run simultaneously: new loan originations go onto the new platform from day one, while existing accounts run on the legacy system in shadow mode with all transactions mirrored to the new platform. At the 6-month mark we will validate data integrity, run a reconciliation pass, and if the results are satisfactory, cut over remaining legacy accounts in a staged weekend migration. We have 6 months from cutover to decommission and formally retire the legacy infrastructure.

Data integrity is the primary technical risk. We must migrate all 280,000 loan records with full history — original loan terms, drawdown history, repayment schedules, arrears status, and any associated security registrations. No loan record can be lost or corrupted in migration. Our legal team has confirmed that credit contract records must be retained for 7 years under applicable consumer finance legislation, so even records for closed loans that were migrated need to be preserved.

We will need to ensure the new platform produces all RBNZ regulatory reports that the legacy system currently generates. The format and field definitions of these reports are prescribed. Our RBNZ relationship team will need to be involved in confirming the reports produced by the new platform meet RBNZ requirements.

The project will be run in-house with the new platform vendor providing a migration toolset. We anticipate the project team will be six engineers, one data architect, and a project manager.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **RBNZ notification:** We are planning to involve our RBNZ relationship team in the final validation phase, around month 10. We have not filed a formal notification about the migration project. We are not aware of a specific notification obligation — we understood RBNZ involvement was about confirming the regulatory reports are correct.
>
> **Data migration toolset:** The new platform vendor provides a migration utility that reads from the legacy system's database via a read-only JDBC connection and writes to the new platform. We have not run a pilot on a subset of accounts yet. The vendor's reference implementations at other banks involved fewer accounts (typically 50,000–80,000) than our 280,000.
>
> **Security registrations:** Approximately 62,000 home loan accounts have registered security interests on the Personal Property Securities Register (PPSR). Migrating these records does not automatically transfer the PPSR registration — a legal opinion on transfer requirements has not been obtained.
>
> **Regulatory reports:** The legacy system currently produces 14 RBNZ-prescribed report types. We have confirmed that the new platform produces 11 of these as standard outputs. The remaining 3 report types require configuration or custom development on the new platform. This work is not yet scoped.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | RBNZ Outsourcing and Technology Risk Policy (BS11) — material changes to core banking systems including decommissioning a system that processes retail lending require 30 business days advance notification to RBNZ before the change is implemented; the brief mentions "RBNZ relationship team involvement" but does not name the specific notification obligation or its lead time | Regulatory (RBNZ policy) | Partial — obligation not named |
| C2 | Zero data loss — all 280,000 loan records with full history must be migrated; any data loss constitutes a breach under CCCFA 2003, which requires credit contract records to be retained for 7 years | Regulatory (CCCFA) | No — explicit |
| C3 | Vendor support contract deadline — legacy system end-of-life contractually fixed at 12 months; no extension available; this is a hard cutover gate, not a target | Contractual/technical | No — explicit |
| C4 | RBNZ parallel operation expectation — RBNZ prudential guidance expects that a systemic migration of this scale includes a parallel operation and validation period before cutover; the parallel run period and its sign-off criteria must be explicitly governed | Regulatory (RBNZ prudential guidance) | Partial — described in brief but RBNZ basis not named |
| C5 | [Hidden] RBNZ BS11 30-business-day notification has not been filed; given the 12-month project window with 6-month parallel run, the notification window opened at or before project initiation; RBNZ BS11 requires notification before development and procurement begins, not just before cutover; the team is treating RBNZ as a validation partner at project end, not a pre-project precondition | Hidden regulatory timing violation (already open) | **Yes — hidden** |

**Regulated constraints:** C1 (RBNZ BS11), C2 (CCCFA)
**Regulated CPF threshold:** 0.80 (failure threshold for C1 and C2)

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — forced migration under a hard vendor deadline with regulatory data integrity and reporting obligations; the forcing function is the vendor contract end-date; risks are data loss, regulatory reporting continuity, and unacknowledged RBNZ notification obligations.
2. **Personas** — loan account holders, the enterprise retail lending operations, RBNZ relationship team (notification and report equivalence), new platform vendor migration team, CTO/CRO (migration risk accountability).
3. **MVP scope** — data migration toolchain + parallel validation framework + regulatory report equivalence confirmation + RBNZ notification and sign-off. NOT: new loan origination features, lending product changes, or customer-facing migration communications (unless required by regulation).
4. **Constraints** — C1 through C4 all named. C5 surfaced: "RBNZ BS11 notification status unknown — this must be confirmed before project activity proceeds; if the 30-business-day notification has not been filed, it is an immediate remediation action."
5. **Assumptions** — at minimum: RBNZ BS11 notification status (confirm with regulatory team before proceeding — may require immediate filing), 3 missing RBNZ report types (must be confirmed producible before cutover), PPSR transfer requirement for security registrations.
6. **Success indicators** — 100% loan account migration verified by reconciliation, RBNZ reports equivalently produced, legacy system decommissioned within 12-month deadline, RBNZ BS11 notification filed and acknowledged before project start.

---

## CPF measurement notes for evaluator

- C1 (RBNZ BS11 — advance notification) is the critical domain-knowledge constraint. The brief frames RBNZ as a validation step. Count as propagated only if the model names the BS11 notification as a project precondition and identifies the 30-business-day lead time requirement.
- C5 — count as propagated only if the model explicitly flags that the notification is a pre-project obligation and its status must be confirmed immediately; ideally named as [BLOCKER] or prerequisite. Treating RBNZ as a validation partner at project end does not count.
- This scenario also tests migration-story constraint propagation: C1 and C5 should appear in migration execution story ACs, not only in the discovery artefact.

---

## Context injection spec (Config C only)

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | Core Banking System standards, Data Migration Architecture, Third-Party System Decommission standards, RBNZ report generation obligations | ~10 KB |
| Synthetic EA registry entry | Two entries: Legacy Loan Ledger System (280k accounts, 14 RBNZ report outputs, vendor support end-date, PPSR interface dependency) + New Core Banking Platform (deposits live, loans migration planned, 11 of 14 RBNZ report types available) | ~6 KB |
| Synthetic policy doc | RBNZ BS11 2023 — Section 3 (Material Change Notification: 30-business-day advance notification for core system changes, definition of "material IT change", filing process) + CCCFA records retention obligations (Section 7 — 7-year retention requirement) | ~20 KB |
| **Estimated total** | | **~38 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |

# Synthetic EA Registry Entry
# Application: Member Portal — Fund Switching Interface (KiwiSaver)
# Registry version: 2026-Q1
# Status: PROPOSED — extension of existing member portal for new fund switching capability
# Entry type: Internal Application Interface (extends existing Member Portal)

---

## Application Profile

**Name:** Member Portal — Fund Switching
**Parent application:** Westpac KiwiSaver Member Portal
**Owner:** KiwiSaver Member Services, Westpac NZ
**Domain:** KiwiSaver / Wealth Management
**Classification:** Regulated — KiwiSaver Act 2006, FMA PIE Manager Obligations
**Criticality:** HIGH — processes member investment instructions affecting retirement savings
**Data classification:** Confidential — contains KiwiSaver account data, investment instructions, member identity

**Description:**
A new capability within the existing Westpac KiwiSaver Member Portal that enables members to submit fund switching instructions online, replacing the current paper form process. The feature allows members to select a target fund, confirm the switch instruction, and receive a confirmation with estimated processing timeline. The instruction is committed to the unit registry on the same business day for eligible members. Analyst and operations fallback processes remain available for ineligible members and edge cases.

**Hosting:** Azure (shared with existing Member Portal)
**Technology stack:** React (frontend, extending existing portal), Node.js (API layer), existing member portal auth (Azure AD B2C), unit registry integration
**Environments:** Production, UAT, Development

---

## Interface Map

### Upstream / authentication and identity

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| MPSW-UP-001 | Member Identity Service (Azure AD B2C) | Authentication | Member authentication token, identity claims, MFA status | Existing; no changes required |
| MPSW-UP-002 | Contributions Management System | Internal API — read only | Member contributions holiday status, active hardship application flag, membership tenure (days since join date) | New integration — eligibility checking before switch instruction accepted |

### Core transaction interfaces

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| MPSW-CORE-001 | Unit Registry API | Internal API — read/write | Switch instruction submission (member ID, source fund, target fund, instruction date/time); switch status confirmation; unit prices for confirmation display | Primary transaction interface; new integration |
| MPSW-CORE-002 | KiwiSaver Account Service | Internal API — read only | Current fund allocation, account balance, fund performance data for display | Existing integration extended to support switch confirmation |

### External / regulatory interfaces

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| MPSW-EXT-001 | FMA SEN Filing System | External — FMA managed | Significant Event Notice filing (PDF + structured data), acknowledgement reference | Required before go-live: SEN must be filed and 30-day member notification period completed |
| MPSW-EXT-002 | Member Notification Service (email/SMS) | Internal — outbound | Switch confirmation to member, pre-change notice (SEN-related 30-day notification), eligibility rejection notice | Extends existing member comms capability |

### Audit and compliance

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| MPSW-AUD-001 | KiwiSaver Audit Log | Internal write | Switch instruction event log: member ID (hashed), instruction timestamp, fund codes, eligibility check result, unit registry confirmation reference | Regulatory retention requirement: 7 years |

---

## Regulatory obligations affecting this interface

| Obligation | Regulator | Trigger |
|-----------|-----------|---------|
| KiwiSaver Act 2006 s.45 — scheme manager must give effect to a valid switch request at the next available processing date | FMA / IRD | Activated by any member submitting a switch instruction through this interface |
| KiwiSaver Act 2006 s.58 — hardship provisions — members with approved hardship withdrawal or active hardship application have specific fee and processing protections | FMA | Activated when a switching fee is applicable and the member has a hardship record in Contributions Management |
| KiwiSaver Act 2006 s.51A — switch eligibility restrictions — members within 90 days of joining cannot switch funds | FMA | Activated by tenure check via MPSW-UP-002 |
| FMA Significant Event Notice — material change to member-facing switching process requires 30-day advance member notification | FMA | Pre-go-live: must be filed before this interface is made available to members |
| PIE manager CIS disclosure obligations — fund switching confirmation must include relevant disclosure information (management fees for target fund, cooling-off period) | FMA | Post-switch confirmation flow |

---

## Eligibility check rules (to be enforced by this interface before accepting a switch instruction)

| Rule ID | Check | Action if fails |
|---------|-------|-----------------|
| ELIG-001 | Member tenure ≥ 90 days from join date | Reject switch with message; offer paper fallback |
| ELIG-002 | No active contributions holiday preventing fund switching (check Contributions Management) | Reject switch or route to analyst depending on holiday type |
| ELIG-003 | Member has no active hardship application that overrides switch eligibility | Allow switch, but WAIVE any applicable switching fee automatically |
| ELIG-004 | Member has completed identity verification (MFA confirmed) | Block switch submission; prompt MFA completion |

Note: ELIG-003 implements the KiwiSaver Act 2006 s.58 hardship fee waiver obligation. The switching fee ($15 for third+ switches per calendar year) must be automatically waived for members who have an active hardship application or approved hardship withdrawal on record, regardless of how many prior switches have been made. This check is mandatory — it cannot be deferred to operations.

---

## Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| MPSW-RISK-001 | FMA Significant Event Notice has not been filed. The SEN must be filed and a 30-day member notification period completed before this interface can be made live. Filing has not commenced. | BLOCKER |
| MPSW-RISK-002 | The $15 switching fee for third+ switches per calendar year has not been reviewed against the KiwiSaver Act s.58 hardship fee waiver provisions. Implementing the fee without the hardship waiver is a statutory breach. | HIGH |
| MPSW-RISK-003 | Unit Registry API integration has not been load-tested at expected peak volumes (estimated 2,000 concurrent switch instructions at EOFY window). | MEDIUM |
| MPSW-RISK-004 | The March 31 EOFY delivery date stated by the board does not account for the 30-day FMA SEN notification period. The earliest compliant go-live date is 30+ days after SEN filing, which has not started. | HIGH — timeline expectation to be recalibrated |

---

## Dependencies

**This interface depends on:**
- Member Identity Service — authentication
- Contributions Management System — eligibility checking (new dependency)
- Unit Registry API — switch instruction processing
- KiwiSaver Account Service — balance / fund display
- FMA SEN Filing System — pre-go-live gate
- Member Notification Service — confirmation and regulatory notices

**Applications that will depend on this interface:**
- Member Portal analytics dashboard (switch instruction volume, eligibility rejection rate)
- Operations team queue (fallback case management for ineligible members)

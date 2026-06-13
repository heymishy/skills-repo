# /discovery Pipeline Output: Legacy Loan Ledger Migration

## Project Summary
**Scope:** Migrate 280,000 active loan accounts (personal, home, commercial) from 18-year-old legacy system to new core banking platform

**Timeline:** 12 months total (6 months parallel + 6 months decommission window)

**Hard Constraint:** Vendor support ends in 12 months; no extension possible

**Team:** 8 people (6 engineers, 1 data architect, 1 PM)

---

## Critical Success Factors

### 1. **Data Integrity (Primary Risk)**
- **What must be true:** 280,000 loan records migrate with zero loss or corruption
- **Includes:** Original terms, full drawdown history, repayment schedules, arrears status, security registration links
- **Additional constraint:** Closed loan records must be retained for 7 years post-migration for regulatory compliance
- **Validation gate:** 6-month reconciliation must pass before cutover

**Questions for next discovery:**
- What is the acceptable tolerance for discrepancies? (e.g., zero tolerance, or <0.01%?)
- How will you handle orphaned or partially-migrated records discovered *after* cutover?
- What's your plan for data that exists in legacy but has no equivalent in new platform data model?

### 2. **Regulatory Reporting (RBNZ)**
- **Requirement:** New platform must produce all RBNZ-mandated reports with exact field definitions
- **Current state unknown:** Do we have a complete inventory of reports? Format specifications? Validation rules?
- **Dependency:** RBNZ relationship team sign-off required before cutover

**Questions for next discovery:**
- How many distinct RBNZ reports do you currently generate?
- Which reports are regulatory vs. operational?
- Has the new platform vendor confirmed capability to generate all of these, or is this exploratory?
- What's the process/timeline for RBNZ to validate new report formats?

### 3. **Staged Cutover Feasibility**
- Your plan: 6 months parallel (shadow mode) + validation + weekend cutover of remaining accounts
- **Risk:** Weekend cutover of 280,000 accounts is operationally challenging

**Questions for next discovery:**
- What's your rollback strategy if cutover fails mid-weekend?
- How long will cutover take? (impacts customer-facing systems availability)
- Do you have a phased cutover plan by account segment/geography, or is this truly all-or-nothing?
- What's your incident response protocol if post-cutover reconciliation reveals data loss?

---

## Gaps & Unknowns

| Category | Gap | Impact |
|----------|-----|--------|
| **Data Model** | Do loan record structures map 1:1 to new platform? | Could derail migration if semantic differences exist |
| **Historical Data** | How will legacy system's 18 years of transaction history be loaded? | Risk of incomplete history if not explicitly planned |
| **Integration Points** | What systems feed into/consume from the loan ledger? (GL, collections, servicing, origination?) | Parallel running complexity; integration testing scope unknown |
| **Vendor Toolset** | What does the migration toolset actually do? Validation scope? | Project feasibility depends heavily on this |
| **Cutover Runbook** | Do you have a detailed, tested cutover procedure? | 6 months to prepare is adequate, but needs to start immediately |
| **Customer Communication** | How will you communicate migration to 280,000 borrowers? | Regulatory and operational requirement |
| **Arrears Handling** | How do arrears and forbearance arrangements transfer? | Complex business logic; easy to corrupt |

---

## Recommended Next Steps (Priority Order)

1. **Data Mapping Workshop** (Week 1-2)
   - Map every field in legacy loan record to new platform
   - Identify gaps; confirm vendor can support required data
   - Output: Data transformation specification

2. **RBNZ Report Inventory** (Week 1-2)
   - List all reports; get format specs from compliance
   - Test new platform report generation against sample data
   - Engage RBNZ relationship team early

3. **Vendor Toolset Deep Dive** (Week 2-3)
   - How does the migration tool validate data integrity?
   - What are its limitations? Rollback capabilities?
   - Get vendor support commitment for 12-month window

4. **Integration & System Dependencies** (Week 2-4)
   - Map all upstream/downstream systems (origination, GL, collections, etc.)
   - Determine which systems need updates for new platform
   - Identify sequencing constraints

5. **Detailed Cutover Plan** (Week 4-8)
   - Design staged cutover (if phasing by segment is viable)
   - Document runbook with decision trees
   - Plan for parallel operation monitoring & reconciliation scripts

6. **Pilot Migration** (Month 2-3)
   - Dry-run with subset of accounts (suggest 5,000-10,000)
   - Measure data integrity, timing, resource needs
   - Refine processes before full migration

---

## Risk Register (Initial)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Data corruption in migration | Medium | Critical | Comprehensive validation tooling; pilot run; reconciliation gates |
| RBNZ reports not compliant | Medium | Critical | Early engagement with RBNZ; validation in Month 2 |
| Cutover exceeds weekend window | Medium | High | Phased cutover plan; load testing; dry-run cutover |
| Vendor support becomes unreliable in month 11-12 | Low | Critical | Lock in vendor commitment now; establish escrow code access if needed |
| Downstream systems break with new loan data | Medium | High | Early integration testing; parallel system updates |
| Business processes not adapted for new platform | Medium | Medium | Change management; user training; process documentation updates |

---

## What We Need to Confirm Before Starting Build

- ✅ 12-month timeline is absolute (assume yes based on vendor deadline)
- ❓ Budget/resource approval for 8-person team for 12 months (implied, confirm)
- ❓ New platform vendor has contractually committed migration toolset support
- ❓ RBNZ has been informed of migration timeline
- ❓ New platform can handle full 7-year history retention requirement for closed loans

**Recommendation:** Schedule a stakeholder kickoff including vendor, RBNZ relationship team, compliance, and operations before finalizing detailed project plan.
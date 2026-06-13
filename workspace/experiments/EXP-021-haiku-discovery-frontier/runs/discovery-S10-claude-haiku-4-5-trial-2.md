# /discovery Pipeline Analysis: Legacy Loan Ledger Migration

## Project Summary
**Objective:** Migrate 280,000 active loan accounts from an 18-year-old legacy system to a new core banking platform within a 12-month hard deadline, with 6 months parallel operation and 6 months post-cutover decommissioning.

**Critical Constraint:** Vendor support ends in 12 months. No extensions available.

---

## Key Risks & Dependencies Identified

### 🔴 **Critical Path Items**

1. **Data Integrity & Completeness**
   - 280,000 loan records with full historical data
   - Multiple loan types (personal, home, commercial) — likely different schemas
   - Closed loan records must be preserved for 7-year regulatory retention
   - *Risk:* Shadow mode validation may uncover discrepancies too late to remediate
   - *Question:* What's your current approach to detecting data loss/corruption during the 6-month parallel period? Real-time record-level reconciliation or batch validation?

2. **Regulatory Compliance (RBNZ)**
   - New platform must produce prescribed regulatory reports with exact field definitions
   - RBNZ relationship team approval required
   - *Risk:* If new platform's reporting doesn't match legacy system output precisely, RBNZ may reject submissions
   - *Question:* Has RBNZ been notified of this migration? Do you have formal pre-approval for new reporting formats, or will this be validated during parallel running?

3. **Cutover Execution Risk**
   - Staged weekend migration of remaining accounts
   - No rollback path after cutover (12-month deadline is hard)
   - 280,000 accounts in a "staged" migration suggests multiple weekends — coordination complexity
   - *Question:* What defines "staged"? By account type? By customer segment? How many cutover weekends are planned?

### 🟠 **High-Impact Dependencies**

4. **Migration Toolset Maturity**
   - New platform vendor providing toolset — not proven in-house yet
   - *Risk:* Toolset bugs/limitations discovered mid-project with no vendor alternative
   - *Question:* Has the vendor run this migration on similar-scale datasets? Can you test the toolset on a subset before parallel running begins?

5. **System Architecture Compatibility**
   - Legacy system (18 years old) likely has accumulated data quirks, edge cases, custom fields
   - New platform may not support 1:1 mapping of all legacy data structures
   - *Risk:* Forced data transformations or field truncations
   - *Question:* Have you completed a detailed data mapping exercise? Are there any legacy fields that cannot be mapped to the new platform?

6. **Team Capacity & Skillsets**
   - Small team (6 engineers, 1 data architect, 1 PM) for a mission-critical migration
   - No mention of QA/testing resources, operational runbooks, or support coverage
   - *Risk:* Burnout during 6-month parallel running + cutover execution
   - *Question:* Do the 6 engineers have prior experience with the new platform? Who owns operational support during parallel running?

### 🟡 **Secondary Risks**

7. **Data Volume & Performance**
   - Mirroring 280,000 accounts' transactions in real-time during parallel period
   - *Question:* What's your transaction volume per day? Will shadow mode mirroring create latency in the legacy system?

8. **Closed Loan Record Handling**
   - 7-year regulatory retention requirement
   - *Question:* How many closed loans are in the legacy system? Are they included in the 280,000 or separate? Will they be migrated or archived?

9. **Security & Access Control**
   - Migration requires exporting sensitive loan data, validation access, testing
   - *Question:* What's your data governance plan for accessing/testing loan records during migration?

---

## Recommended Discovery Actions (Next 2-4 Weeks)

### Phase 1: Validate Assumptions
- [ ] **RBNZ Pre-Clearance:** Schedule call with relationship team to confirm regulatory reporting approach and get preliminary sign-off on new platform report formats
- [ ] **Data Mapping Audit:** Complete detailed field-by-field mapping of all loan types (personal, home, commercial) to new platform schema; identify unmapped/transformed fields
- [ ] **Toolset Proof of Concept:** Run migration toolset on a statistically representative sample (e.g., 5,000 accounts with full history) and validate end-to-end data integrity

### Phase 2: Technical Design
- [ ] **Shadow Mode Architecture:** Design real-time transaction mirroring (frequency, error handling, reconciliation checkpoints)
- [ ] **Cutover Plan Detail:** Define "staged" migration approach — account sequencing, rollback criteria, operational handoff procedures
- [ ] **Validation Framework:** Build automated data reconciliation suite (record count, field-level checksums, balance verification, transaction completeness)

### Phase 3: Resource & Timeline Planning
- [ ] **Team Resourcing:** Confirm skill distribution; identify need for QA, operations, and vendor escalation contacts
- [ ] **Parallel Running Playbook:** Document daily/weekly monitoring, issue escalation, and contingency procedures
- [ ] **Detailed Gantt:** Break 12-month timeline into milestones with buffers; identify critical path

---

## Questions for Stakeholders

**For Executive Sponsorship:**
- What is the business impact if migration slips past the 12-month deadline?
- Is there budget for emergency vendor support or rollback infrastructure post-cutover?

**For Core Banking Platform Team:**
- What is the maximum transaction volume the new platform can handle during 6-month parallel running?
- Are there any known limitations in loan account functionality on the new platform vs. legacy system?

**For Data/Security:**
- What's the plan for decommissioning legacy infrastructure? Will you retain database backups for the 7-year retention period?

---

## Red Flags to Monitor
- If RBNZ doesn't pre-approve new reporting format by month 3 → escalate immediately
- If toolset testing reveals >1% data loss/corruption → consider third-party migration vendor
- If parallel running uncovers >100 unmapped/transformed fields → scope creep risk

This is a **defensible but tight timeline** with **high execution risk**. The 6-month buffer is necessary but assumes near-perfect discovery and testing in the first 2-3 months.
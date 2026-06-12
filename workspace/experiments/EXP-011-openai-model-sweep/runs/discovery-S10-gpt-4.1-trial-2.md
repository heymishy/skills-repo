Thank you for the comprehensive background. Below, I’ll identify key discovery points, elaborate potential risks, critical success factors, required artifacts, and suggest next-step actions for a successful migration project given your scenario.

---

## Key Discovery Points

### 1. **Scope of Migration**
- 280,000 active loan accounts (personal, home, commercial)
- Full **historical data** per account (loan terms, drawdowns, repayment schedules, arrears, security registrations)
- Conversion of all **regulatory reporting** (RBNZ) to the new platform
- Legal retention of credit contract records (minimum 7 years) applies to both active and closed accounts

### 2. **Deadline Constraints**
- 12-month hard deadline—end of vendor support, no possible extension
- Migration must be fully **completed and signed off before expiry**
- 6-month **parallel operation (dual-run period)**, with new loan origination immediately on the new platform and mirroring for legacy loans

### 3. **Team and Tools**
- Run by an in-house team (6 engineers, data architect, PM)
- New platform vendor supplying a migration toolset

### 4. **Regulatory Compliance**
- RBNZ-mandated reports must be produced by the new platform with precise format/fields

---

## Risks Identified

1. **Data Integrity Risk**
   - Potential for loss or corruption of critical loan records/history during migration
   - Incomplete capture of required fields for legal and regulatory purposes

2. **Parallel Ops Complexity**
   - Data synchronization lag or errors between systems in the 6-month period
   - Mirroring logic must support all transaction permutations (including back-dated entries, corrections, off-cycle adjustments)

3. **Regulatory Reporting Deficiencies**
   - Possible gaps or mismatches in new platform reporting versus RBNZ definitions
   - Tight feedback cycle with RBNZ relationship team is essential

4. **Time/Labor Constraints**
   - Ambitious timeline with small team; risk of resource bottlenecks
   - Delays in cutover could force unsupportable "big bang" migration

5. **Decommission and Archival**
   - Need robust process for legal record retention after legacy system is shut down
   - Discovery/retrieval mechanism needed for closed/migrated loans

---

## Critical Success Factors

- **Data Validation & Reconciliation**: Develop robust, automated validation to ensure every record matches (including all transactional and balance fields) at every reconciliation checkpoint.
- **Regulatory Alignment**: Early and recurrent involvement of the RBNZ team — treat every field, format, and report as a testable deliverable.
- **Parallel Ops Monitoring**: Real-time exceptions dashboard for mismatches between legacy and new system transactions.
- **Migration Trial Runs**: At least two non-prod dry runs (migrate, reconcile, report, cutover simulation) before any production actions.
- **Archival Solution**: Predefine how closed legacy loans will be archived, indexed, and retrievable post-cutover.

---

## Required Artifacts & Deliverables

1. **Data Mapping Specification**
   - Legacy field-to-new-platform mapping (including any transformations, value lists, encoding differences)

2. **Test & Reconciliation Plan**
   - End-to-end test scenarios, reconciliation logic, acceptance criteria

3. **Regulatory Report Compendium**
   - Mapping of legacy reports vs. new platform outputs, including test datasets and expected results

4. **Data Retention & Retrieval Policy**
   - Documented procedures for retaining and accessing records required by law after system retirement

5. **Cutover/Backout Plan**
   - Stepwise guide to staged migration weekends, with backout protocols if critical errors are uncovered

6. **Incident Response Process (during dual run)**
   - Issue logging, triage, and escalation procedures for any record mismatches or defects

---

## Next-Step Actions

Here are immediate recommended steps to progress discovery and planning:

1. **Initiate Data Gap Assessment**
   - Export schemas and sample datasets from both systems; map all required data including history, attachments, meta-data, and any “hidden” fields.

2. **Kickoff Regulatory Engagement**
   - Schedule RBNZ relationship team workshops to walk through each regulatory report, reviewing fields/formats/acceptance criteria.

3. **Define Shadow Mode/Parallel Ops Specifications**
   - Detail mirroring mechanism (event-based, batch, API), expected SLAs for synchronization, and failure handling.

4. **Draft Migration & Reconciliation Milestones**
   - Timeline for trial run #1, #2, reconciliation windows, 'go'/'no go' criteria, dry run cutover, and final cutover weekend.

5. **Archive & Retention Solution Design**
   - Engage legal and compliance to sign off on proposed archive (may require separate document storage).

6. **Resource Plan & Risk Register**
   - Confirm staff availability; formalize a risk register with probabilities/impact and mitigation action owners.

7. **Vendor Toolset POC**
   - Evaluate the vendor migration tool with a subset of real data to determine suitability, gaps, and scripting/support effort needed.

---

## Questions for Further Discovery

1. **Are there any bespoke (non-standard) loan products or features in the legacy system that may not map 1:1 to the new platform?**
2. **What are the historical data volumes? (attachments, notes, logs, documents per loan)**
3. **Do you require ongoing inquiry access to the legacy system after it's decommissioned or will all access be via exports/archives?**
4. **Are there downstream systems (e.g., data warehouse, CRM, collections) that consume legacy loan or reporting data which must be updated/re-pointed?**
5. **Has the new platform been certified by RBNZ previously for these types of reports or is this the first instance?**

If you can clarify or expand on any of the above, I can help with detailed work breakdowns, discovery interview scripts, risk matrices, or planning templates. Let me know your preferred next steps!
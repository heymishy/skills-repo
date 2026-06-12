Thank you for the detailed context. Here’s an initial discovery analysis, highlighting key risks, dependencies, and requirement clarifications for your legacy loan ledger migration. Where helpful, I’ve included checklists and probing questions to shape your discovery and planning.

---

## 1. **Hard Constraints & Timeline**
- **Deadline:** Migration must be complete and the legacy system retired **within 12 months**, due to end of vendor support and no option to extend.
- **Parallel Run:** 6 months dual operation with shadowing, followed by staged cutover, then 6 months for final decommissioning.
- **Scope:** ~280,000 active loan accounts + retention of 7 years’ historical records.

---

## 2. **Critical Risks**

### a. **Data Integrity**
- All loans must migrate with full history (originations, drawdowns, repayments, arrears, securities).
- Zero tolerance for record loss or corruption.
    - **Questions:**
        - What is the record structure in legacy vs new (field mapping, datatypes, encoding)?
        - How are edge cases (split/frozen/charged-off loans, legacy track changes, amendments) handled?
        - Are there current data quality issues (missing, inconsistent, or incorrect records) in the legacy system?

### b. **Regulatory Compliance**
- **RBNZ reporting** must be exact: field-level and format compliant.
- **Questions:**
    - What is the test plan to validate RBNZ reports output by the new platform?
    - Access to report specs and legacy report samples for parallel comparison?
    - Will the RBNZ relationship team be available for timely feedback during UAT?

### c. **Retrospective Data Retention**
- Legal requirement: 7-year credit contract record retention.
- Plan for preserving closed/paid-off loans after system retirement.
    - **Questions:**
        - Will legacy system data be archived (static) or migrated into the new platform as read-only?
        - Who owns access/user interface for retrieval of historic records post-decommission?

### d. **Migration Tools and Testing**
- Relies heavily on new vendor’s migration toolkit.
    - **Questions:**
        - Has the migration toolkit been used at this scale/in similar scenarios before? References?
        - What built-in validation, reconciliation, and rollback capabilities does the toolset provide?
        - Will vendor engineers be available for issue escalation/triage?

---

## 3. **Dependencies & Open Items**

- **Integration with Other Bank Systems**
    - Are there downstream systems (GL, CRM, risk, audit, collections, data warehouse) consuming legacy loan data?
    - Will interfaces be tested for impact post-migration?

- **Historical Data Preservation/Discovery**
    - Any legal holds or discovery requirements pending on closed loan data? Is eDiscovery planned?

- **Resource Planning**
    - Is the six-engineer, one architect, one PM allocation sufficient for parallel run support, issue triage, and backfill?
    - What is the expected support load during the 6-month parallel period?

---

## 4. **Checklist / Action Items**
- [ ] Map data schemas from legacy to new platform; resolve mismatches, confirm with business/SMEs.
- [ ] Inventory loan “edge cases” and complex product structures. Prototype migration of sample complex loans.
- [ ] Build detailed migration test plan, including:
    - Record-by-record reconciliation
    - History chain checks (no gaps/truncation)
    - Random sample deep QA
- [ ] Define approach to archiving vs. migrating closed loans.
- [ ] Set up mechanism and schedule for RBNZ regulatory report validation.
- [ ] Engage downstream system owners for impact and interface testing.
- [ ] Confirm service-level agreement for vendor migration toolkit support/escalation.
- [ ] Confirm post-cutover support model (for new platform and legacy read-only/archive).

---

## 5. **Areas Requiring Early Decisions**
- **Data retention strategy:** Migration vs static archive? Accessibility post-cutover?
- **Regulatory sign-off:** Who will certify new RBNZ report compliance? At what project milestones?
- **Fallback/Rollback:** What happens if integrity or reporting cannot be validated during parallel run?

---

## 6. **Recommended Next Steps**
1. **Kick off with full team alignment session**: Confirm scope, risks, key milestones.
2. **Begin detailed data mapping and QA prototyping**: Small-scale dry-run before full migration.
3. **Establish contact schedule with RBNZ and legal**: Book time for timely input.
4. **Draft migration test and fallback plan**: Include recovery approach during parallel run.
5. **Reach out to downstream/process owners** impacted by loan data migration.

---

**Would you like a detailed discovery interview guide for system/data SMEs, or a more granular risk register template?**
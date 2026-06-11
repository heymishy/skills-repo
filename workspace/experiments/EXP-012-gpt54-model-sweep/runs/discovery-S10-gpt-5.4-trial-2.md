Below is the `/discovery` output for the legacy loan ledger decommissioning and migration initiative.

---

# /discovery

## 1) Initiative summary

Migrate approximately 280,000 active loan accounts from an 18-year-old legacy loan ledger onto the bank’s newer core banking platform, which is already operating successfully for deposit accounts. The objective is to consolidate onto a single core platform and retire the unsupported legacy loan system before vendor support ends in 12 months.

The migration includes:
- Personal loans
- Home loans
- Commercial lending

The migration must preserve:
- Full loan data and history
- Original loan terms
- Drawdown history
- Repayment schedules
- Arrears status
- Associated security registrations
- Retained records for closed loans as required by law

The delivery model is:
- In-house project team
- Vendor-supplied migration toolset
- 6-month parallel run
- Weekend staged cutover
- 6-month decommissioning period after cutover

---

## 2) Business driver

### Primary drivers
- Legacy vendor support ends in 12 months with no extension possible
- Legacy platform will become unsupported and unpatchable
- Operational simplification through a single core banking platform
- Reduction of security, resilience, and operational risk from retaining obsolete infrastructure

### Strategic outcomes
- Retire end-of-life loan platform
- Consolidate lending and deposit processing onto one core
- Reduce duplicated infrastructure and support overhead
- Improve long-term maintainability and reporting consistency

---

## 3) Problem statement

The enterprise has a hard 12-month deadline to exit a legacy loan ledger platform that is losing vendor support permanently. Failure to complete migration in time would leave the bank operating a critical lending system without support, patches, or security updates.

The migration is high risk because:
- Loan data integrity is critical
- Historical lending records must be preserved
- Regulatory reporting to RBNZ must continue without defect
- A large live portfolio must be migrated with minimal disruption
- The available internal team is relatively small for the scale and criticality of the work

---

## 4) Scope

### In scope
- Migration of 280,000 active loan accounts
- Migration of loan product types:
  - Personal loans
  - Home loans
  - Commercial loans
- Historical migration of:
  - Original terms
  - Drawdowns
  - Repayment history/schedules
  - Arrears/delinquency status
  - Security/collateral registration associations
- Mirroring/shadow processing during parallel run
- New loan originations to new platform from start of parallel run
- Data validation and reconciliation before cutover
- Weekend staged migration of remaining legacy accounts
- Production of all required RBNZ reports from new platform
- Retention/preservation of closed-loan records for 7 years
- Legacy infrastructure decommissioning and retirement

### Likely in scope but needing confirmation
- Interfaces from loan ledger to downstream systems
- Customer statements and notices
- Collections workflows
- Loan servicing operations
- General ledger postings and finance reconciliations
- Security registry integrations
- Credit bureau and repayment service integrations
- Operational reporting and MI
- Archival and records retrieval model for retained data
- Access controls and audit logs
- Operational support handover/runbooks

### Out of scope unless stated otherwise
- Redesign of lending products
- Major process transformation unrelated to migration
- Full replacement of non-core loan-adjacent systems unless required
- Broader enterprise data remediation beyond loan domain

---

## 5) Timeline and hard constraints

### Hard deadline
- 12 months until vendor support ends
- No support contract extension available

### Planned phases
1. **Preparation and build**
   - Mapping, tooling, design, environment setup, test planning
2. **Parallel operation: 6 months**
   - New originations on new platform
   - Existing loans remain on legacy in operational master/shadow mode
   - Transactions mirrored to new platform
3. **Validation at month 6**
   - Data integrity validation
   - Reconciliation pass
   - Go/no-go assessment
4. **Cutover**
   - Staged weekend migration of remaining legacy accounts
5. **Post-cutover period: 6 months**
   - Decommission legacy infrastructure
   - Formal retirement
   - Records retention/access arrangements finalized

### Implied constraint
The program effectively has almost no slack. Any significant delay in the first 6 months threatens the hard support end date.

---

## 6) Critical success criteria

- All active loan accounts successfully migrated to new platform by support end date
- No material data loss, corruption, or untraceable transformation defects
- Full loan history preserved and accessible
- Required retained records preserved for legal retention period
- Parallel run demonstrates accurate transaction mirroring and reconciliation
- RBNZ reporting from new platform accepted as compliant
- Cutover completed with acceptable operational disruption
- Legacy platform safely decommissioned within 6 months after cutover
- Business, operations, finance, legal, risk, and regulatory stakeholders sign off

---

## 7) Major risks

### 1. Data integrity risk
Most significant risk. Full-fidelity migration of loan principal, interest, schedules, arrears, and securities is mandatory.

Potential failure modes:
- Field mapping errors
- Incomplete historical migration
- Transaction ordering defects
- Balance mismatches
- Interest accrual mismatches
- Loss of security registration links
- Corruption or truncation of historical events
- Differences in product behavior between systems

### 2. Regulatory reporting risk
The new platform must reproduce prescribed RBNZ reports exactly enough to satisfy regulatory requirements.

Potential issues:
- Field definition mismatch
- Reporting logic divergence
- Incomplete historical data required for reports
- Timeliness/formatting defects
- Insufficient regulator engagement

### 3. Schedule risk
A 12-month immovable deadline with a 6-month parallel run leaves limited contingency.

Potential issues:
- Delayed environment readiness
- Slow data mapping decisions
- Vendor tooling limitations
- Test cycle overruns
- Reconciliation issues delaying go-live

### 4. Resourcing risk
Project team size may be lean for:
- 280,000-account migration
- Data transformation complexity
- Reporting remediation
- Parallel-run support
- Cutover and decommissioning

### 5. Operational risk during parallel run
Dual-system operation creates complexity:
- Mirroring defects
- Out-of-sync ledgers
- Duplicate or missed processing
- Operational confusion over system of record
- Incident handling ambiguity

### 6. Cutover risk
Weekend staged migration may fail if:
- Data loads exceed batch window
- Validation cannot complete in time
- Downstream dependencies break
- Rollback is not credible

### 7. Legal and records retention risk
Closed and migrated loan records must remain retrievable for 7 years.

Potential issues:
- Inadequate archive design
- Missing metadata or audit trail
- Records not legally admissible or searchable

### 8. Security and compliance risk
As the support deadline approaches, any slippage increases exposure to unsupported software in production.

---

## 8) Assumptions identified

- The new core banking platform can support all required loan product types
- The platform vendor’s migration toolset is fit for purpose
- New platform loan functionality is sufficiently mature for active lending operations
- Shadow/mirroring can be implemented accurately for all loan events
- The new platform can generate RBNZ-compliant reports, either natively or via configured reporting
- Downstream systems can consume new-platform loan data without major redesign
- Legacy data quality is adequate enough for migration with manageable remediation
- Weekend migration windows are operationally feasible
- 6 engineers + 1 data architect + 1 PM is sufficient if scope is tightly managed
- Business SMEs and regulatory stakeholders will be available for timely decisions and signoff

---

## 9) Dependencies

### Internal dependencies
- Lending operations SMEs
- Finance / GL reconciliation teams
- Risk and compliance teams
- Legal / records management
- Infrastructure/platform teams
- Security and IAM
- Enterprise data/reporting teams
- Customer servicing/contact centre operations
- PMO / change governance
- RBNZ relationship team

### External dependencies
- New platform vendor and migration tooling support
- Potential security registration service providers
- Any external reporting or payments interfaces
- RBNZ engagement/confirmation cycle

---

## 10) Stakeholders

### Core stakeholders
- Project manager
- Data architect
- Engineering team
- Lending operations
- Core platform owner
- Legacy system owner
- Infrastructure/operations
- Information security
- Legal
- Compliance / regulatory reporting
- Finance
- Enterprise risk
- Records management

### External/extended stakeholders
- New core banking platform vendor
- RBNZ relationship team
- Potential auditors
- External service/integration providers

---

## 11) Key discovery questions

### Business and operating model
- What is the authoritative system of record during parallel run for each process?
- What exact business processes currently depend on the legacy loan ledger?
- Are there any product variations or bespoke commercial loan structures not supported in the new platform?
- What operational tolerances exist for cutover weekend downtime?

### Data and migration
- What is the complete data inventory of the legacy platform?
- What data quality issues are already known?
- How are loan histories stored: event-based, snapshot-based, or hybrid?
- How will historical schedules and interest calculations be represented in the new platform?
- How are security registrations modeled today and in the target platform?
- What closed-loan population also needs to be retained/accessed?
- What constitutes “full history” in legal, operational, and audit terms?
- What reconciliation rules define acceptable variance, if any?

### Technical
- How will transaction mirroring be implemented?
- Is mirroring near-real-time or batch?
- How will sequencing/idempotency be ensured?
- What are the performance limits for bulk migration and weekend cutover?
- What rollback strategy is actually feasible after partial cutover?
- What interfaces must be migrated or remediated?

### Reporting and regulatory
- What are all RBNZ reports currently produced from legacy?
- Which reports are directly sourced from loan data versus enterprise reporting layers?
- What exact report fields and calculations need certification?
- What evidence will RBNZ or internal compliance require before acceptance?

### Legal and retention
- Does retention require immutable archive, online retrieval, or both?
- Are there evidentiary requirements for archived records?
- Must historic records be queryable in the new platform, or is a separate compliant archive acceptable?

### Delivery
- Is current resourcing sufficient for testing, reconciliation, and cutover support?
- Are specialist testers, DBAs, or business analysts also required?
- What are the go/no-go criteria for cutover?
- What is the contingency plan if reconciliation at month 6 fails?

---

## 12) Initial requirements view

### Functional requirements
- Support all in-scope loan products on target platform
- Create new originations on new platform from parallel-run start
- Mirror all in-flight legacy loan transactions to target
- Maintain balances, schedules, statuses, and security associations
- Support arrears and collections states
- Generate all required regulatory reports
- Preserve historical and closed-loan records for statutory retention period

### Non-functional requirements
- Zero material data loss
- High reconciliation accuracy
- Strong auditability and traceability of transformations
- Secure handling of customer and credit data
- Operational resilience during parallel run
- Performance sufficient for migration windows
- Controlled decommissioning and access to retained records
- Full supportability before legacy support ends

---

## 13) Delivery complexity assessment

### Complexity: High to Very High

Reasons:
- Business-critical platform replacement
- Hard immovable deadline
- Large account volume
- Multi-product lending complexity
- Full-history migration requirement
- Parallel-run and mirroring complexity
- Regulatory reporting obligations
- Legal retention requirements
- Lean delivery team relative to scope

---

## 14) Likely workstreams

1. **Program governance and planning**
2. **Current-state discovery and dependency mapping**
3. **Target-state design**
4. **Data mapping and migration engineering**
5. **Mirroring/shadow run implementation**
6. **Product and servicing configuration on target platform**
7. **Integration remediation**
8. **Regulatory reporting design and validation**
9. **Testing and reconciliation**
10. **Cutover planning and rehearsal**
11. **Records retention and archive design**
12. **Decommissioning and retirement**

---

## 15) Early observations

- The real critical path is likely data mapping, mirroring design, and reconciliation design rather than raw migration mechanics.
- RBNZ reporting should be treated as a first-class deliverable, not a downstream validation item.
- The 6-month parallel run is sensible, but only if reconciliation is automated and exception-based; manual reconciliation at this scale will be too slow.
- Closed-loan retention needs explicit architecture early; it should not be left to decommissioning.
- Team size appears light unless there is strong vendor support and sharply constrained scope.
- A formal rollback posture for staged weekend migration must be designed early; many programs assume rollback without validating feasibility.
- Commercial lending may be disproportionately complex relative to account count and should likely be segmented separately in migration planning.

---

## 16) Recommended next discovery outputs

1. **Application and interface inventory**
2. **Loan product and feature matrix: legacy vs target**
3. **Data object inventory and source-to-target mapping**
4. **Regulatory reporting catalogue with field-level lineage**
5. **Parallel-run operating model**
6. **Reconciliation framework and acceptance thresholds**
7. **Cutover and rollback strategy**
8. **Records retention / archive architecture options**
9. **Resource and skills gap assessment**
10. **Integrated milestone plan against 12-month deadline**

---

## 17) Discovery conclusion

This is a high-criticality, deadline-driven core migration with primary risk concentrated in data integrity, reconciliation, and regulatory continuity. The vendor support end date creates a non-negotiable endpoint, and the parallel-run plan is viable only if supported by rigorous data lineage, automated reconciliation, and early regulatory/reporting validation.

The initiative appears feasible, but only with disciplined scope control, rapid discovery of product and data complexity, and early escalation of any gaps in platform fit, reporting compliance, or team capacity.

If you want, I can next convert this into any of the following:

1. **RAID log**
2. **Discovery-to-delivery plan**
3. **Executive brief**
4. **Solution options assessment**
5. **Detailed requirements catalogue**
6. **Phased milestone plan with critical path**
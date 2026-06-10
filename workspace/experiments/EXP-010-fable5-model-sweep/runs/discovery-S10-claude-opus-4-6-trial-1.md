

# Discovery Analysis: Legacy Loan Ledger Migration to Core Banking Platform

## 1. Summary of Understanding

You are decommissioning an 18-year-old legacy loan ledger system and migrating approximately 280,000 active loan accounts — spanning personal loans, home loans, and commercial lending — onto your existing core banking platform, which has been running deposit accounts successfully for 14 months.

The migration is driven by a hard external constraint: the legacy vendor is withdrawing the product from market and support ends in 12 months, with no possibility of extension. Your plan establishes a 6-month parallel operation period (both systems running simultaneously with transaction mirroring), followed by a staged cutover, followed by a 6-month decommission window — fitting precisely within the 12-month envelope.

The project will be delivered in-house by a team of eight (six engineers, one data architect, one project manager), supported by the new platform vendor's migration toolset.

Data integrity is the primary technical risk. Every loan record — active and closed — must migrate with complete history and no loss or corruption. Legal retention obligations extend to 7 years for credit contract records. RBNZ regulatory reporting must be reproduced accurately on the new platform.

---

## 2. What Is Well-Defined

The brief establishes several elements with good clarity:

**Hard deadline and its origin.** The 12-month vendor support expiry is unambiguous and externally imposed. There is no negotiation path. This is a genuinely fixed constraint, not an aspirational target, and the project plan correctly treats it as such.

**Migration scope.** The account population (280,000 active loans across three product types) is quantified. The data elements that must migrate are enumerated: original loan terms, drawdown history, repayment schedules, arrears status, and associated security registrations. This gives the data architect a concrete mapping exercise to begin.

**Parallel operation model.** The 6-month parallel run with shadow-mode mirroring is a well-understood risk-reduction pattern for financial system migrations. New originations go directly to the new platform, removing one category of cutover risk. The staged weekend migration at the 6-month mark is sensible for a system of this scale.

**Regulatory requirements.** The RBNZ reporting obligation is identified, the reports are prescribed in format and field definition, and the responsible internal team (RBNZ relationship team) is named.

**Legal retention requirements.** The 7-year retention obligation for credit contract records under consumer finance legislation is confirmed by the legal team. The brief explicitly notes that closed loan records migrated must also be preserved.

**Platform confidence.** The new core banking platform has 14 months of production operation on deposit accounts, which provides meaningful operational confidence — though deposits and lending are materially different domains, the infrastructure, operational processes, and vendor relationship are already proven.

---

## 3. Gaps, Ambiguities, and Risks Requiring Clarification

### 3.1 — Scope Boundaries and Product Complexity

**Active vs. total loan population.** The brief states 280,000 *active* loan accounts. It then states that closed loan records must also be preserved. The total number of records requiring migration — active plus closed — is not stated. For an 18-year-old system, the closed loan population could be substantially larger than the active population, potentially by a factor of three to five or more. This has direct implications for migration duration, storage, validation effort, and the reconciliation workload at the 6-month mark. The total record count needs to be established.

**Product-type complexity.** The three product categories named — personal loans, home loans, commercial lending — will almost certainly contain significant internal variation. Home loans alone may include fixed-rate, variable-rate, split-rate, offset, revolving credit (home equity lines), interest-only periods, and construction drawdown facilities. Commercial lending may include term loans, revolving facilities, overdraft facilities, trade finance, and guarantor-backed structures. Each product variant may have distinct repayment calculation logic, fee structures, interest accrual methods, and event histories. The question is whether the new platform's lending module supports all product variants currently in production, or whether some require configuration, customisation, or compromise. A complete product catalogue with variant-level mapping to new platform capabilities is a prerequisite for confident planning.

**Security registrations.** The brief mentions "associated security registrations" but does not elaborate. For home loans, this includes mortgages registered against land titles (likely via Landonline / LINZ in the New Zealand context given the RBNZ reference). For commercial lending, it may include PPSR registrations, general security agreements, guarantees, and other collateral instruments. The question is whether the new platform manages security registration records natively, whether integration with external registries (LINZ, PPSR) is required, and whether the migration includes re-establishing those integrations or simply porting static records. If the legacy system has live integrations with these registries, those integrations must be replicated or replaced.

### 3.2 — Data Architecture and Mapping

**Schema mapping completeness.** The legacy system has been in production for 18 years. Systems of this age almost invariably contain schema drift — fields repurposed over time, undocumented columns carrying business-critical data, workaround tables created to address limitations, and customisations applied by successive teams. The data architect needs to conduct a thorough schema discovery exercise before mapping can be treated as complete. The question is whether this has been started and what the current state of legacy system documentation is.

**Interest calculation parity.** Loan systems are fundamentally interest calculation engines. If the legacy system and the new platform use different interest accrual methods (daily balance vs. monthly balance, actual/365 vs. 30/360, or other conventions), migrated accounts could produce different interest calculations going forward. Even small rounding differences, compounded across 280,000 accounts, create reconciliation failures and potentially regulatory issues. This needs to be validated at the product-variant level before parallel operation begins.

**Historical transaction fidelity.** The requirement to migrate "full history" raises the question of what constitutes the authoritative record. If the new platform's transaction model differs structurally from the legacy system's — different event types, different granularity, different reversal handling — then historical transactions may need to be transformed during migration. Transformation introduces interpretation risk. The standard for what constitutes acceptable fidelity in migrated historical data should be defined and agreed with legal and compliance before migration design is finalised.

**Data quality in the legacy system.** An 18-year-old system will contain data quality issues — orphaned records, inconsistent status flags, partially completed transactions, manually corrected entries. The migration process needs a strategy for handling records that do not conform to expected schemas or business rules. Will they be flagged for manual review? Migrated as-is? Excluded and handled separately? This needs a policy decision, not just a technical decision.

### 3.3 — Parallel Operation Mechanics

**Transaction mirroring architecture.** The brief describes existing accounts running on the legacy system "in shadow mode with all transactions mirrored to the new platform." This is the most technically complex element of the plan and the brief provides the least detail on it. Several questions arise:

- What is the mirroring mechanism? Is the vendor migration toolset providing this, or is it a custom integration?
- Is mirroring synchronous or asynchronous? Synchronous mirroring provides stronger consistency but creates a hard dependency — if the new platform is unavailable, does the legacy system block?
- How are mirroring failures handled? If a transaction posts successfully on the legacy system but fails to mirror, what is the detection and remediation process?
- Which system is the book of record during parallel operation? The brief implies the legacy system is authoritative ("existing accounts run on the legacy system"), but this should be stated explicitly so that every operational and dispute-resolution decision during the parallel period has a clear answer.
- How are end-of-day processes handled? Loan systems run batch processes for interest accrual, fee posting, arrears ageing, and statement generation. Are these batch processes mirrored, or only customer-initiated and teller-initiated transactions?

**Parallel operation for new originations.** New loan originations go onto the new platform from day one of parallel operation. This means the new platform's lending module must be fully configured, tested, and operationally ready at the start of the parallel period — which is effectively 6 months from now if parallel operation starts at month 6. That is a tight window for lending product configuration, user acceptance testing, staff training, and operational readiness, particularly if the product-variant mapping exercise reveals gaps.

### 3.4 — Reconciliation and Cutover

**Reconciliation scope and methodology.** The plan calls for a reconciliation pass at the 6-month mark. The brief does not describe what reconciliation means in operational terms. At minimum, it should include:

- Balance reconciliation: every account's principal balance, accrued interest, fees outstanding, and arrears balance on the new platform must match the legacy system to the cent.
- Transaction reconciliation: every mirrored transaction must be accounted for.
- Schedule reconciliation: future repayment schedules on the new platform must match the legacy system.
- Security registration reconciliation: all collateral records must be present and correct.

The pass/fail criteria for reconciliation should be defined in advance. Is the standard zero discrepancies, or is there a tolerance? If there is a tolerance, who approves it and what is the remediation process for accounts that fall outside tolerance?

**Staged weekend migration — what is being staged?** If parallel operation has been running for 6 months with transaction mirroring, the data is already on the new platform. The "staged weekend migration" presumably refers to the cutover of the book of record — the point at which the new platform becomes authoritative and the legacy system is switched off for those accounts. The staging presumably means this is done in tranches (perhaps by product type or by portfolio segment) rather than all at once. The brief should clarify the staging strategy, the sequence, and the rollback plan if a tranche fails validation post-cutover.

**Rollback plan.** If the reconciliation at the 6-month mark is not satisfactory, what happens? The legacy system still has 6 months of vendor support remaining, so there is a buffer — but the plan does not describe what a delayed cutover means for the decommission timeline or whether there is a contingency window built in. If the parallel period needs to extend, does the overall timeline still fit within 12 months?

### 3.5 — Regulatory Reporting

**Report inventory and gap analysis.** The brief states that the new platform must produce all RBNZ regulatory reports currently generated by the legacy system, and that format and field definitions are prescribed. The immediate need is a complete inventory of these reports and a gap analysis against the new platform's reporting capabilities. Some questions:

- How many distinct regulatory reports are produced?
- Does the new platform already produce any of these reports for the deposit accounts, such that the lending-specific reports are incremental?
- Are reports generated from the core platform natively, or do they require a separate reporting layer / data warehouse?
- What is the testing and certification process with RBNZ? Is a parallel submission period required where both systems produce reports for the same period and RBNZ validates the new platform's output?

**Regulatory reporting during parallel operation.** During the 6-month parallel period, some loans will be on the new platform (new originations) and some will be on the legacy system (existing accounts). RBNZ reports will presumably need to consolidate data from both systems. This is a non-trivial operational and technical challenge and should be explicitly planned for.

### 3.6 — Resourcing and Capacity

**Team size relative to scope.** A team of eight people (six engineers, one data architect, one project manager) for a 280,000+ account migration across three product categories with a hard 12-month deadline is lean. This is not necessarily wrong — small, skilled teams often outperform large ones — but it assumes:

- The engineers are experienced with both the legacy system and the new platform.
- The data architect has or can quickly acquire deep knowledge of the legacy schema.
- There is no significant attrition risk over 12 months.
- The team is dedicated full-time to this project and not carrying other operational responsibilities.

The brief does not address any of these assumptions. If any are incorrect, the resourcing model is at risk.

**Vendor support model.** The new platform vendor is providing a migration toolset. The brief does not describe the scope of vendor involvement beyond this. Questions include:

- Is the vendor providing professional services support for migration design and execution, or only the toolset?
- Is the vendor providing dedicated support resources during parallel operation and cutover?
- Does the vendor have experience migrating lending portfolios of this scale onto their platform?
- What are the vendor's SLAs during the migration period, and are they enhanced relative to standard production support?

**Business stakeholder involvement.** The brief mentions the RBNZ relationship team but does not identify other business stakeholders. A migration of this nature will require significant involvement from:

- Lending operations teams (who understand product variants, exception handling, and operational processes on the legacy system).
- Collections and arrears management (who need continuity of arrears status, hardship arrangements, and legal proceedings already in progress).
- Customer service (who will be operating across two systems during parallel operation and need training on the new platform).
- Finance (who need GL integration, month-end processing, and financial reporting continuity).
- Risk and compliance (who need to validate that credit risk reporting, provisioning, and regulatory capital calculations are unaffected).

The absence of these stakeholders from the brief does not mean they have been forgotten, but their roles and time commitments need to be planned.

### 3.7 — Operational Continuity

**Customer-facing impact.** The brief is silent on customer impact. During parallel operation and cutover, questions arise:

- Will customers experience any change to their account numbers, online banking access, payment references, or direct debit arrangements?
- If account numbers change, the downstream impact is substantial — direct debits, salary deductions, payment references used by employers and third parties all need to be updated. This is a significant operational and communication exercise.
- Will statement formats change? Will customers receive a migration notification?

**Downstream system integrations.** The legacy system almost certainly has integrations beyond the core ledger — connections to credit bureaus (for arrears reporting), payment systems (direct debits, BECS), insurance systems (for loan protection insurance), document management systems (for loan contracts and correspondence), collections systems, and potentially broker or intermediary portals. Each integration needs to be identified, assessed, and either replicated on the new platform or retired. The brief does not mention any of these.

**Arrears and hardship in flight.** Loans in arrears, loans subject to hardship arrangements, loans in legal recovery, and loans subject to disputed claims represent a particularly high-risk subset for migration. These accounts often have non-standard configurations, manual overrides, and legal sensitivities. They should be identified as a distinct migration cohort with dedicated validation.

### 3.8 — Legal and Compliance

**7-year retention — mechanism and format.** The brief confirms a 7-year retention obligation but does not describe how it will be met post-decommission. Options include migrating all historical records into the new platform, archiving to a separate long-term storage system, or retaining a read-only instance of the legacy database. Each has different cost, accessibility, and legal defensibility characteristics. The legal team should confirm what constitutes acceptable retention — is it sufficient to hold the records in an archive, or must they be queryable and reproducible in their original format?

**Consumer credit obligations during migration.** Under New Zealand consumer credit legislation (Credit Contracts and Consumer Finance Act 2003 and subsequent amendments), lenders have ongoing disclosure obligations. If the migration changes anything that triggers a re-disclosure requirement — such as a change in the creditor entity, a change in account terms, or a system-generated variation notice — this needs to be identified and managed. The legal team's involvement should extend beyond retention to cover ongoing compliance during and after migration.

---

## 4. Suggested Next Steps

The following actions would resolve the most critical gaps identified above and position the project for confident execution:

**First: Establish total record count.** Quantify the full population requiring migration — active accounts, closed accounts within the 7-year retention window, and any other records that must be preserved. This determines the true scale of the migration and validation effort.

**Second: Complete product-variant catalogue and platform capability mapping.** Document every loan product variant currently in production on the legacy system and map each to the new platform's lending module capabilities. Identify any gaps where the new platform does not natively support a legacy product structure. This is the highest-risk area for timeline and is prerequisite to parallel operation design.

**Third: Define the transaction mirroring architecture.** Produce a technical design for the parallel operation mirroring mechanism, including the mirroring scope (which transaction types and batch processes), the failure handling model, and the authoritative system designation. This is the most technically complex element and needs design work immediately.

**Fourth: Inventory all downstream integrations.** Catalogue every system that connects to or depends on the legacy loan ledger. Assess each for migration, replacement, or retirement. Any integration that is missed will surface as a production incident during parallel operation or cutover.

**Fifth: Conduct legacy schema discovery.** The data architect should begin a thorough analysis of the legacy database schema, including undocumented or repurposed fields, custom tables, and data quality issues. This work takes time and directly informs the migration mapping.

**Sixth: Define reconciliation criteria.** Agree — with business, legal, risk, and compliance stakeholders — the specific reconciliation checks that must pass before cutover is approved, and the pass/fail thresholds. This prevents a situation where the 6-month reconciliation point arrives and there is no agreement on what "satisfactory" means.

**Seventh: Engage business stakeholders.** Identify
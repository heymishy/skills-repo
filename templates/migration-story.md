# Migration Story Template

<!--
  USE THIS TEMPLATE instead of story.md for:

  - Data migration stories — transforming and moving data from an old system
    to a new one (batch or streaming)
  - Cutover stories — switching live traffic, users, or dependencies from
    old to new system
  - Parallel-run stories — running old and new systems simultaneously and
    reconciling outputs to validate the new system before cutover
  - Consumer migration stories — migrating a downstream consumer (team, system,
    or client) to adopt a new API version or library

  These story types have no end-user persona, are not Given/When/Then driven,
  and are governed by data volumes, transformation rules, error thresholds,
  and reconciliation criteria rather than user outcomes.

  For standard user-facing feature stories, use story.md instead.

  WHEN TO USE:
  Run /definition and inform it you have a migration-type story. It will
  use this template instead of story.md for that story only.
-->

## Migration Story: [Title]

<!-- Title format: type + scope + direction
     Good: "Migrate account records from LEGACY-CORE to cards-account-api"
           "Cutover statement generation traffic to new service"
           "Parallel-run auth service and reconcile for 2-week window"
     Bad:  "Data migration", "Cutover work" -->

**Epic reference:** [Link to parent epic]
**Workstream reference:** [Link to workstream artefact slug]
**Programme reference:** [Link to programme artefact]
**Discovery reference:** [Link to approved discovery artefact]

## Migration type

- [ ] Data migration
- [ ] Cutover
- [ ] Parallel run
- [ ] Consumer migration

## Scope

**Source system:** [System name, version, or component being migrated from]
**Target system:** [System name, version, or component being migrated to]
**Data / traffic in scope:** [Specific tables, schemas, record types, APIs, or user cohorts]
**Explicitly out of scope:** [What is NOT migrated in this story]

## Volume and performance criteria

<!--
  These are the non-functional hard gates for this migration story.
  They replace NFRs in the standard story format.
-->

| Criterion | Requirement | Measurement method |
|-----------|-------------|-------------------|
| Record volume | [e.g. 4.2M account records] | [e.g. Row count comparison source vs target] |
| Throughput | [e.g. Complete within 4-hour batch window] | [e.g. Pipeline execution log] |
| Latency (if streaming) | [e.g. Under 500ms end-to-end per event] | [e.g. APM trace] |
| Memory / resource ceiling | [e.g. Peak memory under 8GB] | [e.g. Infrastructure monitoring] |

## Transformation rules

<!--
  List the business rules that govern how data is transformed during migration.
  Each rule should be specific enough that a developer and a tester can agree
  on whether it was applied correctly without further discussion.
  
  If rules are in a separate document (scoping doc, data dictionary, mapping spec),
  reference the file from the reference/ folder rather than copying here.
-->

| Rule ID | Source field / condition | Target field | Transformation logic |
|---------|--------------------------|-------------|----------------------|
| TR-01 | [e.g. legacy.status = 'A'] | [target.is_active] | [e.g. Map to boolean true] |
| TR-02 | [e.g. legacy.dob format DDMMYYYY] | [target.date_of_birth] | [e.g. Parse and emit as ISO 8601] |
| TR-03 | [e.g. record has no email] | [target.contact_email] | [e.g. Null — do not default or invent] |

<!-- Reference document for full rule set (if applicable): [path in reference/] -->

## Error and rejection handling

**Error threshold (STOP gate):**
If the error rate exceeds [X%] or [N] records, the migration **stops automatically**.
Do not proceed. Alert [role] before any decision to continue.

**Rejection categories:**

| Category | Handling | SLA for resolution |
|----------|----------|-------------------|
| [e.g. Malformed date — cannot transform] | [Reject to error queue, log with record ID] | [e.g. Must resolve before cutover] |
| [e.g. Duplicate record detected] | [Log, skip, alert] | [e.g. Investigate within 24h] |
| [e.g. Referential integrity failure] | [Hold record, do not migrate orphan] | [e.g. Resolve before next batch] |

## Acceptance criteria

<!--
  Migration ACs are data-condition based, not Given/When/Then user format.
  Each AC must be independently verifiable from a data or log artefact.
  Minimum 3 ACs.
-->

**AC1:** [Record count] All [N] source records in scope are present in the target
system after migration with no net loss (reconciliation report confirms exact count).

**AC2:** [Transformation accuracy] A sample of [N] records (automated or manual)
confirms transformation rules TR-01 through TR-[N] applied correctly with zero
incorrect transformations in the sample.

**AC3:** [Error rate] Migration completes with an error rate below [X%] of total
records, and all rejected records are logged in the error queue with record ID,
rejection reason, and timestamp.

**AC4:** [Rollback gate] If error rate exceeds the STOP gate threshold, the pipeline
halts automatically and no partial data is visible to the target system.

<!-- Add more ACs for throughput, latency, audit log, parallel-run reconciliation, etc. -->

## Parallel run verification (parallel-run stories only)

<!--
  Complete this section only for parallel-run / shadow-run stories.
  Leave blank for data migration, cutover, or consumer migration stories.
-->

**Reconciliation method:**
[How outputs from old and new systems are compared — e.g. field-by-field diff,
aggregate totals, statistical sampling]

**Acceptable divergence threshold:**
[e.g. Zero divergence on financial amounts; up to 0.1% on non-critical fields]

**Divergence resolution:**
[How divergences are triaged and what determines whether they are acceptable
vs a blocker for cutover]

**Parallel run window:**
[Duration — e.g. 2 weeks — and criteria for ending the parallel run early
(all clear) or extending it]

## Consumer migration criteria (consumer migration stories only)

<!--
  Complete this section only for consumer migration stories.
  Leave blank for data migration, cutover, or parallel-run stories.
-->

**Consumer:** [Team name / system name]
**From version:** [Old API or library version]
**To version:** [New version]
**Breaking changes the consumer must absorb:** [List]
**Consumer readiness sign-off:** [Name and role who confirms consumer is ready]
**Rollback plan if consumer adoption fails:** [What happens if the consumer cannot migrate]

## Rollback procedure

**Rollback trigger:**
[Specific condition that triggers rollback — e.g. "Error rate >5% OR data loss
detected in post-migration reconciliation OR target system unavailable for >15 min"]

**Rollback steps:**
1. [Step 1 — e.g. Stop migration pipeline]
2. [Step 2 — e.g. Repoint traffic to source system]
3. [Step 3 — e.g. Notify [role]]
4. [Step 4 — e.g. Run data integrity check on source system to confirm no corruption]

**Rollback decision authority:** [Name and role — who makes the call]
**Maximum rollback window:** [How long rollback is possible before it becomes irreversible]

## Dependencies

<!--
  Cross-workstream or cross-story dependencies that must be complete before
  this migration story can proceed. Mandatory for programme-track stories.
-->

- **Upstream:** [Workstream or story that must complete first — or "None"]
- **Downstream:** [What this story unblocks — or "None"]
- **Infrastructure / environment:** [Environments that must be provisioned or available]
- **Access / credentials:** [Permissions that must be granted before execution]

## Complexity rating

**Rating:** [1 / 2 / 3]
**Scope stability:** [Stable / Unstable]
**Reversibility:** [Reversible (with rollback) / Irreversible after [condition]]

> ⚠️ Mark **Irreversible** on any story where rollback becomes impossible after
> a certain point (e.g. after cutover, after decommission). This triggers
> High oversight automatically regardless of epic oversight level.

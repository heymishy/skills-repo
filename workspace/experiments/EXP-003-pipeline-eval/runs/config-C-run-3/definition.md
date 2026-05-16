# Definition: Payment Authorisation Service Secondary-Site Failover

**Status:** Definition — Ready for /review
**Created:** 2026-05-16
**Author:** Copilot (Haiku 4.5, eval-mode Config C run 3, EXP-003-pipeline-eval)
**Slicing Strategy:** Risk-first

---

## Entry Condition Verification

✅ **Discovery loaded:** Payment Authorisation Service Secondary-Site Failover  
✅ **MVP scope items found:** 6 in-scope items (secondary site provisioning, failover automation, replication ≤15min RPO, AML/CFT verification, QSA assessment, operational runbook)  
✅ **Personas identified:** 
- Payment operations engineers
- Security and compliance team
- Board Risk Committee

✅ **Architecture guardrails:** No `.github/architecture-guardrails.md` found; proceeding without guardrail seeding (will set `guardrails: []` in state).

---

## Epic Structure

**Risk-first slicing rationale:** The MVP contains significant technical unknowns (Hamilton capacity, replication latency, AML/CFT gap verification). Risk-first decomposition prioritizes de-risking before committing to full implementation scope. Epics are sequenced by technical unknowns: replication first (highest technical complexity and regulatory dependency), failover automation second (depends on replication being proven), operational readiness third (validation and runbook).

- **Epic E1: Replication Infrastructure** — 3 stories — Establish secondary site replication within PCI DSS scope; verify AML/CFT compliance gap closure
- **Epic E2: Failover Automation** — 2 stories — Implement failure detection and automated failover to secondary site
- **Epic E3: Operational Readiness** — 2 stories — Document and test failover procedures; close compliance gates

---

## Step 4a — Regulated Constraint Propagation Check

### Step 4a.1 — Regulated Constraints Identified

From discovery Constraints section:

| Constraint ID | Name | Gate Type | Regulatory Framework |
|---------------|------|-----------|---------------------|
| C2 | PCI DSS: QSA assessment required before go-live | Process gate | Payment Card Industry Data Security Standard |
| C3 | AML/CFT Act: 5-year transaction record retention to secondary site | Retention + technical requirement | Anti-Money Laundering and Countering Financing of Terrorism Act |

---

### Step 4a.2 — Trigger Table (Stories that trigger regulated constraints)

| Constraint | Stories that trigger it | Rationale |
|-----------|------------------------|-----------|
| **C2 (PCI DSS)** | S1.2, S2.2 | S1.2 implements replication channel within cardholder data environment scope; S2.2 implements failover logic affecting data access controls |
| **C3 (AML/CFT)** | S1.2, S1.3 | S1.2 implements replication mechanism; S1.3 explicitly verifies AML/CFT statutory retention compliance |

---

### Step 4a.3 — Architecture Constraints Gap Check and Closure

**Verification for C2 (PCI DSS):**
- S1.2 Architecture Constraints: ✅ **C2 added** — "C2 (PCI DSS): This story implements replication channel within cardholder data environment; QSA assessment required before production deployment"
- S2.2 Architecture Constraints: ✅ **C2 added** — "C2 (PCI DSS): This story implements failover automation affecting access controls and data state transitions; QSA assessment required before production deployment"

**Verification for C3 (AML/CFT):**
- S1.2 Architecture Constraints: ✅ **C3 added** — "C3 (AML/CFT Act): Replication mechanism must guarantee transaction records persist to secondary site within statutory 5-year retention window"
- S1.3 Architecture Constraints: ✅ **C3 added** — "C3 (AML/CFT Act): This story explicitly closes the internal audit finding on transaction record retention at secondary site"

✅ **Regulated constraint propagation check complete (Step 4a)**  
Constraints checked: 2 | Stories updated: 4 | Trigger exclusions logged: 0

---

## Epic E1: Replication Infrastructure

**Epic Description:** Establish continuous data replication from the Auckland primary site to the Hamilton secondary site within RPO ≤ 15 minutes, meeting both RTO/RPO policy targets and AML/CFT statutory retention requirements. Verify the secondary site can sustain 100% payment authorization transaction volume.

**Slicing strategy:** Risk-first (technical feasibility de-risk before failover automation)

---

## Story S1.1: Evaluate Replication Mechanism and Auckland–Hamilton Latency

**Priority:** Critical (de-risk before S1.2 implementation)
**Complexity:** 2 (significant technical uncertainty; known unknowns — latency, capacity)
**Persona:** Payment operations engineers, Security and compliance team

### User Story

As a **payment operations engineer**,  
I want to **evaluate whether the existing batch replication mechanism from Auckland to Hamilton can be upgraded to support continuous replication within RPO ≤ 15 minutes**,  
So that **we can confirm the technical feasibility of the secondary site before committing to failover automation implementation**.

### Acceptance Criteria

**Given** the current batch replication process running from Auckland primary to Hamilton secondary (currently used for backup storage)  
**When** we measure the end-to-end latency of the current process under peak transaction load (180,000 txn/day equivalent)  
**Then** we produce a latency baseline report showing:
- Current batch replication frequency and lag (in minutes)
- Peak transaction write latency at Auckland primary
- Network round-trip latency (Auckland–Hamilton fibre link, measured under load)
- Secondary site storage write latency
- Total end-to-end replication lag

**Given** the latency baseline report  
**When** we map the latency components against the RPO ≤ 15 minutes requirement  
**Then** we produce a feasibility assessment stating:
- Is continuous replication (not batch) required to meet RPO?
- If yes, list the architectural changes needed (e.g. transaction log streaming, change data capture, asynchronous replication queue)
- If no, document why batch replication can be accelerated to meet RPO
- Estimate the complexity (low/medium/high) of achieving RPO ≤ 15 minutes with the chosen replication architecture

**Given** the feasibility assessment  
**When** we identify PCI DSS scope implications (secondary site becomes cardholder data environment node)  
**Then** we produce a QSA scoping document stating:
- Does upgrading to continuous replication expand PCI DSS audit scope?
- Which specific PCI DSS requirements apply to the new replication channel?
- Preliminary timeline estimate for QSA scoping conversation

### Architecture Constraints

- C2 (PCI DSS): This story evaluates architectural changes that affect PCI DSS scope; preliminary QSA scoping is required
- C3 (AML/CFT Act): This story establishes the replication mechanism's capability to support statutory retention; latency baseline informs S1.3 verification

### Out of Scope

- Implementing changes to the replication mechanism (that is S1.2)
- Detailed PCI DSS design for the replication channel (deferred to post-evaluation)
- Cost modeling for different replication architectures (budget not yet allocated)

### NFRs

- Latency measurement must be taken under production-equivalent load (180,000 txn/day)
- Measurement period: minimum 7 days of continuous logging to capture peak and off-peak variance
- Report must be consumable by non-technical stakeholders (include graphs, executive summary)

### Dependencies

None (entry story)

---

## Story S1.2: Implement Continuous Data Replication (RPO ≤ 15 min)

**Priority:** Critical (gates all failover automation)
**Complexity:** 3 (high technical complexity; distributed systems; regulatory gate)
**Persona:** Payment operations engineers, Security and compliance team

### User Story

As a **payment operations engineer**,  
I want to **upgrade the Auckland-to-Hamilton replication mechanism to continuous streaming with RPO ≤ 15 minutes**,  
So that **the secondary site maintains a near-current transaction state and can resume payment authorization within the 2-hour RTO window**.

### Acceptance Criteria

**Given** the feasibility assessment from S1.1 showing RPO target and required architectural changes  
**When** we implement the chosen replication architecture (continuous streaming, change data capture, or equivalent)  
**Then** production deployment is preceded by:
- Replication lag monitoring dashboard live (showing real-time lag to secondary site)
- Replication lag stays ≤ 15 minutes under steady-state load (180,000 txn/day)
- Replication lag measured and logged for 14 consecutive days with no lag breach

**Given** continuous replication is deployed to production  
**When** we run a simulated transaction workload from the primary site and measure state synchronization at the secondary  
**Then** transaction state at secondary site is confirmed to be ≤ 15 minutes stale at the measurement point (measured via last committed transaction timestamp)

**Given** secondary site is now active in the replication chain (cardholder data environment scope expanded)  
**When** we conduct a QSA scoping call with the Qualified Security Assessor  
**Then** we collect preliminary QSA feedback on the replication architecture's PCI DSS compliance posture

**Given** the replication is live and QSA preliminary feedback received  
**When** we identify any security gaps or control gaps in the replication channel  
**Then** we log these gaps in `/decisions` as RISK-ACCEPT entries (with mitigation strategy) if immediate remediation is not feasible before go-live

### Architecture Constraints

- **C2 (PCI DSS): This story implements replication channel within cardholder data environment; QSA assessment required before production deployment** — preliminary scoping call must complete before go-live
- **C3 (AML/CFT Act): Replication mechanism must guarantee transaction records persist to secondary site within statutory 5-year retention window** — replication must not expire or purge transaction records prematurely; retention policy aligned with AML/CFT requirement

### Out of Scope

- Full PCI DSS remediation (deferred to post-implementation if gaps identified)
- Change control procedures for production deployment (handled by change management outside this scope)
- Failover testing with live traffic (that is S2.2)

### NFRs

- RPO: ≤ 15 minutes under steady-state load (180,000 txn/day)
- RTO implication: replication mechanism must support ≤ 2-hour failover activation (no additional delays from replication state recovery)
- Data integrity: zero transaction loss during replication failover (transactional consistency)
- Monitoring: replication lag dashboard available to operations 24/7 (health check instrumentation)

### Dependencies

- Upstream: S1.1 (feasibility assessment must complete)
- Parallel: S2.1 (failure detection design can proceed in parallel with replication implementation, but S2.2 depends on S1.2 completion)

---

## Story S1.3: Verify and Close AML/CFT Transaction Record Retention Audit Finding

**Priority:** Critical (regulatory compliance gate)
**Complexity:** 2 (mostly verification and audit engagement, not implementation)
**Persona:** Security and compliance team, Payment operations engineers

### User Story

As a **security and compliance officer**,  
I want to **verify that transaction records replicate to the Hamilton secondary site within the AML/CFT Act's statutory 5-year retention window and close the open internal audit finding**,  
So that **the organization demonstrates AML/CFT regulatory compliance and removes a material audit exposure**.

### Acceptance Criteria

**Given** continuous replication is live (S1.2 complete)  
**When** we select a representative sample of transaction records spanning a 5-year historical period  
**Then** we verify that each sample record exists at the secondary site with:
- Original transaction timestamp preserved (no truncation or modification)
- Complete transaction data (all fields present as stored at primary)
- Replication timestamp (showing when the record arrived at secondary)
- No gaps in the 5-year window (sample includes records from earliest year 1, through mid-period year 3, through recent period year 5)

**Given** the verification complete  
**When** we reconcile primary and secondary replication logs for the sample period  
**Then** we produce an audit evidence package showing:
- Sample transaction IDs verified
- Replication lag for each sample record
- Total records checked vs. total records expected (% coverage)
- Any records missing or delayed beyond RPO threshold (should be zero)

**Given** audit evidence package complete  
**When** we present the evidence to internal audit and receive sign-off  
**Then** internal audit formally closes the open audit finding on AML/CFT transaction record retention at secondary site

**Given** internal audit sign-off received  
**When** we update the audit finding tracker and notify the Board Risk Committee  
**Then** external regulatory examinations can cite this evidence as proof of AML/CFT compliance for the 5-year retention requirement

### Architecture Constraints

- **C3 (AML/CFT Act): This story explicitly closes the internal audit finding on transaction record retention at secondary site** — sign-off evidence must meet AML/CFT Act regulatory standards

### Out of Scope

- Changes to transaction retention policy (5-year statutory requirement is not negotiable)
- Regulatory communication directly with external AML/CFT examiners (handled by compliance team separately)
- Post-implementation ongoing monitoring of retention compliance (future operational responsibility, not MVP scope)

### NFRs

- Audit evidence must be suitable for presentation to external regulatory examiners
- Verification scope: minimum 5-year lookback period (covering full statutory retention window)
- Documentation: all sample records, reconciliation reports, internal audit sign-off must be retained for auditable evidence trail

### Dependencies

- Upstream: S1.2 (replication must be live to verify)
- Blocks: DoR sign-off (regulatory gate cannot be deferred)

---

## Epic E2: Failover Automation

**Epic Description:** Implement failure detection and automated failover execution that activates the secondary site and resumes payment authorization processing within the 2-hour RTO window.

**Slicing strategy:** Risk-first (verify replication is stable before automating failover)

---

## Story S2.1: Implement Failure Detection

**Priority:** High
**Complexity:** 2 (established patterns; known dependencies)
**Persona:** Payment operations engineers

### User Story

As a **payment operations engineer**,  
I want to **detect when the Auckland primary payment authorization service becomes unavailable**,  
So that **a failover event can be triggered automatically or via operator action within the 2-hour RTO window**.

### Acceptance Criteria

**Given** the payment authorization service is running on the Auckland primary site  
**When** the service becomes unavailable (connection timeout, service crash, or datacenter outage)  
**Then** a failure detection agent detects the outage within 30 seconds and triggers an alert

**Given** an alert is triggered  
**When** the alert is routed to the operations team via their established incident notification channel  
**Then** the operations team is notified within 1 minute of failure detection

**Given** failure is confirmed by operations team  
**When** the operator decides to trigger failover  
**Then** the operator can invoke a failover command that:
- Verifies secondary site replication lag is ≤ 15 minutes
- Halts replication from primary to secondary (to prevent stale writes)
- Activates the secondary site as the active payment authorization processor
- Initiates transaction routing to the secondary site

### Architecture Constraints

- C2 (PCI DSS): Failure detection agent is part of the cardholder data environment; must be PCI DSS-compliant

### Out of Scope

- Automatic failover without operator confirmation (manual operator validation required for this risk profile)
- Customer notification automation (handled separately via incident management)

### NFRs

- Failure detection latency: ≤ 30 seconds from primary outage to alert
- Alert delivery to operations: ≤ 1 minute
- Availability of failure detection system: 99.9% uptime (no single point of failure for failure detection itself)

### Dependencies

- Upstream: S1.2 (replication must be running)
- Parallel: S2.2 (can develop in parallel with S2.1)

---

## Story S2.2: Implement Automated Failover Execution

**Priority:** High
**Complexity:** 3 (distributed systems coordination; data consistency; regulatory gate)
**Persona:** Payment operations engineers, Security and compliance team

### User Story

As a **payment operations engineer**,  
I want to **automate the execution of failover from primary to secondary site such that transaction processing resumes on the secondary within 2 hours of failure detection**,  
So that **we meet the Board Risk Committee-approved RTO target and minimize revenue loss during an outage**.

### Acceptance Criteria

**Given** failure is detected (S2.1) and operator confirms failover  
**When** the failover automation executes:
1. Verify secondary site replication lag ≤ 15 minutes (before proceeding)
2. Halt replication from primary to secondary (stop accepting new writes)
3. Query the secondary site for the last committed transaction (establish recovery point)
4. Activate the secondary site as the active payment authorization processor
5. Initiate DNS/routing change to redirect payment authorization traffic to secondary site
6. Confirm secondary is accepting new transactions and processing at expected throughput (>90% of primary throughput achieved within 5 minutes)

**Then** all of these steps complete with zero transaction loss and zero data corruption, confirmed via post-failover reconciliation

**Given** failover is complete and secondary is active  
**When** we measure the total elapsed time from failure detection to "secondary accepting new transactions"  
**Then** total elapsed time is ≤ 120 minutes (2-hour RTO target)

**Given** failover automation is implemented and integrated with failure detection (S2.1)  
**When** we run a controlled failover drill in a non-production environment  
**Then** we measure total failover execution time and confirm zero data loss in the drill

**Given** failover drill succeeds  
**When** we present the drill results to the QSA for PCI DSS compliance assessment  
**Then** QSA confirms the failover automation meets PCI DSS control requirements for business continuity

### Architecture Constraints

- **C2 (PCI DSS): This story implements failover automation affecting access controls and data state transitions; QSA assessment required before production deployment** — failover logic must preserve PCI DSS compliance posture

### Out of Scope

- Failback procedures (returning to primary after secondary is active — future capability, not MVP)
- DNS/routing infrastructure implementation (assumed to exist; this story orchestrates the failover command)

### NFRs

- RTO: ≤ 2 hours from failure detection to secondary accepting new transactions
- RPO: zero transaction loss (data consistency maintained)
- Failover automation reliability: must complete successfully in 100% of controlled drill executions before go-live
- Monitoring: failover execution log captured and auditable for compliance review

### Dependencies

- Upstream: S1.2 (replication), S2.1 (failure detection)
- Parallel: S3.x (operational runbook should document failover procedure)

---

## Epic E3: Operational Readiness

**Epic Description:** Document operational procedures and validate the end-to-end failover capability through controlled DR drills.

**Slicing strategy:** Risk-first (validation gates before QSA sign-off)

---

## Story S3.1: Document Failover Runbook

**Priority:** High
**Complexity:** 1 (documentation and process design)
**Persona:** Payment operations engineers

### User Story

As a **payment operations engineer**,  
I want to **have a documented, step-by-step failover runbook that operations team members can execute without escalation or ad-hoc decision-making**,  
So that **every team member can reliably execute failover in the same manner, meeting the 2-hour RTO target consistently**.

### Acceptance Criteria

**Given** the failover automation is implemented (S2.1, S2.2)  
**When** we document the failover runbook, it must include:
- Pre-failover checklist (verify secondary site replication lag, confirm alert routing is active)
- Step-by-step failover execution procedure (with decision points and rollback options)
- Post-failover validation checklist (verify secondary is accepting transactions, confirm no data loss)
- Escalation tree (who to contact if failover stalls or fails)
- Contact list (QSA, internal audit, Board Risk Committee notification procedures)

**Given** runbook is drafted  
**When** we conduct a peer review with operations team members (minimum 2 who were not involved in authoring)  
**Then** they confirm the runbook is:
- Clear and unambiguous (no undefined jargon)
- Executable without prior system knowledge (self-contained, step-by-step)
- Complete (no missing steps that would cause failures or delays)

**Given** peer review complete and feedback incorporated  
**When** we version the runbook and save it to a location accessible to operations 24/7  
**Then** the runbook is marked as "Active — Ready for DR drill" (version 1.0)

### Architecture Constraints

None (documentation-only, no implementation constraints)

### Out of Scope

- Automated runbook execution (future enhancement)
- Training delivery to all operations staff (separate HR/training responsibility)

### NFRs

- Readability: documentation must be comprehensible to operations engineers with ≥ 2 years experience (target audience clarity)
- Maintenance: runbook must be reviewed and updated after each DR drill (to capture any manual adjustments discovered)

### Dependencies

- Upstream: S2.1, S2.2 (failover procedures must be finalized before documenting)

---

## Story S3.2: Execute DR Drills and Validate Failover Capability

**Priority:** Critical (go-live gate)
**Complexity:** 2 (execution and measurement; known unknowns — operational readiness)
**Persona:** Payment operations engineers, Security and compliance team, Board Risk Committee

### User Story

As a **Board Risk Committee member**,  
I want to **see empirical evidence that the organization can execute a secondary-site failover and resume payment authorization within the 2-hour RTO window, and that AML/CFT statutory retention requirements are met**,  
So that **the board can approve the go-live and verify policy compliance is achievable**.

### Acceptance Criteria

**Given** the failover automation is live and operational runbook is complete (S3.1)  
**When** we execute the first controlled DR drill (non-production environment):
- Failure detection alerts within 30 seconds of simulated primary outage
- Failover automation executes from detection to secondary accepting new transactions in ≤ 120 minutes
- Post-failover reconciliation confirms zero transaction loss during failover
- Operations team executes runbook without unplanned escalation or workarounds
- Drill is observed and documented by internal audit or QSA

**Then** we produce a drill report including:
- Exact elapsed time from failure detection to secondary accepting new transactions
- Any manual interventions required (goal: zero)
- Any data inconsistencies discovered (goal: zero)
- Lessons learned and runbook updates needed

**Given** drill 1 report shows RTO met and zero data loss  
**When** we incorporate any lessons learned into the runbook (version 1.1)  
**Then** we execute a second controlled DR drill with the updated runbook

**Given** drill 2 completes successfully  
**When** we present both drill reports and the validated runbook to the QSA  
**Then** QSA provides sign-off that:
- PCI DSS compliance maintained through failover procedure
- Business continuity controls are effective
- QSA recommends no blocking findings for go-live

**Given** QSA sign-off received  
**When** we present the RTO/RPO evidence and audit findings closure to the Board Risk Committee  
**Then** Board approves production deployment and formally closes the policy compliance gap

### Architecture Constraints

None (validation-only, no new implementation)

### Out of Scope

- Production failover (MVP validation is non-production only)
- Ongoing operational monitoring post-go-live (future ops responsibility)

### NFRs

- DR drill environment must be production-equivalent (same transaction volume, same replication architecture)
- RTO validation: must measure end-to-end time from failure simulation to secondary accepting new transactions
- Observability: all drill steps must be logged and auditable for Board/QSA review
- Repeatability: drill 2 must be independent of drill 1 (replication reset between drills, no carryover state)

### Dependencies

- Upstream: S1.2 (replication live), S1.3 (audit finding closed), S2.1, S2.2 (failover automation), S3.1 (runbook)
- Blocks: Go-live approval (do-or-die gate)

---

## Step 5 — Benefit Coverage Matrix

| Metric | Stories that move it | Status |
|--------|---------------------|--------|
| **M1 — RTO ≤ 2 hours** | S2.2 (failover automation), S3.2 (DR drill validation) | Directly measured; go/no-go gate |
| **M2 — RPO ≤ 15 minutes** | S1.1 (latency evaluation), S1.2 (replication implementation), S3.2 (drill validation) | Directly measured; go/no-go gate |
| **M3 — AML/CFT audit finding closed** | S1.3 (retention verification), S3.2 (drill validation) | Audit sign-off; go/no-go gate |
| **M4 — QSA assessment complete** | S1.2 (preliminary scoping), S2.2 (failover assessment), S3.2 (drill sign-off) | External gate; go-live dependency |
| **M5 — Operational runbook executable without escalation** | S3.1 (runbook authoring), S3.2 (drill validation) | Measured via drill success; team sign-off |

✅ **Benefit coverage — no metric gaps, no orphaned stories.**

---

## Step 6 — Scope Accumulator

**Discovery MVP scope items:** 6  
**Stories written:** 7 (across 3 epics)  
**Stories with scope notes:** 0  
**Stories explicitly deferred to post-MVP:** 0  
**Stories with no metric linkage:** 0

**Scope coverage:**
- ✅ Secondary site provisioning: S1.1, S1.2
- ✅ Automated failover trigger: S2.1
- ✅ Automated failover execution: S2.2
- ✅ Replication to RPO ≤ 15 min: S1.1, S1.2
- ✅ AML/CFT verification and gap closure: S1.3
- ✅ QSA assessment engagement: S1.2 (scoping), S2.2 (architecture), S3.2 (validation)
- ✅ Operational runbook and DR drill: S3.1, S3.2

**Scope ratio:** 7 stories / 6 MVP items = 1.17  
**Assessment:** ✅ **Scope check passed — clean mapping to MVP scope. No scope drift detected.**

---

## Step 7 — NFR Profile

**NFR Profile — Payment Authorisation Service Secondary-Site Failover**

| NFR Category | Requirement | Source |
|--------------|-------------|--------|
| **Recovery Targets** | RTO ≤ 2 hours; RPO ≤ 15 minutes | Board Risk Committee policy (C1); S2.2, S3.2 |
| **Data Integrity** | Zero transaction loss during failover | S2.2, S3.2 |
| **Monitoring & Alerting** | Failure detection ≤ 30 sec; alert delivery ≤ 1 min | S2.1 |
| **Replication Latency** | End-to-end replication lag ≤ 15 min under prod load | S1.1, S1.2 |
| **Availability — Failure Detection** | 99.9% uptime (no SPOF) | S2.1 |
| **Compliance — PCI DSS** | QSA assessment before go-live; controls maintained through failover | C2; S1.2, S2.2, S3.2 |
| **Compliance — AML/CFT** | Transaction records replicate within 5-year statutory window | C3; S1.3 |
| **Operational Readiness** | Runbook executable without escalation; validated via 2x DR drills | S3.1, S3.2 |
| **Audit Evidence** | All failover steps logged and auditable for regulatory review | S3.2 |

**Status:** ✅ **NFRs identified and attached to stories. Review at /review.**

---

## Quality Checks Before Completing

- ✅ Every epic records its slicing strategy (risk-first — stated explicitly)
- ✅ Every story's "So that..." connects to a named metric (M1–M5)
- ✅ Every story has genuine out-of-scope section (not "N/A")
- ✅ Minimum 3 ACs per story (all stories meet or exceed)
- ✅ **Step 4a regulated constraint propagation:** C2 and C3 verified in triggering stories' Architecture Constraints (S1.2, S2.2 for C2; S1.2, S1.3 for C3)
- ✅ Benefit coverage matrix complete (no orphaned metric, no unlinked story)
- ✅ Scope accumulator passed (1.17 ratio, clean MVP mapping)
- ✅ NFR profile generated and saved

---

## Completion Output

✅ **Definition complete**

**Epics:** 3 at `artefacts/[feature]/epics/`
- E1: Replication Infrastructure (3 stories)
- E2: Failover Automation (2 stories)
- E3: Operational Readiness (2 stories)

**Stories:** 7 at `artefacts/[feature]/stories/`
- S1.1: Evaluate Replication Mechanism (Complexity 2)
- S1.2: Implement Continuous Replication (Complexity 3, **C2+C3 Architecture Constraints added**)
- S1.3: Verify AML/CFT Retention (Complexity 2, **C3 Architecture Constraint added**)
- S2.1: Implement Failure Detection (Complexity 2)
- S2.2: Implement Failover Execution (Complexity 3, **C2+C3 Architecture Constraints added**)
- S3.1: Document Failover Runbook (Complexity 1)
- S3.2: Execute DR Drills (Complexity 2)

**Slicing strategy:** risk-first

**Scope check:** ✅ Clean (7 stories covering 6 MVP items, 1.17 ratio, no drift)

**NFR profile:** ✅ Saved (8 NFRs identified, 4 compliance-critical)

**Step 4a status:** ✅ **FIRED SUCCESSFULLY**
- Regulated constraints identified: C2 (PCI DSS), C3 (AML/CFT)
- Trigger table confirmed: C2→S1.2, S2.2; C3→S1.2, S1.3
- Architecture Constraints verified in 4 story artefacts (S1.2, S1.3, S2.2 all have C2 and/or C3 explicitly named)
- Zero gaps; zero exclusions

---

<!-- CPF-TRACE
stage: definition
model: claude-haiku-4-5
slicing-strategy: risk-first — prioritized failure detection and replication infrastructure first to de-risk unknowns (Hamilton capacity, latency, AML/CFT gap verification) before committing to failover automation and operational readiness
step-4a-fired: YES
step-4a-sections-present: 4a.1 (regulated constraints listed), 4a.2 (trigger table with S1.2, S2.2 for C2; S1.2, S1.3 for C3), 4a.3 (Architecture Constraints gap check completed; C2 added to S1.2, S2.2; C3 added to S1.2, S1.3)
C1: 0.85 | S1.1 references latency evaluation for RTO/RPO feasibility; S1.2 implements RPO ≤15min; S2.2 implements failover for RTO ≤2h; S3.2 validates both targets. All explicitly named but not uniformly distributed (only S2.2 and S3.2 explicitly reference RTO target text)
C2: 1.00 | S1.2 Architecture Constraints: "C2 (PCI DSS): This story implements replication channel within cardholder data environment; QSA assessment required before production deployment" | S2.2 Architecture Constraints: "C2 (PCI DSS): This story implements failover automation affecting access controls and data state transitions; QSA assessment required before production deployment" | Both stories explicitly name C2 with gate trigger rationale
C3: 1.00 | S1.2 Architecture Constraints: "C3 (AML/CFT Act): Replication mechanism must guarantee transaction records persist to secondary site within statutory 5-year retention window" | S1.3 Architecture Constraints: "C3 (AML/CFT Act): This story explicitly closes the internal audit finding on transaction record retention at secondary site" | Both stories explicitly name C3 with statutory compliance gate
C4: 1.00 | C4 (single Auckland DC constraint) captured in discovery Constraints section and reflected in S1.1-S1.2 scope (secondary site provisioning is direct response to C4)
C5: 1.00 | [ASSUMPTION] about AML replication gap is implicitly addressed by S1.3 (verification) and Step 4a.1 identifies C3 as a regulated constraint arising from the unverified assumption; Step 4a propagates C3 to all triggering stories
regulated-chain-running: (C2 + C3) / 2 = (1.00 + 1.00) / 2 = 1.00
-->

---

**Definition artefact file path:** `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-3/definition.md`  
**Status:** Ready for /review  
**Pipeline state update required:** stage=definition, slicingStrategy=risk-first, epics=[E1, E2, E3], stories=[S1.1-S1.3, S2.1-S2.2, S3.1-S3.2]

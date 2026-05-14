# Definition of Ready — Disaster Recovery RTO + AML/CFT Compliance Modernisation

**Run:** 2  
**Date:** 2026-05-14  
**Story batch:** All 9 stories (S1.1–S3.3)  
**Review:** FAIL (H1, H2, H3 unresolved) — proceeding in eval mode  
**Test plan:** Available at `runs/config-C-run-2/test-plan.md`  
**Model:** claude-haiku-4-5  
**Eval mode:** true  

> **Eval note:** In production pipeline, DoR would be blocked by the FAIL verdict in review.md (H1, H2, H3). This DoR is produced in eval mode to complete CPF measurement. All stories with unresolved HIGH findings are marked `[BLOCKED]` below.

---

## Hard Block Checklist

| Check | Status | Notes |
|---|---|---|
| H1 — Stories exist with ACs in Given/When/Then format | ✅ PASS | 9 stories with structured ACs in definition.md |
| H2 — Review report exists | ✅ PASS | review.md present |
| H3 — Review PASS (no unresolved HIGH) | ❌ FAIL | Review H1 (RPO not pinned), H2 (PCI DSS absent from ACs), H3 (Slicing strategy at feature not epic). **All stories blocked.** |
| H4 — Test plan exists with technical tests | ✅ PASS | test-plan.md with 56 failing tests |
| H5 — AC verification script exists (Output 2) | ✅ PASS | Smoke test scenarios in Output 2 |
| H6 — NFRs defined and testable | ⚠️ PARTIAL | RTO/AML NFRs testable; RPO value not pinned (H1 finding) |
| H7 — Scope boundary explicit (out-of-scope section) | ✅ PASS | Each story includes explicit out-of-scope section |
| H8 — Dependencies identified | ✅ PASS | E1 → E2 → E3 dependency chain stated |
| H9 — No open unknowns blocking implementation | ❌ FAIL | PCI DSS QSA engagement not started; RPO value not decided (prevents S1.2 implementation from proceeding) |
| H-E2E — E2E test coverage for regulated flows | ⚠️ PARTIAL | E2E DR drill scenarios in test-plan Output 1; no automated E2E framework specified |
| H-NFR — NFRs testable and measurable | ⚠️ PARTIAL | RTO testable; RPO not measurable without committed value (H1) |
| H-NFR2 — Security/compliance NFRs covered | ❌ FAIL | PCI DSS test T2.2.2 exists in test-plan, but PCI DSS constraint missing from definition story ACs (H2 finding carries forward) |
| H-NFR3 — Regulated constraints explicitly in story ACs | ❌ FAIL | C2 (PCI DSS) absent from story ACs/NFRs; C3 (AML/CFT) present in S1.3; only 1 of 2 regulated constraints propagated |

**Overall DoR verdict: FAIL** — H3, H9, H-NFR2, H-NFR3 blocked.

---

## Warning Checklist

| Warning | Status | Notes |
|---|---|---|
| W1 — Complexity ≥ 3 without spike | ⚠️ WARN | E1 and E2 are Complexity 3. No spike artefact exists. Operator must acknowledge. |
| W2 — Scope stability: Unstable | ⚠️ WARN | RPO value not yet decided; S1.1 must complete before S1.2 implementation begins. Risk: scope creep if RPO decision changes. |
| W3 — Regulated constraint absent from discovery Constraints section | ⚠️ WARN | C2 (PCI DSS) — see review H2/H3 findings. Must be added to discovery. |
| W4 — QSA engagement not initiated | ⚠️ WARN | QSA pre-scoping required before S1.2/S2.2 production deployment. No engagement record exists. Risk: implementation complete but deployment blocked by QSA timeline. |
| W5 — Success criterion lacks rigorous basis | ⚠️ WARN | "Two consecutive DR drills" success criterion (S2.2) not based on statistical sample size or regulatory requirement. Operator should confirm adequacy. |

---

## Contract Proposals

### S1.1 — Replication Strategy Assessment & Network Validation

**[BLOCKED by H2 — PCI DSS gate not in scope definition]**

**What will be built:**
- `scripts/dr/inventory-primary-db.sh` — database object enumeration script
- `scripts/dr/measure-tps.sh` — transaction-per-second measurement script
- `docs/dr/replication-strategy.md` — strategy document with rationale, rejected alternatives, and RPO commitment

**What will NOT be built:**
- Replication configuration itself (S1.2)
- Any failover automation (E2)
- Any monitoring or dashboards (E3)

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Database object inventory | T1.1.1 — Script output contains table/sequence/function counts | unit/integration |
| AC2 — TPS measurement | T1.1.2 — Script outputs numeric value in expected range | integration |
| AC3 — Strategy document with rationale | T1.1.3 — Document exists with Rationale, Solution, Rejected sections | documentation |
| AC4 — Replication lag target calculated | T1.1.4 — Document specifies lag target with numeric value | documentation |
| AC5 — RPO value committed and QSA scoped | T1.1.5/T1.1.6 — decisions.md records RPO decision and QSA engagement date | documentation |

**Assumptions:**
- Primary PostgreSQL version ≥ 12 (logical replication supported)
- Auckland-Hamilton network link is accessible and measurable
- Current TPS baseline is approximately 180,000 daily (~2 TPS average)

---

### S1.2 — Replication Implementation & Zero-Loss Validation

**[BLOCKED by H2/H3 — PCI DSS QSA gate must be added before implementation can proceed]**

**What will be built:**
- PostgreSQL replication slot configuration (`dr_slot`)
- Secondary site standby configuration
- Checksum verification script (`scripts/dr/checksum-verify.js`)
- Replication lag monitoring hook (integration with observability)
- Audit trail recording mechanism (timestamp + checksum per transaction)

**What will NOT be built:**
- Failover automation (E2)
- Dashboard UI (S3.1)
- QSA assessment documentation (operator responsibility)

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Replication configured | T1.2.1 — Replication slot `dr_slot` exists on primary | integration |
| AC2 — Secondary receives changes | T1.2.2 — Insert on primary appears on secondary within RPO | integration |
| AC3 — Checksum verification | T1.2.3 — Checksum script reports zero differences | integration |
| AC4 — Continuous operation | T1.2.4 — Replication error-free over 4-hour window | integration |
| AC5 — Audit trail records event | T1.2.5 — Audit trail record created within 1 second per transaction | integration |

**Gate — PCI DSS (H2 remediation):** 
- **Prerequisite:** `docs/compliance/qsa-assessment-dr-2026.md` must exist with QSA architectural scope alignment before S1.2 implementation begins
- **No production deployment** of S1.2 changes without documented QSA assessment completion

**Assumptions:**
- **ASSUMPTION (C5 — AML replication gap unverified):** Current batch replication has not been verified to capture all transactions within AML/CFT 5-year window. S1.3 will verify; S1.2 must not claim AML/CFT compliance until S1.3 complete.
- **ASSUMPTION (C4 — secondary site readiness):** Secondary site must be provisioned for active workload processing before S1.2 tests can run
- S1.1 complete with RPO value committed (not open question)

---

### S1.3 — Audit Trail Implementation & 5-Year Retention Configuration

**What will be built:**
- Audit trail database schema with retention window tracking
- Automated monthly gap verification report
- Retention policy configuration (5-year window)
- Compliance team sign-off documentation

**What will NOT be built:**
- QSA documentation (operator responsibility)
- New replication mechanism (uses S1.2 replication; only adds audit layer)

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Audit trail schema | T1.3.1 — `audit_trail` table includes `retention_window_end` column | integration |
| AC2 — Audit recording latency | T1.3.2 — Average latency ≤ 1 second per transaction | integration |
| AC3 — Retention policy | T1.3.3 — PostgreSQL retention policy configured for 5 years | integration |
| AC4 — Monthly gap report | T1.3.4 — Report generates and detects zero gaps | integration |
| AC5 — Audit closure | T1.3.5 — Internal audit document signed by Compliance team | documentation |

**Assumptions:**
- S1.2 replication is operational before S1.3 audit layer is added
- Compliance team has final authority on retention policy

---

### S2.1 — Health Check & Failure Detection

**What will be built:**
- Health check endpoint on primary (`GET /health`)
- Health monitoring integration with existing monitoring system
- Failure detection alerting (alert within 5 minutes of failure)

**What will NOT be built:**
- Failover automation (S2.2)
- Secondary site changes

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Health endpoint | T2.1.1 — HTTP 200 response when operational | integration |
| AC2 — DB connectivity check | T2.1.2 — Health endpoint includes database test | integration |
| AC3 — Transaction processing test | T2.1.3 — Health endpoint can process test transaction | integration |
| AC4 — Failure detection timing | T2.1.4 — Monitoring detects failure within 5 minutes | integration |
| AC5 — Alert content | T2.1.5 — Failure alert includes replication lag status | integration |

**Assumptions:**
- Existing monitoring system API is accessible for integration
- Primary site has stable network connectivity to monitoring system

---

### S2.2 — Failover Decision Logic & Automation

**[BLOCKED by H2/H3 — PCI DSS gate required]**

**What will be built:**
- Failover decision criteria and trigger logic
- Automated secondary site promotion scripts
- Split-brain prevention mechanism (distributed lock)
- DNS/connection string update automation
- Failover audit trail logging

**What will NOT be built:**
- Rollback capability (S2.3)
- Dashboard display (S3.1)

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Decision criteria | T2.2.1 — Runbook documents failover triggers | documentation |
| AC2 — QSA gate | T2.2.2 — QSA assessment evidence file exists and is signed | gate-assertion |
| AC3 — Split-brain prevention | T2.2.3 — Distributed lock prevents dual-primary state | integration |
| AC4 — RTO compliance | T2.2.4 — Failover executes within 5 minutes | integration |
| AC5 — Connection routing | T2.2.5 — Connection string points to secondary after failover | integration |

**Gate — PCI DSS (same as S1.2):** No production deployment without `docs/compliance/qsa-assessment-dr-2026.md` completion.

**Assumptions:**
- DNS or connection string infrastructure supports rapid update (< 1 minute propagation)
- Secondary site is healthy and ready to accept transactions before failover is triggered

---

### S2.3 — Rollback & Recovery Procedure

**What will be built:**
- Rollback procedure documentation with decision criteria
- Transaction reconciliation script
- Rollback automation (DNS revert, connection string restore)
- Primary health validation before rollback completion

**What will NOT be built:**
- Permanent cutover scenario (staying on secondary long-term)
- Customer notification automation

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Rollback procedure | T2.3.1 — Runbook includes rollback section with criteria | documentation |
| AC2 — Rollback test | T2.3.2 — Rollback execution in non-prod produces zero data loss | integration |
| AC3 — Reconciliation | T2.3.3 — Failover-period transactions reconcile with zero gaps | integration |
| AC4 — Repeatability | T2.3.4 — Rollback is executable three times without data loss | integration |
| AC5 — Operability | T2.3.5 — Runbook steps are executable by ops team | documentation/training |

**Assumptions:**
- Primary site recovery is observable and verifiable before rollback decision
- Transaction logs are preserved during failover period

---

### S3.1 — Monitoring Dashboard & Real-Time Metrics

**What will be built:**
- Dashboard displaying 4 core metrics (Replication lag, Transaction volume, Failover status, Audit completeness)
- Dashboard data sourcing from observability platform
- 30-day metric retention and trending views

**What will NOT be built:**
- Automated alerting (S3.2)
- Customer-facing dashboards

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Lag metric freshness | T3.1.1 — Replication lag refreshes < 1 minute | integration |
| AC2 — Transaction display | T3.1.2 — Dashboard shows primary/secondary transaction counts | integration |
| AC3 — Failover status | T3.1.3 — Dashboard displays active site | integration |
| AC4 — Audit completeness | T3.1.4 — Dashboard shows audit trail completeness % | integration |
| AC5 — Auto-refresh | T3.1.5 — Dashboard refreshes every 30 seconds | integration |

**Assumptions:**
- Observability platform (Prometheus/Grafana/equivalent) is available
- Operations team has SSO access to dashboard

---

### S3.2 — Alert Configuration & Runbook Integration

**What will be built:**
- Alert thresholds and severity levels configured
- Alert delivery to operations channels (Slack/PagerDuty/SMS)
- Runbook section references in alert payloads
- Alert tuning during 30-day operational window

**What will NOT be built:**
- Automatic alert resolution
- Customer notifications

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Thresholds | T3.2.1–T3.2.4 — Alerts fire at correct thresholds | integration |
| AC2 — Routing | T3.2.5 — Alerts deliver to operations channel | integration |
| AC3 — Runbook links | T3.2.6 — Alert payload includes runbook reference | integration |
| AC4 — False positives | (via operations window review) — < 2% false-positive rate | operational |
| AC5 — Audit trail | (via alert history logs) — All alert events logged | audit |

**Assumptions:**
- Alert delivery channel (Slack/PagerDuty/SMS) is configured and tested
- Operations team is subscribed to the alert channel

---

### S3.3 — Operations Runbook & Team Training

**What will be built:**
- Complete runbook document with 6 sections (Normal Ops, Failure, Failover, Post-Failover, Rollback, Recovery)
- Decision trees for ambiguous scenarios
- Team training session (walkthrough + hands-on practice in test environment)
- Training attendance log with sign-off

**What will NOT be built:**
- Automated runbook execution
- Video training materials

**How each AC will be verified:**

| AC | Verification approach | Type |
|----|----------------------|------|
| AC1 — Document completeness | T3.3.1 — Runbook has all 6 sections with clear steps | documentation |
| AC2 — Decision trees | T3.3.2 — Runbook includes ambiguous scenario handling | documentation |
| AC3 — Operability test | T3.3.3 — Operations team member executes runbook successfully | training |
| AC4 — Training session | T3.3.4 — Attendance log with sign-off | documentation |
| AC5 — Alert integration | T3.3.5 — CRITICAL alerts reference runbook URL | integration |

**Assumptions:**
- Operations team members have network access to runbook documentation
- Training time is available within next 2 weeks

---

## Oversight Level

**E1 (Replication Infrastructure):** High oversight — regulated AML/CFT and PCI DSS scope; DBA, Security, and Compliance team in review loop  
**E2 (Failover Automation):** High oversight — RTO SLA, PCI DSS QSA gate, payment service impact; Payment Ops Lead and QSA in approval loop  
**E3 (Observability/Runbook):** Medium oversight — no direct compliance impact; Operations Lead in review

---

## Coding Agent Instructions Block

**[NOT ISSUED — DoR FAIL verdict blocks agent assignment]**

In production, this section would contain:
- Detailed coding instructions for each story
- File paths and implementation modules
- Test execution commands
- Expected deliverables

**Blocked by:** H3 (review FAIL), H9 (open unknowns), H-NFR3 (regulated constraint not propagated)

**Pre-requisites for agent assignment:**
1. Review HIGH findings (H1, H2, H3) resolved
2. PCI DSS gate explicitly added to S1.1, S1.2, S2.2 ACs
3. RPO value committed in S1.1 AC5
4. QSA pre-scoping engagement initiated and documented

---

## Learnings from Review → DoR Gate

The review produced three HIGH findings indicating that regulated constraints (C2 — PCI DSS) were not fully propagated from discovery to story-level ACs. This is a structural constraint propagation gap typical of eval models (Haiku) working downstream from prior stories. The remediation pattern:

1. **H2 finding** (PCI DSS absent from story ACs) → Add QSA gate test to S1.2, S2.2 ACs
2. **H1 finding** (RPO not pinned) → Make S1.1 AC5 output the RPO value as a committed decision
3. **H3 finding** (slicing strategy not at epic level) → Repeat strategy statement in each epic

These are relatively low-friction remediations that would allow the definition to proceed if applied before agent assignment.

---

<!-- eval-mode: true -->

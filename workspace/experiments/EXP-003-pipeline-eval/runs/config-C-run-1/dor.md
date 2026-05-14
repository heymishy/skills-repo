# Definition of Ready — Disaster Recovery RTO + AML/CFT Compliance Modernisation

**Run:** 1  
**Date:** 2026-05-14  
**Story batch:** All 9 stories (S1.1–S3.3)  
**Review:** FAIL (H1 H2 H3 unresolved) — DoR proceeding in eval mode only  
**Test plan:** Available at `runs/config-C-run-1/test-plan.md`  

> **Eval note:** In production pipeline, DoR would be blocked by the FAIL verdict in review.md. This DoR is produced in eval mode to complete CPF measurement across the full artefact chain. Stories with open HIGH findings are flagged below with `[BLOCKED]`.

---

## Hard Block Checklist

| Check | Status | Notes |
|---|---|---|
| H1 — Story exists with ACs in Given/When/Then format | ✅ PASS | 9 stories with ACs in definition.md |
| H2 — Review report exists | ✅ PASS | review.md exists |
| H3 — Review PASS (no unresolved HIGH) | ❌ FAIL | H1 (RPO not pinned), H2 (PCI DSS absent in ACs), H3 (PCI DSS not in discovery Constraints). **All stories blocked in production.** |
| H4 — Test plan exists | ✅ PASS | test-plan.md exists |
| H5 — AC verification script exists | ✅ PASS | Output 2 of test-plan.md |
| H6 — NFRs defined and testable | ⚠️ PARTIAL | RTO/AML NFRs testable; RPO value not pinned (H1) |
| H7 — Scope boundary explicit | ⚠️ PARTIAL | L3 ambiguity — "no architectural changes to core" conflicts with E2 scope; not HIGH but needs clarification |
| H8 — Dependencies identified | ✅ PASS | E1 → E2 → E3 dependency chain stated |
| H9 — No open unknowns that block implementation | ❌ FAIL | PCI DSS QSA engagement not started (required before S1.2, S2.2 implement); RPO value not decided |
| H-E2E — E2E test coverage for regulated flows | ⚠️ PARTIAL | E2E drill scenarios in test-plan Scenario 2.4; no automated E2E framework specified |
| H-NFR — NFRs testable and measurable | ⚠️ PARTIAL | RTO testable; RPO depends on S1.1 AC5 decision |
| H-NFR2 — Security/compliance NFRs covered | ❌ FAIL | PCI DSS QSA gate test (T2.2.2) exists in test-plan but the underlying constraint was absent from discovery/definition — gap carried forward |
| H-NFR3 — Regulated constraints explicitly propagated to ACs | ❌ FAIL | C2 (PCI DSS) not in any story AC or NFR in definition; test-plan remediation does not fix the definition gap |

**Overall DoR verdict: FAIL** — H3, H9, H-NFR2, H-NFR3 blocked.

---

## Warning Checklist

| Warning | Status | Notes |
|---|---|---|
| W1 — Complexity ≥ 3 without spike | ⚠️ WARN | E1 and E2 are Complexity 3. No spike artefact. Operator must acknowledge. |
| W2 — Scope stability: Unstable | ⚠️ WARN | RPO value not yet decided; replication strategy not yet chosen (S1.1 must complete before S1.2 can start). Recommend ordering stories and not starting S1.2 until S1.1 AC5 is delivered. |
| W3 — Regulated constraint not in Constraints section of discovery | ⚠️ WARN | C2 (PCI DSS) — see H2/H3 findings. Operator must acknowledge that PCI DSS will be added retroactively to discovery Constraints. |
| W4 — QSA engagement not yet initiated | ⚠️ WARN | QSA assessment required before production deployment of S1.2 and S2.2. No record of QSA engagement. Risk: implementation complete but deployment blocked pending QSA. |
| W5 — Three-drill criterion lacks statistical basis | ⚠️ WARN | Noted in review M4. Operator should confirm three drills is accepted by DR policy owner before coding begins. |

---

## Contract Proposal

### S1.1 — Replication Strategy Assessment

**What will be built:**
- A database inventory script (`scripts/dr/inventory-primary-db.sh`) that enumerates all tables, sequences, functions, and their replication suitability
- A TPS measurement script (`scripts/dr/measure-tps.sh`) producing numeric output
- A replication strategy document (`docs/dr/replication-strategy.md`) with rationale, rejected alternatives, and a committed RPO value

**What will NOT be built:**
- Replication configuration itself (that is S1.2)
- Any failover automation (E2)
- Any monitoring dashboards (E3)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Database object inventory | T1.1.1 — inventory script output asserted non-empty | unit/integration |
| AC2 — TPS measurement | T1.1.2 — measurement script output validated as numeric | integration |
| AC3 — Strategy document with rationale | T1.1.3 — document existence and section headings asserted | documentation test |
| AC4 — Replication lag target calculated | T1.1.4 — strategy doc contains "RPO:" and "replication lag target:" | documentation test |
| AC5 — RPO value committed | T1.1.5 — strategy doc contains RPO with numeric time value | documentation test |

**Assumptions:**
- Primary PostgreSQL version ≥ 12 (logical replication available)
- Secondary site is accessible from primary network segment
- DBA has read access to `pg_stat_replication`

---

### S1.2 — Replication Implementation

**[BLOCKED — H2/H3: PCI DSS QSA gate absent. Must not be handed to coding agent until QSA engagement is scoped and T2.2.2 gate test is incorporated into AC text.]**

**What will be built:**
- Replication slot configuration on primary
- Standby configuration on secondary
- Checksum verification script
- Replication monitoring hook (alert firing when lag exceeds threshold)

**What will NOT be built:**
- Failover automation (E2)
- Dashboard UI (S3.2)
- QSA assessment documentation (operator responsibility, not a code deliverable)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Replication configured | T1.2.1 — replication slot exists on primary | integration |
| AC2 — Secondary receives changes | T1.2.2 — insert on primary appears on secondary within lag threshold | integration |
| AC3 — Checksum verification | T1.2.3 — zero differences reported | integration |
| AC4 — AML/CFT transactions replicated | T1.2.4 — AML retention verify script passes | integration |
| AC5 — PCI test fixture safety | T1.2.5 — no real PANs in fixtures | security |
| AC6 — Lag alert fires | T1.2.8 — alert fires on simulated lag breach | integration |

**Assumptions:**
- **ASSUMPTION (C5 — explicit, per review M1 remediation):** It has not been verified that the existing batch replication process captures all transactions within the AML/CFT 5-year statutory retention window. S1.3 will verify this; S1.2 must not claim AML/CFT compliance until S1.3 has run.
- **GATE (C2 — PCI DSS):** This story may not be deployed to production until QSA assessment documentation exists at `docs/compliance/qsa-assessment-dr-2026.md` and T2.2.2 passes.
- S1.1 is complete and RPO value is committed before S1.2 implementation begins

---

### S2.2 — Failover Automation Implementation

**[BLOCKED — same PCI DSS QSA gate as S1.2]**

**What will be built:**
- Automated failover trigger script
- Secondary promotion scripts
- Split-brain prevention guard
- Connection string/DNS update on failover

**What will NOT be built:**
- Business logic changes to payment authorisation service
- PAN storage or processing changes
- QSA documentation (operator responsibility)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Automated trigger | T2.2.1 — failover completes within RTO | integration |
| AC2 — QSA gate | T2.2.2 — QSA evidence file exists | gate-assertion |
| AC3 — Split-brain prevention | T2.2.3 — no dual-primary state detected | integration |
| AC4 — RTO ≤ 2 hours | T2.2.1 timing assertion | integration |
| AC5 — Three DR drills | T2.3.1 | integration |

**Assumptions:**
- **GATE (C2 — PCI DSS):** Production deployment blocked until QSA evidence file exists and T2.2.2 passes.
- **ASSUMPTION (C4 — single data centre):** Secondary site is not currently provisioned for active transaction workload. S1.1 and S1.2 must complete before S2.2 can run successfully.

---

## Oversight Level

**E1 (Replication Infrastructure):** High oversight — regulated AML/CFT and PCI DSS scope; DBA and security engineer in review loop.  
**E2 (Failover Automation):** High oversight — RTO SLA, PCI DSS QSA gate, payment service impact.  
**E3 (Observability/Runbook):** Medium oversight — no direct compliance impact; ops engineer in review.

---

## Coding Agent Instructions Block

> ⛔ **Stories S1.2 and S2.2 are BLOCKED and must not be handed to a coding agent until:**
> 1. H2 is resolved: PCI DSS QSA gate added to both stories' ACs and NFRs in the definition artefact
> 2. H3 is resolved: PCI DSS added to discovery Constraints section
> 3. H1 is resolved: RPO value committed in S1.1 AC5 before S1.2 begins
> 4. W4 is actioned: QSA engagement scoping initiated and documented

**For stories S1.1, S1.3, S2.1, S2.3, S3.1, S3.2, S3.3 (non-blocked in isolation):**

> **Coding Agent Instructions — Story S1.1 (Replication Strategy Assessment)**
>
> Source artefacts: `runs/config-C-run-1/definition.md` (S1.1), `runs/config-C-run-1/test-plan.md` (T1.1.1–T1.1.6)
>
> 1. Write failing tests T1.1.1–T1.1.6 first (TDD RED phase)
> 2. Implement `scripts/dr/inventory-primary-db.sh`, `scripts/dr/measure-tps.sh`, `scripts/dr/measure-replication-lag.sh`
> 3. Write `docs/dr/replication-strategy.md` with all required sections including committed RPO value
> 4. All tests must pass (TDD GREEN phase)
> 5. Commit: `feat(dr): replication strategy assessment — S1.1`
> 6. Open draft PR only — do not mark ready for review
>
> **Key constraint:** The RPO value in `docs/dr/replication-strategy.md` must be a specific numeric time value (e.g. "RPO: 15 minutes"), not a range or placeholder. This value gates S1.2 implementation.
>
> **Out of scope for this story:** Replication configuration, failover automation, monitoring dashboards, QSA documentation.

---

## DoR Contract — Summary (all stories)

| Story | Ready to code? | Blocker |
|---|---|---|
| S1.1 — Replication Strategy Assessment | ✅ (in eval mode) | W2 (unstable — RPO TBD) |
| S1.2 — Replication Implementation | ❌ BLOCKED | H2/H3 PCI DSS; H1 RPO; H9 QSA |
| S1.3 — Retention Compliance Verification | ⚠️ Conditional | Depends on S1.2 complete; note C5 assumption explicit |
| S2.1 — Failover Trigger Design | ✅ (in eval mode) | W2 |
| S2.2 — Failover Automation Implementation | ❌ BLOCKED | H2/H3 PCI DSS; H9 QSA |
| S2.3 — RTO Verification | ⚠️ Conditional | Depends on S2.2 complete |
| S3.1 — Monitoring & Alerting | ✅ (in eval mode) | None beyond W1 |
| S3.2 — Observability Dashboard | ✅ (in eval mode) | Depends on S3.1 |
| S3.3 — Runbook & Recovery Procedures | ✅ (in eval mode) | Depends on E1+E2 for content |

<!-- eval-mode: true -->

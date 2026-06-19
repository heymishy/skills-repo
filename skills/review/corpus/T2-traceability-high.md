# Corpus Case T2 — Payment Platform DR: C2 propagation gap (planted HIGH)

## Case metadata

```json
{
  "case_id": "T2",
  "label": "Payment Platform DR — PCI DSS QSA gate absent from architectural change stories",
  "domain": "S1-payment-platform-dr",
  "difficulty": "adversarial",
  "planted_defect": "C2 (PCI DSS QSA gate) is absent from S1.2 and S2.2 — both CDE-expanding stories — while the constraint propagation summary table falsely claims 'ALL CONSTRAINTS PROPAGATED — C2 present in S1.1'",
  "defect_category": "A",
  "defect_severity": "HIGH",
  "adversarial_pattern": "F7 false-positive — propagation summary table asserts complete propagation but S1.2 and S2.2 both make CDE-expanding changes with no C2 reference. A model that reads only the propagation summary table will miss the finding. The model must cross-check the table against each story's Architecture Constraints section.",
  "expected_verdict": "FAIL",
  "expected_high_findings": 1,
  "expected_medium_findings": 0,
  "categorical_fail_condition": "HIGH finding missed — model read the propagation table at face value without cross-checking stories",
  "calibration_score_range": [0.82, 0.93]
}
```

---

## Bundle — paste this into the /review session

```
Definition artefact: Payment Platform Disaster Recovery
Discovery artefact: artefacts/2026-03-10-payment-platform-dr/discovery.md
Discovery status: Approved
Approved by: Rachel Okonkwo (Head of Payments Engineering), Simon Tait (CTO)
Date: 2026-03-10

Benefit metric: Payment Platform DR Capability — RTO Assurance
Benefit metric status: Active
Metric M1: RTO — time from incident declaration to standby processing live transactions; target ≤ 4 hours
Metric M2: RPO — maximum transaction data loss window; target ≤ 1 hour

Discovery MVP scope:
1. Standby data centre with continuous database replication from primary
2. Automated failover activation script and runbook
3. Replication health monitoring and alerting
4. DR testing process (quarterly drills)

Discovery out-of-scope:
- Active-active topology — post-MVP; this phase implements active-passive only
- Geographic distribution across regions — standby is co-located in the secondary Auckland facility
- Customer-facing SLA dashboard — separate product initiative, different team

Discovery constraints:
C1: All primary-to-standby replication traffic must traverse an isolated network segment (dedicated replication VLAN, not shared with application traffic).
C2: PCI DSS QSA sign-off required before production failover activation — the DR system expands the Cardholder Data Environment (CDE) perimeter and must pass an external QSA assessment prior to production activation.
C3: RTO ≤ 4 hours from incident declaration to live transaction processing on standby; RPO ≤ 1 hour (maximum 1 hour of committed transactions may be lost).

---

## Epic 1: Standby Infrastructure Readiness

### Story S1.1: QSA engagement and CDE scope mapping

**As a** Payments Compliance Manager,
**I want** an external QSA to assess and document the expanded CDE scope introduced by the DR system,
**So that** we have a clear, auditor-confirmed list of remediation items to resolve before production activation is permitted.

**Benefit linkage:** Prerequisite for Metric M1 and M2 — without QSA sign-off (C2), the DR system cannot be activated in production regardless of technical readiness.

**Architecture Constraints:**
- C2: This story is the primary delivery vehicle for the PCI DSS QSA gate. All subsequent stories that expand the CDE perimeter must include a C2 reference in their Architecture Constraints.
- ADR-019 (CDE scope change protocol): any story that connects infrastructure to the CDE must include a reference to the QSA gate.

**Acceptance Criteria:**

AC1: Given the DR architecture diagram is finalised and submitted to the external QSA, when the QSA scope review is complete, then the QSA provides a written scope determination within 15 business days identifying all in-scope systems and any gaps requiring remediation.

AC2: Given the QSA scope determination is received, when the remediation item list is extracted, then all remediation items are entered into the compliance register with an owner assigned and a target resolution date no later than 6 weeks before the scheduled DR production activation.

AC3: Given all remediation items are marked resolved in the compliance register, when the QSA final assessment is requested, then a signed QSA acceptance letter is obtained and stored in the compliance artefact repository before any DR production activation is approved.

**NFRs:**
- QSA engagement must begin within 2 weeks of DR system entering the staging environment.
- QSA acceptance letter must be obtained at least 2 weeks before any planned DR production activation date.

**Out-of-scope:** QSA assessment of unrelated systems outside the DR change boundary.

**Complexity:** 2 (QSA timeline is the external dependency; remediation scope unknown until assessment is complete)
**Scope stability:** Stable
**Estimated effort:** L (5 days)

---

### Story S1.2: Primary-to-standby database replication pipeline ← PLANTED DEFECT (C2 absent)

**As a** Platform Engineer,
**I want** encrypted, continuous replication of the payments database from the primary to the standby data centre,
**So that** the standby has an up-to-date copy of production data that satisfies the RPO constraint.

**Benefit linkage:** Direct delivery mechanism for Metric M2 (RPO ≤ 1 hour) — replication lag determines data loss window.

**Architecture Constraints:**
- C1: All replication traffic must traverse VLAN 402 (dedicated replication segment) and be encrypted with TLS 1.3 or higher. Application traffic VLANs must have no replication traffic present.
- C3: Replication must sustain the RPO target of ≤ 1 hour under all load conditions including peak transaction volume.

**Acceptance Criteria:**

AC1: Given the replication pipeline is running, when a transaction is committed on the primary database, then it is replicated to the standby within 60 seconds at normal load (measured at p95 over a 1-hour window).

AC2: Given the replication pipeline is running, when replication lag exceeds 300 seconds, then a PagerDuty P2 alert fires within 30 seconds of the threshold breach and the replication dashboard shows a red status indicator.

AC3: Given replication traffic is in flight, when a packet capture is taken at the VLAN boundary, then all captured replication packets are confirmed to be on VLAN 402 and TLS-encrypted (no plaintext payment data visible in the capture).

AC4: Given the standby replication has been running for 24 hours, when the replication lag is measured over that period, then the standby database is confirmed to be within 60 minutes of primary data age at all measurement points (RPO ≤ 1 hour continuously).

**NFRs:**
- Replication must sustain the full production peak transaction volume (10,000 TPS) without lag accumulation exceeding 30 seconds per 60-minute window.
- Network latency between primary and standby replication hosts must not exceed 5ms at p99.

**Out-of-scope:** Application-layer replication logic, message queue replication — database layer only.

**Complexity:** 2 (replication lag testing under load requires coordinated testing window)
**Scope stability:** Stable
**Estimated effort:** XL (8 days)

---

## Epic 2: Operational Failover Capability

### Story S2.1: Replication health monitoring and alerting

**As a** Platform Operations Engineer,
**I want** real-time visibility into replication lag and standby database health,
**So that** I can detect DR readiness degradation before an incident occurs and respond before the RPO window is compromised.

**Benefit linkage:** Enables proactive detection of RPO drift, supporting Metric M2. Without monitoring, the team cannot detect a slow degradation of standby health until an incident reveals it.

**Architecture Constraints:**
- Monitoring observes the replication pipeline introduced in S1.2. No new CDE-scoped systems are introduced by this story.
- C3: Monitoring must surface RPO compliance status (current replication lag vs the 60-minute RPO threshold) on the operations dashboard.
- Monitoring agent must have read-only access to the replication status endpoint — no write or administrative access.

**Acceptance Criteria:**

AC1: Given the monitoring system is running, when replication lag exceeds 60 seconds, then a P3 Slack alert fires to the #platform-operations channel within 30 seconds containing the current lag value and standby host identifier.

AC2: Given the monitoring system is running, when standby database connectivity is lost for more than 10 consecutive seconds, then a P1 PagerDuty alert fires within 30 seconds and the on-call engineer receives a phone notification.

AC3: Given the monitoring dashboard is open in a browser, when an on-call engineer views the DR status screen, then replication lag (in seconds), standby health status (green/amber/red), last successful replication timestamp, and current RPO compliance status are all visible on a single screen that refreshes every 30 seconds without requiring a manual page reload.

AC4: Given a P1 or P2 alert fires, when acknowledged by the on-call engineer, then the acknowledgement is recorded in the alert log with operator ID, timestamp, and the lag value at time of acknowledgement.

**NFRs:**
- Alert delivery latency from threshold breach to Slack/PagerDuty notification: ≤ 30 seconds at p99.
- Dashboard render time: ≤ 2 seconds from page load to all metrics visible.

**Out-of-scope:** Automated remediation triggered by alerts — alerting only; operator response is manual.

**Complexity:** 1 (well-understood monitoring pattern; replication metrics are exposed via existing endpoint)
**Scope stability:** Stable
**Estimated effort:** M (3 days)

---

### Story S2.2: Automated failover activation ← PLANTED DEFECT (C2 absent)

**As a** Platform Operations Engineer,
**I want** an automated failover activation script that promotes the standby database to active processor,
**So that** we can meet the RTO window without relying on manual, error-prone steps under incident pressure.

**Benefit linkage:** Primary delivery mechanism for Metric M1 (RTO ≤ 4 hours) — an automated, scripted sequence is the mechanism by which the RTO target becomes consistently achievable.

**Architecture Constraints:**
- C3: The activation script must complete the full promotion sequence within the RTO window. Script execution time is measured from invocation to live transaction confirmation.
- Activation sequence is defined in `scripts/activate-dr-failover.sh` with a corresponding runbook at `docs/dr-activation-runbook.md`.

**Acceptance Criteria:**

AC1: Given the DR activation script is invoked, when the standby replication lag is greater than 300 seconds at activation time, then the script aborts with exit code 1 and logs `"ABORT: replication lag [N]s exceeds safe threshold. Failover blocked."` — live transaction mode is not entered.

AC2: Given the DR activation script is invoked and replication lag is ≤ 300 seconds, when all pre-failover health checks pass, then the script outputs a structured activation plan listing each step with estimated duration, cumulative elapsed time, and expected RTO impact before prompting for confirmation.

AC3: Given the operator confirms the activation plan, when the script executes the full promotion sequence, then the standby payment processing service is set to `mode: active`, the primary is set to `mode: passive`, and a timestamped activation event is written to `logs/dr-activation.jsonl` with operator identity, activation timestamp, and pre-activation replication lag.

AC4: Given the failover activation has completed, when the first transaction is processed by the standby, then a confirmation message is logged to `logs/dr-activation.jsonl` and a P1 PagerDuty incident is automatically updated with the status `"Failover complete — standby processing live transactions"`.

**NFRs:**
- Full activation sequence (script invocation to first live transaction confirmed) must complete within 4 hours at p95.
- Activation script must be idempotent — re-invocation after a partial failure must resume from the last completed step, not restart from the beginning.

**Out-of-scope:** Failback automation (standby to primary re-promotion) — separate story. Load balancer reconfiguration — handled by infrastructure team.

**Complexity:** 2 (CDE expansion at activation time requires careful sequencing; idempotency constraint adds complexity)
**Scope stability:** Stable
**Estimated effort:** L (5 days)

---

### Story S2.3: DR runbook and team drills

**As a** Platform Operations Manager,
**I want** documented DR runbooks and a schedule of quarterly failover drills,
**So that** on-call engineers can execute failover reliably under the time pressure of a real incident.

**Benefit linkage:** Supports consistent delivery of Metric M1 (RTO) — drills identify process gaps before a real incident exposes them.

**Architecture Constraints:**
- Process and documentation story — no system changes.
- Runbook must reference the activation script introduced in S2.2.

**Acceptance Criteria:**

AC1: Given the DR runbook is published to the internal documentation platform, when reviewed by two on-call engineers who were not involved in authoring it, then both reviewers sign off on the runbook's accuracy and completeness within 5 business days of first publication.

AC2: Given a DR drill is conducted, when the drill concludes, then a post-drill report is filed within 2 business days documenting: elapsed time for each runbook step, cumulative elapsed time vs RTO target, and any deviations from the documented process.

AC3: Given a post-drill report records that RTO was not achieved, when the report is reviewed by the Platform Operations Manager, then at least one corrective action item is created in the engineering backlog within 5 business days with a clear description of the gap and a proposed resolution.

**NFRs:**
- First DR drill must occur within 30 days of production activation.
- Quarterly drill schedule must be established before production activation and visible in the team planning calendar.

**Out-of-scope:** Full business continuity exercises covering non-platform teams.

**Complexity:** 1 (process story; no system complexity)
**Scope stability:** Stable
**Estimated effort:** M (3 days)

---

## Constraint propagation summary

ALL CONSTRAINTS PROPAGATED ✓

| Constraint | S1.1 | S1.2 | S2.1 | S2.2 | S2.3 |
|-----------|------|------|------|------|------|
| C1 — Replication network isolation | N/A | ✓ | N/A | N/A | N/A |
| C2 — PCI DSS QSA gate | ✓ | ✓ | N/A | ✓ | N/A |
| C3 — RTO/RPO targets | N/A | ✓ | ✓ | ✓ | ✓ |

C2 is present in S1.1 (the QSA gate story). All constraints confirmed propagated to all triggering stories.
```

---

## What to look for in the output

**Pass signals — HIGH finding on traceability:**
- Model checks C2 (PCI DSS QSA gate) against each story's Architecture Constraints section — not just the propagation summary table
- Model identifies that S1.2 connects the standby database to the CDE-scoped primary infrastructure (a CDE-expanding architectural change) but has no C2 reference
- Model identifies that S2.2 activates the standby as the live payment processor (a second CDE-expanding architectural change) but has no C2 reference despite the story's own AC3 describing the live transaction activation
- Finding labelled HIGH and attributed to Category A (Traceability) — "broken or missing reference" per SKILL.md criterion
- Model notes that the propagation summary table claims C2 is present in S1.2 (✓) and S2.2 (✓) but the story text contradicts this
- Verdict: FAIL

**The adversarial element:**
The propagation summary table is the planted lie. It correctly notes "C2 present in S1.1 ✓" — which is true — but the table also shows ticks for S1.2 and S2.2, which do not contain C2 references. A model that reads the summary and trusts it will miss the finding. The model must cross-check the table against the story text.

**Secondary adversarial element:**
S2.2 has good GWT ACs (unlike T1). A model that focuses on AC format will not find the defect here — the defect is in what is absent (C2) rather than what is malformed. The model must actively check the Architecture Constraints section of each story against the constraint list.

**Calibration note — T2 floor (0.82):**
T2 is harder than T1 because the defect is an absence rather than a malformation. The planted defect is not visible as a formatting problem — you must cross-reference. Additionally, the propagation table actively misdirects. A model that detects the defect and names the specific stories (S1.2 and S2.2) without C2 reference earns D1 = 1.0. A model that mentions traceability concerns vaguely without citing S1.2 and S2.2 specifically earns D1 = 0.4.

**Expected finding:**
- S1.2 + S2.2: `[Run]-H1` — HIGH — Category A — "Story S1.2 connects the standby database to the CDE-scoped primary infrastructure (an architectural change expanding CDE scope) but contains no reference to C2 (PCI DSS QSA gate). Story S2.2 activates the standby as the live payment processor (a CDE-expanding activation event) but also contains no C2 reference. The constraint propagation summary table incorrectly shows C2 as propagated to both stories."
- No other HIGH findings.
- Verdict: FAIL

**Categorical fail condition:**
- If the model reads the propagation summary table and accepts it at face value without cross-checking the story text — D1 = 0.0, categorical fail. This is the primary signal that distinguishes a model capable of critical review from one that accepts surface-level assertions.

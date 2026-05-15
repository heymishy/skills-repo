# Corpus Case T1 — Payment Platform DR: AC quality gap (planted HIGH)

## Case metadata

```json
{
  "case_id": "T1",
  "label": "Payment Platform DR — untestable ACs in failover automation story",
  "domain": "S1-payment-platform-dr",
  "difficulty": "moderate",
  "planted_defect": "Story S2.2 contains three ACs in implementation-language with no Given/When/Then structure and a vague regulated NFR with no specific value or test method",
  "defect_category": "C",
  "defect_severity": "HIGH",
  "expected_verdict": "FAIL",
  "expected_high_findings": 1,
  "expected_medium_findings": 0,
  "categorical_fail_condition": "HIGH finding missed on S2.2 AC quality",
  "calibration_score_range": [0.85, 0.95]
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
- This story is the primary C2 delivery vehicle. All subsequent stories that expand the CDE perimeter reference C2 as a dependency.
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

### Story S1.2: Primary-to-standby database replication pipeline

**As a** Platform Engineer,
**I want** encrypted, continuous replication of the payments database from the primary to the standby data centre,
**So that** the standby has an up-to-date copy of production data that satisfies the RPO constraint.

**Benefit linkage:** Direct delivery mechanism for Metric M2 (RPO ≤ 1 hour) — replication lag determines data loss window.

**Architecture Constraints:**
- C1: All replication traffic must traverse VLAN 402 (dedicated replication segment) and be encrypted with TLS 1.3 or higher. Application traffic VLANs must have no replication traffic present.
- C2: This story connects the standby database server to the PCI DSS CDE-scoped primary database. The QSA assessment initiated in S1.1 must include the replication path in its scope before production activation.
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
- Monitoring observes the replication pipeline introduced in S1.2. No new CDE-scoped systems are introduced.
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

### Story S2.2: Automated failover activation ← PLANTED DEFECT

**As a** Platform Operations Engineer,
**I want** an automated failover activation script that promotes the standby database to active processor,
**So that** we can meet the RTO window without relying on manual, error-prone steps under incident pressure.

**Benefit linkage:** Primary delivery mechanism for Metric M1 (RTO ≤ 4 hours) — an automated, scripted sequence is the mechanism by which the RTO target becomes consistently achievable.

**Architecture Constraints:**
- C2: Production failover activation is a CDE-expanding event. The QSA acceptance letter obtained in S1.1 must be present before the activation script can proceed to live transaction mode.
- C3: The activation script must complete the full promotion sequence within the RTO window.

**Acceptance Criteria:**

AC1: The failover should complete quickly.

AC2: The system should handle load gracefully during failover.

AC3: Monitoring alerts should fire promptly when failover is activated.

**NFRs:**
- Must comply with RTO requirements.

**Out-of-scope:** Failback automation (standby to primary re-promotion) — separate story.

**Complexity:** 2 (script orchestration and sequencing require careful design)
**Scope stability:** Stable
**Estimated effort:** L (5 days)

---

### Story S2.3: DR runbook and team drills

**As a** Platform Operations Manager,
**I want** documented DR runbooks and a schedule of quarterly failover drills,
**So that** on-call engineers can execute failover reliably under the time pressure of a real incident.

**Benefit linkage:** Supports consistent delivery of Metric M1 (RTO) — drills identify gaps in the process before a real incident exposes them.

**Architecture Constraints:**
- Process and documentation story — no system changes.
- Runbook must reference the activation script introduced in S2.2 as the primary execution path.

**Acceptance Criteria:**

AC1: Given the DR runbook is published to the internal documentation platform, when reviewed by two on-call engineers who were not involved in authoring it, then both reviewers sign off on the runbook's accuracy and completeness within 5 business days of first publication.

AC2: Given a DR drill is conducted, when the drill concludes, then a post-drill report is filed within 2 business days documenting: elapsed time for each runbook step, cumulative elapsed time vs RTO target, and any deviations from the documented process.

AC3: Given a post-drill report records that RTO was not achieved, when the report is reviewed by the Platform Operations Manager, then at least one corrective action item is created in the engineering backlog within 5 business days with a clear description of the gap and a proposed resolution.

**NFRs:**
- First DR drill must occur within 30 days of production activation.
- Quarterly drill schedule must be established before production activation and visible in the team planning calendar.

**Out-of-scope:** Full business continuity exercises covering non-platform teams — DR scope is limited to payment platform operations.

**Complexity:** 1 (process story; no system complexity)
**Scope stability:** Stable
**Estimated effort:** M (3 days)

---

## Constraint propagation summary

| Constraint | S1.1 | S1.2 | S2.1 | S2.2 | S2.3 |
|-----------|------|------|------|------|------|
| C1 — Replication network isolation | N/A | ✓ | N/A | N/A | N/A |
| C2 — PCI DSS QSA gate | ✓ | ✓ | N/A | ✓ | N/A |
| C3 — RTO/RPO targets | N/A | ✓ | ✓ | ✓ | ✓ |

All constraints propagated to all triggering stories.
```

---

## What to look for in the output

**Pass signals — HIGH finding on S2.2:**
- Model identifies that Story S2.2's three ACs ("should complete quickly", "should handle load gracefully", "should fire promptly") contain no Given/When/Then structure and describe behaviour without an observable, testable outcome
- Finding is labelled HIGH and attributed to Category C (AC quality)
- Model cites either the absence of GWT structure, the "should" language rendering the ACs non-testable, or the AC count (exactly 3, all non-testable) — any of these criteria alone meets the HIGH threshold under SKILL.md Category C
- Model also flags the NFR "Must comply with RTO requirements" as lacking a specific value or test method — this reinforces the HIGH finding (the single most important NFR in the story has no measurable target)
- Verdict: FAIL

**Calibration note — what the model must NOT do:**
- The model must NOT raise a HIGH finding on any other story. S1.1, S1.2, S2.1, S2.3 all have well-formed GWT ACs with 3–4 ACs each. A model that invents HIGH findings on clean stories is miscalibrated.
- The model must NOT miss the S2.2 defect by classifying it as MEDIUM ("ACs could be more specific"). The SKILL.md criterion is clear: absence of GWT structure triggers HIGH. Three "should" statements with no observable outcome and no Given/When/Then are not ambiguously MEDIUM — they are HIGH.
- The NFR gap alone ("Must comply with RTO requirements") would score as HIGH under Category D (Completeness) if the model reads it as a missing, blank, or vacuous NFR — this is an acceptable secondary finding and does not change the expected verdict.

**Expected finding:**
- S2.2: `[Run]-H1` — HIGH — Category C — "Story S2.2 contains 3 ACs written as 'should' statements with no Given/When/Then structure and no observable outcome. This meets the HIGH threshold for Category C. The single NFR ('Must comply with RTO requirements') has no specific time value and is not testable."
- No other HIGH findings.
- Verdict: FAIL

**Categorical fail condition:**
- If the model produces verdict PASS, or raises no HIGH finding on S2.2, or labels the S2.2 AC quality issue as MEDIUM — D1 = 0.0 for this case. This is the primary signal for model routing decisions.

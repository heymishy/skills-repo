# Definition of Ready — Gate Report
## Story: ACK-001 | rtp.3 | 10-Second Scheme Acknowledgement Generation & Return

**Gate run:** 2026-06-14
**Pipeline:** `/definition-of-ready`
**Assessor:** DoR Automation Pipeline

---

## 1. Gate Checklist

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| 1 | Story title and ID are present | ACK-001 / rtp.3 | ✅ PASS |
| 2 | Parent feature referenced | 2026-09-01-inbound-rtp-payments-nz | ✅ PASS |
| 3 | Discovery artefact approved by authorised role | Payments Programme Lead — 2026-06-14 | ✅ PASS |
| 4 | Acceptance criteria are present, testable, and unambiguous | AC1–AC6 present; each is specific and measurable | ✅ PASS |
| 5 | NFRs are defined and traceable to a constraint or agreement | NFR-1 tied to scheme participation agreement (C2) | ✅ PASS |
| 6 | Test plan covers all AC and NFR items | T1–T7 map to AC1–AC6 and NFR-1; no gaps detected | ✅ PASS |
| 7 | All tests assigned a type (unit / integration / E2E / perf) | T4 integration, T5 E2E perf, T6 integration; T1–T3, T7 type implied — see **Flag 1** | ⚠️ WARN |
| 8 | Review report verdict is PASS with no HIGH findings | PASS; zero HIGH; one MEDIUM, one LOW risk noted | ✅ PASS |
| 9 | Architecture constraints documented and non-negotiable items flagged | C1, C2 explicit; upstream dependency chain named | ✅ PASS |
| 10 | Upstream dependencies are identified | ISO-001, FRAUD-001, AML-001, RTPL-001 listed | ✅ PASS |
| 11 | Dependency impact on test execution is acknowledged | T5 (E2E load) explicitly blocked until all four upstream stories complete | ✅ PASS |
| 12 | Benefit metric referenced | RTP Scheme Compliance M1 — active | ✅ PASS |
| 13 | Complexity and story points estimated | MEDIUM / 13 points | ✅ PASS |
| 14 | Data classification stated | Internal; no customer PII; scheme reference IDs only | ✅ PASS |
| 15 | Open risks are recorded and dispositioned | R1 (AML latency) noted; load env risk accepted | ✅ PASS |

---

## 2. Flags Requiring Team Acknowledgement

### ⚠️ Flag 1 — WARN | Test types not explicit for T1, T2, T3, T7
**Criterion:** Item 7
**Detail:** T4, T5, and T6 are explicitly typed (integration, E2E perf, integration). T1, T2, T3, and T7 carry no test type label (unit / component / integration / contract). For a story at 13 points with a hard scheme deadline, this is low risk but needs closing before sprint start to ensure environment and data provisioning are correctly planned.
**Action required:** Team to annotate T1, T2, T3, T7 with test type in the story prior to sprint commitment. Suggested: T1–T3 = component/integration, T7 = integration.
**Blocking?** No — warn only. Must be resolved at sprint planning.

---

### ⚠️ Flag 2 — WARN | T5 (E2E load test) has a hard upstream dependency gate
**Criterion:** Items 10, 11
**Detail:** T5 is the only test that validates the hard scheme rule (NFR-1 / C2 / AC4). It is explicitly blocked on ISO-001, FRAUD-001, AML-001, and RTPL-001 all being complete. If any upstream story slips, T5 cannot execute, and the scheme compliance obligation cannot be evidenced before the 2026-09-01 feature date.
**Action required:**
- Confirm current delivery status and sprint position of all four upstream stories.
- Establish a hard internal deadline for upstream completion that leaves sufficient buffer for T5 execution, defect remediation, and re-test within the feature window.
- If upstream delivery confidence is not high, escalate to Payments Programme Lead as a programme-level risk item — this flag cannot be absorbed at story level alone.
**Blocking?** No — story is ready to enter sprint for all work excluding T5. T5 readiness is a programme-level scheduling concern. Recommend this flag is registered on the programme risk register.

---

### ℹ️ Flag 3 — INFO | Load test environment operates at 40 tps pre-production (risk accepted)
**Criterion:** Item 15
**Detail:** The review report notes the integration environment runs at 40 tps against a production target of approximately 11,111 tps (40,000 tph). The risk has been formally accepted with a post-deploy production load test as the mitigation. This is recorded for transparency.
**Action required:** Confirm the post-deploy production load test is scheduled and has a clear owner and rollback plan. No action required from the delivery team at story level.
**Blocking?** No — risk accepted at programme level.

---

### ℹ️ Flag 4 — INFO | MEDIUM risk R1 (AML latency) is an upstream dependency risk, not a story defect
**Criterion:** Item 15
**Detail:** The review report correctly classifies R1 as upstream (AML-001). However, the 10-second window is a hard scheme rule with zero tolerance. If AML processing introduces latency variability at peak load, it will directly threaten AC4 and NFR-1. This is monitored via AC6 (ops alert at 9,500ms), which provides a 500ms circuit-breaker margin.
**Action required:** Ensure the AML-001 team is aware of the latency budget implications. The 500ms alert margin (AC6) should be confirmed as sufficient with the AML-001 tech lead before sprint start.
**Blocking?** No — information item. Recommend confirmation note in the story comments.

---

## 3. AC–Test Traceability Matrix

| Acceptance Criterion | Test(s) | Coverage |
|----------------------|---------|----------|
| AC1 — pacs.002 fields | T1 | ✅ Covered |
| AC2 — Status values | T1, T2, T3 | ✅ Covered |
| AC3 — ACK queued ≤ 500ms | T4 | ✅ Covered |
| AC4 — E2E ≤ 10s P99 @ 40k tph | T5 | ✅ Covered (upstream-gated) |
| AC5 — Latency logging + correlation ID | T7 | ✅ Covered |
| AC6 — Alert at > 9,500ms | T6 | ✅ Covered |
| NFR-1 — Scheme compliance P99 | T5 | ✅ Covered (upstream-gated) |

**Coverage:** 7/7 — no gaps.

---

## 4. Overall Verdict

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   DoR VERDICT:  ✅ PASS — READY WITH CONDITIONS     │
│                                                     │
│   Blocking flags:      0                            │
│   Warn flags:          2  (must close @ planning)   │
│   Info flags:          2  (no action at story level)│
│                                                     │
└──────────────────────────────────────────���──────────┘
```

**This story may be pulled into sprint planning.**
The two WARN flags (test type labels; upstream delivery gate for T5) must be resolved and recorded in the story comments before the team accepts the story into the sprint commitment. The story is not fully independently deliverable due to the T5 upstream gate — the team should plan sprint scope accordingly and ensure the programme risk register reflects the T5 dependency.

---

*DoR gate completed — rtp.3 / ACK-001 — 2026-06-14*
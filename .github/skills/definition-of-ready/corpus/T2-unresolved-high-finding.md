# Corpus Case T2 — DR failover activation: unresolved HIGH review finding

## Case metadata

```json
{
  "case_id": "T2",
  "label": "DR failover activation — unresolved HIGH finding (H7 FAIL)",
  "difficulty": "adversarial",
  "expected_verdict": "BLOCKED",
  "expected_h_blocks": ["H7"],
  "adversarial_pattern": "Story has 4 GWT ACs, test plan covers all 4, discovery is approved with a named non-engineer. The review report has exactly one finding — labelled HIGH — but it is categorised as Architecture (Category E). A model that scans the review for HIGH findings will find it immediately. The adversarial element: the finding appears after two MEDIUM findings in the report, and the finding title includes the word 'consideration' (which sounds optional). A model that conflates advisory language with finding severity will miss H7.",
  "failure_modes_to_watch": ["Severity-misread (treating 'Architecture consideration' as advisory rather than HIGH)", "Partial-review-read (reads first two MEDIUM findings and moves on)", "H7-pass-through (assumes Category E findings are architecture guidance, not blocks)"]
}
```

---

## Input bundle

> **Operator instruction:** Please run /definition-of-ready for the story and supporting artefacts below.

---

### Story artefact

**Story ID:** ham.12
**Feature:** Hamilton Core Banking DR Failover
**Epic reference:** artefacts/2026-04-15-hamilton-dr-failover/epics/ham-epic-3-cutover-and-activation.md

---

## Story: DR failover activation sequence and CDE scope gate

**As a** Hamilton platform operations team,
**I want** a documented and automated failover activation sequence that promotes Hamilton from passive replication target to active payment processor,
**So that** the platform can meet its 4-hour RTO window and resume live transaction processing when the Auckland datacenter is unavailable.

## Benefit Linkage

**Metric moved:** M1 (RTO ≤ 4 hours for DR activation) — primary delivery mechanism.
**How:** Without a defined activation sequence, failover requires ad-hoc operator decisions under time pressure. This story defines and automates the sequence, making RTO measurement possible.

## Architecture Constraints

- Activation sequence is defined as a runbook at `docs/dr-activation-runbook.md` and an automation script at `scripts/activate-dr-failover.sh`.
- The script runs health checks against the Hamilton replication lag (`replication_lag_seconds` metric from the replication monitor introduced in ham.8). If lag exceeds 30 seconds at activation time, the script aborts and logs an error — it does not force-activate.
- CDE scope: activating Hamilton as the live processor expands PCI DSS CDE scope. This expansion requires explicit QSA gate (see AC4). The gate is a human approval step in the activation script — the script prompts for a QSA-signed acceptance reference before proceeding to live transaction mode.
- ADR-019 (CDE scope change protocol): any story that expands CDE scope must include an explicit AC for the QSA approval gate. This story includes AC4 for that purpose.

## Dependencies

- **Upstream:** ham.8 (replication monitor with lag metrics) and ham.10 (pre-failover health check suite) must both be complete before activation can proceed.
- **Downstream:** ham.13 (post-activation smoke test) depends on this story.

## Acceptance Criteria

**AC1:** Given the DR activation script is invoked, when replication lag exceeds 30 seconds, then the script aborts with exit code 1 and logs `"ABORT: replication lag [N]s exceeds threshold. Failover blocked."` — live transaction mode is not entered.

**AC2:** Given the DR activation script is invoked and replication lag is ≤ 30 seconds, when all pre-failover health checks pass (ham.10 suite returns green), then the script outputs a structured activation plan listing each step with estimated duration and cumulative RTO impact.

**AC3:** Given the activation plan is confirmed by the operator (interactive prompt), when the script executes the activation sequence, then Hamilton's payment processing service is set to `mode: active` and a timestamped activation event is written to `logs/dr-activation.jsonl`.

**AC4:** Given the operator reaches the CDE expansion step in the activation sequence, when the script prompts for the QSA acceptance reference, then the operator must provide a non-blank reference string before the script proceeds to live transaction mode. If the prompt receives an empty or whitespace-only string, the script exits with a clear error: `"CDE scope expansion requires QSA acceptance reference. Activation aborted."`.

## Out of Scope

- Automated QSA notification — the gate in AC4 is a manual reference entry, not an API call to a QSA portal.
- Failback automation (Hamilton → Auckland re-promotion) — this is a separate story in epic 4.
- Load balancer reconfiguration — that is handled by infrastructure team separately from this activation sequence.

## NFRs

NFRs: None — reviewed 2026-05-12

## Complexity

Complexity: 2 (CDE gate interaction well understood; timing/RTO assertions require care)

## Scope Stability

Stable

---

### Test plan summary

**Test plan artefact:** artefacts/2026-04-15-hamilton-dr-failover/test-plans/ham.12-test-plan.md

| AC | Tests | Coverage | Notes |
|----|-------|----------|-------|
| AC1 | T1: lag > 30s triggers abort with exit code 1 and log message | Full | — |
| AC2 | T2: lag ≤ 30s + all health checks green → activation plan printed with per-step durations | Full | — |
| AC3 | T3: confirmed activation plan → service mode set to `active`; activation event written to log | Full | — |
| AC4 | T4: empty QSA reference → script exits with correct error; T5: non-blank QSA reference → script proceeds | Full | — |

**Test plan gap table:** No gaps. All 4 ACs have full test coverage.

---

### Review report summary

**Review artefact:** artefacts/2026-04-15-hamilton-dr-failover/review/ham.12-review.md

| Finding | Category | Severity | Status |
|---------|---------|---------|--------|
| R1: The QSA acceptance reference string (AC4) is stored only in the activation log. For audit purposes, this reference should also be written to a dedicated compliance log at `logs/qsa-gates.jsonl` separate from the general activation log. | B — AC completeness | MEDIUM | Open — acknowledged in /decisions as post-MVP |
| R2: The `activate-dr-failover.sh` script uses a hardcoded 30-second lag threshold. This should be configurable via an environment variable (`DR_LAG_THRESHOLD_SECONDS`) to support environments with different replication characteristics. | D — Implementation approach | MEDIUM | Open — deferred to configuration story ham.14 |
| R3: Architecture consideration — CDE scope expansion confirmation: the story's AC4 implements the QSA gate as a script prompt that accepts a free-text reference string. There is no verification that the reference string corresponds to an actual QSA assessment document. A malicious or careless operator could type any string (e.g. "done") and proceed to live transaction mode. The current design provides a procedural gate (operator must consciously enter a reference) but no technical enforcement. Before sign-off, the team must either: (a) accept this limitation with an explicit RISK-ACCEPT in /decisions documenting the residual risk and compensating control, or (b) add a verification step. **RESOLUTION STATUS: Open.** | E — Architecture | HIGH | Open |

---

### Discovery artefact — approval section

**Discovery artefact:** artefacts/2026-04-15-hamilton-dr-failover/discovery.md

```
## Approved By

Priya Sharma — Head of Platform Partnerships — 2026-04-15
```

---

## Expected verdict

**Verdict:** BLOCKED

**Hard block that fires:** H7

**Reason:** The review report contains one HIGH finding (R3). H7 blocks sign-off when any HIGH finding from the review remains unresolved. R3 is explicitly marked `RESOLUTION STATUS: Open` — it has not been resolved via a RISK-ACCEPT in /decisions or by adding a verification step. The finding is labelled "Architecture consideration" in its title, but its severity is HIGH and it maps to Category E (Architecture). H7 does not distinguish by category — any unresolved HIGH blocks.

**What a correct model output looks like:**
> ❌ **BLOCKED — 1 hard block failed**
>
> H7 Unresolved HIGH review finding: Finding R3 in the review report is rated HIGH (Category E — Architecture). RESOLUTION STATUS is Open. Neither a RISK-ACCEPT entry in /decisions nor a remediation AC has been added to the story. H7 requires all HIGH findings to be resolved before sign-off.
> Fix: Either add a RISK-ACCEPT entry to /decisions for R3 (documenting the residual risk and compensating control), or add AC5 to the story requiring technical verification of the QSA reference string. Then re-run /definition-of-ready.

**What a failing model output looks like (false positive):**
> The review has two MEDIUM findings, both acknowledged. R3 is an architecture consideration that the team is aware of...
> H7 ✅ — no unresolved HIGH findings blocking sign-off.

## Adversarial signal

R3 is the third finding in the review table and is prefixed "Architecture consideration" — wording that sounds advisory. The two preceding findings are MEDIUM and both acknowledged. A model that reads the review table quickly may register "2 MEDIUM findings acknowledged" and move on without registering that the third finding has `Severity: HIGH` and `Status: Open`. The H7 check requires a complete scan of all findings by severity, not a scan of the first findings encountered.

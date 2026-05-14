# Definition of Ready — Payment Authorisation Service DR Failover

**Feature:** 2026-05-14-payment-auth-dr-failover
**Model:** claude-sonnet-4-6 (Config B — Sonnet for /definition-of-ready per config matrix)
**Date:** 2026-05-14
**Review status:** PASS — Run 1 (0 HIGH findings)
**Test plan status:** Complete — all ACs covered; C1, C2, C3, C5 (canonical) have NFR tests; C6 (non-canonical — Opus-extracted) also has NFR coverage (NFR-2.2-5)
**Stories assessed:** 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2
**Oversight level:** High (regulatory constraints C2, C3, C5 all present; two hard go-live gates)

---

## Hard Block Gate Results

| Gate | 1.1 | 1.2 | 1.3 | 2.1 | 2.2 | 3.1 | 3.2 |
|------|-----|-----|-----|-----|-----|-----|-----|
| H1 — User story format | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| H2 — ACs ≥ 3, measurable, no "should" | ✅ (3) | ✅ (4) | ✅ (5) | ✅ (4) | ✅ (5) | ✅ (4) | ✅ (4) |
| H3 — Out of scope defined | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| H4 — Dependency risks named | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| H5 — Benefit-metric exists | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED |
| H6 — Complexity + scope stability | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED | ⚠️ WAIVED |
| H7 — Architecture constraints named | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| H8 — Test plan AC coverage | N/A† | N/A† | ✅ | ✅ | ✅ | ✅ | ✅ |
| H9 — Arch guardrails consulted | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| H-E2E — E2E tests identified | N/A‡ | N/A‡ | N/A‡ | N/A‡ | N/A‡ | N/A‡ | N/A‡ |
| H-NFR — NFR tests identified | N/A† | N/A† | ✅ | ✅ | ✅ | ✅ | ✅ |
| H-NFR2 — Regulated NFRs flagged | N/A† | N/A† | ⚠️ W | N/A | ⚠️ W | ⚠️ W (CRITICAL) | ⚠️ W (CRITICAL) |
| H-NFR3 — Accessibility reviewed | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

**†** Stories 1.1 and 1.2 produce assessment reports and infrastructure deliverables — the test plan covers their ACs via supplementary manual verification scenarios, not programmatic tests. H8/H-NFR not applicable in the same sense as code stories.

**‡** No UI or browser-rendering components in this feature. H-E2E not applicable.

**H5 waiver rationale:** Benefit-metric artefact not present — EXP-003 experimental simplification. All stories reference the directional success indicators from the discovery artefact ("Board Risk Committee resolution deferred, no voluntary disclosure to regulator, RTO/RPO targets achievable in practice"). This is acceptable for the eval run; a production pipeline run must have a benefit-metric artefact in place before sign-off.

**H6 waiver rationale:** Complexity and scope stability fields absent from all stories — systematic gap noted in review finding 1-M2 through 1-M7. Suggested values per story are provided in the review artefact. Acceptable for the eval run; a production pipeline run must populate these fields before sign-off.

**H-NFR2 warning rationale:** NFR tests targeting regulated constraints C2 (PCI DSS), C3 (AML/CFT Act), and C5 (internal audit gap/AML completeness) require human sign-off from the compliance function and/or an external QSA before the regulated gate can be marked passed. These are not blockers to starting implementation, but they are hard gates before go-live authorisation is granted. Acknowledged.

---

## Proceed/Block Assessment

All 7 stories: **PROCEED** (subject to H5 and H6 waiver — eval-mode)

No HIGH findings in the review artefact. No hard gate failures. Two critical regulated NFR warnings (H-NFR2) for Stories 3.1 and 3.2 — acknowledged; these are go-live gates, not implementation blockers.

---

## DoR Contract Proposals

### Story 1.1 — Hamilton Capacity Validation for 100% Transaction Volume

**Files to produce (not code files):**
- `docs/dr/hamilton-capacity-assessment-v1.md` — capacity assessment report

**Required touchpoints:**
- Primary DC throughput data (read from monitoring/metrics platform): read-only access
- Hamilton secondary site hardware inventory: read-only access
- C4 (single Auckland DC constraint): explicitly framed as the constraint this story begins to eliminate
- C6 (100% volume at secondary): frames the capacity target — assessment must use full peak production volume as the benchmark

**Out of scope:**
- Implementation of any infrastructure — assessment only; Story 1.2 provisions
- PCI DSS formal scoping: a preliminary mention only; formal scoping exercise is in Story 1.2 AC3
- Selection of replication technology: in Story 1.3

**Constraints in contract:**
- C1 — timing: capacity shortfalls discovered here affect the delivery timeline; any remediation with long lead times (hardware procurement, co-location upgrade) must be flagged immediately as a C1 risk item
- C4 — this story eliminates C4 as a constraint by establishing the secondary site capacity baseline
- C6 — benchmark is 100% of peak production volume with headroom for burst (≥ 120% of average daily peak)

---

### Story 1.2 — Hamilton Provisioning for Active-Passive Payment Authorisation

**Files to produce:**
- `docs/dr/hamilton-provisioning-runbook-v1.md` — provisioning runbook
- `docs/dr/hamilton-configuration-divergence-register-v1.md` — divergence register
- `docs/dr/hamilton-pci-cde-scope-brief-v1.md` — PCI CDE scope documentation for QSA

**Required touchpoints:**
- Primary-site infrastructure configuration baseline: read access (to define golden-image comparison)
- Hamilton secondary site: provisioned per Story 1.1 capacity assessment

**Out of scope:**
- Replication mechanism: in Story 1.3
- QSA formal assessment: in Story 3.1
- Failover procedure: in Story 2.1

**Constraints in contract:**
- C2 (PCI DSS): Hamilton environment must be treated as CDE scope from day one of provisioning; all CDE controls applied; preliminary scoping documentation produced for QSA in Story 3.1
- C4: this story operationally eliminates the single-DC risk by completing the secondary site
- C6: provisioning must support 100% transaction volume; capacity baseline from Story 1.1 is the specification

---

### Story 1.3 — Continuous Replication to Hamilton at RPO ≤ 15 Minutes (with AML-Scope Inclusion Guarantee)

**Files to produce:**
- `src/replication/` or equivalent — replication mechanism implementation
- `docs/dr/replication-design-v1.md` — replication design document listing all included record types
- `docs/dr/aml-scope-record-type-inventory-v1.md` — AML-scope record-type inventory document (produced with compliance team)
- `docs/dr/aml-compliance-lead-signoff-v1.md` — compliance-lead sign-off on AML-scope inclusion
- `monitoring/replication-dashboard-config.json` or equivalent — monitoring dashboard configuration
- `monitoring/replication-alert-config.json` or equivalent — alert configuration

**Required touchpoints:**
- Story 1.2 must be complete (Hamilton provisioned): hard dependency
- Compliance lead must be available for AC3 sign-off: schedule early; this is the C5 design closure gate
- Monitoring and alerting platform: integration points must be agreed with operations team before implementation begins

**Out of scope:**
- Failover procedure: in Story 2.1
- Historical AML replication completeness audit: in Story 3.2
- QSA assessment of replication mechanism: in Story 3.1

**Constraints in contract:**
- C1 (RPO ≤ 15 min): NFR-1.3-1 enforces this; FAIL if max lag > 15 min at peak load
- C3 (AML/CFT Act — regulated): NFR-1.3-2 enforces AML-scope record completeness at secondary; replication design MUST include every AML/CFT-scope record type; partial implementation (e.g. excluding "suspicious activity report" records) is a statutory compliance defect
- C5 (AML audit gap — regulated): **This is the design closure gate for C5.** AC3 requires a written compliance-lead sign-off that every AML/CFT-scope record type is in the replication stream. This sign-off is required before Story 1.3 can be marked done. NFR-1.3-3 tests this gate directly. Absence of the sign-off is a hard block.
  - **The compliance-lead sign-off is not optional.** It is the mechanism that converts the "unverified" status in the discovery [ASSUMPTION] into a verified design claim. Story 3.2 then audits the historical completeness under that design.
- C6 (100% volume): replication must handle peak load (300 tx/min); load limit is not acceptable as a replication constraint

**C5 production guard:** Deploy-time check: confirm that `docs/dr/aml-compliance-lead-signoff-v1.md` exists and is dated before any go-live authorisation is processed. Suggest implementing as a go-live checklist item in the change-approval process.

---

### Story 2.1 — Manual Failover Runbook Authored and Reviewed

**Files to produce:**
- `docs/dr/failover-runbook-v1.md` — manual failover runbook

**Required touchpoints:**
- Story 1.2 must be complete (Hamilton provisioned): read access to provisioning runbook required
- Story 1.3 must be complete (replication mechanism running): runbook references replication health check step

**Out of scope:**
- Automated failover: the runbook is manual; no automation required in this story
- QSA review of the runbook: in Story 3.1 (QSA assessment)
- Drills: in Story 2.2

**Constraints in contract:**
- C1 (RTO ≤ 2 hours): NFR-2.1-1 enforces that all step time estimates sum to ≤ 90 minutes; a runbook that cannot plausibly achieve RTO ≤ 2 hours on paper is a hard block on the story
- C2 (PCI DSS — no plaintext credentials): NFR-2.1-2 enforces this; any plaintext credential in the runbook is a PCI DSS violation and a hard block; all credential-fetch steps must name a specific approved secrets management system

---

### Story 2.2 — Two Pre-Go-Live Failover Drills with RTO/RPO Evidence Package

**Files to produce:**
- `docs/dr/drill-1-report-v1.md` — Drill 1 report (timestamps, RTO, RPO, runbook version)
- `docs/dr/failover-runbook-v2.md` — updated runbook after Drill 1
- `docs/dr/drill-2-report-v1.md` — Drill 2 report
- `docs/dr/go-live-evidence-package-v1.md` — final evidence package (cross-references QSA letter and AML audit)

**Required touchpoints:**
- Story 2.1 must be complete (runbook v1 ready): drill uses the runbook
- Story 3.1 and 3.2 must both be complete before `go-live-evidence-package-v1.md` can be finalised (AC5 dependency)

**Dependency register:**
- Story 3.1 — QSA sign-off letter must exist before evidence package cross-reference (AC5) can be filled in
- Story 3.2 — AML audit confirmation must exist before evidence package cross-reference (AC5) can be filled in
- **If Stories 3.1 or 3.2 are delayed:** Drills 1 and 2 can proceed and AC1–AC4 can pass; AC5 (evidence package cross-reference) cannot pass until both 3.1 and 3.2 are complete. This is an acceptable partial completion: the story is done when AC5 is satisfied, not when AC1–AC4 are complete.

**Out of scope:**
- Automated failover monitoring during drills: operational observation only
- Production go-live execution: outside this feature's scope

**Constraints in contract:**
- C1 (RTO/RPO): NFR-2.2-1, 2.2-2, 2.2-3 enforce drill RTO ≤ 120 min and RPO ≤ 15 min; both drills must meet both targets
- C2 (PCI DSS): NFR-2.2-4 enforces no real cardholder data in drill harness without documented QSA approval
- C6 (100% volume): NFR-2.2-5 enforces drill load ≥ 80% of peak production volume

---

### Story 3.1 — PCI DSS QSA Assessment of the DR Environment Before Q3

**Files to produce:**
- `docs/compliance/qsa-engagement-record-v1.md` — QSA engagement confirmation and scheduled date
- `docs/compliance/qsa-findings-register-v1.md` — QSA findings register (populated by QSA, updated during remediation)
- `docs/compliance/qsa-signoff-letter.pdf` — QSA sign-off letter (produced by QSA firm; stored in compliance record)
- `docs/dr/go-live-change-approval-process-v1.md` — updated change-approval process with QSA gate

**Required touchpoints:**
- Stories 1.1, 1.2, 1.3 must be complete: DR environment must be provisioned and documented before QSA assessment can begin
- QSA firm must be engaged early (T+14 days target from project approval)

**Out of scope:**
- AML/CFT Act compliance: in Story 3.2
- Drill drills: in Story 2.2 (though the QSA may observe a drill; this is coordination only)

**Constraints in contract:**
- **C2 (PCI DSS — REGULATED — HARD GO-LIVE GATE):** NFR-3.1-1 and NFR-3.1-2 enforce this constraint. The QSA sign-off letter must be present before go-live authorisation is issued. Absence of the letter is a hard block on production failover under the change-approval process. This is a regulated constraint — it cannot be risk-accepted and proceeds without sign-off.
  - Go-live gate: the change-approval process must include an explicit step: "Verify QSA sign-off letter exists, is current, and covers the Hamilton DR environment in scope."
  - Production guard: the absence of `docs/compliance/qsa-signoff-letter.pdf` (or equivalent in the compliance record) must block the go-live step.
- Timing risk: QSA engagement and remediation timelines are uncertain. A QSA timeline risk must be raised in the project risk register with probability, impact, and mitigation (early engagement, pre-scoping documentation from Story 1.2).

---

### Story 3.2 — Independent AML/CFT Replication Completeness Audit (Closes Internal Audit Finding)

**Files to produce:**
- `docs/compliance/aml-replication-audit-report-v1.md` — full audit report (produced by auditor; stored in compliance record)
- `docs/compliance/aml-audit-gap-remediation-plan-v1.md` — gap remediation plan (if gaps found)
- `docs/compliance/aml-audit-confirmation-v1.md` — written confirmation of full 5-year coverage (post-remediation if needed)
- Updated internal audit register entry: open finding closed, referencing audit confirmation date and auditor

**Required touchpoints:**
- Story 1.3 must be complete (replication running, compliance-lead sign-off in hand): story 1.3's AC3 sign-off is the prerequisite — the audit verifies historical completeness under the design that the compliance lead confirmed
- Independent auditor must be confirmed not from the replication build or operations team

**Out of scope:**
- PCI DSS QSA assessment: in Story 3.1
- Replication mechanism remediation (if design gaps found post-sign-off): would be a new story out of this feature scope; Story 3.2 AC2 covers quantification of operational/historical gaps, not design defects

**Constraints in contract:**
- **C3 (AML/CFT Act — REGULATED — HARD GO-LIVE GATE):** NFR-3.2-1 enforces that all AML-scope records within the 5-year retention window are present at the secondary site. Un-remediated gaps are a hard go-live block (AC2). The written audit confirmation (AC3) must be present before the Drill 2 evidence package cross-reference (Story 2.2 AC5) can be completed.
  - Go-live gate: the change-approval process must include: "Verify AML/CFT replication audit confirmation exists and confirms full 5-year coverage."
- **C5 (Internal audit gap — REGULATED): Definitive finding required — "unverified" is NOT an acceptable post-audit outcome.**
  - NFR-3.2-2 enforces this. The audit must produce one of: CONFIRMED (gaps exist, with quantification) or CLEAR (no gaps, with evidence). A report that concludes with "further investigation required" or any other non-definitive language is a FAIL on NFR-3.2-2 and blocks go-live.
  - AC4 formally closes the open internal audit finding in the audit register. The closing evidence must be the audit confirmation report (AC3). This is the second and final stage of the two-stage C5 closure:
    - **Stage 1:** Story 1.3 AC3 — compliance-lead sign-off that the replication design includes every AML/CFT-scope record type (design guarantee)
    - **Stage 2:** Story 3.2 AC4 — independent audit confirmation of historical completeness + formal closure of the open internal audit finding in the audit register
  - Both stages are required for C5 to be considered closed. Stage 1 alone (design guarantee) is not sufficient — it does not verify historical completeness within the 5-year window.
- **Independence requirement:** The auditor must be from a function independent of the replication build and operations team (NFR-3.2-3). Self-certification by the build team is not acceptable. This requirement must be confirmed at story kick-off, not at review time.

---

## Coding Agent Instructions Block

**Oversight level:** High (regulated constraints; hard go-live gates; compliance sign-offs required)

**For the implementing agent:**

1. Stories 1.1 and 1.2 are infrastructure and assessment deliverables. They do not produce application code. The primary deliverables are documents and a provisioned environment. The implementing agent's role for these stories is to produce the document templates and provisioning runbooks; actual infrastructure provisioning is a human/operations team action.

2. Story 1.3 is the technical centrepiece. The replication mechanism must handle all AML-scope record types. **Do not implement a replication mechanism that excludes any record type without explicit compliance-lead approval documented in `docs/dr/aml-compliance-lead-signoff-v1.md`.** The compliance-lead sign-off (AC3) must be obtained before Story 1.3 is marked done.

3. Story 2.1's primary output is a document (the failover runbook). The runbook must be testable by an operations engineer who was not involved in writing it (AC1). Write it for a reader who knows how to operate servers but has not seen the Hamilton environment before.

4. Stories 2.2, 3.1, and 3.2 all produce compliance evidence and involve external parties (QSA, auditor, operations lead). The implementing agent's role is to ensure the scaffolding (document templates, monitoring configurations, alert integrations) is complete so that the human actions (drills, QSA assessment, audit) can proceed without engineering blockers.

5. **C5 closure is a two-step process spanning Stories 1.3 and 3.2.** Neither step alone is sufficient. Both must be explicitly confirmed at DoD time.

6. **Hard go-live gates:** Stories 3.1 (C2 — QSA sign-off) and 3.2 (C3 — AML audit; C5 — definitive finding) produce hard go-live gates. The go-live change-approval process must enforce these gates. If the implementing agent produces a go-live checklist or change-approval template, it must include explicit verification steps for:
   - `docs/compliance/qsa-signoff-letter.pdf` exists and covers the Hamilton DR environment (C2)
   - `docs/compliance/aml-audit-confirmation-v1.md` exists and confirms full 5-year coverage (C3)
   - Open internal audit finding status = Closed in the audit register (C5)

**Do not proceed to go-live if any of these three items is absent or incomplete.**

---

## CPF Gate — Constraint Propagation Fidelity Chain

The following table covers all 5 canonical constraints from the S1 evaluator inventory (C1–C5), plus C6, a non-canonical constraint extracted by Opus from the follow-up context. **Canonical CPF is scored against C1–C5 only.** C6 is shown for completeness and is fully propagated, but is not counted in the CPF denominator.

| Constraint | Discovery | Definition (ACs/NFR) | Test Plan (NFR/manual) | DoR Contract |
|-----------|-----------|---------------------|----------------------|-------------|
| **C1 — RTO ≤ 2h, RPO ≤ 15 min (Board Risk Committee)** | ✅ Named: "Board-approved RTO ≤ 2 hours and RPO ≤ 15 minutes" | ✅ Stories 1.1, 1.2, 1.3 AC1/AC2, 2.1 AC3, 2.2 AC1/AC2/AC3 | ✅ NFR-1.3-1, NFR-2.1-1, NFR-2.2-1, 2.2-2, 2.2-3 | ✅ Contracts: 1.3 (NFR-1.3-1), 2.1 (NFR-2.1-1), 2.2 (NFR-2.2-1/2/3) |
| **C2 — PCI DSS QSA (regulated)** | ✅ Named: "PCI DSS QSA assessment required before go-live" | ✅ Stories 1.1, 1.2 AC3/AC4, 1.3 NFR, 2.1 AC4, 2.2 NFR, 3.1 (whole story) | ✅ NFR-2.1-2, NFR-2.2-4, NFR-3.1-1 (CRITICAL), NFR-3.1-2 | ✅ Contract 3.1: "REGULATED — HARD GO-LIVE GATE"; go-live gate explicit |
| **C3 — AML/CFT Act 5-year retention (regulated)** | ✅ Named: "AML/CFT Act — 5-year transaction record retention; replication to secondary site must satisfy the same retention obligation" | ✅ Story 1.3 AC3 sign-off gate + NFR; Story 3.2 (whole story) | ✅ NFR-1.3-2, NFR-3.2-1 (CRITICAL), NFR-3.2-3 | ✅ Contract 3.2: "REGULATED — HARD GO-LIVE GATE"; go-live gate explicit |
| **C4 — Single Auckland DC** | ✅ Named: "Single Auckland datacentre; Hamilton secondary site is fibre-connected and has rack space" | ✅ Stories 1.1, 1.2 (constraint being eliminated) | No dedicated NFR — addressed by provisioning deliverable | ✅ Contracts 1.1, 1.2: C4 frames the capacity and provisioning scope |
| **C5 — AML replication gap (hidden/open internal audit finding)** | ✅ Surfaced as [ASSUMPTION]: "replication completeness within the statutory 5-year retention window is unverified; the gap status is logged but the replication scope has not been formally confirmed" | ✅ Story 1.3 AC3 (compliance-lead sign-off gate); Story 3.2 AC1–AC4 (independent audit + formal audit-register closure) | ✅ NFR-1.3-3 (design sign-off), NFR-3.2-2 (definitive finding required), NFR-3.2-3 (independence) | ✅ Contract 1.3: "design closure gate — absence of sign-off is hard block"; Contract 3.2: "DEFINITIVE FINDING REQUIRED — unverified is NOT acceptable; AC4 closes internal audit finding" |
| **C6 — 100% transaction volume at secondary** _(non-canonical — Opus-extracted from follow-up context; not counted in CPF denominator)_ | ✅ Named: "100% of transaction volume at the secondary site; no partial routing" | ✅ Stories 1.1 AC1, 1.2 (capacity), 1.3 (peak load), 2.2 (drill load) | ✅ NFR-2.2-5 (drill ≥ 80% peak) | ✅ Contracts 1.1 (capacity benchmark), 1.2 (provisioning spec), 1.3 (replication load), 2.2 (drill load) |

**CPF result: 5/5 canonical constraints propagated (CPF = 1.0).** Additionally, C6 (non-canonical — Opus-extracted from follow-up context) is fully propagated through all pipeline stages.

- C2 and C3 are propagated as **REGULATED — HARD GO-LIVE GATE** in the contracts for Stories 3.1 and 3.2 respectively.
- C5 is propagated via a two-stage closure mechanism: Story 1.3 contract (design guarantee) and Story 3.2 contract (independent audit + formal audit-register closure). The "unverified" status from the discovery assumption is explicitly addressed and cannot remain unresolved after Story 3.2 completes.
- All canonical constraint labels are preserved verbatim: "Board Risk Committee", "PCI DSS", "QSA", "AML/CFT Act", "5-year", "secondary-site replication", "open internal audit finding" — no paraphrasing loss at any stage.
- **C6 depth-of-extraction note:** Opus elevated "100% transaction volume at secondary — no partial routing" from the follow-up context to a named constraint. Config A (Sonnet) did not extract this. This is a qualitative quality finding recorded in the EXP-003 scorecard, not a CPF delta (both configs score 1.0 on the canonical 5).

---

## Risk Register

| Risk | Constraint | Severity | Mitigation |
|------|-----------|---------|-----------|
| QSA engagement timeline overruns | C2 | HIGH | Early engagement (T+14 days per Story 3.1 AC1); pre-scoping documentation from Story 1.2; named risk item in project risk register |
| AML audit gap found post-Story-1.3 design sign-off | C3, C5 | HIGH | Story 3.2 AC2 requires remediation plan + re-audit; go-live blocked until clear; remediation may extend timeline significantly |
| Hamilton capacity shortfall found in Story 1.1 | C4, C6 | MEDIUM | Story 1.1 AC2 triggers remediation backlog; long-lead items (hardware) must be flagged immediately; C1 delivery timeline risk raised |
| Compliance-lead availability for Story 1.3 AC3 sign-off | C5 | MEDIUM | Schedule compliance-lead review early in Story 1.3 implementation; not a last-minute sign-off |
| Story 3.1 QSA finds Critical/High issues in replication mechanism | C2 | HIGH | Critical/High findings must be remediated before go-live; extend go-live timeline accordingly; no RISK-ACCEPT path available for regulated constraint C2 |

---

## Sign-Off

**DoR status:** PROCEED — all hard gates pass (H5, H6 waived for EXP-003 eval-mode). Proceed with implementation on all 7 stories.

**Registered warnings (acknowledged, not blocking):**
- W-H5: Benefit-metric artefact absent — EXP-003 experimental simplification
- W-H6: Complexity and scope stability absent — systematic gap; add before production delivery
- W-H-NFR2: Regulated NFR tests (C2, C3, C5) require human compliance sign-offs before go-live — acknowledged as hard gates in the contract; not implementation blockers

```json
{
  "skill": "definition-of-ready",
  "caseId": "S1",
  "model": "claude-sonnet-4-6",
  "config": "B",
  "completedAt": "2026-05-14T00:00:00Z",
  "artefactPath": "workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-1/definition-of-ready.md",
  "overallVerdict": "PROCEED",
  "storiesAssessed": ["1.1", "1.2", "1.3", "2.1", "2.2", "3.1", "3.2"],
  "storiesBlocked": [],
  "hardGateWaivers": ["H5 (benefit-metric — eval simplification)", "H6 (complexity/scope stability — eval simplification)"],
  "warningsAcknowledged": ["W-H-NFR2: regulated NFRs for C2/C3/C5 require human sign-off before go-live"],
  "cpfResult": {
    "canonicalConstraintsPropagated": ["C1", "C2", "C3", "C4", "C5"],
    "total": 5,
    "propagated": 5,
    "cpf": 1.0,
    "extraConstraintsExtracted": ["C6 — 100% volume at secondary (Opus-extracted from follow-up context; fully propagated; not in canonical S1 inventory)"],
    "c5ClosureMechanism": "two-stage: Story 1.3 AC3 (design sign-off) + Story 3.2 AC4 (audit-register closure)",
    "regulatedConstraintsAsHardGates": ["C2 (Story 3.1 contract)", "C3 (Story 3.2 contract)", "C5 (Story 3.2 contract — definitive finding required)"]
  }
}
```

<!-- eval-mode: true -->

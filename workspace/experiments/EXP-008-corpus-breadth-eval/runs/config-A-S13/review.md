# Review: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Feature:** trans-tasman-payment-corridor
**Artefact reviewed:** `runs/config-A-S13/definition.md` (read from disk, 13 stories, 3 epics)
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S13
**Stage:** /review

---

## Review summary

| Category | Findings | Severity ceiling | Status |
|----------|----------|-----------------|--------|
| A — Scope and decomposition | 2 findings | LOW | PASS |
| B — Constraint propagation | 0 findings | — | PASS |
| C — Story quality and testability | 3 findings | LOW | PASS |
| D — Non-functional requirements | 1 finding | MEDIUM | PASS (finding noted) |
| E — Architecture guardrail compliance | 1 finding | LOW | PASS |

**Overall review status: PASS — no HIGH findings. Proceed to /test-plan.**

---

## Category A — Scope and Decomposition

**A1 (LOW) — DIA registration path is likely the longest-lead-time Epic 1 item; no timeline bound stated in definition.**

Story 1.4 correctly gates retail launch on a DIA written determination (AC1) and specifies a weekly tracking protocol (AC4), but the definition contains no timeline estimate or fallback for the DIA determination process. In practice, DIA's payment service type determination may take 3–6 months if registration is required — materially longer than the engineering build. The definition is accurate in surfacing this dependency, but does not state a planning assumption (e.g., "DIA determination expected within 90 days; engineering sprint 1–3 can proceed in parallel; if determination is not received by week 12, go-live date is formally deferred"). The absence of this assumption creates a scope-gap risk: the Payments product team may commence engineering at full pace without realising the DIA path could push go-live significantly. Recommendation: add a timeline assumption to Story 1.4 AC4 before test-plan stage, or document the assumption in decisions.md.

Severity: LOW — the definition is not wrong; the omission creates a planning risk, not an AC gap.

**A2 (LOW) — Epic 1 stories 1.1–1.5 are compliance/governance delivery items, not engineering features; the definition would benefit from an explicit note that these stories do not create a code artefact.**

The definition correctly characterises Epic 1 stories as "compliance, legal, and governance delivery items — not engineering features." However, the story format (User Story, ACs, Architecture Constraints, Oversight Level) is the same as engineering stories. The ACs describe obtaining signed documents, filing into SharePoint, and setting deployment configuration flags — all non-code deliverables, with one partial exception (the automated test assertions in AC3 of each story test the flag-gating logic in the engineering code). This dual nature is correct and well-handled, but a reviewer unfamiliar with the feature would not immediately understand that "done" for Epic 1 = documents filed + flag set, not code merged. Recommendation: add a clarifying note at the top of each Epic 1 story or in the Epic 1 purpose paragraph that "done for this story means the deployment configuration flag is set to true by its authorised owner, with the required written evidence on file."

Severity: LOW — clarity issue, not a correctness issue.

---

## Category B — Constraint Propagation

**B — PASS. No findings.**

All five constraints (C1–C5) are correctly propagated across the 13 stories. The CPF-TRACE block in definition.md confirms per-story constraint presence. Verification spot-check:

- C1 (NZ leg — RBNZ AML/CFT): present as PRIMARY in Stories 1.1, 2.2, 2.5; present as contributing constraint in Stories 1.3, 2.1, 2.3, 2.4, 3.1, 3.2. Every story in Epics 2 and 3 that touches the payment processing path carries C1. ✅
- C2 (AU leg — AUSTRAC): present as PRIMARY in Stories 1.2, 2.3; present as contributing constraint in Stories 2.1, 2.2, 2.4, 3.2. Every story touching the AU payment path carries C2. ✅
- C3 (NZ leg — RBNZ FX reporting): present as PRIMARY in Stories 1.3, 3.1; present as contributing constraint in Stories 1.1, 2.5. The two stories that generate or gate RBNZ FX reports carry C3 as primary. ✅
- C4 (NZ leg — DIA): present as PRIMARY in Story 1.4; present as enforcement constraint in Story 2.1 (DIA_REGISTRATION_CLEARED gate check is the retail-facing enforcement point). ✅
- C5 (cross-border — JPMorgan Chase): present as PRIMARY in Story 1.5; present as gate constraint in Stories 2.1 and 2.4. Story 2.4 (credit instruction transmission) is correctly identified as the architectural enforcement point for ADR-CB-002. C5 is correctly absent from Stories 2.2, 2.3, 2.5, 3.1, 3.2 — those stories do not touch the routing decision or channel activation. ✅

C5 surfaced correctly via three-signal reasoning (TTPS-SWIFT-001 → TTPS-RISK-001 → ADR-CB-002 Note) in discovery; carried forward to Story 1.5 with explicit BLOCKER escalation path (AC2 determination b).

---

## Category C — Story Quality and Testability

**C1 (LOW) — Story 2.1 AC1 and AC3 ordering ambiguity: flag check vs. originator information validation.**

Story 2.1 AC1 describes the five-flag pre-flight gate at intake. Story 2.1 AC3 describes originator information completeness validation for intra-group-routed instructions. The definition states AC3 validation happens "before the instruction proceeds to the AML/CFT screening step" but does not explicitly state whether the flag checks (AC1) occur before or after originator information validation (AC3). The intended order is: (1) flag checks → (2) eligibility determination → (3) originator info validation → (4) AML/CFT screening. This ordering matters for test-plan assertions: a test for "originator info missing when flags=false" should expect a flag-gate error, not a field validation error. Recommendation: Story 2.1 AC1 should state "flag checks are the first step in intake processing — no further processing (eligibility determination, originator information validation, AML/CFT screening) may occur until all five flags are confirmed true."

Severity: LOW — the intent is clear from context; a test-plan author might write an ambiguous test without this clarification.

**C2 (LOW) — Story 2.5 AC3 reporting window deferred to Story 1.1 AC2 confirmation: creates test-time uncertainty.**

Story 2.5 AC3 states threshold transaction reports are submitted "within the reporting window confirmed by Story 1.1 AC2." This is architecturally correct — the reporting window is not known until the RBNZ AML/CFT Compliance Officer produces the written confirmation. However, for test-plan purposes, a concrete testable assertion is needed. The test plan cannot assert "submitted within the reporting window" without knowing the window. Recommendation: the test-plan should assume a default window (e.g., 3 business days, consistent with standard RBNZ threshold reporting practice) and annotate the test as "default assumption — override per Story 1.1 AC2 confirmation." The user's request specifically calls for "threshold reporting within 3 business days" as the test assertion.

Severity: LOW — test-plan can resolve this with a stated assumption.

**C3 (LOW) — Story 3.1 settlement cut-off time: NZST/NZDT timezone handling unaddressed.**

Story 3.1 AC1 specifies "configurable settlement cut-off time, defaulting to 17:00 NZST." New Zealand observes daylight saving time (NZDT = UTC+13 in summer; NZST = UTC+12 in winter). The definition does not address whether the settlement cut-off shifts with DST or remains fixed relative to UTC. For international payment channels, this is a meaningful omission — SWIFT and other international payment networks operate on UTC, and a DST shift in the settlement cut-off could cause settlement cycle boundary misalignment. Recommendation: Story 3.1 should specify whether the cut-off is expressed in NZ local time (shifts with DST) or UTC (fixed). The test-plan should include a DST boundary test case.

Severity: LOW — not a functional gap in the AC; a technical implementation detail that could cause a defect if unaddressed.

---

## Category D — Non-Functional Requirements

**D1 (MEDIUM) — Story 2.4 credit instruction transmission: idempotency of transmission not addressed; duplicate credit instruction risk.**

Story 2.4 describes transmission to the enterprise's Australian counterpart via TTPS-ROUTE-001 with a retry mechanism (AC4: up to 3 retries with exponential backoff for transient failures). The story addresses the case where all 3 retries fail (instruction status → "transmission-failed"). However, the story does not address the case where the transmission succeeds (the credit instruction is received and processed by the enterprise's Australian counterpart) but the acknowledgement is lost in transit (network failure after the enterprise's Australian counterpart processes the instruction, before their acknowledgement reaches the NZ system). In this case, the NZ system would interpret the absence of acknowledgement as a transient failure and retry — potentially causing the enterprise's Australian counterpart to receive and process the same credit instruction twice, creating a duplicate AU-leg crediting event.

Recommendation: Story 2.4 should add an AC requiring idempotent transmission: the credit instruction must carry an idempotency key (the instruction ID from Story 2.1 AC4, which is already included in AC2 item a), and TTPS-ROUTE-001 or the enterprise's Australian counterpart's inbound channel must be specified as idempotency-aware (duplicate instructions with the same instruction ID are deduplicated). If TTPS-ROUTE-001 does not support idempotency natively, Story 2.4 should track which instructions have received an acknowledgement, and retries for an instruction that has already received an acknowledgement should be suppressed (at-most-once delivery after acknowledgement). The test-plan should include a test for this scenario.

Severity: MEDIUM — a real defect path for a financial system. The definition has the instruction ID field (AC2 item a) which could serve as an idempotency key, but the idempotency contract with TTPS-ROUTE-001 is not specified.

**D — Other NFRs:**
- Audit trail 7-year retention: addressed in Story 2.3 AC4. Both RBNZ AML/CFT (s.A.5) and AUSTRAC retention requirements satisfied. ✅
- Fail-closed screening unavailability: Story 2.2 AC3. ✅
- 2-hour SLA with monitoring and alerting: Story 3.2 AC1 and AC3. ✅
- AML/CFT record immutability: Story 2.2 AC4 ("screening record is immutable after it is written"). ✅
- No customer-facing disclosure of AML/CFT screening outcomes: Story 2.2 AC2 and Story 3.2 AC2. ✅

---

## Category E — Architecture Guardrail Compliance

**E1 (LOW) — No rollback or revocation mechanism specified for Epic 1 deployment flags after they are set to true.**

The five deployment flags (AMLCFT_CHANNEL_VALIDATED, AUSTRAC_CONFIRMATION_RECEIVED, FX_REPORTING_VALIDATED, DIA_REGISTRATION_CLEARED, CORRESPONDENT_AGREEMENT_CLEARED) all default to `false` and are set to `true` by their respective authorised owners. The definition specifies who can set each flag to `true` and under what evidence conditions. However, no story specifies: (a) who has authority to revert a flag to `false` if the underlying compliance condition changes (e.g., DIA revokes registration, JPMorgan Chase withdraws consent, RBNZ AML/CFT compliance team determines the screening service extension is inadequate post-launch); (b) what happens to in-flight or queued payment instructions if a flag is reverted from `true` to `false` during active channel operation. This is a real operational scenario for regulated systems.

Recommendation: each Epic 1 story should include a brief AC or note specifying: the authorised role that can revert the flag (typically the same role that set it), and the required action for the channel upon flag revocation (cease accepting new instructions; allow in-flight instructions to settle; alert operations team). This does not need to be complex — a single sentence per story is sufficient.

Severity: LOW — an operational gap, not a build-time defect. The test-plan should cover flag revocation behaviour as a regression scenario.

**E — Other architecture guardrails:**
- ADR-CB-002 mandatory correspondent agreement review: conducted before story decomposition (Step 0 scan). C5 and Story 1.5 correctly implement this. ✅
- ADR-CB-003/004 synchronous screening and fail-closed fallback: Story 2.2 AC1 and AC3. ✅
- ADR-CB-005 dual-jurisdiction AML/CFT obligation mapping: Story 2.2 (DFAT list for AU beneficiary) and Story 2.3 (AUSTRAC fields propagated to credit instruction). ✅
- ADR-CB-006 AUSTRAC originator information standard: Story 2.3 (data model) and Story 2.4 (credit instruction inclusion). ✅
- ADR-CB-007 DIA payment service type assessment: Story 1.4. ✅

---

## Findings summary

| ID | Category | Severity | Story | Finding |
|----|----------|----------|-------|---------|
| A1 | Scope | LOW | 1.4 | DIA registration timeline assumption absent; planning risk |
| A2 | Scope | LOW | Epic 1 | Epic 1 "done" definition (document-filed + flag-set, not code-merged) not explicit in story format |
| C1 | Story quality | LOW | 2.1 | Flag check vs. originator info validation ordering not explicit in AC text |
| C2 | Story quality | LOW | 2.5 | Threshold reporting window deferred to external confirmation; test-plan cannot assert a concrete window without assumption |
| C3 | Story quality | LOW | 3.1 | NZST vs. NZDT settlement cut-off not addressed |
| D1 | NFR | MEDIUM | 2.4 | Idempotency of credit instruction transmission not specified; duplicate credit risk on acknowledgement loss |
| E1 | Architecture | LOW | Epic 1 all | No flag revocation/rollback mechanism specified for post-activation compliance condition changes |

**No HIGH findings. Review status: PASS. Proceed to /test-plan.**

<!-- CPF-TRACE
stage: /review
model: claude-sonnet-4-6
config: A

constraint_propagation_verified: true
c1_review_status: PASS — all NZ-leg AML/CFT obligations correctly carried from discovery through all 8 stories touching NZ payment processing path
c2_review_status: PASS — all AU-leg AUSTRAC originator information obligations correctly carried through 6 stories touching AU payment path
c3_review_status: PASS — RBNZ FX reporting obligations correctly separated from threshold reporting (distinct RBNZ instruments); both gated by separate flags and stories
c4_review_status: PASS — DIA registration gate correctly modelled as pre-condition story with deployment flag; primary enforcement at intake (Story 2.1)
c5_review_status: PASS — JPMorgan Chase correspondent agreement surfaced as cross-border contractual constraint; architectural enforcement at Story 2.4 (credit instruction transmission); BLOCKER escalation condition in Story 1.5 AC2(b)
new_constraints_found_in_review: none
highest_severity_finding: MEDIUM (D1 — Story 2.4 idempotency; not a constraint propagation finding)
overall_status: PASS
-->

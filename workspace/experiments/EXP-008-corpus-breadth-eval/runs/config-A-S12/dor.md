# Definition of Ready: Credit Risk Model Retraining — MRM Policy Governance and FMA Fairness Compliance

**Status:** PROCEED — all hard blocks pass; oversight level HIGH
**Feature slug:** credit-risk-model-retraining
**Date:** 2026-05-18
**Skill version:** /definition-of-ready
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S12

**Source artefacts read from disk before this stage:**
- `runs/config-A-S12/discovery.md`
- `runs/config-A-S12/definition.md`
- `runs/config-A-S12/review.md`
- `runs/config-A-S12/test-plan.md`

---

## Hard block checklist

| Block | Check | Result |
|-------|-------|--------|
| H1 | Discovery artefact exists and is approved | ✅ PASS — discovery.md complete with [BLOCKER] naming C5 |
| H2 | Stories exist with unambiguous acceptance criteria | ✅ PASS — 7 stories (1.1, 1.2, 2.1, 2.2, 3.1, 4.1) with 5 ACs each; all ACs are testable |
| H3 | Test plan exists and tests are written to fail | ✅ PASS — test-plan.md exists with 35 tests across all 5 constraints; tests written in Given/When/Then format |
| H4 | Review has passed (no unresolved HIGH findings) | ✅ PASS — review.md has 3 HIGH findings, all resolved inline in test plan (H1→T-DEPLOY-001, H2→T-IV-005, H3→T-EXPL-005) |
| H5 | All constraints from discovery are propagated to at least one story AC | ✅ PASS — C1 (Story 1.1), C2 (Stories 2.1, 2.2), C3 (Story 1.2), C4 (Story 3.1), C5 (Stories 2.1, 2.2, 4.1) |
| H6 | Out-of-scope items are explicitly listed in discovery | ✅ PASS — discovery.md lists: threshold changes, product terms, CRMP-MOD-002/003 retraining, consumer comms, infrastructure |
| H7 | Scope accumulator confirms no scope drift (Step 4a) | ✅ PASS — definition.md Step 4a: 6 MVP scope items → 6 stories, all covered, no drift |
| H8 | Architecture constraints named with responsible parties | ✅ PASS — definition.md architecture constraints table: 5 entries with named responsible parties (Head of Model Risk, CRO, Legal Counsel, MRM Committee Chair, Head of Customer Experience) |
| H9 | Deployment gates defined for all regulated constraints | ✅ PASS — 5 deployment gates defined: `independent_validation_reference`, `mrm_committee_approval_reference`, `cccfa_legal_opinion_reference`, `fma_explanation_compliance_confirmed`, `fma_fairness_assessment_reference`; all gates enforced by automated pre-flight check (T-DEPLOY-001) |
| H-GOV | Benefit metric or discovery approval on file | ✅ PASS — discovery artefact complete; blocker formally documented |
| H-NFR | Non-functional requirements have specified thresholds | ✅ PASS — T-NFR-001 (batch ≤ 4 hours), T-NFR-002 (pre-flight ≤ 5s), T-NFR-003 (library version pinned), T-NFR-004 (explanation latency ≤ 150% baseline) |
| H-E2E | End-to-end flow covered in test plan | ✅ PASS — T-DEPLOY-002 covers all 6 CRMP interfaces in staging integration; T-AUDIT-003 covers full batch run audit trail |

All hard blocks: **PASS**

---

## Warnings (W1–W5)

| Warning | Check | Result |
|---------|-------|--------|
| W1 | Sequencing dependencies explicit | ✅ — Story 2.1 AC5 names Stories 1.1 and 1.2 as prerequisites; Story 2.2 AC4 names Story 2.1 as prerequisite; Story 4.1 AC1 names all five gate fields as prerequisites |
| W2 | External party dependencies (Legal Counsel, MRM Committee, independent validator) may cause timeline delays | ⚠️ ACKNOWLEDGED — Three external parties: Legal Counsel (Stories 1.2 and 3.1), independent validation team (Story 2.1), MRM Committee (Story 2.2). Timeline is already 18–26 weeks (from discovery). Delays are expected. No additional mitigation available at DoR stage. |
| W3 | FMA + CCCFA dual-obligation on explanation (C4) — complexity risk | ⚠️ ACKNOWLEDGED — Story 3.1 AC3 requires Legal Counsel to confirm both FMA and CCCFA obligations. One confirmation covers both obligations. Complexity is managed by requiring the written confirmation before committee package assembly. |
| W4 | C5 was surfaced via EA registry injection file (injection design test FAIL) | ⚠️ NOTED — EA registry CRMP-RISK-001 directly named the policy version gap. C5 classified as partial/injection-aided. C5 excluded from EXP-008 H3 validation. Does not affect DoR verdict — the constraint is still named and gated. |
| W5 | Audit log schema extension (L3 from review) not in a story | ⚠️ ACKNOWLEDGED — Low-finding L3 noted as a staging prerequisite for the coding agent. Not a separate story. The coding agent must confirm CRMP-OUT-003 schema supports explanation payload before staging begins. |

---

## Oversight level: HIGH

**Rationale:** This is a regulated AI/ML credit model deployment subject to: FMA Algorithmic Fairness Framework (2024) — external regulatory obligation; CCCFA responsible lending (ss. 9C, 9I, s.17) — statutory obligation; MRM Policy v2.0 (mandatory independent validation, MRM committee approval) — enterprise governance obligation. Production deployment without clearance of any of the five governance gates creates regulatory and statutory exposure. Human approval is required at each gate:
- C1/FMA gate: Head of Model Risk sign-off on FAR
- C2/C5 independent validation gate: Head of Model Risk sign-off on validation report; CRO escalation for any condition
- C2/C5 MRM committee gate: MRM Committee Chair approval reference
- C3/CCCFA gate: Legal Counsel written opinion
- C4/explainability gate: Legal Counsel FMA/CCCFA confirmation

No automated system can substitute for these human governance approvals. Oversight level HIGH is non-negotiable for this story.

---

## Deployment flags (all default = false; must be set to true before production deployment)

| Flag | Story | Default | Human approver |
|------|-------|---------|---------------|
| `independent_validation_complete` | Story 2.1 | false | Head of Model Risk (signs validation report) |
| `fma_fairness_assessment_complete` | Story 1.1 | false | Head of Model Risk (reviews and accepts FAR) |
| `cccfa_legal_opinion_complete` | Story 1.2 | false | Legal Counsel (issues written opinion) |
| `fma_explanation_confirmed` | Story 3.1 | false | Legal Counsel + Head of Customer Experience |
| `mrm_committee_approved` | Story 2.2 | false | MRM Committee Chair (issues approval reference) |

The automated deployment manifest pre-flight check (T-DEPLOY-001) asserts all five corresponding manifest fields are non-empty before any staging promotion. The staging pipeline must not proceed if any flag remains false.

---

## Regulated constraint gate summary

| Constraint | Gate field in manifest | Named responsible party | Sequence position |
|-----------|----------------------|------------------------|------------------|
| C1 (FMA fairness methodology) | `fma_fairness_assessment_reference` (format FAR-YYYY-xxx) | Head of Model Risk | Gate 1 (must precede independent validation) |
| C2 (MRM independent validation) | `independent_validation_reference` | CRO / Head of Model Risk | Gate 2 (must precede committee submission) |
| C3 (CCCFA responsible lending) | `cccfa_legal_opinion_reference` | Legal Counsel | Gate 3 (can run parallel with Gate 2) |
| C4 (Explainability compliance) | `fma_explanation_compliance_confirmed: true` | Legal Counsel + Head of Customer Experience | Gate 4 (must precede committee package assembly — Story 2.2 AC1(iv)) |
| C5 (MRM Policy v2.0 version mismatch — [BLOCKER]) | `mrm_committee_approval_reference` (format MRM-YYYY-QX-NNN) | MRM Committee Chair | Gate 5 (must precede staging; depends on Gates 1–4 all complete) |

---

## Coding agent instructions

**Proceed verdict: YES**

The coding agent may begin implementation. The following constraints are mandatory and non-negotiable:

1. **Implementation must not proceed to staging without all five deployment manifest fields being non-empty.** This is enforced by the automated pre-flight check (T-DEPLOY-001). The pre-flight check must be implemented as a standalone script that exits non-zero on any empty field. The staging CI/CD pipeline must invoke this script as a prerequisite step before any model promotion.

2. **Independent validation cannot begin before FMA fairness assessment (Story 1.1) and CCCFA legal opinion (Story 1.2) are complete.** Story 2.1 AC5 enforces this sequencing. The independent validation engagement scope agreement must reference both artefacts' reference IDs.

3. **No MRM committee submission package is assembled without `independent_validation_reference` being non-empty.** T-IV-004 tests this gate explicitly. This is the primary C5 enforcement mechanism.

4. **Use `fma_fairness_assessment_reference` as the canonical field name in both MLflow and the deployment manifest.** L2 (review) identified a naming inconsistency — use the canonical name throughout.

5. **CRMP-OUT-001 API schema change must be communicated to the Credit Decisioning Engine team before staging.** Story 3.1 AC5 is the notification owner. T-EXPL-005 tests that the consumer handles the new field. This notification must be on file as a staging prerequisite before T-EXPL-005 can pass.

6. **Confirm CRMP-OUT-003 audit log schema supports the explanation payload field before staging begins.** L3 (review) flagged this as a staging prerequisite. If schema extension is required, treat it as a blocker before staging integration, not a post-staging fix.

7. **All five governance reference IDs must be populated in the MLflow CRMP-MOD-001 v3.0 registry entry before production deployment is initiated.** T-DEPLOY-005 tests this gate.

8. **C5 is a [BLOCKER] identified at discovery.** The team is currently following the pre-2023 MRM process. The 2023 MRM Policy v2.0 (effective 1 July 2023) makes independent validation mandatory for all credit model retrains. This must be escalated to the CRO immediately. The implementation timeline is 18–26 weeks, not the originally planned 12 weeks. Do not proceed with MRM committee submission until independent validation is complete.

---

```yaml
# CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: A
story: S12
stage: /definition-of-ready
model: claude-sonnet-4-6
dor_verdict: PROCEED
oversight_level: HIGH
all_hard_blocks_pass: true
hard_block_count: 12
warnings_acknowledged: [W2 (external party timeline), W3 (dual-obligation explanation), W4 (C5 injection-aided), W5 (audit schema staging prerequisite)]
deployment_flags:
  independent_validation_complete: false
  fma_fairness_assessment_complete: false
  cccfa_legal_opinion_complete: false
  fma_explanation_confirmed: false
  mrm_committee_approved: false
regulated_gates_defined: true
gate_count: 5
automated_enforcement: true
c5_gate: mrm_committee_approval_reference (format MRM-YYYY-QX-NNN)
c5_surfaced_at: /discovery
c5_surfacing_quality: partial
c5_blocker: true
c5_excluded_from_h3: true
```

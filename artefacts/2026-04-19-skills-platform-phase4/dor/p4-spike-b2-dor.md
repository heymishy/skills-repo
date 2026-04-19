# Definition of Ready: Spike B2 — Craig's CLI MVP

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b2.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-b2-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-b2-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E1 — Spike Programme
Oversight level: High

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform maintainer (heymishy). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 5 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | Test plan covers all 5 ACs (13 tests total). |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | Benefit linkage: M1 (Distribution sync) and M2 (Consumer confidence) — both named. |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 2 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 5 ACs covered; no gaps. |
| H8-ext | Schema dependency check: upstream fields exist in schema | ✅ PASS | Upstream: p4-spike-a verdict. Field `features[].spikes[].verdict` present in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C5, C1, C4, ADR-004, MC-CORRECT-02, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | No CSS-layout ACs. |
| H-NFR | NFR profile exists at feature level | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory compliance clause ACs. |
| H-NFR3 | Data classification declared in NFR profile | ✅ PASS | NFR profile covers MC-SEC-02; spike produces markdown artefacts only. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified in story | ✅ | Security (MC-SEC-02, C5), Audit, C1 (non-fork constraint), ADR-004. |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable. Risk: Spike A REDESIGN may change what the CLI spike needs to evaluate. Acknowledged: High oversight; may re-scope if Spike A returns REDESIGN. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 RISK-ACCEPTed in decisions.md on 2026-04-19. |
| W4 | Verification script reviewed by domain expert | ⚠️ PROCEED | Not independently reviewed. Acknowledged: proceed. |
| W5 | No UNCERTAIN gaps in test plan | ✅ | No UNCERTAIN gaps found. |

**Warnings result: W2 and W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — this story requires operator (heymishy) investigation, NOT coding agent implementation.**

This is an E1 spike story. Oversight level: **High**. A coding agent must NOT execute this story.

**Upstream gate:** Spike A (p4-spike-a) must have a non-null verdict before Spike B2 investigation begins.

**Scope contract:**
- Investigate Craig's CLI MVP approach as described in AC1–AC5.
- Reference Craig's artefacts (Craig's PR #155 and associated artefacts) as inputs (AC1).
- Assess P1–P4 fidelity properties for the CLI surface (AC2).
- Address Assumption A2 (assurance gate) (AC3).
- Record verdict including the mechanism-selection ADR requested in Craig's PR #155 (AC4).
- Ensure p4.enf-cli story references both Spike A and Spike B2 outputs and Craig's artefacts (AC5).
- Output to: `artefacts/2026-04-19-skills-platform-phase4/reference/spike-b2-output.md`
- Record verdict in `.github/pipeline-state.json` `features[0].spikes[2].verdict` (id: "spike-b2") and `decisions.md`.
- No `src/` changes, no `package.json` changes.

**Architecture constraints:**
- C5: Hash verification
- C1: Non-fork — no consumer forks of the platform repo
- C4: Human approval gate — verdict by heymishy only
- ADR-004: Config via `context.yml`
- MC-CORRECT-02: Schema-first
- MC-SEC-02: No credentials in artefacts

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy approval required before spike execution begins (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Unstable scope), W4 (verification script not domain-expert reviewed)
Risk-accept referenced: decisions.md entry for 1-M1
Upstream gate: Spike A verdict must be non-null before execution.

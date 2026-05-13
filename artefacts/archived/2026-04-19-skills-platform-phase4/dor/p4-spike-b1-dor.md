# Definition of Ready: Spike B1 — MCP Tool-Boundary Enforcement

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b1.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-b1-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-b1-review-1.md
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
| H3 | Every AC is covered by at least one test | ✅ PASS | Test plan covers all 5 ACs (13 tests total, no gaps). |
| H4 | Out-of-scope section is populated | ✅ PASS | Out-of-scope explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | Benefit linkage: M2 — Consumer confidence (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 2 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 5 ACs covered; no gaps identified. |
| H8-ext | Schema dependency check: upstream fields exist in schema | ✅ PASS | Upstream dependency: p4-spike-a verdict. Field `features[].spikes[].verdict` now exists in `.github/pipeline-state.schema.json` (added this session as schema fix). |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C11, ADR-004, C5, C7, C4, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | No CSS-layout ACs. |
| H-NFR | NFR profile exists at feature level | ✅ PASS | nfr-profile.md exists and covers C11, C7, MC-SEC-02. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory compliance clause ACs. |
| H-NFR3 | Data classification declared in NFR profile | ✅ PASS | NFR profile covers MC-SEC-02; spike produces markdown artefacts only — no PII or sensitive data classification required. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified in story | ✅ | Security (MC-SEC-02, C5, C11 explicit), Audit, C7 (single-turn). No performance NFR required for a spike. |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable. Risk: unstable scope may shift investigation direction if Spike A returns REDESIGN. Acknowledged: heymishy proceeding under High oversight; Spike B1 may need to be re-scoped if Spike A returns REDESIGN. Expected for a spike. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 RISK-ACCEPTed in decisions.md on 2026-04-19 by heymishy. |
| W4 | Verification script reviewed by domain expert | ⚠️ PROCEED | Verification script not independently reviewed. Acknowledged: proceed. |
| W5 | No UNCERTAIN gaps in test plan | ✅ | No UNCERTAIN gaps found. |

**Warnings result: W2 and W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — this story requires operator (heymishy) investigation, NOT coding agent implementation.**

This is an E1 spike story. Oversight level: **High**. A coding agent must NOT execute this story.

**Upstream gate:** Spike A (p4-spike-a) must have a PROCEED or REDESIGN verdict before Spike B1 investigation begins. Do not start this spike if `features[0].spikes[0].verdict` is null.

**Scope contract:**
- Investigate MCP tool-boundary enforcement as described in AC1–AC5.
- Produce the verdict artefact referencing Spike A output.
- Record verdict in:
  1. `.github/pipeline-state.json` → `features[0].spikes[1].verdict` (where `id: "spike-b1"`)
  2. `artefacts/2026-04-19-skills-platform-phase4/decisions.md` → ADR entry for MCP tool-boundary enforcement mechanism
- Reference both Spike A and Spike B1 outputs from the p4.enf-mcp story (AC5).
- No changes to `src/`, no implementation artefacts.

**Architecture constraints:**
- C11: No persistent hosted runtime — any MCP solution proposed must address C11 compliance explicitly
- ADR-004: Config via `context.yml`
- C5: Hash verification on any claimed hash-verifiable artefacts
- C7: Single-turn / one-question-at-a-time — MCP must structurally enforce this
- C4: Human approval gate — verdict by heymishy only
- MC-SEC-02: No credentials in artefacts

**Fidelity properties to assess (P1–P4):**
- P1: Skill-as-contract (hash match at invocation)
- P2: Active context injection (skill body delivered at invocation)
- P3: Per-invocation trace anchoring (trace entry emitted)
- P4: Interaction mediation (single-turn enforced)

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy approval required before spike execution begins (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Unstable scope), W4 (verification script not domain-expert reviewed)
Risk-accept referenced: decisions.md entry for 1-M1
Upstream gate: Spike A verdict must be non-null before execution.

# Definition of Ready: Spike A — Governance Logic Extractability

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-a.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-a-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-a-review-1.md
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
| H3 | Every AC is covered by at least one test | ✅ PASS | Test plan covers AC1→3 tests, AC2→2, AC3→2, AC4→3, AC5→2 (12 total). |
| H4 | Out-of-scope section is populated | ✅ PASS | Out-of-scope explicitly lists: no implementation, no mechanism evaluation, no `src/` changes. |
| H5 | Benefit linkage names a metric | ✅ PASS | Benefit linkage: M2 — Consumer confidence (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3 (high ambiguity). |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 2 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 5 ACs covered; no gaps identified in test plan. |
| H8-ext | Schema dependency check: upstream fields exist in schema | ✅ PASS | Spike A has no upstream story dependencies. H8-ext not applicable. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: ADR-004, MC-CORRECT-02, C5 (hash verification), C4 (human approval gate), MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | No CSS-layout ACs in this story. |
| H-NFR | NFR profile exists at feature level | ✅ PASS | artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md exists and is populated. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory compliance clause ACs in this spike story. |
| H-NFR3 | Data classification declared in NFR profile | ✅ PASS | NFR profile covers MC-SEC-02 (no credentials in artefacts); spike produces only markdown artefacts — no sensitive data classification required beyond credential exclusion. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified in story | ✅ | Security (MC-SEC-02, C5), Audit (verdict must appear in both pipeline-state.json and decisions.md ADR). No performance NFR needed for a spike. |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope stability: Unstable. Risk: unstable scope may invalidate investigation direction mid-spike. Acknowledged: heymishy proceeding with High oversight; verdict may invalidate downstream test plans for E3 stories. This is expected for a spike. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 (So-that clause omits metric name) RISK-ACCEPTed in artefacts/2026-04-19-skills-platform-phase4/decisions.md on 2026-04-19 by heymishy. |
| W4 | Verification script reviewed by domain expert | ⚠️ PROCEED | Verification script at artefacts/2026-04-19-skills-platform-phase4/verification-scripts/p4-spike-a-verification.md has not been independently reviewed by a domain expert. Acknowledged: proceed. Spike execution itself is the investigation; the verification script records outcomes. |
| W5 | No UNCERTAIN gaps in test plan | ✅ | No UNCERTAIN gaps found in p4-spike-a-test-plan.md. |

**Warnings result: W2 and W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — this story requires operator (heymishy) investigation, NOT coding agent implementation.**

This is an E1 spike story. Oversight level: **High**. A coding agent must NOT execute this story. Execution is reserved for heymishy as operator.

**Scope contract:**
- Run the extractability investigation described in AC1–AC5.
- Produce the verdict artefact at: `artefacts/2026-04-19-skills-platform-phase4/reference/spike-a-output.md` (or the path established during investigation).
- Record verdict (PROCEED / REDESIGN / DEFER / REJECT) in:
  1. `.github/pipeline-state.json` → `features[0].spikes[0].verdict` (where `id: "spike-a"`)
  2. `artefacts/2026-04-19-skills-platform-phase4/decisions.md` → new ADR entry for governance-logic extractability decision
- No changes to `src/`, no implementation artefacts, no `package.json` changes.

**Architecture constraints to respect during investigation:**
- ADR-004: all config via `context.yml`; no hardcoded paths in investigation outputs
- MC-CORRECT-02: schema-first — if the investigation proposes new pipeline-state.json fields, add them to schema before recording
- C5: hash verification — any artefact claimed as hash-verifiable must include a verifiable hash in its content
- C4: human approval gate — verdict must be written by heymishy, not generated by an automated process
- MC-SEC-02: no session tokens, API keys, or credentials in any artefact

**Acceptance criteria summary:**
- AC1: Spike output artefact exists with a valid verdict (one of: PROCEED, REDESIGN, DEFER, REJECT)
- AC2: If PROCEED → package interface is defined and referenced in output
- AC3: If REDESIGN → at least one architectural constraint is identified and recorded
- AC4: Verdict appears in both pipeline-state.json and decisions.md as an ADR
- AC5: No E3 story enters DoR without a Spike A reference in its upstream dependencies

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy approval required before spike execution begins (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Unstable scope), W4 (verification script not domain-expert reviewed)
Risk-accept referenced: decisions.md entry for 1-M1 (MEDIUM finding, So-that metric omission)

Pipeline state updated: dorStatus will be set to "signed-off" in pipeline-state.json for story p4-spike-a.

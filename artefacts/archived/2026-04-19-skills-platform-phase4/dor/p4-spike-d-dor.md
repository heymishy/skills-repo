# Definition of Ready: Spike D — Teams C7 Prototype

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-d.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-d-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-d-review-1.md
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
| H5 | Benefit linkage names a metric | ✅ PASS | Benefit linkage: M3 — Teams bot C7 fidelity (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 2 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 5 ACs covered; no gaps. |
| H8-ext | Schema dependency check: upstream fields exist in schema | ✅ PASS | Spike D can run independently from Spike A; Spike A is noted as providing context, not a hard gate. No upstream schema dependency to check. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C11, C7, ADR-004, C4, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | No CSS-layout ACs. |
| H-NFR | NFR profile exists at feature level | ✅ PASS | nfr-profile.md exists and covers C11 and C7. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory compliance clause ACs. |
| H-NFR3 | Data classification declared in NFR profile | ✅ PASS | NFR profile covers MC-SEC-02; spike produces markdown artefacts only. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified in story | ✅ | Security (MC-SEC-02), C11 (no persistent hosted runtime — most likely DEFER source), C7 (single-turn enforcement), Audit, Cost (C11 runtime requirement if applicable). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — C11 compliance is the most likely DEFER source; if Azure / Microsoft account is unavailable, E4 stories are deferred. Acknowledged: High oversight; all E4 stories depend on PROCEED verdict from this spike. |
| W3 | MEDIUM findings acknowledged | N/A | Review returned 0 MEDIUM findings. No risk-accept required. |
| W4 | Verification script reviewed by domain expert | ⚠️ PROCEED | Not independently reviewed. Acknowledged: proceed. |
| W5 | No UNCERTAIN gaps in test plan | ✅ | No UNCERTAIN gaps found. |

**Warnings result: W2 and W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — this story requires operator (heymishy) investigation, NOT coding agent implementation.**

This is an E1 spike story. Oversight level: **High**. A coding agent must NOT execute this story.

**Independence note:** Spike D may run in parallel with Spikes A/B/C. It does not hard-gate on any other spike. However, Spike A provides useful context and should be consulted if available.

**Scope contract:**
- Prototype the Teams bot surface and produce a turn-by-turn log of ≥3 turns (AC1).
- Explicitly address C11 compliance: state the runtime requirement and cost implication (AC2).
- Record the C7 violation count from the prototype session (AC3).
- Produce at minimum a PROCEED or DEFER verdict (AC4) — DEFER is expected if Azure / Microsoft account is unavailable.
- Record verdict + ADR including C11 finding and C7 count in pipeline-state.json and decisions.md (AC5).
- Output to: `artefacts/2026-04-19-skills-platform-phase4/reference/spike-d-output.md`
- Record in `.github/pipeline-state.json` `features[0].spikes[4].verdict` (id: "spike-d") and `decisions.md`.

**Downstream impact:** ALL E4 stories (p4-nta-surface, p4-nta-gate-translation, p4-nta-artefact-parity, p4-nta-standards-inject, p4-nta-ci-artefact) depend on a PROCEED verdict from this spike. If DEFER, E4 stories are deferred to Phase 5.

**Architecture constraints:**
- C11: No persistent hosted runtime — must explicitly state compliance or mitigation
- C7: One-question-at-a-time structural enforcement — prototype must demonstrate structural enforcement (not conventional)
- ADR-004: Config via `context.yml`
- C4: Human approval gate — verdict by heymishy only
- MC-SEC-02: No credentials in artefacts

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy approval required before spike execution begins (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Unstable scope — DEFER likely if Azure unavailable), W4 (verification script not domain-expert reviewed)
W3: N/A — no MEDIUM findings in this spike's review
Downstream note: E4 stories are contingent on this spike's PROCEED verdict.

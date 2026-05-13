# Definition of Ready: p4-nta-ci-artefact — CI artefact integration for non-git-native surfaces

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-ci-artefact.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-nta-ci-artefact-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-nta-ci-artefact-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E4 — Non-Technical Access
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform maintainer (heymishy). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence; M3 — Teams bot C7 fidelity (both named in benefit linkage). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 0 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | Spike D verdict in schema ✅. `standards_injected` warning in CI is a CI check behavior, not a new pipeline-state.json field. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: MC-CORRECT-02, C1, ADR-004. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no session tokens or credentials in CI logs. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Correctness (CI checks bot artefacts without special-casing), Security (MC-SEC-02), Audit (CI summary uniform across bot and git-native artefacts). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — depends on Spike D PROCEED verdict. If Spike D returns DEFER, this story is deferred to Phase 5. Acknowledged. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 (So-that clause missing metric names) RISK-ACCEPTed in decisions.md on 2026-04-19. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W3, W4 acknowledged — Proceed: Yes (contingent on Spike D PROCEED)**

---

## Coding Agent Instructions

**Proceed: Yes — contingent on Spike D PROCEED verdict. Implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** p4-nta-artefact-parity and p4-nta-gate-translation must be complete. Spike D must have PROCEED verdict.

**Scope contract:**
- This story ensures existing CI checks cover bot artefacts without modification to check scripts.
- If p4-nta-standards-inject introduces `standards_injected` metadata, add a warning-only CI check.
- AC1: `npm test` passes for bot-produced artefact on bot-session PR without modification to check scripts.
- AC2: `scripts/validate-trace.sh --ci` passes for bot conversation trace on bot-session PR.
- AC3: Artefact with `standards_injected: false` → CI emits warning identifying the path and flag; PR not failed.
- AC4: CI summary for bot-artefact PR has no surface-specific annotation (no "bot artefacts validated separately").
- If a check script modification is required (e.g. `standards_injected` field in trace schema), the modification must apply to all artefacts (MC-CORRECT-02), not only bot artefacts.

**Architecture constraints:**
- MC-CORRECT-02: no new CI check that runs only on bot artefacts; existing suite handles all artefacts uniformly; any schema modification applies universally
- C1: CI runs on origin repository branch (C1 enforced upstream by p4-nta-artefact-parity AC3)
- ADR-004: if CI reads bot-session config, it reads from `context.yml`; no hardcoded bot-specific paths

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike D DEFER → story deferred), W3 (1-M1 RISK-ACCEPTed), W4 (verification script)
Upstream gate: Spike D PROCEED + p4-nta-artefact-parity + p4-nta-gate-translation complete.

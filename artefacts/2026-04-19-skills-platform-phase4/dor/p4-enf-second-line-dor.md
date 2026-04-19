# Definition of Ready: p4-enf-second-line — Theme F second-line evidence chain inputs

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-second-line.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-enf-second-line-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-enf-second-line-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E3 — Structural Enforcement
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform maintainer (heymishy). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 3 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 3 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence, regulated segment (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 0 LOW — clean. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 3 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | No new pipeline-state.json fields required. `executorIdentity` as optional trace field is a trace schema concern (validated by `validate-trace.sh`). |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C4 (Phase 4 / Theme F boundary), MC-SEC-02, Craig's ADR-003. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no identity values in `theme-f-inputs.md`. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Correctness (`executorIdentity` schema change validated by `validate-trace.sh --ci`), Audit (Phase 4/Theme F boundary explicitly documented). |
| W2 | Scope stability declared | ✅ STABLE | Complexity 2, Stable — document content follows from the three mechanism implementations. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** `p4-enf-package`, `p4-enf-mcp`, and `p4-enf-cli` must all be complete. This is the terminal story for E3.

**Scope contract:**
- Produce `artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md`.
- AC1: document contains three sections: (1) CLI verification contract (per-node fields incl. `executorIdentity` optional per ADR-003), (2) workflow declaration structure, (3) MCP trace contract.
- AC2: trace JSON Schema marks `executorIdentity` as optional; assurance gate accepts trace with/without it. `scripts/validate-trace.sh --ci` passes with updated schema.
- AC3: document explicitly distinguishes (a) Phase 4 enforcement deliverables and (b) Theme F deliverables not in Phase 4 scope — referencing Craig's Q4 clarification decision.

**Architecture constraints:**
- C4: document explicitly states the Phase 4 / Theme F boundary; Theme F controls not in Phase 4 scope
- MC-SEC-02: no credentials, API keys, or operator-identifiable values in `theme-f-inputs.md`; `executorIdentity` described as field with type and purpose only, no example identity values
- Craig's ADR-003: `executorIdentity` is optional in trace schema; document records this explicitly

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W4 (verification script)
Upstream gate: p4-enf-package + p4-enf-mcp + p4-enf-cli all complete.

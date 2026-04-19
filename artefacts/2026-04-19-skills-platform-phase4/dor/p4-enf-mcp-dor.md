# Definition of Ready: p4-enf-mcp — MCP enforcement adapter

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-mcp.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-enf-mcp-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-enf-mcp-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E3 — Structural Enforcement
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: interactive operator using VS Code or Claude Code. All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence (named in benefit linkage section). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 0 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | Spike B1 verdict in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C11, C5, C7, C4, Spike B1 output, ADR-004. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no skill content or operator input logged. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02; no bypass), Correctness (P1–P4 covered; trace validated), Performance (MCP overhead ≤500ms). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — C11 compliance (no persistent process) may require REDESIGN if VS Code MCP integration cannot support per-call lifecycle. Acknowledged. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 RISK-ACCEPTed in decisions.md on 2026-04-19. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W3, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** Spike B1 must have a non-null verdict. `p4-enf-decision` ADR must be committed. `p4-enf-package` must be complete (PROCEED or REDESIGN path outputs available).

**Scope contract:**
- Implement MCP tool adapter for VS Code / Claude Code surface class.
- AC1: `verifyHash` called before skill body delivered; hash mismatch → tool call returns structured error to agent; no skill body delivered.
- AC2: Valid hash → P2 context injection: skill body + applicable standards + current state context assembled in tool response.
- AC3: `writeTrace` called on tool return with: skillHash, inputHash, outputRef, transitionTaken, surfaceType `"mcp-interactive"`, timestamp. Trace passes `validate-trace.sh --ci`.
- AC4: CI test confirms adapter does not spawn persistent background process (C11 compliance test).
- Approval gates use approval-channel adapter (ADR-006), not auto-approve (C4).
- Input schema validates single question context per tool call (C7).

**Architecture constraints:**
- C11: event-driven; no persistent background process; per-session lifecycle at maximum
- C5: `verifyHash` non-negotiable; no bypass path
- C7: single-turn input schema; reject multi-question payloads
- C4: approval gates route through approval-channel adapter (ADR-006)
- ADR-004: config read from `.github/context.yml`
- MC-SEC-02: no skill content or operator input logged externally

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (C11 may require REDESIGN), W3 (1-M1 RISK-ACCEPTed), W4 (verification script)
Upstream gate: Spike B1 verdict + p4-enf-decision ADR + p4-enf-package complete.

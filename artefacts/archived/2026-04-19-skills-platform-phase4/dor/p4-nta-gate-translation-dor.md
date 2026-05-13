# Definition of Ready: p4-nta-gate-translation — Non-technical approval channel routing

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-gate-translation.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-nta-gate-translation-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-nta-gate-translation-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E4 — Non-Technical Access
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: non-technical approver. All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M3 — Teams bot C7 fidelity; M2 — Consumer confidence (both named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 0 LOW — clean. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | Spike D verdict in schema ✅. Approval event schema is existing field (MC-CORRECT-02). |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: ADR-006, C4, MC-CORRECT-02, ADR-004. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no credentials in approval event payloads; approver identity validated against context.yml list. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02; approver identity validated), Correctness (approval event schema matches pipeline-state.json schema), Audit (`channel: "teams"` + `approvedAt` timestamp in event). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — depends on Spike D PROCEED verdict. If Spike D returns DEFER, this story is deferred to Phase 5. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes (contingent on Spike D PROCEED)**

---

## Coding Agent Instructions

**Proceed: Yes — contingent on Spike D PROCEED verdict. Implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** p4-nta-surface must be complete (bot runtime handles action handler). Spike D must have PROCEED verdict.

**Scope contract:**
- Implement Teams approval channel as a new ADR-006 adapter instance.
- AC1: "Approve" adaptive card button → action handler calls `process-dor-approval.js` with same arguments as GitHub-issue-channel approval.
- AC2: `process-dor-approval.js` completes → `pipeline-state.json` updated with `dorStatus: "signed-off"` for relevant story.
- AC3: Approver closes card without action → DoR status unchanged; no implicit or timeout-based auto-approval (C4).
- AC4: Incomplete Teams config in context.yml → user-visible error "Approval routing configuration is missing — please contact the platform maintainer"; no silent failure.
- Audit: approval event includes `channel: "teams"` and `approvedAt` timestamp.

**Architecture constraints:**
- ADR-006: Teams channel is a new adapter instance; must implement approval-channel adapter interface; `process-dor-approval.js` requires no modification
- C4: explicit approver action required; no implicit or auto-approval
- MC-CORRECT-02: approval event schema matches existing pipeline-state.json approval schema; no new fields without schema update
- ADR-004: Teams config from `context.yml.approval_channels.teams`

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike D DEFER → story deferred), W4 (verification script)
Upstream gate: Spike D PROCEED + p4-nta-surface complete.

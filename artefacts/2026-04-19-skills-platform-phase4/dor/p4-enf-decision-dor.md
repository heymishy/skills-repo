# Definition of Ready: p4-enf-decision — Mechanism selection ADR

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-decision.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-enf-decision-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-enf-decision-review-1.md
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
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 0 LOW — clean. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | AC3 writes `guardrails[]` entry to pipeline-state.json; `guardrails[]` field must be present in schema. Schema includes features.items.properties — schema update required as part of this story if `guardrails[]` is not yet present. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: ADR-004, C4 (ADR is E3 entry condition), MC-CORRECT-02. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no credentials in ADR text. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Audit (ADR committed to `.github/architecture-guardrails.md`), Correctness (ADR ID unique), Security (MC-SEC-02). |
| W2 | Scope stability declared | ✅ STABLE | Complexity 2, Stable — once spike verdicts exist, ADR content follows deterministically. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** Spike A, Spike B1, and Spike B2 must all have non-null verdicts before this story begins. This story synthesises all three spike findings.

**Scope contract:**
- Write ADR in `.github/architecture-guardrails.md` as a new active ADR entry with ID `ADR-phase4-enforcement`.
- ADR must cover 4 surface classes: (1) VS Code/Claude Code interactive, (2) CI/headless regulated, (3) chat-native progressive, (4) non-git-native.
- AC1: each surface class specifies exactly which mechanism, with rationale linking to spike verdict.
- AC2: ADR follows existing format in the file (context, options considered, decision, consequences, revisit triggers).
- AC3: `pipeline-state.json` features[0].guardrails[] updated with `{"id": "ADR-phase4-enforcement", "file": ".github/architecture-guardrails.md", "status": "active"}`.
- AC4: any surface class using "deferred" mechanism explicitly names the reason and revisit trigger.
- Note: if `guardrails[]` is not yet in `pipeline-state.schema.json`, the schema update must be included in this PR.

**Architecture constraints:**
- ADR-004: ADR committed to `.github/architecture-guardrails.md` (canonical ADR registry)
- C4: ADR committed + heymishy-approved before any E3 implementation story (enf-package, enf-mcp, enf-cli, enf-schema) may enter the inner loop
- MC-CORRECT-02: `guardrails[]` schema updated before writing to pipeline-state.json

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before PR merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W4 (verification script)
Upstream gate: Spike A + B1 + B2 verdicts required.

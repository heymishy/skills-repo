# Definition of Ready: Add instrumentation instruction to `copilot-instructions.md`

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.3-agent-instruction-integration.md
**Test plan reference:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.3-test-plan.md
**Verification script:** artefacts/2026-04-18-skill-performance-capture/verification-scripts/spc.3-verification.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-04-18

---

## Contract Proposal

**What will be built:**
A new section `## Skill Performance Capture (instrumentation)` added to `.github/copilot-instructions.md` via a **PR** (not a direct master commit — see Platform change policy and RISK-ACCEPT 1-M6 below). The section instructs the agent to: (a) read `.github/context.yml` at session start, (b) check `instrumentation.enabled: true` before acting, (c) append the capture block template to named artefact types when enabled, (d) not modify primary artefact body content (appendix-only constraint), (e) name the five target artefact types and exclude gate artefacts. The section also states that `fidelity_self_report` must not contain session tokens, user identifiers, or API credentials.

**PLATFORM CHANGE POLICY — MANDATORY:** `.github/copilot-instructions.md` is a governed platform file. Changes must be made via a PR. The coding agent must NOT commit this change directly to master. Open a draft PR — a human reviews before merge.

**What will NOT be built:**
- No modifications to any SKILL.md file — all capture logic lives in copilot-instructions.md only
- No automatic population of the operator review section
- No retroactive appending of capture blocks to artefacts written before instrumentation was enabled

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — section heading + 3 instructions present | Read .github/copilot-instructions.md, assert section heading and all 3 instructions present | Unit (file inspection) |
| AC2 — capture block appended when enabled | Run a short skill with instrumentation.enabled:true; inspect output artefact for capture block | Manual (live session 🔴) |
| AC3 — no capture block when disabled | Run a short skill with instrumentation.enabled:false; inspect output artefact — no block at end | Manual (live session 🔴) |
| AC4 — appendix constraint stated | Read file, assert appendix constraint text present | Unit (file inspection) |
| AC5 — 5 artefact types named + gate exclusion explicit | Read file, assert 5 artefact types named and DoR/DoD explicitly excluded | Unit (file inspection) |

**Assumptions:**
- Field names referenced in the instruction match spc.1 schema and spc.2 template exactly: experiment_id, model_label, cost_tier, skill_name, artefact_path, run_timestamp
- AC2 and AC3 cannot be verified without a live agent session with instrumentation configured — acknowledged manual gaps in test plan
- The instruction is inserted into copilot-instructions.md as a new section; it may coexist with existing sections without conflicting

**Estimated touch points:**
Files: `.github/copilot-instructions.md` (one additive section — via PR only). Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. AC2 and AC3 are acknowledged as manual-only verification scenarios. RISK-ACCEPT 1-M5 (benefit linkage MM1/MM2/MM3 underreport, matrix is authoritative), 1-M6 (PR requirement for copilot-instructions.md changes) are acknowledged. No contract mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a operator running a comparison experiment" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1=T1–T3, AC2=Manual (acknowledged gap), AC3=Manual (acknowledged gap), AC4=T4, AC5=T5–T7; 8 automated tests + 1 NFR + 2 manual; all ACs covered or gap acknowledged |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | M1 named (RISK-ACCEPT 1-M5 covers MM1/MM2/MM3 underreporting) |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings — review report: spc.3-review-1.md |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC2 and AC3 gaps are explicitly acknowledged as manual scenarios in test plan gap table |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream: spc.1 (field names), spc.2 (template path). Declared schemaDepends: [] — dependencies are on context.yml and template fields, not pipeline-state.json fields. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 3 constraints named (C3 SKILL.md prohibition, config reading guardrail, MC-CONSIST-01 N/A note). RISK-ACCEPT 1-M6 carries the PR requirement — it is restated in Coding Agent Instructions block below. |
| H-E2E | CSS-layout-dependent ACs only | ✅ | No CSS-layout-dependent ACs — N/A |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-04-18-skill-performance-capture/nfr-profile.md present |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No regulatory compliance clauses — N/A |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Public |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; profile exists |

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | 1-M5, 1-M6 logged; also 1-M1 (AC4 runtime owned by spc.3) in decisions.md (2026-04-18) |
| W4 | Verification script reviewed by a domain expert | ⚠️ AMBER | AC2 and AC3 are manual-only verification scenarios — additional risk that live-session verification criteria are unclear | Operator acknowledged, RISK-ACCEPT logged — DoR-W4-spc.3. The two manual scenarios in the verification script are clearly described with setup steps. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | AC2/AC3 gaps are explicitly classified as Manual (not Uncertain) and setup steps documented |

---

## Standards Injection

No `domain:` field present in story. No standards injection required.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add instrumentation instruction to copilot-instructions.md — artefacts/2026-04-18-skill-performance-capture/stories/spc.3-agent-instruction-integration.md
Test plan: artefacts/2026-04-18-skill-performance-capture/test-plans/spc.3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- File to modify: .github/copilot-instructions.md — one file only
- ⚠️ PLATFORM CHANGE POLICY (MANDATORY — RISK-ACCEPT 1-M6):
  Changes to .github/copilot-instructions.md MUST be made via a PR.
  DO NOT commit directly to master. Open a draft PR immediately
  after making the change. A human reviews before merge.
  This is a governed platform file — direct commits are a pipeline violation.
- Section to add: ## Skill Performance Capture (instrumentation)
- The section must instruct the agent to:
  (a) read .github/context.yml at session start
  (b) check instrumentation.enabled: true before appending
  (c) append capture block from .github/templates/capture-block.md as final section
      of named artefact types when enabled
  (d) state the appendix constraint: capture block must not alter primary artefact body
  (e) name artefact types: discovery.md, benefit-metric.md, story artefacts, test plan artefacts
  (f) explicitly exclude gate artefacts: DoR and DoD
- Field names in instruction must exactly match spc.1 schema and spc.2 template:
  experiment_id, model_label, cost_tier, skill_name, artefact_path, run_timestamp
- Instruction must state: fidelity_self_report must not contain session tokens,
  user identifiers, or API credentials (MC-SEC-02, story NFR)
- Do not modify any SKILL.md file
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.
  Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- OPEN A DRAFT PR — do not mark ready for review, do not merge
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
Note: Share the DoR artefact with the tech lead before assigning to the coding agent.
The PR for copilot-instructions.md requires human review before merge — do not expedite.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness required before assigning to coding agent
**Signed off by:** Not required (Medium oversight — awareness only)

---

## 🔴 Test plan gap note

AC2 (capture block appended when enabled) and AC3 (no capture block when disabled) require a live Copilot Chat session with instrumentation configured. These cannot be verified by automated static tests. The verification script (spc.3-verification.md Scenarios 4 and 5) provides the manual verification procedure. These gaps were acknowledged as acceptable per the agent-runtime-behaviour classification during /test-plan.

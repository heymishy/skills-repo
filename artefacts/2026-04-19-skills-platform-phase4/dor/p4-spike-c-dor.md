# Definition of Ready: Spike C — Distribution Model

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-c.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-c-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-c-review-1.md
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
| H3 | Every AC is covered by at least one test | ✅ PASS | Test plan covers all 5 ACs (15 tests total). |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | Benefit linkage: M1 — Distribution sync (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 3 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 5 ACs covered; no gaps. |
| H8-ext | Schema dependency check: upstream fields exist in schema | ✅ PASS | Dependency on Spike A is soft ("should have verdict, may run in parallel"). Field `features[].spikes[].verdict` present in schema ✅. No hard upstream block. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C1, ADR-004, MC-CORRECT-02, C5, C4, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | No CSS-layout ACs. |
| H-NFR | NFR profile exists at feature level | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory compliance clause ACs. |
| H-NFR3 | Data classification declared in NFR profile | ✅ PASS | NFR profile covers MC-SEC-02; spike produces markdown artefacts only. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified in story | ✅ | Security (MC-SEC-02, C5), Audit, C1 (non-fork), ADR-004. |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — upstream authority question is the central investigation topic. Acknowledged: expected for a spike; High oversight. |
| W3 | MEDIUM findings acknowledged | N/A | Review returned 0 MEDIUM findings for Spike C. No risk-accept required. |
| W4 | Verification script reviewed by domain expert | ⚠️ PROCEED | Not independently reviewed. Acknowledged: proceed. |
| W5 | No UNCERTAIN gaps in test plan | ✅ | No UNCERTAIN gaps found. |

**Warnings result: W2 and W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — this story requires operator (heymishy) investigation, NOT coding agent implementation.**

This is an E1 spike story. Oversight level: **High**. A coding agent must NOT execute this story.

**Soft upstream gate:** Spike A should have a verdict before Spike C closes, but Spike C may begin in parallel. If Spike A returns REDESIGN, check whether the upstream authority decision is affected.

**Scope contract:**
- Investigate the 4 distribution sub-problems and make named decisions for each (AC1).
- Decide the upstream authority question: which repository is authoritative for SKILL.md, POLICY.md, and standards files (AC2).
- Define the lockfile structure (AC3).
- Record verdicts + ADR for the upstream authority decision in pipeline-state.json and decisions.md (AC4).
- Ensure all E2 stories reference Spike C output in their upstream dependencies (AC5).
- Output to: `artefacts/2026-04-19-skills-platform-phase4/reference/spike-c-output.md`
- Record in `.github/pipeline-state.json` `features[0].spikes[3].verdict` (id: "spike-c") and `decisions.md`.

**Architecture constraints:**
- C1: Non-fork — distribution model must not require consumers to fork the platform repo
- ADR-004: Config via `context.yml`
- MC-CORRECT-02: Schema-first — any new pipeline-state.json fields proposed must be added to schema first
- C5: Hash verification
- C4: Human approval gate — verdict by heymishy only
- MC-SEC-02: No credentials in artefacts

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy approval required before spike execution begins (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Unstable scope), W4 (verification script not domain-expert reviewed)
W3: N/A — no MEDIUM findings in this spike's review
Soft upstream dependency: Spike A should have a verdict before Spike C closes.

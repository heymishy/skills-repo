# Definition of Ready: p4-nta-artefact-parity — Artefact landing parity for bot sessions

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-artefact-parity.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-nta-artefact-parity-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-nta-artefact-parity-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E4 — Non-Technical Access
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: non-technical outer-loop participant. All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. LOW finding 1-L1 noted: AC2 references "review test harness" not yet defined — test plan resolves this by using governance check suite directly. Acknowledged. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence; M3 — Teams bot C7 fidelity (both named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 1 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | Spike D verdict in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: template adherence, C1, MC-CORRECT-02, ADR-004. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no PII beyond what git-native sessions write. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Correctness (artefact passes template schema before commit), Security (MC-SEC-02), Reliability (session state persisted for resumption). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — depends on Spike D PROCEED verdict. If Spike D returns DEFER, this story is deferred to Phase 5. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes (contingent on Spike D PROCEED)**

---

## Coding Agent Instructions

**Proceed: Yes — contingent on Spike D PROCEED verdict. Implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** p4-nta-surface must be complete (bot runtime handles session conversation). Spike D must have PROCEED verdict.

**Scope contract:**
- Implement artefact assembler that reads `.github/templates/` and populates template fields from participant responses.
- AC1: all required template fields populated before commit; invalid artefact (any `[FILL IN]` placeholder) not committed; passes template schema validation (`npm test`).
- AC2: bot-produced artefact passes governance check suite (`npm test` artefact format checks) — equivalent to git-native artefact; no special-case finding category. (Note: test uses governance check suite directly, not a separate review harness per LOW finding 1-L1 resolution.)
- AC3: artefact committed to branch on origin repo (not fork) using bot installation token; branch name: `chore/nta-<feature-slug>-<date>` (C1).
- AC4: interrupted session → bot resumes from last answered question; no partial artefact committed; session state persisted to external store.

**Architecture constraints:**
- Template adherence: artefacts follow `.github/templates/` exactly; no new fields, renamed fields, or omitted required fields (MC-CORRECT-02)
- C1: commit to origin branch (not fork); bot uses installation token
- ADR-004: artefact target paths from `context.yml.artefacts.root` + feature slug; no hardcoded paths
- MC-SEC-02: no participant-identifiable information beyond what git-native sessions write

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike D DEFER → story deferred), W4 (verification script)
Upstream gate: Spike D PROCEED + p4-nta-surface complete.

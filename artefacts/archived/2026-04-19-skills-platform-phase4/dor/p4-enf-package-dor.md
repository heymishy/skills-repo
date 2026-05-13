# Definition of Ready: p4-enf-package — Governance package shared core

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-package.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-enf-package-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-enf-package-review-1.md
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
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. LOW finding 1-L1 noted: test plan must confirm active path (PROCEED vs REDESIGN) from Spike A verdict before writing tests. DoR H8-ext confirms Spike A gate. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 1 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. Test plan written for both PROCEED and REDESIGN paths per AC4. |
| H8-ext | Schema dependency check | ✅ PASS | Spike A verdict in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: Spike A interface, C5, ADR-004, MC-CORRECT-02, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no skill content or credentials logged. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (C5: no bypass; MC-SEC-02), Correctness (all 5 entry points tested; trace validated), Performance (`verifyHash` ≤50ms). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — if Spike A returns REDESIGN, implementation path changes from shared runtime to schema/contracts definition. AC4 explicitly handles this path. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** Spike A must have a non-null verdict AND `p4-enf-decision` ADR must be committed and heymishy-approved before this story begins.

**PROCEED path (Spike A = PROCEED):**
- Implement `src/governance-package/index.js` (or equivalent) exporting 5 functions: `resolveSkill`, `verifyHash`, `evaluateGate`, `advanceState`, `writeTrace` per Spike A interface specification at `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`.
- AC1: all 5 entry points exported; each has at least one passing unit test in `npm test`.
- AC2: `verifyHash` with incorrect hash → structured error `{error: "HASH_MISMATCH", skillId, expected, actual}`; no throw; no truthy result.
- AC3: `writeTrace` output passes `scripts/validate-trace.sh --ci`.
- No `force`/`skip` parameter on `verifyHash` (C5).

**REDESIGN path (Spike A = REDESIGN):**
- Define skill format JSON Schema and trace JSON Schema as files in `src/schemas/`.
- Add both schemas to the CI validation suite.
- Produce `src/schema-contracts.md` describing the interfaces each mechanism adapter must implement.

**Architecture constraints:**
- C5: `verifyHash` must not have a bypass; no `force`/`skip` parameter
- ADR-004: all paths/config read from `.github/context.yml`; no hardcoded paths
- MC-CORRECT-02: any new `pipeline-state.json` fields defined in schema before first write
- MC-SEC-02: no skill content, operator input, or context.yml credential values logged externally

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike A PROCEED/REDESIGN path), W4 (verification script)
Upstream gate: Spike A verdict + p4-enf-decision ADR committed.

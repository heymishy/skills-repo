# Definition of Ready: p4-dist-install — Sidecar install via init command

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-install.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-install-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-dist-install-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E2 — Distribution Model
Oversight level: Medium

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: consumer (Craig, Thomas, or any adopter). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | Test plan covers all 4 ACs. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly lists upgrade flow, commit-format validation, non-git-native install, publishing infrastructure. |
| H5 | Benefit linkage names a metric | ✅ PASS | Benefit linkage: M1 — Distribution sync (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 2 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered; no gaps. |
| H8-ext | Schema dependency check: upstream fields exist in schema | ✅ PASS | Spike C verdict dependency: `features[].spikes[].verdict` present in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C1, C5, ADR-004, Spike C output reference. |
| H-E2E | CSS-layout check | N/A | No CSS-layout ACs. |
| H-NFR | NFR profile exists at feature level | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory compliance clause ACs. |
| H-NFR3 | Data classification declared in NFR profile | ✅ PASS | NFR profile covers MC-SEC-02; install writes no sensitive data. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified in story | ✅ | Security (MC-SEC-02), Audit (lockfile fields), Performance (≤30s install). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — sidecar directory convention and lockfile format depend on Spike C verdict. Acknowledged: Spike C must have PROCEED or REDESIGN before this story enters implementation. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 RISK-ACCEPTed in decisions.md on 2026-04-19 by heymishy. |
| W4 | Verification script reviewed by domain expert | ⚠️ PROCEED | Not independently reviewed. Acknowledged: proceed. |
| W5 | No UNCERTAIN gaps in test plan | ✅ | No UNCERTAIN gaps found. |

**Warnings result: W2 and W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — coding agent may implement with PR review (Medium oversight).**

**Upstream gate:** p4-spike-c must have a PROCEED or REDESIGN verdict before implementation begins. Confirm `features[0].spikes[3].verdict` is non-null before writing any code.

**Scope contract:**
- Implement `skills-repo init` command that: fetches upstream content from `skills_upstream.repo` (context.yml), creates sidecar directory at the path specified in Spike C output, writes lockfile, adds sidecar to `.gitignore`, generates zero commits in the consumer repo.
- File touchpoints: `src/` (new install module), `package.json` if new dependency needed, test fixtures.
- Reference Spike C output artefact for sidecar directory convention and lockfile field names — do not choose independently.

**AC summary:**
- AC1: `init` on fresh repo → sidecar + lockfile exists, zero commits, `git status` clean
- AC2: No SKILL.md/POLICY.md/standards files outside sidecar directory
- AC3: Missing `skills_upstream.repo` in context.yml → non-zero exit with named error before network call
- AC4: `init` on existing sidecar → error with "Sidecar already installed" (normative path, per LOW finding 1-L2 — OR branch should be resolved to error path as normative)

**Architecture constraints:**
- C1: Non-fork — no consumer fork required
- C5: Hash-compute all skill files and write to lockfile
- ADR-004: All config from `context.yml`; no hardcoded paths
- MC-SEC-02: No credentials to sidecar, lockfile, or console

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — PR review by heymishy required before merge (Medium oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Unstable scope — Spike C gate), W4 (verification script not domain-expert reviewed)
Risk-accept referenced: decisions.md entry for 1-M1
Upstream gate: Spike C verdict must be non-null before implementation begins.

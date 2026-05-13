# Definition of Ready: p4-dist-migration — Migration path for existing fork consumers

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-migration.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-migration-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-dist-migration-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E2 — Distribution Model
Oversight level: Medium

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: existing fork consumer (Craig or Thomas). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M1 — Distribution sync; M2 — Consumer confidence (both named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 1 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered; no gaps. |
| H8-ext | Schema dependency check | ✅ PASS | Spike C verdict in schema ✅. Story sequencing deps (p4-dist-install, p4-dist-upstream) are ordering constraints not schema fields. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C1, C4, MC-CORRECT-02, Spike C output reference. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 covered. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Audit (verify as final step, migration event recorded in decisions.md). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — migration guide structure depends on Spike C sidecar layout decision. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — coding agent may implement with PR review (Medium oversight).**

**Upstream gate:** p4-dist-install and p4-dist-upstream must be complete (migration guide targets their output state). Spike C must have a verdict.

**Scope contract:**
- Produce a migration guide document (e.g. `docs/migration-guide.md` or similar path from Spike C verdict).
- Guide must include: pre-migration checklist (AC3), `skills_upstream` config step (AC1), `skills-repo verify` as final step (AC1, MC-CORRECT-02), artefact history preservation section (AC2), section explicitly identifying custom skills content that cannot survive migration and requiring explicit operator confirmation before removal (C4).
- AC1: Craig/Thomas follow guide from start → `skills-repo verify` passes; no SKILL.md/POLICY.md outside sidecar.
- AC2: Artefact history intact after migration.
- AC3: Pre-migration checklist section present; types of customisation explicitly documented.
- AC4: Post-migration `npm test` exits 0.
- Note on LOW finding 1-L1: AC4 "attributable to migration" phrasing acknowledged — test plan uses cleaner formulation ("exits 0 from clean state"). Implementation acceptable.

**Architecture constraints:**
- C1: Post-migration state must be non-fork; `verify` passes
- C4: Explicit operator confirmation required before removing consumer-modified skills content
- MC-CORRECT-02: Guide must include `skills-repo verify` as final step
- MC-SEC-02: Guide must not instruct consumer to commit credentials/tokens/tenant IDs

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — PR review by heymishy required (Medium oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike C gate), W4 (verification script)
Upstream gate: p4-dist-install, p4-dist-upstream, and Spike C verdict must be complete.

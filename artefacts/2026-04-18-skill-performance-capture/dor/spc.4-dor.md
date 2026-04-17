# Definition of Ready: Define experiment workspace structure and manifest format

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.4-experiment-workspace-structure.md
**Test plan reference:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.4-test-plan.md
**Verification script:** artefacts/2026-04-18-skill-performance-capture/verification-scripts/spc.4-verification.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-04-18

---

## Contract Proposal

**What will be built:**
A `workspace/experiments/README.md` file (with the directory created as needed) that documents the experiment directory structure: each experiment lives at `workspace/experiments/[experiment-id]/` with a `manifest.md` file and per-model-run subdirectories. The README includes a manifest template showing all required fields (`experiment_id`, `scenario_description`, `runs[]` with `model_label`, `cost_tier`, `run_date`, `artefact_paths[]`, and `comparison_notes`). The manifest template includes a credential warning comment. A `gitignore` update or test filter ensures `workspace/experiments/` is excluded from `npm test`. An update to the `contexts/personal.yml` instrumentation block comment references `workspace/experiments/[experiment-id]/` as the output path.

**RISK-ACCEPT 1-M8 applied:** AC1 deliverable is specifically `workspace/experiments/README.md`. The coding agent must create this file at this exact path.

**What will NOT be built:**
- No automated experiment directory creation
- No automated artefact copying
- No CI checks on contents of workspace/experiments/

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — directory structure documented | Read workspace/experiments/README.md, assert structure description present with experiment-id convention | Unit (file inspection) — per RISK-ACCEPT 1-M8 |
| AC2 — manifest format complete | Inspect README manifest template, assert all required fields present including runs[] array with 4 sub-fields | Unit (file inspection) |
| AC3 — npm test not affected | Read package.json test script, assert workspace/experiments/ not scanned; check tests/ for any scan of that path | Unit (package.json + test inspection) |
| AC4 — contexts/personal.yml comment references output path | Read contexts/personal.yml, assert instrumentation block comment references workspace/experiments/ | Unit (file inspection) |

**Assumptions:**
- `workspace/experiments/` directory does not yet exist; the agent creates it with just a README.md
- Excluding workspace/experiments/ from npm test may require a gitignore addendum or confirming it is already excluded by existing test globs — the agent should verify and add exclusion only if needed
- `contexts/personal.yml` update is an additive comment change only (spc.1 owns the instrumentation block schema; spc.4 adds only the output path reference)

**Estimated touch points:**
Files: `workspace/experiments/README.md` (new directory + file), `contexts/personal.yml` (comment update), potentially `package.json` or `.gitignore` (test exclusion if needed). Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. RISK-ACCEPT 1-M7 (benefit linkage MM1/MM2/MM3 overclaim) and 1-M8 (AC1 deliverable resolved to workspace/experiments/README.md) are acknowledged. No contract mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a operator running a comparison experiment" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1=T1–T3, AC2=T4–T6, AC3=T7–T8, AC4=T9 + NFR=T10 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | MM1, MM2, MM3 named (RISK-ACCEPT 1-M7 covers overclaim; story correctly enables those metrics) |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings — review report: spc.4-review-1.md |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 4 ACs covered, 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream: spc.1 (experiment_id directory naming). Declared schemaDepends: [] — dependency is on context.yml field name, not pipeline-state.json fields. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 3 constraints named (C11, MC-SEC-02, artefacts directory read-only); no Category E findings |
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
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | 1-M7, 1-M8 logged in decisions.md (2026-04-18) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss edge cases; agent may verify against wrong criteria | Operator acknowledged, RISK-ACCEPT logged — DoR-W4-spc.4 |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | No gaps in test plan |

---

## Standards Injection

No `domain:` field present in story. No standards injection required.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Define experiment workspace structure and manifest format — artefacts/2026-04-18-skill-performance-capture/stories/spc.4-experiment-workspace-structure.md
Test plan: artefacts/2026-04-18-skill-performance-capture/test-plans/spc.4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Primary deliverable: workspace/experiments/README.md (new directory + file) — per RISK-ACCEPT 1-M8
- Add a manifest.md template inline in the README or as a referenced template
  showing all required fields: experiment_id, scenario_description, runs[],
  comparison_notes; each run has model_label, cost_tier, run_date, artefact_paths[]
- Manifest template must include a comment stating that model_label and cost_tier
  are descriptive strings only — no API keys or tokens (MC-SEC-02)
- Do NOT place any output file in artefacts/ — experiment data belongs in workspace/ only
- Do NOT create any automated directory creation logic or scripts
- contexts/personal.yml change: additive comment addition only — reference workspace/experiments/[experiment-id]/
  as output path in the instrumentation block comment
- If workspace/experiments/ is already excluded from npm test by existing globs, no package.json
  change is needed — verify first, only add exclusion if current test run would scan it
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.
  Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
Note: Share the DoR artefact with the tech lead before assigning to the coding agent.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness required before assigning to coding agent
**Signed off by:** Not required (Medium oversight — awareness only)

# Definition of Ready: Governance check — validate capture block completeness

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.5-governance-check-capture-completeness.md
**Test plan reference:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.5-test-plan.md
**Verification script:** artefacts/2026-04-18-skill-performance-capture/verification-scripts/spc.5-verification.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-04-18

---

## Contract Proposal

**What will be built:**
A new Node.js script at `scripts/check-capture-completeness.js`. The script: reads `.github/context.yml` (or `.github/context.yml` absent → `contexts/personal.yml`) to check `instrumentation.enabled`; exits 0 with skip message if disabled; scans all Markdown artefact files in a supplied `--artefact-dir` path; for each file, checks for a `## Capture Block` section; validates presence of the six required metadata fields (`experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp`); reports missing blocks (by file path) and missing fields (by field name); exits 0 if completeness ≥ 80%, exits 1 if below. Script is NOT added to the `npm test` chain.

**What will NOT be built:**
- No CI integration of this script
- No content validation of fidelity_self_report or operator review sections
- No cross-run comparison logic

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — script exists, scans, reports, exits correctly | Run script against fixture directory with known complete/missing blocks; assert count output and exit codes (0 ≥80%, 1 <80%) | Unit (script execution with fixture) |
| AC2 — validates all 6 metadata fields | Run against fixture with incomplete block; assert missing field names reported in output | Unit (script execution with fixture) |
| AC3 — counts missing blocks with paths | Run against fixture with one file lacking capture block; assert file path in output | Unit (script execution with fixture) |
| AC4 — skip when disabled | Run with instrumentation.enabled: false config; assert exit 0 and skip message | Unit (script execution with mock config) |
| AC5 — not in npm test chain | Read package.json test script; assert check-capture-completeness not present | Unit (package.json inspection) |

**Assumptions:**
- Script uses Node.js built-ins only (fs, path, readline) — no external npm dependencies
- Script reads `.github/context.yml` if it exists, else falls back to `contexts/personal.yml` to find the instrumentation block
- Field names to validate are exactly those defined in spc.2's template: experiment_id, model_label, cost_tier, skill_name, artefact_path, run_timestamp
- "Phase output artefacts" are identified by searching for `## Capture Block` sections — the script does not maintain a separate allowlist of file types

**Estimated touch points:**
Files: `scripts/check-capture-completeness.js` (new file only). Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. No gaps; all ACs exercised by automated tests. No contract mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a operator running a comparison experiment" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1=T1–T2, AC2=T3–T4, AC3=T5–T6, AC4=T7–T8, AC5=T9 + NFR=T10 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | M1 — Capture block completeness rate |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings — review report: spc.5-review-1.md |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 5 ACs covered, 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream: spc.2 (field names), spc.1 (context.yml structure). Declared schemaDepends: [] — dependencies are on context.yml field names and capture block template fields, not pipeline-state.json fields. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 3 constraints named (Scripts pattern, MC-CORRECT-02, MC-SEC-02); no Category E findings |
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
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | spc.5 had 0 MEDIUM findings (1 LOW only) — W3 N/A |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss edge cases; agent may verify against wrong criteria | Operator acknowledged, RISK-ACCEPT logged — DoR-W4-spc.5 |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | No gaps in test plan |

---

## Standards Injection

No `domain:` field present in story. No standards injection required.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Governance check — validate capture block completeness — artefacts/2026-04-18-skill-performance-capture/stories/spc.5-governance-check-capture-completeness.md
Test plan: artefacts/2026-04-18-skill-performance-capture/test-plans/spc.5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New file only: scripts/check-capture-completeness.js
- Plain Node.js — no TypeScript, no transpilation, no external npm dependencies
  (Node.js built-ins only: fs, path, readline or similar)
- Field names to validate: experiment_id, model_label, cost_tier, skill_name,
  artefact_path, run_timestamp — exact match to spc.2 template field names
- Exit code 0 = completeness >= 80%; exit code 1 = below 80%
- Exit code 0 with skip message when instrumentation.enabled is false or absent
- Do NOT add this script to the npm test chain (package.json must remain unmodified
  for the test chain — AC5 failure condition)
- Script reads artefact Markdown files only (field presence). Must not read, log, or
  output any file contents beyond field presence/absence (MC-SEC-02)
- Complete in under 5 seconds for 5–15 files (performance NFR)
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

# Definition of Ready: Define capture block schema and Markdown template

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.2-capture-block-schema-template.md
**Test plan reference:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.2-test-plan.md
**Verification script:** artefacts/2026-04-18-skill-performance-capture/verification-scripts/spc.2-verification.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-04-18

---

## Contract Proposal

**What will be built:**
A new file at `.github/templates/capture-block.md` containing a Markdown template for the capture block. The template includes: a `## Capture Block` heading; a six-field metadata table (`experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp`); a structural metrics section with `turn_count`, `files_referenced` (list), `constraints_inferred_count` (integer), and `intermediates_prescribed`/`intermediates_produced` pair; a fidelity self-report section with a credential warning comment; a `backward_references` section (list with `target` and `accurate: yes/no` per entry); and an operator review section with `context_score` (1–5), `linkage_score` (1–5), `notes`, `reviewed_by` — all blank by default.

**What will NOT be built:**
- No automated parsing or diffing tooling
- No per-artefact-type template variations
- No version history tracking for the schema

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — temple has all required sections | Read .github/templates/capture-block.md, assert presence of all named sections and subsections | Unit (file inspection) |
| AC2 — exactly six metadata fields | Count metadata table rows, assert exactly 6 with correct field names | Unit (file inspection) |
| AC3 — list and numeric types declared | Assert files_referenced annotated as list, constraints_inferred_count annotated as integer; delta calculation viable | Unit (field type inspection) |
| AC4 — operator review section accepts blanks | Assert operator review fields have blank default values (not required markers) | Unit (template structure inspection) |
| AC5 — renders as valid Markdown | Parse file, assert no broken Markdown syntax (unfenced code blocks, bare HTML) | Unit (Markdown parse) |

**Assumptions:**
- Field names must exactly match names used by spc.5's governance check script
- The `fidelity_self_report` section is free-text with an explicit credential warning comment
- No special YAML front matter is needed in the template file

**Estimated touch points:**
Files: `.github/templates/capture-block.md` (new file only). Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. RISK-ACCEPT 1-M3 (benefit linkage M1 overclaim) and 1-M4 (AC3 runtime framing → static template inspection) are acknowledged. No contract mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform maintainer tuning skills" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1=T1–T4, AC2=T5–T6, AC3=T7–T9, AC4=T10–T11, AC5=T12 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | M1, MM1, MM2, MM3 named (RISK-ACCEPT 1-M3 covers overclaim) |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings — review report: spc.2-review-1.md |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 5 ACs covered, 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream: spc.1. Declared schemaDepends: [] — dependency is on context.yml field names, not pipeline-state.json fields. No schema fields to validate. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 3 constraints named (MC-SEC-02, Markdown only, C13); no Category E findings |
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
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | 1-M3, 1-M4 logged in decisions.md (2026-04-18) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss edge cases; agent may verify against wrong criteria | Operator acknowledged, RISK-ACCEPT logged — DoR-W4-spc.2 |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | No gaps in test plan |

---

## Standards Injection

No `domain:` field present in story. No standards injection required.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Define capture block schema and Markdown template — artefacts/2026-04-18-skill-performance-capture/stories/spc.2-capture-block-schema-template.md
Test plan: artefacts/2026-04-18-skill-performance-capture/test-plans/spc.2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- File to create: .github/templates/capture-block.md — one new file only
- The file must be plain Markdown only — no embedded HTML except HTML comments
- Unix line endings required (architecture-guardrails.md)
- Field names must exactly match those in spc.1's instrumentation schema:
  experiment_id, model_label, cost_tier, skill_name, artefact_path, run_timestamp
- The fidelity_self_report section must include a comment warning against session tokens,
  user identifiers, or API credentials (MC-SEC-02, story NFR)
- files_referenced must be declared as a list type; constraints_inferred_count as integer
- Operator review section fields must have blank default values (not required markers)
- Do not create any parsing, diffing, or analysis tooling
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

# DoR Contract: Define capture block schema and Markdown template

**Story:** spc.2-capture-block-schema-template
**Feature:** 2026-04-18-skill-performance-capture
**Approved:** 2026-04-18

---

## What will be built

A new file at `.github/templates/capture-block.md` containing the full Markdown capture block template with: six-field metadata table, structural metrics section (turn_count, files_referenced as list, constraints_inferred_count as integer, intermediates pair), fidelity self-report section with credential warning, backward_references section (target + accurate per entry), and operator review section (context_score, linkage_score, notes, reviewed_by — all blank by default).

## What will NOT be built

- No automated parsing or diffing tooling
- No per-artefact-type template variations
- No version history tracking for the schema

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read file, assert all required sections present | Unit (file inspection) |
| AC2 | Count metadata table rows, assert exactly 6 with correct names | Unit (file inspection) |
| AC3 | Assert files_referenced as list, constraints_inferred_count as integer | Unit (field type inspection) |
| AC4 | Assert operator review fields have blank defaults | Unit (template structure inspection) |
| AC5 | Parse file, assert valid Markdown | Unit (Markdown parse) |

## Assumptions

- Field names must exactly match spc.1's instrumentation schema fields
- fidelity_self_report is free-text with an explicit credential warning comment
- No YAML front matter needed in the template file

## schemaDepends

`schemaDepends: []` — upstream dependency is on context.yml field names (spc.1), not on pipeline-state.json fields.

## Estimated touch points

Files: `.github/templates/capture-block.md` (new file). Services: none. APIs: none.

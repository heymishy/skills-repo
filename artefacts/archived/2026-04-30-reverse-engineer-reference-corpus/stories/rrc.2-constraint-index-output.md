# Story rrc.2: Add Output 10 — Constraint index to `/reverse-engineer`

**Epic reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/epics/rrc-epic-1.md`
**Discovery reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/discovery.md`
**Benefit-metric reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/benefit-metric.md`

## User Story

As a **tech lead**,
I want `/reverse-engineer` to produce a `constraint-index.md` file in `artefacts/[system-slug]/reference/` at the end of any INITIAL or DEEPEN pass,
So that when I write a DoR artefact for a story touching this system, I can point the coding agent directly at the constraint index rather than requiring it to read the full reverse-engineering report.

## Benefit Linkage

**Metric moved:** MM2 — Constraint index coverage in story DoR artefacts
**How:** This story produces the `constraint-index.md` file that MM2 measures — without it, no DoR artefact can reference one and the metric target of 100% coverage is unreachable.

## Architecture Constraints

- SKILL.md-only change: no code, no scripts, no new npm dependencies.
- Output 10 must be added to the outputs table in `/reverse-engineer` SKILL.md.
- Format: one rule per line using pipe-delimited columns: `rule-id | source-file | confidence | disposition | one-sentence summary`. Coding agents can read this as a simple table without custom parsing.
- Checked against `.github/architecture-guardrails.md` — no additional constraints apply.

## Dependencies

- **Upstream:** `/reverse-engineer` v2 SKILL.md (commit `83f29c7`) — same base as rrc.1. rrc.2 can be implemented independently of rrc.1 (different output file, no shared format dependency).
- **Downstream:** rrc.3 (/discovery integration) may optionally surface constraint-index entries in the discovery artefact. rrc.4 (/reference-corpus-update) uses `corpus-state.md` rule IDs which must be consistent with the `rule-id` column in `constraint-index.md`.

## Acceptance Criteria

**AC1:** Given the updated `/reverse-engineer` SKILL.md, When an operator completes an INITIAL or DEEPEN pass, Then the skill instructs production of `artefacts/[system-slug]/reference/constraint-index.md` as Output 10 with the format: one header row (`rule-id | source-file | confidence | disposition | summary`) followed by one data row per PARITY REQUIRED and MIGRATION CANDIDATE rule in the corpus.

**AC2:** Given the constraint-index format, When a PARITY REQUIRED rule has a `[CHANGE-RISK]` flag in the corpus, Then the constraint-index row for that rule has `disposition: PARITY REQUIRED` and includes the CHANGE-RISK notation in the summary column.

**AC3:** Given the updated SKILL.md, When a VERIFY pass completes (corpus is re-checked after a delivery), Then the SKILL.md instructs the operator to update `constraint-index.md` to reflect any rules whose disposition changed from MIGRATION CANDIDATE to PARITY REQUIRED (or vice versa), or any rules that were retired.

**AC4:** Given the updated SKILL.md, When Q0 outcome is C (DEFER), Then Output 10 is not produced (same gate as Output 9 — no corpus means no useful constraint index).

**AC5:** Given the updated SKILL.md, When `check-skill-contracts.js` runs, Then it reports 40 skills and all contract markers intact.

## Out of Scope

- Automated injection of constraint-index entries into DoR artefacts — deferred (see discovery out of scope). The index is surfaced manually via a pointer in the DoR.
- JSON or YAML format for the constraint index — MVP uses plain markdown pipe table. Format may be evolved in a future story if parsing proves difficult.
- Rules with disposition other than PARITY REQUIRED or MIGRATION CANDIDATE (e.g. ENCAPSULATE COMPLEXITY, REVIEW) — these are lower-risk and excluded from the index at MVP.

## NFRs

- **Size:** SKILL.md additions for this story must not push total file size past 650 lines (budget shared with rrc.1 additions; combined budget for rrc.1 + rrc.2 is ~30 lines of new instruction).
- **Readability:** `constraint-index.md` must be human-readable in a standard markdown viewer as a simple table.
- **Security:** None — documentation/instruction change only.

## Complexity Rating

**Rating:** 1 — adding a second output instruction to the same SKILL.md as rrc.1; format is well-defined.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

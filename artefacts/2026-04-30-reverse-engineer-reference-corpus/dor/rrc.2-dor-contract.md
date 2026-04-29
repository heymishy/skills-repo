# DoR Contract: Add Output 10 — Constraint index to `/reverse-engineer`

**Story:** rrc.2
**Story artefact:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.2-constraint-index-output.md`
**Prepared by:** Copilot
**Date:** 2026-04-30

---

## What will be built

An Output 10 instruction block in `.github/skills/reverse-engineer/SKILL.md` comprising:

1. An entry in the skill's outputs table: **Output 10 — `constraint-index.md`** stored at `artefacts/[system-slug]/reference/constraint-index.md`.
2. Format: a pipe-delimited markdown table with header row `rule-id | source-file | confidence | disposition | summary` and one data row per PARITY REQUIRED and MIGRATION CANDIDATE rule.
3. Rule-id format: `L<layer>-<seq>` (e.g. `L1-001`) per DEC-001 — same as `corpus-state.md`.
4. CHANGE-RISK notation: when a PARITY REQUIRED rule carries a `[CHANGE-RISK]` flag, the summary column appends `[CHANGE-RISK]` verbatim.
5. A production instruction: produce Output 10 at the end of any INITIAL or DEEPEN pass.
6. A DEFER conditional: when Q0 outcome is DEFER, Output 10 is NOT produced.
7. A VERIFY-pass update instruction: update `constraint-index.md` after a VERIFY pass to reflect disposition changes or retired rules.

## What will NOT be built

- Automated injection of constraint-index entries into DoR artefacts — deferred.
- JSON or YAML format — MVP uses plain markdown pipe table only.
- Rules with disposition other than PARITY REQUIRED or MIGRATION CANDIDATE.
- Any executable code, scripts, or npm dependencies.
- Any changes to files other than `.github/skills/reverse-engineer/SKILL.md`.

## How each AC will be verified

| AC | Test approach | Type | Test ID |
|----|---------------|------|---------|
| AC1: Output 10 instruction with correct format (5 columns, header, data rows) | Assert SKILL.md contains "Output 10", "constraint-index.md", 5 column names, PARITY REQUIRED and MIGRATION CANDIDATE inclusion | Unit (file content) | T2.1–T2.7 |
| AC2: CHANGE-RISK notation in summary column | Assert SKILL.md references "[CHANGE-RISK]" in the context of constraint-index format | Unit (file content) | T2.8 |
| AC3: VERIFY-pass update instruction | Assert VERIFY section references updating constraint-index.md after disposition changes | Unit (file content) | T2.9 |
| AC4: DEFER does NOT trigger Output 10 | Assert DEFER block does not contain Output 10 production instruction | Unit (file content) | T2.10 |
| AC5: check-skill-contracts.js still reports 40 skills | Run governance check; assert 40 skills, exit 0 | Unit (governance) | T2.11 |
| DEC-001: rule-id format L\<layer\>-\<seq\> | Assert SKILL.md contains the `L\d+-\d{3}` pattern or explicit format description near constraint-index | Unit (file content) | T2.12 |
| NFR (combined ≤ 650 lines) | Assert SKILL.md line count ≤ 650 | Unit (line count) | T2.13 |

## Assumptions

- rrc.1 additions will leave headroom within the 650-line budget for rrc.2 additions (~15 lines).
- The DEFER outcome block is clearly delimited in the current SKILL.md (same assumption as rrc.1).
- The VERIFY pass section exists in the current SKILL.md (same assumption as rrc.1).
- `corpus-state.md` already uses `L<layer>-<seq>` rule-id format in `/reverse-engineer` v2 — rrc.2 adopts the same format, does not invent a new one.

## Estimated touch points

**Files:** `.github/skills/reverse-engineer/SKILL.md` (only)
**Services:** None
**APIs:** None
**Test script (read-only after implementation):** `tests/check-rrc2-constraint-index.js`

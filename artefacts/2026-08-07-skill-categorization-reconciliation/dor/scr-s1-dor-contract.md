# Contract Proposal: Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap

**Story reference:** artefacts/2026-08-07-skill-categorization-reconciliation/stories/scr-s1-unify-skill-categorization-and-fix-nfr.md
**Date:** 2026-08-07

## What will be built

`.github/scripts/check-assembly.js` requires `cli/lib/skills-registry.js` and derives `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` by filtering `SKILL_CATEGORIES` by category, replacing the hardcoded array literals. `scripts/assemble-copilot-instructions.sh`'s `--with-outer-loop` "enabled" branch (around the existing `get_skill_triggers` calls at what is currently lines ~298–306) is refactored to call `get_skill_triggers` once per skill, storing the result in a variable reused for both the presence check and the formatted output.

## What will NOT be built

- Any change to the "Core Platform Layer" loop's own separate description-extraction calls.
- Any change to which skills are classified outer-loop vs. inner-loop.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Source-level check that check-assembly.js derives from SKILL_CATEGORIES | Unit |
| AC2 | Synthetic new SKILL_CATEGORIES entry, assert automatic pickup | Unit |
| AC3 | Source-level check / call-counter for get_skill_triggers | Unit |
| AC4 | Real wall-clock timing re-measurement | NFR/manual |

## Assumptions

- `check-assembly.js`'s existing `OUTER_LOOP_AC3` constant (a distinct 6-skill subset used for a different check, per the file's own comment "outer-loop and decisions... but the test plan specifies these 6 for AC3") is unrelated to this story's scope and is left untouched — only `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` themselves are reconciled.

## Estimated touch points

- **Files:** `.github/scripts/check-assembly.js`, `scripts/assemble-copilot-instructions.sh`
- **Services:** none new
- **APIs:** none new — build-time/CI-time scripts only

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

Dependencies block states "None" — no upstream story dependency.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.

# Implementation Plan: Symmetric "As designed:" / "As-built:" diagram title prefixes (aldl-s1)

**Story:** artefacts/2026-09-12-as-designed-label-symmetry/stories/aldl-s1-symmetric-as-designed-as-built-labels.md
**Test plan:** artefacts/2026-09-12-as-designed-label-symmetry/test-plans/aldl-s1-test-plan.md
**DoR:** artefacts/2026-09-12-as-designed-label-symmetry/dor/aldl-s1-dor.md

---

## Task 1: Add "As designed: " prefix to all 3 as-designed marker instructions (AC1, AC2, AC3, AC4)

**Files:** `skills/design/SKILL.md`, `skills/definition/SKILL.md`

- System Architecture marker (design/SKILL.md): field docs + worked example.
- Data Model marker (design/SKILL.md, csd-s4): field docs.
- Program Design marker (definition/SKILL.md): field docs + worked example.
- Found during preparation: Program Design (in `skills/definition/SKILL.md`) is a real 3rd location with the identical gap, not hypothetical — included in scope from the start (story's AC3 already reflects this).

**Status:** committed

---

## Task 2: Regression test file (AC1, AC2, AC3, AC4)

**Files:** `tests/check-aldl-s1-as-designed-label-symmetry.js` (new)

- U1/U2: System Architecture field docs + worked example carry the prefix.
- U3: Data Model field docs carry the prefix.
- U4/U5: Program Design field docs + worked example carry the prefix.

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.

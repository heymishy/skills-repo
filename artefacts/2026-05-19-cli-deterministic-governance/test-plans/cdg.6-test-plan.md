# Test Plan: cdg.6 — `skills advance` enhancements

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.6.md
**Test file:** `tests/check-cdg6-advance-enhancements.js`
**Created:** 2026-05-24

---

## Tests

### T1 — AC1: Epic-nested story is found and updated in place
**Type:** Unit
**Given:** A minimal pipeline-state fixture where the target story exists only in `feature.epics[0].stories[0]` (not in `feature.stories[]`).
**When:** `advance(featureSlug, storyId, ['stage=definition-of-done'], repoRoot)` is called.
**Then:**
- Exit code is 0
- The epic-nested story object has `stage: 'definition-of-done'`
- `feature.stories` is empty (no phantom flat entry created)

### T2 — AC1: Epic-nested story update does not create phantom flat entry (round-trip disk check)
**Type:** Integration (real temp fixture written to disk)
**Given:** A temp fixture with the story in `epics[0].stories[0]`.
**When:** `advance` is called with one field pair.
**Then:**
- Re-read the written file; the story is found only in `epics[0].stories[0]`
- `feature.stories` array is empty or absent

### T3 — AC2: Flat story lookup unchanged (non-regression)
**Type:** Unit
**Given:** A fixture where the target story is in `feature.stories[]` (no epics).
**When:** `advance` is called.
**Then:** Exit code 0; the flat story has the updated field.

### T4 — AC3: Story not found in flat or epic-nested → creates flat entry
**Type:** Unit
**Given:** A fixture where the story ID does not appear in `feature.stories[]` or any `feature.epics[].stories[]`.
**When:** `advance` is called.
**Then:** Exit code 0; a new entry `{ id: storyId, <field>: <value> }` appears in `feature.stories[]`.

### T5 — AC4: Dot-notation creates nested object when parent is absent
**Type:** Unit
**Given:** A story with no `testPlan` field.
**When:** `advance` is called with `testPlan.status=all-passing`.
**Then:** `story.testPlan` is `{ status: 'all-passing' }` (not a flat `"testPlan.status"` key).

### T6 — AC4: Dot-notation merges with existing nested object (does not replace)
**Type:** Unit
**Given:** A story where `testPlan` already exists as `{ artefact: 'foo.md' }`.
**When:** `advance` is called with `testPlan.status=all-passing`.
**Then:** `story.testPlan` is `{ artefact: 'foo.md', status: 'all-passing' }` — the existing `artefact` key is preserved.

### T7 — AC4: Deep dot-notation (2+ dots) is rejected with exit 8
**Type:** Unit
**Given:** A field argument `a.b.c=value`.
**When:** `advance` is called.
**Then:** Exit code 8; stderr contains the field name.

### T8 — AC5: Integer-valued strings are coerced to number type
**Type:** Unit
**Given:** Field arguments `acVerified=8 passing=23 totalTests=23`.
**When:** `advance` is called and the result is serialised to JSON.
**Then:** The parsed JSON contains `acVerified: 8` (number), `passing: 23` (number), `totalTests: 23` (number) — not strings.

### T9 — AC5: Non-integer string values remain strings (boundary)
**Type:** Unit
**Given:** Field arguments `stage=definition-of-done updatedAt=2026-05-24`.
**When:** `advance` is called.
**Then:** Both fields are written as strings, not coerced.

### T10 — AC6: `__proto__` as field name is rejected with exit 8
**Type:** Unit
**Given:** A field argument `__proto__=malicious`.
**When:** `advance` is called.
**Then:** Exit code 8; stderr names `__proto__`; pipeline-state.json is not modified.

### T11 — AC6: `constructor` as dot-notation parent is rejected with exit 8
**Type:** Unit
**Given:** A field argument `constructor.polluted=true`.
**When:** `advance` is called.
**Then:** Exit code 8; stderr names `constructor`; pipeline-state.json is not modified.

### T12 — Non-regression: enum validation still works
**Type:** Unit
**Given:** A field argument `prStatus=invalid-value`.
**When:** `advance` is called.
**Then:** Exit code 8; stderr names the invalid value and lists allowed values.

### T13 — Governance: npm test chain includes cdg.6 test file
**Type:** Governance
**Given:** `package.json` on the implementation branch.
**When:** The `test` script is read.
**Then:** It contains `node tests/check-cdg6-advance-enhancements.js`.

---

## AC coverage matrix

| AC | Test(s) |
|----|---------|
| AC1 — Epic-nested found + updated in place | T1, T2 |
| AC2 — Flat story unchanged | T3 |
| AC3 — Not found → creates flat entry | T4 |
| AC4 — Dot-notation single-level write | T5, T6, T7 |
| AC5 — Integer coercion | T8, T9 |
| AC6 — Prototype pollution guard | T10, T11 |
| AC7 — copilot-instructions.md rule | Verified manually at /verify-completion; T13 covers governance |

---

## Human verification script (AC7)

After implementation is merged, run:
```
Select-String -Pattern "skills advance" .github/copilot-instructions.md
```
Expected: at least one match in the Coding Standards section.

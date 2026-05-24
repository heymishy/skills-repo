# DoR Contract: cdg.6 — `skills advance` enhancements

**Story:** cdg.6
**Feature:** 2026-05-19-cli-deterministic-governance
**Contract date:** 2026-05-24

---

## Required touchpoints

| File | Action | Constraint |
|------|--------|-----------|
| `src/enforcement/cli-advance.js` | MODIFY | Epic-nested lookup, dot-notation, integer coercion, proto guard only. Do not change function signature. Do not change exit codes for existing cases. |
| `tests/check-cdg6-advance-enhancements.js` | CREATE | 13 tests T1–T13. Must not modify existing test files. |
| `.github/copilot-instructions.md` | MODIFY | Add rule to Coding Standards section only. Do not alter any other section. |
| `package.json` | MODIFY | Append `&& node tests/check-cdg6-advance-enhancements.js` to test script only. |
| `.github/pipeline-state.json` | MODIFY | cdg.6 story fields only. No other story or feature may be modified. |

## Explicitly out-of-scope files (MUST NOT touch)

- `bin/skills`
- `src/enforcement/cli-validate.js`
- `src/enforcement/pipeline-state-writer.js`
- `.github/pipeline-state.schema.json`
- Any file under `artefacts/` (except the artefacts for this story already committed)
- Any file under `.github/workflows/`
- `workspace/state.json`
- Any existing test file (`tests/check-cdg*.js` other than the new `check-cdg6-*.js`)

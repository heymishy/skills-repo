# DoR Contract: cdg.7 — Gated advance and web UI adapter wiring

**Story:** cdg.7
**Feature:** 2026-05-19-cli-deterministic-governance
**Contract date:** 2026-05-24

---

## Required touchpoints

| File | Action | Constraint |
|------|--------|-----------|
| `src/enforcement/gate-map.js` | CREATE | New file. Exports a frozen object with exactly 7 gated stage keys. Do not add runtime routing logic — this is a data registry only. |
| `src/enforcement/cli-gate-advance.js` | CREATE | New file. Exports `gateAdvance()`. No `process.exit()`. Returns `{ exitCode, stdout, stderr }`. Must call `validate()` from `cli-outer-loop.js` and `advance()` from `cli-advance.js` — no reimplementation of either. |
| `bin/skills` | MODIFY | Add `gate-advance` subcommand block only. Do not modify existing `validate` or `advance` blocks. Pattern must be identical to the existing `advance` block. |
| `src/web-ui/adapters/pipeline-state-writer.js` | MODIFY | Replace the `if (storyId)` story-level write block with a call to `advance()`. Preserve the feature-level write block, factory signature, and `validateStateUpdate` call (or remove it only if advance() subsumes all its checks). Do not change the module's exported interface. |
| `tests/check-cdg7-gate-advance.js` | CREATE | 14 tests T1–T14. Must not modify any existing test file. |
| `.github/copilot-instructions.md` | MODIFY | Add gate-advance mandate to Coding Standards section only. Do not alter any other section. |
| `package.json` | MODIFY | Append `&& node tests/check-cdg7-gate-advance.js` to test script only. |
| `.github/pipeline-state.json` | MODIFY | cdg.7 story fields only. No other story or feature may be modified. |

## Explicitly out-of-scope files (MUST NOT touch)

- `src/enforcement/cli-advance.js`
- `src/enforcement/cli-outer-loop.js`
- `.github/pipeline-state.schema.json`
- Any file under `artefacts/` (except pipeline-state.json entries for this story)
- Any file under `.github/workflows/`
- `workspace/state.json`
- Any existing test file other than the new `check-cdg7-gate-advance.js`
- `src/web-ui/server.js` or any other web UI file except `pipeline-state-writer.js`

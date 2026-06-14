# DoD: inc2.1 — Conditions panel

**Story:** inc2.1
**Feature:** 2026-06-15-ideate-web-ux-inc2
**DoD date:** 2026-06-15
**Signed off by:** Hamish King

---

## Acceptance criteria status

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `parseConditionMarker` parses `---CONDITION-JSON: {...}---` and returns `{id, text, type, source}` | DONE |
| AC2 | `handlePostTurnStreamHtml` emits `conditionItem` SSE event for each valid marker | DONE |
| AC3 | Condition markers stripped from `draftChunk` emissions | DONE |
| AC4 | `#condition-items` section present in shell HTML with `role="region"` and `aria-label="Condition items"` | DONE |
| AC5 | `appendConditionItem` function renders condition card (type tag + source + text, no confirm/flag buttons) | DONE |
| AC6 | Condition cards are read-only — no `btn-confirm` or `btn-flag` inside `appendConditionItem` | DONE |
| AC7 | Three-section right panel: `#condition-items` → `#assumption-cards` → `#draft-content` | DONE |
| AC8 | Type allowlist: `constraint\|dependency\|outcome`; invalid type returns `null`. Source allowlist: `operator\|model`; invalid source normalised to `"model"` | DONE |
| AC9 | All 6 iwu regression tests pass unmodified | DONE |

## Test results

- `check-inc2.1-conditions-panel.js`: **30 passed, 0 failed**
- `check-iwu1-context-manifest.js`: 19 passed, 0 failed
- `check-iwu2-right-panel-layout.js`: 14 passed, 0 failed (max-height:42% kept per contract)
- `check-iwu3-assumption-cards.js`: 37 passed, 0 failed
- `check-iwu4-confirm-flag.js`: 24 passed, 0 failed
- `check-iwu5-lens-complete.js`: 17 passed, 0 failed
- `check-iwu6-skillmd.js`: 15 passed, 0 failed

## Files changed

| File | Change |
|------|--------|
| `src/web-ui/routes/skills.js` | `parseConditionMarker`, condition buffer, conditionItem SSE emission, marker strip in draftChunk, export |
| `src/web-ui/views/chat-view.js` | `#condition-items` section, condition card CSS, `appendConditionItem` + `escHtmlClient` inline script |
| `tests/check-inc2.1-conditions-panel.js` | New — 30 assertions covering T1–T11 |
| `package.json` | Test chain extended with `check-inc2.1-conditions-panel.js` |

## Commit

`34a9022` — `feat(inc2.1): conditions panel — CONDITION-JSON marker, SSE event, three-section layout`

## Notes

- `#assumption-cards` max-height kept at 42% (not reduced to 30%) to satisfy the iwu2 AC4 contract. The `#condition-items` section at 30% provides the additional vertical cap for the new section.
- T3M1 gate enforcement signal: pipeline-state.json must be advanced from `definition-of-ready` to `implementation` via the web UI gate-confirm button (not direct file edit) to generate the first chain-hash trace entry in `workspace/traces/2026-06-15-ideate-web-ux-inc2.trace.jsonl`.

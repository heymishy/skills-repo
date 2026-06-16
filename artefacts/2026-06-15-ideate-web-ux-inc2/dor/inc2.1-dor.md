# Definition of Ready: inc2.1 — Conditions panel

**Story:** inc2.1
**Feature:** 2026-06-15-ideate-web-ux-inc2
**DoR completed:** 2026-06-15
**Signed off by:** Hamish King — Platform operator / tech lead
**Oversight level:** Low (Coding Agent may proceed autonomously within constraints)

---

## H1 — User story format ✅

"As a platform operator running an /ideate session, I want conditions (constraints, dependencies, and outcome conditions) to appear as cards in the right panel as the model emits them, so that I can capture definite constraints during the session without re-reading the transcript."

Named persona ✅ | Want ✅ | So that ✅

---

## H2 — ≥3 Acceptance Criteria ✅

9 ACs defined. All in observable-behaviour form. See `artefacts/2026-06-15-ideate-web-ux-inc2/stories/inc2.1.md`.

---

## H3 — Every AC has ≥1 test ✅

| AC | Test(s) |
|----|---------|
| AC1 | T1, T2, T3 |
| AC2 | T4 |
| AC3 | T5 |
| AC4 | T6 |
| AC5 | T7 |
| AC6 | T8 |
| AC7 | T9 |
| AC8 | T10, T11 |
| AC9 | npm test regression suite (not in check-inc2.1-conditions-panel.js — verified by pre-commit hook) |

---

## H4 — Out of scope populated ✅

See story out-of-scope section: confirm/flag on conditions, condition export, deduplication, panel resize, SKILL.md changes (inc2.2), POST endpoint for conditions.

---

## H5 — Benefit linkage ✅

M1 (condition render pipeline reliability) and MM1 (T3M1 gate enforcement signal) per benefit-metric.md.

---

## H6 — Complexity rated ✅

Complexity 2. Direct analogue of iwu.3 (assumption cards). Same parser pattern, same SSE pattern, new panel section. Established code path.

---

## H7 — No unresolved HIGH review findings ✅

Review run 1: PASS. 0 HIGH. 1 LOW (1-L1 — AC9 phrasing clarification, does not require story modification). Ready to proceed.

---

## H8 — No uncovered ACs ✅

All 9 ACs covered per H3 table.

---

## H9 — Architecture constraints populated ✅

- Modify ONLY: `src/web-ui/routes/skills.js`, `src/web-ui/views/chat-view.js`
- New test file: `tests/check-inc2.1-conditions-panel.js`
- Extend package.json test chain: `&& node tests/check-inc2.1-conditions-panel.js`
- `parseConditionMarker(text)` alongside `parseAssumptionMarker` in `skills.js`
- `session.conditionItems` plain object keyed by `id`, same pattern as `session.assumptionCards`
- Type allowlist: `constraint | dependency | outcome` (server-side guard in skills.js)
- Source allowlist: `operator | model` — defaults to `"model"` if absent or invalid
- HTML escaping: `escHtml()` on type, source, and text before any DOM injection
- Regression: all 62 iwu tests must pass unmodified

---

## Security Constraints (MC-SEC-02)

- All condition card fields (type, source, text) HTML-escaped via `escHtml()` before inline HTML or DOM injection
- Type and source validated against allowlists server-side; out-of-allowlist values skipped or defaulted

---

## Coding Agent Instructions

```
Proceed: Yes
Modify ONLY:
  - src/web-ui/routes/skills.js  (add parseConditionMarker, SSE emission, session storage, marker stripping)
  - src/web-ui/views/chat-view.js (add #condition-items panel section, CSS, client-side conditionItem handler)
New files:
  - tests/check-inc2.1-conditions-panel.js  (11 tests T1–T11)
Append to package.json test chain: && node tests/check-inc2.1-conditions-panel.js

Implementation notes:
  1. parseConditionMarker(text): regex /---CONDITION-JSON:\s*(\{[\s\S]*?\})\s*---/
     - Parse JSON; validate type in ['constraint','dependency','outcome']
     - Normalise source: if not in ['operator','model'], set to 'model'
     - Return null on any parse failure (do not throw)
  2. In the streaming handler (same block that handles ASSUMPTION-JSON):
     - Detect ---CONDITION-JSON--- markers in incoming chunks
     - Strip marker text from the draft chunk (do not send to draftChunk SSE event)
     - Emit data: {"conditionItem": {...}}\n\n
     - Store parsed condition in session.conditionItems[id]
  3. In chat-view.js shell HTML:
     - Right panel order: #condition-items → #assumption-cards → #draft-content
     - #condition-items: role="region" aria-label="Condition items" style="flex:0 0 auto; max-height:30%; overflow-y:auto; ..."
     - #assumption-cards: same as current but max-height:30% (was 42% — adjust)
     - #draft-content: flex:1 1 auto (unchanged)
     - Client-side appendConditionCard(item): builds card HTML with type badge, source label, text — all via textContent or escHtml equivalent
     - SSE handler: if (evt.conditionItem) { appendConditionCard(evt.conditionItem); }
  4. Condition card: display-only (no buttons), CSS class "condition-card"
     - Type badge: class "condition-card-type" — text content = item.type
     - Source: class "condition-card-source" — text content = item.source
     - Text: class "condition-card-text" — text content = item.text

Gate-confirm for this story: use the web UI journey gate-confirm button (not direct pipeline-state.json edit) to advance from definition-of-ready → definition-of-done. This will write the first chain-hash trace entry for T3M1.
```

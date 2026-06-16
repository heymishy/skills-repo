# Story: inc2.1 — Conditions panel: parse `---CONDITION-JSON---` markers and render condition cards in the /ideate session shell

**Feature:** 2026-06-15-ideate-web-ux-inc2
**Epic:** Cluster 6 — Conditions sidebar
**Story ID:** inc2.1
**Complexity:** 2
**Health:** green

---

## User Story

As a **platform operator** running an /ideate session,  
I want **conditions (constraints, dependencies, and outcome conditions) to appear as cards in the right panel as the model emits them**,  
so that **I can capture definite constraints during the session without re-reading the transcript**.

---

## Acceptance Criteria

**AC1 — Marker parsing:** When the model stream contains `---CONDITION-JSON: {"id":"...","text":"...","type":"constraint|dependency|outcome","source":"operator|model"}---`, `skills.js` parses the marker and stores the parsed condition in `session.conditionItems[id]`.

**AC2 — SSE emission:** After parsing a valid `---CONDITION-JSON---` marker, `skills.js` emits a `conditionItem` SSE event (`data: {"conditionItem": {...}}\n\n`) before writing the next chunk.

**AC3 — Marker stripping:** The `---CONDITION-JSON---` marker text is stripped from the content emitted to `#draft-content`. It does not appear in the visible artefact draft.

**AC4 — Panel section present:** The rendered /ideate session shell contains a `#condition-items` element with `role="region"` and `aria-label="Condition items"`.

**AC5 — Condition card rendered:** When the browser receives a `conditionItem` SSE event, a condition card is appended to `#condition-items`. The card displays: type badge (text: "constraint", "dependency", or "outcome"), source indicator (text: "operator" or "model"), and condition text.

**AC6 — Read-only cards:** Condition cards have no confirm/flag buttons. The card is a display-only element.

**AC7 — Three-section right panel layout:** The right panel renders three stacked sections in order: `#condition-items` (`max-height:30%; overflow-y:auto`), `#assumption-cards` (`max-height:30%; overflow-y:auto`), `#draft-content` (`flex:1 1 auto; overflow-y:auto`).

**AC8 — Type validation:** If `type` is not one of `constraint | dependency | outcome`, the marker is silently skipped (not stored, not emitted). If `source` is not one of `operator | model`, it defaults to `"model"` without error.

**AC9 — Regression:** All 62 existing iwu test assertions (check-iwu1.js through check-iwu6.js, 62 total) pass unmodified.

---

## Benefit Linkage

- **M1** (condition render pipeline reliability): AC2 + AC5 directly produce the measurement signal.
- **MM1** (T3M1 gate enforcement signal): inc2.1 gate-confirm via web UI produces the first chain-hash trace entry. See discovery T3M1 note.

---

## Out of Scope

- Confirm/flag interaction on condition cards (Increment 3 candidate)
- Condition export / copy-to-clipboard
- Condition deduplication
- Panel section resize controls
- Any changes to `ideate/SKILL.md` (inc2.2)
- Any changes to the assumption cards or lensComplete logic
- `session.conditionItems` POST endpoint from external clients

---

## Architecture Constraints

- **Parser location:** `parseConditionMarker(text)` added alongside `parseAssumptionMarker` in `skills.js` — same module, same pattern.
- **Session store field:** `session.conditionItems` is a plain object (`{}`) keyed by condition `id`, same structure as `session.assumptionCards`. Initialised on first condition.
- **SSE event name:** `conditionItem` (camelCase, consistent with `assumptionCard`, `lensComplete`).
- **HTML escaping:** `type`, `source`, and `text` fields must go through `escHtml()` before any DOM injection or inline HTML string rendering.
- **Type allowlist guard:** Applied server-side in `skills.js` before storing and emitting. Values outside the allowlist are skipped.
- **Modify ONLY:** `src/web-ui/routes/skills.js` (marker parser + SSE emission + session storage), `src/web-ui/views/chat-view.js` (panel section markup + CSS + client-side conditionItem handler)
- **New test file:** `tests/check-inc2.1-conditions-panel.js`
- **Extend package.json test chain:** append `&& node tests/check-inc2.1-conditions-panel.js`

---

## Non-Functional Requirements

| NFR | Target |
|-----|--------|
| Card append latency | ≤500ms from SSE dispatch to card visible in DOM |
| HTML escaping | type, source, text escaped before injection (OWASP A03) |
| Regression | 62 iwu tests pass (no modification) |
| Accessibility | #condition-items reachable by Tab; type conveyed by text not colour only (WCAG SC 1.4.1, SC 2.1.1) |

---

## Scope Stability

Stable. Conditions panel is a direct analogue of the assumption cards panel (same SSE pattern, new marker type). No open design questions beyond the type allowlist values — finalised as constraint / dependency / outcome.

# Test Plan: inc2.1 — Conditions panel

**Story:** inc2.1
**Feature:** 2026-06-15-ideate-web-ux-inc2
**Test file:** `tests/check-inc2.1-conditions-panel.js`
**Date:** 2026-06-15

---

## AC Coverage

| AC | Tests | Coverage |
|----|-------|---------|
| AC1 — Marker parsing + session storage | T1, T2, T3 | ✅ Full |
| AC2 — conditionItem SSE emission | T4 | ✅ Full |
| AC3 — Marker stripped from draft | T5 | ✅ Full |
| AC4 — #condition-items panel section present | T6 | ✅ Full |
| AC5 — Condition card rendered from SSE event | T7 | ✅ Full |
| AC6 — Read-only (no confirm/flag buttons) | T8 | ✅ Full |
| AC7 — Three-section right panel layout | T9 | ✅ Full |
| AC8 — Type validation (invalid type skipped; invalid source defaults) | T10, T11 | ✅ Full |
| AC9 — Regression (62 iwu tests) | Separate suite run | ✅ Noted |

---

## Test Specifications

**T1 — parseConditionMarker: valid marker parsed correctly**
- Input: `---CONDITION-JSON: {"id":"no-new-deps","text":"No new npm dependencies may be introduced.","type":"constraint","source":"model"}---`
- Assert: returns object with `id:"no-new-deps"`, `text:"No new npm dependencies..."`, `type:"constraint"`, `source:"model"`

**T2 — parseConditionMarker: invalid JSON returns null**
- Input: `---CONDITION-JSON: {not valid json}---`
- Assert: returns `null`; no throw

**T3 — parseConditionMarker: marker absent returns null**
- Input: plain prose with no `---CONDITION-JSON---`
- Assert: returns `null`

**T4 — conditionItem SSE event emitted when marker found in stream**
- Setup: inject mock session with `conditionCardsEnabled:true`; stream a chunk containing a valid `---CONDITION-JSON---` marker through the streaming handler
- Assert: SSE response includes `data: {"conditionItem":{...}}\n\n`; `session.conditionItems["no-new-deps"]` populated

**T5 — Marker stripped from draft content**
- Setup: stream chunk containing both prose and a `---CONDITION-JSON---` marker
- Assert: the `data: {"draftChunk":"..."}` event does NOT contain `---CONDITION-JSON---`; the prose is present

**T6 — #condition-items section present in shell HTML**
- Setup: `freshRequire` skills.js; call `handleGetChatHtml` for an ideate session
- Assert: rendered HTML contains `id="condition-items"`, `role="region"`, `aria-label="Condition items"`

**T7 — Condition card rendered in browser from conditionItem event**
- Setup: extract the client-side `appendConditionCard` function from the inline script in the shell HTML; call it with a valid conditionItem payload
- Assert: resulting HTML string contains type badge text (e.g. "constraint"), source text (e.g. "model"), and condition text

**T8 — Condition cards are read-only (no confirm/flag buttons)**
- Setup: same as T7
- Assert: rendered card HTML does NOT contain `<button` or `form`

**T9 — Three-section right panel layout**
- Setup: extract shell HTML from `handleGetChatHtml`
- Assert: `#condition-items` appears before `#assumption-cards` which appears before `#draft-content` in document order; `#condition-items` style contains `max-height`; `#assumption-cards` style contains `max-height`

**T10 — Invalid type is skipped (not stored, not emitted)**
- Input: marker with `"type":"unknown-type"`
- Assert: `session.conditionItems` remains empty; no `conditionItem` SSE event emitted

**T11 — Invalid source defaults to "model"**
- Input: marker with `"source":"agent"` (not in allowlist)
- Assert: `session.conditionItems[id].source === "model"`; conditionItem SSE event emitted with `source:"model"`

---

## Test Data

All test data is inline synthetic strings. No file I/O required. Session mocks injected via `setListHtmlSessions` / `setGetHtmlSession` adapter pattern consistent with existing iwu tests.

---

## Regression Baseline

| Suite | Tests | Must pass |
|-------|-------|-----------|
| check-iwu1-context-manifest.js | 11 | ✅ unmodified |
| check-iwu2-right-panel-layout.js | 8 | ✅ unmodified |
| check-iwu3-assumption-cards.js | 14 | ✅ unmodified |
| check-iwu4-confirm-flag.js | 13 | ✅ unmodified |
| check-iwu5-lens-complete.js | 14 | ✅ unmodified |
| check-iwu6-skillmd.js | 2 | ✅ unmodified |
| **Total** | **62** | |

These tests pass as part of `npm test` — no modification to the test files is permitted.

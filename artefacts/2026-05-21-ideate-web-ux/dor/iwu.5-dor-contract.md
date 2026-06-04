# DoR Scope Contract: iwu.5 — Display review-nudge bar on lens completion

**Story:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.5.md
**DoR:** artefacts/2026-05-21-ideate-web-ux/dor/iwu.5-dor.md
**Date:** 2026-06-04

---

## Required file touchpoints

### Files to READ before implementing (mandatory context)

| File | Reason |
|------|--------|
| `src/web-ui/routes/skills.js` | Extend `handlePostTurnStreamHtml` to emit lensComplete SSE event; read SSE event loop pattern in full |
| `src/web-ui/views/chat-view.js` | Add #nudge-bar HTML and client-side lensComplete listener; understand existing card HTML and chat input selector |
| `.github/architecture-guardrails.md` | Mandatory pre-implementation read |
| `artefacts/2026-05-21-ideate-web-ux/stories/iwu.5.md` | ACs including focus guard specification and auto-dismiss condition |
| `artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.5-test-plan.md` | Test specification |

### Files to CREATE

| File | Contents |
|------|----------|
| `tests/check-iwu5-lens-complete.js` | Governance test — all 14 unit/integration tests from the test plan |

### Files to MODIFY

| File | Change |
|------|--------|
| `src/web-ui/routes/skills.js` | Add lensComplete SSE event emission at end of lens processing in `handlePostTurnStreamHtml`. Event format: `event: sseMessage\ndata: {"type":"lensComplete"}\n\n` (or equivalent to existing SSE format) |
| `src/web-ui/views/chat-view.js` | Add `#nudge-bar` div (role=alert, initially hidden) with unconfirmed count text and "Review now" button. Add client-side lensComplete handler: show/hide nudge bar based on unconfirmed count. Add focus guard in "Review now" click handler. Add auto-dismiss listener for card confirm state changes. |
| `package.json` | Add `node tests/check-iwu5-lens-complete.js` to the `test` script chain |

### Files that MUST NOT be touched

| File | Reason |
|------|--------|
| `.github/skills/ideate/SKILL.md` | Governed file — iwu.6 scope only |
| `src/web-ui/server.js` | No new routes required for this story |
| The confirm/flag endpoint handler | iwu.4 scope — do not modify |
| `session.assumptionCardsEnabled` default value | iwu.6 scope |
| Any file under `artefacts/` | Read-only pipeline artefacts |

---

## SSE event specification

**Event type name:** `lensComplete` (new named type — not aliased to any existing event)
**Event payload:** `{ "type": "lensComplete" }` (no additional fields in this story)
**Trigger condition:** emitted once per lens completion — after the last SSE token chunk of a lens is sent

---

## Client-side nudge bar specification

| Element | Attribute / Behaviour |
|---------|----------------------|
| `#nudge-bar` | `role="alert"`, initially `display:none`; shown when ≥1 unconfirmed card exists at lensComplete |
| Nudge text | "N assumption card(s) unreviewed. Review now." where N = count of cards with status !== 'confirmed' |
| "Review now" button | `scrollIntoView` + focus on first unconfirmed card; focus guard: skip focus if `document.activeElement === chatInput` |
| Auto-dismiss | Watch for last unconfirmed card being confirmed; hide nudge bar when count reaches 0 |

---

## Cross-story schema dependencies

| Dependency | Story | Type | Notes |
|------------|-------|------|-------|
| lensComplete real trigger from SKILL.md | iwu.6 | SSE emission | Unit tests use synthetic events; real trigger requires iwu.6 merged |
| #assumption-cards and card DOM | iwu.2, iwu.3 | DOM | Unit tests mock; E2E requires both merged |
| card status tracking (confirmed/flagged) | iwu.4 | State | Nudge bar auto-dismiss reads card status set by iwu.4 |

---

## AC verification summary

| AC | Automated | Manual | Gap |
|----|-----------|--------|-----|
| AC1 | ✅ 2 unit (lensComplete received; nudge bar shown with correct count) | — | — |
| AC2 | ✅ 2 unit (0 unconfirmed: nudge bar hidden; N > 0: shown) | — | — |
| AC3 | ✅ 2 unit (focus guard: no focus steal when chat input focused; scrollIntoView when not focused) | — | — |
| AC4 | ✅ 2 unit (auto-dismiss when last card confirmed) | — | — |
| AC5 | ✅ 2 unit (lensComplete is new named type; not alias of existing SSE type) | — | — |
| AC6 | ✅ 2 unit (multiple lensComplete events; nudge bar re-evaluates count each time) | — | — |
| NFR-A11Y | ✅ 1 integration (role=alert axe-core; nudge bar keyboard reachable) | ✅ Manual | AT live region announcement — acknowledged |

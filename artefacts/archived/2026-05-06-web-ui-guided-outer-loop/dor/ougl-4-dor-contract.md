# DoR Contract — ougl.4: Journey-aware chat page "Save and continue" button

**Story:** ougl.4
**DoR reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/dor/ougl-4-dor.md
**Date:** 2026-05-14

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/skills.js` | Modify | `handleGetChatHtml` / `_renderChatPage` render path — inject gate-confirm form when `session.journeyId != null && session.done === true`. No other changes. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields. Upstream ougl.2 is a code dependency only.

## Out of Scope (MUST NOT touch)

- `src/web-ui/routes/journey.js` — gate-confirm handler is ougl.5, not this story
- `src/web-ui/server.js`
- Any CSS, layout, or styling files
- Any test files
- Any artefact files under `artefacts/`
- Any function in `skills.js` other than the chat HTML render path

## Commit message convention

```
feat(ougl.4): inject gate-confirm "Save and continue" button in journey-aware chat sessions
```

## PR checklist

- [ ] `node tests/check-ougl4-journey-aware-chat-button.js` → 7/7 pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

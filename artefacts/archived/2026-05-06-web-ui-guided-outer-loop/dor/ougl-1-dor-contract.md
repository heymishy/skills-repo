# DoR Contract — ougl.1: Extend `buildSystemPrompt` with optional `priorArtefacts` handoff block

**Story:** ougl.1
**DoR reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/dor/ougl-1-dor.md
**Date:** 2026-05-14

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/skills.js` | Modify | Add optional 4th `priorArtefacts` parameter to `buildSystemPrompt`. No other function changes. |
| `tests/check-ougl1-buildsystemprompt-handoff.js` | Reference only | Pre-existing failing test file. Do NOT modify test assertions. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields introduced or consumed by this story. Code dependency only.

## Out of Scope (MUST NOT touch)

- `src/web-ui/server.js` — no route changes in this story
- Any other function in `src/web-ui/routes/skills.js` (including `registerHtmlSession`, `handleGetChatHtml`, `handlePostTurnHtml`)
- Any new test files
- Any artefact files under `artefacts/`
- Any `package.json` changes

## Commit message convention

```
feat(ougl.1): extend buildSystemPrompt with priorArtefacts handoff block
```

## PR checklist

- [ ] `node tests/check-ougl1-buildsystemprompt-handoff.js` → 8/8 pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

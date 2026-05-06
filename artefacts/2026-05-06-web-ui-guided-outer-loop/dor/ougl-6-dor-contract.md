# DoR Contract — ougl.6: Per-story stage routing

**Story:** ougl.6
**DoR reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/dor/ougl-6-dor.md
**Date:** 2026-05-14

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/modules/journey-store.js` | Modify | Add `setStoryList`, `getCurrentStory`, `advanceToNextStory` functions and exports. |
| `src/web-ui/routes/journey.js` | Modify | Add `handleGetStories`, `handlePostStories` handlers. Extend `handlePostGateConfirm` with story-mode branch. |
| `src/web-ui/server.js` | Modify | Wire `GET /journey/:id/stories` and `POST /api/journey/:id/stories`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields. Upstream dependencies (ougl.5, ougl.2) are code dependencies only.

## Story-mode session field

Sessions created by `handlePostStories` must include `mode: 'story'` on the session object so that `handlePostGateConfirm` can distinguish story-mode from feature-mode routing.

## Slug validation allowlist

```js
const SLUG_RE = /^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/i;
```
Applied to every element of the submitted slug array. One invalid slug → entire request → 400.

## Out of Scope (MUST NOT touch)

- `src/web-ui/routes/skills.js`
- Automatic slug parsing from file system
- `review → definition-of-ready` transition (handled in ougl.7)
- Any HTML template or CSS files
- Any test files
- Any artefact files under `artefacts/`

## Commit message convention

```
feat(ougl.6): per-story stage routing — story list, GET/POST /stories, gate-confirm story branch
```

## PR checklist

- [ ] `node tests/check-ougl6-perstory-stage-routing.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

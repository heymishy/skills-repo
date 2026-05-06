# DoR Contract — ougl.3: Journey entry screen and start endpoint

**Story:** ougl.3
**DoR reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/dor/ougl-3-dor.md
**Date:** 2026-05-14

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | CREATE | New handler module. Exports: `handleGetJourneyEntry`, `handlePostJourneyStart` (plus test-isolation setters). |
| `src/web-ui/server.js` | Modify | Wire `GET /journey` and `POST /api/journey`. Import from `./routes/journey`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields. Upstream ougl.2 is a code dependency only.

## Key architecture constraint

`_getRepoPath()` in `src/web-ui/routes/skills.js` is **not exported**. `journey.js` must derive the repo root as:
```js
const path = require('path');
const repoRoot = path.resolve(__dirname, '../../..');
```
This matches the same logic as `_getRepoPath()` without importing it.

## Out of Scope (MUST NOT touch)

- `src/web-ui/routes/skills.js` — no changes
- Any HTML template or CSS files
- Any test files
- Any artefact files under `artefacts/`
- Journey listing, resume, or licence-check UI

## Commit message convention

```
feat(ougl.3): journey entry screen + GET /journey + POST /api/journey
```

## PR checklist

- [ ] `node tests/check-ougl3-journey-entry-and-start.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

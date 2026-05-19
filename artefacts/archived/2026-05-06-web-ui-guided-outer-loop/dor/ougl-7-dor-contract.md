# DoR Contract — ougl.7: DoR per-story stage and journey completion screen

**Story:** ougl.7
**DoR reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/dor/ougl-7-dor.md
**Date:** 2026-05-14

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/modules/journey-store.js` | Modify | Add `markJourneyComplete(journeyId)` function and export. |
| `src/web-ui/routes/journey.js` | Modify | Extend `handlePostGateConfirm` story-mode branch for `definition-of-ready` completion. Add `handleGetJourneyComplete` handler. |
| `src/web-ui/server.js` | Modify | Wire `GET /journey/:id/complete` → `handleGetJourneyComplete`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields. Upstream dependencies (ougl.6, ougl.2) are code dependencies only.

## M1 metric instrumentation

The `journey_completed` log event is the M1 measurement signal for this feature:
```js
console.info(JSON.stringify({
  event: 'journey_completed',
  journeyId,
  featureSlug: journey.featureSlug,
  stageCount: journey.completedStages.length
}));
```
Must be emitted in `handleGetJourneyComplete` when the page renders (not in gate-confirm).

## Out of Scope (MUST NOT touch)

- `src/web-ui/routes/skills.js`
- GitHub auto-commit or push of artefacts
- Email or external notification
- Journey replay or restart UI
- Visual styling files (CSS, layout)
- Any test files (do not modify pre-existing tests — zero regressions is AC9)
- Any artefact files under `artefacts/`

## Commit message convention

```
feat(ougl.7): journey completion screen + markJourneyComplete + M1 instrumentation log
```

## PR checklist

- [ ] `node tests/check-ougl7-dor-and-journey-complete.js` → all tests pass
- [ ] `npm test` → 0 failures (all pre-existing tests still pass)
- [ ] Draft PR opened — not marked ready for review

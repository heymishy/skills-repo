# DoR Contract — ougl.2: Journey state store module and `registerHtmlSession` extension

**Story:** ougl.2
**DoR reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/dor/ougl-2-dor.md
**Date:** 2026-05-14

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/modules/journey-store.js` | CREATE | New in-memory store module. CommonJS. |
| `src/web-ui/routes/skills.js` | Modify | `registerHtmlSession`: add `journeyId: null` to session object. Add `linkSessionToJourney` function and export. No other changes. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields. Upstream ougl.1 is a code dependency only.

## Out of Scope (MUST NOT touch)

- `src/web-ui/server.js`
- `src/web-ui/routes/journey.js` (does not exist yet — created in ougl.3)
- Any HTML template files
- Any test files
- Any artefact files under `artefacts/`
- Any other function in `skills.js` beyond `registerHtmlSession` modification and `linkSessionToJourney` addition

## Module interface contract (for downstream stories)

```js
// src/web-ui/modules/journey-store.js
module.exports = {
  createJourney(featureSlug),         // returns { journeyId, featureSlug, mode: 'feature', activeSkill: null, activeSessionId: null, completedStages: [] }
  getJourney(journeyId),              // returns journey or null
  setActiveSession(journeyId, sessionId, skillName),
  getJourneyBySession(sessionId),     // returns journey or null
  completeStage(journeyId, skillName, artefactPath),
  getNextStage(skillName),            // 'discovery'→'benefit-metric'→'definition'→'test-plan'→'definition-of-ready'→null
  _clear()                            // test isolation only
};
```

## Commit message convention

```
feat(ougl.2): journey-store module + registerHtmlSession journeyId field + linkSessionToJourney
```

## PR checklist

- [ ] `node tests/check-ougl2-journey-state-store.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

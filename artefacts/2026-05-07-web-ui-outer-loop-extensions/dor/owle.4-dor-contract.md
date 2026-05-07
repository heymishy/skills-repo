# DoR Contract — owle.4: Estimate side-trip

**Story:** owle.4
**DoR reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/dor/owle.4-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add `handlePostEstimate` handler; extend stage-controls to include `estimateAvailable` (true at discovery/definition only). |
| `src/web-ui/server.js` | Modify | Wire `POST /api/journey/:id/estimate`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields touched.

## Key architecture constraints

- Target file `workspace/estimation-norms.md` is hardcoded — relative to repoRoot, never supplied by client.
- `featureSlug` and `date` are server-side derived. Body fields for these must be rejected if present.
- `estimateAvailable` flag is computed from `journey.currentStage` — not from client input.
- Table columns: `date | feature | pass | focusHours | complexity | scopeStability | notes`.

## Out of Scope (MUST NOT touch)

- Any HTML template or frontend files
- Any existing estimation-norms.md rows
- Any test files
- Any files under `artefacts/`

## Commit message convention

```
feat(owle.4): estimate side-trip — append handler, stage-gate, field validation
```

## PR checklist

- [ ] `node tests/check-owle4-estimate-side-trip.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

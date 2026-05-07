# DoR Contract — owle.2: Decisions side-trip

**Story:** owle.2
**DoR reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/dor/owle.2-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add `handlePostDecisions` handler; extend stage-controls to include `decisionsAvailable: true` at all stages. |
| `src/web-ui/server.js` | Modify | Wire `POST /api/journey/:id/decisions`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields touched.

## Key architecture constraints

- `featureSlug` comes exclusively from `journey.featureSlug` (set at creation). Never accepted from request body or URL.
- Write path: `path.join(repoRoot, 'artefacts', featureSlug, 'decisions.md')`. Validate against `repoRoot + path.sep` before write.
- No partial write: HTTP 400 validation must fire before any `fs.writeFileSync` call.
- Decisions.md row format: `| date | title | context | decision | rationale | type |` — `type` field contains `RISK-ACCEPT` when flag is true, otherwise `decision`.

## Out of Scope (MUST NOT touch)

- Any HTML template or frontend files
- Any existing decisions.md file content (append-only)
- Any test files
- Any files under `artefacts/`

## Commit message convention

```
feat(owle.2): decisions side-trip — append handler, path guard, stage-controls flag
```

## PR checklist

- [ ] `node tests/check-owle2-decisions-side-trip.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

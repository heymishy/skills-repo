# DoR Contract — owle.5: Spike side-trip

**Story:** owle.5
**DoR reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/dor/owle.5-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add `handlePostSpike` and `handlePatchSpikeOutcome` handlers; extend stage-controls to include `spikeAvailable: true`. |
| `src/web-ui/server.js` | Modify | Wire `POST /api/journey/:id/spikes` and `PATCH /api/journey/:id/spikes/:slug`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields touched.

## Key architecture constraints

- **Dual path traversal guard:** The combined path `path.resolve(repoRoot, 'artefacts', featureSlug, 'spikes', titleSlug + '-spike.md')` must start with `repoRoot + path.sep`. Both components (featureSlug AND titleSlug) are validated together via the combined path check.
- **Slug derivation is server-side only.** The request body supplies only `title` (raw user text). The slug is derived by the server: lowercase, spaces → hyphens, non-alphanumeric stripped, consecutive hyphens collapsed, leading/trailing hyphens stripped.
- **409 check is mandatory** — `fs.existsSync` before any write. No overwrite.
- **PATCH outcomes whitelist:** `['PROCEED', 'REDESIGN', 'DEFER']` only. Return 400 for any other value.

## Out of Scope (MUST NOT touch)

- Any HTML template or frontend files
- Any test files
- Any files under `artefacts/`

## Commit message convention

```
feat(owle.5): spike side-trip — create/outcome handlers, dual path guard, slug sanitise
```

## PR checklist

- [ ] `node tests/check-owle5-spike-side-trip.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

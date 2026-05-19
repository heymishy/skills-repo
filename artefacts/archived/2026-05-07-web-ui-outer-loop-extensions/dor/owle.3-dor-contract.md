# DoR Contract — owle.3: Trace side-trip

**Story:** owle.3
**DoR reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/dor/owle.3-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add `handleGetTrace` handler; extend stage-controls to include `traceAvailable: true`. |
| `src/web-ui/server.js` | Modify | Wire `GET /api/journey/:id/trace`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields touched.

## Key architecture constraints

- NO shell execution (`child_process`, `exec`, `spawn`). All checks use `fs.existsSync`/`fs.readdirSync`.
- NO disk writes — read-only handler.
- `featureSlug` from `journey.featureSlug` only; path guard mandatory.
- Required artefact checks: `discovery.md`, `stories/`, `test-plans/`, `dor/` — all within `artefacts/<featureSlug>/`.

## Out of Scope (MUST NOT touch)

- `scripts/validate-trace.sh`
- Any HTML templates or frontend files
- Any test files
- Any files under `artefacts/`

## Commit message convention

```
feat(owle.3): trace side-trip — artefact presence check, path guard, findings response
```

## PR checklist

- [ ] `node tests/check-owle3-trace-side-trip.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

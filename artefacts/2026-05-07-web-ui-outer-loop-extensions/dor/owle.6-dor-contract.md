# DoR Contract — owle.6: Pipeline-state auto-write

**Story:** owle.6
**DoR reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/dor/owle.6-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add `_pipelineStateWriter` injectable (default throws), `setPipelineStateWriter(fn)` export, adapter call hooks in gate-confirm and sign-off success paths. |
| `src/web-ui/adapters/pipeline-state-writer.js` | Create | Real implementation: read-modify-write with temp-file-then-rename and schema validation. |
| `src/web-ui/server.js` | Modify | Wire `setPipelineStateWriter(require('./adapters/pipeline-state-writer'))` at startup. Add `NODE_ENV=test` no-op block. |

## Schema Dependencies

`schemaDepends: []` — reads `.github/pipeline-state.schema.json` for validation; does not modify the schema file.

## Key architecture constraints

- **D37 three conditions:** (1) stub throws — not null/empty; (2) AC1 scopes production wiring; (3) server.js wiring is a separate task from handler hook insertion.
- **ADR-023 disk canonicity:** adapter must not return or be called with in-memory copies that haven't been persisted. The hook fires AFTER a successful disk write in the gate-confirm handler.
- **Temp-file-then-rename atomicity:** write to `pipeline-state.json.tmp`, validate, then `fs.renameSync` to `pipeline-state.json`. Clean up `.tmp` on error.
- **No accessToken in log** — log only `{event, featureSlug, storyId, fieldsChanged}`.
- **No jsonschema npm module.** Schema validation is manual (check required fields and enum values).

## Out of Scope (MUST NOT touch)

- `.github/pipeline-state.schema.json` (read-only, must not be modified)
- `.github/pipeline-state.json` (modified only via the adapter — never via direct fs calls outside the adapter)
- Any HTML template or frontend files
- Any test files
- Any files under `artefacts/`
- GitHub API or git operations

## Commit message convention

```
feat(owle.6): pipeline-state auto-write — injectable adapter, hooks, temp-rename, schema validation
```

## PR checklist

- [ ] `node tests/check-owle6-pipeline-state-auto-write.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review

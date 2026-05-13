# DoR Contract: sar.1 — Audit record slug resolution fix

**Story:** `artefacts/2026-04-29-audit-slug-resolution/stories/sar.1-audit-record-slug-fix.md`
**Contract approved:** 2026-04-29

---

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `scripts/extract-pr-slug.js` | **Create** | New module; exports `extractPRSlug(bodyText)` and `buildSlugSourceNote(source, slug)` |
| `.github/workflows/assurance-gate.yml` | **Modify** | `resolve_feature` step: call `node scripts/extract-pr-slug.js` via `PR_BODY` env var; update JS comment block to include slug source note |
| `tests/check-sar1-slug-resolution.js` | **Pre-exists as failing stub** | Agent makes all 8 tests pass |

## Out-of-scope files (must not be touched)

- All files under `artefacts/` (pipeline bookkeeping only — pipeline-state.json update on merge is handled by operator)
- All files under `.github/skills/`
- All files under `.github/templates/`
- `package.json` — test file already wired in by operator before dispatch
- `scripts/trace-report.js` — no change to collect logic
- Any file not listed above in the touchpoints table

## Schema dependencies

None — no pipeline-state.schema.json changes required.

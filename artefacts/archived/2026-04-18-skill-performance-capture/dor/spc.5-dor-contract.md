# DoR Contract: Governance check — validate capture block completeness

**Story:** spc.5-governance-check-capture-completeness
**Feature:** 2026-04-18-skill-performance-capture
**Approved:** 2026-04-18

---

## What will be built

`scripts/check-capture-completeness.js` — a plain Node.js script (no external dependencies) that: reads context.yml instrumentation.enabled; skips with exit 0 if disabled; scans Markdown files in a supplied directory; checks for capture block presence and validates all 6 required metadata fields; reports missing blocks (by path) and missing fields (by name); exits 0 if completeness ≥ 80%, exits 1 if below.

## What will NOT be built

- No CI integration (not added to npm test)
- No content validation of free-text sections
- No cross-run comparison logic

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Run against fixture; assert counts and exit codes | Unit (script execution with fixture) |
| AC2 | Run against incomplete block fixture; assert field names reported | Unit (script execution with fixture) |
| AC3 | Run against no-block fixture; assert file path in output | Unit (script execution with fixture) |
| AC4 | Run with disabled config; assert exit 0 and skip message | Unit (script execution with mock config) |
| AC5 | Read package.json; assert script not in test chain | Unit (package.json inspection) |

## Assumptions

- Node.js built-ins only (fs, path)
- Field names match spc.2 template exactly
- Reads .github/context.yml or falls back to contexts/personal.yml

## schemaDepends

`schemaDepends: []` — upstream dependencies are on context.yml fields (spc.1) and capture block template fields (spc.2), not pipeline-state.json fields.

## Estimated touch points

Files: `scripts/check-capture-completeness.js` (new file only). Services: none. APIs: none.

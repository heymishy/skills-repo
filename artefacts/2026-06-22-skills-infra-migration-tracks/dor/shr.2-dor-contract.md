# DoR Contract: shr.2 — Support `ops/` path prefix for standalone infra changes

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

The `scripts/check-pipeline-state-integrity.js` slug validator extended to accept feature slugs with an `ops/` prefix. Path-traversal guard verified to hold for ops/-prefixed artefact paths. Standard feature slugs unaffected.

## What will NOT be built

Web UI journey or pipeline-state.json feature entry for ops changes. Automatic discovery of ops/ slugs. Changes to STAGE_SEQUENCE, src/, or route handlers.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Slug validator accepts `ops/2026-06-25-secrets-rotation`; no error | Unit |
| AC2 | path.resolve for valid ops artefact path startsWith(repoRoot + sep) | Unit |
| AC3 | Traversal slug `ops/../../etc/passwd` → resolved path does NOT escape repoRoot | Unit |
| AC4 | Standard slug behaviour unchanged | Unit |

## Assumptions

Slug validator can be extended to include an `ops/YYYY-MM-DD-` prefix pattern without breaking existing validation.

## Estimated touch points

Files: `scripts/check-pipeline-state-integrity.js`
Services: None
APIs: None

## schemaDepends

None.

# Contract Proposal: Resolve each product's own repo for SaaS export, tenant-scoped

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s1-tenant-scoped-repo-resolution.md
**Date:** 2026-08-06

## What will be built

`ownerRepoForFeature(slug, credential)` replaces `ownerRepoFromEnv()` inside `src/web-ui/adapters/export-data-source.js`'s `realExportDataSource`. Looks up which product owns the feature slug, then reads that product's owner/repo from the products table, scoped by the credential's authorized tenant access. AC3's error body is scrubbed of any repo/owner/tenant identifier for both 403 and 404 cases, while preserving `rb-s4`'s existing status-code distinction between the two.

## What will NOT be built

- Multi-repo-per-product support
- Any CLI interface change (`--from-saas <slug>` stays exactly as-is)
- A full codebase audit of other single-repo assumptions (tracked separately as `2026-08-06-single-repo-assumption-audit`)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Seeded test-DB fixture for product A, assert correct resolution | Unit + integration |
| AC2 | Seeded fixture for product B, assert independent resolution differs from A | Unit + integration |
| AC3 | Assert 403/404 responses contain no repo/owner/tenant identifier | Unit |
| AC4 | Static grep confirming `GITHUB_REPO`/`ownerRepoFromEnv` fully removed from the export path | Unit |

## Assumptions

- The 3 discovery-level `[ASSUMPTION]` lines (products-table data completeness, feature→product traceability, GitHub OAuth scope sufficiency) remain unresolved — implementation-discoverable; the coding agent will surface any real gap directly.

## Estimated touch points

- **Files:** `src/web-ui/adapters/export-data-source.js` (modify), `src/web-ui/routes/export.js` (error-body scrubbing)
- **Services:** none new
- **APIs:** none new — reads the existing products table

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

No upstream story dependency — this replaces existing, already-merged `rb-s4` code directly.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.

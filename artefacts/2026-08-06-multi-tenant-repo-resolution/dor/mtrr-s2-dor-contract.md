# Contract Proposal: Connect a repo by picking from your own accessible repos

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s2-repo-connection-picker.md
**Date:** 2026-08-06

## What will be built

A repo-connection picker UI that lists the operator's own accessible GitHub repos (via their OAuth credential) as the primary connection path, writing to the exact same `prc-s1.1` repo-association columns the existing URL-entry flow already writes to. Falls back to the existing URL field if repo-listing fails (rate limit or scope issue). Includes search/filter for operators with many repos.

## What will NOT be built

- A new repo-creation flow (`prc-s2.1` already handles this)
- Any change to `mtrr-s1`'s export-resolution logic

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked GitHub repo-list API, assert picker renders as primary path | Unit + integration |
| AC2 | Assert selection writes identical column shape to the URL-entry flow | Unit |
| AC3 | Mocked rate-limit/scope error, assert fallback to URL field | Unit |
| AC4 | Fixture list of 20+ repos, assert search narrows results | Unit |

## Assumptions

- Listing accessible repos works within existing OAuth scopes already granted at login (discovery `[ASSUMPTION]`, unresolved) — implementation-discoverable; if a new scope/consent step turns out necessary, that's a real finding to report, not something to silently add.

## Estimated touch points

- **Files:** new repo-picker UI component/route, minor changes to the existing product-repo-connection page
- **Services:** none new — reuses existing GitHub OAuth session
- **APIs:** GitHub's own "list repos accessible to this token" endpoint

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

No upstream story dependency in the schema sense — reads the same `prc-s1.1` columns `mtrr-s1` also reads, but does not depend on `mtrr-s1`'s own lookup logic.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.

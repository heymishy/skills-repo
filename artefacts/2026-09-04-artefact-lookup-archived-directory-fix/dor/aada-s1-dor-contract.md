# Contract Proposal: Feature artefact lookup falls back to the archived directory when the primary path is gone

**Story reference:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/stories/aada-s1-check-archived-directory-fallback.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## What will be built

1. In `listLocalArtefacts` (`src/web-ui/adapters/artefact-list.js`): when `path.join(repoRoot, 'artefacts', featureSlug)` does not exist (`fs.existsSync` returns false), check `path.join(repoRoot, 'artefacts', 'archived', featureSlug)` before returning `null`. If that archived path exists, walk it with the existing `walkMdFiles` helper exactly as the primary path is walked today, and return its contents in the same `{path, type: 'file'}[]` shape.
2. Writes the 3 tests from the test plan (AC1–AC3), reusing `check-alrf-s1-artefact-list-repo-root-fallback.js`'s own established `fs.mkdtempSync` real-temp-directory fixture pattern.

## What will NOT be built

- Any change to `listArtefacts`'s own merge-with-Postgres or GitHub-API-fallback logic — untouched.
- Any change to `walkMdFiles`, `deriveTypeFromPath`, or the module's exports shape.
- Any UI indication that a feature is archived — a separate, real enhancement, not required to fix the lookup itself.
- Any change to the archival mechanism (what triggers moving a feature to `artefacts/archived/`, or `pipeline-state.json`'s own `stage: "archived"` field) — already shipped, working, untouched.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Temp repo with `artefacts/{slug}/discovery.md`, no archived dir; assert the primary file is found | unit |
| AC2 | Temp repo with `artefacts/archived/{slug}/...` only; assert the archived files are found, not `null` | unit |
| AC3 | Temp repo with neither path; assert `null` is still returned | unit (regression guard) |

## Assumptions

- `artefacts/archived/{slug}/` is the exact, already-established convention — confirmed via direct code reading of `scripts/validate-trace.sh` (`archived_path = 'artefacts/archived/' + normalized[len('artefacts/'):]`) and `scripts/validate-trace.ps1`'s own identical logic — not a guessed path.
- `walkMdFiles`'s own recursive `.md`-file walk requires no modification to work against the archived path — it takes an absolute directory path as its only input and has no assumptions baked in about which top-level `artefacts/` subdirectory it's walking. Confirmed via direct code reading.

## Estimated touch points

Files: `src/web-ui/adapters/artefact-list.js` (`listLocalArtefacts` only), `tests/check-aada-s1-*.js` (new).
Services: None new.
APIs: None new.

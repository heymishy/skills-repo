# Contract Proposal: Merge local-disk and Postgres artefact lists instead of local-wins-if-nonempty

**Story reference:** artefacts/2026-08-31-listartefacts-postgres-merge-fix/stories/lpmf-s1-merge-local-and-postgres-artefact-lists.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## What will be built

- In `src/web-ui/adapters/artefact-list.js`'s `listArtefacts`, replace the current early-return-on-non-empty-local logic with a merge:
  1. Compute `localArtefacts` (mapped exactly as today) if `repoRoot` is supplied and `listLocalArtefacts` returns a non-null array.
  2. Compute `pgArtefacts` (mapped exactly as today) if `pgArtefactRows` is a non-empty array.
  3. If either is non-empty, merge: start with `pgArtefacts`, then overlay `localArtefacts` keyed by `path` (local overwrites any Postgres entry at the same path, and adds any local-only path) — `Object.values(Map)` built path-first from pg then local.
  4. Return the merged, deduped array through the existing `groupArtefactsByStage` call, preserving `noArtefacts: false`.
  5. If both are empty, fall through to the existing GitHub-API path exactly as today.
- No change to `listLocalArtefacts`, `deriveTypeFromPath`, `groupArtefactsByStage`, or any other exported function.

## What will NOT be built

- No change to the GitHub-API fallback path.
- No change to how callers fetch/pass `pgArtefactRows`.
- No sort-order guarantee beyond whatever the merge naturally produces (pg items first, local items overlaid/appended) — no AC requires a specific order.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | 3 local + 8 pg rows (3 overlapping paths + 5 new) -> assert 8 distinct paths returned | Unit |
| AC2 | 1 local + 1 pg row at the same path, differing content -> assert local fields win | Unit |
| AC3 | Empty local dir + 2 pg rows -> assert both returned (regression, mirrors alrf-s4 AC3) | Unit |
| AC4 | 1 local file, no pg rows -> assert 1 returned (regression, mirrors alrf-s4 AC2) | Unit |
| AC5 | Merged multi-source list -> assert `groupArtefactsByStage` output has no duplicate/dropped paths | Unit |

## Assumptions

- `path` (the relative artefact path used to build `viewUrl`) is a stable, comparable dedupe key across both local and Postgres representations of the same underlying file — already true today, since both are derived from the same `artefacts/[feature]/...` relative path convention.
- `alrf-s4`'s existing test file (`tests/check-alrf-s4-postgres-artefact-fallback.js`) exercises only single-path-overlap and empty-local scenarios, so a local-overlay merge is fully backward compatible with its existing AC2/AC3 assertions without modification.

## Estimated touch points

Files: `src/web-ui/adapters/artefact-list.js` only. Services: none. APIs: none. New test file: `tests/check-lpmf-s1-artefact-list-merge.js`.

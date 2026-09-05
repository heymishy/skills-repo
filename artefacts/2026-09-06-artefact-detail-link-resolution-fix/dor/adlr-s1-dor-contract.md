# Contract Proposal — Fix artefact detail links so nested and archived artefacts resolve instead of 404ing

**Story:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/stories/adlr-s1-fix-artefact-detail-link-resolution.md
**Date:** 2026-09-06

---

## What will be built

**`src/web-ui/routes/features.js`** — `_renderArtefactListByType`'s `fileSlug` extraction replaced with a helper that derives the artefact's path relative to its own feature (stripping any `artefacts/` and `archived/` prefix and the feature slug itself, then the `.md` suffix), so nested and archived artefacts keep their real subdirectory in the generated URL: `/artefact/<slug>/<encodeURIComponent(relativePath)>`.

**`src/web-ui/adapters/artefact-fetcher.js`** — `fetchArtefact` resolution order:
1. Try the decoded path directly against `artefacts/<slug>/<path>.md`.
2. If 404, try `artefacts/archived/<slug>/<path>.md`.
3. Only if the input contains no `/` (a bare legacy type name), probe each known subdirectory (`stories`, `epics`, `test-plans`, `verification-scripts`, `dor`, `plans`, `dod`, `trace`, `coverage`, `reference`, `research`) under both prefixes, using a shorter timeout per probe.
4. Otherwise, throw `ArtefactNotFoundError` as today.

**`src/web-ui/server.js`** — the `/artefact/:slug/:type` dispatch decodes `parts[2]` via `decodeURIComponent` (wrapped in try/catch for malformed sequences) before passing it to `handleArtefactRoute`, since link generation now percent-encodes a path that may contain `/`.

## What will NOT be built

- No change to the route regex (`^/artefact/[^/]+/[^/]+$`) — `encodeURIComponent` keeps the whole relative path within a single URL segment (`/` becomes `%2F`), so the existing two-segment shape still matches.
- No fix or removal of the dead `/artefacts/:path` (plural) route referenced by `listArtefacts`'s own unused `viewUrl` field.
- No change to `commit-view.js`/`skills.js`'s "View artefact" link — confirmed currently unreachable for an unrelated reason (`getCommitResult` never wired).
- No change to `listArtefacts`/`artefact-list.js` itself — its path computation is already correct.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests: link generation encodes the correct relative path for nested, archived, and root-level cases | Unit |
| AC2 | Unit tests: direct resolution, exactly 1-2 fetch calls, no guessing for slash-containing input | Unit |
| AC3 | Unit tests: archived-prefix fallback, both nested and root-level | Unit |
| AC4 | Unit test: existing root-level non-archived behaviour unchanged | Unit (regression guard) |
| AC5 | Unit tests: bare-name probing finds the right subdirectory; exhausts and throws correctly when genuinely missing | Unit |
| AC6 | Manual verification scenario against real, previously-broken production pages, post-merge | Manual |

## Assumptions

- Every artefact object reaching `_renderArtefactListByType` has a `path` field that is a full repo-relative path starting with `artefacts/` (confirmed by reading both branches of `listArtefacts` — local-filesystem and Postgres — which both populate `path` this way).
- The known-subdirectory list is fixed and matches `CLAUDE.md`'s own documented artefact directory-tree convention; a future new subdirectory type not in this list would fall back to the existing 404 behaviour for bare legacy links only (new correctly-generated links are unaffected, since they always carry the real subdirectory already).

## Estimated touch points

**Files:** `src/web-ui/routes/features.js`, `src/web-ui/adapters/artefact-fetcher.js`, `src/web-ui/server.js` (one-line decode), new `tests/check-adlr-s1-artefact-link-resolution.js`
**Services:** None
**APIs:** None (still GitHub Contents API, same shape, different path construction)

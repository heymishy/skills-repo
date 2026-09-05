## Story: Group a story's own bare-slug definition file into its own accordion section

**Slug:** bsgm-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-05

---

## Problem

Found while independently confirming `fpux.1`/`fpux.2` (the `feature-page-ux-redesign` epic) live in production: `/features/2026-09-02-product-dashboard-triage` (and 36 other real multi-story features — see audit below) renders each story's identifier (e.g. `pdt-s1`) in two visually disconnected places on the same page: once as a bare filename link in the flat, feature-level "Stories" list at the top, and again as a separate expandable accordion section further down containing that story's own DoD/DoR/Plan/Review/Test Plan/Verification links — but *not* a link to the story's own definition file, which stays orphaned in the top list.

**Root cause, confirmed by direct code reading:** `groupArtefactsByStory` (`src/web-ui/adapters/feature-story-structure.js:94`) matches an artefact to its owning story with `basename.indexOf(slug + '-') === 0` — requiring a trailing hyphen after the slug. A story's own definition file is named exactly `<slug>.md` (no hyphen-suffix), so it can never match this predicate and always falls into the feature-level flat list instead, while every other artefact for that story (named `<slug>-dod.md`, `<slug>-dor.md`, etc.) correctly matches and groups under the story's own accordion.

**Why the hyphen requirement exists (not an oversight to just remove):** it prevents a longer slug's files from being mis-attributed to a shorter slug that is a text-prefix of it (e.g. a `p3.1a-*.md` file incorrectly matching `p3.1`'s group, since `"p3.1a-x.md".indexOf("p3.1")` would otherwise be `0`). That protection must survive this fix.

**Blast radius, quantified via direct audit of `.github/pipeline-state.json` and `artefacts/*/stories/`:**
- 170 individual story files across this repo use the bare `<slug>.md` naming convention (no descriptive suffix) — roughly a third of all story files in this repo's history
- 37 real, distinct multi-story features are affected, including `2026-06-22-wuce-multi-tenancy`, `2026-07-24-interactive-kanban-boards`, `2026-05-19-cli-deterministic-governance`, and 34 others
- Single-story features are unaffected — they render via a different, older flat path that never invokes this grouping code

## As a / I want / So that

As an operator browsing any multi-story feature's artefact-index page
I want each story's own definition file to appear inside that story's own accordion section, alongside its other artefacts, instead of orphaned in a separate flat list at the top of the page
So that the page reads as one coherent structure instead of showing the same story identifier twice in two disconnected places

## Acceptance Criteria

- **AC1:** Given a story whose own definition file is named exactly `<slug>.md` (bare, no descriptive suffix), when `groupArtefactsByStory` classifies that feature's artefacts, then the story's own definition file is included in that story's own `artefacts` array (not `featureLevel`).
- **AC2 (regression guard):** Given a story whose own definition file uses the descriptive-suffix convention (e.g. `<slug>-some-title.md`), when `groupArtefactsByStory` runs, then behaviour is unchanged from today — this fix adds a new match case, it does not alter the existing hyphen-prefix match.
- **AC3 (regression guard):** Given two stories where one slug is a text-prefix of the other (e.g. `p3.1` and `p3.1a`), when both stories have artefacts, then `p3.1a`'s own artefacts (including a bare `p3.1a.md` if present) are never mis-attributed to `p3.1`'s group, and vice versa — the existing longest-first disambiguation is preserved for the new bare-filename case exactly as it already works for the hyphen-suffix case.
- **AC4:** Given a live multi-story feature page with at least one bare-slug story file (e.g. `2026-09-02-product-dashboard-triage`), when the page is rendered post-fix, then that story's own definition file link appears inside its own accordion section (grouped with its other artefacts) and the feature-level flat list no longer shows it as an orphaned entry.

## Out of scope

- Renaming any existing story file to the descriptive-suffix convention — this fix corrects the grouping logic to handle both naming conventions correctly, it does not migrate existing files.
- Any change to epic-level artefact placement (epic `.md` files correctly remain feature-level today — confirmed via code audit, not affected by this bug).
- Any change to `deriveTypeFromPath`'s own folder-based type derivation in `artefact-list.js` — confirmed via audit to be a separate, correct mechanism, unaffected by this bug.

## Benefit linkage

Closes a real, confirmed, repo-wide UX defect (37 affected features) discovered via direct live-production verification of the `feature-page-ux-redesign` epic (`fpux.1`/`fpux.2`) — not a hypothetical one. No formal benefit-metric artefact — short-track story, consistent with every other short-track delivery this session.

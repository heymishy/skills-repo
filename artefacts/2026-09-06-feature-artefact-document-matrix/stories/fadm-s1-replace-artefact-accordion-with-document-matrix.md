## Story: Replace the multi-story artefact accordion with a compact feature-level table and document matrix

**Slug:** fadm-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-06

---

## Problem

Operator feedback, direct: the multi-story feature-detail page (`/features/:slug`) is too verbose to scan. Confirmed by direct measurement against a real feature (`2026-07-05-product-stds-hierarchy`, 10 stories, 5 epics, 89 documents): the current rendering (`renderGroupedArtefactIndexHtml` in `features.js`, using the `.sw-epic-group`/`.sw-story-row` accordion shipped in `fpux.1` and dedup-fixed in `sri-s1`) opens up to 54 separate `.sw-card` sections to show those 89 documents — each story's own artefacts render as up to 7 further one-line cards grouped by type, each with its own header, nested inside that story's own accordion.

**Approved replacement design** (confirmed via an interactive mockup this session, using the same real `psh` dataset for a direct before/after comparison):
1. Feature-level documents (discovery, benefit-metric, decisions, nfr-profile, and any other feature-root file) render as one compact table (Type | Document | Date) instead of N separate `.sw-card` sections.
2. Story-level and epic-level documents render as one matrix: rows are stories (grouped under a plain, non-interactive epic-divider row when the feature has epics), columns are the distinct document kinds actually present across this feature's own stories, and each present cell is a clickable checkmark linking directly to that document. A missing cell shows a dash. A trailing Status column shows the story's own completion state.
3. An epic's own document (e.g. `epics/e1-....md`) is linked inline from that epic's divider row, not rendered as its own matrix row or card.
4. The per-story detail tables considered during design (one full table per story, in addition to the matrix) were explicitly rejected as still too dense — the matrix's own clickable ticks replace the need for them entirely.

This supersedes the `.sw-epic-group`/`.sw-story-row` accordion rendering for multi-story features. The underlying grouping logic those stories fixed (`getFeatureStoryStructure`, `groupArtefactsByStory` in `feature-story-structure.js`) is **not** superseded — the new matrix still needs to know which artefacts belong to which story and epic, and reuses that same, already-correct data layer unchanged.

## As a / I want / So that

As an operator browsing a multi-story feature's artefact index
I want to see every document's presence and completion status across all stories at a glance, and open any one of them directly
So that I don't have to open a chain of nested accordions and per-type cards just to find or confirm a single document

## Acceptance Criteria

- **AC1:** Given a feature's feature-level documents (discovery, benefit-metric, decisions, nfr-profile, or any other file directly in the feature root), when the artefact index page renders, then they appear in a single table (Type, Document, Date) instead of one `.sw-card` section per type.
- **AC2:** Given a multi-story feature, when the artefact index page renders, then story-level and epic-level documents appear in one matrix: one row per story (grouped under a non-interactive epic-divider row for epic-nested stories), one column per distinct document kind actually present across this feature's own stories (not a fixed hardcoded set), a clickable checkmark in each cell where that story has that document, a dash where it does not.
- **AC3:** Given two documents that live in the same subdirectory but are materially different (a story's `dor/<slug>-dor.md` and its own `dor/<slug>-dor-contract.md`), when the matrix's columns are derived, then they occupy two distinct columns, not one — filename-suffix disambiguation within a shared folder, not folder-name alone.
- **AC4:** Given an epic exists for a feature, when the matrix renders that epic's own divider row, then it includes a link directly to that epic's own document, and the epic's document does not also appear as a separate matrix row or in the feature-level table.
- **AC5:** (regression guard) Given a single-story feature, when its artefact index page renders, then behaviour is unchanged — this story's scope is the multi-story grouped path only.
- **AC6:** (regression guard) Given a completed pipeline stage with a resumable skill session, when that stage's artefact appears in either the feature-level table or the matrix, then a "Resume conversation" affordance still renders alongside it, matching today's existing capability.
- **AC7:** (manual, post-merge) Given the three real features used to validate this design (`2026-07-05-product-stds-hierarchy`, `2026-04-14-skills-platform-phase3`, and one further multi-story feature), when each is opened live, then the feature-level table and document matrix both render correctly and every checkmark opens the correct real document.

## Out of scope

- Any change to single-story feature rendering (`renderArtefactIndexHtml`'s own existing flat path) — confirmed unaffected by this story's own scope decision (AC5).
- Sorting, filtering, or search within the matrix — the approved design is a static, complete view; interactive controls are a future enhancement if requested.
- Any change to `getFeatureStoryStructure`/`groupArtefactsByStory` (`feature-story-structure.js`) — both remain exactly as `sri-s1` left them; this story is a consumer of that data, not a modifier of it.
- Retiring the `.sw-epic-group`/`.sw-story-row` CSS itself is in scope (dead after this story ships) — but no other CSS cleanup beyond what this story's own change makes genuinely unused.

## Benefit linkage

Directly addresses operator-reported verbosity on the feature-detail page, validated interactively against real production data (89 real documents on `psh`) before any code was written — the design was approved by the operator via a working mockup, not assumed. No formal benefit-metric artefact — short-track story, consistent with every other short-track delivery this session.

## Architecture Constraints

**Design-system guardrail:** reuses the existing design-system tokens and primitives (`--surface`, `--line`, `--ink`, `--muted`, `--accent`; `.sw-card`, `.sw-section-title`) from `html-shell.js` — no new tokens introduced, matching the mockup's own "honor what's already there" approach; per `.github/architecture-guardrails.md`'s own anti-pattern guidance against ad-hoc cross-cutting surface changes without a shared source of truth.

**Constraint on the new column-derivation logic:** the matrix's column-derivation function (AC3) is new and dedicated — it must not be conflated with or silently change the existing shared `deriveTypeFromPath`/`getLabel` mapping used elsewhere (the feature-level table's own Type column may continue using that existing mapping unchanged, since it does not need per-story column disambiguation).

## Complexity Rating

**Rating:** 2 (the design itself was fully validated interactively before this story was written, including two rounds of user-driven simplification; the remaining engineering risk is the column-derivation edge case in AC3, which is bounded and has a clear, testable rule)
**Scope stability:** Stable

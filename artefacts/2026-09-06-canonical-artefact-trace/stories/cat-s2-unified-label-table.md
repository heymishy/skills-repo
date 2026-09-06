## Story: Collapse five independent label tables into one shared, corrected table

**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Benefit-metric reference:** artefacts/2026-09-06-canonical-artefact-trace/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer**,
I want **one authoritative table mapping a document's real folder/filename to its display label and matrix column**,
So that **the same document is labeled identically everywhere it appears, instead of differently depending on which of five tables happened to render it — closing a real gap this session's own audit found (e.g. `review/` and `verification-scripts/` missing from some tables, `spikes/` unrecognised by any of them)**.

## Benefit Linkage

**Metric moved:** Bugs of this class per session
**How:** Five separately-maintained tables (`artefact-labels.js`, `plain-language-labels.js`, `artefact-list.js`'s `SUBDIR_TYPE_MAP`, `artefact-fetcher.js`'s `ARTEFACT_SUBDIRS`, `features.js`'s `SUBDIR_KEY`) are a direct instance of the pattern ADR-028 exists to close — one shared table removes the possibility of them silently drifting apart again.

## Architecture Constraints

- ADR-028: one canonical builder per derived structure — applies equally to this shared lookup table, not just the trace-walking logic in cat-s1.
- `CLAUDE.md`'s own directory-tree convention (`stories/, epics/, test-plans/, verification-scripts/, dor/, plans/, dod/, trace/, coverage/, reference/, research/`) is the starting point, but the audit found it incomplete — missing `review/`, `decisions/` as named entries, and unaware of `spikes/` (seen in the legacy `phase4` feature). This story corrects `CLAUDE.md` in the same change, per the design's own resolved open question.

## Dependencies

- **Upstream:** cat-s1 (core trace builder) — this table is consumed by the builder's own type/label resolution step.
- **Downstream:** cat-s4, cat-s5 (both route integrations display labels sourced from this table).

## Acceptance Criteria

**AC1:** Given a document in each of the 11 currently-recognised subdirectories (`stories, epics, test-plans, verification-scripts, dor, plans, dod, trace, coverage, reference, research`) plus `review` and `decisions` (found missing from some existing tables) and `spikes` (found unrecognised by any existing table), when the shared table resolves each, then every one of these 14 subdirectories maps to a defined, non-generic label — none fall through to a raw-filename fallback that any of the 5 old tables would have produced for it.

**AC2:** Given a document in the `dor/` folder, when the shared table is asked to resolve its column key (not just its display label), then a `-dor-contract.md` file and a plain `-dor.md` file resolve to two distinct keys — reusing `fadm-s1`'s own already-shipped `_deriveMatrixColumn` disambiguation logic, not reimplementing it a second time.

**AC3:** Given `CLAUDE.md`'s own directory-tree convention list, when this story is complete, then that list in `CLAUDE.md` itself is updated to include `review/`, `decisions/`, and `spikes/` — the documentation and the code's own table are kept in sync, not left to drift again.

**AC4:** Given any existing test that asserts a specific label string produced by one of the 5 old tables (found via a full-repo grep before this story's implementation begins), when the shared table replaces the old one, then every such test either passes unchanged or is updated in place with an explicit note explaining why the label changed — no test is silently left failing or silently deleted.

## Out of Scope

- Changing what folder a given artefact type is stored in — this story only changes how existing folders are labeled and keyed, not the storage convention itself.
- Any UI-visible change beyond label-text consistency — the "Unregistered" flag itself is cat-s3/cat-s4's scope.

## NFRs

- **Performance:** Table lookup is a plain object/Map access — no measurable cost, no dedicated NFR test needed.
- **Security:** None identified.
- **Accessibility:** Not applicable — data-layer only.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

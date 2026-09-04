# Story: The feature artefact page groups files by story within one page per feature, instead of one flat list per story slug

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the finding below, made while designing a redesign mockup and confirmed via direct investigation of this repo's own real data
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer browsing a multi-story feature's artefact page**,
I want **one page for the whole feature, with each story's own real artefacts grouped legibly underneath it, instead of a flat file list that mixes every story's files together with no indication of which story owns what**,
So that **I can actually find a specific story's own artefacts on a feature with many stories, and a single-story feature (the common case) keeps working exactly as it does today, with no extra clicks**.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content — the same metric this whole investigation thread (`ppg-s1`, `fal-s1`, `pefl-s1`, `aada-s1`, `prlf-s1`) has targeted.
**How:** Confirmed via direct investigation of the real `2026-04-14-skills-platform-phase3` feature (7 epics, 21 stories, e.g. `p3.3`/`p3.4` under "Platform Structural Integrity"): today's artefact page shows every `.md` file under the feature's directory as one flat, type-grouped list — `p3.3-gate-structural-independence.md`, `p3.3-gate-structural-independence-test-plan.md`, `p3.3-gate-structural-independence-dod.md`, `p3.4-eval-anti-gaming-controls.md`, and 19 other stories' own files, all interleaved with no indication of which story owns which file. Confirmed via a live design-review conversation (operator's own screenshot of `p3.3`, `p3.3`, `p3.4` as three separate story rows on the product page) that stories within one feature should not each open their own separate page, since — once `fal-s1`'s own resolver is correct — they would all show the exact same flat mix of every sibling story's files, adding nothing per extra page beyond a different starting scroll position.

## Architecture Constraints

- **Data source — read `pipeline-state.json` from local disk, not Postgres:** `handleGetFeatureArtefacts` (`src/web-ui/routes/features.js`) reads `path.join(repoRoot, '.github', 'pipeline-state.json')` directly (matching this codebase's own "disk is canonical" ADR-023, and `listLocalArtefacts`'s own established local-first convention) to find the current feature and enumerate its real story list — both flat `feature.stories[]` and epic-nested `feature.epics[].stories[]`, including bare-string story shapes (reusing the exact `typeof story === 'string' ? story : (story.slug || story.id)` handling `fal-s1` established in `computeTaxonomyRollup`). This deliberately avoids `fal-s1`'s own tenant-scoped Postgres taxonomy query for this purpose — that query's own NFR-Performance guarantee (skipped when the fast path resolves) stays intact and unmodified; it remains solely for resolving an ambiguous raw story slug to its real feature, a narrower, rarer job than "enumerate this feature's own full story list."
- **Graceful fallback when the local file is absent:** if `repoRoot/.github/pipeline-state.json` does not exist (e.g. a volumeless/ephemeral deploy container with no local checkout — `alrf-s4`'s own named scenario), the page renders exactly as it does today (flat artefact list, no accordion, no crash) — this story does not build a GitHub-API-based fallback for this specific read; that is a separate, larger integration (the existing `pipeline-state-fetch-adapter.js`'s `realFetchPipelineState`/`realFetchBlobBySha` remain available for a future story to wire in, if ever needed).
- **Classification:** for each artefact returned by the existing `_listArtefacts` (unchanged, including `aada-s1`'s own archived-directory fallback), match its basename against the feature's real story-slug list (sorted longest-first, to correctly disambiguate e.g. `p3.1` vs `p3.1a`) — a file whose basename starts with `{storySlug}-` belongs to that story; every other file is feature-level. This classification is only possible correctly with the real slug list in hand — this repo's own story slugs are not consistently shaped (`p3.3`, `p3.1a`, `fal-s1`, `s3.1-drag-to-advance`), so filename-guessing without the authoritative list would be unreliable.
- **Rendering — single-story features (the common case) are unaffected:** when the feature's real story count is 0 or 1, the page renders exactly as it does today — no accordion, no story-grouping UI, no behaviour change. The accordion only ever appears for a feature with 2 or more real stories.
- **Rendering — multi-story features:** feature-level artefacts (files matching no story prefix) render once, at the top, exactly as `renderArtefactIndexHtml` already renders them today. Below that, an epic/story-grouped accordion — one section per epic (or a single "Stories" section for flat, non-epic-nested features) — each story an expandable row showing that story's own matched artefact files, reusing the existing per-artefact rendering (view link, date, resume link where applicable) unchanged.
- **Resume conversation — no new consolidation logic:** `_resolveResumeLinksForFeature`'s existing `resumeLookup` mechanism (`frsr-s1`, unchanged) is reused as-is for both the feature-level section and each story's own section. Confirmed via direct code reading of `journey-store.js`: `completedStages` entries are pushed by the outer-loop skill-session flow, one journey per feature — for a multi-story feature built outside that flow (e.g. via CLI, matching most of this session's own stories), `completedStages` is typically empty or feature-level only, so resume links naturally only ever appear where they already correctly apply today. No new "which story does this session belong to" logic is needed or built.
- No new npm dependencies. No database schema or query change.

## Dependencies

- **Upstream:** `fal-s1` (real-feature-slug resolution and bare-string story handling, merged, DoD-complete), `pefl-s1` (established the `featureName`-on-item pattern this story's own classification logic parallels, merged, DoD-complete), `aada-s1` (archived-directory fallback, Story 1 of this sequence, merged, DoD-complete), `prlf-s1` (featureSlug-scoped product-page row links, Story 2 of this sequence, merged, DoD-complete), `frsr-s1` (the existing resume-conversation mechanism this story reuses unchanged, merged, DoD-complete).
- **Downstream:** None. A future, separately-scoped story could add the fuller visual redesign (pipeline-stage timeline, feature header card) explored in the earlier mockup — explicitly out of scope here.

## Acceptance Criteria

**AC1:** Given a feature with 2 or more real stories (e.g. `2026-04-14-skills-platform-phase3`, 21 stories across 7 epics), When its artefact page renders, Then feature-level artefacts (discovery, benefit-metric, decisions, nfr-profile) render once at the top, followed by an epic/story-grouped accordion — each story showing only its own real matched artefact files.

**AC2 (regression guard):** Given a feature with 0 or 1 real stories (the common case — every story this session shipped), When its artefact page renders, Then no accordion appears — the page renders exactly as it does today.

**AC3:** Given `repoRoot/.github/pipeline-state.json` exists, When the artefact page needs the feature's real story list, Then it is read directly from that local file — no query to the tenant-scoped Postgres taxonomy table for this purpose.

**AC4 (regression guard):** Given `repoRoot/.github/pipeline-state.json` does not exist, When the artefact page renders, Then it falls back to today's exact flat-list rendering — no crash, no accordion, no missing artefacts.

**AC5 (regression guard):** Given a feature-level artefact with a resumable session (per `frsr-s1`'s existing `resumeLookup` mechanism), When it renders inside this story's new grouped layout, Then its "Resume conversation" link still appears exactly as it does today — no new consolidation or removal of this existing behaviour.

**AC6 (regression guard):** Given the breadcrumb rendered on the artefact page, When it renders under this story's new layout, Then it shows exactly the same Product/Epic/Story content it does today (`pdt-s4`'s own logic, unchanged) — this story only changes the artefact-list body, not the breadcrumb.

## Out of Scope

- The fuller visual redesign explored in the earlier mockup (a pipeline-stage timeline with a connecting spine, a feature-summary header card, promoted resume-conversation buttons with a live-session indicator) — a separate, larger design-and-implementation story if the operator wants that level of visual polish shipped; this story is the functional/architectural fix (one page per feature, correct story grouping), using rendering that extends today's existing artefact-list template, not a from-scratch visual rebuild.
- A GitHub-API-based fallback for reading `pipeline-state.json` when no local checkout exists — the existing `pipeline-state-fetch-adapter.js` remains available for a future story; graceful degradation (today's flat list) is this story's own answer to that case.
- Any change to `fal-s1`'s own tenant-scoped Postgres taxonomy-scan resolver, or its NFR-Performance skip-when-fast-path-resolves guarantee — untouched, remains solely for raw-slug-to-feature resolution.
- Deduplicating identical epic names across different features, or the `p3.3`-style slug-collision problem itself — already fixed by `prlf-s1` for the primary navigation path; not this story's concern.
- Any change to how `pipeline-state.json` itself stores stories (object vs bare-string, flat vs epic-nested) — this story only reads both existing, schema-valid shapes correctly.

## NFRs

- **Performance:** Replaces a conditional (fast-path-skippable) Postgres query with an unconditional local file read of `.github/pipeline-state.json` (~1.36MB in this repo, synchronous `fs.readFileSync` + `JSON.parse`) — the same class of operation `bin/skills advance` and every other CLI command in this pipeline already performs routinely, sub-millisecond-to-low-single-digit-millisecond on local disk, with no network round-trip. Confirmed via direct code reading this is materially cheaper than the Postgres query it replaces for this specific purpose.
- **Security:** None identified — reads a file already fully accessible to this process via `repoRoot` (the same trust boundary `listLocalArtefacts` already operates within); no new external input.
- **Accessibility:** The accordion uses native `<details>`/`<summary>` elements (keyboard-operable, screen-reader-friendly by default, no custom JS state management needed) — confirmed as the pattern from the earlier design-review mockup.
- **Audit:** None identified — no new data write.

## Complexity Rating

**Rating:** 2 — larger surface area than the prior two stories in this sequence (new local-file read, new classification logic, new conditional rendering path), but every individual piece reuses an already-established pattern from a prior story in this session (local-first reads, bare-string story handling, the existing resume-link mechanism) rather than inventing new architecture from scratch. Some ambiguity remains around exact rendering markup, resolved via the earlier design-review mockup's own confirmed direction.
**Scope stability:** Stable — both open design questions (query approach, single-story UX) were confirmed with the operator before this story was written.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

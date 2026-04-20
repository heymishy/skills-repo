## Story: Story/epic archive toggle for viz and state file performance

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e5-platform-observability.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform operator reviewing the pipeline dashboard**,
I want to **toggle the visibility of completed epics and stories in the pipeline viz, and archive their data from the active state file**,
So that **the viz remains focused on in-flight work and performant as the pipeline grows across multiple phases, reducing cognitive load and page weight as delivery scales**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence
**How:** A dashboard crowded with completed stories from past phases is harder to navigate and slower to load. A team member evaluating the platform as a daily tool will form a negative impression if the UI degrades with use. Archiving done stories at the epic level, with a visible toggle to retrieve them, keeps the dashboard actionable and demonstrates that the platform is designed to scale — directly supporting unassisted consumer confidence.

## Architecture Constraints

- Approved pattern: single-file HTML viz — all JS, CSS inline in `dashboards/pipeline-viz.html`; no external CSS files, no build step, no runtime CDN dependencies
- `archive-completed-features.js` already implements feature-level archiving (psa.1); this story extends it with a `--stories` mode that archives story-level entries within in-progress features — do not rewrite the existing `archive()` and `mergeState()` functions, extend them
- Schema evolution constraint: any new `pipeline-state.json` field added by this story must also be added to `pipeline-state.schema.json` simultaneously; check `check-viz-syntax.js` and `check-dashboard-viz.js` governance checks after any viz change
- CSS class names use kebab-case per style guide; new classes follow existing naming convention (`story-row-archived`, `epic-archive-badge`)
- MC-SEC-02: no credentials or identifiers in any archive payload; archive contains only pipeline state fields already present in the active file

## Dependencies

- **Upstream:** psa.1 (`archive-completed-features.js`) must be present — this story extends it; DoD-complete ✅
- **Downstream:** p4-obs-status — weekly report can optionally include a note about archived story count; p4-obs-archive must complete first for that integration to be meaningful; they can ship independently

## Acceptance Criteria

**AC1:** Given `scripts/archive-completed-features.js` is invoked with `--stories` flag (or equivalent `archiveStories(state)` programmatic call), When an in-progress feature contains stories with `dodStatus: "complete"`, Then those stories are moved to `pipeline-state-archive.json` under their parent feature slug, and the active `pipeline-state.json` story entry is replaced with a count field `archivedStoryCount` incremented per archived story.

**AC2:** Given the archive operation completes, When `mergeState()` is called (as `dashboards/pipeline-viz.html` calls it on load), Then the reconstituted full state includes the archived story objects under their parent feature, preserving all original story fields.

**AC3:** Given `pipeline-viz.html` loads state that contains an epic with archived stories (`archivedStoryCount > 0`), When the epic card renders, Then a badge shows "N archived" where N is `archivedStoryCount`; clicking the badge expands a list of archived story rows, which are hidden by default.

**AC4:** Given `pipeline-viz.html` is loaded with the query param `?showArchived=true`, When the page renders, Then all archived stories are visible alongside active stories, rendered with a distinct muted style (grey text, reduced opacity); no stories are hidden.

**AC5:** Given `pipeline-state.json` with a simulated fixture of 50 or more total stories across features (active + archived), When `pipeline-viz.html` loads and renders the full feature list, Then initial render (time to first paint of the feature list) and expand/collapse of a feature card each complete within 2 seconds in a standard browser.

## Out of Scope

- Auto-archiving on DoD status change — archiving is operator-triggered, not automatic
- Deleting archived stories — archive is append-only; deletion is not supported
- Cross-repository archive migration
- Modifying the existing feature-level `archive()` function behaviour — add `archiveStories()` as a new export, do not alter existing exports

## NFRs

- **Security:** No credentials, tokens, or API keys in archive payload (MC-SEC-02); archive contains only pipeline state fields
- **Correctness:** `mergeState()` must produce a state object identical to the pre-archive state (round-trip fidelity); test with a fixture that archives and reconstitutes stories
- **Performance:** Viz render with 50+ stories (fixture) within 2 seconds (AC5)
- **Schema integrity:** `archivedStoryCount` field added to `pipeline-state.schema.json` under story and/or epic shape before use in viz code

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — extends existing psa.1 archive infrastructure; viz change is additive (toggle only, no layout changes)

## Definition of Ready Pre-check

See: artefacts/2026-04-19-skills-platform-phase4/dor/p4-obs-archive-dor.md

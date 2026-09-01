## Story: Feature Discovery from Pipeline-State Index
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Discovery reference:** artefacts/new-feature-af17f555/discovery.md
**Benefit-metric reference:** artefacts/new-feature-af17f555/benefit-metric.md
## User Story
As a **Platform owner**,
So that [observable outcome].
## Benefit Linkage
[Not specified by the definition session]
## Architecture Constraints
ADR-023 (disk canonical), ADR-009 (injectable adapters), no new npm dependencies
## Dependencies
None
## Acceptance Criteria
**So that** I can see all in-progress features I've started in Claude Code, I need the web UI to read `.github/pipeline-state.json` and display them, with a way to continue each one into a session.

**Given** a connected repo with `.github/pipeline-state.json` containing at least one feature at stage ≠ [completed, archived, released] that has no corresponding journey record yet (i.e. a CLI-only feature),
**When** I open the Journeys page (`/journey`),
**Then** that feature appears in the feature list alongside journey-store-originated features, with name, current stage badge (from pipeline-state.json's `stage`), last-modified date (from pipeline-state.json's `updatedAt`, not `createdAt`), and the same "Continue →" action already used for every other card on this page.

**Given** a feature that is at a terminal stage (completed, archived, released) in pipeline-state.json,
**When** I open the Journeys page,
**Then** that feature does not appear in the list — same terminal-stage exclusion the epic always intended, now enforced across both journey-store-originated and pipeline-state.json-originated entries.

## Revision Note (2026-09-01)
The original AC (below, superseded) targeted "the web UI skill picker" (`/skills`), assuming no in-progress feature visibility existed yet. As of this date, that assumption is false: the Journeys page (`/journey`) already has a working "Continue →" mechanism that resumes a feature into a session (`journey.js`'s `handleGetJourneyResume`) — it just reads exclusively from the Web UI's own internal journey-store, not `.github/pipeline-state.json`, so CLI-only features (which may have no journey record at all — the exact gap ep1-s3 exists to backfill) never appear there, and its date field is `createdAt` rather than last-modified. The literal `/skills` skill picker itself has zero feature-awareness and was never a good fit — building a *second*, parallel "continue a feature" mechanism there would fragment the UX this whole epic exists to unify. Revised AC targets extending the *existing* Journeys page instead: merge in any pipeline-state.json feature (filtered to non-terminal stage) that has no journey-store record, reusing the already-proven Continue action unchanged. See `decisions.md` for the full rationale and the investigation that surfaced this.

**Superseded original AC:**
**Given** a connected repo with `.github/pipeline-state.json` containing at least one feature at stage ≠ [completed, archived, released],
**When** I open the web UI skill picker,
**Then** I see all non-terminal features listed with name, current stage badge, last modified date, and a "Continue" button.

## Out of Scope
- Two-way conflict resolution between surfaces
- Real-time sync or background polling
- Archive/release workflow automation
- Search or filtering by feature properties
- Any change to `/skills` (the literal skill picker) — out of scope per the 2026-09-01 revision above
- Any change to the Continue action's own resume mechanism (`handleGetJourneyResume`) — reused unchanged; this story only adds pipeline-state.json-originated cards to the list it already renders
## NFRs
Feature list fetch ≤2 seconds; graceful fallback if pipeline-state.json unreachable; terminal stages (completed, archived, released) excluded; stalled features included
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->

## Story: Artefact Resolution and HANDOFF CONTEXT Population
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Discovery reference:** artefacts/new-feature-af17f555/discovery.md
**Benefit-metric reference:** artefacts/new-feature-af17f555/benefit-metric.md
## User Story
As a **Platform owner**,
So that [observable outcome].
## Benefit Linkage
[Not specified by the definition session]
## Architecture Constraints
ADR-023 (disk authoritative, read fresh), Node.js fs.readFileSync() acceptable, no new npm dependencies, GitHub OAuth token sufficient scope
## Dependencies
ep1-s1
## Acceptance Criteria
**So that** prior work (discovery, benefit-metric, definition, etc.) is automatically available when I resume a feature, I need the web UI to read artefact files from disk and inject them into the session's HANDOFF CONTEXT.

**Given** a feature selected from the in-progress list with *Artefact path fields populated in pipeline-state.json,
**When** I click "Continue" and the session starts,
**Then** all artefact files referenced in *Artefact fields are read from disk and injected into HANDOFF CONTEXT without corruption or truncation.
## Out of Scope
- Merging conflicting artefact versions across surfaces
- Automatic regeneration of downstream artefacts
- Diff or comparison view between CLI and web UI versions
- Versioning or history of artefacts
## NFRs
≥98% handoff success rate; if file does not exist on disk, log warning and exclude (graceful degradation); if unreadable, log and exclude; session starts even if all reads fail (empty prior context)
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->

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

**Given** a feature selected from the in-progress list, for a stage that produces a single file (discovery, clarify, benefit-metric, design, and — post-`wsap-s1` — test-plan and definition-of-ready via their story-scoped subdirectory),
**When** I click "Continue" and the session starts,
**Then** the corresponding artefact file(s) are read from disk and injected into HANDOFF CONTEXT without corruption or truncation, resolved via that stage's known path or subdirectory rather than a `pipeline-state.json` `*Artefact` singular-path field (see Revision Note below).

**Given** a feature selected from the in-progress list, for a stage that produces multiple files per stage (`definition` → `epics/*.md` + `stories/*.md`; `review` → `review/*-review-*.md`),
**When** I click "Continue" and the session starts,
**Then** every file found in that stage's directory is read from disk and injected into HANDOFF CONTEXT as its own prior artefact — not just the first one found, and not skipped because no singular path field names it.
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

## Revision Note (2026-09-01)
The original AC ("all artefact files referenced in *Artefact fields") assumed one file per stage via singular `pipeline-state.json` path fields. This was corrected alongside `design.md`'s Component 2 revision — `definition` and `review` stages produce multiple files per stage on both the CLI (always did) and Web UI (as of `darc-s1`, PR #807) sides, and must be resolved by directory scan, not a singular field. See `artefacts/new-feature-af17f555/design.md` Revision Log and `artefacts/2026-09-01-definition-review-artefact-consistency/` (darc-s1) for the full rationale.

## Revision Note 2 (2026-09-02) — scope drastically narrowed after investigation

Before writing an implementation plan, investigated `src/web-ui/routes/skills.js`'s `buildSystemPrompt()` and found this story's core mechanism **already exists** — shipped years before this story was written, by an unrelated commit (`1b1d0682`, "phase-0: authorization guard module + route wiring"). A disk-scan block (`skills.js` ~line 1946-1982) already reads every file under the feature's artefact directory, and for any file whose top-level directory is in a `_KEY_DIRS` list, reads its full content and injects it into HANDOFF CONTEXT — unconditionally, for every skill and every session (new or resumed), including the CLI-backfilled-continue flow `ep1-s1`/`ep1-s3` just shipped. This already fully satisfies this story's second AC (multi-file stage resolution) for `stories/` and `review/`, since `_KEY_DIRS = ['stories', 'review', 'test-plans', 'verification-scripts']`.

**The one confirmed real gap:** `_KEY_DIRS` does not include `'epics'` — `epics/*.md` (the epic-level file `/definition` also produces) is never scanned or injected. This story's implementation is now scoped to exactly that one-line fix, plus adding `'dor'` to the same list (a related, adjacent gap found during the same investigation — the CLI-backfill flow produces a bogus flat `definition-of-ready.md` `priorArtefacts` entry with no `dor/` directory backstop, unlike `test-plans` which already has one). See `decisions.md` (2026-09-02) for the full investigation writeup.

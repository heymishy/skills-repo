Slicing strategy: walking-skeleton

## Epic 1 — Cross-Channel Feature Continuity

### ep1-s1 — Feature Discovery from Pipeline-State Index

**Persona:** Platform owner

**So that** I can see all in-progress features I've started in Claude Code, I need the web UI to read `.github/pipeline-state.json` and display them in the skill picker.

**Given** a connected repo with `.github/pipeline-state.json` containing at least one feature at stage ≠ [completed, archived, released],
**When** I open the web UI skill picker,
**Then** I see all non-terminal features listed with name, current stage badge, last modified date, and a "Continue" button.

**Out of scope:**
- Two-way conflict resolution between surfaces
- Real-time sync or background polling
- Archive/release workflow automation
- Search or filtering by feature properties

**Dependencies:** None

**NFR:** Feature list fetch ≤2 seconds; graceful fallback if pipeline-state.json unreachable; terminal stages (completed, archived, released) excluded; stalled features included

**Architecture Constraints:** ADR-023 (disk canonical), ADR-009 (injectable adapters), no new npm dependencies

**Complexity:** 1

---

### ep1-s2 — Artefact Resolution and HANDOFF CONTEXT Population

**Persona:** Platform owner

**So that** prior work (discovery, benefit-metric, definition, etc.) is automatically available when I resume a feature, I need the web UI to read artefact files from disk and inject them into the session's HANDOFF CONTEXT.

**Given** a feature selected from the in-progress list with *Artefact path fields populated in pipeline-state.json,
**When** I click "Continue" and the session starts,
**Then** all artefact files referenced in *Artefact fields are read from disk and injected into HANDOFF CONTEXT without corruption or truncation.

**Out of scope:**
- Merging conflicting artefact versions across surfaces
- Automatic regeneration of downstream artefacts
- Diff or comparison view between CLI and web UI versions
- Versioning or history of artefacts

**Dependencies:** ep1-s1

**NFR:** ≥98% handoff success rate; if file does not exist on disk, log warning and exclude (graceful degradation); if unreadable, log and exclude; session starts even if all reads fail (empty prior context)

**Architecture Constraints:** ADR-023 (disk authoritative, read fresh), Node.js fs.readFileSync() acceptable, no new npm dependencies, GitHub OAuth token sufficient scope

**Complexity:** 2

---

### ep1-s3 — Journey Record Backfill from CLI

**Persona:** Platform owner

**So that** the web UI correctly understands which stages have been completed in Claude Code, I need the web UI to automatically create a journey record on first selection of a CLI-progressed feature.

**Given** a feature selected that has no existing journey record in journey-disk.js,
**When** the session starts,
**Then** a new journey record is created with journeyId, featureSlug, createdAt, updatedAt, completedStages (inferred from pipeline-state.json's stage field), and cliAdoptionTimestamp / cliAdoptionArtefactHashes baseline. PostHog event `journey_backfilled_from_cli` and server log are emitted. Process is idempotent — re-selecting never creates duplicate records.

**Out of scope:**
- Conflict resolution if journey record exists with different stage markers
- Manual operator control over backfill (automatic, not gated by approval)
- Cross-surface provenance tracking
- Revision history of journey records

**Dependencies:** ep1-s2

**NFR:** Backfill automatic and silent; idempotency check prevents duplicates; disclosure "Continuing from Claude Code — history before [date] reflects CLI sessions" shown once (non-blocking); audit trail via PostHog + server log

**Architecture Constraints:** ADR-023 (pipeline-state.json authoritative for stage), journey-disk.js schema supports cliAdoptionTimestamp / cliAdoptionArtefactHashes, no new npm dependencies

**Complexity:** 2

---

### ep1-s4 — Stage-Based Skill Routing and Navigation

**Persona:** Platform owner

**So that** I don't have to choose which skill to run next, the web UI automatically routes me to the appropriate next skill based on the feature's current stage and completed stages.

**Given** a feature at a known stage in pipeline-state.json with a journey record showing completedStages,
**When** I select the feature and the session starts,
**Then** the web UI determines next appropriate skill using routing table (ideation→discovery, discovery→spike or benefit-metric, etc.) and lands session on that skill. Stage selector menu is visible; backward navigation available to any earlier stage; forward navigation only for later stages.

**Out of scope:**
- Automatic regeneration of downstream artefacts if earlier stage revised
- Materiality check display or operator approval
- Custom skill ordering or squad-specific routing overrides
- Multi-branch skill paths based on feature properties

**Dependencies:** ep1-s3

**NFR:** Routing table deterministic and covers all valid transitions; backward navigation keyboard-accessible (arrow keys, Enter); no UI blocks operator continuation if prior stage missing; stage selector updates on every skill transition

**Architecture Constraints:** Stage field from pipeline-state.json, routing logic pure and testable, backward navigation triggers materiality check (existing res-s1-s4 pattern), no new npm dependencies

**Complexity:** 2

---

### ep1-s5 — Error Handling and Graceful Degradation

**Persona:** Platform owner

**So that** transient file I/O errors, encoding issues, or missing artefacts do not block feature continuation, I need the web UI to log errors and gracefully degrade.

**Given** any error: pipeline-state.json unreachable, artefact file missing, artefact file unreadable, journey backfill fails, stage routing indeterminate,
**When** error occurs,
**Then** web UI logs error to server stdout and PostHog, excludes affected component, allows session to start. Operator receives minimal, non-blocking disclosure if critical data missing (e.g., "Feature history incomplete — some prior artefacts could not be loaded").

**Out of scope:**
- Automatic retry logic or exponential backoff
- User-initiated "reload artefacts" button within active session
- Admin dashboard for error monitoring
- Email alerts or Slack notifications

**Dependencies:** ep1-s2, ep1-s3, ep1-s4

**NFR:** No error blocks session start (graceful degradation); all errors logged with context (featureSlug, stage, errorType, timestamp); PostHog events: `artefact_load_error`, `journey_backfill_error`, `stage_routing_error`; operator messages one-liners, non-blocking, in session header

**Architecture Constraints:** ADR-009 (error handling preserves injectable adapter pattern; errors caught, not propagated), no new npm dependencies

**Complexity:** 1

---

### ep1-s6 — Audit Logging and PostHog Instrumentation

**Persona:** Platform owner

**So that** the platform team can measure adoption, debug issues, and validate benefit metrics, I need all cross-channel continuity events logged and emitted to PostHog.

**Given** any event: feature discovered, feature selected, journey backfilled, artefact loaded, session started from CLI-progressed feature, stage navigation, error encountered,
**When** event occurs,
**Then** event logged to server stdout with [cross-channel] prefix and structured fields (featureSlug, stage, eventType, timestamp, operatorId if available), and emitted to PostHog with same fields plus event-specific details (artefactCount, loadTimeMs, errorType).

**Out of scope:**
- Real-time analytics dashboard (PostHog for asynchronous analysis only)
- Operator-facing logging UI or trace view
- Retention policy or data deletion workflows
- Custom PostHog cohort or funnel definitions

**Dependencies:** ep1-s1 through ep1-s5

**NFR:** All PostHog events include featureSlug, stage, eventType, timestamp, userId; server logs structured (JSON); PostHog calls fire-and-forget (errors in PostHog do not block session)

**Architecture Constraints:** PostHog client already initialized (no new dependency), log format matches existing server conventions, no new npm dependencies

**Complexity:** 1

---

*Backfilled 2026-09-01 from the production journey record (af17f555-dfa9-4f66-910b-32bec32d66b7) — see artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md and the dcuf-s1 fix (PR #806). Reconstructed byte-by-byte from the journey's raw saved markdown source (edit-mode textarea), verified gap-free across all 6 stories.*

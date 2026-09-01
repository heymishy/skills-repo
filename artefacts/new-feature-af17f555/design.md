# Design: Cross-Channel Feature Continuity

**Status:** Ready for definition

**Date:** 2026-08-27

**Feature slug:** 2026-08-27-cross-channel-feature-continuity

---

## Solution Architecture

### Overview

The web UI ingests in-progress features from `.github/pipeline-state.json`, resolves their prior artefacts from disk using the pipeline-state.json's embedded artefact path index, backfills missing journey records silently in the background, and allows operators to continue features at the next appropriate skill based on current stage.

The architecture solves two distinct problems:

1. **Visibility gap:** Features started in Claude Code are invisible to the web UI's skill picker
2. **Continuity gap:** Even if visible, prior artefacts (discovery, clarify, benefit-metric, etc.) would not load into the session's HANDOFF CONTEXT because journey-disk.js only tracks web-UI-created journeys

Both gaps are bridged without requiring operators to switch workflows or fork the repository — features progress naturally across surfaces.

---CANVAS-JSON: {"type":"system-architecture","title":"Cross-Channel Feature Continuity","content":{"mermaid":"flowchart TD\n WebUI[Web UI]\n PSJ[pipeline-state.json]\n Disk[artefacts disk]\n JD[journey-disk.js]\n SK[Skill Session]\n WebUI -->|select feature| PSJ\n PSJ -->|artefact paths| Disk\n Disk -->|read fresh| SK\n WebUI -->|backfill| JD\n JD -->|completedStages| SK\n PSJ -->|stage field| SK"}}---

### Component 1: In-Progress Feature Discovery

**Entry point:** Skill picker or dedicated "In Progress" view in web UI

**Source of truth:** `.github/pipeline-state.json` features array (fetched per connected repo via pipeline-state-fetch-adapter.js)

**Filter logic:**

```js
const terminalStages = ['completed', 'archived', 'released']
const inProgressFeatures = features.filter(f => !terminalStages.includes(f.stage))
```

Stalled features are intentionally included — they represent paused work that operators may resume.

**Display:** Feature name, current stage badge, last modified date (from pipeline-state.json's `updatedAt`), and a "Continue" button.

### Component 2: Artefact Resolution from Pipeline-State Index

**Pattern:** ADR-023 (disk canonical, always read fresh before handoff)

**Mechanism:** `.github/pipeline-state.json` already carries an embedded artefact path index as standard fields:

- `discoveryArtefact` — path to discovery.md
- `benefitMetricArtefact` — path to benefit-metric.md
- `designArtefact` — path to design.md
- `storyArtefact` — path to story.md
- `dorArtefact` — path to dor.md
- `dorContractArtefact` — path to dor-contract.md
- `reviewArtefact` — path to review.md
- `testPlanArtefact` — path to test-plan.md
- (and others per schema)

**Resolution process:**

1. Operator selects a feature from the in-progress list
2. Web UI reads pipeline-state.json for that feature's stage and `*Artefact` path fields
3. For each populated `*Artefact` field, read the file from disk synchronously (using Node.js fs built-ins)
4. Construct a `{ path, content }` object per artefact
5. Pass the resulting array into the existing `priorArtefacts` mechanism (skills.js line ~2457) — the same shape that journey-store.js's `completedStages.map()` already produces
6. `buildSystemPrompt()` and `registerHtmlSession()` consume this array unchanged — no new code paths required

**Error handling:**

- If an `*Artefact` path is populated but the file does not exist on disk, log a warning and exclude it from the array (do not block session start)
- If a file exists but is unreadable (encoding error, permission denied), log and exclude
- If all artefact reads fail, session still starts with empty prior context (graceful degradation)

### Component 3: Journey Record Backfill

**Trigger:** First time an operator selects a CLI-progressed feature (one with no existing journey record in journey-disk.js)

**Behavior:** Silent, automatic, idempotent

**Mechanism:**

At the moment `registerHtmlSession()` is called (skill session start), before building the system prompt:

1. Check for an existing journey record by featureSlug: `_getJourneyByFeatureSlug(featureSlug)`
2. If found, use it; proceed with existing code path
3. If not found:
   - Create a new journey record with journeyId, featureSlug, createdAt, updatedAt
   - Populate `completedStages` from pipeline-state.json's `stage` field (e.g., if stage = "definition", mark discovery, spike, benefit-metric, and definition as completed)
   - Stamp a baseline snapshot: `cliAdoptionTimestamp = now`, `cliAdoptionArtefactHashes = { discoveryArtefact: hash(discovery.md), ... }`
   - Write the record to journey-disk.js (same pattern as journey creation from the skill picker)
   - Emit a PostHog event: `journey_backfilled_from_cli` with featureSlug, stage, adoptionTimestamp
   - Log to server stdout: `[journey] Backfilled journey for [featureSlug] from pipeline-state.json stage=[stage]`
4. Proceed with skill session using the (now-existing) journey record

**Idempotency:** The `_getJourneyByFeatureSlug(featureSlug)` check ensures re-selecting the same feature never creates a second record.

**Disclosure (non-blocking):** After backfill, display a small, inline message in the skill session header:

> "Continuing from Claude Code — history before [cliAdoptionTimestamp formatted as date] reflects CLI sessions"

This disclosure is shown once per session; it does not block session start or present a confirmation prompt.

### Component 4: Stage-Based Skill Navigation

**Next appropriate skill resolution:**

When a feature is selected and a session starts, the web UI determines the next skill based on pipeline-state.json's `stage` field and the journey's `completedStages`:

| Stage | Next Skill | Notes |
|-------|-----------|-------|
| ideation | discovery | Starting point |
| discovery | spike (optional) → benefit-metric | Spike is conditional; if spike.recommendation = "no-build", skip to terminal |
| spike | benefit-metric | |
| benefit-metric | estimate (optional) → definition | Estimate is conditional; runs only if DoR.estimationRequired = true |
| definition | review | |
| review | test-plan (optional) → dor-gate | Test-plan runs for engineering surface types only |
| dor-gate | release (terminal) | |

**Conditional side trips** (accessible via stage selector menu at any time):

- clarify — resurface discovery for refinement
- spike — re-run spike
- estimate — run/re-run estimation
- trace — record delivery trace after inner loop completion
- (others per SKILL.md registry)

**Backward navigation via stage selector:** Operator can click any earlier stage in the nav menu to jump backward. This follows the res-s1-s4 materiality model:

- Backward moves preserve forward progress (res-s1 baseline behavior)
- If the operator revises an earlier stage, materiality check fires (res-s3)
- Materiality nudge presents options: flag downstream stages, leave as-is, or respond freely (res-s4)
- No automatic regeneration of downstream artefacts (res-s2 scope boundary)

## UX / Interaction Design

### Entry Point: In-Progress Feature List

**Flow:**

1. Operator opens web UI skill picker or navigates to "In Progress" view
2. Web UI fetches `.github/pipeline-state.json` and displays all features not in terminal stages
3. Each feature shows: name, current stage (badge), last modified date, "Continue" button
4. Operator clicks "Continue"

**Visual hierarchy:**

- Features with `stage = stalled` appear with a distinct badge color (e.g., amber) — visually distinct from active stages
- Completed/archived features are hidden by default (filtered out); a link offers "Show archived" if needed

### Session Start: Feature Selection → Skill Landing

**Flow:**

1. Operator clicks "Continue" on a feature
2. Web UI fetches pipeline-state.json for that feature's full record
3. Backfill check runs (silent; no operator action required)
4. Artefact resolution reads all `*Artefact` paths from disk
5. HANDOFF CONTEXT is populated with prior artefact content
6. Skill session starts on the next appropriate skill (determined by stage field)
7. If backfilled, a single-line disclosure appears in the session header: "Continuing from Claude Code — history before [date] reflects CLI sessions"
8. Skill prompt loads with full HANDOFF CONTEXT, including prior artefacts

### Skill Navigation: Stage Selector Menu

Visible at all times in the skill session panel:

- Left sidebar or top nav shows current stage and adjacent stages
- Clicking any earlier stage opens a confirmation: "Move back to [stage]? This will show you prior artefacts and any revisions since then." (No approval gate; confirmation only)
- Clicking a stage later in the sequence is disabled if prerequisites are not completed
- If operator revises an earlier stage, materiality check prompt appears (res-s3/res-s4 model — non-blocking, operator decides)

### Error States

**Missing artefact on disk:**

- Session still starts; affected artefact is silently omitted from HANDOFF CONTEXT
- Server logs the omission; operator is not interrupted
- Rationale: a feature partially progressed in CLI may not have all artefacts written yet; session should still be continuable

**Journey backfill fails:**

- Log the error and continue with empty completedStages (session still starts)
- Operator may experience stage-nav UX issues (unclear which skills are available), but work is not blocked
- Fix: platform team reviews server logs and addresses root cause (disk permission, encoding, etc.)

**Pipeline-state.json unreachable:**

- Skill picker already handles this gracefully (shows "Unable to load in-progress features" and offers manual entry)
- No new error handling required; rely on existing pattern

## Accessibility

- Stage selector menu is keyboard-navigable (arrow keys, Enter to select)
- "Continuing from Claude Code" disclosure is not visually hidden for screen readers (standard text, no aria-hidden)
- No new WCAG 2.1 AA violations introduced
- Materiality check prompt (res-s3/res-s4) is already accessible; no changes needed

## Design System Compliance

- Feature list uses existing `.feature-card` component from design system (if available) or standard HTML list semantics
- Stage badges use existing badge component (if available) or semantic `<span class="stage-badge">`
- Materiality prompt reuses existing prompt/modal styling (matches review skill, trace skill, etc.)
- No new components; all visual patterns already exist in the web UI

## Decisions and Open Questions

### Decisions Made

- **Silent backfill, loud audit trail** — journey record creation is automatic and idempotent, not gated by operator approval. Reasoning: backfill is purely additive and has no "wrong answer" the operator would need to reject; following precedent from journey creation ("Start journey →") which is also silent. Audit events (PostHog, server logs) surface the action for investigation if needed.
- **Exclusion filter for terminal stages** — in-progress view filters out completed/archived/released features. Stalled features are included because they represent paused work operators may resume. Reasoning: archival script is manual and infrequent; defensive filtering prevents showing released features as "continuable."
- **No cross-surface provenance in v1** — backfill stamps a baseline timestamp/hash, but materiality checks do not reference "this was also changed in Claude Code on [date]." Reasoning: provenance tracking is out of scope (res-s1-s4 design treats pre-revision state as transient in-memory, not queryable history). Stamping the baseline enables v2 to add provenance without rearchitecting.
- **Graceful degradation on missing artefacts** — if an artefact path is populated in pipeline-state.json but the file does not exist on disk, omit it from HANDOFF CONTEXT rather than blocking session start. Reasoning: CLI-progressed features may be partially complete; forcing all artefacts to exist before continuation would be unnecessarily restrictive.
- **Stage-based skill routing (not skill picker)** — operator selects a feature, lands directly on next skill; optional backward nav via menu. Reasoning: reduces friction for continuation workflows; the "what skill should I run?" decision has already been made by the stage field.

### Open Questions (Non-Blocking for Definition)

- **Materiality disclosure verbosity:** The one-line disclosure "history before [date] reflects CLI sessions" is minimal. Should the UI also surface "last updated in CLI on [timestamp]" or "last updated via web UI on [timestamp]" (if backfilled record captures that)? Defer to definition; current language is sufficient for MVP.
- **Feature list sort order:** Should in-progress features be sorted by last-modified descending, or by stage progression? Current spec does not prescribe sort. Defer to UX design; recommend "most recently updated" as default.
- **Backfill completedStages inference:** When backfilling a journey for a feature at stage = "definition", should completedStages include all prior stages, or only up to the last one the operator explicitly ran? Current design assumes "all prior stages" (e.g., if stage = "definition", completedStages = [discovery, spike, benefit-metric, definition]). Confirm intent in definition.

### Assumptions

- [CONFIRMED] `.github/pipeline-state.json` is fetched per connected repo and carries `*Artefact` path fields (discoveryArtefact, benefitMetricArtefact, etc.)
- [CONFIRMED] Disk is the canonical source for artefact content (ADR-023); reading fresh from disk before session start is the established pattern
- [CONFIRMED] GitHub OAuth token scope is sufficient for web UI to read artefacts from the connected repo
- [CONFIRMED] Existing priorArtefacts mechanism (journey-store.js) consumes `{ path, content }` array shape; no new data structures needed
- [CONFIRMED] Materiality check (res-s1-s4) fires correctly on disk-state changes regardless of surface origin
- [TO VERIFY IN DEFINITION] Backfill completedStages inference (all prior stages vs. last-completed-only)

## Non-Functional Requirements

- **Performance:** Feature list fetch and artefact resolution must complete within 2 seconds on typical network (repo with ~100 features in pipeline-state.json). Read from disk (Node.js `fs.readFileSync()`) is synchronous and fast; this is acceptable for session-start flow (not blocking UI interactivity before artefact load).
- **Reliability:** If artefact reads fail, session must still start (graceful degradation). No "stuck" sessions due to missing files.
- **Auditability:** Backfill events are logged to PostHog and server stdout with featureSlug, stage, and timestamp. No backfill occurs without an audit trail.
- **Idempotency:** Selecting the same CLI-progressed feature multiple times in separate sessions must never create duplicate journey records. Keyed by featureSlug; defensive check before creation.

## Definition Prerequisites

- [ ] Confirm backfill completedStages inference logic (all prior stages vs. last-completed-only)
- [ ] Determine feature list sort order (last-modified or stage progression)
- [ ] Verify existing priorArtefacts array shape handles the new `{ path, content }` objects without modification
- [ ] Test artefact resolution with pipeline-state.json records from live repos (at least 3 features with varying stage/artefact path patterns)
- [ ] Confirm journey-disk.js schema supports `cliAdoptionTimestamp` and `cliAdoptionArtefactHashes` fields (or defer to implementation)

---

*Backfilled 2026-09-01 from the production journey record (af17f555-dfa9-4f66-910b-32bec32d66b7) — see artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md and the dcuf-s1 fix (PR #806). Reconstructed from the journey's rendered content; not a byte-identical copy of the original saved markdown source.*

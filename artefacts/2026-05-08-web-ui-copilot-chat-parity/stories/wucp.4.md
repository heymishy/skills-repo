## Story: Session start wizard — project/repo selection before journey begins

**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Discovery reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/discovery.md
**Benefit-metric reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/benefit-metric.md

## User Story

As a **platform operator using the web UI**,
I want to choose whether I'm starting a new project or continuing an existing one when I begin a journey session,
So that the session is immediately oriented to the right feature context — pipeline state, artefact listing, and workspace checkpoint are pre-loaded for the project I'm actually working on, not defaulting to the last active feature.

## Benefit Linkage

**Metric moved:** M3 — Outer loop completeness; MM2 — Unassisted replication
**How:** wucp.1 (pipeline context auto-loader) pre-loads context from `pipeline-state.json`, `workspace/state.json`, and the artefact listing. But without knowing *which* feature the operator is working on at session start, the auto-loader can only surface the last active feature. For a repo with 10+ active features at different stages, "last active" is the wrong answer half the time. The session start wizard gives the operator an explicit selection step — the chosen feature slug becomes the `activeFeatureSlug` for the session, and wucp.1's context load targets that slug's artefact listing precisely. This closes the gap that otherwise requires the operator to paste the feature slug manually.

## Architecture Constraints

- **wucp.1 dependency:** The session wizard sets `session.activeFeatureSlug`; wucp.1's `buildSystemPrompt()` reads it to scope the artefact listing. If wucp.1 has not shipped, this story's artefact-listing scoping is a no-op — but the wizard itself can ship independently since it only sets a session field
- **Journey stage coexistence:** The wizard is a pre-journey screen, not a journey stage. It must not mutate `stageIndex` or inject a stage into the journey sequence. Once the operator selects a project, journey stage 0 (currently `/discovery`) proceeds normally
- **No new npm dependencies:** Feature list is read from `pipeline-state.json` using `fs.readFileSync` + `JSON.parse`
- **ADR-023 path guard:** Not applicable — the feature slug is selected from a controlled allowlist (the `pipeline-state.json` features array), not from free-form request input. Slug is validated against the allowlist before use

## Dependencies

- **Upstream:** wucp.1 (for full benefit — artefact listing scoped to selected feature). Ships independently but delivers full value only when wucp.1 is live
- **Downstream:** Improves M3 measurement quality — the dogfood session (M3 validation) can now start on the right feature without manual slug entry

## Acceptance Criteria

**AC1:** Given the operator opens the web UI and starts a new journey session, When the journey loads, Then the first screen presented is a project selection prompt with two options: "New project" and "Existing project". The journey stage content (e.g. `/discovery` stage 0) does not appear until the operator has made a selection.

**AC2:** Given the operator selects "New project", When the selection is confirmed, Then a new session is initialised with no `activeFeatureSlug`, `stageIndex` is set to 0 (discovery), and the journey proceeds to the `/discovery` stage prompt. The session is in "new feature" mode — wucp.1's context loader loads `pipeline-state.json` and `workspace/state.json` globally but does not scope the artefact listing to any feature slug.

**AC3:** Given the operator selects "Existing project", When the selection is confirmed, Then the UI displays a list of active features read from `pipeline-state.json`. Each entry shows: feature name, current stage, and health indicator. Features with `stage: "released"` or `stage: "archived"` are excluded from the list.

**AC4:** Given the feature list is displayed, When the operator selects a feature, Then `session.activeFeatureSlug` is set to the selected feature's slug, the journey is initialised at the feature's current stage (e.g. if the feature is at `"review"`, `stageIndex` is set to the review stage position), and wucp.1's `buildSystemPrompt()` scopes the artefact listing to `artefacts/[activeFeatureSlug]/`.

**AC5:** Given `pipeline-state.json` is absent or unreadable, When the operator selects "Existing project", Then the UI displays an informational message: "No pipeline state found. Starting a new project." and proceeds as per AC2 (new project flow). No error is thrown.

**AC6:** Given the operator has previously started a session and returns (browser refresh or re-open within the same server session), When the journey loads, Then if `session.activeFeatureSlug` is already set, the wizard is skipped and the journey resumes at the stored stage. If the session has expired, the wizard is shown again.

## Out of Scope

- Creating a new git repository from the wizard — "New project" initialises the session context only; actual repo creation is outside the web UI's scope
- Searching or filtering the feature list — the list is short enough (typically 3–10 active features) that a simple rendered list is sufficient for MVP
- Archiving or deleting features from the wizard — read-only view of pipeline-state.json
- Multi-repo selection (selecting a different repository root) — the server is bound to a single repo root at startup; cross-repo switching is a separate post-MVP capability

## NFRs

- **Performance:** Feature list read from `pipeline-state.json` and rendered in under 200ms. File is read at request time (no background polling).
- **Security:** Feature slug selected by the operator is validated against the allowlist from `pipeline-state.json` before being written to session. A slug not in the allowlist → rejected with HTTP 400 — no session mutation.
- **Accessibility:** The project selection prompt must be keyboard-navigable. Both options ("New project" / "Existing project") must be reachable by Tab and activatable by Enter. Feature list items must have clear focus states.

## Complexity Rating

**Rating:** 2 (clear path; the main ambiguity is how to map "existing feature's current stage" to a `stageIndex` — requires a stage-name → index lookup that must align with the journey stage sequence)
**Scope stability:** Stable

## Scope Accumulator Note

This story is a scope addition beyond the three capability gaps in the original discovery. Justification: the context auto-loader (wucp.1) delivers partial value without a project selection step — operators must still manually identify which feature to work on. This story makes the auto-loader's benefit fully realised. Without it, M3 (outer loop completeness) cannot be validated without the operator injecting a feature slug by hand at session start.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story (ships independently; wucp.1 unlocks full value)
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

## Story: Add a Distinguishable Durability Signal for Stage-Completion Commits

**Epic reference:** artefacts/2026-09-01-artefact-commit-durability-gap/epics/stage-completion-artefact-durability.md
**Discovery reference:** artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md
**Benefit-metric reference:** artefacts/2026-09-01-artefact-commit-durability-gap/benefit-metric.md

## User Story

As a **Developer / engineer**,
I want every stage-completion commit attempt to log one of three distinguishable outcomes (succeeded, failed, skipped-as-repo-less),
So that I — or a future investigator — can answer "does this stage have durable git backing?" without a manual GitHub cross-check.

## Benefit Linkage

**Metric moved:** Distinguishable Signal Coverage, Manual-Audit Elimination
**How:** Every code path through `das-s1`'s commit-writer emits a `[cross-channel]` event via the shared `_logCrossChannelEvent` helper, making the previously-invisible distinction between "succeeded," "failed," and "genuinely skipped" observable in server logs and PostHog without touching the GitHub API.

## Architecture Constraints

- Must reuse `ep1-s6`'s shared `_logCrossChannelEvent(eventType, context)` helper (`src/web-ui/routes/journey.js`) — per `decisions.md`, do not build a parallel logging mechanism. The commit-writer's call site already lives in `journey.js` itself, so no cross-file require is needed.
- No new npm dependencies.
- Event types: `artefact_commit_succeeded`, `artefact_commit_failed`, `artefact_commit_skipped`.

## Dependencies

- **Upstream:** Story acdg-s1 must be DoD-complete — this story's `artefact_commit_failed` event should log the real failure reason found and fixed there, so the signal accurately reflects the corrected guard's actual behaviour rather than a guessed-at reason string.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a stage completes and its artefact commit succeeds, When `completeStage()` proceeds, Then a `[cross-channel]` log line and PostHog event with `eventType: "artefact_commit_succeeded"` is emitted, including `featureSlug`, `stage`, and `timestamp`.

**AC2:** Given a stage completes and its artefact commit fails (per `acdg-s1`'s fix, this now blocks completion), When the failure occurs, Then a `[cross-channel]` log line and PostHog event with `eventType: "artefact_commit_failed"` is emitted, including `featureSlug`, `stage`, `timestamp`, and a `reason` field describing the failure.

**AC3:** Given a stage completes for a feature whose product genuinely has no connected repo, When the commit is skipped (AC3 of `acdg-s1`, unchanged), Then a `[cross-channel]` log line and PostHog event with `eventType: "artefact_commit_skipped"` is emitted, including `featureSlug`, `stage`, `timestamp`, and `reason: "no connected repo"`.

**AC4:** Given any of the 3 events above, When the log line is inspected, Then it parses as valid JSON immediately after the `[cross-channel] ` prefix — matching `ep1-s6`'s own structured-JSON convention, not free-text interpolation.

## Out of Scope

- An operator-facing UI indicator surfacing durability status — server-side signal only for this story.
- Auditing other artefact-write paths in the codebase for the same silent-failure pattern.

## NFRs

- **Performance:** Logging and PostHog calls must be fire-and-forget, matching `ep1-s5`/`ep1-s6`'s established pattern — must not block or add latency to the stage-completion response.
- **Security:** Log lines must not include credentials or full artefact content — only `featureSlug`/`stage`/`eventType`/`timestamp`/`reason` metadata, matching `ep1-s6`'s existing field set.
- **Accessibility:** Not applicable — server-side/API-only change.
- **Audit:** This story is itself the audit-logging mechanism — no further audit requirement beyond what it delivers.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->

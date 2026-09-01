# Contract Proposal: Journey Record Backfill from CLI

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s3.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-01

---

## What will be built

A `backfillJourney(featureSlug)` function, called at the start of `registerHtmlSession()` before `buildSystemPrompt()` runs:

1. Check `_getJourneyByFeatureSlug(featureSlug)` — if a record exists, return it unchanged (idempotency).
2. If none exists: create a journey record with `journeyId`, `featureSlug`, `createdAt`, `updatedAt`, `completedStages` (inferred from pipeline-state.json's `stage` field — all stages up to and including the current one), and a baseline snapshot `cliAdoptionTimestamp` / `cliAdoptionArtefactHashes`.
3. Write the record to `journey-disk.js` using the same storage pattern as web-UI-originated journey creation.
4. Emit PostHog event `journey_backfilled_from_cli` and a structured server log line, both exactly once per backfill.

## What will NOT be built

- Conflict resolution if a journey record already exists with stage markers that disagree with pipeline-state.json — explicitly out of scope per the story
- Any operator-facing confirmation gate — backfill is silent and automatic, matching precedent set by ordinary (non-backfilled) journey creation
- Cross-surface provenance tracking beyond the single `cliAdoptionTimestamp` baseline stamp

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (auto-create, idempotent, correct completedStages inference, audit events) | Unit tests on `backfillJourney` directly (creation, idempotency, stage inference, event emission) + integration tests on full session-start flow | Unit + Integration |

## Assumptions

- `journey-disk.js`'s schema already supports `cliAdoptionTimestamp` / `cliAdoptionArtefactHashes` fields, per `design.md`'s "Definition Prerequisites" checklist item — to be confirmed at implementation time; if absent, adding these fields to the journey record schema is in scope for this story (it is the story that introduces them).
- pipeline-state.json's `stage` field is a reliable, ordered proxy for which outer-loop stages have completed — consistent with how every other story in this epic treats it.
- This story depends on ep1-s2 only in the sense that both read from the same feature's disk state; it does not call ep1-s2's `resolveArtefacts` function directly (journey backfill and artefact resolution are independent operations that both read pipeline-state.json).

## Estimated touch points

Files: `src/web-ui/journey-disk.js` (or equivalent — exact module TBD at `/implementation-plan`), `src/web-ui/routes/skills.js` (`registerHtmlSession()` wiring). Services: PostHog client (already initialized, no new dependency). Depends on: ep1-s2 (both consume the same feature disk-state reads, no direct call dependency).

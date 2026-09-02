# Contract Proposal: Add a Distinguishable Durability Signal for Stage-Completion Commits

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s2.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## What will be built

Wire the 3 durability-signal outcomes (`artefact_commit_succeeded`, `artefact_commit_failed`, `artefact_commit_skipped`) into `journey.js`'s stage-completion call site (`handlePostGateConfirm`), using the shared `_logCrossChannelEvent` helper `ep1-s6` already built — no new logging mechanism. The `reason` field for `artefact_commit_failed` reflects whatever failure mode `acdg-s1` confirmed and fixed.

## What will NOT be built

- `acdg-s1`'s own guard fix — this story assumes it is already DoD-complete.
- An operator-facing UI indicator.
- Auditing other artefact-write paths for the same pattern.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Trigger a successful stage completion; assert `[cross-channel]` log line with `eventType: "artefact_commit_succeeded"` and base fields | Unit |
| AC2 | Trigger `acdg-s1`'s confirmed failure mode; assert log line with `eventType: "artefact_commit_failed"`, base fields, and `reason` | Unit |
| AC3 | Trigger a genuine no-repo skip; assert log line with `eventType: "artefact_commit_skipped"`, base fields, `reason: "no connected repo"` | Unit |
| AC4 | Parse each captured log line (post `[cross-channel] ` prefix) as JSON | Unit |

## Assumptions

- `acdg-s1` is DoD-complete before this story's implementation begins — its PR description names the confirmed failure mode and reason text, which this story's AC2 test and `reason` field content depend on directly.
- `_logCrossChannelEvent` requires no changes to accept these 3 new event types — it already accepts an arbitrary `eventType` string and `context` object per `ep1-s6`'s own implementation.

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (the `_logCrossChannelEvent` calls added to `handlePostGateConfirm`'s existing das-s1 block), `tests/check-acdg-s2-*.js` (new).
Services: PostHog (existing integration, already wired).
APIs: None new.

# Phase 4 Backlog — Fleet skills-drift observability

**Title:** Fleet skills-drift observability — which squads are running stale skills
**Status:** NOT STARTED — Phase 4
**Owner:** Hamish
**Identified:** Operator review session 2026-04-16 — external contributor PR surfaced the absence of skills version visibility in the fleet panel
**Confirmed scope:** Whole-set staleness only; per-skill granularity deferred to Phase 5

---

## Problem statement

The fleet aggregator currently shows each squad's pipeline health and stage, but has no visibility into which version of the platform skills each squad is running. A squad that last synced from upstream 6 weeks ago is running stale skills — potentially missing governance improvements, bug fixes, or new skill capabilities — but the fleet panel shows them as "Healthy" with no staleness signal.

This is a real operational risk at enterprise scale: 50 squads running different versions of the skill set with no central visibility means governance drift is invisible until something breaks.

During Phase 3 validation (2026-04-16) an external contributor (craigfo) submitted a PR from their own fork of the platform. There was no mechanism to see whether they were running current skills or a stale version — the fleet panel showed nothing about their skill version state.

---

## Design approach

Confirmed by operator 2026-04-16: whole-set staleness via self-report + aggregator comparison. Per-skill granularity is deferred to Phase 5 once real multi-squad data exists.

### Part 1 — Squad self-reporting (sync script + pipeline-state.json)

When a squad runs `sync-from-upstream.ps1` or `sync-from-upstream.sh`, the sync script writes two new fields to `pipeline-state.json`:

- `upstreamSyncedAt` — ISO 8601 timestamp of the sync
- `skillsVersion` — the git SHA of upstream master at the time of the sync (captured via `git rev-parse skills-upstream/master`)

These fields are written atomically with the skill file changes — if the sync fails, the fields are not written.

### Part 2 — Fleet aggregator comparison + viz display

The fleet aggregator, when fetching each squad's `pipeline-state.json`, reads `upstreamSyncedAt` and `skillsVersion` and computes a `skillsDrift` field:

- `current` — `skillsVersion` matches current master SHA
- `behind` — `skillsVersion` does not match current master SHA; aggregator records commits-behind count via `git rev-list`
- `unknown` — `upstreamSyncedAt` or `skillsVersion` absent from `pipeline-state.json` (squad has not yet run a sync with the updated script)

The `fleet-state.json` entry for each squad gains three new fields:

- `skillsVersion` (string — upstream SHA at last sync)
- `upstreamSyncedAt` (string — ISO 8601)
- `skillsDrift` (enum: `current` / `behind` / `unknown`)

The fleet panel in `pipeline-viz.html` renders a skills drift indicator on each squad card:

- `current` → green "✓ Skills current" label
- `behind` → amber "⚠ Skills behind" label with last-synced date
- `unknown` → grey "? Sync unknown" label

---

## Acceptance criteria

**AC1:** Given a squad has run `sync-from-upstream` with the updated script, when `pipeline-state.json` is inspected, then `upstreamSyncedAt` and `skillsVersion` fields are present and non-empty.

**AC2:** Given the fleet aggregator runs, when it reads a squad's `pipeline-state.json` containing `skillsVersion`, then it computes `skillsDrift` by comparing `skillsVersion` against the current master SHA — outputting `current`, `behind`, or `unknown` in `fleet-state.json`.

**AC3:** Given `fleet-state.json` contains `skillsDrift` for a squad, when the fleet panel renders, then each squad card shows a skills drift indicator label matching the drift status — green for `current`, amber for `behind` with last-synced date, grey for `unknown`.

**AC4:** Given a squad whose `pipeline-state.json` has no `upstreamSyncedAt` or `skillsVersion` fields, when the aggregator runs, then `skillsDrift` is set to `unknown` and the squad card shows the grey "? Sync unknown" label — no error is thrown and no other squad's drift status is affected.

**AC5:** Given the fleet panel shows an amber "Skills behind" indicator for a squad, when a platform maintainer reads it, then the card shows the `upstreamSyncedAt` date so they can assess how stale the squad's skills are without opening the squad's repo.

---

## Out of scope

- Per-skill granularity (which specific skills are stale) — Phase 5
- Automated alerts or notifications when drift exceeds a threshold — Phase 5
- Forcing squads to sync before pipeline steps can proceed — this is observability only, not enforcement
- Changes to how skills are distributed — the sync script pattern is unchanged, only the version recording is added

---

## Architecture constraints

- **ADR-003 (schema-first):** `skillsVersion`, `upstreamSyncedAt`, and `skillsDrift` must be added to `pipeline-state.schema.json` in the same commit as any code that writes or reads them
- **ADR-009 (separate workflow permission scopes):** the aggregator's drift computation is read-only — it never writes to the squad repo
- The sync scripts (`ps1` and `sh`) must remain compatible with squads that have not yet updated — old sync scripts must not fail when run against a platform that now expects these fields

---

## Relationship to other backlog items

- Depends on p3.7 (cross-team trace registry) being DoD-complete — the aggregator patterns established there are the foundation
- Complements `workspace/phase4-backlog-second-model-review.md` — both address fleet-level governance visibility
- The `skillsVersion` field enables the compliance report (p3.13) to note which squads were running current skills at audit time

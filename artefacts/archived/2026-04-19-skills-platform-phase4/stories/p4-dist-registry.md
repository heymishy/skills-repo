## Story: Consumer registry and fleet visibility via fleet-state.json

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e2-distribution-model.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **see each consumer's current lockfile version, upstream source, and sync status recorded in `fleet-state.json`**,
So that **M1 measurement (sync success rate across real adopters) is objectively verifiable and I can see at a glance which consumers are stale or have diverged from the canonical upstream**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync; M2 — Consumer confidence
**How:** M1's target of ≥90% conflict-free sync is not verifiable without a registry of which consumers exist and what state they are in. The consumer registry makes M1 auditable. It also supports M2 — a visible registry signals to potential adopters that the platform has active, healthy consumers, which increases confidence in adoption.

## Architecture Constraints

- MC-CORRECT-02: fleet-state.json is a governed file — each consumer entry must conform to a JSON Schema declared in `scripts/` or `tests/`; a malformed entry (missing required field) must fail the `check-archive.js` or equivalent governance check in `npm test`; no new field may be written to fleet-state.json entries without a corresponding schema update
- ADR-004: the staleness threshold (how many releases behind qualifies as "stale") must be configurable in `.github/context.yml` under `distribution.fleet.stale_threshold` — not hardcoded in the registry update script
- MC-SEC-02: fleet-state.json must not contain consumer organisation names, team member names, email addresses, or other personal data — entries are keyed by consumer repo slug only

## Dependencies

- **Upstream:** p4.dist-lockfile — the registry reads the consumer's lockfile version to determine their sync state; p4.dist-upstream — the upstream source configured in context.yml is the reference point for staleness calculation
- **Downstream:** None — this is a visibility/measurement story; no implementation story depends on the registry

## Acceptance Criteria

**AC1:** Given a consumer has completed `skills-repo init` and their sidecar + lockfile exist, When `fleet-state.json` is updated (manually or via the registry update command), Then the consumer's entry contains at minimum: `consumerSlug` (string), `lockfileVersion` (upstream pinned ref from their lockfile), `upstreamSource` (URL string from their lockfile), `lastSyncDate` (ISO 8601 date), and `syncStatus` (one of: `clean`, `stale`, `conflict`, `unknown`).

**AC2:** Given a consumer's `lockfileVersion` is more than `distribution.fleet.stale_threshold` releases behind the current upstream head (as configured in context.yml), When `fleet-state.json` is read, Then that consumer's entry has `syncStatus: "stale"` and includes a `versionsBehind` integer field — a freshly synced consumer has `syncStatus: "clean"` and no `versionsBehind` field.

**AC3:** Given `npm test` runs after any update to `fleet-state.json`, When the governance check runs, Then the check validates every consumer entry against the JSON Schema — any entry with a missing required field, an invalid `syncStatus` value, or a non-ISO-8601 `lastSyncDate` fails the check with a named error identifying the consumer slug and the failing field.

**AC4:** Given `distribution.fleet.stale_threshold` is absent from `.github/context.yml`, When the registry staleness check runs, Then a default threshold of 2 releases is applied — consumers are not marked stale on their first release behind without an explicit config.

## Out of Scope

- Real-time consumer monitoring (webhook, push notification, or automated polling) — fleet-state.json is a static file updated at manual or scheduled publish time; real-time monitoring is Phase 5
- Consumer opt-out or privacy controls — Phase 4 scope is internal to heymishy's platform; consumer privacy considerations are a Phase 5 concern when external organisations adopt
- Automated remediation of stale consumers — the registry reports state, it does not initiate upgrades on consumers' behalf

## NFRs

- **Security:** No personal data in fleet-state.json (MC-SEC-02); entries keyed by repo slug, not by person
- **Correctness:** JSON Schema validation enforced by CI test; no malformed entry may exist in a PR that modifies fleet-state.json (MC-CORRECT-02)
- **Performance:** Registry update script completes within 10 seconds for up to 50 consumer entries

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — the exact lockfile field used as the registry's `lockfileVersion` depends on the Spike C lockfile schema; if the schema uses a different field name (e.g. `pinnedRef` vs `version`), this story must be updated before it enters DoR

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-registry.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 4 |
| intermediates_produced | 13 |

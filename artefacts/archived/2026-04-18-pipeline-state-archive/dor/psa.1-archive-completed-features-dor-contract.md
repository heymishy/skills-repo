# DoR Contract: psa.1 — Archive completed features from pipeline-state.json

**Date:** 2026-04-18
**Story:** artefacts/2026-04-18-pipeline-state-archive/stories/psa.1-archive-completed-features.md

---

## What will be built

1. **Archive script** (`scripts/archive-completed-features.js`) — Node.js, no external deps. Reads `.github/pipeline-state.json`, moves DoD-complete features to `.github/pipeline-state-archive.json`, handles Phase 3 partial archive (split completed vs. in-flight stories), adds `"archive"` pointer field, validates JSON output, is idempotent.

2. **Viz merge** — Update `loadState()` in `dashboards/pipeline-viz.html` to fetch and merge archive file with active file at render time. Graceful fallback when archive file doesn't exist.

3. **Schema update** — Add `"archive"` string field to `.github/pipeline-state.schema.json`.

4. **Tests** (`tests/check-archive.js`) — 11 unit tests + 1 integration test + 2 NFR tests covering all 7 ACs. Uses synthetic JSON fixtures.

---

## What will NOT be built

- **Automatic archive on DoD write** — manual script invocation only (future scope)
- **Governance enforcement** — no test rejects completed features in active file (future scope)
- **Archive purging or compression** — append-only, no deletion
- **Fleet aggregator changes** — fleet reads from squad repos, not this file
- **Skill write path changes** — all skills continue writing to pipeline-state.json unchanged

---

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — DoD features moved to archive | T1 (move), T2 (integrity), T3 (idempotent) | unit |
| AC2 — Active file only in-flight | T4 (feature count), T5 (size reduction) | unit |
| AC3 — Viz merges archive + active | T6 (merge), T7 (missing archive) | unit |
| AC4 — Signal recording on archive | T8 (lookup + update) | unit |
| AC5 — npm test passes | T12 (post-archive npm test) | integration |
| AC6 — Archive pointer field | T9 (field check) | unit |
| AC7 — Phase 3 partial archive | T10 (in-flight stories), T11 (data preservation) | unit |

---

## Assumptions

1. "Completed feature" = `stage: "definition-of-done"` AND `health: "green"` — SPC feature (skills-platform-certification) is included
2. The archive script is invoked manually — no CI trigger
3. `pipeline-viz.html` can fetch both JSON files via relative path (both are in `.github/`)
4. The archive file does not need to conform to the same schema as the active file (it's an archive, not an active state file) — but its features array uses the same shape

---

## Estimated touch points

### Files to create
- `scripts/archive-completed-features.js`
- `.github/pipeline-state-archive.json` (output of first archive run)
- `tests/check-archive.js`
- `tests/fixtures/archive-test-fixture.json` (synthetic test data)

### Files to modify
- `.github/pipeline-state.json` (archive field added, completed features removed)
- `.github/pipeline-state.schema.json` (archive field definition)
- `dashboards/pipeline-viz.html` (loadState merge logic)

### Files out of scope
- `artefacts/**` — read-only
- `.github/skills/**` — not touched
- `.github/templates/**` — not touched
- `copilot-instructions.md` — not touched
- Any existing governance check scripts — not modified

# Discovery: Pipeline-state.json archive — reduce agent context load

**Feature slug:** `2026-04-18-pipeline-state-archive`
**Date:** 2026-04-18
**Status:** Approved
**Approved by:** Hamish, 2026-04-18

---

## Product context (extracted)

**Target users:** Pipeline operator (primary), coding agents (primary — they orient from pipeline-state.json at session start).
**Known constraints:** file-system-native, no proprietary runtime, no hosted service; `regulated: false`; personal-scope repo.
**Tech stack:** JavaScript/Node.js runtime; GitHub Actions CI; pipeline-state.json as ground-truth delivery state.

---

## 1. Problem statement

The active `pipeline-state.json` has grown to ~105 KB, with ~63% of its content being completed features from Phase 1, Phase 2, and the skill-performance-capture feature. When coding agents orient at session start (reading pipeline-state.json per copilot-instructions.md), this dead context consumes a significant portion of their context budget. D8 learning (workspace/learnings.md) identified this as the primary root cause of empty PRs #165 and #166 — agents that planned correctly but exhausted their context budget before executing file writes.

## 2. Who it affects

**Coding agents (GitHub Copilot, VS Code agent, Claude Code):** Must parse the full pipeline-state.json during orientation. Larger files mean less context remaining for implementation.

**Pipeline operator:** Cannot successfully dispatch stories to coding agents while the state file is oversized. D8 confirmed a 0% success rate for GitHub agent dispatches on this repo.

## 3. Why now

PRs #165 and #166 (stories p3.3 and p3.13) merged with zero file changes — the agent completed planning but ran out of context budget before writing code. These stories cannot be re-dispatched until the state file is reduced. The problem will worsen as more features complete and remain in the active file.

## 4. MVP scope

1. A `scripts/archive-completed-features.js` script that moves DoD-complete features (and DoD-complete stories within in-flight features) from `.github/pipeline-state.json` to `.github/pipeline-state-archive.json`.
2. A top-level `"archive"` pointer field in pipeline-state.json referencing the archive file path.
3. Dashboard `loadState()` updated to merge archive + active data at render time — no features hidden from the visualiser.
4. Schema update (`pipeline-state.schema.json`) to include the `archive` field.
5. Governance tests updated to pass with the reduced active file.

## 5. Out of scope

- Automatic archiving on DoD write (manual/scripted for now)
- Deleting or purging archived data — archive is append-only
- Enforcement via schema validation rejecting completed features in active file
- Fleet aggregator changes
- Compressing or minifying the archive file

## 6. Assumptions and risks

- **Assumption A1:** 63% of current pipeline-state.json content is archivable (Phase 1 + Phase 2 + skill-performance-capture features are all DoD-complete with green health).
- **Assumption A2:** Skills that write to pipeline-state.json target in-flight features only — archive is transparent to write paths.
- **Risk R1:** Phase 3 has a mix of completed and in-flight stories within the same feature block. The archive script must handle partial archival (completed stories within an in-flight feature).
- **Risk R2:** Dashboard merge logic must handle the case where the archive file does not yet exist (first run before any archival).

## 7. Directional success indicators

- Active pipeline-state.json reduced to ~15–20 KB after archiving.
- Agent dispatch success rate improves from 0% (D8 baseline) on re-dispatch of p3.3 and p3.13.
- `npm test` suite passes with the reduced active file.
- Dashboard renders the complete feature history (active + archived).

## 8. Constraints

- ADR-003 (Schema-first): any new top-level field must be added to pipeline-state.schema.json.
- ADR-001 (Single-file viz): dashboard must merge archive at render time — no build step.
- Existing skill write paths must not need modification.
- OWASP: no user-supplied content rendered without sanitisation.

---

## E1 estimate (rough — at discovery)

**Focus time:** ~2–3 hours operator focus for 1 story.
**Complexity:** 2 (Some ambiguity around partial archive of Phase 3 and viz merge.)
**Scope stability:** Stable.

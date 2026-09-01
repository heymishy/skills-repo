# Contract Proposal: Artefact Resolution and HANDOFF CONTEXT Population

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s2.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-01 (original) — **superseded 2026-09-02, see below**

---

> ⚠️ **Superseded 2026-09-02.** The contract below (a new `resolveArtefacts()` module) is kept verbatim for the audit trail. Investigation before `/implementation-plan` found the directory-scan mechanism this contract proposed to build **already exists** in `buildSystemPrompt()` (`src/web-ui/routes/skills.js` ~line 1946-1982), shipped by an unrelated commit years before this story existed. See `decisions.md` (2026-09-02) and `stories/ep1-s2.md`'s Revision Note 2 for the full investigation. **Revised contract follows.**

## Revised Contract Proposal (2026-09-02)

### What will be built

A 2-item addition to the existing `_KEY_DIRS` constant in `buildSystemPrompt()` (`src/web-ui/routes/skills.js`, currently `['stories', 'review', 'test-plans', 'verification-scripts']`):

1. Add `'epics'` — the one confirmed gap against this story's own AC2 (multi-file stage resolution): `epics/*.md` (the epic-level file `/definition` also produces alongside `stories/*.md`) is never scanned or injected today.
2. Add `'dor'` — an adjacent, related gap found during the same investigation: the CLI-backfill flow (`ep1-s3`'s `backfillJourneyFromPipelineState`) produces a bogus flat `definition-of-ready.md` `priorArtefacts` entry with no real backstop, unlike `test-plans` (already in `_KEY_DIRS`).

No new module, function, or file is needed — the existing mechanism already: reads every file under the feature's artefact directory; for anything under a `_KEY_DIRS` entry, reads full content and injects it into HANDOFF CONTEXT unless already present in `priorArtefacts`; runs unconditionally for every skill and every session (new or resumed), including the CLI-backfilled-continue flow.

### What will NOT be built

- A new `resolveArtefacts()` function or module — superseded, not needed.
- Any change to `priorArtefacts`'s own population logic (`journey.js`) — this story's fix is additive to the disk-scan backstop, not a change to the primary mechanism.
- Any change to how artefacts are written (`darc-s1`'s scope, already merged) — this story remains read-side only.

### How the AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (single-file stages — unaffected by this change, already correctly handled via `priorArtefacts`) | Regression test confirming no change to single-file-stage behaviour | Unit |
| AC2 (multi-file stage resolution — `epics/`, and `dor/` as the adjacent fix) | Fixture test: a feature with `epics/*.md` and `dor/*.md` files, assert both now appear in the disk-scan output; regression test proving `stories/`/`review/`/`test-plans/` behaviour is unchanged | Unit + Integration |

### Assumptions

- The pre-existing `_KEY_DIRS` mechanism's dedup logic (`_priorSet.has(fullPath)`) and unconditional-scan gating (`if (_featureSlug)`) are correct and don't need modification — confirmed by the pre-implementation investigation, not assumed.
- Adding `'dor'` to `_KEY_DIRS` is in scope for this story even though the original AC text scoped `dor` under "single-file... via story-scoped subdirectory" rather than the explicit multi-file bullet — justified because the CLI-backfill scenario this whole epic exists to fix is exactly the case where `dor`'s `priorArtefacts` entry is unreliable, matching this story's own NFR intent (≥98% handoff success rate) more than a literal AC-bullet reading would suggest.

### Estimated touch points

Files: `src/web-ui/routes/skills.js` (`_KEY_DIRS` constant, one line). Services: none. Depends on: ep1-s1 (merged, PR #808 — the CLI-backfilled-continue flow this fix also backstops).

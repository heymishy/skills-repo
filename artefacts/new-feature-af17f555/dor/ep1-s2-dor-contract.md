# Contract Proposal: Artefact Resolution and HANDOFF CONTEXT Population

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s2.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-01

---

## What will be built

A `resolveArtefacts(featureSlug, stage)` function in the Web UI backend implementing the directory-scan model from `design.md`'s revised Component 2:

1. For single-file stages (discovery, clarify, benefit-metric, design), resolve via the existing known singular path.
2. For story-scoped stages (test-plan, definition-of-ready), resolve via the `wsap-s1` subdirectory convention (`test-plans/*.md`, `dor/*.md`).
3. For multi-file stages (definition → `epics/*.md` + `stories/*.md`; review → `review/*-review-*.md`), resolve via `fs.readdirSync()` — every file found becomes one `{ path, content }` entry.
4. Missing directories return `[]`, not an error. Unreadable files are logged and excluded.
5. The resulting array feeds the existing `priorArtefacts` mechanism unchanged — `buildSystemPrompt()`/`registerHtmlSession()` require no modification.

## What will NOT be built

- Any change to how artefacts are written (that is `darc-s1`'s scope, already merged in PR #807) — this story is read-side only.
- Deduplication or "most recent run only" filtering for multi-run review artefacts — all runs are included; a HANDOFF CONTEXT size concern is explicitly deferred per the design doc's own note.
- Any change to journey record creation (ep1-s3) or stage routing (ep1-s4) — this story only resolves artefact content, not journey state or navigation.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (single-file stage resolution, no singular `*Artefact` field trusted) | Unit tests against fixture directories for each single-file stage + a deliberately-wrong `*Artefact` field to prove it's ignored | Unit |
| AC2 (multi-file stage resolution, every file found) | Unit tests against fixture `epics/`/`stories/`/`review/` directories with multiple files, including multi-run-per-story | Unit + Integration |

## Assumptions

- The directory-scan model matches what `darc-s1` (merged, PR #807) now actually writes for `definition` and `review` — verified directly against that PR's merged code, not assumed.
- `af17f555`'s own real `epics/`, `stories/`, `review/` directories (backfilled this session) are a valid, representative test fixture shape.
- No change to `pipeline-state.schema.json` is required — `stage` is the only feature-level field this story's resolution logic reads (already present in schema).

## Estimated touch points

Files: new `resolveArtefacts` module (exact path TBD at `/implementation-plan` — likely `src/web-ui/utils/artefact-resolver.js`), `src/web-ui/routes/skills.js` (wiring into session-start HANDOFF CONTEXT construction). Services: none new. Depends on: ep1-s1 (`/api/features` — for feature selection, already at DoR-signed-off/branch-setup).

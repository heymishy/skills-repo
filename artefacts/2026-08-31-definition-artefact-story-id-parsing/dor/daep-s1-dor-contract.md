# Contract Proposal: Recognize the H2-epic/H3-story (Format A) definition-artefact shape

**Story reference:** artefacts/2026-08-31-definition-artefact-story-id-parsing/stories/daep-s1-recognize-epic-h2-story-h3-format.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## What will be built

- In `src/web-ui/routes/journey.js`, add a third branch to `extractStoryIdsFromDefinitionArtefact`, checked only when the existing H1-epic/H1-story and flat-H2 checks both find nothing:
  - Detect `## Epic <N>` H2 headers (mirrors the client-side `parseDefinitionArtefact`'s Format A detection in `src/web-ui/routes/skills.js`).
  - Split on `\n## Epic ` to get epic blocks, then split each epic block on `\n### ` to get story subsections.
  - Extract each story's leading slug via `^([a-z][a-z0-9.-]*)` — same permissive pattern the client parser already uses (slug not required to contain a dot, so hyphenated IDs like `ep1-s1` match).
  - Return the collected slugs in document order.

## What will NOT be built

- No change to the two already-recognized formats (Format B flat-H2, Format C H1-epic/H1-story).
- No change to the client-side `parseDefinitionArtefact` (already correct).
- No change to `handleGetStories`/`handlePostStories` beyond what the extractor they call now returns.
- No retroactive backfill for journeys already stuck at the manual-entry fallback.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (hyphenated + dotted Format A slugs) | Two fixtures, one with `ep1-s1`-style slugs, one with `wgol.1`-style slugs under `## Epic N` / `### slug` structure | Unit |
| AC2 (auto-populate via handleGetStories) | Same real-render harness as `check-dsda-s1-default-all-stories.js`'s AC1 test, with a Format A fixture on disk | Unit |
| AC3 (unrecognized artefact still returns []) | Reuse `UNRECOGNISED_ARTEFACT` fixture from `check-dsda-s1-default-all-stories.js` | Unit |
| NFR (no regression to Format B/C) | Reuse `H1_FORMAT_ARTEFACT` and `FLAT_FORMAT_ARTEFACT` fixtures unchanged | Unit (regression) |

## Assumptions

- The client-side `parseDefinitionArtefact`'s Format A branch (`src/web-ui/routes/skills.js`, "Format A: ## Epic N: Name sections with ### story-id subsections") is the correct reference shape to mirror — confirmed by reading its exact split/match logic and cross-checking it against the real production artefact (`artefacts/new-feature-af17f555/definition.md`, journey `af17f555-dfa9-4f66-910b-32bec32d66b7`) that triggered this bug report.

## Estimated touch points

Files: `src/web-ui/routes/journey.js` only. Services: none. APIs: none.

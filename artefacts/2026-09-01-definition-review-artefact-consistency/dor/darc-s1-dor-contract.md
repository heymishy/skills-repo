# Contract Proposal: Split the Web UI's consolidated definition and review artefacts into individual files matching the CLI convention

**Story reference:** artefacts/2026-09-01-definition-review-artefact-consistency/stories/darc-s1-split-definition-and-review-into-individual-files.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-09-01

---

## What will be built

1. **`src/web-ui/utils/definition-artefact-splitter.js`** (new module): `splitDefinitionArtefact(md, featureSlug)` — reuses `daep-s1`'s proven Format-A boundary regexes (`## Epic N`, `### epN-sM`), then extracts every field via a genuinely order-independent scanner (`scanFields`): finds every recognised field's position first, derives each field's value from the gap to whichever field comes next in actual document order. The Acceptance Criteria block (no field label of its own) is identified by content — whichever gap between two consecutive fields contains `Given` — not by an assumed position. Returns `{ epics: [{slug, title, content}], stories: [{slug, title, epicSlug, content}] }`, content shaped to match `templates/epic.md`/`templates/story.md`, with deterministic reference links (Epic/Discovery/Benefit-metric) computed server-side rather than trusted to the model.

2. **`src/web-ui/utils/review-artefact-splitter.js`** (new module): `splitReviewArtefact(md, nextRunNumber)` — recognises `## Story: [slug]` boundaries (the new required structure), extracts each story's HIGH/MEDIUM/LOW findings and verdict, shapes content to match `templates/review-report.md`. `nextRunNumber` is a caller-supplied callback (disk-based lookup) so run numbering stays consistent with `skills/review/SKILL.md`'s own `[story-slug]-review-[N].md` convention.

3. **`src/web-ui/routes/skills.js`**, `handlePostTurnStreamHtml`: after the existing `dcuf-s1` single-file flat-artefact commit succeeds (unchanged), a new best-effort block calls the appropriate splitter when `session.skillName` is `'definition'` or `'review'`, writes each returned file to local disk (with the same `res-s2` path-traversal guard already used elsewhere in this function), and commits each via the same `ownerRepoForFeature`/`commitArtefact` mechanism `dcuf-s1` already wired — reused unchanged, called once per new file. Wrapped in try/catch: a parse or write/commit failure is logged (`console.warn`) and does not block stage completion.

4. **REVIEW PROTOCOL prompt** (`buildSystemPrompt`): updated to require `## Story: [slug]` sections grouping findings by story instead of by severity across all stories, with an explicit format example.

5. **DEFINITION PROTOCOL prompt**: example template enriched to explicitly request Architecture Constraints, Benefit Linkage, and epic-level Goal/Oversight/Scope Stability — fields the splitter looks for that the prior example didn't explicitly ask for (even though real sessions, per `af17f555`'s own history, already tend to include some of them unprompted).

## What will NOT be built

- No change to `journey.js`, the flat-file write itself, Postgres storage, or story-map panel rendering.
- No change to `dcuf-s1`'s own single-file commit logic — reused, not modified.
- No change to `discovery`, `benefit-metric`, `design`, `test-plan`, or `definition-of-ready` prompts.
- No retroactive migration for any feature other than `af17f555` (separate follow-on action).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Drive a definition turn, assert flat file + epic/story files all committed and on disk | Integration |
| AC2 | Drive a review turn, assert flat file + per-story review file committed with correct run number | Integration |
| AC3 | Unit tests against af17f555's real backfilled content, asserting no field falls back to a default when real content exists | Unit |
| AC4 | Repo-less mock pool, assert commitArtefact never called but local files still written | Integration |
| AC5 | Run all 5 prior story test files unmodified | Regression |

## Assumptions

- `af17f555`'s own backfilled `definition.md` (already committed to git this session) is a valid, representative real-world test fixture — it is the actual content a real journey produced, not a synthetic approximation.
- The REVIEW PROTOCOL's structural change (grouping by story instead of severity) does not reduce the quality or completeness of the model's own review reasoning — it only changes how the SAME findings are organised in the output, which the model is already fully capable of doing (it already tracks per-story findings internally to produce the existing severity-grouped output).
- `daep-s1`'s Format-A regex remains the sole recognised definition-artefact shape the Web UI actually produces; other formats (`extractStoryIdsFromDefinitionArtefact`'s Format B/C branches) are CLI-only historical formats, not something the Web UI's own prompt asks the model to produce.

## Estimated touch points

Files: `src/web-ui/utils/definition-artefact-splitter.js` (new), `src/web-ui/utils/review-artefact-splitter.js` (new), `src/web-ui/routes/skills.js` (wiring + 2 prompt updates). Services: none new (reuses `export-data-source.js`/`artefact-commit-writer.js` unchanged). New test files: `tests/check-defs-s1-definition-artefact-splitter.js`, `tests/check-revs-s1-review-artefact-splitter.js`, `tests/check-defs-revs-s1-wiring-into-turn-completion.js`.

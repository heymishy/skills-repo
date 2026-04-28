# DoR Contract: asd.1 — Audit gate story dispatch cross-check

**Story:** `artefacts/2026-04-29-audit-story-dispatch-crosscheck/stories/asd.1-audit-story-dispatch-crosscheck.md`
**Date:** 2026-04-29

---

## File touchpoints

| Action | File | Change |
|--------|------|--------|
| MODIFY | `scripts/extract-pr-slug.js` | Add `extractStorySlug(bodyText, featureSlug)` and `buildDispatchNote(status, storyId, issueUrl?)` functions; export both |
| MODIFY | `.github/workflows/assurance-gate.yml` | In "Post governed artefact chain comment" step: call `extractStorySlug` with PR body + resolved slug; look up story in `pipelineStories`; call `buildDispatchNote`; prepend note to each story's AC section header |
| MODIFY | `tests/check-asd1-story-crosscheck.js` | Already exists as failing stub — make tests T1–T9 pass |

---

## Out of scope (do not touch)

- `scripts/trace-report.js`
- `scripts/ci-attachment-config.js`
- `scripts/ci-adapters/`
- `.github/pipeline-state.schema.json`
- Any file under `artefacts/`
- Any file under `tests/` other than `tests/check-asd1-story-crosscheck.js`
- The gate verdict logic (pass/fail/unknown)
- The trace hash computation

---

## Schema dependency declaration

`schemaDepends: []` — no new fields added to pipeline-state.schema.json. The dispatch cross-check reads existing `story.issueUrl` (already in schema) and renders it in the comment only.

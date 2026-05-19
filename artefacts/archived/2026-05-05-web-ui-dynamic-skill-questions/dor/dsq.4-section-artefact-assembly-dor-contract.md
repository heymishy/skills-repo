# DoR Contract: dsq.4 — Section-by-section artefact assembly

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.4-section-artefact-assembly.md
**Date:** 2026-05-05

---

## What will be built

`htmlGetPreview` in `src/web-ui/routes/skills.js` updated to assemble `artefactContent` as a section-structured markdown string:

1. Iterate `session.sections` (from dsq.1.5) in document order.
2. For each section: emit `## {section.heading}` (skip for empty heading / flat skill).
3. If `session.sectionDrafts[sectionIndex]` is populated: use that text as section content.
4. Otherwise: concatenate answers from `session.answers` for the questions in `session.sections[sectionIndex].questions`, one per line.
5. For flat skills (single section with empty heading): emit the skill name as the heading, concatenate all answers.

---

## What will NOT be built

- No change to artefact path derivation (`artefactPath` logic is untouched).
- No change to commit-flow routes, commit-preview route handler, or session store shape.
- No model-generated summaries — that is dsq.2's responsibility; this story only assembles what is already in `session.sectionDrafts` or `session.answers`.
- No retroactive reformatting of prior sessions.

---

## AC verification approach

| AC | Implementation approach | Test |
|----|------------------------|------|
| AC1 — section-structured output, no Q/A prefix | Assert artefactContent starts with H2 heading; does not contain 'Q1:' | T5.1 |
| AC2 — sectionDrafts used when present | Populate session.sectionDrafts[0]; assert that text appears in artefactContent | T5.2 |
| AC3 — fallback to Q&A concatenation when no draft | session.sectionDrafts absent; assert answers appear under heading without label | T5.3 |
| AC4 — flat skill regression: skill name as heading | session.sections = [{heading:'', questions:[...]}]; assert skill name heading | T5.4 |
| AC5 — artefactContent is string, artefactPath unchanged | Smoke: assert typeof artefactContent === 'string'; assert artefactPath pattern | T5.5 (passes before impl — regression canary) |
| AC6 — all prior tests pass | Regression canary covering wuce.26 baseline | T5.7 (passes before impl — regression canary) |

Additional: T5.6 asserts artefactContent begins with an H2 heading (not 'Q1:' format).

---

## Assumptions

- `session.sections` is available (populated by dsq.1.5's `registerHtmlSession` change — dsq.1.5 must be DoD-complete).
- `session.dynamicQuestions[i]` may be present (from dsq.1) — the question text used in section headings/labels comes from `session.dynamicQuestions[i] || session.questions[i]`.
- `session.sectionDrafts` may or may not be present — dsq.2 is a soft dependency; `htmlGetPreview` must handle both cases.
- Section index tracking matches the structure established by dsq.1.5.

---

## Estimated touch points

| Category | Items |
|----------|-------|
| Files modified | `src/web-ui/routes/skills.js` (htmlGetPreview only) |
| Files created | none |
| Files updated (minor) | none |
| Files NOT touched | `src/skill-content-adapter.js`, `src/web-ui/adapters/skills.js`, `src/web-ui/server.js`, all dashboards, artefacts, scripts |

---

## schemaDepends

`schemaDepends: []` — upstream dependencies (dsq.1 `session.dynamicQuestions`, dsq.1.5 `session.sections`, dsq.2 `session.sectionDrafts`) are runtime session store fields in an in-memory `Map`, not in `pipeline-state.json`. No pipeline-state.json schema fields are cross-story dependencies for this story.

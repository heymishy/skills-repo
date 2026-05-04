# DoR Contract: dsq.1.5 — Section-aware question extraction

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1.5-section-aware-extraction.md
**Date:** 2026-05-05

---

## What will be built

1. `extractSections(content)` function added to `src/skill-content-adapter.js` and exported alongside `extractQuestions`.
2. `registerHtmlSession` in `src/web-ui/routes/skills.js` updated to call `extractSections(skillContent)` and store the result as `session.sections` in `_sessionStore`.

---

## What will NOT be built

- No change to `extractQuestions` — it must remain byte-for-byte identical.
- No HTTP routes or response changes — `session.sections` is internal session state only.
- No dynamic question grouping — section questions are static SKILL.md questions; dynamic replacements (dsq.1) are applied later by dsq.2 at question-serve time.
- No changes to `src/web-ui/server.js` or `src/web-ui/adapters/skills.js`.

---

## AC verification approach

| AC | Implementation approach | Test |
|----|------------------------|------|
| AC1 — H2-structured extraction | Parse content line-by-line; accumulate questions under current heading | T2.1 |
| AC2 — no-H2 case → single empty-heading section | Empty-heading bucket as default | T2.2 |
| AC3 — union of section questions = extractQuestions output | Same question parser reused; verified by comparing arrays | T2.3 |
| AC4 — registerHtmlSession populates session.sections | Call extractSections in registerHtmlSession, assign to _sessionStore entry | T2.4 |
| AC5 — 14 existing tests pass (regression) | No changes to extractQuestions or existing session fields | T2.5 (+ T2.6 regression canary) |

---

## Assumptions

- H2 headings are `## Heading text` lines (exactly two `#` characters followed by a space).
- Questions before the first H2 (if any) are treated as belonging to the empty-heading bucket (consistent with AC2).
- SKILL.md content is well-formed UTF-8 string (same assumption as `extractQuestions`).

---

## Estimated touch points

| Category | Items |
|----------|-------|
| Files modified | `src/skill-content-adapter.js`, `src/web-ui/routes/skills.js` |
| Files created | none |
| Files updated (minor) | none |
| Files NOT touched | `src/web-ui/server.js`, `src/web-ui/adapters/skills.js`, all dashboards, artefacts, scripts |

---

## schemaDepends

`schemaDepends: []` — upstream dependency (wuce.26) is on runtime session store fields (`session.questions`, `session.answers`, etc.) stored in an in-memory `Map`, not in `pipeline-state.json`. No pipeline-state.json schema fields are cross-story dependencies for this story.

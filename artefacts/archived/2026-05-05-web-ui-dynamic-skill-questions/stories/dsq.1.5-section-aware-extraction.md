## Story: Section-aware question extraction for web UI skill sessions

**Epic reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/epics/dsq-epic-1.md
**Discovery reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/discovery.md
**Benefit-metric reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/benefit-metric.md

## User Story

As a **developer delivering the section confirmation loop (dsq.2)**,
I want **SKILL.md content to be parsed into a section-grouped structure that maps H2 headings to their contained questions**,
So that **the session store knows which questions belong to which section and can detect section boundaries during an active session**.

## Benefit Linkage

**Metric moved:** P1 — Skill session completion rate (> 50%) — as an enabler story
**How:** This story is a structural prerequisite for dsq.2. It does not itself generate user-visible behaviour, but without section-aware extraction dsq.2's section confirmation loop cannot be built. Dsq.2 directly moves P1 by allowing operators to review and correct model section drafts mid-session. This story's contribution to P1 is 100% mediated through dsq.2.

## Architecture Constraints

- **No new npm dependencies** — implementation must use Node built-ins only.
- **No Express** — raw `http.createServer` pattern only.
- **Backward compatibility required** — `extractQuestions(content)` must continue to return the same `Array<{id: string, text: string}>` flat structure. The new `extractSections(content)` function is additive. No existing callers of `extractQuestions` are modified by this story.
- **Single source module** — both `extractQuestions` and `extractSections` must live in `src/skill-content-adapter.js` and be exported from that module.

## Dependencies

- **Upstream:** wuce.26 (merged) — `registerHtmlSession` and `_sessionStore` in production on master.
- **Downstream:** dsq.2 (section confirmation loop) depends on `session.sections` being populated by `registerHtmlSession`; dsq.4 (section artefact assembly) may use the same structure.

## Acceptance Criteria

**AC1:** Given `src/skill-content-adapter.js`, when `extractSections(content)` is called with a SKILL.md string that contains one or more H2 headings (`## Heading text`), then it returns an array of section objects in document order, where each object has the shape `{ heading: string, questions: Array<{id: string, text: string}> }` — `heading` is the heading text (stripped of `##` and whitespace), and `questions` contains only the questions that appear under that heading (up to the next H2 or end of document).

**AC2:** Given a SKILL.md string with no H2 headings, when `extractSections(content)` is called, then it returns a single-element array: `[{ heading: '', questions: [/* all questions */] }]` — all questions are captured under the empty-string heading, preserving the flat-skill case.

**AC3:** Given `extractSections` is called with the same content as `extractQuestions`, then the union of all `section.questions` across all sections equals the array returned by `extractQuestions` for the same content (same question texts, same count, same order).

**AC4:** Given `extractSections` is exported from `src/skill-content-adapter.js` alongside `extractQuestions`, when `registerHtmlSession` runs in `src/web-ui/routes/skills.js`, then `session.sections` is populated with the result of `extractSections(session.skillContent)` and stored in `_sessionStore` alongside the existing `session.questions` flat array.

**AC5:** Given all existing tests (wuce.26 baseline — 14 tests), when this story's changes are merged, then all 14 tests continue to pass with no regressions — the change to `registerHtmlSession` must not alter any existing session field.

## Out of Scope

- Changing `extractQuestions` — it must be left unchanged
- Exposing section structure in any HTTP response — `session.sections` is for internal use by dsq.2 and dsq.4 only; this story adds no new routes or response fields
- Dynamic question grouping — `session.sections[i].questions` stores the static SKILL.md questions; dynamic replacements (dsq.1) are applied at question-serve time by dsq.2, not here

## NFRs

- **Performance:** `extractSections` must parse synchronously (no I/O). For any SKILL.md that `extractQuestions` currently processes without issue, `extractSections` must complete in < 10 ms.
- **Correctness:** If a question appears between two H2 headings, it belongs to the preceding heading. Questions before the first H2 (if any) are captured under the empty-string heading (same as the no-H2-headings case in AC2).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

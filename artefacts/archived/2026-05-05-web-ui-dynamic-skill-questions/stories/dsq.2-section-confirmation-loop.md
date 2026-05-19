## Story: Section confirmation loop for web UI skill sessions

**Epic reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/epics/dsq-epic-1.md
**Discovery reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/discovery.md
**Benefit-metric reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/benefit-metric.md

## User Story

As a **web UI operator running a structured skill session**,
I want the **model to write a section draft after I answer all questions in a section and ask me to confirm before moving on**,
So that **I can review and correct the model's synthesis of my answers before the session advances to the next section, producing a higher-quality artefact**.

## Benefit Linkage

**Metric moved:** P1 — Skill session completion rate (> 50%)
**How:** Operators who can review and confirm a section draft mid-session are less likely to abandon the session — they have visible evidence that the model has understood their answers and can course-correct before the session is too far advanced to be worth completing.

**Secondary metric:** P2 — Web UI share of outer loop artefacts — section confirmation increases artefact quality, which increases operator confidence in the web UI as a delivery surface.

## Architecture Constraints

- **Section boundary detection:** Sections are derived from SKILL.md H2 headings (`## heading`). The `session.sections` array (type `Array<{ heading: string, questions: Array<{id, text}> }>`) is populated by `registerHtmlSession` via `extractSections()` introduced in dsq.1.5. This story reads `session.sections` to detect when the operator has answered the last question in the current section. `extractSections` must be DoD-complete before this story can be implemented.
- **D37 / injectable adapter rule (ADR-009):** The section-draft model call must use a new injectable adapter `_sectionDraftExecutor` following the same throw-on-default pattern as `_skillTurnExecutor` and `_nextQuestionExecutor` (from dsq.1).
- **No new npm dependencies** — Node built-ins only.
- **No Express** — raw `http.createServer` only.
- **`req.session.accessToken` canonical** — never `req.session.token`.

## Dependencies

- **Upstream (hard):** dsq.1.5 must be DoD-complete — this story reads `session.sections` (`Array<{ heading, questions[] }>`) populated by `extractSections()` introduced in dsq.1.5. Without this structure, section boundary detection is not possible.
- **Upstream (hard):** dsq.1 must be DoD-complete — this story reads `session.dynamicQuestions` and the updated `_sessionStore` entry shape introduced in dsq.1.
- **Downstream:** dsq.4 (section-by-section artefact assembly) builds on the section structure and `session.sectionDrafts` introduced here.

## Acceptance Criteria

**AC1:** Given the SKILL.md for the active skill has at least one H2 section with one or more questions under it, when the operator answers the last question in a section, then `htmlRecordAnswer` detects the section boundary and triggers a section-draft model call to `_sectionDraftExecutor` with: the section heading, all Q&A pairs in that section (using dynamic questions where available), and the instruction "Synthesise the operator's answers into a concise draft of the [section heading] section for the artefact."

**AC2:** Given the section-draft call returns a non-empty string, when the next HTTP response is rendered, then the operator is shown the section draft text and a "Confirm" / "Edit" option before the session advances to the first question of the next section.

**AC3:** Given the operator selects "Confirm", when the next request is processed, then `session.sectionDrafts[sectionIndex]` is set to the confirmed draft text, and the session advances to the first question of the next section.

**AC4:** Given the operator selects "Edit" and submits revised text, when the next request is processed, then `session.sectionDrafts[sectionIndex]` is set to the operator-supplied text (not the model draft), and the session advances to the first question of the next section.

**AC5:** Given the `_sectionDraftExecutor` call throws or returns an empty/null response, when the section boundary is reached, then the session advances silently to the next section without showing a confirmation step — no error is surfaced to the operator and the session continues normally.

**AC6:** Given the default stub for `_sectionDraftExecutor` is invoked without wiring, when any code path calls the stub, then it throws with message `'Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.'`

**AC7:** Given a skill whose SKILL.md has no H2 section structure (all questions are top-level), when the operator completes all questions, then no section confirmation step is shown — the session proceeds directly to commit-preview as it did before this story.

**AC8:** Given all tests passing before this story (including dsq.1's tests), when this story's implementation is merged, then all prior tests continue to pass with no regressions.

**AC9:** Given a new injectable adapter `setSectionDraftExecutorAdapter(fn)` is exported from `src/web-ui/routes/skills.js`, when the adapter is wired in `src/web-ui/server.js` to `skillsAdapter.sectionDraftExecutor`, then a test confirms the wiring is present and the default stub is not in use in production.

## Out of Scope

- Showing a section draft for the final section of a skill session — that is handled by dsq.3 (post-session /clarify gate); this story only shows confirmation between sections
- Free-text editing of the section draft beyond a single textarea input — rich editing or diff views are not in scope
- Persisting section drafts to disk mid-session — in-memory only

## NFRs

- **Performance:** The `_sectionDraftExecutor` call must have a timeout of ≤ 15 000 ms. On timeout, silent fallback fires and session advances.
- **Security:** Token passed to `_sectionDraftExecutor` must be `req.session.accessToken` — never logged or surfaced.
- **Resilience:** Any exception from `_sectionDraftExecutor` must be caught at the call site — silent fallback as per AC5.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

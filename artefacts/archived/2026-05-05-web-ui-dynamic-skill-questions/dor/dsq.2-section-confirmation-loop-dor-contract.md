# DoR Contract: dsq.2 — Section confirmation loop

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.2-section-confirmation-loop.md
**Date:** 2026-05-05

---

## What will be built

1. Section boundary detection added to `htmlRecordAnswer` in `src/web-ui/routes/skills.js`: when the operator answers the last question in a section (detected via `session.sections[sectionIndex].questions` from dsq.1.5), call `_sectionDraftExecutor`.
2. Pending-confirmation state: `session.pendingConfirmation` / `session.pendingSectionDraft` stored in `_sessionStore` when a section draft is generated successfully.
3. Confirmation routing in `htmlRecordAnswer`: if `session.pendingConfirmation` is truthy, treat the incoming answer as a confirmation or edit command (`'confirm'` or `'edit:<text>'`) rather than a new question answer.
4. `session.sectionDrafts` array (indexed by section index) populated in `_sessionStore`.
5. `setSectionDraftExecutorAdapter(fn)` exported from `src/web-ui/routes/skills.js`.
6. `sectionDraftExecutor` (default stub throws) and `setSectionDraftExecutor(fn)` exported from `src/web-ui/adapters/skills.js`.
7. Production wiring in `src/web-ui/server.js`: `routes.setSectionDraftExecutorAdapter(skillsAdapter.sectionDraftExecutor)`.

---

## What will NOT be built

- No confirmation step for the final section — that is dsq.3's responsibility.
- No rich editing UI beyond a single text response.
- No disk persistence of section drafts.
- No new HTTP route — confirmation is handled via the existing `htmlRecordAnswer` endpoint using answer-string conventions (`'confirm'` and `'edit:<text>'`).

---

## AC verification approach

| AC | Implementation approach | Test |
|----|------------------------|------|
| AC1 — last-Q boundary triggers sectionDraftExecutor | Spy on executor; assert called once when last Q of section submitted | T3.1 |
| AC2 — successful draft → pendingConfirmation | Assert session.pendingConfirmation truthy after section-end answer | T3.2 |
| AC3 — 'confirm' → sectionDrafts[i] = draft, advance | Answer 'confirm'; assert sectionDrafts[0] = draft and advance | T3.3 |
| AC4 — 'edit:<text>' → sectionDrafts[i] = operator text | Answer 'edit:My text'; assert sectionDrafts[0] = 'My text' | T3.4 |
| AC5 — executor throws → silent fallback | Wire throwing executor; assert no exception propagated; no pendingConfirmation | T3.5 |
| AC6 — default stub throws exact message | Fresh module; invoke stub directly; assert throw message | T3.6 |
| AC7 — no-H2 skill → no confirmation step | session.sections with empty heading; assert 0 executor calls | T3.7 |
| AC8 — regression | Mid-section answer triggers skillTurnExecutor + nextQuestionExecutor, not sectionDraftExecutor | T3.8 |
| AC9 — server.js wires setSectionDraftExecutorAdapter | Read server.js source; assert text includes 'setSectionDraftExecutorAdapter' | T3.10 |

Additional smoke: T3.9 asserts `setSectionDraftExecutorAdapter` is exported as a function.

---

## Assumptions

- `session.sections` is populated by dsq.1.5's `registerHtmlSession` change (hard dependency — dsq.1.5 must be DoD-complete).
- `session.dynamicQuestions` is available from dsq.1 (hard dependency — dsq.1 must be DoD-complete).
- Confirmation answer convention: exact string `'confirm'` → confirm; string starting with `'edit:'` → extract text after the colon as operator content.
- Section index tracking uses a `session.currentSectionIndex` counter (or equivalent) already established by dsq.1.5/dsq.1 session structure.

---

## Estimated touch points

| Category | Items |
|----------|-------|
| Files modified | `src/web-ui/routes/skills.js`, `src/web-ui/adapters/skills.js`, `src/web-ui/server.js` |
| Files created | none |
| Files updated (minor) | none |
| Files NOT touched | `src/skill-content-adapter.js`, all dashboards, artefacts, scripts |

---

## schemaDepends

`schemaDepends: []` — upstream dependencies (dsq.1.5 `session.sections`, dsq.1 `session.dynamicQuestions`) are runtime session store fields in an in-memory `Map`, not in `pipeline-state.json`. No pipeline-state.json schema fields are cross-story dependencies for this story.

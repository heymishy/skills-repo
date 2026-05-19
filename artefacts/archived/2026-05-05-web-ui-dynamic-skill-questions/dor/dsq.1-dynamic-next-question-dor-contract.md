# DoR Contract: dsq.1 — Dynamic next-question generation

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1-dynamic-next-question.md
**Date:** 2026-05-05

---

## What will be built

1. `setNextQuestionExecutorAdapter(fn)` exported from `src/web-ui/routes/skills.js`.
2. `htmlRecordAnswer` updated to call `_nextQuestionExecutor(currentQuestion, answer, priorQAPairs, token)` after recording an answer; result stored in `session.dynamicQuestions[nextIndex]`.
3. `htmlGetNextQuestion` updated to serve `session.dynamicQuestions[idx]` when populated, with silent static-question fallback on null/empty/exception.
4. `nextQuestionExecutor` (default stub throws) and `setNextQuestionExecutor(fn)` exported from `src/web-ui/adapters/skills.js`.
5. Production wiring in `src/web-ui/server.js`: `routes.setNextQuestionExecutorAdapter(skillsAdapter.nextQuestionExecutor)`.

---

## What will NOT be built

- No UI rendering changes — this story is server-side only.
- No change to `htmlRecordAnswer` route contract (request/response shape).
- No change to `extractQuestions` or `src/skill-content-adapter.js`.
- No new routes — existing `htmlGetNextQuestion` and `htmlRecordAnswer` are modified.

---

## AC verification approach

| AC | Implementation approach | Test |
|----|------------------------|------|
| AC1 — second model call after htmlRecordAnswer | Spy on _nextQuestionExecutor; assert called with correct args | T1.1 |
| AC2 — result stored as session.dynamicQuestions[nextIndex] | Assert session store after record-answer | T1.2 |
| AC3 — fallback to static on null/empty/throw | Three sub-cases: T1.3 (null), T1.4 (empty string), T1.5 (throw → fallback) | T1.3, T1.4, T1.5 |
| AC4 — dynamic question served by htmlGetNextQuestion | Assert htmlGetNextQuestion returns dynamic text when present | T1.6 |
| AC5 — setNextQuestionExecutorAdapter exported + wired | T1.7 asserts export; T1.8(smoke) confirms wiring call in server.js | T1.7, T1.8 |
| AC6 — default stub throws exact message | Assert throw message on fresh module load | T1.8 (stub throw assertion) |
| AC7 — 14 existing tests pass | Regression canary included in test suite | T1.8 |

---

## Assumptions

- `_nextQuestionExecutor` is called with `(currentQuestionText, answer, priorQAPairsArray, token)` where `token` is `req.session.accessToken`.
- `session.dynamicQuestions` is an array indexed by question index (0-based), parallel to `session.questions`.
- If `_nextQuestionExecutor` throws or returns null/empty, the entry at `session.dynamicQuestions[nextIndex]` is not set (or set to `undefined`); `htmlGetNextQuestion` falls back to `session.questions[idx]`.

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

`schemaDepends: []` — upstream dependency (wuce.26) is on runtime session store fields (`session.questions`, `session.answers`, `session.skillContent`, `session.modelResponses`) stored in an in-memory `Map`, not in `pipeline-state.json`. No pipeline-state.json schema fields are cross-story dependencies for this story.

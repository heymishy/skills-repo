# DoR Contract: dsq.3 — Post-session /clarify gate

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.3-post-session-clarify-gate.md
**Date:** 2026-05-05

---

## What will be built

1. `htmlGetCompletePage(skillName, sessionId)` function added to and exported from `src/web-ui/routes/skills.js`. Returns static HTML with: "Draft complete" heading, skill name, question count, "Commit artefact" link (to commit-preview URL), "Run /clarify first" secondary link (to `/skills/clarify`).
2. `htmlRecordAnswer` updated: when `done = true` (final answer), `nextUrl` points to `.../complete` instead of `.../commit-preview`.
3. GET route for `/skills/:name/sessions/:id/complete` registered in `src/web-ui/server.js`, calling `htmlGetCompletePage`.

---

## What will NOT be built

- No model call on the complete page — static render only.
- No automatic /clarify session launch — operator navigates manually.
- No session resume after navigating away.
- No change to the commit-preview or commit-flow routes or their behaviour.

---

## AC verification approach

| AC | Implementation approach | Test |
|----|------------------------|------|
| AC1 — final-answer nextUrl ends with /complete | Assert nextUrl pattern on htmlRecordAnswer with last question answered | T4.1 |
| AC2 — complete page HTML structure | Assert htmlGetCompletePage returns HTML with all 4 required elements | T4.2 |
| AC3 — commit link navigates to commit-preview | Assert href of "Commit artefact" link contains commit-preview path segment | T4.3 |
| AC4 — clarify link navigates to /skills/clarify | Assert href of "Run /clarify first" link equals '/skills/clarify' | T4.4 |
| AC5 — clarify option is visually secondary | Assert commit link appears before clarify link in DOM / is marked primary | T4.5 |
| AC6 — regression: nextUrl never /commit-preview for final answer | Assert nextUrl does NOT end with /commit-preview for final answer | T4.6 |

Additional smoke: T4.7 confirms `htmlGetCompletePage` exported from routes.

---

## Assumptions

- The existing `htmlRecordAnswer` logic already sets `done = true` for the final answer (from dsq.1); this story changes only the `nextUrl` produced in that case.
- "Commit-preview URL" is the existing route segment; `htmlGetCompletePage` constructs the link as `../commit-preview` relative to the session path.
- Session is not invalidated or modified by navigation to the complete page.

---

## Estimated touch points

| Category | Items |
|----------|-------|
| Files modified | `src/web-ui/routes/skills.js`, `src/web-ui/server.js` |
| Files created | none |
| Files updated (minor) | none |
| Files NOT touched | `src/skill-content-adapter.js`, `src/web-ui/adapters/skills.js`, all dashboards, artefacts, scripts |

---

## schemaDepends

`schemaDepends: []` — upstream dependency (dsq.1 `session.done`, `session.currentQuestionIndex`) is a runtime session store field in an in-memory `Map`, not in `pipeline-state.json`. No pipeline-state.json schema fields are cross-story dependencies for this story.

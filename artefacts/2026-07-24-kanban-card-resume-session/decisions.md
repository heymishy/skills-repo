# Decisions: Kanban Card Resume Session

## RESOLVED — reuse `handleGetJourneyResume` verbatim rather than build a parallel mechanism (2026-07-24)

**Context:** `handleGetJourneyById` (S3.4's kanban-card detail-view destination) rendered only a static summary page. Direct operator usage confirmed the real expectation was to land in the journey's actual current activity — the live session, the produced draft artefact, or the correct next stage.

**Decision:** `handleGetJourneyById` now redirects (303) into `/journey/:featureSlug/resume` — the exact, already-proven mechanism the journey list's own "Continue →" link already uses — rather than duplicating its resolution logic. A fully-complete journey (`journey.complete === true`) falls back to `/features/:slug` instead (AC3), since there's no session left to resume.
**Rationale:** `handleGetJourneyResume` already correctly handles the in-memory fast path, Redis-restore fallback, and disk/Postgres dual-lookup — reimplementing any of that for the kanban-card case specifically would be a second, parallel "find the active session" mechanism, exactly what the story's own Architecture Constraints ruled out.

## FIX — real, separate bug found in `handleGetJourneyResume`: a `done` session was never resumed to itself (2026-07-24)

**Context:** AC2 requires that a `done` session (a turn produced a draft artefact, not yet gate-confirmed) resumes to show that draft. Confirmed via direct reproduction (mocked `getGetHtmlSession`) that `handleGetJourneyResume`'s existing fast path only redirected to the existing session when `!session.done` — a `done` session fell through to the function's own "create a new session for this stage" tail, silently discarding the produced draft artefact and turn history in favour of an empty new session for the identical stage.
**Finding:** This is a real, pre-existing gap in `handleGetJourneyResume` itself (used today by the journey list's "Continue →" link too, not just this story's new kanban-card path) — any operator navigating away from a done-but-unconfirmed session and back via "Continue" would have silently lost their draft. Not previously caught because the manual click-through flow this button is normally used for doesn't typically revisit a session in exactly this transient state.
**Decision:** Fixed at the source (`handleGetJourneyResume`'s fast path and its Redis-restore fallback both now redirect to the existing session regardless of `done` state) rather than working around it in `handleGetJourneyById` — this benefits the pre-existing "Continue →" flow too, not just the new kanban-card path.
**Rationale:** `activeSessionId` only continues pointing at a `done` session while it remains unconfirmed; once gate-confirmed, `setActiveSession` moves it to the next stage's new (not-done) session — so resuming a `done` session by its own id is never stale, already-confirmed state.
**Verified by:** `tests/check-kcrs-s1-kanban-card-resume-session.js` AC2 — direct reproduction confirming the SAME session id is resumed, not a freshly created one.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-24.

## RESOLVED — `?from=` propagated through the WHOLE redirect chain, not dropped at the resume hop (2026-07-24)

**Context:** S3.4's own detail page built a safe-allowlist `?from=` back-link mechanism (`_isSafeBoardBackLink`). Reusing `handleGetJourneyResume` verbatim would have silently dropped this, since that function has no knowledge of board-return context and the chat page it redirects to had no back-link mechanism at all.

**Decision:** `_isSafeBoardBackLink` exported from `journey.js` and reused (not reimplemented) in `skills.js`'s `handleGetChatHtml`. `handleGetJourneyResume` now reads `req.query.from`, re-validates it with the same allowlist, and appends `?from=<value>` to all 3 of its own redirect exit points (in-memory fast path, Redis-restore path, new-session-creation fallback). The chat page (`_renderChatPage`) renders a "Back to board" link only when a safe `from` value is present — absent for every other way the chat page is reached (direct navigation, "Continue" with no board context), matching S3.4's own opt-in behaviour.
**Rationale:** Reusing the exact same allowlist function at both ends (rather than a second, looser check in `skills.js`) keeps the open-redirect protection consistent and in one place.
**Verified by:** `tests/check-kcrs-s1-kanban-card-resume-session.js` AC4 (2 tests: URL propagation through the redirect chain; the chat page's own rendered "Back to board" HTML, both safe-value-present and absent cases).
**Accepted by:** Hamish King, Founder/Operator, 2026-07-24.

## Circular-dependency avoidance — lazy require, matching this codebase's own established pattern (2026-07-24)

**Context:** `skills.js` needed `_isSafeBoardBackLink` from `journey.js`, but `journey.js` already lazily `require('./skills')`s inside several function bodies (not at module top level) to avoid a circular top-level dependency between these two route modules.
**Decision:** `skills.js` requires `journey.js` the same way, lazily inside `handleGetChatHtml`, not as a top-level `const`.
**Verified by:** Direct `require()` of both modules together confirms no partial-module/circularity issue at runtime.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-24.

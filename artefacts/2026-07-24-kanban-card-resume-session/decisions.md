# Decisions: Kanban Card Resume Session

## RESOLVED — reuse `handleGetJourneyResume` verbatim rather than build a parallel mechanism (2026-07-24)

**Context:** `handleGetJourneyById` (S3.4's kanban-card detail-view destination) rendered only a static summary page. Direct operator usage confirmed the real expectation was to land in the journey's actual current activity — the live session, the produced draft artefact, or the correct next stage.

**Decision:** `handleGetJourneyById` now redirects (303) into `/journey/:featureSlug/resume` — the exact, already-proven mechanism the journey list's own "Continue →" link already uses — rather than duplicating its resolution logic. A fully-complete journey (`journey.complete === true`) falls back to `/features/:slug` instead (AC3), since there's no session left to resume.
**Rationale:** `handleGetJourneyResume` already correctly handles the in-memory fast path, Redis-restore fallback, and disk/Postgres dual-lookup — reimplementing any of that for the kanban-card case specifically would be a second, parallel "find the active session" mechanism, exactly what the story's own Architecture Constraints ruled out.

## CORRECTION — `handleGetJourneyResume`'s "done sessions always start fresh" is a deliberate, tested contract, NOT a bug (2026-07-24)

**Context:** AC2 requires that a `done` session (a turn produced a draft artefact, not yet gate-confirmed) resumes to show that draft. The first implementation attempt modified `handleGetJourneyResume`'s fast path and Redis-restore branches to redirect to the existing session regardless of `done` state, reasoning that falling through to "create a new session for this stage" silently discarded the produced draft — this was pushed and initially looked correct (local tests passed, because they were run against the wrong branch).

**The correction:** CI's `Lint, typecheck, test, build` job flagged 2 real regressions: `tests/check-s0.2-resume-existing-session.js` and `tests/check-sec4-early-return.js`. Reading both files directly showed each has its own explicit, named test ("AC2 — done session: create new session, not redirect to old one" / "AC4c — done session in memory → creates new session") asserting the exact opposite of what the first attempt implemented — and both were passing before this story touched anything. This is a real, deliberate, twice-independently-tested product contract for `handleGetJourneyResume` specifically (used today by the journey list's own "Continue →" link), not a latent bug this story happened to discover.

**Decision:** Reverted `handleGetJourneyResume` to its original behaviour (`!session.done` gate on both the fast path and the Redis-restore branch, unchanged). AC2's actual requirement is instead satisfied by a separate, explicit check added directly in `handleGetJourneyById` — before it ever delegates to `handleGetJourneyResume` — that redirects straight to the existing `done` session's chat page for the kanban-card entry point specifically, without touching the shared function's contract for its other caller.
**Rationale:** The kanban-card click and the journey list's "Continue →" link are two different entry points with two different, legitimate expectations of what "resume" means for a `done` predecessor — conflating them by changing the shared function would have broken the existing, already-relied-upon behaviour for one to satisfy the other. Handling each entry point's own expectation at its own call site avoids that.
**Verified by:** `tests/check-s0.2-resume-existing-session.js` (12/12) and `tests/check-sec4-early-return.js` (9/9) pass fully unmodified after the revert. `tests/check-kcrs-s1-kanban-card-resume-session.js` AC2 rewritten to assert the corrected behaviour (direct redirect from `handleGetJourneyById`, never a hop through `/resume`) — 7/7 passing.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-24.
**Process note:** this was caught by CI, not by local testing, because the local re-test after the first implementation was accidentally run against `master` rather than the actual feature branch — the branch mismatch masked the regression until CI ran against the real pushed commit. Worth remembering: always confirm `git rev-parse --abbrev-ref HEAD` matches the branch under test before trusting a "tests pass" result, not just before creating a new branch.

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

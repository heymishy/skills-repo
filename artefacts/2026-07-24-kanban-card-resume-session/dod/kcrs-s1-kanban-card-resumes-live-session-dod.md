# Definition of Done: Clicking a kanban card resumes the journey's live session, not a static summary page

**PR:** #591 (commit `25629575`) | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-24-kanban-card-resume-session/stories/kcrs-s1-kanban-card-resumes-live-session.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|----------------------|-----------|
| AC1 | Yes | `AC1: a mid-conversation (not done) session redirects to the real chat page, no from= means no back-link param` -- asserts 303 to `/journey/kcrs-ac1-feature/resume` | Integration test (`tests/check-kcrs-s1-kanban-card-resume-session.js`) | None |
| AC2 | Yes | `AC2: a done session with a draft artefact redirects DIRECTLY to that SAME session's chat page from handleGetJourneyById itself...` -- asserts 303 direct to the same `sessionId`, not via `/resume` | Integration test | Implementation deviated from the original plan: rather than modifying `handleGetJourneyResume`'s own fast-path/Redis-restore branches (first attempt, later reverted after CI caught 2 real regressions), the fix was moved to a direct check inside `handleGetJourneyById` itself, leaving `handleGetJourneyResume`'s existing done-session contract untouched. Documented and accepted in `decisions.md` ("CORRECTION" entry, 2026-07-24). |
| AC3 | Yes | `AC3: a fully-complete journey with no active session falls back to the artefact index (/features/:slug)` -- asserts 303 to `/features/kcrs-ac3-feature` | Integration test | None |
| AC4 | Yes | Two tests: `AC4: a safe from= value is propagated all the way through to the chat page's own "Back to board" link` (redirect-chain propagation) and `AC4: the chat page renders a "Back to board" link when a safe from= value is present` plus its counterpart `...renders no back-link at all when no from= is present` | Integration tests (3 total covering AC4) | None |
| AC5 | Yes | `AC5: a journey belonging to another tenant is still denied 404 before any redirect decision is made` -- asserts 404 for cross-tenant request | Integration test | None |

## Scope Deviations

The first implementation attempt modified `handleGetJourneyResume`'s shared fast-path and Redis-restore branches to always redirect to an existing `done` session, which silently broke two independent, pre-existing, deliberately-tested contracts (`tests/check-s0.2-resume-existing-session.js`, `tests/check-sec4-early-return.js`) belonging to that function's other caller (the journey list's "Continue" link). This was caught by CI, not local testing -- the local re-test had accidentally run against `master` rather than the actual feature branch. The fix was reverted and AC2 was instead satisfied entirely at the `handleGetJourneyById` call site, leaving the shared function's contract untouched. This is a corrected implementation path, not an open gap -- it is fully documented in `decisions.md` ("CORRECTION" entry) and accepted by the operator on 2026-07-24. No other deviations from the story's stated scope were found; the three "Out of Scope" items named in the story (chat-page redesign, changing `handleGetJourneyResume`'s own behaviour/route, removing the `GET /journey/:id` route) were all respected.

## Test Plan Coverage

`check-kcrs-s1-kanban-card-resume-session.js`: **7 passed, 0 failed** (re-run fresh this session; the count supplied to this DoD pass was a placeholder "null passed, null failed" and was discarded as unreliable). All 7 tests map 1:1 to the test plan's 6 planned cases (AC4's "back-to-board link" case was split into 2 tests -- propagation through the redirect chain, and rendering on the chat page itself -- both present and passing). No failing or skipped tests.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | Met | No new resolution logic added; reuses `handleGetJourneyResume`'s existing memory-first fast path per the story's own constraint. |
| Security | Met | Tenant-ownership guard unchanged and re-verified (AC5, 404 case); `?from=` value re-validated through the same `_isSafeBoardBackLink` allowlist at both the redirect-building and chat-page-rendering ends (`decisions.md`, "RESOLVED -- `?from=` propagated" entry). |
| Accessibility | Not independently verified | Story requires a real keyboard-activatable `<a>` element for the back-link; the test suite confirms the link's presence and target URL in rendered HTML but does not assert element semantics/keyboard-focusability directly. Low risk given it reuses S3.4's own existing link pattern verbatim. |
| Audit | Not applicable | Story states no new state mutation, navigation-only change; consistent with the diff. |

## Metric Signal

No benefit-metric artefact is referenced by this story or present in the feature's artefact folder -- this is an explicitly short-track bug fix (a UX gap found through live operator usage of S3.4's own delivered behaviour), which by this pipeline's own convention skips discovery through benefit-metric. No metric signal to report.

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** None required. The one deviation (AC2's implementation path moving from a shared-function change to a call-site-local check) is a corrected, accepted, fully-documented design decision, not an open defect. Accessibility (keyboard-focusability of the back-link) is asserted by code reuse rather than a dedicated test -- low risk, no action needed given the pattern is copied verbatim from S3.4's already-shipped, already-relied-upon link.

## DoD Observations

The mid-implementation regression (attempt 1 silently breaking `handleGetJourneyResume`'s existing done-session contract) was caught by CI rather than local testing due to a branch mismatch during local re-test -- `decisions.md` records this explicitly as a process learning. No further production issues are recorded against this story since merge.

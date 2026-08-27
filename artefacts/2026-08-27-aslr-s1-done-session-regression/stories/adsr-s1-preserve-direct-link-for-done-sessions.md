## Story: Stop churning fresh sessions for an already-done stage — check for an existing in-memory session before routing through `/resume`

**Epic reference:** None — short-track (regression fix, found live on `wuce-staging` minutes after `aslr-s1` deployed, 2026-08-27)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator who has just completed a stage's turn and is reviewing the drafted artefact before gate-confirming**,
I want **navigating via "Resume conversation" → "Current stage" to show me that exact session, not spawn a brand-new one**,
So that **gate-confirm submits against the session I actually reviewed, instead of failing because the journey has moved on to a session I never saw**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-27) on `wuce-staging`: minutes after `aslr-s1` (PR #776) deployed, the operator hit `Forbidden` on `POST /api/journey/:id/gate-confirm` while following the exact flow that story's own fix touches: resume a feature → click "Current stage" → click "Continue to next stage". Server logs showed two distinct skill-session IDs firing full turn cycles ~70 seconds apart on the same journey — direct evidence of repeated fresh-session creation, not a single stable session being reviewed and confirmed.

**How:** `aslr-s1` routed 4 call sites (`journey.js`'s step-nav `isActive` link, the `currentChatUrl` "← Current stage" button, `handleGetStageReview`'s fallback, `handleGetJourneyStageView`'s own no-artefact-yet fallback) unconditionally through `GET /journey/:featureSlug/resume`. But `handleGetJourneyResume`'s own code comment (`journey.js:1502-1509`) documents a pre-existing, deliberate, twice-independently-tested contract: *"a `done` session is NOT resumed here — this function always starts a fresh session for a done predecessor."* This is exactly correct for `/resume`'s own primary use case (the journey list's "Continue →" link, where starting fresh after a completed stage is the intended behaviour) — but it is the wrong behaviour for "view my current, already-completed-but-not-yet-confirmed stage," which is what all 4 of `aslr-s1`'s call sites actually needed.

**This exact conflict was already discovered and solved once before, for a different entry point.** `kcrs-s1`'s own code comment (`journey.js:2905-2911`, inside `handleGetJourneyById`) states: *"a `done` session... is resumed to that EXACT session here, deliberately NOT by delegating to `handleGetJourneyResume`: that function has its own separate, established, twice-independently-tested contract... that a `done` predecessor always starts a fresh session, never resumes the old one — reusing it for this kanban-card case would have silently broken that existing contract system-wide."* `kcrs-s1`'s fix: check `getGetHtmlSession()(journey.activeSessionId)` first; if it resolves to a real in-memory session, link/redirect directly to its own chat URL (safe and idempotent, regardless of done-state); only fall through to `/resume` when the session genuinely does not exist in memory. `aslr-s1` should have followed this exact, already-established precedent and did not — it applied `kcrs-s1`'s original 891-line insight (the raw-URL problem) without also applying `kcrs-s1`'s own fix pattern.

## Architecture Constraints

- **Apply `kcrs-s1`'s exact existence-check-first pattern to all 4 of `aslr-s1`'s call sites.** Before redirecting to `/journey/:featureSlug/resume`, check `getGetHtmlSession()(journey.activeSessionId)` (or the local equivalent already in scope at each site). If it resolves to a real session object, redirect/link directly to `/skills/:skill/sessions/:id/chat` for that exact session — regardless of whether it is `done` or not, since a verified-existing session is always safe to view directly with no side effect. Only fall through to `/resume` when the session does not exist in memory (the genuine dead-end case `aslr-s1` was built to fix).
- **Do not re-introduce the original, unverified-existence pattern `aslr-s1` removed.** The direct-link branch must always be gated on a confirmed `getGetHtmlSession()` lookup — never construct the raw URL from `journey.activeSessionId` alone with no check, which is the exact original bug.
- **`handleGetStageReview`'s existing structure already does most of this correctly** (`var session = getGetHtmlSession()(...)`) — it only needs its fallback branch split: `!session` → `/resume`; `session exists but not done/no artefact` → direct link to that session's own chat URL (matching this handler's own pre-`aslr-s1` behaviour for the "exists but not ready" sub-case, which was never broken).
- **`handleGetJourneyStageView`'s no-artefact-yet fallback needs the same existence check added** — it did not have one before `aslr-s1` either (it also unconditionally built a raw URL), but that pre-existing gap was masked by the fact it almost always ran against a genuinely live, freshly-active session; make it match `kcrs-s1`'s pattern explicitly now rather than relying on that coincidence.
- **Do not modify `handleGetJourneyResume`'s or `handleGetJourneyById`'s own contracts** — both are correct and proven; this story only brings the 4 `aslr-s1` call sites into alignment with the pattern `handleGetJourneyById` already established.

## Dependencies

- **Upstream:** `aslr-s1` (2026-08-27, merged, PR #776) — this story fixes a regression introduced by that story. `kcrs-s1` (merged, date unknown, referenced via its own code comments in `journey.js`) — the precedent this story now applies consistently.
- **Downstream:** None known.

## Acceptance Criteria

**AC1 (the fix):** Given the step-nav `isActive` link is followed, When `journey.activeSessionId` resolves to a real in-memory session (whether `done` or not), Then the link points directly to `/skills/:skill/sessions/:id/chat` for that exact session — not a fresh session created via `/resume`.

**AC2 (the fix):** Given the "← Current stage" button (`currentChatUrl`) is followed, When the same condition as AC1 holds, Then the same direct-link behaviour applies.

**AC3 (the fix):** Given `GET /journey/:journeyId/stage-review` is requested, When `journey.activeSessionId` resolves to a real in-memory session that is not yet done, Then the response redirects directly to that session's chat URL, not `/resume`.

**AC4 (the fix):** Given `GET /journey/:journeyId/stage/:stageName` is requested for a stage with no recorded artefact yet, When `journey.activeSessionId` resolves to a real in-memory session, Then the fallback redirects directly to that session's chat URL, not `/resume`.

**AC5 (regression guard, the original aslr-s1 fix must still hold):** Given any of the four sites is followed, When `journey.activeSessionId` does NOT resolve to a real in-memory session (missing/evicted), Then the request still falls through to `/journey/:featureSlug/resume`, which resolves it via Redis restore or a fresh session as appropriate — `aslr-s1`'s original dead-end fix is not reverted.

**AC6 (regression guard):** Given a session is `done` and its artefact has been drafted, When the operator navigates via any of the 4 sites and then submits gate-confirm, Then the request succeeds against the exact session that was reviewed — no new session is silently created in between viewing and confirming.

**AC7 (regression guard):** Given `aslr-s1`'s own test suite (`tests/check-aslr-s1-active-stage-link-resume.js`) and the full existing resume/stage-view suite, When re-run after this fix, Then all pass, with `check-aslr-s1-active-stage-link-resume.js`'s own fixtures updated as needed to reflect the corrected (existence-checked) behaviour.

## Out of Scope

- **Any change to `handleGetJourneyResume` or `handleGetJourneyById`** — both are correct, proven, and unmodified; this story only aligns 4 other call sites with the pattern `handleGetJourneyById` already uses.
- **Deduplicating the now-repeated existence-check-then-direct-link pattern across 5 call sites** (the 4 from `aslr-s1` plus `handleGetJourneyById`'s own) into a shared helper function — a reasonable follow-up refactor, but out of scope for this urgent regression fix; correctness now, consolidation later if judged worthwhile.

## NFRs

- **Performance:** Improves performance for the common case (a done, unconfirmed session) — removes an unnecessary session-creation round-trip and, per the live evidence, an unnecessary duplicate LLM/mock-turn execution.
- **Security:** No new surface — reuses `getGetHtmlSession()`, an existing read-only lookup already used identically by `handleGetJourneyById`/`handleGetStageReview`.
- **Accessibility:** Not applicable.
- **Audit:** Removes a spurious `stage_started` PostHog event per unnecessary fresh-session creation this bug was causing — a data-quality improvement, not a new audit requirement.

## Complexity Rating

**Rating:** 2 — the fix pattern itself is simple and already proven elsewhere in this file (`handleGetJourneyById`), but it must be correctly applied at 4 distinct call sites with slightly different existing control flow, and verified against a real live regression, not just a hypothetical.
**Scope stability:** Stable — the fix pattern is fully specified above, copied from an existing, working precedent.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

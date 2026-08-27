## Story: Route the journey navigator's active-stage link through the existing resume flow, not a raw stale session URL

**Epic reference:** None — short-track (bug fix, live gap found via direct operator usage on production, 2026-08-27)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator returning to an in-progress journey after enough time has passed for its active skill session to expire**,
I want **clicking the journey navigator's active-stage link to bring me into a live, working session for that stage**,
So that **I can always continue my journey forward, instead of hitting a dead-end "Session not found" page with no way back into the conversation**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-27) on `skills-framework.fly.dev` (production): resuming the feature "Generate live data and system diagrams" (journey `c2a2815d-228d-4b27-95bd-fef819cae42d`, discovery stage, artefact dated 2025-01-31) via its "Resume conversation" link, then clicking the journey navigator's active-stage ("2. Discovery") breadcrumb, produced `404 Session not found` with no recovery action — the operator's own words: "there's no way to continue the process from that resumed session."

**How:** `_renderJourneyStageView`'s step-nav renderer (`src/web-ui/routes/journey.js:891`) builds the active stage's breadcrumb link directly from the journey's stored `activeSessionId`:
```js
if (isActive) {
  return '<li class="sn-step ' + cls + '"><a href="/skills/' + encodeURIComponent(_activeSkill) + '/sessions/' + encodeURIComponent(_activeSid) + '/chat" class="sn-step-link">' + inner + '</a></li>';
}
```
This links straight to `handleGetChatHtml` (`skills.js:4343`) for that exact session ID, with no existence check. `handleGetChatHtml` itself only recovers via `_getSessionOrRestore` (in-memory, then Redis) — if the session is in neither (evicted by `startSessionEviction`'s 7-day sweep, per `wsm-resume`'s AC6, or simply old enough that its Redis copy is gone too), it renders the bare 404 with no forward action, exactly matching `def-s1`'s own AC2 ("404 preserved for genuinely unknown sessions" — a deliberate, correct design choice for that handler in isolation).

The fix is not to change that 404 page — it's to stop routing this one link into a code path that has no recovery option, when a code path with full recovery already exists one call away. `GET /journey/:featureSlug/resume` → `handleGetJourneyResume` (`journey.js:1413-1580`) already implements the complete fallback chain for exactly this situation: live in-memory session → redirect immediately (line 1502-1509); not in memory but Redis-restorable → restore and redirect (line 1539-1552); neither → **create a brand new session for the current stage, seeded with every completed prior stage's artefact content, linked to the journey, and redirect into it** (line 1555-1579). This is precisely "continue the process" — it already exists, it is already tested (`check-s0.1`, `check-s0.2`, `check-s0.4`), and it is already used as the entry point from the journey list's own "Continue →" link. The step-nav breadcrumb is the one place in the codebase that bypasses it and links directly to the raw, potentially-stale session URL instead.

**Scope investigation (2026-08-27):** every other `journey.activeSessionId`-based redirect in `journey.js`/`skills.js` was checked and found safe — each one either just created a fresh session immediately before redirecting (`journey.js:1578,1717,2326,2376,2445`, `skills.js:1179`) or first verified the session exists in memory before using it (`journey.js:2907`'s `_kcrsSession && _kcrsSession.done` guard). `journey.js:891` is the single exception: the only place that constructs this URL from a stored ID with no verification and no fallback.

## Architecture Constraints

- **Do not modify `handleGetChatHtml`'s 404 behaviour.** `def-s1`'s AC2 ("404 preserved for genuinely unknown sessions") and `frsr-s1`'s AC5 ("a clear, honest message... matching this repo's existing 'Session not found' pattern") both deliberately chose this as acceptable, honest behaviour for a session that is genuinely, permanently gone with no journey context available to recover from (e.g. a session reached directly by URL with no linked journey). This story does not revisit that choice — it only stops one specific journey-aware link from reaching that page unnecessarily, when a proper recovery path already exists for it.
- **Do not modify `handleGetJourneyResume`.** It already correctly implements every fallback case needed (AC1-AC4 below exercise it, not extend it). This story changes exactly one `href` construction.
- **`journey.featureSlug` is already in scope at the point of construction** (`journey.js:872` already reads `journey.featureSlug` two lines above the affected code) — no new lookup or plumbing required.
- **The `isDone` branch (line 887-889, completed stages) is untouched** — it already links to the safe, static `/journey/:journeyId/stage/:skillName` artefact view, which never depends on a live session existing.
- **`handleGetJourneyResume`'s own established, twice-tested contract** ("a `done` session is NOT resumed here — this function always starts a fresh session for a done predecessor," per its own code comment at line 1492-1500) is preserved as-is; this story routes an additional caller into that existing contract, it does not change the contract itself.

## Dependencies

- **Upstream:** `def-s1` (2026-07-03, merged) — added the Redis-restore-on-cache-miss fallback and its deliberate 404-when-genuinely-gone AC2 that this story's fix routes around, not through. `frsr-s1` (2026-07-24, merged) — separately, deliberately deferred building a recovery action for this exact case (its AC5) as out of scope; this story is that follow-up, now justified by a real production occurrence. `wsm-resume` (2026-07-01, merged) — defines the exact eviction/deletion policy (`SESSION_MAX_AGE_DAYS`, Redis delete-on-done) that makes a stored `activeSessionId` eventually stale.
- **Downstream:** None known.

## Acceptance Criteria

**AC1 (regression guard):** Given the journey navigator's active-stage breadcrumb is clicked, When the journey's `activeSessionId` is still live in memory, Then the operator lands in that exact session's chat page — same practical outcome as before this fix (now via one additional 303 redirect through `/journey/:featureSlug/resume`, not a behavioural change).

**AC2 (regression guard):** Given the breadcrumb is clicked, When `activeSessionId`'s session is not in memory but is restorable from Redis, Then the operator's prior turns and draft artefact are restored and they land in the continued session — same outcome as before this fix.

**AC3 (the fix):** Given the breadcrumb is clicked, When `activeSessionId`'s session exists in neither memory nor Redis (evicted or expired), Then the operator lands in a **brand new** session for the journey's current stage, seeded with every completed prior stage's artefact content — not a "Session not found" dead end.

**AC4:** Given AC3's new session is created, When the journey record is inspected afterward, Then `activeSessionId` has been updated to the new session's ID (via the existing `_journeyStore.setActiveSession` call already inside `handleGetJourneyResume`), so a subsequent breadcrumb click continues to work.

**AC5 (regression guard):** Given the `isDone` step-nav branch (completed, non-active stages), When the navigator renders, Then those links are unchanged — still pointing to `/journey/:journeyId/stage/:skillName`, the static artefact view.

**AC6 (regression guard):** Given the existing resume-flow test suite (`check-s0.1-resume-guard.js`, `check-s0.2-resume-existing-session.js`, `check-s0.4-resume-redis-session.js`, and any other test asserting on `journey.js`'s step-nav rendering), When re-run after this fix, Then all pass — `handleGetJourneyResume` itself is untouched; only the link at `journey.js:891` changes.

## Out of Scope

- **Changing `handleGetChatHtml`'s 404 page or its restore logic.** Explicitly preserved per `def-s1`/`frsr-s1` precedent above — a session reached with no journey context (e.g. a bookmarked raw session URL) still has no recovery path and still 404s honestly. That is a separate, larger design question (would require inventing a reverse sessionId→journey lookup with no existing mechanism) not justified by today's confirmed occurrence, which is fully addressed by fixing the one link that caused it.
- **Auditing every other place a raw session URL might be constructed or bookmarked outside this codebase** (e.g. a user's own saved browser bookmark to an old `/skills/.../chat` URL). Out of this story's control; `handleGetChatHtml`'s existing honest-404 behaviour is the correct fallback for that case, unchanged.
- **Extending `SESSION_MAX_AGE_DAYS` or Redis TTL.** An accepted, pre-existing constraint per `wsm-resume`, not something this story revisits.

## NFRs

- **Performance:** Negligible — trades one already-fast client redirect for one additional same-origin 303 hop through `/journey/:featureSlug/resume`, which itself already does the exact same memory/Redis lookups `handleGetChatHtml` would have done anyway.
- **Security:** No new surface — `handleGetJourneyResume` already enforces `requireJourneyAccess` (tenant/ownership guard) before resolving anything; this is at least as strict as the direct link's own implicit access (the direct link had no equivalent guard of its own beyond `handleGetChatHtml`'s ownership check on `session.journeyId`, which only applies when a session object exists at all).
- **Accessibility:** Not applicable — same link element, same visible label, different `href` target.
- **Audit:** `handleGetJourneyResume`'s existing `stage_started` PostHog event fires when AC3's new-session path is taken — no new audit event needed, this reuses the existing one.

## Complexity Rating

**Rating:** 1 — a single `href` construction change in one function, reusing an already-correct, already-tested existing endpoint. The scope investigation (confirming this is the only unsafe call site among 10+ similar-looking candidates) was the substantial part of this work and is already done, documented above.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

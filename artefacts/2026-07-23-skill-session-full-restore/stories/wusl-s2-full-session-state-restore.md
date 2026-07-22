# Story: Session restore from Redis carries forward ALL session state, not a hardcoded 8-field allowlist

**Epic reference:** None — short-track. Direct follow-on from `wusl-s1` (consistent Redis fallback across handlers), raised by the operator before starting the Client/org-hierarchy discovery: "ensure the SSE streaming persistence is also working across all journeys... especially relevant for sse markers that enable a visualisation like story map in definition and canvas in ideate."
**Discovery reference:** None — short-track skips discovery; root cause confirmed by direct code inspection this session.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## Background

`wusl-s1` fixed *whether* a session gets restored from Redis on an in-memory cache miss (across all 9 primary action handlers). This story addresses a second, deeper gap in *what* gets restored: `mergeRedisSessionData` (`routes/skills.js`) copies only 8 hardcoded fields from the Redis-persisted record onto the freshly-registered session:

```
['artefactContent', 'artefactPath', 'done', 'usage', '_artefactBuffer', '_artefactInProgress', '_slugBuffer', 'assumptionCards']
```

Direct inspection of every `session.X = ...` assignment across `routes/skills.js` found at least 8 further fields that carry real, meaningful runtime state and are silently **not** restored by this allowlist: `canvasBlocks` (the ideate canvas), `conditionItems` (the conditions sidebar), `dynamicQuestions`, `sectionDrafts`, `pendingConfirmation`, `pendingSectionDraft`, `currentSectionIndex` (the definition story-map/section-confirmation flow), `modelResponses`, `auditLog`, `_stageDone`, `lastUpdated`.

Critically, the **write** side already persists all of this correctly: `handlePostTurnStreamHtml`'s Redis write (`_skillSessionRedis.write(sessionId, session)`) sends the *entire* session object to Redis, and `skill-session-redis.js`'s own `_sanitise()` only strips `accessToken` plus 3 large, deliberately-never-persisted fields (`systemPrompt`, `contextFiles`, `precomputedStep1` — rebuilt fresh via `registerHtmlSession` on every restore, not meant to round-trip). The gap is entirely on the **restore** side: an allowlist that has to be manually kept in sync with every new stateful field any future skill/story adds, and has clearly already drifted out of sync in practice.

This directly matches the operator's own framing: an operator resuming an in-flight feature after a gap (a redeploy, or simply returning later) would see their conversation turns come back, but the canvas markers, condition items, and story-map section-confirmation state would silently reset — even though `wusl-s1` already ensures the *session itself* is found.

## User Story

As **an operator resuming an in-flight feature/skill session** (after a redeploy, or simply returning to it later),
I want **every piece of accumulated session state — not just conversation turns — to come back exactly as I left it**,
So that **canvas markers, condition items, and story-map/section-confirmation progress are never silently lost, and the next turn I submit uses the full, correct context the model needs**.

## Architecture Constraints

- Checked against `.github/architecture-guardrails.md` — no conflicting ADR found.
- Replaces the hardcoded allowlist in `mergeRedisSessionData` with a **denylist-based restore**: copy every key present in the Redis-persisted record onto the session, except an explicit, small, and stable exclusion list (`accessToken` — defensive, should never be present; `systemPrompt`/`contextFiles`/`precomputedStep1` — never present in Redis data to begin with, since `skill-session-redis.js`'s own `_sanitise()` already strips them before writing, so excluding them here is belt-and-suspenders, not load-bearing).
- This makes the restore mechanism self-maintaining: any future story that adds a new stateful `session.X` field gets it restored automatically, without needing a corresponding allowlist update remembered and applied correctly (the exact drift that caused this bug).
- No change to the write side (`skill-session-redis.js`) — already correct.

## Dependencies

- **Upstream:** `wusl-s1` (merged) — this story extends the same restore path (`_getSessionOrRestore` → `mergeRedisSessionData`) that story wired consistently across handlers.
- **Downstream:** None yet.

## Acceptance Criteria

**AC1 (all known-missing fields now restore correctly):** Given a Redis-persisted session record containing `canvasBlocks`, `conditionItems`, `dynamicQuestions`, `sectionDrafts`, `pendingConfirmation`, `pendingSectionDraft`, `currentSectionIndex`, `modelResponses`, and `auditLog` with real values, When `mergeRedisSessionData` restores it onto a freshly-registered session, Then every one of those fields is present on the restored session with its real, persisted value — not silently dropped.

**AC2 (previously-covered fields still restore correctly, no regression):** Given the original 8 allowlisted fields (`artefactContent`, `artefactPath`, `done`, `usage`, `_artefactBuffer`, `_artefactInProgress`, `_slugBuffer`, `assumptionCards`), When restored via the new denylist-based mechanism, Then they are restored exactly as before — this story does not change their existing, already-tested behavior.

**AC3 (never-persisted fields are never accidentally restored with a stale value):** Given `systemPrompt`/`contextFiles`/`precomputedStep1` are freshly rebuilt by `registerHtmlSession` immediately before the restore merge runs, When `mergeRedisSessionData` runs (even though these fields are never actually present in real Redis data, by design), Then the freshly-built values are never overwritten — verified with a fixture that defensively includes these keys in the Redis-data input, proving the denylist actually excludes them rather than relying solely on their real-world absence.

**AC4 (a genuinely new, not-yet-invented field restores automatically, proving the fix is self-maintaining):** Given a Redis-persisted record containing an arbitrary field name that does not exist in today's codebase (simulating a future story adding new session state), When restored, Then that field is also carried onto the session — proving this is a structural fix, not another allowlist requiring the next engineer to remember to update it.

## Out of Scope

- Any change to what gets written to Redis (`skill-session-redis.js`) — already correct, untouched.
- Any change to the 9 handler call sites `wusl-s1` already fixed — untouched, this story only changes `mergeRedisSessionData`'s internals.
- True live SSE-connection continuation across a page reload (not meaningful — SSE connections don't survive a client disconnect/reconnect; this story is about the *session state* being correctly loaded so the *next new turn* uses full context, exactly as the operator described).

## NFRs

- **Performance:** Negligible — replacing an 8-item allowlist loop with an `Object.keys()` iteration over the same-sized (or slightly larger) Redis payload; no new I/O.
- **Maintainability:** This IS the NFR this story targets — a self-maintaining restore mechanism instead of a manually-synced allowlist that has already drifted once and would drift again.
- **Security:** No new data exposure — the denylist explicitly excludes `accessToken` (defensive), and no new field is written to Redis that wasn't already being written before this story.

## Complexity Rating

**Rating:** 1 — small, well-understood change (allowlist → denylist in one function), root cause fully diagnosed via direct enumeration of every `session.X =` assignment site.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

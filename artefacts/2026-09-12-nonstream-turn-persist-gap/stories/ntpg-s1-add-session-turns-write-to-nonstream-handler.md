## Story: Add the missing session_turns durable write to the non-streaming turn handler

**Epic reference:** None — short-track bug fix (gap found investigating `cdpl-s1`/`cmba-s1`'s own DoD backfill, 2026-09-12)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui, data]

## User Story

As a **pipeline operator relying on the "resume/view a completed stage's real conversation" feature (`dsh-s1`/`dsh-s2`/`dsh-s3`)**,
I want **every completed stage's conversation to be durably saved regardless of which turn endpoint completed it**,
So that **the chat-split read-only view (and any diagrams generated during that stage, per `drh-s1`) actually renders for journeys advanced via the JSON API, not only ones advanced through a real browser's SSE-streaming chat UI**.

## Benefit Linkage

**Metric moved:** Restores `dsh-s1`'s own stated AC1 guarantee ("Given a skill session reaches `done: true` for a stage with a linked journey... a row is inserted into `session_turns`") for the one code path it silently never covered.
**How:** Live investigation (2026-09-12, closing out `cdpl-s1`/`cmba-s1`'s own re-verification) sampled 6 real historical journeys on `wuce-staging.fly.dev` spanning 2026-07-23 through 2026-09-10 — every one fell back to the pre-`dsh-s3` plain artefact view for its completed `design`/`definition` stage, none had a `session_turns` row. Root cause confirmed by direct code comparison: `handlePostTurnStreamHtml` (`src/web-ui/routes/skills.js`, the real browser chat UI's own endpoint) calls `writeSessionTurns` on completion; `handlePostTurnHtml` / `htmlSubmitTurn` (the non-streaming `POST /api/skills/:name/sessions/:id/turn` JSON API endpoint) does not — despite `dsh-s1`'s own AC1 being written generically ("a skill session reaches done"), not scoped to the streaming path only. Any journey advanced via the JSON API (a very common pattern for this repo's own agent/automation-driven delivery, including this very session) silently never gets its turns saved — no error, no warning, `dsh-s3`'s own feature just silently doesn't activate.

## Architecture Constraints

- Reuse the exact `writeSessionTurns` call already present in `handlePostTurnStreamHtml` (`src/web-ui/routes/skills.js`, ~line 5580-5599) — same shape, same non-fatal `.catch()` convention, same `DATABASE_URL` guard. Do not invent a new write path.
- The write must fire from inside `htmlSubmitTurn` (the shared function both `handlePostTurnHtml` and any future non-streaming caller go through), not duplicated at the route-handler level, so any other current or future caller of `htmlSubmitTurn` gets the same durability for free — matching this codebase's own "one canonical builder" convention (ADR-028).
- Do not touch `handlePostTurnStreamHtml`'s own already-correct write — this story only closes the gap in the sibling non-streaming path.

## Dependencies

- **Upstream:** `dsh-s1` (merged, 2026-07-28) — this story closes a gap in that story's own AC1 scope that was never caught at the time.
- **Downstream:** None currently blocked — but closes the precondition for `dsh-s3`'s chat-split view and `drh-s1`'s diagram-in-history rendering to ever actually activate for JSON-API-advanced journeys.

## Acceptance Criteria

**AC1:** Given a skill session reaches `done: true` via `htmlSubmitTurn` (the non-streaming path) for a stage with a linked journey and `DATABASE_URL` set, When the completion fires, Then a row is inserted into `session_turns` with the same shape `handlePostTurnStreamHtml`'s own write produces (`journey_id`, `tenant_id`, `skill_name`, full `turns` array including the completing assistant turn).

**AC2:** Given the same stage is completed twice via the non-streaming path (a revision), When the second completion fires, Then the existing row is upserted (updated), not duplicated — matching `dsh-s1`'s own AC2 for the streaming path.

**AC3:** Given the Postgres write fails, When the completion write is attempted via the non-streaming path, Then the failure is logged (matching the existing `session_turns_pg_save_failed` event shape) but does not block the rest of the completion flow — matching `dsh-s1`'s own AC3.

**AC4:** Given a real journey previously advanced via the JSON API (this story's own fix in place), When its completed stage is viewed via `GET /journey/:id/stage/:stageName`, Then the chat-split read-only view renders (not the plain-artefact fallback) — closing the loop end-to-end, not just at the write layer.

## Out of Scope

- Backfilling `session_turns` for journeys that already completed before this fix ships — those remain on the plain-artefact fallback permanently (no retroactive data recovery in scope). A future story could add a one-off backfill script if judged worthwhile.
- Any change to `handlePostTurnStreamHtml`'s own already-correct write.
- The archive/rehydrate mechanism (`dsh-s5`/`dsh-s6`) — unaffected.

## NFRs

- **Performance:** Matches `dsh-s1`'s own NFR — fire-and-forget, must not add meaningful latency to the non-streaming turn response.
- **Security:** Matches `dsh-s1`'s own NFR — `tenant_id` present on every row, no `accessToken` in turn content.
- **Accessibility:** Not applicable — backend-only.
- **Audit:** None new.

## Complexity Rating

**Rating:** 1 — a small, well-understood, single-function change reusing an existing, already-tested write call exactly.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic

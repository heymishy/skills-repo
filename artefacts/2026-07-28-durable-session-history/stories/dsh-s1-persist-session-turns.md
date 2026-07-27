## Story: Persist a stage's session turns to Postgres on completion

**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Benefit-metric reference:** artefacts/2026-07-28-durable-session-history/benefit-metric.md
**Domain:** [web-ui, data]

## User Story

As a **pipeline operator using the web-ui SaaS surface**,
I want to **the conversation behind a completed stage to be durably saved, not just the final artefact text**,
So that **the conversation still exists after the server restarts, feeding both the "Resume conversation" success rate and the breadcrumb-view metrics**.

## Benefit Linkage

**Metric moved:** Resume conversation link success rate; Breadcrumb view-completed-stage shows real conversation
**How:** This story delivers the specific, observable state change both metrics require: a completed stage's conversation record continues to exist in Postgres after the process that created it has gone away. That property (data survives a restart) is independently verifiable the moment this story ships — via a direct database check, not only through dsh-s3/dsh-s4's UI — even though the operator-visible payoff (seeing that conversation rendered) is completed by dsh-s3/dsh-s4. This story unblocks dsh-s2, dsh-s5.

## Architecture Constraints

- **ADR-025** (multi-tenancy at application layer): `session_turns` rows must carry `tenant_id`, matching `journeys`' own convention, so the same `requireJourneyAccess`/`isSameTenant` guard pattern can scope reads later (story dsh-s2) — this story is write-only but must not omit the column.
- **ADR-026** (reuse before inventing): resolved at `/clarify` — new table chosen over extending `artefacts`, logged in `decisions.md`.
- **ADR-027** (live SaaS mechanisms are ordinary application code): the completion-write hook lives in `src/web-ui/routes/skills.js`, fired by a live tenant's own request — not a governed SKILL.md skill.
- **CLAUDE.md Injectable adapter rule (D37):** the DB-writing module must follow the injectable-adapter pattern — stub throws (`Adapter not wired: sessionTurnsStore. Call setSessionTurnsStore() with a real implementation before use.`), real Postgres wiring in `server.js`, and a behavioural wiring test (not just "a function reference was assigned").
- **Postgres-first, disk/memory fallback pattern:** matches the existing convention used by `journeys`/`artefacts`/`credits` — this is not a new persistence pattern, just a new table using the established one.

## Dependencies

- **Upstream:** None
- **Downstream:** dsh-s2 (shared read function reads from this table), dsh-s5 (archive job operates on this table)

## Acceptance Criteria

**AC1:** Given a skill session reaches `done: true` for a stage with a linked journey, When the completion write fires, Then a row is inserted into `session_turns` with `journey_id`, `tenant_id`, `skill_name`, and a `turns` JSONB array containing every turn from that session (matching the shape already used for the in-memory `session.turns` array).

**AC2:** Given the same stage is somehow completed twice (re-run scenario), When the second completion write fires, Then the existing `session_turns` row for that `(journey_id, skill_name)` pair is updated (upsert), not duplicated — matching `artefacts`' own `UNIQUE(journey_id, skill_name)` convention.

**AC3:** Given the Postgres write fails (e.g. connection error), When the completion write is attempted, Then the failure is logged but does not block the rest of the completion flow (artefact save, Redis delete, response to client) — matching this codebase's existing non-fatal-write-failure convention (e.g. `_diskSessionWriter.write`'s try/catch in `routes/skills.js`).

**AC4:** Given `setSessionTurnsStore()` has not been called, When the write path attempts to persist turns, Then it throws `Adapter not wired: sessionTurnsStore. Call setSessionTurnsStore() with a real implementation before use.` — proving the stub cannot silently no-op.

**AC5:** Given the real Postgres adapter is wired in `server.js`, When a wiring test inserts two different sessions for two different tenants and reads them back directly via `pg`, Then each session's `turns` content matches what was written for that specific tenant, and neither tenant's row is confused with the other's — asserting real behavioural correctness, not just that a function reference was assigned (per CLAUDE.md's D37 wiring-test rule).

## Out of Scope

- Reading turns back (that's dsh-s2) — this story is write-only.
- The archive/rehydrate mechanism (dsh-s5/dsh-s6) — this story only ever writes to the hot table.
- Any change to the existing Redis delete-on-completion behaviour — unaffected by this story; Redis remains a short-term warm cache regardless of this new durable write happening alongside it.

## NFRs

- **Performance:** The Postgres write must not add more than ~100ms to the stage-completion response path (fire-and-forget is acceptable, matching the existing Redis-write pattern in `routes/skills.js`).
- **Security:** `tenant_id` must be present on every row — no row may be written without it. Turn content must never include `accessToken` (matching `skill-session-redis.js`'s existing `_sanitise()` stripping convention).
- **Accessibility:** None identified — this is a backend-only story with no UI surface.
- **Audit:** No new audit log event required for this story specifically — the existing `artefact_saved_to_disk`-style logging convention is sufficient; a dedicated audit event may be added in dsh-s2 if reads need one.

## Data Model

New `session_turns` table (reuse-check already resolved via `/clarify`, logged in `decisions.md` — new table chosen over extending `artefacts`), plus the existing `journeys` table it references via FK (shown per this repo's convention of including existing entities a story touches, even with no schema change to them).

---CANVAS-JSON: {"type":"data-model","title":"Data model — durable session turns","content":{"mermaid":"erDiagram\n    JOURNEYS {\n        varchar journey_id PK\n        varchar tenant_id\n        varchar owner_id\n        varchar feature_slug\n        timestamptz created_at\n        jsonb data\n    }\n    SESSION_TURNS {\n        serial id PK\n        varchar journey_id FK\n        varchar tenant_id\n        varchar skill_name\n        jsonb turns\n        timestamptz created_at\n    }\n    SESSION_TURNS }o--|| JOURNEYS : \"journey_id\""}}---

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

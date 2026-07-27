## Story: A single, tenant-scoped read path for a completed stage's turns

**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Benefit-metric reference:** artefacts/2026-07-28-durable-session-history/benefit-metric.md

## Technical Enabler

**This story is a technical enabler, not an independently user-facing story.** Per `templates/story.md`'s own guidance ("If a story is a pure technical dependency, label it as a task and note which story it unblocks"), it is retained in `story.md` format (this repo has no separate task template) but labelled honestly rather than framed with a fabricated independent persona. It has no UI surface of its own and moves no metric by itself — it exists solely so dsh-s3 and dsh-s4 share one durability/access-control implementation instead of two independently-written, potentially-diverging ones.

**Unblocks:** dsh-s3 (breadcrumb view rebuild), dsh-s4 (resume-link fix) — neither can be correctly implemented without this shared read path existing first.

## User Story

As a **pipeline operator relying on both "Resume conversation" and breadcrumb navigation to reach the same completed stage**,
I want **both entry points to enforce identical durability and tenant-access-control behaviour**,
So that **I never get a different (or less safe) outcome depending on which link I happened to click — a guarantee this story provides by giving dsh-s3 and dsh-s4 one shared implementation to call, rather than two that could silently diverge**.

## Benefit Linkage

**Metric moved:** None directly — see Technical Enabler section above. Indirectly underwrites both Resume conversation link success rate and Breadcrumb view-completed-stage shows real conversation, since dsh-s3/dsh-s4 (which do move those metrics) both depend on this story's correctness.
**How:** N/A — this story is infrastructure for dsh-s3/dsh-s4, not a metric-moving change in its own right. See Technical Enabler section.

## Architecture Constraints

- **ADR-025** (multi-tenancy at application layer): this function must enforce the same `requireJourneyAccess`/`isSameTenant` guard already used by every other journey-scoped read in this codebase — a request for another tenant's turns must be rejected the same way `handleGetJourneyStageView` already rejects a cross-tenant artefact view (404, not 403 — see the existing FORBIDDEN-vs-NOT_FOUND policy in CLAUDE.md).
- **ADR-027** (live SaaS mechanisms are ordinary application code): this function lives in `src/web-ui/`, called directly by any authenticated tenant's page load — not a governed SKILL.md skill.
- **CLAUDE.md D37:** reuses dsh-s1's existing injectable Postgres adapter (`setSessionTurnsStore`) — no second, parallel adapter is introduced for reads.
- **Postgres-first, disk/memory fallback pattern:** prefers the live in-memory session (freshest) when the stage's session is still resident in the current process, falling back to the durable `session_turns` row otherwise — matching the same tiered-fallback shape already used by `_getSessionOrRestore` (memory → Redis), with Postgres replacing Redis as the durable tier for this specific data.

## Dependencies

- **Upstream:** dsh-s1 (this story reads the table dsh-s1 writes)
- **Downstream:** dsh-s3 (breadcrumb page), dsh-s4 (resume link) — both call this function

## Acceptance Criteria

**AC1:** Given a completed stage whose turns are durably persisted in `session_turns` and no longer resident in memory, When the tenant owner calls the read function for that `(journeyId, skillName)`, Then it returns the turns array from Postgres.

**AC2:** Given the same stage's session is still resident in the current process's in-memory store (e.g. the fire-and-forget write from dsh-s1 landed a moment ago but the process never restarted), When the read function is called, Then it returns the in-memory turns rather than querying Postgres — the freshest source wins.

**AC3:** Given no `session_turns` row exists yet for a `(journeyId, skillName)` pair (e.g. the stage predates dsh-s1's deployment, or the row has been archived — archive lookup is out of scope for this story, see dsh-s6), When the read function is called, Then it returns `null` rather than throwing.

**AC4:** Given a request for a journey's turns made by a session whose `tenantId` does not match the journey's `tenant_id` (and is not the journey's `ownerId`), When the read function is called, Then it returns `null` (mapped to a 404 by the caller) — never another tenant's turns, matching the FORBIDDEN-vs-NOT_FOUND policy.

**AC5 (edge case):** Given a `journeyId` that does not exist at all, When the read function is called, Then it returns `null` without throwing an unhandled exception.

## Out of Scope

- Reading from archive storage — that's dsh-s6's on-demand rehydration; this function only ever reads the hot `session_turns` table (plus in-memory).
- Any HTML rendering of the returned turns — this is a data-access function only; rendering is dsh-s3/dsh-s4.
- Write access of any kind — this story is read-only.

## NFRs

- **Performance:** A Postgres-tier read must return in under ~200ms for a typical stage (single-row lookup by primary key/unique index).
- **Security:** Enforces the existing tenant-isolation guard on every call — no bypass path exists for an unauthenticated or cross-tenant caller.
- **Accessibility:** None identified — this is a backend-only data-access function.
- **Audit:** None identified — reading one's own historical conversation is not a sensitive-enough action to warrant a dedicated audit log entry, consistent with how viewing one's own artefact is not separately audited today.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

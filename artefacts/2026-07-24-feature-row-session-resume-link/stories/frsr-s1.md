## Story: Make feature rows in a product's view clickable, linking through to the persisted conversation and artefacts for each stage

**Epic reference:** None — short-track (bounded fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator's direct observation (2026-07-24, captured in `workspace/capture-log.md`) that feature rows in a product's view are plain, non-interactive text — clicking one should resume/view the persisted SSE stream conversation and artefacts as if resuming a live session, the same pattern `icrh-s1` already built for `/ideate`'s own canvas-block session-resume hydration, just not wired to the product feature list at all.

## User Story

As **Hamish King (Founder/Operator)**,
I want **clicking a feature row in a product's view to take me to a real page showing that feature's stage-by-stage artefacts, each linked through to its actual persisted conversation history — not a static, unclickable label**,
So that **I can review what actually happened at any stage of a feature (what was discussed, what was decided) without that history being effectively invisible once the stage completes**.

## Benefit Linkage

**Metric moved:** None — pure UX/visibility fix, not tied to a Tier 1 product metric (no benefit-metric artefact exists for this short-track story, per CLAUDE.md's short-track convention). Benefit stated directly: closes a real, confirmed gap where a completed stage's actual conversation becomes practically unreachable, even though it is durably persisted.

## Architecture Constraints

- **Confirmed via direct code read (2026-07-24): the pieces already exist, just not connected.**
  - `_renderPvcItemRow` (`src/web-ui/routes/products.js`, ~line 222) renders every feature as a plain, non-linked `<div>` — the only sometimes-present link goes to a small suffix (`— [artefact filename]`, only when `item.discoveryArtefact` is set) pointing at `/artefact/:slug/discovery`, a raw markdown viewer, not a conversation view.
  - `mergeFeatureSources()` (`src/web-ui/modules/product-rollup.js`, ~line 388) already carries `item.journeyId` into every merged item that has a journey — this is already in scope for `_renderPvcItemRow`, just unused today.
  - `/features/:slug` (`src/web-ui/routes/features.js`, `handleGetFeatureArtefacts`) already renders a real, `kfd1`-styled artefact index page per feature, listing every artefact on disk with a "View" link — but this adapter (`_listArtefacts`, reading from `artefacts/[slug]/` on disk) has no concept of sessions or journeys at all; it is a pure filesystem index.
  - `handleGetChatHtml` (`src/web-ui/routes/skills.js`, `GET /skills/:name/sessions/:id/chat`) already renders the FULL turn history/conversation for ANY sessionId via `_getSessionOrRestore` (which recovers from Redis if not in memory) — this is the exact "resume as if live" mechanism the operator wants, and it works for a session regardless of whether that session's stage is the journey's current one. **This story does not build a new resume mechanism — it wires existing artefact rows to this existing route.**
- **Real, necessary gap: `completeStage()` (`src/web-ui/modules/journey-store.js`, ~line 115) does not currently record which `sessionId` produced each completed stage** — only `{skillName, artefactPath, completedAt, costUsd?, model?}`. Without this, there is no way to resolve "which session had this stage's conversation" once a journey has moved on to a later stage. This story must extend `completeStage()`'s recorded entry to also include the `sessionId` that was active at completion time (`handlePostGateConfirm` already has this value in scope — `journey.activeSessionId` — before calling `completeStage()`).
- **MVP scope decision:** wire the "resume conversation" link into the EXISTING `/features/:slug` artefact-index page (extend `renderArtefactIndexHtml`/`handleGetFeatureArtefacts` to add a second link per artefact row, alongside the existing "View" link, when a `sessionId` is resolvable for that stage — via a new featureSlug→journeyId→completedStages lookup) rather than inventing a new page. Then make `_renderPvcItemRow`'s card a real link to this existing page (`/features/:slug`), using `item.journeyId` (already available) to resolve the feature slug if `item.slug` doesn't already match a real `artefacts/[slug]/` directory (confirm this mapping during implementation — document any mismatch found in `decisions.md`).
- **Session-eviction constraint (real, already-existing, do not attempt to fix here):** `_getSessionOrRestore`'s Redis fallback is bounded by `SESSION_MAX_AGE_DAYS` (default 7 days) eviction — a "resume conversation" link for a stage completed longer ago than this may 404 or show an empty/evicted session. This is an existing, pre-dated constraint of the session-resume mechanism itself, not something this story introduces or is expected to fix; the "not found" case (AC5) must be handled honestly, not silently.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a product's feature list, When the operator views it, Then every feature row is a real, keyboard-activatable link (not a plain `<div>`) — clicking or activating it navigates to that feature's artefact-index page (`/features/:slug`).

**AC2:** Given `completeStage()` is called when a real stage completes (via `handlePostGateConfirm`), When the resulting `completedStages` entry is recorded, Then it includes the `sessionId` that was active for that stage, in addition to the fields already recorded today (`skillName`, `artefactPath`, `completedAt`, and cost fields where present).

**AC3:** Given a feature's artefact-index page (`/features/:slug`) for a feature with at least one completed stage whose `sessionId` is resolvable (post-AC2), When the page renders, Then each such stage's artefact row shows a second link/action ("Resume conversation" or equivalent plain-language label) pointing to `/skills/:skillName/sessions/:sessionId/chat` for that stage's real session — alongside, not replacing, the existing "View" (raw markdown) link.

**AC4:** Given the operator clicks a "Resume conversation" link from AC3, When the target page loads, Then it shows the complete, real turn-by-turn conversation history for that stage exactly as `handleGetChatHtml` already renders for any session — no new rendering logic invented, the existing mechanism is reused as-is.

**AC5:** Given a stage whose session has since been evicted (beyond `SESSION_MAX_AGE_DAYS`) or otherwise cannot be restored, When the operator clicks its "Resume conversation" link, Then they see a clear, honest message explaining the conversation is no longer available (matching this repo's existing "Session not found" pattern from `handleGetChatHtml`) — not a silent failure or a misleading blank page.

## Out of Scope

- Any change to `handleGetChatHtml`'s own rendering, session-restore, or eviction logic — reused entirely as-is.
- Extending `SESSION_MAX_AGE_DAYS` or building any longer-term conversation archival mechanism — the existing eviction window is an accepted, pre-existing constraint (AC5 handles it honestly, does not remove it).
- Any change to the kanban board's own card-click behaviour (`_aggregateJourneysByStage`/`_renderKanbanColumns`, the separate kanban view this session's Epic 1/2/3 work already covers) — this story is scoped to the product-page feature LIST (`_renderPvcItemRow`), a different rendering path.
- Wiring this same pattern into the org- or tenant-scoped views — scoped to the product-page feature list only for this MVP.

## NFRs

- **Performance:** The featureSlug→journeyId→completedStages lookup added to `/features/:slug` must not introduce an unbounded per-artefact query — bound it to one lookup per page render (the feature's own journey), not one per artefact row.
- **Security:** The "Resume conversation" link must respect the exact same tenant/ownership guard `handleGetChatHtml` already enforces (confirmed: `a4`'s NFR-Security check, "a resumed session is only reachable by the same authenticated user/tenant") — this story adds a new caller/link, not a new access-control decision; no weakening.
- **Accessibility:** Feature rows becoming real links (AC1) is an accessibility improvement over today's non-interactive `<div>`s — must be keyboard-focusable and activatable, not mouse-only.
- **Audit:** Not applicable beyond what `handleGetFeatureArtefacts`'s existing audit log (`feature_artefacts_accessed`) already records — no new audited action introduced.

## Complexity Rating

**Rating:** 3 — genuinely the most involved of this batch: requires a schema-shape change to `completedStages` entries (AC2), a new cross-reference lookup (featureSlug → journeyId → sessionId), and careful respect for an existing security guard (tenant/ownership) and an existing, real eviction-window constraint (AC5) that must be surfaced honestly, not glossed over.
**Scope stability:** Stable — the MVP boundary (extend the existing `/features/:slug` page, don't invent a new one) is a clear, defensible line.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — N/A (short-track, no epic); Medium oversight given this touches session-access security guards and a schema-shape change to `completedStages`

## Story: Fix "Resume conversation" to always resolve to a real conversation view

**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Benefit-metric reference:** artefacts/2026-07-28-durable-session-history/benefit-metric.md

## User Story

As a **pipeline operator returning to a feature after time has passed**,
I want to **click "Resume conversation" and always see the stage's real conversation**,
So that **I never hit "Session not found" for a completed stage, regardless of how long it's been or how many server restarts have happened since**.

## Benefit Linkage

**Metric moved:** Resume conversation link success rate
**How:** Today's "Resume conversation" link (`routes/features.js`, `_resolveResumeLinksForFeature`) points directly at `/skills/:skillName/sessions/:sessionId/chat`, which 404s via `_getSessionOrRestore` once the session is gone from both memory and Redis. This story repoints the link at dsh-s3's already-rebuilt `/journey/:journeyId/stage/:stageName` route instead — the same durable, chat+artefact split view reached via breadcrumb navigation — so both entry points share one working destination rather than two, one of which is broken.

## Architecture Constraints

- **Reuse, don't duplicate (ADR-026 spirit applied at the routing level):** rather than teaching `handleGetChatHtml`'s existing `/skills/.../chat` route a second durable-read fallback, this story repoints the link at dsh-s3's already-rebuilt stage-view route — one rendering path for "view a completed stage," reached via two navigation triggers (breadcrumb, Resume-conversation link), not two independently-maintained pages.
- **ADR-025** (multi-tenancy): the stage-view route already enforces tenant-ownership (per dsh-s3); no separate guard is introduced here.
- **ADR-027** (live SaaS mechanisms are ordinary application code): the link's `href` is computed in `src/web-ui/routes/features.js` at page-render time for any authenticated tenant — not a governed SKILL.md skill.

## Dependencies

- **Upstream:** dsh-s3 (this story repoints an existing link at dsh-s3's rebuilt destination — it does not build a new page)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a feature's artefact-index page (`/features/:slug`) with a completed stage that has a resolvable session, When the "Resume conversation" link is rendered, Then its `href` points at `/journey/:journeyId/stage/:stageName` (dsh-s3's route) rather than `/skills/:skillName/sessions/:sessionId/chat`.

**AC2:** Given the operator clicks the updated "Resume conversation" link for a stage completed before the last server restart (session gone from memory and Redis), When the page loads, Then it renders the stage's durable conversation via dsh-s2's read function — not a "Session not found" 404.

**AC3:** Given the operator clicks the updated link for a stage still resident in memory (recently completed, same server process), When the page loads, Then it still renders correctly — this fix does not regress the already-working case.

**AC4 (edge case):** Given a stage whose turns are genuinely unavailable (pre-fix history, per discovery's explicit "no retroactive recovery" scope), When the operator clicks "Resume conversation" for that specific stage, Then the page falls back to the artefact-only view (dsh-s3's AC2 behaviour) rather than a 404 — this is the one case that remains a gap, but it degrades to "no conversation shown," not a broken page.

## Out of Scope

- Any change to how the resume link is computed for a currently-in-progress (not-yet-completed) stage — unaffected, out of scope.
- Live interactivity from this entry point — same MVP boundary as dsh-s3.

## NFRs

- **Performance:** None beyond what dsh-s3 already specifies — this story only changes a link's target URL, no new render path.
- **Security:** None new — reuses dsh-s3's existing guard.
- **Accessibility:** None new — the link itself is unchanged visually, only its destination changes.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

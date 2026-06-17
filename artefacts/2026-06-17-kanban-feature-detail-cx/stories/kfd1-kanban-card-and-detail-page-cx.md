## Story: Truncated Kanban card titles, artefact-count indicator, and design-system-styled feature/artefact detail pages

**Epic reference:** N/A — short-track
**Discovery reference:** N/A — short-track (originated from operator request, 2026-06-16: "before I can run a /ideate Web session, can we run another short track enhancement to feature kanban")
**Benefit-metric reference:** `artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md`

> **Process note:** Short-track (per `docs/skill-pipeline-instructions.md` short-track lane and
> `.github/skills/workflow/SKILL.md` short-track confirmation). Path: `/test-plan → /definition-of-ready →
> inner coding loop`. No `/discovery`, `/benefit-metric`, `/definition`, or `/review` for this story.
> Operator explicitly scoped this work to items 1–4 of their request and deferred item 5
> ("determine next-best-action and kick it off from the view") to a separate future `/discovery` session —
> see Out of Scope.

## User Story

As a **platform operator**,
I want **Kanban feature cards to show short, correctly-encoded titles with an artefact-count indicator, and
feature/artefact detail pages styled with the same design system as the rest of the web UI**,
So that **I can scan WIP at a glance and read artefact detail without leaving the platform's visual language (M1)**.

## Benefit Linkage

**Metric moved:** M1 — WIP visibility (`artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md`)
**How:** M1's target is "all active features visible ... without scrolling" and legible at a glance. Long
unbounded titles, encoding artefacts, and two features currently silently dropped from every lane (see AC5)
all directly work against that target; this story removes those obstacles and adds an artefact-count signal
so an operator can judge "how much is here" without leaving the board.

## Architecture Constraints

- Render-only for the Kanban board: no pipeline-state.json stage writes from this story (consistent with
  pmf.1's constraint — stage transitions go through `skills advance` / CDG.4 gate-confirm, not this view).
- All rendered content HTML-escaped via `escHtml` from `src/web-ui/utils/html-shell.js` — no new templating
  engine.
- Reuse the existing hand-rolled `renderArtefactToHTML()` in `src/web-ui/utils/markdown-renderer.js` as-is —
  no new markdown dependency (marked/remark). Only its wrapping (`renderShell`) and CSS are missing.
  Confirmed by full read: the renderer's logic is correct and already strips `<script>`/`<iframe>` (ADR-012).
- No new npm dependencies for any AC in this story.
- Local-first artefact reads (AC2, AC3, AC4) must follow the existing local-first pattern already used for
  pipeline-state (`src/web-ui/server.js` `setFetchPipelineState`): read from disk when `COPILOT_REPO_PATH`
  -relative `artefacts/<slug>/` exists, falling back to the existing GitHub Contents API fetch otherwise —
  so in-flight branch work is visible locally, consistent with the existing pipeline-state precedent.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known. The deferred item 5 (next-best-action + kick-off-from-view, see Out of Scope)
  will likely build on the restyled detail page this story produces, but is not blocked by it structurally —
  it is a separate future story.

## Acceptance Criteria

**AC1 — Card title length and encoding:** Given a feature card on `/features?view=board` whose resolved
title (`title || name || slug`) exceeds 48 characters, when the board renders, then the displayed title is
truncated to 48 characters with a trailing ellipsis, and the full untruncated title is present in a `title=`
HTML attribute on the card for hover. Given a feature record in `.github/pipeline-state.json` whose `name`
field contains mis-decoded UTF-8 byte sequences (confirmed present in `2026-04-19-skills-platform-phase4-opus`,
`2026-04-14-skills-platform-phase3`, and `2026-04-23-non-technical-channel`), when this story is delivered,
then those three `name` field values are corrected to display the intended em dash ("—") with no mojibake
sequence (`Ã`, `â€`, etc.) remaining.

**AC2 — Artefact-count indicator:** Given a feature with artefacts on disk under `artefacts/<slug>/`
(including files nested in subdirectories such as `dor/`, `stories/`, `test-plans/`), when its Kanban card
renders, then the card displays a count of artefacts found for that feature. Given a feature with zero
artefacts, when its card renders, then the card displays an explicit "no artefacts yet" indicator rather than
omitting the badge silently.

**AC3 — Detail page follows design system:** Given an authenticated user navigates to `/features/:slug`, when
the page renders, then the artefact list is presented as a styled, grouped (by pipeline stage) layout using
`DESIGN_SYSTEM_CSS` tokens (not a bare unstyled `<ul>`), consistent with the visual language used by
`renderShell()` elsewhere in the web UI (nav, surface/ink/line colour tokens, typography).

**AC4 — Single artefact page follows design system and renders markdown properly:** Given an authenticated
user navigates to `/artefact/:slug/:type`, when the page renders, then the response is wrapped in
`renderShell()` (nav, design-system CSS) rather than a bare unstyled HTML document, and the rendered markdown
content (headings, paragraphs, lists, tables, the metadata bar) has corresponding CSS rules so it is legible
and consistent with the rest of the platform, not unstyled browser-default markup.

**AC5 — No silently dropped features:** Given a feature in `pipeline-state.json` with `stage: "ideation"`
(confirmed present for `2026-04-23-non-technical-channel` and `2026-05-20-cloud-platform`), when the board
renders, then that feature's card appears in the Discovery lane rather than being omitted from every lane.

**AC6 — Recursive artefact listing correctness:** Given a feature whose artefacts live in subdirectories
(e.g. `dor/`, `stories/`, `test-plans/` — the common case per the b3 and pmf precedents), when artefacts are
listed for that feature (used by both AC2's count and AC3's detail page), then files in those subdirectories
are included in the result — not only files directly at the `artefacts/<slug>/` root.

## Out of Scope

- Determining "next best action" for a feature/story and surfacing it on the card or detail page — existing
  `featureActionMeta`/`storyNextSkill` logic in `.github/scripts/viz-functions.js` is stranded (used only by
  the separate `dashboards/pipeline-viz.html`, never wired into web-ui) and wiring it in is new exploratory
  scope. Deferred to a future `/discovery` session per explicit operator instruction (2026-06-16).
- Triggering a skill/pipeline action (e.g. starting a session, advancing a stage) directly from the Kanban
  board or detail page. Deferred with the item above — same future `/discovery` session.
- In-place editing of artefact markdown from the detail page. Deferred with the item above.
- Drag-and-drop stage transitions on the Kanban board — unchanged from pmf.1's render-only constraint.
- Any change to the `/features` flat-list view (non-board) — out of scope; only the board view and the two
  detail pages (`/features/:slug`, `/artefact/:slug/:type`) are touched.

## NFRs

- **Performance:** Local-first artefact listing for the board view (AC2) must not introduce noticeable
  latency for a pipeline of up to ~25 features — filesystem reads only, no added network calls for the local
  dev path.
- **Security:** No change to auth guards on any touched route — `/features/:slug` and `/artefact/:slug/:type`
  continue to redirect unauthenticated HTML requests to `/auth/github` exactly as today. All rendered text
  remains HTML-escaped via `escHtml`; the markdown renderer's existing `<script>`/`<iframe>` stripping
  (ADR-012) is unchanged.
- **Accessibility:** Truncated card titles (AC1) must remain readable via the native `title=` attribute
  tooltip; no information is lost, only deferred to hover/focus.
- **Audit:** No change to existing audit log calls on `/features/:slug` (`feature_artefacts_accessed`) or
  `/features` (`feature_list_accessed`) — both already log userId, route, and timestamp.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — N/A (short-track, no parent epic); oversight level
  set directly in DoR per the b3-boolean-coercion short-track precedent.

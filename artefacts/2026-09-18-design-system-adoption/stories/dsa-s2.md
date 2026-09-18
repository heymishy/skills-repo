## Story: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## Amendment note (2026-09-19)

At `/implementation-plan` time, direct investigation found the real `handleDashboard` route (`routes/dashboard.js`) renders only a placeholder `<h1>Dashboard</h1>` body — it never calls `renderDashboard` (`views/dashboard-view.js`), a fully-built, already-token-correct view function whose structure (greeting, "Run a skill" grid, "Waiting on you"/"Recent sessions" columns) closely matches `Skills Platform - Dashboard.dc.html`'s real mock, down to nearly identical data-shape names. `renderDashboard` is otherwise dead code — its only other references are inside `src/web-ui/port-extract/port/` (a scratch/integration staging area, not live application code). Wiring it live requires real data for 3 pieces that had no data source at all before this amendment (a static skill catalog, recent-session history, in-progress session count) plus a mapping layer for the one piece that does have a source (the pending-actions queue, whose real field names differ from `renderDashboard`'s expected shape). Presented to the operator as a scope choice (narrower structural-restyle-with-placeholders vs. full live-data wiring); operator chose full live-data wiring. ACs 5-7 below are new as a result — the story's original AC1-AC4 are unchanged in substance, only re-numbered/retitled where the story title itself needed to reflect the expanded scope. See `decisions.md` for the full investigation trail (real data sources found: `adapters/action-queue.js`'s `getPendingActions`; `modules/journey-store.js`'s `listJourneys`/`completedStages`).

## User Story

As a **Hamish King (Founder/Operator)**,
I want **the dashboard — the screen I use most as day-to-day operator — to look like a modern, consistent SaaS product**,
So that **my own daily experience of the platform reflects the brand direction being set, not the dated "Notion-calm" styling**.

## Benefit Linkage

**Metric moved:** Visual consistency across the 4 real screens
**How:** This story converts the dashboard — one of the 4 real screens the metric counts — from the old token values to `DESIGN.md`'s exact token values, moving the metric from 1/4 (after `dsa-s1`) toward 4/4.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one."
- Confirmed via `/clarify`: reuse and extend `src/web-ui/utils/html-shell.js`'s existing CSS custom-property blocks. **Real structure (see `decisions.md`, "FEATURE-WIDE: the real CSS selector structure is inverted" entry): bare `:root` is LIGHT mode, `[data-theme="dark"]` is the DARK override (plus its `@media` no-JS fallback twin) — update both, not just one "dark-mode block."** Update hex values to match `DESIGN.md`'s token table. **Corrected feature-wide (see `decisions.md`, "FEATURE-WIDE: --green/--amber/--red cannot be renamed" entry, found during `dsa-s1`'s `/implementation-plan`): `--success`/`--warn`/`--danger` are added as NEW aliases alongside the existing `--green`/--amber`/`--red` — the old names are NOT renamed or removed, since 25+ usages across 8 files outside this epic's scope depend on them. `dsa-s1` adds the new aliases at the shared `html-shell.js` level; this story consumes the new names in its own markup and does not need to touch the old names at all.**
- Real target files (confirmed to exist): `src/web-ui/routes/dashboard.js`, `src/web-ui/views/dashboard-view.js`.
- **The sidebar (`.sw-sidebar` in `html-shell.js`'s `renderShell`) is already real, already shared across every page, and already token-correct after `dsa-s1`'s Task 1 — it is NOT rebuilt by this story.** `renderShell`'s sidebar (brand, Products list, Org board nav, Settings, account) already structurally matches `DESIGN.md`'s "Dashboard/app shell" sidebar pattern. This story's own work is confined to the main content column (`handleDashboard`'s `bodyContent`), not the shell around it.
- **`renderDashboard` (`views/dashboard-view.js`) is the real target for the main content column** — wire it into `handleDashboard`, replacing the placeholder `<h1>Dashboard</h1>` body. Its inline `<style>` block already references only real, already-correct token names (`var(--surface)`, `var(--line)`, `var(--ink)`, `var(--muted)`, `var(--muted-2)`, `var(--accent)`, `var(--accent-ink)`) — no `--green`/`--amber`/`--red`/`--success`/`--warn`/`--danger` usage, so no token-aliasing work is needed inside this file itself.
- **Real data source for "Waiting on you" (pending actions):** `adapters/action-queue.js`'s `getPendingActions(userIdentity, token)`, already imported and called by `handleDashboard`'s sibling `handleGetActions` (the existing `GET /api/actions` route) — reuse the same adapter, do not build a second one. Its real return shape (`{ items: [{featureName, artefactType, daysPending, artefactUrl}], bannerMessage }`) does NOT match `renderDashboard`'s expected `actions` shape (`{what, feature, age, you}`) — a small mapping function is required (`what` derived as `"Sign off " + artefactType`, `feature` ← `featureName`, `age` ← `daysPending` formatted as relative text e.g. "2d ago"/"today", `you` ← `true` for every item, since `getPendingActions`'s results are already scoped to the current signed-in user's own accessible repos — there is no separate "assigned to someone else" concept in this data model). `pendingActionsCount` ← `items.length`.
- **Real data source for in-progress session count and recent sessions:** `modules/journey-store.js`'s `listJourneys()` (already wired for `NODE_ENV=test` per `dsa-s1`'s own Task 6 finding — real production wiring status to be confirmed at `/implementation-plan` time) and each journey's `completedStages[]` array (`{skillName, artefactPath, completedAt, sessionId?}`, populated by `completeStage()`). `inProgressCount` ← count of journeys where `!journey.complete`. `recent` ← flatten `completedStages` across the user's own accessible journeys, sort by `completedAt` descending, take the most recent N (5, matching the mock's own placeholder count); `skill` ← `skillName`, `feature` ← the owning journey's `featureSlug`, `when` ← `completedAt` formatted as relative text, `stage` ← literal `"done"` (a `completedStages` entry is by definition a completed stage — there is no partial/in-review sub-state in this data model to distinguish further), `pillBg`/`pillColor` ← the existing `--success-soft`/`--success` token pair (matching the mock's own green "done" pill).
- **New static skills catalog needed for "Run a skill":** no existing centralized catalog of skill name/label/description/estimate exists anywhere in this codebase (`routes/skills.js` only has inline `skillName === '...'` conditionals, no metadata array). A small new static array (6 real, commonly-run skill names — `discovery`, `definition`, `test-plan`, `implementation-plan`, `subagent-execution`, `definition-of-done` — with real label/description/estimate text) is genuinely new, low-risk, platform-wide (not per-user) configuration data, not a data-fetching mechanism. Each card's link target (`/api/skills/:name/sessions`, POST) already exists and is exercised elsewhere in this codebase (`dashboard-view.js`'s own pre-existing markup already assumes this exact route shape).

## Dependencies

- **Upstream:** `dsa-s1` (adds the new `--success`/`--warn`/`--danger` token aliases at the `html-shell.js` level, per the feature-wide correction in `decisions.md` — this story depends on those aliases already existing to avoid two stories racing to touch the same shared file; also confirms `renderShell`'s sidebar is already token-correct, which this story depends on for AC3 without needing to touch the sidebar itself).
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given the dashboard is rendered in dark mode, When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s dark-mode token table exactly.

**AC2:** Given the dashboard is rendered in light mode (via the existing Settings toggle), When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s light-mode token table exactly.

**AC3:** Given the dashboard follows `DESIGN.md`'s "Dashboard/app shell" layout pattern (fixed 224px sidebar with products list + main nav + account nav pinned to bottom, fluid main column, max-width 1080px content), When the real page is rendered, Then this structure is present and visually matches the `Skills Platform - Dashboard.dc.html` mock.

**AC4:** Given the dashboard's pre-existing functionality (product list, navigation, account nav), When the restyle is applied, Then no existing functional behavior regresses — verified by running this screen's own pre-existing test coverage before and after the change.

**AC5:** Given a signed-in user has pending sign-off items across their accessible repos, When the dashboard renders, Then the "Waiting on you" list shows each real pending item (feature, artefact type, how long it's been pending) fetched via the existing `getPendingActions` adapter — not static/placeholder content.

**AC6:** Given the dashboard renders, When the "Run a skill" section is inspected, Then it shows a real, defined set of the platform's own skills (name, description, estimated time) that link to real, working `POST /api/skills/:name/sessions` session-start actions.

**AC7:** Given a signed-in user has one or more in-progress or recently-completed journeys, When the dashboard renders, Then the greeting reflects a real in-progress session count (derived from real journey data, not a placeholder) and "Recent sessions" shows the user's most recently completed pipeline stages (skill name, feature, when completed) — empty/zero states shown honestly when there is no real data, never a stale placeholder number.

## Out of Scope

- Any other of the 3 remaining real screens (artefact viewer covered by `dsa-s1`, landing, skill-session chat) — each has its own story.
- Fixing the stale/dead nav links already tracked separately in the `web-ui-experience-redesign` feature's Epic B — this story is a visual restyle only, not an information-architecture fix.
- Building the `design.system` DoR governance mechanism — that is `dsa-s5`.
- Rebuilding or restyling `renderShell`'s sidebar — already real, already shared, already token-correct after `dsa-s1`.
- A "reviewed"/"in review" sub-state for recent sessions, or any other richer status taxonomy beyond "done" — the real `completedStages` data model has no such distinction to draw from.
- Cross-tenant/cross-repo action-queue filtering beyond what `getPendingActions` already does — reused exactly as it already works, not modified.
- Making the static skills catalog dynamically configurable, editable, or sourced from a new registry — a small hardcoded array is sufficient for this story's scope.

## NFRs

- **Performance:** No measurable page-load regression from the restyle. `getPendingActions`'s real repo-access-validation loop (already a live-network-bound operation on the existing `/api/actions` route) is now also invoked on the dashboard's own page load — confirm no unacceptable added latency (existing route's own established performance characteristics apply, not a new NFR).
- **Security:** None identified beyond what `getPendingActions`/`listJourneys` already enforce (server-side repo-access validation, session-scoped data only).
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9) — no regression to existing accessibility properties.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 3

<!-- Amended from 2 to 3: the original visual-restyle-only scope was Complexity 2 (well understood, clear path). The full-live-data-wiring amendment adds real ambiguity — 3 new data-wiring pieces (2 new data derivations from existing-but-unused sources, 1 new static catalog, 1 mapping layer) that weren't part of the original architecture investigation, and production wiring status for listJourneys() needs confirming at /implementation-plan time (dsa-s1's own Task 6 finding noted it was already wired for NODE_ENV=test, but real production wiring wasn't independently re-confirmed here). -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

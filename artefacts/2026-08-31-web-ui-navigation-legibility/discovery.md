# Discovery: Web UI Navigation and Context Legibility

**Status:** Approved
**Created:** 2026-08-31
**Approved by:** Hamish King — Platform Owner — 2026-08-31
**Author:** Claude (agent, with Hamish King)

---

## Problem Statement

Across a single web-UI-driven feature session (the operator's first full end-to-end feature completed via the web UI rather than the CLI), two related legibility problems surfaced (a third, originally bundled here, was independently resolved by unrelated work shipped 2026-09-01 through 2026-09-10 — see Amendment log). First, the "Ref docs" context panel lists every loaded context file (SKILL.md, mission.md, tech-stack.md, constraints.md, roadmap.md) as its own always-visible row, with no way to collapse it to a single indicator and drill in only when needed. Second, mid-session the operator sometimes loses track of where the "next stage / continue" action is and cannot find it — a navigation affordance gets lost in the chat scroll. A third, distinct problem was added 2026-09-10 (see Amendment log): a feature or story authored via Claude Code CLI (no web-UI session, no product association) has no path to it from the primary `/dashboard` landing page after login — the dashboard body lists only products; the only way in is the left-hand sidebar's "No product" link, which is not an obvious or discoverable affordance on its own. Root cause: `cross-channel-feature-continuity` (epic `ep1-s1`-`s6`, already DoD-complete) built exactly the mechanism needed — `_mergeStateFeaturesIntoJourneyList`, which merges CLI-only `pipeline-state.json` features into a journey list — but wired it only into the `/journey` route's own list, never into `handleGetDashboard`'s landing-page body. The underlying thread connecting all three: once a session has run for a while, or once work has happened outside the web UI entirely, the UI does not give the operator an at-a-glance way to see where they are or what exists — everything lives in one long chat scroll, or requires already knowing which specific nav link surfaces CLI-only work.

## Who It Affects

Operators running a full multi-stage outer-loop feature through the web UI specifically, not the CLI — the Developer/engineer and Platform maintainer personas from `product/mission.md`. The problem does not show up in a short, single-stage session; it emerges once a session has accumulated real history — several completed stages, a growing context panel, several artefacts on disk — and the operator needs to orient themselves (where am I, what has already been produced, what do I do next) rather than just react to the latest message. Both first-time web-UI users and experienced CLI users switching to the web UI are affected equally — this is not a first-time-only onboarding gap. The third item (dashboard discoverability) affects a distinct but overlapping case: an operator who works across both channels — starting or continuing features via Claude Code CLI, then later opening the web UI to check status, hand off, or continue from a different device — and expects to move seamlessly between the two regardless of which one started the work. Confirmed twice live in one session (2026-09-10): once failing to locate this very discovery, once failing to locate `jasb-s1`'s own DoD — both CLI-authored, no-product features, both invisible from the dashboard landing page.

## Why Now

This is the first time this repo's own web UI outer loop was exercised end-to-end, for its full duration, by someone actually depending on it to get real work done, rather than short test sessions or CLI-driven work. The friction only shows up at that "full journey" scale, which nobody had reached before this session. It also directly threatens one of the platform's own stated success outcomes (`product/mission.md`): "Run the full outer loop unassisted — self-directed, single session, without help from the platform team." If an operator cannot tell where they are or find the next-stage action, that outcome fails specifically for web-UI users, even though the CLI path already meets it. Additionally, the platform is in active beta with real users providing feedback; this session (the operator's own usage, not yet an external report) is an early signal of exactly the kind of friction beta users are likely to hit too, ahead of broader feedback arriving.

## MVP Scope

A collapsed context indicator replacing the always-expanded file-by-file "Ref docs" list — a single summary state, clickable to expand and see what is loaded. A persistent next-stage action — the "continue to next stage" control stays reachable regardless of scroll position or session length, so it is never lost in the chat. A third item added 2026-09-10: extend `_mergeStateFeaturesIntoJourneyList`'s existing merge-in logic (or an equivalent) so no-product, CLI-authored features are discoverable directly from the `/dashboard` landing page — not sidebar-only — closing the residual gap in the already-complete `cross-channel-feature-continuity` epic. Minimum viable form: a visible "No product (N)" entry point on the dashboard body itself, linking to the same `/journey` no-product list the sidebar already provides — reusing the existing list, not building a second one. (A basic per-feature artefact browser was originally scoped as a fourth MVP item; it is now removed — see Out of Scope and Amendment log — because it was independently built and shipped between 2026-09-01 and 2026-09-10.) All three remaining items are small, related fixes to the same underlying problem (can't tell where I am, or what exists, regardless of which channel produced it) and are bundled into one MVP rather than split, since each addresses a distinct point in the same "lost or invisible work" failure mode.

## Out of Scope

- The feature summary page redesign — no specific defect named yet, just "needs a look"; too undefined to bound into this MVP, deserves its own scoping pass separately once specific defects are identified (captured in `workspace/capture-log.md`, 2026-08-31).
- A per-feature artefact browser (list/open a feature's epics, stories, test plans, DoR artefacts individually) — originally in MVP scope here, now removed: independently built and shipped as fadm-s1 (PR #841) on top of the cat-s1/s2/s3 canonical artefact trace, live at `/features/:slug`, with a follow-up bugfix (dmcb-s1, PR #852, merged 2026-09-10). See Amendment log.
- Inline editing of artefacts from the browser view — MVP is view/open only, not an editing surface.
- Any redesign of the chat/streaming interaction model itself — this is about navigation and legibility around the chat, not replacing it.

## Assumptions and Risks

Confirmed via /clarify: both remaining MVP items (context-panel collapse, persistent next-stage action) reuse UI patterns already established elsewhere in this codebase — the kanban board's styling and sticky-positioning already used elsewhere. Re-verified 2026-09-10: a stronger, already-live precedent than originally cited exists for the sticky element specifically — `src/web-ui/utils/html-shell.js`'s `.sw-imp-banner` (impersonation banner) is a production `position: sticky` element. No new design-system components required.
Confirmed via /clarify: "persistent next-stage action" means a sticky/fixed-position element within the existing chat layout — the smallest, most contained option, not a shared-shell navigation redesign.
[Superseded 2026-09-10 — see Amendment log] The former artefact-browser assumption (disk-canonical reads, ADR-023) is now moot: that MVP item is out of scope. Kept for the record: the underlying "disk is canonical" pattern this assumption relied on was itself partially superseded in the interim by lpmf-s1, which fixed `listArtefacts` to merge local disk + Postgres rather than read disk-only, after disk-only reads were found to silently drop artefacts.

Risks: Making the next-stage button "always visible" risks visually cluttering the chat UI if not designed carefully — trading one legibility problem for another. This MVP is not worth building if beta user feedback, once it starts arriving, shows this friction is idiosyncratic to power-usage patterns rather than a common first-time-user experience. The context-panel and next-stage items touch `src/web-ui/routes/skills.js` (context-panel rendering around line 2680, next-stage gate rendering around line 4569) — the same file recently modified by fadm-s1/dmcb-s1 (the artefact-browser matrix work). The dashboard-discoverability item touches `src/web-ui/routes/products.js`'s `handleGetDashboard` and `getProductsNavSummary` (and reuses `handleGetJourney`'s existing `_mergeStateFeaturesIntoJourneyList` from `journey.js`) — a different file area, low conflict risk with the other two items, but worth confirming `products.js` hasn't changed shape again by the time implementation starts, given how much has landed on this codebase in the past two weeks. Rebase against current master before starting implementation regardless.

## Directional Success Indicators

**Time-to-orientation after returning to a long-running session:** Baseline: [UNKNOWN BASELINE] — not currently measured. Target: an operator can identify current stage and next action within a few seconds of the page loading, without scrolling. Measured via: not yet defined — a candidate for `/benefit-metric` to turn into something concrete (e.g. a timed usability check, or a proxy like clicks-before-first-meaningful-action).

**Next-stage-action findability:** Baseline: this session, at least once, the operator could not find it. Target: zero "can't find next stage" reports across beta sessions. Measured via: beta feedback / support signal, once that channel exists.

**Web UI Session Start Share** (existing benefit metric from the `cross-channel-feature-continuity` feature, target greater than 50% web UI starts within 4 weeks): this feature is a plausible contributor to that pre-existing metric rather than a new metric of its own — worth linking rather than duplicating.

**Cross-channel feature discoverability from the dashboard:** Baseline: 0% — no CLI-authored, no-product feature is currently reachable from `/dashboard`'s own body; the only path is the sidebar's "No product" link, confirmed missed twice live in one session (2026-09-10). Target: 100% of non-terminal features, regardless of originating channel, reachable within one click from the dashboard landing page. Measured via: direct code check (does `handleGetDashboard`'s own body include a no-product entry point) plus a repeat of the same live-Chrome walkthrough used to find the gap.

## Constraints

The web UI is an Express-less Node.js HTTP server with a "no new npm dependencies" constraint already established in this codebase (architecture guardrails / ADR-009) — any UI work should reuse existing rendering/CSS/vanilla-JS patterns already present (e.g. the kanban board, the reference-modal), not introduce a new frontend framework or dependency. This is live, in-beta production infrastructure — changes must be additive and non-disruptive to existing sessions and artefact history, consistent with how every fix shipped in the preceding session was scoped. Team capability is a solo operator plus AI agent — no dedicated design/UX team member for a formal design pass; the design work happens inside this same discovery-through-implementation loop. No hard deadline is named, but beta is actively running, so there is real pressure to not let this sit too long.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- None — solo operator session (contributor and approver are the same person, Hamish King, Platform Owner). No non-engineering reviewer available for this discovery; M3 (non-engineering outer loop attribution rate) is not measured for this feature.

## Approved By

Hamish King — Platform Owner — 2026-08-31

---

**Next step:** Human review and approval → /benefit-metric

---

## Amendment log

[2026-09-10] Re-checked for staleness against current codebase (11 days after original approval, during which unrelated work shipped). Finding: MVP item 2 ("basic per-feature artefact browser") was independently built and shipped by a separate initiative — fadm-s1 (PR #841, document table + clickable matrix replacing the old accordion), built on the cat-s1/s2/s3 canonical disk-based artefact trace, with a bugfix (dmcb-s1, PR #852, spurious/duplicate columns) merged 2026-09-10 — live at `/features/:slug`. Item 2 struck from Problem Statement, MVP Scope, and Assumptions; moved to Out of Scope. Items 1 (context-panel collapse) and 3 (persistent next-stage action) re-verified against current code and confirmed still accurate and unaddressed (`src/web-ui/routes/skills.js:2680` and `:4569` respectively). Also found: the sticky-positioning precedent cited in Assumptions is stronger than originally stated (a live production example — `.sw-imp-banner` — exists, not just a general pattern), and the ADR-023 "disk is canonical" assumption the artefact-browser item relied on was itself partly superseded by lpmf-s1's disk+Postgres merge fix — moot here since the item is now out of scope, but noted for any future feature that cites ADR-023 for artefact reads. No change to constraints (no new npm dependencies, no frontend framework — re-confirmed against current `package.json`). Full investigation detail available in this session's transcript; not separately filed. Status left as `Approved` pending a fresh /clarify pass on the narrowed two-item scope.

[2026-09-10, later the same day] Operator explicitly requested the discovery be expanded to cover "seamlessly moving between Claude Code and web UI sessions regardless of which started it," after independently hitting this exact friction twice live: once failing to locate this very discovery from the dashboard, once failing to locate `jasb-s1`'s own DoD the same way. Investigation traced the root cause to a genuine residual gap in the already-DoD-complete `cross-channel-feature-continuity` epic (`ep1-s1`-`s6`): `ep1-s1`'s own `_mergeStateFeaturesIntoJourneyList` mechanism, which makes CLI-only `pipeline-state.json` features discoverable, is wired only into `/journey`'s own list — never into `handleGetDashboard`'s landing-page body, which queries only the real `products` table. Added as a third MVP item (Problem Statement, MVP Scope, Who It Affects, and a new Directional Success Indicator all updated). Not treated as a new, separate discovery — it fits the same "can't tell where I am / what exists" thread this discovery already covers, and the operator asked for it to be folded in here rather than spun out.

## Clarification log

[2026-08-31] Clarified via /clarify:
- Q: Can the context-panel collapse, artefact browser, and persistent next-stage action all be built with existing UI patterns already in this codebase, or does any of them need something new?  A: All three reuse existing patterns (kanban board styling, the reference-modal's expand/collapse mechanism, sticky-positioning already used elsewhere) — no new design-system components.
- Q: Does "persistent next-stage action" mean a sticky/fixed-position element within the existing chat layout, or something closer to a full navigation redesign?  A: Sticky/fixed-position element within the existing chat layout — smallest, most contained option.
- Q: Should the artefact browser read directly from disk, or does it need a new data store/index?  A: Direct disk reads, matching ADR-023 — no new data store or index.

[2026-09-10] Clarified via /clarify (re-run after Amendment log staleness fix):
- Q: With the artefact browser removed, the MVP is now 2 small changes, each with an existing live pattern to copy — should this stay on the standard track (continue to /benefit-metric), move to short-track, or split?  A: Standard track — continue to /benefit-metric. These are UI/UX legibility changes tied to a named platform success outcome (unassisted outer loop), worth a real benefit metric before building.

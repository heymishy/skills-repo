## Story: Audit and fix the navigation path into `/features/:slug`

**Epic reference:** artefacts/2026-09-05-feature-page-ux-redesign/epics/page-and-nav-redesign.md
**Discovery reference:** artefacts/2026-09-05-feature-page-ux-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-09-05-feature-page-ux-redesign/benefit-metric.md
**Domain:** [web-ui, ui]

## User Story

As an **operator (Developer/Engineer or Tech Lead) or prospective client evaluating the platform**,
I want to **reach a feature's artefact-index page from the dashboard, a product page, or a story's own DoD without a dead-end or confusing hop, via a known and confirmed set of real entry points**,
So that **the navigation experience itself doesn't undermine the polished page this epic delivers — per the discovery's own MVP scope, which named the nav path as an explicit, coequal concern alongside the page's visual design.**

## Benefit Linkage

**Metric moved:** M3 (Navigation path clarity into `/features/:slug`)
**How:** This story performs the click-through audit that establishes M3's baseline (currently "not yet established" in the benefit-metric artefact) and its target, then fixes any dead-end or confusing hop found — directly producing the measurement this metric requires, not just a proxy for it.

## Architecture Constraints

- **`html-shell.js` is the single canonical source** for shared nav/shell structure (`renderShellWithNav` in `products.js` wraps it) — any nav-path fix that touches shell-level navigation must modify `html-shell.js` or its documented wrapper, not introduce a second, parallel nav-rendering path in `features.js` or elsewhere.
- No regulated compliance framework applies (confirmed at epic level, Step 4a not triggered).
- **None identified beyond the above** — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** None
- **Downstream:** None — independently shippable from fpux.1, per the epic's vertical-slice rationale.

## Acceptance Criteria

**AC1:** Given the three entry points named in discovery (dashboard, a feature's product page, a story's own DoD "Resume conversation"/artefact link), When each is audited by tracing the actual route/link chain in `src/web-ui`, Then a documented, exhaustive list of every real entry point into `/features/:slug` exists in this story's own write-up (confirming the three, or naming any additional real entry point found, per the discovery's own Clarification log commitment to this audit).

**AC1 audit result (2026-09-05):** 4 real entry points confirmed via `grep -rn "features/" src/web-ui/routes/*.js src/web-ui/views/*.js`:
1. Dashboard list row (`features-view.js:58`)
2. Product page feature-list item (`products.js:332`)
3. Story-DoD/session-completion redirect (`journey.js:3267`, inside `handleGetJourneyById`)
4. Kanban board card (`kanban-view.js:50`) — not named in discovery; in-scope per the discovery's own Clarification log Q4.

**AC2:** Given each of the three entry points named in discovery (the dashboard, a feature's product page, a story's own DoD resume/artefact link), When a user follows it end-to-end toward a target feature's `/features/:slug` page, Then it leads directly there — with no intermediate 404, unauthenticated redirect loop, or a landing page requiring an unexplained extra step to reach the intended feature.

**AC3:** Given a dead-end, broken, or confusing hop is found during the AC1/AC2 audit, When this story is marked complete, Then that hop has been fixed in the relevant route/view file and re-verified to no longer reproduce — the audit does not stop at documentation if a real defect is found.

**AC3 result (2026-09-05):** No dead-end, broken, or confusing hop found across any of the 4 confirmed entry points. Entry points 1–3 have existing, passing regression coverage (frsr-s1 E2E; kcrs-s1 integration suite, 7/7 passing); entry point 4 (kanban board card) was previously untested and is now confirmed correct via `check-fpux.2-nav-entry-points.js` (2/2 passing — direct href, correct escaping). AC3 closes as "no defect found" — not applicable to fix, per the AC's own conditional design.

**AC4:** Given the audit is complete, When this story is marked complete, Then `artefacts/2026-09-05-feature-page-ux-redesign/benefit-metric.md`'s M3 row is updated from "baseline: not yet established / target: TBD" to the real baseline (click/decision count and entry-point list established by AC1) and a concrete target (e.g. "0 dead-end hops, same or fewer clicks than baseline").

## Out of Scope

- Redesigning the visual appearance of the dashboard, product page, or breadcrumb — this story fixes *routing/link correctness and completeness*, not visual design (that's `fpux.1`'s scope, bounded to the `/features/:slug` page itself).
- Any nav path into pages other than `/features/:slug` (e.g. `/products/:id` itself, `/dashboard` itself) — only the paths that terminate at `/features/:slug` are in scope.
- Adding new entry points that don't currently exist (e.g. a search bar, a bookmarks feature) — this story audits and fixes what exists today, per the discovery's Out of Scope ("no new functionality").

## NFRs

- **Performance:** None identified — no new queries or heavy computation; this is a routing/link-correctness fix.
- **Security:** None identified — no new data exposure; existing auth-guard behavior on `/features/:slug` (302 to `/auth/github` when unauthenticated) is unchanged.
- **Accessibility:** All nav links/breadcrumbs remain keyboard-navigable `<a>` elements (native browser behavior) — no new custom interactive nav control is introduced that would require additional ARIA work.
- **Audit:** Not applicable — no new state-changing action.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

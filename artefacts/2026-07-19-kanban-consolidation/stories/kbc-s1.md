# Story: Consolidate kanban rendering into one shared pattern; retire /features, /actions, /status in favour of product/org-scoped boards

**Epic reference:** None — short-track (bounded refactor + deprecation, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the architectural gap found during staging verification of the product-rollup epic
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator or coding agent maintaining the web UI's kanban-style views**,
I want **one shared kanban-rendering pattern used by every scope that needs a board (at minimum product and org), instead of two independent, inconsistent implementations**,
So that **a fix or improvement to how a board renders only needs to happen once, and the older repo-level `/features`/`/actions`/`/status` views can be retired now that the tenant/org/product model has superseded the single-repo model they were built for**.

## Benefit Linkage

**Metric moved:** Maintainability of the kanban/board feature surface — currently two independent implementations (`src/web-ui/views/kanban-view.js`'s `renderKanban`, consumed only by `/features?view=board`; and `handleGetProductKanban`/`handleGetOrgKanban` in `products.js`, which are JSON-only with no rendering at all) that will silently drift apart the moment either is touched without the other in mind.
**How:** Confirmed via direct code read on 2026-07-19: `/features?view=board` is a real, working, GitHub-repo-backed HTML kanban board. `/products/:id/kanban` and the org equivalent are backend-only JSON endpoints with zero HTML rendering, reading from Postgres `journeys` rather than a repo. These are architecturally different scopes (single connected repo vs. a product's own journeys) that should render through the same shared board component, not diverge into two board implementations that happen to look similar today and drift apart tomorrow.

## Architecture Constraints

- `src/web-ui/views/kanban-view.js`'s `renderKanban({ features, ideas })` is the existing, working rendering function to generalise and reuse — not a new pattern to invent from scratch. Its current shape is tied to GitHub-repo-slug "features" plus a separate "ideas" concept; generalise its input shape (e.g. a generic `cards`/`columns` concept) so product, org, and tenant scopes all call the same renderer.
- `handleGetProductKanban`/`handleGetOrgKanban` (`src/web-ui/routes/products.js:624`, `:688`) already compute the right column/stage-grouped data shape (`STAGE_COLUMNS`, health labels, per-column feature lists) — this is the data-shaping logic to keep; only the "return raw JSON, no rendering" behaviour is being replaced.
- **Confirmed by operator, 2026-07-19:** `/features`, `/actions`, `/status` (and `/status/export`) are removed outright as part of this story — routes deregistered from `server.js`, their handler modules (`features.js`'s `handleGetFeatures`, and the `/status`/`/actions` handlers) deleted, not redirected or soft-deprecated. Confirm no other live route depends on any of these handlers before deleting (e.g. `renderKanban`, `renderFeaturesList`, `_listArtefacts` may be imported elsewhere — check before removing the whole file).
- **Confirmed by operator, 2026-07-19:** tenant gets its own board scope, in addition to org and product — a third caller of the same shared renderer. The natural data source is `/dashboard`'s existing tenant-scoped product listing (`handleGetDashboard`, `src/web-ui/routes/... `: `SELECT product_id, name, created_at FROM products WHERE tenant_id = $1`) extended to aggregate every journey across every one of the tenant's products onto one set of stage columns — reusing `STAGE_COLUMNS`/health-label logic already proven at product/org scope. Proposed entry point: `/dashboard?view=board`, mirroring the exact `?view=board` convention the removed `/features` route used, for consistency.

## Dependencies

- **Upstream:** None.
- **Downstream:** Any future board-scope addition (e.g. a tenant-level board, if confirmed needed) builds on the shared pattern this story establishes, not on either of the two current implementations independently.

## Acceptance Criteria

**AC1:** Given the two current kanban-rendering code paths (`renderKanban` in `kanban-view.js`; the raw-JSON column-building logic in `handleGetProductKanban`/`handleGetOrgKanban`), When this story is complete, Then exactly one shared rendering function produces the HTML board markup for every scope that has one — no duplicated column/card/health-label rendering logic across files.

**AC2:** Given a product with journeys at various stages, When the operator requests that product's kanban view, Then it renders as an actual HTML board (not raw JSON), using the shared rendering function from AC1, showing the same stage columns, health labels, and per-card info already computed by the existing `handleGetProductKanban` data logic.

**AC3:** Given an org with multiple products/features, When the operator requests that org's kanban view, Then it renders as an actual HTML board via the same shared rendering function, not a second, independently-styled implementation.

**AC4:** Given a tenant with multiple products, When the operator requests `/dashboard?view=board`, Then it renders an aggregate board of every journey across every one of that tenant's products, grouped onto the same stage columns, via the same shared rendering function used for product and org scope.

**AC5:** Given `/features`, `/actions`, `/status`, and `/status/export` are confirmed for outright removal, When this story ships, Then those routes are deregistered from `server.js` and their now-unused handler code is deleted — verified by confirming no remaining route in `server.js` references them, and no remaining test in the suite depends on their existence (existing tests for them are removed or migrated, not left to fail).

**AC6:** Given any existing automated test currently covering `/features?view=board`'s rendering logic (specifically `renderKanban`'s own behaviour, not the now-removed route), When this story's refactor lands, Then that rendering logic's test coverage is preserved against the generalised shared renderer — the underlying rendering behaviour is not removed along with the route, only the route itself.

## Out of Scope

- Any change to the underlying data queries in `handleGetProductKanban`/`handleGetOrgKanban` beyond what's needed to feed the shared renderer — the stage-grouping/health-label logic is reused, not redesigned.
- Drag-and-drop or any other new interactive board behaviour — this story is about rendering consolidation, not new board functionality.
- The "ideas" concept (`_readIdeas`/`_writeIdeas`, `/api/ideas`) — confirm whether it's meaningful at product/org/tenant scope or was specific to the removed `/features` context; if the latter, `renderKanban`'s generalised shape should make `ideas` optional rather than force every scope to supply it.

## NFRs

- **Performance:** Not applicable beyond what the existing implementations already do — no new computation, just consolidated rendering. The tenant-level aggregate (AC4) queries across potentially many products' journeys — confirm this stays reasonably bounded (a tenant's own product count is realistically small) rather than assuming unbounded scale.
- **Security:** Any user-supplied or repo-supplied text rendered on a board (feature names, card titles) must continue to be escaped, matching both existing implementations' current behaviour.
- **Accessibility:** The shared renderer must preserve or improve on the accessibility properties either existing implementation already has (keyboard navigation, non-colour-only status indicators) — not regress either.
- **Audit:** Not applicable beyond what each scope's existing handler already logs.

## Complexity Rating

**Rating:** 2 — both design questions that made this ambiguous are now resolved by direct operator confirmation (outright removal of `/features`/`/actions`/`/status`; tenant gets its own board). Remaining complexity is mechanical: generalising one rendering function's input shape across three callers, and safely removing now-dead route/handler code without breaking anything still using shared pieces of it (`renderKanban`, `_listArtefacts`).
**Scope stability:** Stable — both prior open questions are now closed.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

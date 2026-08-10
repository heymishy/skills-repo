## Story: Org kanban has a working, tested product filter on the backend but no UI control to trigger it

**Epic reference:** None — short-track (missing-UI gap, found via source tracing + live confirmation on the operator's real `wuce-staging` account)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator viewing the org-level kanban board across several products**,
I want **to filter the board down to a single product**,
So that **I can focus on one product's journeys without scrolling past every other product's cards on the same screen**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — `psh-s7` (feature `2026-07-05-product-stds-hierarchy`, story titled "Org-level kanban with product grouping and filter", `dodStatus: complete`) shipped a real, working, server-side product filter (`handleGetOrgKanban`, `products.js:1676-1699`: `var productFilter = req.query && req.query.product;` then `prodRows.filter(...)` against it), but no `<select>`, dropdown, or link anywhere in the render path sets that query parameter. Confirmed live on `wuce-staging.fly.dev/org/kanban` (2026-08-10, real operator account, 6 real products): the board renders correctly across all products with real cards, but there is zero filter UI. This exactly matches `psh-s7`'s own verification script Scenario 2/3 (AC2/AC3), which describe the operator clicking a product-filter dropdown — that control does not exist anywhere in `renderKanban` (`kanban-view.js`), confirmed by reading `renderKanban(data)`'s full signature: it only ever receives `{ columns }`, no product list and no filter-rendering branch at all.

**How:** Same failure shape as two other gaps already found and storied this session — `smug-s1` (Standards tab) and `bmau-s1` (bulk-assign-to-module) — all three are "backend built and tested, zero UI trigger" gaps, discovered via the ongoing verification-script sweep across shipped `dodStatus: complete` stories.

## Architecture Constraints

- **Reuse the existing `GET /org/kanban?product=<id>` query contract as-is** — this story adds the UI trigger; it does not change `handleGetOrgKanban`'s filter logic or query shape.
- **`handleGetOrgKanban` must pass the full, unfiltered `prodRows` list (id + name) through to `renderKanban`** alongside the already-filtered `columns`, so the dropdown can list every product regardless of which one is currently selected. Today only `columns` is passed (`products.js:1726`); this needs one additional field.
- **The dropdown submits via a plain GET navigation** (`<select onchange="location.href=...">` or a wrapping `<form method="GET">`), matching this repo's existing no-client-framework convention (`renderKanban` and its sibling views are server-rendered, no build step) — no new JS dependency.

## Dependencies

- **Upstream:** `psh-s7` (shipped, `dodStatus: complete`) — this story is a UI-completion follow-up, not new backend design.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given the operator has ≥2 products, When they view `/org/kanban` with no `product` query param, Then a dropdown/select listing every product (plus an "All products" option) is visible, and the board shows all products' journeys (today's existing unfiltered behaviour, unchanged).

**AC2:** Given the operator selects a specific product from the dropdown, When the page navigates, Then the URL includes `?product=<that product's id>` and the board shows only that product's journeys — exercising the already-correct, already-tested `productFilter` server-side logic for the first time via a real UI action.

**AC3:** Given the operator is viewing a filtered board (`?product=<id>` in the URL), When the page renders, Then the dropdown's selected option reflects the current filter (not reset to "All products").

**AC4:** Given the operator has exactly 1 product, When they view `/org/kanban`, Then the dropdown either does not render or renders disabled with that one product pre-selected — matching the spirit of `bmau-s1`'s AC5 zero-state convention (don't render a control with nothing meaningful to choose between).

## Out of Scope

- **Any change to `handleGetOrgKanban`'s filter query logic itself** — reused as-is; this story only adds the missing UI trigger and the one additional `prodRows` field needed to render it.
- **Multi-product (checkbox-style) filtering** — single-select dropdown only, matching the existing single-value `productFilter` query contract.
- **The per-product kanban view (`/products/:id/kanban`)** — already has its own, separate, already-scoped-to-one-product route; not affected by this story.

## NFRs

- **Correctness:** Closes a real "backend exists, unreachable by any user action" gap on an already-tested filter, the third confirmed instance of this exact pattern found this session (see `smug-s1`, `bmau-s1`).
- **Usability:** At 6+ real products (this operator's own current account scale), an unfilterable combined board becomes harder to scan as more products/journeys accumulate — the filter is the point of `psh-s7`'s own original story, not a new ask.

## Complexity Rating

**Rating:** 1 — the backend is proven and unchanged; the UI work is one dropdown, one additional data field threaded from handler to view, and one selected-state echo. No new client-side state machine (unlike `bmau-s1`'s checkbox selection bar).
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

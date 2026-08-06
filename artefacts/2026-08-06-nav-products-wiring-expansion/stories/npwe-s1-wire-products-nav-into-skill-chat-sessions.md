## Story: Show the Products sidebar during skill chat sessions

**Epic reference:** None — short-track (bug/small fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported pattern below, bounded per the audit findings
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator working through a skill session (discovery, benefit-metric, definition, etc.)**,
I want **the Products sidebar to remain visible while I'm answering questions or watching a draft stream in**,
So that **I don't lose my place in the product/journey structure during the majority of my actual working time in the app**.

## Benefit Linkage

**Metric moved:** Navigation continuity during active skill sessions (operational UX, not a formal benefit-metric artefact — short-track).
**How:** An audit of all 65 `renderShell` call sites (2026-08-06) found only 3 wired with the live Products sidebar (`/dashboard`, `/products/:id`, `/journey/:id`), per an explicit, deliberate scope-narrowing decision in `2026-07-30-product-aware-navigation/decisions.md` with a stated "revisit trigger: if operator feedback shows the missing Products section on unwired pages is itself confusing." That trigger fired directly (operator report, 2026-08-06). Of the ~62 unwired call sites, `skills.js`'s chat-session pages (~13 sites: Run a Skill list, question pages, chat page, commit preview/complete, draft complete) are where an operator spends the majority of active working time — wiring these closes the single highest-value gap first.

## Architecture Constraints

- Reuses the exact `products`/`activeProductId`/`noProductJourneyCount` parameters and `getProductsNavSummary(pool, tenantId)` helper already proven in the 3 wired call sites (`products.js`'s `_renderProductDashboard`/`_renderProductView`, `journey.js`'s `handleGetJourney`) — the RENDERING side is a drop-in reuse, no new design.
- **D37 constraint (mandatory, review finding 1-M1, resolved):** `skills.js`'s 13 target handlers do not currently receive a `pool` parameter (unlike `journey.js`'s `handleGetJourney(req, res, _next, pool)`, which gets it from `server.js`'s dispatch call) and hold no module-level Postgres reference today. Rather than threading `pool` through all 13 of `server.js`'s dispatch call sites for these routes (a second file's signature change this story would otherwise leave unnamed), the D37 injectable-adapter constraint (CLAUDE.md) requires wiring `skills.js` with its own module-level pool reference — `setDbPool(pool)`/`getDbPool()`, throw-on-unwired stub — mirroring `mtrr-s1`'s `export-data-source.js` precedent (which itself mirrors `routes/auth.js`'s `setOrganisationsPool`). `server.js` wires it once at startup, matching the existing `if (process.env.DATABASE_URL) { ... }` pattern used for every other Postgres-backed adapter in that file.
- `renderProductsSection()`'s existing behavior (render nothing when `products` is `undefined`) is unchanged — this story only adds new callers passing the param, matching `pan-s1`'s AC5 guarantee for every site NOT in this story's scope.

## Dependencies

- **Upstream:** `pan-s1` (`2026-07-30-product-aware-navigation`) — the `products`/`renderProductsSection` mechanism this story extends. Already merged.
- **Downstream:** None. Sets the pattern for a follow-up story covering the remaining ~50 unwired call sites (journey sub-pages, artefact viewer, admin, settings) if that also proves valuable.

## Acceptance Criteria

**AC1:** Given an operator is on any skill-chat-session page in scope (Run a Skill list, a question page, the live chat page, commit preview, commit complete, draft complete), When the page renders, Then the Products sidebar section is visible and correctly highlights the active product, matching the 3 already-wired pages' behavior exactly.

**AC2:** Given an operator navigates from a wired page (e.g. `/journey/:id`) into a skill-chat session for one of that journey's stages, When the chat page renders, Then the same product is shown as active in the sidebar — no discontinuity between the wired and newly-wired pages.

**AC3:** Given a skill-chat session exists for a journey with no associated product (the "No product" bucket), When the page renders, Then the "No product" row is shown as active, matching the existing 3-page behavior for this case.

**AC4:** Given the ~50 other currently-unwired call sites explicitly out of scope for this story (journey sub-pages, artefact viewer, legacy artefact index, admin pages, settings), When those pages render, Then they remain byte-for-byte unchanged — this story does not touch them.

## Out of Scope

- **Journey sub-pages** (stage-view, stage-review, reference docs, stories, journey-complete, wizard — ~15 call sites in `journey.js`) — deferred to a follow-on story given the scale; not wired here.
- **Artefact viewer** (`artefact.js`) and **legacy artefact index** (`features.js`) — deferred.
- **Admin pages** (`admin-credits.js`, `admin-mock-gateway.js`) — deferred; lower priority since admins already know where they are in the app.
- **Settings page** — deferred.
- **Any change to the Products section's own rendering logic, styling, or the 3 already-wired pages** — this story only adds new callers to the existing, unchanged mechanism.

## NFRs

- **Performance:** The product-lookup query these newly-wired pages perform matches the existing wired pages' cost exactly (same `getProductsNavSummary` call, no new N+1 query pattern).
- **Security:** None new — reuses the existing tenant-scoped product lookup, no new data exposure.
- **Accessibility:** Unchanged — reuses the existing `aria-label="Products"` nav markup verbatim.
- **Audit:** Not applicable — no new state-changing action, a read-only sidebar addition.

## Complexity Rating

**Rating:** 2 — mechanically repetitive across ~13 call sites (well understood, low risk per site), but touches a widely-used file (`skills.js`) with many render paths, so warrants care checking each one renders correctly, not just the common case.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

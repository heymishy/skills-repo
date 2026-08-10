## Story: Resuming a stage's history and viewing a completed journey both strand the operator with no way back to the dashboard

**Epic reference:** None — short-track (missing-nav gap, found via operator live report + live confirmation on the operator's real staging journey)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator reviewing a completed stage's history or a finished journey**,
I want **the same product list and "back to dashboard" nav every other page has**,
So that **I'm never stranded on a page with no way back except the browser's own Back button**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — operator reported live: on the resume-conversation/stage-history page and the journey-complete page, the left-hand nav is missing the product list, with "only org board" as an option and "no ability to return to dashboard." Confirmed via live Chrome inspection on the operator's own real staging journey (`8ab96729-514b-44b4-8050-f1e79916bfad`, `/stage/definition`): the rendered sidebar has `Org board`, `Settings`, sign-out, and the version stamp (all present and correct), but the entire Products section — the product list AND the "See all products →" link that is this app's only route back to `/dashboard` since `pan-s1` removed the standalone "Home" nav item — is completely absent.

**How:** Root-caused via direct source read. `renderShell`'s own sidebar renderer (`html-shell.js`'s `renderSidebar`) deliberately renders nothing for the Products section when its `products` argument is `undefined` — a documented, intentional fallback from `pan-s1` ("keeping every unwired call site byte-for-byte unchanged"). The correctly-wired pattern already exists and is used by `handleGetJourney` (`journey.js`): accept `pool` as a parameter, call the already-shared `_getProductsNavSummary(pool, tenantId)` helper, and thread the result's `products`/`noProductJourneyCount` into `renderShell`. Two handlers never adopted this pattern and were never updated when `pan-s1` shipped: `handleGetJourneyStageView` (the "resume a completed stage's history" page — `GET /journey/:id/stage/:stageName`) and `handleGetJourneyComplete` (the "journey complete" page — `GET /journey/:id/complete`). Neither accepts a `pool` parameter at all, and neither passes `products` to its `renderShell` call, so both permanently render with an empty Products section regardless of how many real products the operator has.

## Architecture Constraints

- **Reuse `_getProductsNavSummary` and the exact `handleGetJourney` wiring pattern** (`pool` param → `if (pool) { navSummary = await _getProductsNavSummary(pool, tenantId); ... }` → thread `products`/`activeProductId`/`noProductJourneyCount` into `renderShell`) — do not invent a second way to compute the sidebar's product list.
- **`pool` must be threaded from `server.js`'s existing `_pshPool`**, matching `handleGetJourney(req, res, null, _pshPool)`'s own call-site wiring exactly.
- **Test callers that invoke either handler without a `pool` argument must be unaffected** — the `if (pool) {...}` guard (already proven by `handleGetJourney`'s own test coverage) means every existing test calling these handlers with 3 args continues to work exactly as before, with an empty Products section (matching today's behaviour for those tests specifically, not a regression).

## Dependencies

- **Upstream:** `pan-s1` (shipped) — this story completes wiring `pan-s1` intended for every page but two handlers missed.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given an authenticated operator with ≥1 real product, When they view a completed stage's history (`GET /journey/:id/stage/:stageName`), Then the left-hand nav shows the same product list and "See all products →" link every other page (e.g. `/dashboard`, `/journey`) shows.

**AC2:** Given the same page, When the operator clicks "See all products →", Then they land on `/dashboard` — a real, working way back, not just the browser's own Back button.

**AC3:** Given an authenticated operator with ≥1 real product, When they view a completed journey (`GET /journey/:id/complete`), Then the left-hand nav shows the same product list and "See all products →" link, matching AC1's requirement for the other page.

**AC4:** Given an operator with zero products, When they view either page, Then the nav's Products section shows the same "no products yet" state every other page shows for a zero-product operator — not a special-cased empty state unique to these two pages.

**AC5:** Given a test that calls either handler directly with no `pool` argument (matching this repo's existing test convention for both handlers), When the test runs, Then it passes exactly as before — no regression to existing coverage.

## Out of Scope

- **Any other page that might also be missing this wiring** — this story fixes the two pages the operator specifically reported (resume-history, journey-complete); a broader audit of every `renderShell` call site in the app is a separate, larger effort not scoped here.
- **Any change to `_getProductsNavSummary`'s own logic or `renderSidebar`'s rendering** — both reused exactly as-is.
- **Settings, sign-out, or the version stamp** — confirmed already correct on both pages; not touched.

## NFRs

- **Correctness:** Closes a real, operator-confirmed "stranded with no way home" navigation gap on two real, commonly-visited pages.
- **Consistency:** Both pages become consistent with every other page's nav, closing a `pan-s1` wiring gap rather than adding a third, page-specific nav treatment.

## Complexity Rating

**Rating:** 1 — small, well-understood, reuses an already-proven pattern from `handleGetJourney` exactly; no new logic, just threading an existing parameter through two more call sites.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

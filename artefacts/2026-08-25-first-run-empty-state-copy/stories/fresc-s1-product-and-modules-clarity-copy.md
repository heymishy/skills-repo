## Story: Add orientation copy to two first-run empty states, and stop showing the Modules card before it has a purpose

**Epic reference:** none (short-track, single story)
**Discovery reference:** none (short-track — see `CLAUDE.md` short-track flow)
**Benefit-metric reference:** `2026-06-29-beta-entry-experience` (M1 activation) — first-run clarity gaps are activation friction for brand-new tenants and brand-new products, the exact population M1 tracks

**Domain:** wuce / web-ui-products
**Domain tags:** [web-ui]

## User Story

As a brand-new `wuce` user or a user who just created a product with no features yet
I want the app to explain what a "product" is and what "Modules" are for, and to not show me the Modules tool before there's anything for it to organize
So that my very first screens orient me instead of presenting unexplained, purposeless UI

## Benefit Linkage

Two related, already-logged signals, both about first-run/empty-state clarity, both in the same file (`src/web-ui/routes/products.js`):

- **Signal 11** (`artefacts/feedback/beta-007.md`) — real beta user Abhijeet Singh (`abhijeet-qsofte`) screenshotted a brand-new, zero-feature product ("Orchard Manager") and reported "What is Modules? It wasn't clear what it's for." The Modules card (`_renderModulesManagement`, line ~634) renders unconditionally regardless of feature count, so a product with 0 features sees the full create-a-module UI before there is anything a module could ever group.
- **Signal 12** (`artefacts/feedback/beta-007.md`) — operator observation, made live while validating `bvnd-s1` (PR #768) on a fresh zero-product test account: the empty-products state reads only "No products yet" + a "Create your first product →" button (`_renderProductDashboard`, line ~146-151), with no explanation of what a product actually represents in this app.

Both are first-impression clarity gaps, not functional bugs — module CRUD and product creation both work correctly today (confirmed by `a1`'s DoD and `bvnd-s1`'s live validation respectively).

## Architecture Constraints

- **Modules visibility gate:** in `_renderProductView` (line ~729), the `features` array is already an in-scope parameter at the point `_renderModulesManagement(productId, modules, csrfToken)` is called (line ~932). Gate that call on `features.length > 1` — do not add a new data fetch or change the function's own signature/behaviour when it does render.
- **Modules explanatory copy:** add one short line inside `_renderModulesManagement`'s returned markup (e.g. directly under the "Modules" heading at line ~656), styled consistently with existing muted/secondary text elsewhere in this file (see `var(--muted)` usage in `_renderProductDashboard`). Do not invent a new visual pattern or component.
- **Product empty-state copy:** add one short explanatory line inside `_renderProductDashboard`'s empty-state branch (line ~147-151), above or below the existing "No products yet" text, before the "Create your first product →" link. This single block is shared by both the list-view dashboard and (since `bvnd-s1`) the board-view dashboard — one change covers both surfaces; do not duplicate the block or special-case either caller.
- Do not modify `_renderScaleGauge`, `_renderConsolidatedFeaturesSection`, `_renderModuleSection`, or any other module-distribution/grouped-view rendering — those are unrelated to this story's scope.
- Do not change the Modules feature-count threshold logic anywhere else (e.g. `a3`/`a4`'s own `epicCount === 0 || modules.length === 0` gate at line ~595) — that gate serves a different rendering path (the module-distribution strip) and is out of scope here.

## Dependencies

None. Both target functions and their call sites already exist and are unchanged in shape by this story.

## Acceptance Criteria

**AC1**
Given a product with 0 or 1 features
When a signed-in user views that product's detail page (`GET /products/:id`)
Then the Modules management card (heading, module list, "Add module" form) does not render

**AC2**
Given a product with more than 1 feature
When a signed-in user views that product's detail page
Then the Modules management card renders exactly as it does today (all existing create/rename/delete functionality unchanged), plus one short explanatory line describing what modules are for (e.g. "Group related features together for easier organization on the Kanban and Roadmap views")

**AC3**
Given a tenant with zero products
When a signed-in user views the empty-products state, on either the list-view dashboard (`GET /dashboard`) or the board-view dashboard (`GET /dashboard?view=board`)
Then the empty state shows one short explanatory line describing what a product is (e.g. "A product is a connected GitHub repo — its epics, features, and journeys all live under it here"), in addition to the existing "No products yet" text and "Create your first product →" link, on both surfaces

**AC4**
Given the fix is applied
When existing Modules CRUD (create, rename, delete — on a product with more than 1 feature) and the existing "Create your first product →" link (on a zero-product tenant) are exercised
Then both continue to work exactly as before — the change adds a visibility condition and explanatory copy only, with no regression to any existing behaviour

## Out of Scope

- Any change to the exact feature-count threshold beyond ">1" (e.g. making it configurable, or applying it per-tenant) — ">1" is the operator's own stated threshold ("hide until multiple features"); revisiting it is a future decision, not this story's.
- `a3`/`a4`'s module-distribution strip and grouped-features rendering (`_renderScaleGauge`, `_renderConsolidatedFeaturesSection`, `_renderModuleSection`) — a different, already-correctly-gated rendering path.
- Any new onboarding flow, tooltip system, or guided tour — this story is two short static copy additions plus one visibility condition, not a broader onboarding redesign.
- Signal 11's originally-considered "collapsed/disabled" alternative to hiding — the operator's direction was to hide fully below the threshold, not collapse; if a future need arises for a disabled-but-visible state, that is a separate decision.

## NFRs

NFRs: None — reviewed 2026-08-25. No new external dependency, no schema change, no new route — beyond existing rendering-correctness expectations already covered by AC4.

## Complexity Rating

**Complexity:** 1 (well understood — two static copy additions and one length-check conditional, all in one already-read file)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] Acceptance criteria are testable
- [x] No architectural decision requiring `decisions.md` (copy/visibility change, not a new architectural choice)
- [x] No CSS-layout-dependent ACs (the fix is about which elements render and their text content, not visual layout/positioning)
- [x] No injectable adapter introduced

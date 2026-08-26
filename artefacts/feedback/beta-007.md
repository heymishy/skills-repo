# Feedback: 2026-08-25 (Abhijeet, mobile screenshot — product detail page)

**Source:** Abhijeet Singh (`abhijeet-qsofte`), real external beta user, relayed by the operator (screenshot, mobile Safari, `skills-framework.fly.dev`).
**Related:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a1-modules-taxonomy-crud.md` (introduced the Modules feature), `artefacts/2026-08-10-bulk-module-assignment-ui-gap/` (`bmau-s1`, the feature that actually consumes modules), `artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/` (`cmba-s1`, not yet started — also touches `bmau-s1`'s UI).
**Status:** Reported, not yet triaged into a story. Root cause of the confusion is understood; fix approach proposed by the operator below.

---

## Signal 11: "What is Modules? It wasn't clear what it's for"

**Reported:** Screenshot of the product detail page for "Orchard Manager" (`abhijeet-qsofte/af-om`, a genuinely empty/unsynced repo — 0 epics, 0 stories, 0 features, "Not yet synced"). A full "Modules" card is visible directly below the sync status, with an empty "New module name" input and an "Add module" button, and no explanatory text. Abhi's feedback: unclear what the section is for.

**Severity:** Low-medium — not a functional bug (module CRUD itself works, confirmed by `a1`'s DoD), but a real first-impression clarity gap on a page a brand-new product hits immediately after creation, before it has any content to organize.

**Root cause (from code, not yet independently re-confirmed live):** Modules is a curated per-product taxonomy (`src/web-ui/adapters/modules-adapter.js`, introduced by story `a1`) whose entire purpose is grouping *features* into collapsible sections — it's a prerequisite for `a3`/`a4`'s grouped-view rendering and for `bmau-s1`'s bulk-assign workflow. None of that context is surfaced on the page itself. Worse, the section renders unconditionally regardless of feature count — so a product with 0 features (like Orchard Manager here) sees the full create-a-module UI before there is anything a module could ever group. The affordance is real, but it's presented with no purpose until the product has enough features to need organizing.

---

## Proposed fix (operator's suggestion)

- Hide the Modules card until the product has more than one feature (i.e., there's actually something to group) — mirrors the same "don't show organizational UI before it's needed" logic already used elsewhere (e.g. the board-view empty-state CTA from `bvnd-s1`).
- When it does show, add a short explanatory line (e.g. "Group related features together for easier organization on the Kanban and Roadmap views") so the purpose is clear without needing tribal knowledge of `a1`'s original story.
- Scope check needed before writing ACs: confirm whether "hide" means fully absent or collapsed/disabled, and confirm the exact feature-count threshold (operator said "multiple features" — likely `>1`, needs to be pinned down at story-definition time).

---

## Suggested next step

Not yet turned into a story. Given this is a small, bounded, single-page UX clarity fix (no new capability, no schema change), it fits the short-track pattern used for the other recent live-feedback fixes (`bvnd-s1`, `apsc-s1`) rather than a full discovery pass — recommend `/test-plan` directly once ACs are pinned down, unless more Abhi feedback arrives first that changes the shape of this.

---

## Signal 12: No explanation of what a "product" is on the empty-products state

**Reported:** Operator observation, made live during `bvnd-s1` validation on a fresh zero-product account (`skills-framework.fly.dev/dashboard?view=board`, 2026-08-25) — the empty-state screen reads only "No products yet" + a "Create your first product →" button, no description of what a "product" represents in this app (a connected GitHub repo, the unit epics/features/journeys are organized under, etc.).

**Severity:** Low — same first-impression-clarity theme as Signal 11 (Modules), not a functional gap. A brand-new user's very first screen in the app offers no orientation before asking them to create something undefined.

**Root cause:** `src/web-ui/routes/products.js:146-151`, `_renderProductDashboard()`'s empty-state branch — a single hardcoded two-line block (`<p>No products yet</p>` + the CTA link), no explanatory copy. This exact block is shared by both the list-view empty state and, since `bvnd-s1` (PR #768), the board-view empty state (`bvnd-s1`'s AC2 explicitly reused this same function/pattern) — so a fix here is a single-location change that improves both surfaces at once.

**Proposed fix:** Add one short descriptive line above or below "No products yet" explaining what a product is (e.g. "A product is a connected GitHub repo — its epics, features, and journeys all live under it here"). Exact copy needs pinning down at story-definition time.

**Suggested next step:** Same shape as Signal 11 — small, bounded, single-file copy change, no schema/capability change. Worth considering bundling both signals into one short-track story (both are "first-run empty-state lacks explanatory copy" fixes, in adjacent code in the same file), rather than two separate stories, unless the operator prefers to keep them independently scoped.

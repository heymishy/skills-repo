# Discovery: Product Dashboard Becomes Unreadable at Real-World Scale

**Status:** Approved
**Created:** 2026-09-02
**Approved by:** Hamish King — Platform Owner — 2026-09-02
**Author:** Claude (agent, with Hamish King)

---

## Problem Statement

The product dashboard (`/products/:id`) opens with a fully-expanded, non-interactive text dump of every epic/phase group before any clickable content appears. Confirmed live on staging's own `skills-framework` product (224 tracked features): the page renders roughly 40 epic/phase headings as plain bold text, each followed by a bullet list of story-ID/percentage pairs — no links, no filtering, no collapsing, stretching for dozens of screens. The *same* phase→story grouping is then rendered a second time, further down the page, as a genuinely interactive "By Phase" tab (with search, health filters, and clickable rows) — meaning the useful version of this exact information exists on the page, just buried beneath a redundant static copy of itself. Compounding this: the interactive list's groups also default to fully expanded (a 42-item module renders all 42 rows at once, no default collapse), the majority health state — 115 of 224 items (51%) — reads `? Unknown` with the same visual weight as a real Warning or Blocked signal, and clicking into an individual story can dead-end on a bare "No artefacts found for this feature" page with no breadcrumb or way back to the product. Together, these make the dashboard effectively unreadable for any product with a meaningfully-sized feature set — not a hypothetical concern, but the current, live state of this platform's own flagship product.

## Who It Affects

- **Platform maintainer / product owner** (per `product/mission.md`'s primary persona) — uses this exact page to answer "what's the health of this product, what needs my attention" on a recurring basis; today that question requires scrolling past ~40 static groups before reaching anything actionable.
- **Tech lead / squad lead** — reviews a product's governance/health state from this same page; a health signal that reads "Unknown" for the majority of items undermines the page's core purpose.
- **Any future operator of a product that grows past a handful of features** — this is not `skills-framework`-specific; any product that accumulates real feature history will hit the same wall, since the underlying rendering behaviour (full static dump, default-expanded groups) is generic to the page, not this one product's data.

## Why Now

Discovered directly during this session's own live-Chrome validation of a just-shipped feature — a hands-on review of the real staging page against real, production-scale data (224 features across ~40 groups), not a hypothetical audit. The underlying mechanisms that would fix this — grouping by module/phase, health filter chips, a search box — already exist and already work on the page; they're simply positioned beneath a redundant, non-interactive duplicate of themselves. This is real, immediately actionable UX debt surfaced through actual dogfooding, consistent with this platform's own stated operating model: an empirical improvement cycle grounded in actual usage rather than assumptions.

## MVP Scope

1. **Add a triage summary strip at the top of the page** — blocked / stalled / needs-review counts, clickable straight into a filtered view — replacing the static epic/phase text dump as the page's opening content.
2. **Default every group (module or phase) to collapsed** — showing a count and a rolled-up status bar; expand on click. Turns a 40-group, 224-item product into ~40 scannable header lines instead of a fully-unrolled list.
3. **Remove the duplicate static epic list** — keep the one interactive, grouped, filterable rendering; the static text-dump version at the top of the page is redundant with it.
4. **De-emphasize "Unknown" health visually** — quiet grey text rather than a colored badge competing with real Warning/Blocked states, so the majority-Unknown case doesn't drown out the minority that actually needs attention. (Whether "Unknown" can instead be resolved to a real computed state for some items is a named open assumption below, not assumed as in-scope.)
5. **Fix the story-detail dead end** — every story row carries its phase/epic context forward; the detail page opens with a breadcrumb (`Product › Phase/Epic › Story`) and a one-click way back, never a bare "No artefacts found" with no context.

## Out of Scope

- **Redesigning the module editor itself** (the Rename/Delete module text-input list) — this pass may reposition it (e.g. move it out of the main browse path into a settings/admin view) but does not redesign its own interaction model.
- **A full visual rebrand of the products page** — no new color system, no new component library; this is an information-architecture and default-state change layered onto the existing visual language.
- **Extending health computation to story-level granularity** — confirmed via code investigation that `computeHealthCounts` is feature-level only, and the majority of `Unknown` rows are story-level items with no individual health signal at all by design. Building per-story health computation is a separate, materially larger initiative touching the health-computation pipeline itself, not this page's rendering. Only how "Unknown" is *displayed* is in scope for this MVP.
- **Reconciling the top "Epics" list's data source with the health-computation data source** — confirmed these are two genuinely different data sources (raw pipeline-state completion vs. computed feature-level health). This discovery's MVP removes the redundant static "Epics" rendering entirely (see MVP Scope item 3), which sidesteps the reconciliation question rather than solving it — a deeper data-model unification is a separate concern if it turns out to matter once the duplicate display is gone.
- **The chat/session UI's own legibility issues** — already covered by the separate, already-approved `2026-08-31-web-ui-navigation-legibility` discovery, which addresses the context panel and session-view navigation, not this product-level dashboard.

## Assumptions and Risks

**Resolved via direct code investigation (2026-09-02, before /clarify):** both assumptions below were answered by reading `src/web-ui/routes/products.js` directly rather than routing to the operator — both were code-behaviour questions, not operator-knowledge questions.

**Resolved — generic, not `skills-framework`-specific:** `_renderConsolidatedFeaturesSection` and `_renderProductView` (the functions producing the By Module / By Phase / All tabs, health chips, and search box) are fully generic, parameterized by `productId` and the product's own feature/module data — not hardcoded to any one product. Every product on this platform renders through the same code path and will exhibit the same failure mode once its feature count grows.

**Resolved — "Unknown" is a genuine structural gap, not a display bug, and it's more specific than originally framed:** health is computed at **feature-level granularity only** (`computeHealthCounts`, confirmed via its own `healthBySlug` lookup and an inline comment: "computeHealthCounts is feature-granularity only"). The vast majority of rows rendered in the By Module/By Phase views are **story-level** items nested inside features (e.g. `p0.1`, `pmf.1`, `psh-s1`) — a story-level row has no individual health computation at all and correctly falls back to `unknown` by design, not by error. Extending health computation to story-level granularity would be a separate, materially larger initiative (touching the health-computation pipeline itself, not just this page's rendering) — explicitly moved to Out of Scope below rather than left open. A related finding from the same investigation: the top "Epics" list's percentages are read from a *different* data source entirely (raw pipeline-state completion) than the "By Module"/"By Phase" health badges (this feature-granularity health computation) — a third concrete instance of the same duplicate-representation problem already named in the Problem Statement.

**Risk if not addressed:** The dashboard continues to degrade as products accumulate more features — the exact failure mode observed on `skills-framework` (224 items, 40+ groups, majority-Unknown health) will recur on every product that grows past a small feature count, silently eroding the page's usefulness as the platform's own primary product-health view.

## Directional Success Indicators

**Time-to-first-actionable-item:** Baseline: `[UNKNOWN BASELINE]` — no current measurement exists; today an operator must scroll past ~40 static groups (multiple screen-heights) before reaching any interactive content. Target: an operator can identify blocked/stalled work within the first screenful of the page, with zero scrolling required. Measured via: manual timing / operator self-report initially; a lightweight scroll-depth or time-to-first-click instrumentation event could formalize this later if useful, but is not required for the MVP itself.

**Health-signal trustworthiness:** Baseline: 51% of items (115 of 224, confirmed live on `skills-framework`) currently show `? Unknown` health, visually competing with the 3 items showing real Warning state and 53 showing real Healthy state. Target: `Unknown` no longer competes visually for attention with real Warning/Blocked signals — measured either by a reduced Unknown count (if genuinely resolvable) or by a direct before/after visual audit confirming Unknown reads as quiet/recessive rather than as a loud, undifferentiated badge. Measured via: direct count of items per health state pre/post change, plus a visual comparison.

## Constraints

- No new npm dependencies (matches this repo's established pattern across every recent feature).
- Must not break the existing By Module / By Phase / All tab mechanism, the health filter chips, the search box, or the module editor's own existing functionality — this is a layered IA and default-state change, not a rebuild of the underlying data/filter logic.
- This is a real, currently-used production page — `skills-framework` and every other product on this platform render through it today. Any implementation needs regression testing against real data shapes (multiple products, varying feature counts, varying health-state distributions), not just a single fixture.
- `product/constraints.md` #13 (structural governance preferred over instructional) is not directly triggered here (this is a UX/rendering concern, not a governance-enforcement one), but the same "verify against real behaviour, not assumption" discipline applies given how this problem was found — treat the two open assumptions above as genuinely open, not rhetorical.

## Contributors

- Hamish King — Platform Owner (identified the problem via live review of staging)
- Claude (agent) — live investigation, redesign mockup, discovery drafting

## Reviewers

- Hamish King — Platform Owner

## Approved By

- Hamish King — Platform Owner — 2026-09-02

---

## Assumption resolution note

Both of this discovery's original assumptions were resolved via direct code investigation (see Assumptions and Risks above) rather than via `/clarify` — both were code-behaviour questions answerable by reading `routes/products.js` directly, not operator-knowledge questions. Zero unresolved `[ASSUMPTION]` lines remain. Proceeding directly to approval rather than routing to `/clarify` for questions the code already answered.

---

**Next step:** Human review and approval → /benefit-metric

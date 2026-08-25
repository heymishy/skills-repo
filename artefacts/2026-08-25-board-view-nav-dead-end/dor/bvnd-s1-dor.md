# Definition of Ready: bvnd-s1 — Fix `/dashboard?view=board` silently dropping the Products nav section

**Story:** artefacts/2026-08-25-board-view-nav-dead-end/stories/bvnd-s1-fix-board-view-missing-products-nav.md
**Test plan:** artefacts/2026-08-25-board-view-nav-dead-end/test-plans/bvnd-s1-test-plan.md
**Track:** Short-track (fast-tracked — live-confirmed real-user-blocking bug)

---

## Hard Blocks

| Check | Status |
|-------|--------|
| ACs are testable | ✅ |
| Test plan exists and maps to ACs | ✅ |
| No unresolved architectural decision | ✅ N/A — bug fix mirroring an existing, working adjacent code path |
| No CSS-layout-dependent ACs | ✅ N/A |
| No injectable adapter introduced | ✅ N/A |
| Contract does not exclude a file the test plan requires touchpoints in | ✅ — `src/web-ui/routes/products.js` is the story's sole in-scope file, named in both story and test plan |

## Warnings

| Check | Status | Note |
|-------|--------|------|
| Fast-tracked, no formal /discovery or /review | ⚠ Acknowledged | Per operator's explicit direction, given a real, live-confirmed, paying-user-blocking bug. Short-track already permits skipping discovery-through-review for bounded fixes; this is a bounded fix (single file, mirrors an existing pattern) so short-track applies on its own merits, not solely because of urgency. |

---

## Oversight level

**Medium** — explicit, direct operator approval to build and ship now ("Yes, build and ship now (Recommended)"), given live confirmation from a real paying beta user's screenshot plus direct code-level root-cause confirmation.

---

## Standards injection

None — no `pipeline-infrastructure` entry exists in `.github/context.yml`'s standards registry (this is a `wuce`/web-ui domain fix, and no web-ui-specific standards file mandates injection here beyond the general `web-ui-patterns.md` reference already implicit in existing sibling stories).

---

## Coding Agent Instructions

1. In `src/web-ui/routes/products.js`'s `handleGetDashboard`, inside the `if (req.query && req.query.view === 'board')` branch: call `var navSummary = await getProductsNavSummary(_pool, tenantId);` (same function the non-board branch already uses) before the `renderShell()` call.
2. Add `products: navSummary.products, activeProductId: null, noProductJourneyCount: navSummary.noProductJourneyCount` to that `renderShell()` call's options object.
3. Add an empty-board CTA: when `navSummary.products.length === 0 && navSummary.noProductJourneyCount === 0`, prepend an empty-state block to `tenantHtml` (or wrap it) matching `_renderProductDashboard`'s existing "No products yet → Create your first product →" pattern (same copy/style, linking to `/products/new`) — do not invent new copy or a new visual pattern.
4. Do not modify `buildTenantKanbanColumns`, `renderKanban()`, the non-board branch, or any other route.
5. Write `tests/check-bvnd-s1-board-view-products-nav.js` per the test plan (7 tests), run it standalone, then run `tests/check-kanban-consolidation.js` standalone to confirm no regression, then run the full suite.
6. Follow this session's established worktree-file-transfer pattern: write files in the main checkout, create a new worktree+branch from master (`git worktree add .worktrees/bvnd-s1 -b feature/bvnd-s1 master`), copy files across, diff-verify, discard main-checkout duplicates, commit only in the worktree.

---

## Sign-off

**Decision:** Proceed: Yes
**Signed off by:** Claude (agent), on explicit operator approval ("Yes, build and ship now (Recommended)")
**Date:** 2026-08-25

## Epic: Every nav item goes somewhere real, and every real destination has a nav item

**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`
**Slicing strategy:** Vertical slice

## Goal

A signed-in user's left-hand navigation contains zero dead links and a clear path to every real, currently-registered surface they have permission to see — including tenant/org kanban views and, once Epic C ships, account settings — with account-level items visually separated from product-level ones.

## Out of Scope

- Redesigning kanban rendering itself (`kanban-view.js`) — this epic only changes which routes have a nav entry, not how kanban boards render (already covered by `kbc-s1`).
- Per-product kanban's nav placement — it already lives correctly as a button on the product page itself, not the global sidebar; this epic does not change that.
- Mobile/responsive nav behaviour beyond what already exists in `html-shell.js` (sidebar-to-drawer collapse) — out of scope unless the new items break it, in which case that's a defect, not new scope.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Navigation dead-link rate | 50% (3 of 6 nav items) | 0% | Removes the 3 dead links, adds the missing Org board entry, and adds a structural test preventing regression |

## Stories in This Epic

- [ ] B1 — Remove dead nav links and add the missing Org board and Home List/Board toggle
- [ ] B2 — Restructure account-level nav items into a distinct sidebar section, with a dangling-link regression test

## Human Oversight Level

**Oversight:** Low
**Rationale:** Small, well-understood, low-blast-radius change to one shared file (`html-shell.js`) with an existing, well-tested pattern to follow.

## Complexity Rating

**Rating:** 1
**Rationale:** Every route this epic needs to link to already exists and was confirmed working during this session's live verification. This is pure IA/wiring, no new backend logic.

## Scope Stability

**Stability:** Stable

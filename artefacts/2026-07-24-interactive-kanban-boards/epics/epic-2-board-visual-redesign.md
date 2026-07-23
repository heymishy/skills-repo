## Epic: All three kanban boards visually match the platform's current design system

**Discovery reference:** artefacts/2026-07-24-interactive-kanban-boards/discovery.md
**Benefit-metric reference:** artefacts/2026-07-24-interactive-kanban-boards/benefit-metric.md
**Slicing strategy:** Risk-first (feature-level) — this epic is deliberately sequenced after Epic 1 proves the riskiest new integration, since visual work carries much lower technical risk and benefits from not being blocked on Epic 1's outcome.

## Goal

An operator viewing `/products/:id/kanban`, `/org/kanban`, or `/dashboard?view=board` sees a board that uses the same CSS custom-property tokens (`--bg`, `--surface`, `--ink`, `--accent`, `--green`/`--amber`/`--red` + soft variants) already established in `src/web-ui/utils/html-shell.js` and consistent with the recently published product-view redesign — not the current raw-hex, non-themed styling in `_renderKanbanColumns`.

## Out of Scope

- Any change to the LEGACY `renderKanban({features, ideas})` code path (used only by the already-removed `/features?view=board` route per `kbc-s1` — dead code, not touched here; if genuinely confirmed dead and unreachable, a separate cleanup story removes it, not this one).
- New interactive behaviour (drag-and-drop, click-to-advance, WIP limits, item detail) — Epics 1 and 3. This epic is styling only.
- Redesigning `kfd1`'s existing feature/artefact detail pages — already styled; this epic does not touch them, only the board/column/card-list view itself.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2: Visual consistency with the current design system | 0 of 3 board routes conform | 3 of 3 conform | This epic is the entire mechanism — it directly replaces `_renderKanbanColumns`'s raw-hex CSS with the shared token set. |
| M3: WIP visibility retained (no regression) | M1 (kfd1) currently passes | Still passes after this epic | This epic must not introduce spacing/sizing changes that reduce visible card count per screen below the existing baseline. |

## Stories in This Epic

- [ ] S2.1: Redesign `_renderKanbanColumns`'s CSS to use the shared design-system tokens (light/dark theme parity included as AC3)
- [ ] S2.2: Port title truncation and artefact-count badge to the live boards (closing a real gap — `kfd1`'s 2026-06-17 UX work never reached `kbc-s1`'s 2026-07-19 live renderer)

## Human Oversight Level

**Oversight:** Low
**Rationale:** Pure CSS/styling change to an existing, already-consolidated rendering function (`kbc-s1`) — no new data flow, no new state mutation, low blast radius. A coding agent can proceed with standard PR review, no special checkpoint.

## Complexity Rating

**Rating:** 1 — well understood; token substitution into an existing, already-generalised renderer, following an established, already-published token set (`html-shell.js`).

## Scope Stability

**Stability:** Stable.

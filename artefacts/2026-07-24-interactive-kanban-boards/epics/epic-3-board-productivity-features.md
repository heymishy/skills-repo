## Epic: An operator can prioritise, see WIP pressure, and inspect detail from the board — including drag-and-drop stage advance

**Discovery reference:** artefacts/2026-07-24-interactive-kanban-boards/discovery.md
**Benefit-metric reference:** artefacts/2026-07-24-interactive-kanban-boards/benefit-metric.md
**Slicing strategy:** Risk-first (feature-level) — sequenced last because every story in this epic either depends on Epic 1's proven advance action (drag-and-drop) or is additive polish (reorder, WIP badges, detail view) with no new integration risk of its own.

## Goal

An operator can drag a ready-to-advance card to its next column (reusing Epic 1's proven action, not a new mechanism), reorder cards within a column for their own prioritisation, see an advisory WIP-limit warning when a column is over its configured threshold, and open a detail view from any card without leaving the board.

## Out of Scope

- The underlying gate-confirm mechanism itself — Epic 1 already built and proved it; this epic's drag-and-drop story is a thin UI layer calling the same endpoint.
- Hard/enforced WIP limits that block a drop — discovery scope confirms advisory (soft) limits only; enforcement is explicitly out of scope for this epic.
- Any change to the detail-view page style itself (`kfd1`'s existing design-system-styled feature/artefact detail pages) — this epic only wires a new entry point (opening it from a card), not redesigning the destination page.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1: Board-to-CLI parity for real stage transitions | 0% (until Epic 1 ships) | ≥ 50% | Drag-and-drop is the primary, lower-friction interaction model this epic adds on top of Epic 1's click action — likely the dominant path once available. |

## Stories in This Epic

- [ ] S3.1: Drag a ready card to its next column, reusing the proven Advance action
- [ ] S3.2: Reorder cards within a column for local prioritisation (non-gated)
- [ ] S3.3: Advisory (soft) WIP limit per column with visible warning
- [ ] S3.4: Open an item detail view from any card

## Human Oversight Level

**Oversight:** Medium
**Rationale:** S3.1 (drag-and-drop) reuses Epic 1's already-reviewed action but introduces new client-side drag-state handling that needs care around accidental drops/reverts; the other three stories (S3.2-S3.4) are lower-risk additive UI and could reasonably proceed with Low oversight, but the epic sets Medium as the floor given S3.1's presence — the coding agent should flag S3.1 specifically for closer review at PR.

## Complexity Rating

**Rating:** 2 — S3.1 carries real drag-and-drop UX complexity (accessibility floor, revert-on-failure UX); S3.2-S3.4 are individually low-complexity.

## Scope Stability

**Stability:** Stable — all four stories build on already-proven mechanisms from Epic 1 or Epic 2, no new open technical questions at this epic level.

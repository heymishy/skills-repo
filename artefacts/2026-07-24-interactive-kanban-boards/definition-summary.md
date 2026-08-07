# Definition Summary: Interactive Kanban Boards

**Discovery reference:** artefacts/2026-07-24-interactive-kanban-boards/discovery.md
**Benefit-metric reference:** artefacts/2026-07-24-interactive-kanban-boards/benefit-metric.md
**Slicing strategy:** Risk-first — Epic 1 (novel gate-confirm-from-board integration) sequenced before Epic 2 (visual redesign, low risk) and Epic 3 (drag-and-drop and productivity features, which depend on Epic 1's proven action).

## Epics

- **Epic 1 — Board stage-advance core** (2 stories: S1.1, S1.2) — the highest-risk integration, proven via the simplest interaction (click) first.
- **Epic 2 — Board visual redesign** (2 stories: S2.1, S2.2) — low-risk styling work, sequenced independent of Epic 1's outcome.
- **Epic 3 — Board productivity features** (4 stories: S3.1, S3.2, S3.3, S3.4) — drag-and-drop (reusing Epic 1's proven action), reorder, WIP limits, item detail.

## Scope Accumulator

- Discovery MVP scope items: 6
- Total stories written: 8
- Scope ratio: 8/6 = 1.33x

**Explanation for the ratio (not drift):** discovery's MVP item #2 ("drag-and-drop card movement ... triggers the real, governed stage-advance") and item #6 ("move to next stage/skill as a direct board action") were split into 3 stories (S1.1 click action, S1.2 not-ready UX, S3.1 drag-and-drop) specifically to de-risk the novel integration via risk-first sequencing — proving the underlying mechanism via the simplest interaction before layering drag-and-drop on top, rather than building both simultaneously. This is intentional risk management, not scope creep. All 6 MVP items are covered:

| Discovery MVP item | Covering story/stories |
|---|---|
| 1. Visual redesign of all three board routes | S2.1, S2.2 |
| 2. Drag-and-drop triggering real stage-advance | S1.1 (foundational action), S3.1 (drag layer) |
| 3. Vertical reordering/prioritisation within a column | S3.2 |
| 4. Advisory (soft) WIP limits per column | S3.3 |
| 5. Item detail view reachable from a card | S3.4 |
| 6. "Move to next stage/skill" as a direct board action | S1.1, S1.2 |

✅ **Scope check passed** — 8 stories covering 6 MVP items, ratio explained by intentional risk-first splitting, not unexplained growth.

## Additional findings folded in during decomposition (not new scope, corrections to prior artefacts)

- **Mechanism correction (decisions.md):** the real stage-advance mechanism is `POST /api/journey/:journeyId/gate-confirm` (`handlePostGateConfirm`), not the skills-repo's own `node bin/skills advance`/`gate-advance` CLI tool — corrected in `discovery.md` and reflected accurately in all Epic 1/3 stories.
- **Real gap found (benefit-metric.md M3):** `kfd1`'s title-truncation/artefact-count-badge UX never reached the live product/org/tenant boards (`_renderKanbanColumns`) — only the now-dead legacy renderer. S2.2 closes this.
- **Real gap found (S3.3's Architecture Constraints):** the legacy renderer already has working, advisory WIP-limit badge logic (`lane()`'s `wipLimit` param) — S3.3 ports it rather than building from scratch.
- **Two genuinely open technical decisions, explicitly flagged rather than assumed** (not blocking DoR, but must be resolved and documented in `decisions.md` during implementation): S3.2's card-reorder persistence approach (no existing schema field); S3.4's exact destination route/identifier mapping for the item-detail link.

## NFR Profile

Performance targets identified: session-readiness lookup (S1.1) and artefact-count lookup (S2.2) must not introduce N+1 per-card queries at board-render time — explicitly called out in both stories' Architecture Constraints.
Security requirements: tenant-ownership enforcement (ADR-025) must extend to every new endpoint/route this feature adds (S1.1's advance endpoint, S3.4's detail-view entry point) — matching the existing `bri-s3.4` pattern (404, not 403, on cross-tenant access).
Data classification: Internal — journey/feature state, not customer PII or payment data.
Data residency: Not applicable — no new data storage location introduced.
Availability SLA: Not defined — matches this repo's existing web-ui SLA posture (none formally defined).
Compliance frameworks: None — `.github/context.yml` confirms `meta.regulated: false`.

Saved to `artefacts/2026-07-24-interactive-kanban-boards/nfr-profile.md` (see that file for the full template-conformant profile).

**Status:** Active — NFRs identified and consolidated above; no named regulatory clauses requiring separate human sign-off.

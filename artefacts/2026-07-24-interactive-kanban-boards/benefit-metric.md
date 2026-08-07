## Benefit Metric: Interactive, Trello-style Kanban Boards

**Discovery reference:** artefacts/2026-07-24-interactive-kanban-boards/discovery.md
**Date defined:** 2026-07-24
**Metric owner:** Hamish King — Founder/Operator
**Reviewers:** Hamish King — Founder/Operator

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a standard product feature (operator-facing tooling improvement), not a hypothesis test about tooling, process, or team capability. This repo's own personal/non-regulated profile (`.github/context.yml`) means the "non-engineering metric owner/reviewer" convention this template otherwise recommends is satisfied by the operator's dual role (they are both the engineering owner and the sole product stakeholder for this personal-scale tool).

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Board-to-CLI parity for real stage transitions

| Field | Value |
|-------|-------|
| **What we measure** | The proportion of the operator's real pipeline stage transitions (e.g. DoR sign-off → branch-complete, review → test-plan) completed entirely from a kanban board drag/click action, rather than dropping to the CLI (`node bin/skills advance`/`gate-advance`) or a separate skill invocation. |
| **Baseline** | 0% — confirmed directly: the board is currently read-only; every real transition today goes through the CLI or a skill session (discovery.md, Directional Success Indicators). |
| **Target** | ≥ 50% of the operator's real stage transitions in a 2-week window after deployment are completed entirely from the board. |
| **Minimum validation signal** | ≥ 20% — if fewer than 1 in 5 real transitions move to the board, the interaction model (drag-and-drop / click-to-advance) likely doesn't fit real usage and needs redesign before further investment. |
| **Measurement method** | Operator self-report via a simple day-to-day log (which mechanism — board vs CLI — was used for each real transition) for 2 weeks post-deployment. No existing telemetry hook for this; a lightweight manual log is the pragmatic measurement given single-operator scale — do not build new instrumentation solely to measure this. |
| **Feedback loop** | If the minimum signal isn't met after 2 weeks, the operator (as sole stakeholder) decides whether to (a) redesign the interaction model based on what actually blocked board usage, (b) accept the board as a visibility-only tool and stop investing further in board-driven transitions, or (c) extend the measurement window if 2 weeks proves too short a sample. |

### Metric 2: Visual consistency with the current design system

| Field | Value |
|-------|-------|
| **What we measure** | Whether all three kanban board routes (product/org/tenant) render using the current design system's tokens (palette, typography, layout) established in the recent product-view redesign — not a subjective "looks nicer" judgment, but a concrete token-conformance check. |
| **Baseline** | 0 of 3 board routes currently use the current design-system tokens (confirmed by direct operator observation, 2026-07-24 — boards predate the product-view redesign's visual language). |
| **Target** | 3 of 3 board routes visually conform to the design system — verified via a side-by-side screenshot comparison against the product-view redesign's published mockup at DoD. |
| **Minimum validation signal** | At least the highest-traffic scope (product-level, per operator's own daily usage pattern) conforms — if org/tenant scope conformance slips, that's an acceptable partial outcome, not a blocker to shipping. |
| **Measurement method** | Manual screenshot comparison at Definition of Done, one screenshot per board scope, compared side-by-side against the existing product-view mockup. Binary per-scope pass/fail — no automated visual-regression tooling proposed here (this repo's own D40/B2 guidance treats CSS-layout-dependent ACs needing either automated visual regression or a RISK-ACCEPT + manual smoke test; given single-operator scale and no existing Playwright visual-diff infrastructure in this repo, RISK-ACCEPT + manual smoke test is the pragmatic choice — to be logged in this feature's `decisions.md` at DoR). |
| **Feedback loop** | If a board scope fails the screenshot comparison at DoD, it is a real, named gap logged as a DoD observation — the operator decides whether to block release on it or ship with a documented follow-up story. |

### Metric 3: WIP visibility is retained — title truncation and artefact-count badge reach the live boards

| Field | Value |
|-------|-------|
| **What we measure** | Whether the LIVE product/org/tenant kanban boards (rendered via `_renderKanbanColumns`) have bounded, scannable card titles and an artefact-count indicator — the same UX `kfd1` delivered, but confirmed via direct code/git-history read (2026-07-24) to have only ever reached the LEGACY `renderKanban({features,ideas})` path (used by the now-removed `/features?view=board` route). `kfd1` (2026-06-17) predates `kbc-s1`'s consolidation (2026-07-19); `kbc-s1` introduced `_renderKanbanColumns` as a separate, simpler function that never inherited `kfd1`'s `truncateTitle`/artefact-count-badge logic. **Corrected baseline** — this is not a "retain existing" metric; it's closing a real, confirmed gap. |
| **Baseline** | 0 of 3 live board scopes have title truncation or an artefact-count badge today — `_renderKanbanColumns`'s card renderer uses `card.title || card.name || '(untitled)')` with no length bound and no badge, confirmed via direct code read. |
| **Target** | All 3 live board scopes truncate long titles (reusing `kfd1`'s existing `truncateTitle()` logic, same 48-char bound) and show an artefact-count badge per card, matching `kfd1`'s original UX intent, now actually reaching the boards that are live today. |
| **Minimum validation signal** | Title truncation alone (even without the artefact-count badge) — truncation is the higher-priority fix since unbounded titles risk uneven card heights hurting board scannability; the badge is a secondary, lower-risk addition. |
| **Measurement method** | Direct visual check at DoD: a card with a long title (>48 chars) truncates correctly on all 3 board scopes; a card's artefact count (if the underlying data source exposes one — see S2.2's Architecture Constraints for what's actually available per scope) displays. |
| **Feedback loop** | If artefact-count data genuinely isn't available for org/tenant scope (a real, open question — see S2.2), the operator decides whether product-scope-only badge coverage is an acceptable partial outcome or whether the underlying data needs extending first. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1: Board-to-CLI parity for real stage transitions | S1.1, S1.2, S3.1 (direct); S3.2, S3.4 (indirect — reduce need to leave the board for prioritisation/information) | Covered |
| M2: Visual consistency with the current design system | S2.1 | Covered |
| M3: WIP visibility — title truncation and artefact-count badge reach the live boards | S2.2, S3.3 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, written at /definition
- Implementation approach (native HTML5 drag-and-drop vs a library; exact WIP-limit configuration surface) — that is /definition's job
- Sprint targets or velocity — these metrics are outcome-based (real usage behaviour, visual conformance, WIP visibility), not output-based (features shipped)

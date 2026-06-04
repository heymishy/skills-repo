## Epic: Operators can see, act on, and review assumptions during a live /ideate session

**Discovery reference:** artefacts/2026-05-21-ideate-web-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-05-21-ideate-web-ux/benefit-metric.md
**Slicing strategy:** User journey — stories follow the operator's chronological path through the session (open → see manifest → generation → cards appear → confirm/flag → lens transition → artefact visible).

## Goal

When this epic is complete, an operator running `/ideate` via the web UI sees a structured three-section right panel alongside the chat thread: a context manifest showing which artefacts were loaded at session start, assumption cards accumulating as the model emits them, and a live artefact draft filling the remaining space. At each lens boundary a nudge bar prompts review of any unconfirmed cards. The operator can confirm or flag each card without leaving the session. The full surface is a browser-side extension of the existing SSE streaming pattern — no new server architecture, no new model API dependencies.

## Out of Scope

- `.github/skills/ideate/SKILL.md` instruction changes — governed file; separate epic (iwu-skillmd-tuning) and separate pipeline chain required (ADR-011)
- Setting `session.assumptionCardsEnabled` to `true` by default — that happens in iwu.6 when the SKILL.md tuning story merges; until then the feature flag defaults `false`
- Clusters 3, 5, and 6 from the discovery (lens selector UI, session export, multi-session comparison) — explicitly deferred to post-MVP in discovery.md
- Persisting session state beyond the in-memory TTL (ADR-019) — no database, no disk write for assumption cards
- Visual styling or CSS replication from the UX reference mockup (`ideate_web_ux_panel_mockup.html`) — structural decisions only; implementation uses the existing `src/web-ui` stylesheet

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Assumption card render reliability | 0% (no card UI exists) | ≥95% of markers emit a visible card | iwu.3 implements the marker→card pipeline; iwu.4 wires confirm/flag so cards reach a terminal state; iwu.2 ensures the DOM container exists |
| M2 — Rework rate from invisible assumptions | ~30% of sessions end in re-run (discovery baseline) | <15% re-runs caused by invisible-assumptions | Visible cards + nudge (iwu.3 + iwu.5) surface assumptions before they are forgotten; iwu.1 surfaces loaded-context gaps before lens 1 |
| M3 — Session completion rate | Unknown baseline | ≥50% of sessions reach a confirmed artefact draft | iwu.2 + iwu.5 give the operator a coherent session surface; right panel coexistence prevents context switch cost that causes session abandonment |

## Stories in This Epic

- [ ] iwu.1 — Render context manifest panel with chip layout (#context-manifest)
- [ ] iwu.2 — Restructure right panel layout for two-section coexistence
- [ ] iwu.3 — Stream assumption cards from SSE marker events into #assumption-cards
- [ ] iwu.4 — Confirm/flag assumption cards via POST endpoint
- [ ] iwu.5 — Emit lensComplete SSE event and render lens-transition nudge bar

## Human Oversight Level

**Oversight:** Medium
**Rationale:** All stories are browser-facing and extend the existing SSE streaming surface. The feature flag (`session.assumptionCardsEnabled` defaults `false`) means production sessions are unaffected until iwu.6 merges. PRs should be reviewed by the operator before merge to validate the UX structural decisions match the mockup intent.

## Complexity Rating

**Rating:** 2
**Rationale:** SSE streaming extension is a known pattern (existing `handlePostTurnStreamHtml`). The marker parsing, cardId generation, and three-panel layout are new but well-specified. The main ambiguity is where the current session initialisation code surfaces context file lists for iwu.1 — requires code reading before implementation.

## Scope Stability

**Stability:** Stable
**Rationale:** ADR-018 through ADR-020 lock the protocol. Structural decisions from the UX mockup are captured in story ACs. The feature flag decouples delivery from SKILL.md tuning risk.

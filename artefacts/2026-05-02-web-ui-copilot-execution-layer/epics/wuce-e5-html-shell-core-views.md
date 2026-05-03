## Epic: HTML shell and core Phase 1 views

**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md
**Slicing strategy:** User journey

## Goal

A non-technical stakeholder — programme manager, business lead, BA, SME, or product owner — can navigate the full Phase 1 browser surface without seeing a single line of JSON. From the dashboard landing page they follow `<nav>` links to: a full feature list, any feature's artefact index, a personalised action queue, and the programme status board. Every view is rendered as a properly structured HTML page, keyboard-navigable, and consistent in layout. The Phase 1 HTML rendering surface is complete; the underlying JSON API endpoints are left unchanged and remain backward-compatible for existing consumers.

## Context

All Phase 1 data endpoints are already built and tested (wuce.5, wuce.6, wuce.7, wuce.8). They return JSON. The render helpers `renderFeatureList()` and `renderArtefactItem()` are already written in `src/web-ui/routes/features.js` but are never called in HTTP response handlers. This epic wires those render functions into content-negotiated HTML responses and adds the shared HTML shell, navigation, and HTML views for the action queue and status board.

## Out of Scope

- Any real-time update or WebSocket push — read-only at point-in-time, no streaming
- User-editable content in any HTML view — Phase 1 is read and sign-off only
- CSS framework or external stylesheet CDN — inline or `<style>` blocks only (ADR-001 pattern)
- Search or filter across features — post-MVP progressive enhancement
- Mobile-specific responsive breakpoints beyond basic usable layout — Phase 2 UX polish
- Any change to the JSON response shape of existing API endpoints — backward-compatibility is a hard constraint

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| P4 — Status self-service rate | ~0% (JSON API only) | ≥9/10 status questions answered from web UI | HTML feature list, artefact index, and status board give programme managers browser-ready answers without JSON parsing |
| M2 — Phase 1 stakeholder activation rate | 0% | ≥60% within 30 days | A coherent HTML navigation surface is the prerequisite for any non-engineer to activate — without it Phase 1 has no usable entry point |
| P1 — Non-engineer self-service sign-off rate | Established baseline | ≥80% of eligible sign-offs via web UI | HTML action queue surfaces pending sign-offs directly; stakeholders can act without an engineer routing them |
| P5 — Sign-off wait time | Establishing baseline | ≥30% reduction | Visible action queue in the browser eliminates the coordination lag of engineer-relayed notifications |

## Stories in This Epic

- [ ] wuce.18 — HTML shell and navigation
- [ ] wuce.19 — Feature list HTML view
- [ ] wuce.20 — Feature artefact index HTML view
- [ ] wuce.21 — Action queue HTML view
- [ ] wuce.22 — Status board HTML view

## Human Oversight Level

**Oversight:** High
**Rationale:** Browser-facing surface presenting governance records and action queues to non-technical stakeholders. Incorrect rendering or broken navigation could prevent governance actions. Human review required at each story PR.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

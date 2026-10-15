## Story: Override drawflow's vendor-default node/port/connector colours with the app's own design tokens

**Epic reference:** None — short-track (bounded CSS fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the investigator-confirmed root cause documented below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui, ui]

## User Story

As **an operator viewing a journey's Canvas view**,
I want **the drawflow stage-node boxes, ports, and connectors to use the app's own muted surface/border token palette instead of drawflow's own hard-coded saturated-colour vendor defaults**,
So that **the Canvas view reads as part of the same app as the Customer-experience and Delivery views, in both light and dark mode, instead of looking like an unstyled third-party widget**.

## Benefit Linkage

**Metric moved:** Visual consistency of the Canvas view with the rest of the app (operational/design-quality fix, not a formal benefit-metric artefact — short-track).
**How:** The operator directly flagged this from live screenshots during `journey-authoring-experience`'s own live verification session (2026-10-14): a bright, saturated cyan node fill that doesn't match the app's muted `var(--surface)`/`var(--line)` palette used everywhere else. A dedicated spike (`artefacts/2026-10-14-journey-authoring-experience/spikes/canvas-node-styling-outcome.md`) confirmed the root cause and a FIX verdict. Fixing it removes a visible, operator-confirmed inconsistency from the one view of the app that currently looks unstyled, with a small, contained CSS-only change.

## Architecture Constraints

None identified beyond this repo's own existing conventions — checked against `.github/architecture-guardrails.md`. This story overrides vendor CSS using the app's own already-established design tokens (`var(--surface)`, `var(--line)`, `var(--ink)`, `var(--muted)`, `var(--accent)`, `var(--accent-soft)`) — the exact same tokens already used throughout `journeys.js`'s own style block (e.g. the Customer-experience view's emotion-curve polyline already uses `stroke="var(--line)"`). No new token, no new pattern, no new file.

## Dependencies

- **Upstream:** None.
- **Downstream:** None. Entirely independent of `journey-authoring-delivery-view-grid` (the Delivery-view grid epic) — this story touches only the Canvas view's drawflow node/port/connector CSS, not the Delivery or Customer-experience views.

## Acceptance Criteria

**AC1:** Given the Canvas view renders a journey with at least one stage, When the drawflow node for that stage is inspected, Then its background is `var(--surface)`, its text colour is `var(--ink)`, its border is `1px solid var(--line)`, and its border radius is `8px` — replacing drawflow's own hard-coded `background:#0ff;border:2px solid #000` vendor default.

**AC2:** Given a drawflow node is selected (clicked, entering drawflow's own `.selected` state), When its styling is inspected, Then its background is `var(--accent-soft)` and its border colour is `var(--accent)` — replacing drawflow's own hard-coded `background:red` vendor default.

**AC3:** Given a drawflow node's input or output port is inspected, When its styling is checked, Then both ports share `background:var(--surface)` and `border:2px solid var(--line)` — replacing drawflow's own hard-coded `background:#fff`/`background:#ff0` (yellow input) vendor defaults, with no colour difference between the input and output port.

**AC4:** Given two stages are connected on the Canvas view, When the connector line between them is inspected, Then it is `stroke:var(--line)` at `stroke-width:2px` — replacing drawflow's own hard-coded `stroke:#4682b4` (steel blue) at `stroke-width:5px`, and matching the Customer-experience view's own emotion-curve polyline convention (`journeys.js`'s existing `stroke="var(--line)" stroke-width="2"`).

**AC5:** Given the app is switched to dark mode, When the Canvas view is viewed, Then every element covered by AC1–AC4 resolves to the dark-mode value of its own token (e.g. `var(--surface)` resolves to the dark `--surface` value already defined in `html-shell.js`) — confirming the fix is token-based, not a second hard-coded light-mode-only override.

**AC6 (CSS-layout classification, CLAUDE.md B2):** This story changes only colour/border-radius/stroke-width values on already-existing, already-positioned elements — it does not move, resize, or reflow anything (node width/padding/position are explicitly unchanged, out of scope). No AC here depends on CSS layout, scroll behaviour, or element position — RISK-ACCEPT is not applicable; a layout-dependent E2E test is not required. Colour-value verification (AC1–AC5) is coverable by a real-browser or Playwright computed-style check, not a layout check.

## Out of Scope

- **Node width, padding, or position** — unchanged; this story is colours/border/stroke only.
- **Node content/markup** (stage name, health indicator, moment-of-truth badge, Edit/Map feature/Add placeholder affordances) — unchanged.
- **Any change to the Customer-experience or Delivery views** — entirely out of scope; this story touches only Canvas-view drawflow CSS.
- **Upgrading or patching the `drawflow` npm package itself** — the vendor CSS file (`node_modules/drawflow/dist/drawflow.min.css`, served unmodified at `/vendor/drawflow.min.css`) is not edited; overrides are added as app-side CSS rules in `journeys.js`'s own existing style block, loaded after the vendor stylesheet `<link>` so they take precedence.

## NFRs

None — confirmed. This is a pure CSS-value override reusing the app's own already-governed design tokens; it introduces no new performance cost, no new security surface, no new audit-relevant action, and no new accessibility pattern (colour contrast is inherited from tokens already validated elsewhere in the app, not newly authored here).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

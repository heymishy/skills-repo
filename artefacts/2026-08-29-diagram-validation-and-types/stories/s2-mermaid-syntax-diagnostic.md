## Story: Structured diagnostic for invalid mermaid syntax inside a diagram

**Epic reference:** epics/diagram-validation-drift-and-sequence-type.md
**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Benefit-metric reference:** artefacts/2026-08-29-diagram-validation-and-types/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer running `/design` or `/definition`**,
I want to **see specifically what's wrong with a diagram's mermaid syntax when it fails to render**,
So that **instead of a generic "diagram failed to render" box, I know the actual reason mermaid reported**.

## Benefit Linkage

**Metric moved:** Diagram render-failure diagnosability
**How:** Closes the "invalid mermaid syntax" half of the metric. Today, `markDiagramRenderError(node)` (`src/web-ui/routes/skills.js` ~line 906-911) discards mermaid's own thrown error/rejection reason entirely and shows only "[label] diagram failed to render." This story captures and surfaces the specific reason.

## Architecture Constraints

- **ADR-026 (no parallel rendering path):** extend `markDiagramRenderError`'s existing call sites (both the live-session script and the read-only history script share it via `_CANVAS_RENDER_FN_LINES`) — do not add a second, parallel error-handling path.
- Reuses S1's diagnostic shape for consistency across both render-failure surfaces.

## Dependencies

- **Upstream:** S1 (reuses its diagnostic object shape).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a diagram's `content.mermaid` string is invalid mermaid syntax, When `mermaid.run()` throws or rejects during client-side render, Then `markDiagramRenderError` surfaces the specific reason mermaid reported (not just "[label] diagram failed to render"), and that reason is also captured in a client-side console/log record for diagnosis.

**AC2:** Given the existing accessibility requirement that diagram content must not rely on colour alone, When a mermaid render failure occurs, Then the specific reason is available via the same `<details>`/text-alternative mechanism already used for successfully-rendered diagrams — a text label, not colour or icon alone.

**AC3:** Given a mermaid render-failure diagnostic has fired for one diagram node, When a sibling diagram in the same canvas panel renders successfully, Then the sibling's render is unaffected — preserving the existing per-node isolation (`mermaid.run({nodes:[node]})` already runs per node; this story must not regress that).

**AC4:** Given a diagram that renders successfully today, When this story's changes are in place, Then behaviour is unchanged — no diagnostic UI appears, and all existing successful-render tests continue to pass.

## Out of Scope

- The malformed-marker case (invalid JSON or disallowed type) — that is S1's scope.
- An automated model retry using this diagnostic — S1's bounded-retry mechanism covers marker-level failures; extending retry to mermaid-syntax-level failures would require re-invoking the model mid-render-cycle, a larger mechanism not justified by this MVP.

## NFRs

- **Performance:** No added latency — `mermaid.run()` already executes; this only captures its rejection reason instead of discarding it.
- **Security:** Mermaid's existing `securityLevel: "strict"` configuration is unaffected. The surfaced error text must be escaped before insertion into the DOM — no new raw-HTML injection surface.
- **Accessibility:** See AC2.
- **Audit:** Not applicable — this is a client-only failure mode with no server-side event (unlike S1, whose failure occurs server-side in the turn stream).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

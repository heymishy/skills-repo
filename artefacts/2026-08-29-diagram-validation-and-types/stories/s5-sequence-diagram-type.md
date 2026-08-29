## Story: Add the Sequence diagram type, conditionally emitted

**Epic reference:** epics/diagram-validation-drift-and-sequence-type.md
**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Benefit-metric reference:** artefacts/2026-08-29-diagram-validation-and-types/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer running `/design` or `/definition`**,
I want to **express a feature's own component-to-component interaction over time as a Sequence diagram**,
So that **an SSE turn exchange, a cache-fallback trace, or an auth handshake can be documented as clearly as System Architecture already documents component topology**.

## Benefit Linkage

**Metric moved:** New diagram type (sequence) adoption
**How:** This story is the mechanism the metric measures directly — without it, the metric is permanently 0%.

## Architecture Constraints

- **ADR-026 (no parallel rendering path):** dispatch through the existing single `renderCanvasBlock()` function, reusing `buildDiagramBodyHtml` exactly as `data-model`/`system-architecture`/`program-design` already do — add one more `else if (type === "sequence")` branch calling the same shared helper, no new rendering path.
- **Render-site inventory pattern** (`.github/standards/web-ui/web-ui-patterns.md`, added this session): before finalizing, grep the whole repo for every place a canvas-block type dispatch exists — confirm the read-only history script's shared `_CANVAS_RENDER_FN_LINES` array (documented as the single shared implementation per ADR-026) genuinely covers this new type too, not a second copy.

## Dependencies

- **Upstream:** None (independent of S1-S4).
- **Downstream:** None — drift comparison for sequence diagrams is explicitly out of scope for this epic.

## Acceptance Criteria

**AC1:** Given a feature under `/design` or `/definition` whose own subject matter genuinely involves a multi-step component interaction over time (e.g. an SSE turn exchange, a cache-fallback trace, an auth handshake), When the model authors that part of the artefact, Then it may emit a `---CANVAS-JSON: {"type":"sequence","title":"<string>","content":{"mermaid":"<mermaid sequenceDiagram syntax>"}}---` marker, following a worked example included directly in the SKILL.md instruction text — matching the existing convention for System Architecture and Data Model worked examples.

**AC2:** Given a feature whose subject matter does NOT involve a multi-step interaction worth diagramming, When `/design` or `/definition` runs, Then no sequence diagram is emitted — emission is conditional per the instruction, not automatic/unconditional like System Architecture.

**AC3:** Given a valid `sequence`-type CANVAS-JSON marker, When it reaches the client, Then it renders via the existing `buildDiagramBodyHtml`/`renderCanvasBlock` shared mechanism with the type label "Sequence" — identical markup shape (diagram wrapper, type label, text-alternative `<details>`) to the 3 existing mermaid-based types — and S1's and S2's diagnostic mechanisms apply to it automatically, with no type-specific handling needed.

**AC4:** Given the read-only stage-history view (`drh-s1`'s durable-turn-history rendering), When a session containing a sequence-type canvas block is resumed or viewed historically, Then it renders identically to the live-session view — proving the type was added to the single shared `_CANVAS_RENDER_FN_LINES` array, not a second parallel path.

**AC5:** Given the updated `TYPE_ALLOW` list in `parseCanvasBlock`, When a `sequence`-type marker is parsed, Then it is not rejected as a disallowed type — a `sequence`-type marker is no longer silently dropped as unrecognized.

## Out of Scope

- Drift comparison for sequence diagrams — no `compareSequence` function or equivalent is added in this epic; revisit only once the type proves used, per Metric 3's own feedback loop.
- Any UI treatment beyond the existing shared canvas-block rendering shape — no visual style specific to sequence diagrams.

## NFRs

- **Performance:** Not applicable — no new model/network calls beyond the existing per-turn LLM call.
- **Security:** Mermaid's existing `securityLevel: "strict"` configuration already covers `sequenceDiagram` syntax same as `flowchart` — confirm no separate sanitization gap during implementation.
- **Accessibility:** Inherited for free via the shared render function — same text-alternative `<details>` mechanism, non-colour-only signal.
- **Audit:** Not applicable.

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

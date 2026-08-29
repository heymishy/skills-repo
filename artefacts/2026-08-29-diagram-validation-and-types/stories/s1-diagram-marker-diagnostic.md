## Story: Structured diagnostic for a malformed canvas diagram marker

**Epic reference:** epics/diagram-validation-drift-and-sequence-type.md
**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Benefit-metric reference:** artefacts/2026-08-29-diagram-validation-and-types/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer running `/design` or `/definition`**,
I want to **see a specific, structured reason when a canvas diagram marker fails to parse**,
So that **I understand exactly what went wrong instead of the diagram silently never appearing at all**.

## Benefit Linkage

**Metric moved:** Diagram render-failure diagnosability
**How:** Closes the "malformed marker" half of the metric — a JSON-parse failure or a disallowed `type` value currently causes `parseCanvasBlock` to return `null` and the whole marker to be silently dropped in `handlePostTurnStreamHtml`'s SSE scan loop (`src/web-ui/routes/skills.js` ~line 4905-4919), with zero signal to the model or operator. This story replaces that silence with a structured diagnostic.

## Architecture Constraints

- **ADR-026 (no parallel rendering path):** the diagnostic must flow through the existing single canvas-block dispatch mechanism (`parseCanvasBlock`/the SSE scan loop) — not a second, parallel handling path.
- **Testing standards** (`.github/standards/testing/test-design-patterns.md`, added this session): any new test asserting the diagnostic fires must be mutation-tested against reverting the fix before being trusted, and must not rely on a whole-file source-regex assertion where a producer and consumer could share the same string.

## Dependencies

- **Upstream:** None
- **Downstream:** S2 reuses this story's diagnostic object shape for the mermaid-syntax failure case.

## Acceptance Criteria

**AC1:** Given a `---CANVAS-JSON:...---` marker whose JSON payload has a syntax error, When the server-side turn-stream scanner (`handlePostTurnStreamHtml`'s canvas-marker scan loop) encounters it, Then a structured diagnostic naming the parse failure is emitted (via SSE or an equivalent surfaced record) — the marker is not silently dropped with zero signal, as it is today.

**AC2:** Given a marker with valid JSON but a `type` value not present in `parseCanvasBlock`'s `TYPE_ALLOW` list, When the scanner encounters it, Then the diagnostic names the specific disallowed value and the list of allowed types — not a generic parse failure message.

**AC3:** Given a diagnostic has fired for a malformed marker, When the model's next attempt at the same diagram (within this story's one bounded retry) includes a corrected marker, Then the corrected marker renders normally; When a SECOND consecutive attempt for the same diagram also fails, Then no further retry occurs — the failure is surfaced to the operator as terminal.

**AC4:** Given a marker that parses correctly today (valid JSON, allowed type), When the scanner processes it after this story's changes, Then behaviour is unchanged — no diagnostic fires, and all 7 existing canvas-block types continue to render exactly as before.

## Out of Scope

- Diagnosing invalid mermaid *syntax* inside otherwise-valid marker content — that is S2's scope.
- Retrying more than once — a second consecutive failure on the same diagram is terminal per AC3, not retried again.

## NFRs

- **Performance:** Diagnostic generation adds no additional model/LLM call — pure local parsing, matching `drift-comparator.js`'s own zero-added-latency design.
- **Security:** Diagnostic text must be escaped before appearing in any SSE payload or log — no raw model-output injection.
- **Accessibility:** Not applicable to this story (server-side/diagnostic-generation only; the visual error presentation is S2's scope).
- **Audit:** The diagnostic event itself must be loggable — this is the evidence Metric 1 (render-failure diagnosability) measures.

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

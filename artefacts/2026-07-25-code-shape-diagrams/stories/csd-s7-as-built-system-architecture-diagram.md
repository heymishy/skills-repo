## Story: As-built System Architecture diagram generation via static service-call detection

**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Benefit-metric reference:** artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md

## User Story

As a **Developer/engineer**,
I want **`/verify-completion`/`/branch-complete` to generate an as-built System Architecture diagram by statically detecting real service-to-service calls in committed code**,
So that **csd-s6's drift check has a real as-built System Architecture diagram to compare against the as-designed one — closing the one gap left open at this epic's Definition of Done**.

## Benefit Linkage

**Metric moved:** P1 — Time-to-drift-determination; P3 — Diverged-flag true-positive rate.
**How:** csd-s6's System Architecture drift-comparison logic was implemented and tested against fixtures at DoD, but could not exercise its real end-to-end path because no as-built generator existed for this diagram type. This story closes that gap directly — without it, P1/P3 can never be measured for System Architecture diagrams, only for Data Model and Program Design.

## Architecture Constraints

- ADR-026: reuses `call-graph-extractor.js`'s existing require-edge-extraction approach (extended with an external-package allowlist) and `src/web-ui/routes/skills.js`'s existing canvas rendering mechanism — no parallel extraction or rendering path.
- ADR-027: ordinary application code (`src/modules/`, `src/web-ui/routes/`), consistent with csd-s5.
- See `decisions.md`'s 2026-07-26 ARCH entry: ground truth is a fixed-allowlist static `require()` scan (`stripe`, `pg`, `ioredis`/`redis`, `@octokit/*`, `@anthropic-ai/sdk`, `posthog-node`), not live tracing or APM instrumentation.

## Dependencies

- **Upstream:** csd-s5 (established the as-built generation + versioned-artefact pattern this story follows), csd-s6 (drift-comparator's `compareSystemArchitecture()` already expects the exact mermaid `flowchart` edge shape this story must produce — no comparator changes needed).
- **Downstream:** None — closes the epic's last open gap. No story depends on this one.

## Acceptance Criteria

**AC1:** Given this repo's real committed `src/` tree, When as-built System Architecture generation runs, Then it statically detects `require()` calls to the allowlisted external-service packages (`stripe`, `pg`, `ioredis`/`redis`, `@octokit/*`, `@anthropic-ai/sdk`, `posthog-node`) and resolves each to a named service label (e.g. `require('stripe')` → "Stripe") — static analysis only, no live network calls.

**AC2:** Given the detected service requires, When the diagram is generated, Then it renders as a mermaid `flowchart` with an edge from the wiring file (e.g. `server.js`) to each named external service — the exact shape `src/modules/drift-comparator.js`'s `compareSystemArchitecture()` already parses via `parseFlowchartMermaid()`, with no changes needed to the comparator.

**AC3:** Given a repo with no allowlisted service requires found, When generation runs, Then it produces an empty-edges flowchart (not an error) — a real feature legitimately touching zero named external services is a valid outcome, not a failure.

**AC4:** Given the generated diagram, When saved, Then it is written to the feature's artefact folder as a versioned file (`artefacts/<featureSlug>/diagrams/as-built-system-architecture-<timestamp>.json`), following the exact same convention `writeAsBuiltDiagramArtefact()` already established in csd-s5 — reused directly, not reimplemented.

**AC5:** Given this diagram type feeding csd-s6's drift check, When an as-designed and this as-built System Architecture diagram are compared, Then the comparison runs end-to-end without any change to `drift-comparator.js` — proving the shapes are genuinely compatible, not just individually plausible.

## Out of Scope

- Deep transitive resolution through the D37 injectable-adapter pattern (tracing from every route handler through every adapter to its eventual external `require()`) — per the decisions.md entry, this story only detects wiring-file-to-service edges, not full transitive call paths.
- Live network/APM-based call tracing — static analysis only, matching csd-s5's Data Model precedent.
- Extending the allowlist automatically (e.g. detecting any `require()` not in this repo's own `src/` tree) — the allowlist is fixed for this MVP; extending it is a future decision if a real gap is found.

## NFRs

- **Performance:** Static scan completes within the normal `/verify-completion` session time budget — same NFR profile entry as csd-s5 (`NFR-parsing-drift-time-budget`), no new numeric target.
- **Security:** Diagram shows service names and wiring-file locations only — never credentials, connection strings, or API keys, even though the scan reads files (like `server.js`) that contain `process.env.STRIPE_SECRET_KEY`-style references. The generator must extract only the package name and requiring file, never surrounding code content that could carry a literal secret.
- **Accessibility:** Inherits csd-s2's accessibility properties — no new rendering path.
- **Audit:** As-built generation events are logged, consistent with csd-s5's existing convention (`as-built-diagram-generation-succeeded`/`-failed` events).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

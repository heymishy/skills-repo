# Discovery: Infinite Canvas — Reusable Free-Form Spatial Canvas Primitive

**Status:** Clarified
**Created:** 2026-10-10
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)

---

## Problem Statement

Operators have no way to spatially lay out and connect ideas anywhere in this platform. Every existing "canvas" either auto-lays-out from AI-generated text (mermaid diagrams rendered during `/ideate`, `/design`, and `/definition`) or constrains placement to a fixed grid (`definition-canvas`'s story map — drag-drop is real, but limited to reordering within fixed epic columns and phase rows). The journey canvas itself — whose own discovery (`2026-10-05-customer-journey-as-first-class/discovery.md`) explicitly named "the visual journey canvas" as this platform's single highest-complexity UI risk — shipped as a linear card list instead, and that simplification was never logged as an explicit decision anywhere in that feature's own `decisions.md`. A genuinely free-form, Miro-style canvas (arbitrary node positioning, pan/zoom, freehand connections) doesn't exist anywhere in this platform today, for journeys or anything else.

A direct code audit (not just discovery-document review) confirmed this gap precisely: `#canvas-panel` across `/ideate`/`/design`/`/definition` is a plain scrollable container that appended content blocks render into — not a rendering engine. `definition-canvas`'s drag-drop uses native HTML5 `draggable="true"` with no library, constrained to a fixed grid. No shared spatial-positioning primitive exists to extend.

## Who It Affects

**Primary: Outer loop practitioner (PO / SME / discovery lead)** — the same persona journey mapping was built for. They need to spatially sketch and rearrange a journey (or any other structure) while thinking, not type instructions to an LLM and wait for a re-render.

**Secondary: Tech lead / squad lead** — reviews and reasons about spatial artefacts (a journey map, potentially a future architecture sketch) where relative positioning and grouping carries meaning mermaid's auto-layout can't preserve.

No second concrete use case beyond journey mapping is named yet. "Reusable" here is an architectural design goal for the MVP (the canvas primitive itself must not hard-code journey-specific concepts), not a second shipped use case in this cycle — building a second real feature on top of it comes later, once one exists to name concretely. (A prior discovery in this repo, `2026-08-29-diagram-validation-and-types`, explicitly warned against building speculative diagram capability without a real use case in hand — the same discipline applies here.)

## Why Now

Two triggers converge. First, direct: this session's own post-delivery live review of `customer-journey-as-first-class` found that its discovery explicitly named "the visual journey canvas" as the platform's single highest-complexity UI risk, and that risk was quietly resolved by building something simpler (a linear list) without ever being surfaced as a decision — leaving the original intent unmet. Second, a constraint that likely blocked this before has a proven path around it: this platform's web-ui has been a deliberately zero-new-npm-dependency surface (`product/tech-stack.md`: "Zero new npm dependencies — `https`, `fs`, `path`, `os`, `crypto` built-ins only"), but that principle was already quietly breached once, for mermaid (`package.json`: `"mermaid": "^11.16.0"`, story `csd-s1`), via a proven integration technique: install the npm package normally, serve its pre-built bundle via a dedicated server route that reads straight from `node_modules` at request time (no bundler/build step, gzip + in-memory cached), and load it client-side via a plain `<script src>` tag. The operator has explicitly agreed to relax the npm constraint for this initiative, and a working precedent for exactly how to do that safely already exists in this codebase.

## MVP Scope

**In scope:**
1. A free-form canvas client module — arbitrary node positioning, pan/zoom, freehand node-to-node connections — built as a genuinely reusable primitive (not journey-specific), following the mermaid/csd-s1 integration precedent (real npm dependency, served via a dedicated runtime-read route, loaded via a plain `<script src>`, no bundler).
2. **One real, shipped application: replacing the journey canvas's current linear stage list.** Same underlying data (stages, mappings, health) — new spatial rendering and interaction only.

**Explicitly named future goal, NOT in MVP scope:** replacing `definition-canvas`'s story-map grid (or the mermaid-rendered design/architecture diagrams). Those surfaces already work and are already adopted, with a real feature set (epic-column grouping, phase-row locking, inherited/new card distinction, touch tap-to-select fallback, batched apply-changes dispatch, epic-rename guard) a replacement would need to match or exceed. The right gate, per the operator's own framing: prove the canvas adds real value on journeys first — if it demonstrates genuinely better CX there, subsequent features can scope replacing the other surfaces. Attempting that migration in the same cycle as building the primitive itself risks both.

## Out of Scope

1. **Replacing `definition-canvas`'s story-map grid or the mermaid-rendered design/architecture diagrams** — explicitly gated on this feature proving real value on journeys first (see MVP Scope). Sequenced after, not deferred indefinitely.
2. **Real-time multi-user collaborative editing** (simultaneous cursors, live co-editing of the same canvas) — a materially different technical problem (websockets/CRDT-class sync) than rendering/interaction. MVP is single-operator editing, same as every other surface in this platform today.
3. **Freehand drawing / sketching tools** (pen, shapes beyond nodes and connections) — MVP scope is positioning and connecting existing journey-stage nodes, not a general drawing surface.
4. **Changes to the underlying journey data model or health-computation logic** — the canvas MVP changes how journey stages are rendered and spatially arranged; the stages/mappings/health data and its computation stay exactly as `ep1`–`ep3` of the prior feature built them.
5. **Cross-org canvas sharing** — consistent with the journey feature's own existing org-scoped boundary.

## Assumptions and Risks

~~[ASSUMPTION] A specific canvas-rendering library has not yet been chosen — unconfirmed, requires /clarify or a spike before implementation.~~ — **Partially resolved via /clarify (2026-10-10):** the candidate field is narrowed to purpose-built node-graph libraries (e.g. Cytoscape.js, drawflow.js-class) rather than general 2D canvas-drawing libraries (Konva.js, Fabric.js-class) — this matches the MVP's own node-positioning + pan/zoom + node-to-node-connection scope, which explicitly excludes freehand drawing. Final library selection still requires a dedicated spike before `/definition`.

[ASSUMPTION] The chosen library can be served using the exact same zero-build pattern mermaid uses (real npm dependency, served via a dedicated runtime-read route, loaded via a plain `<script src>`, no webpack/bundler step) — unconfirmed. This is the single biggest technical risk: not every canvas library ships a single pre-built browser bundle the way mermaid does, and this platform has no build step to fall back on if one doesn't.

~~[ASSUMPTION] Node positions (x/y coordinates) can be persisted on the existing stage/mapping tables under ADR-025's tenant-scoped Postgres model, without a new canvas-specific schema — unconfirmed.~~ — **Resolved via /clarify (2026-10-10):** new `position_x`/`position_y` columns on `customer_journey_stages` directly, not a generic `(entity_type, entity_id)` positions table. "Reusable" in this discovery refers to the client rendering module (confirmed in MVP Scope), not the persistence schema — a generic table would pre-solve a multi-entity reuse problem that doesn't exist yet (no second concrete use case is in scope), repeating the speculative-generality pattern `2026-08-29-diagram-validation-and-types` already warned against. If a second real use case materialises later, extracting a generic table from this simple start is a low-risk, mechanical refactor at that point.

~~[ASSUMPTION] A genuinely free-form canvas can meet WCAG 2.1 AA (`product/constraints.md` #9, already a hard constraint on the journey canvas) — unconfirmed, and this is a materially harder bar than the linear list's up/down-button keyboard alternative. Arbitrary 2D positioning via keyboard-only operation is an industry-wide unsolved UX problem (even Miro itself has known gaps here) — may force a reduced MVP (e.g. snap-to-grid) or an explicit RISK-ACCEPT.~~ — **Resolved via /clarify (2026-10-10):** the MVP's keyboard-accessible path is snap-to-grid discrete movement — arrow keys move a selected node by a fixed step, same family as `ep1-s4`'s up/down reorder buttons. Mouse/touch interaction remains truly freehand (continuous drag, no snapping). This is a committed MVP interaction model, not a deferred RISK-ACCEPT.

**Risk:** The original journey discovery already named "the visual journey canvas" as this platform's single highest-complexity UI risk — and a free-form canvas is a harder problem than the linear-list-with-reorder that got built instead. Revisiting it doesn't make that risk smaller.

**Risk:** If this canvas doesn't clearly outperform the current list view in practice, the platform will have spent a new runtime dependency and real build effort on a second "canvas" concept that sits unused next to the simpler one — repeating, not fixing, the exact gap this discovery itself started from.

## Directional Success Indicators

**Spatial layout actually used:** Baseline: 0 (doesn't exist today). Target: on the journey this feature ships against, at least one stage node is manually repositioned away from its default/auto-placed position within 2 weeks of release. Measured via: comparing persisted node coordinates against their initial auto-layout coordinates. If this never happens, that's a direct signal the spatial canvas isn't adding anything the linear list didn't already provide.

**Zero-build integration holds:** Baseline: `[UNKNOWN BASELINE]` — not yet confirmed whether a purpose-built node-graph library (Cytoscape.js / drawflow.js-class, per the clarified library candidate field) can be served via the exact mermaid/csd-s1 pattern. Target: confirmed working end-to-end before `/definition` begins. Measured via: a dedicated `/spike` (this remains the one unresolved assumption after `/clarify` — see Assumptions and Risks).

**Operator CX judgment vs. the list view** — the explicit gate the operator named for whether subsequent replace-the-other-surfaces features get scoped at all. Baseline: N/A (nothing to compare yet). Target: after real use, the operator judges the canvas as genuinely better for journey mapping than the list it replaced — not just "fine" or "different." Measured via: a direct, recorded judgment (`decisions.md` or a short retro note) after a defined period of real use, not an inferred usage-count proxy — this platform has one primary practitioner, so an honest qualitative call is more meaningful here than a simulated adoption-rate metric.

## Constraints

- **Npm dependency constraint explicitly relaxed for this feature, with a named precedent.** `product/tech-stack.md`'s "Zero new npm dependencies" principle is relaxed specifically to allow a canvas-rendering library, on the explicit condition that it follows the same integration pattern already proven for mermaid (`csd-s1`): real `package.json` dependency, served via a dedicated runtime-read route (no bundler/build step), loaded client-side via a plain `<script src>`. This is a precedent-following relaxation, not an open-ended one — a library that requires a build pipeline this platform doesn't have is out.
- **Multi-tenancy (ADR-025)** — node positions and any new canvas data are tenant-scoped exactly like the rest of the journey feature.
- **WCAG 2.1 AA** (`product/constraints.md` #9) — still a hard constraint; resolved via `/clarify` to a snap-to-grid discrete keyboard movement model (see Assumptions and Risks), with true freehand drag reserved for mouse/touch.
- **No new persistent/hosted service dependency** (`product/constraints.md` #11) — the canvas must run on this platform's existing standard web-server infrastructure; unaffected by the npm relaxation above (that's about a client-side library, not infra).
- **Design system reference** (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`) must be consulted before introducing new UI components, same as every other story in this platform.

## Contributors

- Hamish King — Platform Owner — 2026-10-10

## Reviewers

- [Pending]

## Approved By

[Pending]

---

## Clarification log

[2026-10-10] Clarified via /clarify:
- Q: Should the library search narrow toward purpose-built node-graph libraries rather than general 2D canvas-drawing libraries?  A: Yes (A) — narrow to purpose-built node-graph libraries (Cytoscape.js / drawflow.js-class) now; final pick still via a dedicated spike before `/definition`.
- Q: What keyboard interaction model should the MVP target for WCAG 2.1 AA compliance?  A: Snap-to-grid discrete keyboard movement (A) — arrow keys move a node by a fixed step, same family as `ep1-s4`'s up/down reorder buttons; mouse/touch stays truly freehand.
- Q: Should node x/y coordinates live as new columns on `customer_journey_stages`, or in a separate, generic positions table?  A: New columns on `customer_journey_stages` directly (A) — "reusable" refers to the client module, not the schema; a generic table is deferred until a second real use case exists.

**One assumption remains genuinely unresolved** (not a `/clarify`-type judgment call — requires actual investigation): whether the chosen node-graph library can be served via the exact zero-build mermaid/csd-s1 pattern (real npm dependency, runtime-read route, plain `<script src>`, no bundler). Routed to a dedicated `/spike`, to run before `/definition` begins (see Directional Success Indicators — "Zero-build integration holds").

---

**Next step:** Human review and approval → /benefit-metric (after the zero-build feasibility spike)

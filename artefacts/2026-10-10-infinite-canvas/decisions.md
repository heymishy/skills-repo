# Decision Log: infinite-canvas

**Feature:** Infinite Canvas — Reusable Free-Form Spatial Canvas Primitive
**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Last updated:** 2026-10-10 (ADR-001 added)

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-10-10 | ASSUMPTION | /clarify**
**Decision:** The canvas library candidate field is narrowed to purpose-built node-graph libraries (e.g. Cytoscape.js, drawflow.js-class) rather than general 2D canvas-drawing libraries (Konva.js, Fabric.js-class). Final library selection still requires a dedicated spike before `/definition`.
**Alternatives considered:** (B) Leave the field fully open, let the spike evaluate both graph-libs and generic canvas-libs from scratch. (C) Name a specific library now and skip the spike entirely.
**Rationale:** The MVP's own scope is specifically node positioning + pan/zoom + node-to-node connections, with freehand drawing explicitly out of scope — exactly the use case purpose-built graph libraries are built for. A general canvas-drawing library would need node/edge interaction built on top from scratch, a materially larger implementation surface for no corresponding benefit given the MVP's own bounds.
**Made by:** Hamish King — Platform Owner (via /clarify)
**Revisit trigger:** If the dedicated spike finds no purpose-built graph-library candidate passes the zero-build serving test (see next entry), re-open the field to general canvas-drawing libraries.
---

**2026-10-10 | ASSUMPTION | /clarify**
**Decision:** The MVP's keyboard-accessible interaction model for WCAG 2.1 AA is snap-to-grid discrete movement — arrow keys move a selected node by a fixed step. Mouse/touch interaction remains truly freehand (continuous drag, no snapping).
**Alternatives considered:** (B) Attempt full continuous freehand dragging via keyboard too. (C) RISK-ACCEPT: ship mouse/touch-only for MVP, defer keyboard freehand as a known gap.
**Rationale:** Continuous freehand positioning via keyboard-only operation is an industry-wide unsolved UX problem (even Miro has known accessibility gaps here). Snap-to-grid extends `ep1-s4`'s own proven, already-shipped, already-accessible up/down-reorder precedent to two dimensions, rather than attempting a materially harder, novel interaction pattern with no existing precedent in this codebase to build on.
**Made by:** Hamish King — Platform Owner (via /clarify)
**Revisit trigger:** If an accessibility audit or real keyboard-only usage finds snap-to-grid itself fails AA in practice, or if the eventually-chosen library makes continuous keyboard drag genuinely tractable without custom implementation.
---

**2026-10-10 | ASSUMPTION | /clarify**
**Decision:** Node x/y coordinates are persisted as new `position_x`/`position_y` columns directly on `customer_journey_stages`, not in a separate generic `(entity_type, entity_id)`-keyed positions table.
**Alternatives considered:** (B) A separate generic `canvas_node_positions` table keyed by entity type and id — more work now, reusable across future entities without a schema migration. (C) Defer the schema decision to `/definition`, once the chosen library's own data model is known.
**Rationale:** No second concrete use case for the canvas primitive exists yet — this discovery's own MVP scope names exactly one real application (journeys). Building a generic polymorphic positions table now pre-solves a multi-entity reuse problem that doesn't exist yet, repeating the exact speculative-generality pattern `2026-08-29-diagram-validation-and-types` already identified and warned against for this platform. "Reusable" in this discovery refers to the client rendering module (confirmed in MVP Scope), not the persistence schema. If a second real use case materialises later, extracting a generic table from this simple start is a low-risk, mechanical refactor at that point — the reverse (discovering an early generic abstraction was wrong) wastes more.
**Made by:** Hamish King — Platform Owner (via /clarify, on Claude's recommendation)
**Revisit trigger:** When a second real, concrete use case for the canvas primitive (e.g. the `definition-canvas` story-map replacement) is named and scoped as its own feature.
---

**2026-10-10 | RISK-ACCEPT | /review (ic-s3)**
**Decision:** Ship `ic-s3` (canvas pan/zoom) without a keyboard-accessible path for panning/zooming the canvas view itself. `/clarify`'s own committed WCAG 2.1 AA interaction model covers keyboard-accessible *node movement* only (`ic-s4`), not canvas *navigation*.
**Alternatives considered:** (B) Add a committed AC for keyboard-based pan/zoom (e.g. `+`/`-` to zoom, arrow keys with no node selected to pan) as new scope within `ic-s3`. (C) Defer resolution entirely with no tracked record (rejected — this is exactly the "silently accepted gap" pattern this feature has been explicitly avoiding throughout discovery/clarify/review).
**Rationale:** Adding keyboard pan/zoom now would be new scope nobody has actually decided on — it was not named in discovery, not resolved in `/clarify`, and inventing it unilaterally during review/fix-up would be exactly the kind of silent scope expansion `/definition`'s own scope-discipline is meant to prevent. The honest, correct resolution is to accept the gap explicitly, with a real owner and trigger, rather than quietly add untested new interaction scope or quietly ignore a real accessibility question.
**Made by:** Hamish King — Platform Owner (acknowledged in chat; review finding `ic-s3-review-1.md` 1-M1)
**Revisit trigger:** If a keyboard-only operator reports being unable to reach nodes outside the default viewport on a real journey, or before this feature's own DoD if the operator wants it resolved rather than carried forward.
---

**2026-10-10 | RISK-ACCEPT | /definition-of-ready (W4, all 4 stories)**
**Decision:** Proceed to DoR sign-off without a separate formal domain-expert review pass of the 4 verification scripts (`ic-s1` through `ic-s4`) — the operator has been actively reviewing and confirming artefact content throughout this session's own discovery → clarify → decisions → definition → review → test-plan chain.
**Alternatives considered:** (B) Hold DoR and schedule a dedicated verification-script review pass before proceeding.
**Rationale:** The operator's continuous, substantive engagement with this feature's artefacts across every prior stage already constitutes informal domain-expert review in substance, if not in the formal "reviewed the verification script specifically" sense W4 checks for. Formally blocking on a redundant separate pass adds process overhead without a corresponding quality signal.
**Made by:** Hamish King — Platform Owner (acknowledged in chat)
**Revisit trigger:** If a post-merge smoke test using these verification scripts finds a scenario that doesn't match real behaviour, revisit whether a dedicated pre-code review pass should become mandatory for this feature's remaining stories.
---

---

## Architecture Decision Records

### ADR-001: Use drawflow.js, served via the mermaid/csd-s1 zero-build pattern, as the infinite-canvas rendering library

**Status:** Accepted
**Date:** 2026-10-10
**Decided by:** Hamish King — Platform Owner, on the recommendation of `artefacts/2026-10-10-infinite-canvas/spikes/zero-build-canvas-library-outcome.md`

#### Context

The infinite-canvas feature needs a client-side rendering library for free-form node positioning, canvas pan/zoom, and interactive node-to-node connections — explicitly relaxing this platform's "zero new npm dependencies" principle (`product/tech-stack.md`), on the condition that whatever is chosen follows the one already-proven precedent for doing this safely: mermaid is already a real `package.json` dependency (`csd-s1`), served via a dedicated server route that reads its pre-built bundle straight from `node_modules` at request time (no bundler/build step), loaded client-side via a plain `<script src>`. `/clarify` narrowed the candidate field to purpose-built node-graph libraries (Cytoscape.js or a drawflow.js-class alternative) but explicitly deferred the final choice to a dedicated spike, since it requires real investigation, not a judgment call.

#### Options considered

| Option | Pros | Cons |
|--------|------|------|
| **drawflow.js (chosen)** | Smaller bundle (46KB) than Cytoscape (425KB); zero dependencies at every layer (confirmed via direct `package.json`/`dist` inspection); interactive node-to-node connection-drawing is a core, built-in feature — confirmed working first-try in a live browser test with zero custom code; passes the zero-build serving pattern cleanly (proper UMD bundle) | Zoom requires `Ctrl+scroll` by the library's own design, not plain scroll (minor, confirmed, not a blocker); has its own small CSS asset (`drawflow.min.css`) that also needs a zero-build serving route; keyboard interaction model not yet tested |
| Cytoscape.js | Clean, zero-dependency core; mature, widely used for graph visualization; free node-drag and pan/zoom work immediately out of the box | Interactive connection-drawing is NOT built in — the standard extension, `cytoscape-edgehandles`, has 2 dependencies (`lodash.memoize`, `lodash.throttle`) published as CommonJS-only with no browser UMD build, so it fails the zero-build test as published; a custom connection-drawing implementation against Cytoscape core was attempted directly in the spike and hit real, unresolved event-ordering friction across 4 separate attempts |
| Build a fully custom canvas (no library) | Zero third-party footprint at all | Reimplements a well-solved problem from scratch; the same spike's 4 failed custom-connection-drawing attempts against Cytoscape core directly demonstrate this is real, non-trivial engineering effort, not a quick win |

#### Decision

Use **drawflow.js** as the infinite-canvas feature's rendering library, served via a dedicated server route mirroring `src/web-ui/routes/public.js`'s `handleMermaidAsset()` exactly (read `node_modules/drawflow/dist/drawflow.min.js` — and its companion `drawflow.min.css` — at request time, gzip + in-memory cache, serve via a `/vendor/` route, load client-side via a plain `<script src>`). The primary reason: the MVP's own scope (node positioning + pan/zoom + interactive node-to-node connections, sharpened explicitly during `/clarify` as the "Miro-like" bar) is drawflow's literal purpose-built use case, not Cytoscape's — Cytoscape treats connection-drawing as a secondary, plugin-delegated concern, and that plugin doesn't meet this platform's own zero-build bar. Confirmed by direct, equally rigorous side-by-side testing of both libraries in a real browser (see spike outcome artefact), not by reading documentation alone.

#### Consequences

**Becomes easier:** interactive node-to-node connection UX ships essentially for free, with zero custom gesture-handling code to write or maintain — a direct contrast to the Cytoscape path, which would have required either adopting a dependency that fails this platform's own npm-relaxation condition, or writing and maintaining bespoke drag-to-connect interaction code. `/definition` can write concrete ACs against drawflow's own documented, built-in API (`addConnection`, `addNode`, `connectionCreated` event, etc.) rather than an interaction model that doesn't exist yet.

**Becomes harder / more constrained:** the feature is now specifically tied to drawflow's own interaction conventions (e.g. `Ctrl+scroll` to zoom, not plain scroll) — `/definition`'s ACs and any user-facing instructions must reflect this exactly, not assume a generic "scroll to zoom" convention. The feature also now owns a second static asset (the CSS file) requiring its own zero-build serving route, a small but real addition to `server.js`'s own routing table.

**Off the table:** adopting Cytoscape.js (or its `cytoscape-edgehandles` extension) for this feature without either a build step this platform doesn't have, or writing bespoke connection-drawing interaction code from scratch — this spike's own direct investigation found Cytoscape's extension path concretely fails the zero-build condition as published, not merely "untested."

#### Revisit trigger

If drawflow's own keyboard interaction model (tested during `/definition`, against the already-committed snap-to-grid WCAG AA decision above) proves incompatible or requires disproportionate custom work to retrofit; or if a future feature needs genuine multi-user real-time collaborative editing (explicitly out of scope for this MVP) and drawflow's own architecture turns out not to support that direction well; or if `cytoscape-edgehandles` (or an equivalent) ever ships a proper UMD build of its own dependencies, reopening the Cytoscape path as a live alternative.

---

**2026-10-11 | RISK-ACCEPT | /verify-completion (ic-s2)**
**Decision:** Open `ic-s2`'s draft PR without a real-browser confirmation that the Customer experience and Delivery tabs still render exactly as before (zero regression check), one of two items this story's own implementation plan named as a mandatory pre-PR check mirroring `ic-s1`'s own established verify-completion convention.
**Alternatives considered:** (B) Block `/branch-complete` indefinitely until the Chrome browser extension reconnects. (C) Silently check the box without real evidence (rejected outright — exactly the kind of unsupported completion claim `/verify-completion`'s own "Iron Law" exists to prevent).
**Rationale:** The Chrome browser extension disconnected mid-session, coinciding with an account re-authentication event, and did not reconnect after two retry attempts. All five sub-items of the companion Canvas-tab live browser check (drag mechanism, real `nodeMoved`→PATCH, reload persistence, NULL-position auto-layout fallback, failure toast) were already completed and passed before the disconnect — only this specific sibling-view regression check was still pending. Two independent pieces of real evidence reduce the residual risk to LOW rather than leaving it a bare assumption: (1) this story's entire diff (`git log master..HEAD` reviewed) is scoped to the stages `SELECT` query, `drawflowNodesScript`, and the drawflow init `<script>` block inside `handleGetJourneyCanvas` — it does not touch `stagesHtml`, `viewToggleHtml`, or either sibling view's own annotation-rendering functions at all; (2) `tests/check-ep2-s3-delivery-view.js` and `tests/check-ep3-s1-customer-experience-view.js`, the existing regression suites for both sibling views, both ran clean in this session's own full-suite confirmation (735/735) after every `ic-s2` commit landed.
**Made by:** Claude (session verify-completion pass) — operator acknowledgement pending at PR review, not yet obtained; flagged explicitly in the PR description per this entry.
**Revisit trigger:** Before this story's own `/definition-of-done` (post-merge), or immediately once the Chrome browser extension reconnects, whichever comes first — a 2-minute manual check (open a seeded journey, click Customer experience then Delivery, confirm unchanged) closes this out completely.

**RESOLVED 2026-10-11:** Chrome reconnected after the operator restarted both Chrome and Claude Code. Performed the deferred check against the same real `handleGetJourneyCanvas`/`handlePatchJourneyStagePosition` production-handler live-server technique used for the original Canvas-tab check: loaded a 2-stage journey (one with `moment_of_truth`, populated `emotion`/`pain_points`/`opportunities`/touchpoint data), clicked Customer experience then Delivery. Both rendered correctly and unchanged — emotion chips, pain points, opportunities, and the moment-of-truth badge all present on Customer experience; "No features mapped" correctly shown on Delivery for both stages; zero console errors across all three view switches. The residual-risk assessment in this entry's own Rationale (diff never touches either sibling view's own rendering code) is now confirmed directly, not just inferred from the diff. No further action needed.

---

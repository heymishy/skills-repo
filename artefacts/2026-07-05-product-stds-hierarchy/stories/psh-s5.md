## Story: psh-s5 — Product context injection into skill sessions

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e3-context-inheritance.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **developer/engineer**,
I want **every skill session I start for a product-associated feature to automatically receive that product's context (mission, tech-stack, constraints, roadmap, architecture-guardrails) in its system prompt**,
So that **I don't have to manually maintain per-feature context files and the AI agent has accurate product-level context for every session — moving M2 (context injection rate) to 100%**.

## Benefit Linkage

**Metric moved:** M2 (Product context injection rate) — this story is the sole driver of M2. 100% injection rate means every skill session for a product-associated feature includes the five context files in the system prompt. Zero failures are acceptable.
**How:** `buildSystemPrompt` is extended to query the `products` table for context files via an injectable adapter, then inject them as named sections before the SKILL.md content. An automated CI test asserts that a product-associated session receives all five sections.

## Architecture Constraints

- **ADR-022 (Option B):** Context injection happens at session initialisation (`buildSystemPrompt` call), not across sessions. No session-spanning state. Each skill stage gets a fresh injection from the current product context.
- **ADR-023 (B-iii handoff / DB canonicity):** Product context content must be retrieved from Postgres (the DB-canonical record), not from any in-memory or session-cached copy. This ensures trace validation and the injected content are always in sync.
- **D37 (injectable adapter rule):** The product context lookup (`getProductContext(productId)`) must be implemented as an injectable adapter. Stub default must throw: `throw new Error('Adapter not wired: productContext. Call setProductContextAdapter() before use.')`. Production wiring is a separate task in the implementation plan (AC5).
- **ADR-011 (artefact-first):** Any new `src/` module (e.g. `product-context-adapter.js`) requires this story artefact to exist first.
- **ADR-024 (Journey GET shape):** This story does not modify the journey GET response shape. If `productId` is read from the session/journey object, the existing shape fields must remain intact.
- **Node.js CommonJS only. No new npm dependencies.**

## Dependencies

- **Upstream:** psh-s1 (products table and journeys.product_id FK), psh-s4 (journeys have product_id set at creation time, so sessions can resolve context from product_id).
- **Downstream:** psh-s10 (standards injection follows the same adapter pattern established here).

## Acceptance Criteria

**AC1:** Given a feature (journey) has a `product_id` set and the associated product has all five context files populated, when a skill session is initiated for that feature, then the system prompt assembled by `buildSystemPrompt` includes the following five named sections, in order, before the SKILL.md content:
- `## Product Context — Mission`
- `## Product Context — Tech Stack`
- `## Product Context — Constraints`
- `## Product Context — Roadmap`
- `## Product Context — Architecture Guardrails`
Each section contains the corresponding content from the product's Postgres record.

**AC2 (DB canonicity — ADR-023):** Given product context is injected into the system prompt, when the content is assembled, then the value is retrieved via `getProductContext(productId)` from Postgres — not from `session.artefactContent`, `session.productContext`, or any other in-memory store. The adapter call is the sole source.

**AC3 (no-product graceful fallback):** Given a feature has `product_id = NULL` (unassociated journey, e.g. pre-migration Default product with empty context), when a skill session is initiated, then the session proceeds normally. No product context sections are injected, no error is thrown. The existing global `product/` directory content is used as before.

**AC4 (D37 stub-throws):** Given the product context adapter module is loaded but `setProductContextAdapter` has not been called, when `getProductContext(productId)` is invoked directly, then it throws `Error('Adapter not wired: productContext. Call setProductContextAdapter() before use.')`.

**AC5 (D37 production wiring):** Given `server.js` calls `setProductContextAdapter` with a real Postgres implementation before the HTTP server accepts connections, when any skill session is initiated for a product-associated feature, then the real DB query executes and no stub-throws error is raised. Verified by a startup smoke check or wiring test.

**AC6 (concurrent session safety):** Given two concurrent skill sessions are initiated for features in different products (product A and product B), when both sessions resolve their product context, then session A's system prompt contains product A's context and session B's contains product B's context — no cross-session contamination.

## Out of Scope

- Editing product context files via any UI — post-MVP.
- Context injection for the Default product (empty context files) — the Default product has null/empty context; AC3 handles graceful fallback.
- Per-skill override of which context sections are injected — post-MVP.
- Standards injection — psh-s10 (separate story, separate adapter, same pattern).

## NFRs

- **Performance:** Product context DB lookup adds at most one Postgres round-trip per session initialisation. No caching required in MVP.
- **Correctness:** If the DB query fails (connection error), `buildSystemPrompt` must propagate the error — do not silently fall back to an empty context injection. The session must not start with incomplete context without an error signal.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

`buildSystemPrompt` extension, one new injectable adapter, one DB query. The D37 wiring requirement adds a second task but the logic per task is well-defined.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Upstream dependencies (psh-s1, psh-s4) confirmed complete
- [ ] NFRs identified
- [ ] D37 production wiring named as separate implementation task
- [ ] Human oversight level confirmed from parent epic (Medium)

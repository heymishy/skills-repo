## Story: psh-s10 — Standards injection into skill sessions

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e5-standards-library.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **developer/engineer**,
I want **every skill session for a product-associated feature to automatically include that product's active standards and patterns in the system prompt**,
So that **the AI agent has access to my team's coding guides and reference patterns without manual injection — moving M4b (standards injection rate) to 100%**.

## Benefit Linkage

**Metric moved:** M4b (Standards injection rate) — this story is the sole driver of M4b. 100% injection rate means every session for a product with ≥1 active standard receives those standards in the system prompt. Zero failures are acceptable.
**How:** `buildSystemPrompt` is extended with a second injectable adapter (`getActiveStandards(productId, tenantId)`) that returns all active standards for the product — product-level standards, plus org-level standards not opted out. Each standard becomes a named section in the system prompt after the product context sections (psh-s5) and before the SKILL.md content.

## Architecture Constraints

- **ADR-022 (Option B):** Standards injection, like product context injection (psh-s5), happens at session initialisation. Not across sessions.
- **ADR-023 (B-iii / DB canonicity):** Standards content must be retrieved from Postgres via the adapter — not from in-memory session state.
- **D37 (injectable adapter rule):** The standards lookup (`getActiveStandards(productId, tenantId)`) must be implemented as an injectable adapter. Stub default must throw: `throw new Error('Adapter not wired: standards. Call setStandardsAdapter() before use.')`. Production wiring is a separate task in the implementation plan (AC5).
- **ADR-011 (artefact-first):** Any new `src/` module for standards injection requires this artefact to exist first.
- **Ordering:** Standards sections are injected after product context sections (established in psh-s5) and before the SKILL.md system prompt content.
- **Node.js CommonJS only. No new npm dependencies.**

## Dependencies

- **Upstream:** psh-s5 (product context injection establishes the `buildSystemPrompt` extension pattern this story follows), psh-s9 (opt-out mechanism provides the correct active-standards query shape: product-level + org-level minus opt-outs).
- **Downstream:** None within this feature.

## Acceptance Criteria

**AC1:** Given a feature (journey) is associated with a product that has ≥1 active standard (product-level or applicable org-level standard not opted out), when a skill session is initiated, then the system prompt includes a `## Standards and Patterns` section. Each active standard appears as a sub-section `### [standard name]` with its content. Standards are injected after the Product Context sections (psh-s5) and before the SKILL.md content.

**AC2 (opt-out exclusion):** Given a product has opted out of an org-level standard (psh-s9 opt-out row exists), when a skill session is initiated for a feature in that product, then the opted-out standard is absent from the `## Standards and Patterns` section. Only standards not opted out are included.

**AC3 (no standards — no section):** Given a feature's product has no active standards (no product-level standards, all org-level standards opted out, or no standards at all), when a skill session is initiated, then the `## Standards and Patterns` section is omitted from the system prompt entirely — not included as an empty section.

**AC4 (D37 stub-throws):** Given the standards adapter module is loaded but `setStandardsAdapter` has not been called, when `getActiveStandards(productId, tenantId)` is invoked directly, then it throws `Error('Adapter not wired: standards. Call setStandardsAdapter() before use.')`.

**AC5 (D37 production wiring):** Given `server.js` calls `setStandardsAdapter` with a real Postgres implementation before the HTTP server accepts connections, when any skill session is initiated for a product-associated feature with active standards, then the real DB query executes and no stub-throws error is raised. Verified by startup smoke check or wiring test.

**AC6 (injection ordering):** Given a product has both product context files (psh-s5) and active standards (this story), when a skill session is initiated, then the system prompt section order is: (1) Product Context sections, (2) Standards and Patterns sections, (3) SKILL.md content. No standards content appears before product context sections.

## Out of Scope

- Per-skill override of which standards are injected — post-MVP; all active standards are injected for every skill session.
- Ordering/prioritisation of multiple standards within the section — first-created order is sufficient for MVP.
- Standards content truncation for large standards files — post-MVP; if a standard is too large to fit in the context budget, that is a monitoring concern, not an MVP implementation concern.

## NFRs

- **Performance:** Standards DB query adds at most one Postgres round-trip per session initialisation (can be combined with the product context query in a single call if the implementation allows, but a separate query is acceptable for MVP).
- **Correctness:** If the standards DB query fails, `buildSystemPrompt` must propagate the error — do not silently omit standards injection without an error signal.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

Follows the same adapter + `buildSystemPrompt` extension pattern as psh-s5. Main addition: the opt-out exclusion query (AC2) and the no-section-if-empty rule (AC3).

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Upstream dependencies (psh-s5, psh-s9) confirmed complete
- [ ] NFRs identified
- [ ] D37 production wiring named as separate implementation task
- [ ] Human oversight level confirmed from parent epic (Medium)

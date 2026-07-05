## Story: psh-s3 — Product creation flow (hybrid form + AI draft + review)

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e2-product-creation-navigation.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **product owner/operator**,
I want **to create a product by filling a short form, having the platform draft my product context files, and reviewing them inline before confirming**,
So that **I have a named product with well-formed mission, tech-stack, constraints, roadmap, and architecture-guardrails files ready to inject into skill sessions — moving M1 (product setup completion rate) toward the ≥70% target**.

## Benefit Linkage

**Metric moved:** M1 (Product setup completion rate) — this story is the creation flow itself. The `product_created` PostHog event emitted here is what M1 measures. Solo plan enforcement (1 product max) is also part of this story.
**How:** An operator who completes the form, reviews the AI draft, and confirms creates a product. PostHog `product_created` event fires. M1 measures: did new accounts complete this flow in their first session?

## Architecture Constraints

- **ADR-011 (artefact-first):** Any new `src/` module (product creation route, AI draft handler) must be covered by this story artefact — the artefact must exist before code is written.
- **D37 (injectable adapter rule):** The AI draft generation call (Anthropic API) must be implemented as an injectable adapter. Stub default must throw: `throw new Error('Adapter not wired: generateProductDraft. Call setGenerateProductDraft() before use.')`. Production wiring (`setGenerateProductDraft(realFn)`) must be a separate task in the implementation plan. An explicit AC (AC8) verifies production wiring in `server.js`.
- **MC-SEC-01 (no raw innerHTML):** Product name, description, and AI-generated content rendered in the review panel must use safe text DOM methods or server-side HTML escaping. No raw innerHTML injection of user-supplied or AI-generated content.
- **Path traversal guard (ougl):** If any product context file is written to disk during creation, the resolved absolute path must be validated against the allowed base directory. Return HTTP 400 if the guard fails; do not write the file.
- **CLAUDE.md (req.session.accessToken canonical):** Any route touching GitHub auth must use `req.session.accessToken`, never `req.session.token`.
- **Node.js CommonJS only. No new npm dependencies.**

## Dependencies

- **Upstream:** psh-s1 (products table must exist), psh-s2 (migration complete — operator's existing journeys are associated with Default product).
- **Downstream:** psh-s4 (navigation requires at least one product to exist).

## Acceptance Criteria

**AC1:** Given an authenticated operator is on the new-product page, when they submit the creation form with the following fields — `name` (required, non-empty string), `techStack` (optional text), `constraints` (optional text) — then the server sends these fields to the AI to generate drafts of five context files: `mission.md`, `roadmap.md`, `tech-stack.md`, `constraints.md`, and `architecture-guardrails.md`. Submitting with only `name` populated (other fields empty) is valid and must succeed.

**AC2:** Given the AI returns the five draft context files, when the response is received, then the operator sees each file's draft content in an editable inline review panel (one panel per file, clearly labelled). The operator can edit any draft before confirming.

**AC3:** Given the operator confirms the product (with or without edits to the drafts), when the confirmation is submitted, then: (a) a row is inserted into the `products` table with `tenant_id` from `req.session.tenantId`, the product name, and the five context file contents stored as product metadata; (b) HTTP 201 is returned with the new `product_id`; (c) a `product_created` PostHog event is emitted with properties `productId`, `tenantId`, `hasContextFiles: true`.

**AC4 (solo plan enforcement):** Given an authenticated operator whose `tenantId` already has one product in the `products` table (any name), when they attempt to create a second product (POST to the creation endpoint), then the server returns HTTP 403 with a response body containing `"reason": "plan_limit"` and `"upgradeRequired": true`. No product is created. The UI shows "Upgrade to a team plan to create multiple products."

**AC5 (team plan no limit):** Given an authenticated operator whose tenantId is on a team or enterprise plan, when they create their third product, then the product is created successfully (HTTP 201). No plan-limit block applies.

**AC6 (input sanitisation):** Given the product creation form accepts a `name` field, when the operator submits a name containing `<script>alert(1)</script>` or other HTML, then the stored `name` value is the raw text string (HTML-escaped), and the rendered product name in any subsequent UI view does not execute script or inject raw HTML.

**AC7 (path traversal guard):** Given the creation flow writes any context file to disk at a path derived from the product name or form input, when the resolved absolute path does not start with the permitted base directory (e.g. contains `../` traversal), then the server returns HTTP 400 and no file is written to disk.

**AC8 (D37 production wiring):** Given `server.js` calls `setGenerateProductDraft` with a real Anthropic implementation before the HTTP server accepts connections, when a product creation form is submitted, then the real AI call executes and no stub-throws error is raised. Verified by a startup smoke check or wiring test.

## Out of Scope

- Reference file upload (upload existing architecture docs) — deferred to a later increment.
- Editing product context files after creation via any UI — post-MVP.
- Product deletion — post-MVP.
- The `architecture-guardrails.md` draft is generated but treated as a fifth context file with the same create-once flow; per-product guardrails editing UI is post-MVP.

## NFRs

- **Performance:** AI draft generation should complete within 30 seconds. If the AI call times out, the server returns a graceful error; the form is not lost.
- **Security:** Product name and context file content are HTML-escaped before any DOM insertion. `req.session.accessToken` is used for all authenticated writes.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 3
**Scope stability:** Stable

New creation route, new AI draft generation injectable adapter, inline editable review panel, solo plan enforcement, path traversal guard, PostHog event emission, production wiring. Multi-step flow with several ACs that interact.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Upstream dependencies (psh-s1, psh-s2) confirmed complete
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic (Medium)
- [ ] D37 production wiring is a named separate task in the implementation plan

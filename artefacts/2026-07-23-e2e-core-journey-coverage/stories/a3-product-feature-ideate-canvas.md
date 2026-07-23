## Story: Drive product + first-feature creation via rough-idea/ideate, assert canvas and artefact persistence

**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md

## User Story

As a **Hamish King (Founder/Operator)**,
I want to **verify that a newly paid/trialing staging user can create a product, fill in its details, create a first feature via the "rough idea" path into `/ideate`, and see the `/ideate` canvas render and update as the session progresses, with artefacts genuinely saved to disk/Postgres**,
So that **a regression anywhere in product/feature creation or the `/ideate` canvas rendering pipeline — the kind of silently-broken creation path this session actually shipped (jrf-s2) — is caught by CI before merge**.

## Benefit Linkage

**Metric moved:** E2E CI gate on core signup/billing/creation journeys (m1)
**How:** This story covers the largest single surface of Scenario A (product creation, feature creation, and the `/ideate` canvas) — it directly re-creates the conditions under which this session's real journey-registration bug went undetected, closing that specific gap in the metric's target.

## Architecture Constraints

- **ADR-024:** `GET /api/journey/:id` response shape (`turns`, `stages`, `completedStages`, `stage`, `ownerId`, `activeSkill`) is the canonical contract — any assertion this spec makes against journey state must check these required fields, not a partial shape.
- **ADR-022:** multi-skill journey orchestration is one session per skill stage with structured artefact handoff — the spec must not assume a single persistent session spans product creation through `/ideate`; it should expect (and assert against) the real session-per-stage model.
- None else identified beyond A1/A2's dependencies — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** A2 (Stripe test-mode plan selection) — an active plan is assumed before product/feature creation is permitted.
- **Downstream:** A4 (session close/resume) drives this same session further; A5 (CI gate wiring) depends on this story's assertions existing and passing reliably.

## Acceptance Criteria

**AC1:** Given an authenticated, plan-active staging user (from A1/A2), When the spec creates a new product and fills in its details form, Then the product appears in the products list with the submitted details persisted (confirmed via a subsequent page load, not just the immediate post-submit DOM state).

**AC2:** Given the created product, When the spec creates a first feature choosing the "rough idea" path, Then the flow routes into `/ideate` and an `/ideate` session is created and reachable at its own URL.

**AC3:** Given an active `/ideate` session running with `MOCK_LLM_GATEWAY=true` (per the ARCH decision in decisions.md, 2026-07-23 — staging E2E uses the existing mock-LLM-gateway, not the real model, matching discovery's original constraint), When the spec drives 2 turns of the ideation conversation using a mock fixture configured to always include a canvas marker, Then the visual canvas DOM contains rendered card/block elements corresponding to the fixture content, and the canvas updates (new elements appear) between turn 1 and turn 2 — not a static/frozen canvas.

<!-- [Revised 2026-07-23, ARCH decision]: originally called the real model with a bounded-retry/manual-fallback gap (matching inc5's precedent) because model-marker emission is non-deterministic. Switching to the mock-LLM-gateway (deterministic fixture output) removes that non-determinism entirely — the gap type in the test plan should be updated from Untestable-by-nature to fully covered. -->

<!-- [1-M1, resolved 2026-07-23]: loosened from a strict "must update within 2 turns" assertion, which risked CI flakiness unrelated to real regressions since the model's canvas-marker emission can't be guaranteed deterministic by a code-level test — matching this repo's own inc5 precedent for this exact AC shape. -->

**AC4:** Given the `/ideate` session has produced canvas content, When the spec reads the underlying artefact from disk (or via the API that reads it from disk, per this repo's disk-canonicity convention), Then the artefact content matches what was rendered in the canvas — proving the save-to-disk path, not just the in-memory session state, is exercised.

## Out of Scope

- The formed-idea path and `/discovery`-through-DoR outer loop — that is Epic B (B1)
- Testing every possible `/ideate` canvas interaction (drag-reorder, manual card editing) — only that it renders and updates from model-driven content
- Multi-product or multi-feature creation in a single test run — one product, one feature, per discovery's MVP scope

## NFRs

- **Performance:** Canvas DOM update after a turn completes within the SSE stream's own completion signal plus a bounded Playwright wait (no arbitrary long polling).
- **Security:** No production data is used; the product/feature names created by this spec are clearly tagged (e.g. an `e2e-test-` prefix) to support B3's cleanup story.
- **Accessibility:** Not applicable — this story is test infrastructure, not user-facing UI.
- **Audit:** None identified beyond existing artefact-save logging.

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

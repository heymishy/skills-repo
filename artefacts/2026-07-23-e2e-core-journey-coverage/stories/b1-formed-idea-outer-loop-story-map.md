## Story: Drive the formed-idea outer loop to DoR and assert the /definition story-map canvas, close/resume mid-SSE

**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-b-formed-idea-journey-e2e-full-gate-data-hygiene.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md

## User Story

As a **Hamish King (Founder/Operator)**,
I want to **verify that a user with a formed feature idea can drive a single scenario through `/discovery` → `/benefit-metric` → `/definition` → `/review` → `/test-plan` → `/definition-of-ready` entirely on real staging, see the `/definition` story-map canvas render correctly, close the browser mid-session, and reopen it with full state restored**,
So that **a regression anywhere in the outer-loop skill-session chain or the story-map canvas rendering is caught by CI before merge, moving the E2E CI gate metric (m1) toward its full target**.

## Benefit Linkage

**Metric moved:** E2E CI gate on core signup/billing/creation journeys (m1)
**How:** This story delivers Scenario B in full — the second of the two journeys the metric's target requires — and re-uses the exact session-resume mechanism (`wusl-s1`/`wusl-s2`) this session hardened, giving it a second, structurally distinct regression guard (a multi-stage skill chain, not a single `/ideate` session).

## Architecture Constraints

- **ADR-022:** multi-skill journey orchestration is one session per skill stage with structured artefact handoff — the spec must drive through `/discovery`, `/benefit-metric`, `/definition`, `/review`, `/test-plan`, `/definition-of-ready` as distinct sessions with artefact handoff between them, not assume one persistent session spans all six.
- **ADR-023:** handoff schema between journey stages is artefact content injection (B-iii) — assertions about context continuity between stages (e.g. that `/definition` reflects the approved discovery's MVP scope) should verify this via the injected artefact content, matching how the real system actually passes context.
- **ADR-024:** `GET /api/journey/:id` response shape contract applies to any journey-state assertion this spec makes.
- Guardrail (this session's own hardening): the same `mergeRedisSessionData` denylist-restore mechanism from A4 applies here — this story's resume assertion should include a story-map-specific field (not one of A4's `/ideate`-specific fields) to prove restoration is structurally complete for this distinct skill session type too, not only for `/ideate`.

## Dependencies

- **Upstream:** A1 (staging-safe auth stub) — this story's user must be authenticated on staging via the same mechanism A1 establishes. Does not depend on A2/A3/A4 (billing/product/ideate): this spec creates its own minimal product/tenant context independently, so it can run standalone (e.g. `npx playwright test b1`) with no run-order coupling to A3's spec file — a deliberate choice to keep specs independent, matching Playwright's own testing model.
- **Downstream:** B2 (CI gate wiring) depends on this story's spec existing and passing reliably.

## Acceptance Criteria

**AC1:** Given an authenticated staging user with a product to attach a feature to, When the spec creates a feature via the "formed idea" path and drives it through `/discovery` to Approved status, Then the discovery artefact is saved and its content is readable via the API/UI reflecting Approved status.

**AC2:** Given the approved discovery, When the spec continues through `/benefit-metric` and into `/definition`, Then epics and stories are written and saved, and the `/definition` story-map canvas DOM renders visual elements corresponding to at least the epics/stories just created (not an empty or placeholder canvas).

**AC3:** Given the story-map canvas has rendered content, When the spec continues driving through `/review` → `/test-plan` → `/definition-of-ready`, Then the DoR stage is reached and its sign-off state is reflected in the session (e.g. a visible DoR status field), completing the scenario's stated end point.

**AC4:** Given an active `/definition` session with story-map canvas content, When the spec closes the browser mid-SSE-stream and reopens the same session, Then the story-map canvas re-renders with the same epics/stories, the turn history matches, and a story-map-specific session field (distinct from A4's `canvasBlocks`) is confirmed restored — proving the denylist-restore mechanism generalizes across skill session types, not just `/ideate`.

## Out of Scope

- The new-user signup/billing/`/ideate` path — that is Epic A
- Driving past `/definition-of-ready` into the coding/inner loop or DoD — Scenario B stops at DoR sign-off per discovery's MVP scope
- Testing multiple different story-map layouts or epic/story counts — one representative single scenario, per discovery

## NFRs

- **Performance:** Each outer-loop stage transition (session creation, artefact handoff) completes within a bounded Playwright wait per stage — no single stage's wait exceeds the Playwright default action timeout multiplied by a small, documented factor.
- **Security:** The resumed session must only be reachable by the same authenticated user/tenant who created it (ADR-025 tenant scoping), same as A4.
- **Accessibility:** Not applicable — this story is test infrastructure, not user-facing UI.
- **Audit:** None identified beyond existing outer-loop artefact and session audit logging.

## Complexity Rating

**Rating:** 3
**Scope stability:** Stable

<!-- Rated 3 (not 2) because this story drives six distinct skill-session stages with artefact handoff between each, and the story-map canvas rendering assertion has not been exercised by any existing E2E spec — genuinely more unknowns than A3/A4's single-session /ideate case. -->

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

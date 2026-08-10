## Story: Lock in "resuming a completed stage shows diagrams, artefact, and conversation together" with a real browser E2E test

**Epic reference:** None — short-track (test-coverage gap, operator-requested)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator who confirmed live that resuming a completed feature stage now shows its diagrams, artefact, and the conversation that generated them together**,
I want **that exact scenario locked in by a real, browser-driven E2E test**,
So that **a future regression in any part of this combined flow is caught automatically in CI, not by me noticing it live again**.

## Benefit Linkage

**Metric moved:** Direct test-coverage fix (short-track, no formal benefit-metric artefact) — the operator explicitly asked, after confirming `drh-s1` + `rht-s1` fixed the resume-history view live on staging: "ensure that playwright e2e covers that scenario in future runs." Both fixes shipped this session with only unit-level test coverage (mocked pools, seeded turns) — neither has a real, browser-driven E2E test proving the combined scenario (diagram + artefact + conversation, all rendering together after a genuine SSE-streamed turn) actually works end to end through a real browser.

**How:** Adds a new Playwright spec that drives a real journey through the mock-gateway-backed local harness (`NODE_ENV=test`, no real staging cost), completes a `/definition` stage's turn via the real streaming chat UI (the same code path a real operator's browser exercises), then navigates to that stage's resume/history view and asserts all three pieces — diagram, artefact, conversation — render together, plus that the view stays genuinely read-only. Reuses `design-definition-canvas-render.spec.js`'s own already-proven `driveJourneyToStage`/`useIsolatedTenant`/`submitTurnViaRealChatUiAndWaitForStreamToFinish` helpers (duplicated per that file's own stated "no cross-file run-order coupling" convention) rather than inventing a new fixture-driving approach.

## Architecture Constraints

- **Runs entirely against the local `NODE_ENV=test` harness** — no real staging, no real credits, no real LLM cost, matching `design-definition-canvas-render.spec.js`'s own precedent (the closest existing spec to this scenario).
- **Reuse the existing helper functions verbatim** rather than importing them cross-file or inventing a third variant — matches this repo's own established convention for this class of spec.
- **No change to any production code** — this story is pure test-coverage addition.

## Dependencies

- **Upstream:** `drh-s1` (diagram-resume fix, merged), `rht-s1` (trailing-conversation-turn fix, merged) — both already shipped; this story adds the missing E2E coverage for the combined scenario neither story's own test plan included.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a real journey driven through discovery/benefit-metric/design via the mock gateway, and `/definition`'s own turn completed through the real streaming chat UI, When the operator navigates to that stage's resume/history view, Then the diagram from that turn's CANVAS-JSON marker renders as a real mermaid SVG.

**AC2:** Given the same resumed view, Then the real artefact content from that same turn also renders.

**AC3:** Given the same resumed view, Then the skill's own final message (the same turn that produced the diagram and artefact) renders in the conversation panel — not silently dropped.

**AC4:** Given the same resumed view, Then no live interactive input/submit control is present — the view is genuinely read-only.

## Out of Scope

- **Any change to `drh-s1`/`rht-s1`'s own production code** — both already correct; this story only adds test coverage.
- **A real-staging variant of this spec** — the local, mock-gateway-backed version is sufficient to catch a regression in the combined rendering logic; a real-staging confirmation was already performed live by the operator this session.

## NFRs

- **Correctness:** Closes a real test-coverage gap on a scenario the operator explicitly called out as a "key differentiator" to protect against regression.

## Complexity Rating

**Rating:** 1 — a new E2E spec only, reusing an already-proven driving pattern from an existing file; no production code changes.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

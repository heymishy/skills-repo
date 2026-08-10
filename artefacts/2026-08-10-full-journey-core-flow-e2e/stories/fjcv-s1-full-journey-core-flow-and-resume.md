## Story: E2E coverage confirming both journey entry points reach definition-of-ready complete and every major stage resumes correctly

**Epic reference:** None — short-track (test-coverage addition, requested directly by the operator after live-verifying the isc-s1/isc-s2 /ideate mock-gateway fixes)
**Discovery reference:** None — short-track skips discovery; scope is the operator's own request below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator relying on the mock-gateway test harness to validate the full pipeline without spending real LLM tokens**,
I want **automated E2E coverage confirming a newly created feature reaches definition-of-ready complete via both entry points (rough idea -> /ideate first, and formed idea -> /discovery first), and that every major stage along the way is resumable with its real artefact and conversation intact**,
So that **a future regression in either entry path, or in the stage-resume rendering mechanism, is caught automatically instead of relying on manual Chrome-driven spot checks like the ones this session just did by hand**.

## Benefit Linkage

**Metric moved:** Direct test-coverage gap (short-track, no formal benefit-metric artefact) — this session manually, live-verified via Chrome that (a) isc-s1/isc-s2 fixed /ideate's mock-gateway lens cycling, and (b) resuming a completed stage shows its artefact and conversation correctly (rdac-s1's own scope, for a single stage). Neither of those manual/single-stage checks is automated for the *combined* full-pipeline flow: a brand-new feature actually reaching definition-of-ready complete via each of the two real entry points, with resumability confirmed at multiple stages along the way — this story closes that gap.

**How:** A new E2E spec (`tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js`) drives two full journeys end-to-end through the mock-gateway-backed local harness: one starting at `/ideate` (rough idea), one starting at `/discovery` (formed idea). Both are driven via the same JSON `/turn` + `/gate-confirm` endpoints `bri-s3.2`'s own spec already proves work for the discovery-first path — reused (duplicated, not imported, per this repo's file-isolation convention) and extended with an ideate-driving helper plus resume-view assertions `bri-s3.2` does not itself cover.

## Architecture Constraints

- **Reuses, does not modify, `bri-s3.2`'s own proven helpers** — `signUpAndCompleteOnboarding`, `createFirstProduct`, `submitTurn`, the `FEATURE_LEVEL_STAGES`/`PER_STORY_SEQ` sequencing — duplicated into the new spec file per this repo's established file-isolation convention (see `design-definition-canvas-render.spec.js`, `rdac-s1`'s own spec).
- **New `driveIdeateToCompletion` helper accounts for the JSON-path/streaming-path turnIndex asymmetry** discovered while building this story: the JSON `/turn` endpoint (`htmlSubmitTurn`) pushes every user turn to `session.turns` unconditionally, unlike the real streaming chat UI's `handlePostTurnStreamHtml` (which skips pushing the auto-fired first turn's own synthetic content via its `_isInitialTurn` guard — the exact mechanism isc-s2 fixed for). This means the JSON path's real turnIndex sequence for `/ideate` is 0,2,4,6,8 — not isc-s2's streaming-path sequence of 0,1,3,5,7. Both resolve to correct, progressive content because isc-s1's fixture fills each "padding" slot with a duplicate of the preceding meaningful entry — confirmed empirically by this story's own local test runs (both paths pass), not merely assumed.
- **Resume-view assertions use the `request` context (plain HTTP GET), not a real browser** — `GET /journey/:id/stage/:stageName` server-renders artefact + conversation text regardless of how the turn was originally submitted (JSON or streaming), so this is sufficient to prove the persistence/resume-rendering path without needing Chrome/DOM interaction. Verifying the mermaid-SVG *client-side render* specifically (a real browser requirement) was already done separately and conclusively by `rdac-s1`'s own spec — not re-duplicated here.
- **No new production code** — pure test-file addition.

## Dependencies

- **Upstream:** `isc-s1`/`isc-s2` (merged) — this story's ideate-first path directly exercises their fixture. `bri-s3.2` (merged) — this story's discovery-first path reuses its proven sequencing logic.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a brand-new feature journey started via `/ideate` (rough idea), When driven through ideate -> discovery -> benefit-metric -> design -> definition -> review -> test-plan -> definition-of-ready, Then it reaches `/journey/:id/complete` with a visible "Journey complete" / "Ready for implementation" pass state.

**AC2:** Given a brand-new feature journey started via `/discovery` (formed idea), When driven through discovery -> benefit-metric -> design -> definition -> review -> test-plan -> definition-of-ready, Then it reaches `/journey/:id/complete` with the same visible pass state.

**AC3:** Given either journey from AC1/AC2, When `GET /journey/:id/stage/:stageName` is called for at least 3 representative completed stages (ideate, discovery, definition-of-ready for AC1; discovery, definition, definition-of-ready for AC2), Then each returns 200 and its HTML contains both that stage's real artefact content and the real conversation text that produced it.

**AC4:** Given either journey, When the real-LLM-call counter (`GET /test/real-llm-call-count`) is compared before and after the full run, Then it is unchanged — zero real Anthropic/Copilot API calls throughout.

## Out of Scope

- **Re-verifying the mermaid-SVG client-side diagram render** — already conclusively proven by `rdac-s1`'s own real-browser spec at the `definition` stage; this story's resume checks are server-rendered-text assertions only, not a duplicate real-browser diagram check.
- **A real-staging variant of this spec** — not needed; the underlying mechanisms (mock gateway, resume-view rendering) are already covered by real-staging checks elsewhere (Scenario A/B), and this spec's own purpose is full-pipeline breadth, not staging-environment confirmation.
- **Every single stage's resumability** (e.g. `benefit-metric`, `design`, `review`, `test-plan` individually) — 3 representative checkpoints per journey (including the always-present `ideate`/`discovery` entry stage and the final `definition-of-ready`) give genuine confidence in the resume mechanism without the runtime cost of asserting all 7-8 stages individually; the underlying resume-view code path is stage-agnostic (reads from the same durable `getTurnsForStage` store for every stage), so per-stage duplication would mostly re-prove the same mechanism.

## NFRs

- **Runtime:** Both tests complete in well under 1 second of actual turn-processing time each (mock gateway, no real network calls) — verified locally at ~4-9s total for the whole 3-test file, including 2x repeat runs confirming zero flakiness.
- **Test isolation:** Each test run creates its own fresh signup/product/journey (unique `e2e-test-fjcv-s1-` prefixed email) — no shared state with other specs.

## Complexity Rating

**Rating:** 2 — some ambiguity going in (the JSON-path/streaming-path turnIndex asymmetry was discovered, not anticipated, while building this story), now well-understood and confirmed via passing local runs.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

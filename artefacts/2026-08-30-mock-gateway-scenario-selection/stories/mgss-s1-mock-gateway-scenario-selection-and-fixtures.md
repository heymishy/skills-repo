## Story: Let an operator select any mock-gateway scenario when creating a feature, and close two fixture gaps

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** None — short-track (no discovery artefact by design)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **operator manually verifying a story's ACs against staging (e.g. via Chrome)**,
I want to **choose a specific mock-gateway scenario (not just the default "success") when creating a new feature/session**,
So that **I can deterministically trigger fixtures like `diagram-showcase` through the live UI, instead of being limited to whatever the default "success" fixture happens to contain.**

## Benefit Linkage

**Metric moved:** None — direct developer-tooling improvement, short-track (no formal benefit-metric artefact)
**How:** N/A (short-track)

## Architecture Constraints

- Reuse the existing `e2eForceFailStage` mechanism's shape exactly (`routes/journey.js`'s `_mockScenarioForStage`, threaded from `body.e2eForceFailStage` in `handlePostJourney`) rather than inventing a second, parallel override mechanism. Generalize `_mockScenarioForStage` to accept a new `journey.e2eMockScenario` field that, when set, applies to every stage of the journey (not just one named stage) and takes priority over the existing single-stage `e2eForceFailStage`/`'failure'` behavior, which is left otherwise unchanged.
- Gated identically to the existing mechanism: only honored when `_mockLlmGateway.isMockGatewayEnabled()` is true. Never has any effect in production (inherits the existing hard override in `isMockGatewayEnabled()`).
- No visible UI change (per operator decision, 2026-08-30) — this is a URL query-param / POST-body override, the same class of hidden E2E-only hook `e2eForceFailStage` already is, not a new form control. The query param (`?mockScenario=<name>` on `/journey?new=1`) is read server-side in `handleGetJourney` and rendered as a single hidden `<input>` inside the existing new-feature `<form>`, so it survives the page's own POST submission without any visible field.
- **Scoped to the canonical `/journey` creation flow only** (`handleGetJourney` + `handlePostJourney`, `routes/journey.js`). `routes/products.js`'s `handlePostProductFeature` is a separate, deliberately-duplicated journey-creation entry point (per `pnfc-s1`'s own decisions.md precedent, which rejected unifying these two paths) with no existing `e2eForceFailStage` support at all today — extending it too is out of scope for this story; see Out of Scope.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the mock gateway is enabled (`isMockGatewayEnabled()` true), When a new feature/journey is created via `/journey` (either with `e2eMockScenario=<name>` directly in the create-journey POST body, or by loading `/journey?new=1&mockScenario=<name>` so the hidden field carries it through the visible form's own submission), Then every stage session created for that journey that has a `<stage>.<name>.json` fixture file uses that fixture — not the default `"success"` fixture.

**AC2:** Given the mock gateway is enabled and a journey was created with `e2eMockScenario` set, When a stage is reached that has NO fixture file for that scenario name, Then the existing "No fixture found" error behavior fires exactly as it does today for any other unrecognized `(stage, scenarioName)` pair — no new silent fallback is introduced.

**AC3:** Given the mock gateway is disabled (real environment, or mock gateway off), When a create-journey POST body includes `e2eMockScenario`, Then it is silently ignored — identical to how `e2eForceFailStage` already behaves today when the mock gateway is off.

**AC4:** Given `design.diagram-showcase.json` and `definition.diagram-showcase.json`, When either fixture's response is parsed for CANVAS-JSON markers, Then a valid `sequence`-type marker is present in addition to the existing marker(s) already in that fixture — closing the gap where S5's new diagram type had no showcase coverage.

**AC5:** Given the mock-gateway fixture set, When `clarify.success.json` and `clarify.failure.json` are requested via `getMockResponse('clarify', 'mock', 'success'|'failure')`, Then both return a well-formed fixture response shaped like `/clarify`'s real behavior (a Q&A exchange culminating in a completion message for `success`; an entry-condition failure message for `failure`) — closing the one stage with no fixture coverage at all.

## Out of Scope

- `routes/products.js`'s `handlePostProductFeature` (the "New feature" panel on a product's own page) — a separate, deliberately-duplicated journey-creation path with no `e2eForceFailStage` support today either. Extending it to also support `e2eMockScenario` is a natural, bounded follow-up but is not included here, to keep this story's diff confined to the one path that already had the precedent mechanism (`e2eForceFailStage`) to generalize.
- A `clarify.diagram-showcase` (or similarly diagram-bearing) fixture — `/clarify`'s own `SKILL.md` never emits a `CANVAS-JSON` marker in real usage (confirmed by inspection: zero matches), so a diagram-bearing clarify fixture would fabricate behavior the real skill doesn't have. Revisit only if `/clarify` itself ever gains diagram-marker support.
- A visible "Mock scenario" dropdown in the New Feature UI modal — operator explicitly chose the hidden-field approach (2026-08-30); revisit only if this hidden mechanism turns out to be used often enough to warrant discoverability.
- Extending `ideate.diagram-showcase.json` with a `sequence` example — `/ideate`'s own `SKILL.md` (`inc5` canvas markers) does not offer a `system-architecture`/`sequence` marker option in its own instruction text; only `/design` and `/definition` do. Adding one to `ideate`'s fixture would be equally fabricated.

## NFRs

- **Performance:** Not applicable — no new model/network calls; only fixture-file selection logic changes.
- **Security:** The new `e2eMockScenario` override is gated behind the identical `isMockGatewayEnabled()` check `e2eForceFailStage` already uses, which itself hard-fails to disabled under `NODE_ENV=production` regardless of any other flag. No new attack surface beyond what `e2eForceFailStage` already has today.
- **Accessibility:** Not applicable — no UI change.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session

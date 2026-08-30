## Story: Fall back to 'success' per-stage when a journey-wide mock scenario has no fixture for that stage

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** None — short-track (no discovery artefact by design)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **operator manually verifying ACs against staging via a mocked journey (mgss-s1)**,
I want to **have a journey-wide `e2eMockScenario` override (e.g. `diagram-showcase`) transparently fall back to the normal `success` fixture on any stage that has no matching fixture file**,
So that **a normal outer-loop journey (discovery → benefit-metric → design → ...) can actually reach a later stage like `design` without failing on an earlier stage like `discovery` that was never meant to have a `diagram-showcase` variant.**

## Benefit Linkage

**Metric moved:** None — direct correctness fix to `mgss-s1` (2026-08-30, PR #797), short-track
**How:** N/A (short-track)

## Bug found (live, via Chrome verification)

While using `mgss-s1`'s own new mechanism for its first real purpose — walking `?mockScenario=diagram-showcase` on `/journey?new=1` to reach `s5-sequence-diagram-type`'s new `sequence` marker on the `design` stage — the very first stage (`discovery`) failed with a generic "Model error — please try again." `discovery.diagram-showcase.json` does not exist (only `ideate`, `design`, and `definition` have a `diagram-showcase` fixture), so `_mockScenarioForStage` applied the override unconditionally, and `getMockResponse` threw "No fixture found" before the journey could ever progress past its mandatory first stage.

This is a defect against `mgss-s1`'s own AC1 wording ("every stage session created for that journey **that has** a `<stage>.<name>.json` fixture file uses that fixture") — the implementation applied the override to every stage unconditionally instead of only stages that actually have a matching fixture, contradicting the AC's own qualifier.

## Architecture Constraints

- Add a new `hasFixture(stage, scenarioName)` export to `src/web-ui/modules/mock-llm-gateway.js` — a pure existence check (`fs.existsSync`), no throw, mirroring `_loadFixtureFile`'s own file-naming convention exactly.
- Change `journey.js`'s `_mockScenarioForStage` to consult `hasFixture` before applying `journey.e2eMockScenario`: apply it only when a fixture exists for `(stageName, journey.e2eMockScenario)`; otherwise fall through to `undefined` (→ the caller's own `'success'` default), exactly as if no override were set for that stage.
- Do **not** change `getMockResponse`'s own throw-on-unrecognized-scenario behavior (mgss-s1's AC2) — that remains the correct, unmodified safety net for a scenario name that is a genuine typo (has no fixture for ANY stage at all). This story only changes how `_mockScenarioForStage` *decides whether to apply* an override per stage, not what happens if a caller explicitly requests a truly nonexistent scenario.
- `e2eForceFailStage`'s own existing single-stage behavior is unaffected — it already names one specific stage and `'failure'` fixtures exist for every stage that supports it.

## Dependencies

- **Upstream:** mgss-s1 (2026-08-30-mock-gateway-scenario-selection, merged PR #797) — this story corrects a defect in it.
- **Downstream:** Unblocks the deferred live verification of `s5-sequence-diagram-type`'s AC1/AC2.

## Acceptance Criteria

**AC1:** Given a journey with `e2eMockScenario: 'diagram-showcase'` set, When the `discovery` stage session is created (no `discovery.diagram-showcase.json` fixture exists), Then the session uses the normal `'success'` fixture instead of throwing.

**AC2:** Given the same journey, When the `design` stage is later reached (a `design.diagram-showcase.json` fixture DOES exist), Then the session uses `'diagram-showcase'`, not `'success'` — the fallback in AC1 does not suppress the override where a matching fixture genuinely exists.

**AC3:** Given `getMockResponse` is called directly with a scenario name that has no fixture for ANY stage (a genuine typo), When that call is made, Then the existing "No fixture found" error still fires unmodified — this story does not weaken that safety net.

**AC4:** Given the existing `e2eForceFailStage` single-stage mechanism, When a journey uses it (without `e2eMockScenario`), Then its behavior is completely unchanged by this story.

## Out of Scope

- Adding `discovery.diagram-showcase.json` / `benefit-metric.diagram-showcase.json` / other pass-through fixtures — the fallback approach makes these unnecessary.
- Any change to `routes/products.js` (still out of scope, per `mgss-s1`'s own Out of Scope section).

## NFRs

- **Performance:** One additional `fs.existsSync` call per stage-session creation when `e2eMockScenario` is set — negligible, and only reachable when the mock gateway is enabled (never in production).
- **Security:** No change to the existing production hard-override; `hasFixture` is a pure read-only existence check with no new attack surface.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session

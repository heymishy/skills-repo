## Story: The mock LLM gateway returns the identical response on every turn, blocking multi-turn skill progression in mock mode

**Epic reference:** None — short-track (found via operator live validation on staging, expands the scope of the already-DoR-ready `mds-s1` story)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator or E2E spec exercising a skill session with the mock LLM gateway enabled**,
I want **each turn in a mock session to be able to return a different, scripted response**,
So that **I can actually progress through a multi-turn skill flow (e.g. /ideate's 4 lens types) in mock mode instead of getting stuck on the first turn's fixture forever**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — operator reported live on staging (2026-08-10): a mocked `/ideate` session only ever shows 1 lens/diagram type across an entire session, when the real skill (`skills/ideate/SKILL.md`) requires cycling through up to 4 distinct lens types plus diagrams before the stage can complete — "no way to proceed" once stuck. The operator also reported the `clarify` and `estimate` side-trip sub-skills are unreachable in mock mode; this is very likely the same root cause (a session that never advances past its first fixture never reaches whichever state those sub-steps gate on), though this should be confirmed during implementation rather than assumed.

**How:** Root-caused via direct source read. `mockLlmGateway.getMockResponse(stage, model, scenarioName)` (`src/web-ui/modules/mock-llm-gateway.js:265`) has no turn-index parameter — every turn in a mock session receives the exact same static fixture (`_defaultMockGatewayClient.getMockResponse`, line 230, loads one fixture file per `(stage, scenarioName)` and returns its single `response` field unconditionally). The call chain confirms this is a genuine, structural gap, not a wiring oversight: `skillTurnExecutor`/`skillTurnExecutorStream` (`src/modules/skill-turn-executor.js:611`/`652`) already receive the full conversation `history` as a parameter — it is right there in scope — but `_resolveMockGatewayResponse`/`_streamMockGatewayResponse` (lines 569/581) never receive or use it before calling `getMockResponse`. This means `mds-s1` (mock diagram-showcase fixtures, already DoR-ready) would NOT fix this on its own: a richer single fixture still returns identical content on turn 1 and turn 5, so multi-turn lens-cycling progression stays structurally blocked regardless of how many diagram types that one fixture contains. This story is the correct upstream dependency `mds-s1` needs.

## Architecture Constraints

- **`history` is already available at both mock call sites** (`skillTurnExecutor`'s and `skillTurnExecutorStream`'s own parameter) — this story threads it through as a turn index (`history.length`), it does not add any new parameter to the routes/session layer above `skill-turn-executor.js`. No change to `journey.js` or `skills.js`'s existing `scenarioName` resolution.
- **Fixture format stays backward compatible.** Today's fixture shape (`{ response, usage, model }`, one per `stage.scenarioName.json` file) is unchanged for every existing fixture. A NEW optional `responses` array field (`[{response, usage, model}, ...]`) is the opt-in multi-turn form — `_defaultMockGatewayClient.getMockResponse` uses `responses[Math.min(turnIndex, responses.length - 1)]` when `responses` is present, and falls back to the existing single-`response` behaviour otherwise. Once the scripted sequence is exhausted, the last entry repeats (graceful degradation, not an error) — a mock session run for more turns than scripted does not crash.
- **No existing fixture file is modified by this story** — this is purely the mechanism; `mds-s1` (or a future story) is responsible for writing an actual multi-turn `responses` array for `ideate.<scenario>.json`.

## Dependencies

- **Upstream:** None — this is itself the new upstream story `mds-s1` depends on.
- **Downstream:** `mds-s1` (mock diagram-showcase fixtures) should be revised to depend on this story before implementation — its diagram-variety content is only reachable end-to-end through a real multi-turn session once turn-index cycling exists.

## Acceptance Criteria

**AC1:** Given a fixture file with a `responses` array of N entries, When a mock session receives its Kth turn (K < N), Then `getMockResponse` returns `responses[K]`'s content — each turn in the scripted sequence gets a distinct response.

**AC2:** Given a fixture file with a `responses` array of N entries, When a mock session receives a turn beyond the scripted sequence (turn index ≥ N), Then `getMockResponse` returns the last entry (`responses[N-1]`) rather than throwing or returning undefined.

**AC3:** Given a fixture file using today's existing single-`response` shape (no `responses` array), When any turn is requested, Then behaviour is completely unchanged from today — the same response every time, byte-identical to current output. Every existing fixture file continues to work with zero modification.

**AC4:** Given `skillTurnExecutor` or `skillTurnExecutorStream` is called with a non-empty `history` array and mock routing active, When the mock gateway resolves the response, Then the turn index passed to `getMockResponse` reflects `history.length` (0 for the first turn, incrementing each subsequent turn) — confirmed via a spy/mock on `getMockResponse` asserting the exact index argument across a simulated 3-turn sequence.

**AC5:** Given the mock gateway is disabled (`isMockGatewayEnabled()` false), When either executor function runs, Then behaviour is completely unchanged — this story only affects the mock-routing branch, never the real-provider branches.

## Out of Scope

- **Writing the actual multi-turn `responses` fixture content for `/ideate` (or any other stage)** — this story ships the mechanism only; `mds-s1` (or a follow-up) writes the real scripted sequences.
- **The `clarify`/`estimate` side-trip unreachability** — named in Benefit Linkage as likely the same root cause, but not independently verified or fixed here. If it turns out to be a separate gating condition, it needs its own follow-up story.
- **Any change to `journey.js`'s or `skills.js`'s `scenarioName` resolution** — reused as-is; this story only changes what happens once `scenarioName` reaches the mock gateway.

## NFRs

- **Correctness:** Closes a real, operator-confirmed gap where mock-mode sessions cannot exercise any multi-turn skill flow beyond its first turn — directly undermines the mock gateway's whole purpose (letting E2E specs and operators exercise real flows without real LLM cost).
- **Backward compatibility:** Zero risk to the ~15+ existing fixture files across ideate/design/definition/discovery/etc. — the `responses` array is strictly additive and opt-in.

## Complexity Rating

**Rating:** 2 — the mechanism itself is small and well-understood (array indexing with a clamp), but it touches a shared, widely-used execution path (`skill-turn-executor.js`) used by every skill turn in the app, both mocked and real, so care is needed to keep the real-provider branches (untouched) and the backward-compatible single-response path exactly as they are today.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

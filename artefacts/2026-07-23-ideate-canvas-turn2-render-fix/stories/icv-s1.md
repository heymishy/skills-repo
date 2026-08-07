# Story: Stop /ideate's chat client from auto-firing an unbounded "continue" chain that duplicates canvas blocks and freezes the second user turn

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live-verified defect surfaced by a real, CI-blocking failure of `tests/e2e/a3-product-feature-ideate-canvas.spec.js`'s AC3 (Acceptance Criterion 3: "2 ideation turns against the deterministic mock fixture render and update the canvas") against real `wuce-staging`, on PR #568's "Scenario A E2E (staging)" CI gate (run 29996127983, job 89170114731).
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## User Story

As **any operator using the real `/ideate` chat UI (and any E2E story asserting on it, e.g. `a3-product-feature-ideate-canvas.spec.js`'s AC3 and `a4-ideate-session-resume.spec.js`'s AC2/AC3)**,
I want **each ideate turn to complete once the model's response finishes streaming — without the client silently deciding "the model hasn't finished" and firing a hidden follow-up turn — and I want the canvas panel to grow by exactly one new block per turn I actually send**,
So that **the input is never left disabled indefinitely, my real second (and any subsequent) message is not lost/ignored, and the canvas doesn't fill up with duplicate content I never asked for**.

## Benefit Linkage

**Metric moved:** This closes a CI-blocking regression on PR #568's "Scenario A E2E (staging)" gate (`.github/workflows` real-staging E2E job) — a3's AC3 is one of the CI-blocking assertions this gate enforces (per `a5-ci-gate-scenario-a-blocking`, PR #566). It also very likely fixes `a4-ideate-session-resume.spec.js`'s co-failing AC2/AC3 in the same CI run (that test's own `afterTurn1Count` baseline is built from the exact same runaway-loop-affected turn-1 canvas count) — reported separately in this story's `decisions.md`; a4 is being independently investigated by another agent in parallel per this session's own dispatch notes, so this story does not claim credit for a4 without independent confirmation.

**How:** Before this fix, real users of `/ideate` — and every E2E assertion built on top of it — could hit an unbounded, silent chain of hidden "continue" turns any time a genuine model response ended with a suggestion/statement instead of a literal "?" character (common, plausible phrasing for a conversational, non-artefact-generating skill). Each hidden turn duplicated canvas content and consumed a real turn-credit deduction, and the input stayed disabled until the loop happened to be interrupted by an external event — leaving the operator locked out of their own session. This fix makes each ideate turn behave as a single, complete, self-terminating exchange, matching how the feature was actually designed to work (per `buildSystemPrompt`, ideate has no "ARTEFACT GENERATION" instruction and is never expected to emit `---ARTEFACT-START---`/`---ARTEFACT-END---`  mid-conversation).

## Architecture Constraints

- **Client-side fix only, in `_renderChatPage`'s inline script (`src/web-ui/routes/skills.js`)** — no server-side route, executor, or mock-gateway change. `IS_IDEATE` is already computed and in scope in this exact script (used elsewhere for `updateDraftPanel`'s ideate-specific rendering branch); this fix reuses that same flag.
- **Do not remove or weaken the underlying auto-continue-on-no-"?" nudge for artefact-generating skills** (`discovery`, `definition`, `benefit-metric`, `test-plan`, `definition-of-ready`, `branch-setup`, `branch-complete`, `review`) — that nudge (added in commit `a10b32a3`, "artefact generation — no hold turns + auto-nudge client when model announces without asking") is correct and load-bearing for those skills, whose system prompt (`buildSystemPrompt`'s "ARTEFACT GENERATION" instruction) guarantees every turn ends in either the artefact or a literal question. The fix must be gated behind `!IS_IDEATE`, not a blanket removal.
- **No change to `mock-llm-gateway.js`, `skill-turn-executor.js`, or the `ideate.success.json` fixture.** The fixture's lack of a literal "?" and lack of `---ARTEFACT-START---`/`---ARTEFACT-END---` markers is a CORRECT reflection of real ideate turn shape (ideate is conversational, not artefact-producing per-turn) — this is a genuine client-code defect exposed by a correctly-authored fixture, not a fixture-authoring gap to be papered over.

## Dependencies

- **Upstream:** `srmw-s1` (PR #560, merged) — wired `{stage, scenarioName}` into `handlePostTurnStreamHtml` so `MOCK_LLM_GATEWAY=true` genuinely activates for the real chat UI's streaming turn endpoint. Without that fix, this story's bug would have been masked (every real turn would silently fall through to the real Anthropic provider, whose responses would very likely happen to contain a literal "?" on most turns, hiding this defect in the mocked E2E path — though NOT in real production, where the same risk exists any time a real turn doesn't end in "?").
- **Downstream:** None known. This does not block any other in-flight story.

## Acceptance Criteria

**AC1:** Given an `/ideate` session, When a turn's streamed response contains a canvas marker but no literal "?" character and no `---ARTEFACT-START---`/`---ARTEFACT-END---` markers (the exact shape of `tests/e2e/fixtures/llm-gateway/ideate.success.json`), Then the client fires exactly one executor/model call for that turn (no hidden "continue" turn is auto-fired), and the canvas panel renders exactly one new `.canvas-block` element.

**AC2:** Given the same single-turn scenario as AC1, When the turn's SSE stream finishes, Then the chat form's submit button is re-enabled (`disabled === false`) — proving the session is not left waiting on a "continue" turn that will never arrive.

**AC3:** Given an `/ideate` session that has already completed one turn (AC1/AC2's scenario), When the operator sends a genuine second message via the real chat form, Then exactly one additional executor/model call fires for that second turn (no further hidden continuations), and the canvas panel's block count grows to 2 — the canvas must never freeze at its turn-1 count once a real second turn has been sent.

**AC4:** Given a non-ideate, artefact-generating skill session (e.g. `discovery`) whose first turn's response has no "?" and no artefact marker (the exact shape `a10b32a3`'s nudge was written for), When that turn's SSE stream finishes, Then the client STILL auto-fires exactly one hidden "continue" turn, and if that continuation turn's response contains `---ARTEFACT-START---`/`---ARTEFACT-END---`, the session completes normally — proving this fix is `IS_IDEATE`-scoped, not a blanket regression of `a10b32a3`'s existing, correct behaviour for other skills.

**AC5:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

**AC6:** Given this fix is deployed to real `wuce-staging` (subject to no concurrent deploy in progress from another agent), When `tests/e2e/a3-product-feature-ideate-canvas.spec.js`'s AC3 is re-run against real staging, Then it passes — reported honestly as observed, including if deploy or re-verification could not be completed this session.

## Out of Scope

- Any change to `mock-llm-gateway.js`, `skill-turn-executor.js`, or any fixture file under `tests/e2e/fixtures/llm-gateway/`.
- Any change to the `a10b32a3` auto-continue nudge's behaviour for non-ideate skills.
- `a4-ideate-session-resume.spec.js`'s own AC2/AC3 failure — reported here as a likely-related, but independently-owned, co-failure (another agent may be investigating it in parallel per this session's dispatch notes); this story does not claim to fix it without independent re-verification.
- Any change to server-side turn routing, credits deduction, or SSE framing.
- A structural rework of the "how does the client know a turn is finished" contract across all skills (e.g. an explicit `turnComplete` event from the server) — that would be a larger, separately-scoped architectural change; this fix is the minimal, targeted correction for the specific defect found.

## NFRs

- **Performance:** Net positive — removes an unbounded chain of extra network round-trips and model/mock-gateway calls per ideate turn that previously had no upper bound.
- **Security:** None — no new attack surface; the fix only changes client-side control flow gated on an existing, server-computed, non-attacker-controlled flag (`IS_IDEATE`).
- **Cost:** Net positive — each unnecessary hidden "continue" turn previously deducted a real turn-credit (`TURN_CREDIT_COST`) and consumed real model tokens (in production, without the mock gateway) with no bound; this fix removes that unbounded cost for ideate sessions.
- **Accessibility:** Net positive — previously, a real user's input could be left permanently disabled after a single ideate exchange whenever the model's response didn't end in a literal "?"; this fix ensures the input reliably re-enables after every turn.
- **Audit:** Not applicable — no change to any audited code path.

## Complexity Rating

**Rating:** 1 — well understood; root cause independently confirmed via direct code inspection, the real CI failure log, and a reproducing/de-reproducing jsdom-driven regression test (RED before the fix, GREEN after). Fix is a single conditional gate (`!IS_IDEATE &&`) on an existing, already-computed flag in the exact function that needs it.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic

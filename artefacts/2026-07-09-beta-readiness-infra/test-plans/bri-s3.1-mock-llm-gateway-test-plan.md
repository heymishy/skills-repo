## Test Plan: Build the mock LLM gateway and fixture set

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.1-mock-llm-gateway.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

<!--
  Gap types:
    CSS-layout-dependent — relies on real browser rendering (drag-drop, getBoundingClientRect, CSS position)
    DOM-behaviour       — e2e-testable but not jsdom-compatible
    External-dependency — relies on third-party API/service unavailable in test
    Untestable-by-nature — inherently non-automatable (e.g. visual aesthetics, physical hardware)
-->

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Deterministic canned response for a given `(stage, model, scenarioName)` key | 1 | — | — | — | — | 🟢 |
| AC2 | ≥14 fixtures across 7 `gate-map.js` stages, ≥1 success + ≥1 failure per stage | — | 1 | — | — | — | 🟢 |
| AC3 | Regeneration script refreshes fixtures in place, no manual JSON hand-editing | — | 1 | — | — | External-dependency (partial — see Coverage gaps) | 🟡 |
| AC4 | `branch-setup`/`branch-complete` fixtures built and wired per confirmed invocation | — | 1 | — | — | — | 🟢 |
| AC5 | `@mocked` run makes zero real network calls to the GitHub Copilot Chat Completions API | — | 1 | Consumed by S3.2–S3.6's `@mocked` specs — no dedicated spec in this story | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Regeneration script's fidelity against true live dev/staging responses can only be stubbed in the automated test, not verified against the real API in CI | AC3 | External-dependency | The real dev/staging LLM response is only available outside the test process; the automated test exercises the script's file-write/logging behaviour against a stubbed "real response" fetcher, not a live call | Automated test covers the mechanical behaviour (file write, JSON validity, audit log). Periodic manual regeneration run against real staging, reviewed by operator, closes the fidelity gap — tracked as a recurring operational task, not a one-time DoD item |

---

## Test Data Strategy

**Source:** Fixtures (JSON, version-controlled)
**PCI/sensitivity in scope:** No
**Availability:** Available now — fixture directory is created by this story
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | One canned fixture keyed `(stage='discovery', model=<configured>, scenarioName='success')` | Fixtures | None | Also needs a second call with the same key to prove determinism |
| AC2 | Minimum 14 fixture files: 1 success + 1 failure per each of the 7 `gate-map.js` stages (discovery, benefit-metric, definition, test-plan, definition-of-ready, branch-setup, branch-complete) | Fixtures | None | Confirmed 2026-07-09 per `decisions.md` — all 7 stages invoke the gateway |
| AC3 | One stubbed "real dev/staging response" payload for the regeneration script to write into a fixture file | Mocked | None | Not a real network call — a stand-in payload shaped like a real Copilot Chat Completions response |
| AC4 | `branch-setup` and `branch-complete` fixture pairs, plus the `SLASH_CAPABILITY_MAP` entry in `routes/journey.js` for each | Fixtures + existing source | None | |
| AC5 | A full stage call driven through `skill-turn-executor.js` with `NODE_ENV=test` set | Fixtures + adapter wiring | None | |

### PCI / sensitivity constraints

None — fixture content is synthetic skill-turn output, not customer data.

### Gaps

None.

---

## Unit Tests

### Fixture key lookup is deterministic

- **Verifies:** AC1
- **Precondition:** Fixture directory contains a `discovery` / `success` fixture for the configured model.
- **Action:** Call the gateway's fixture-matching function twice with the identical `(stage, model, scenarioName)` key.
- **Expected result:** Both calls return byte-identical response objects; a differently-keyed call (e.g. `scenarioName='failure'`) returns a different fixture, not the same one.
- **Edge case:** Yes — an unrecognised key must throw a clear error, not return `undefined` or an empty object (mirrors the injectable-adapter stub-must-throw rule, D37).

### Injectable adapter default stub throws when not wired

- **Verifies:** D37 wiring precondition that underlies AC5 and the NFR-Security guard.
- **Precondition:** Mock gateway module freshly required, `setMockGatewayClient()` not yet called.
- **Action:** Invoke the default gateway client function.
- **Expected result:** Throws `Adapter not wired: mockGatewayClient. Call setMockGatewayClient() with a real implementation before use.` — never returns a silent/empty response.
- **Edge case:** No.

### Mock gateway responds within the performance budget

- **Verifies:** NFR — Performance (<50ms per call).
- **Precondition:** Gateway wired to the fixture-backed implementation.
- **Action:** Time 100 sequential calls against a mix of stage/scenario keys using `process.hrtime.bigint()`.
- **Expected result:** Every individual call resolves in under 50ms; no call involves a real network round-trip (asserted by absence of any `http`/`https` module call during the timed window).
- **Edge case:** No.

---

## Integration Tests

### Fixture inventory meets the 7-stage, 14-fixture minimum

- **Verifies:** AC2
- **Components involved:** Fixture directory (`tests/e2e/fixtures/llm-gateway/`), fixture-loading logic.
- **Precondition:** Fixture directory populated per this story's implementation.
- **Action:** Scan the fixture directory and group files by stage and scenario type (success/failure).
- **Expected result:** All 7 `gate-map.js` stages (discovery, benefit-metric, definition, test-plan, definition-of-ready, branch-setup, branch-complete) are present; each has at least one success-labelled and one failure/edge-case-labelled fixture; total fixture count is 14 or more.

### `branch-setup`/`branch-complete` are wired to the gateway via `SLASH_CAPABILITY_MAP`

- **Verifies:** AC4
- **Components involved:** `routes/journey.js` (`SLASH_CAPABILITY_MAP`), mock gateway adapter.
- **Precondition:** `NODE_ENV=test`, mock gateway wired.
- **Action:** Drive a `branch-setup` stage call and a `branch-complete` stage call through the same model-first skill-session mechanism used by every other stage.
- **Expected result:** Both calls resolve using their respective fixture responses; the call path is identical in shape to the other 5 stages' invocation path (same `SLASH_CAPABILITY_MAP` structure, `limitedOnWebUI: true` only limits git/bash/PR-creation capability, not the LLM call).

### Regeneration script refreshes a fixture in place without manual editing

- **Verifies:** AC3, NFR — Audit.
- **Components involved:** Regeneration script, fixture directory, audit log output.
- **Precondition:** An existing fixture file with known (stale) content; a stubbed "real dev/staging response" payload available to the script.
- **Action:** Run the regeneration script against the stubbed payload for one fixture.
- **Expected result:** The fixture file on disk is overwritten with the new payload's shape, remains valid JSON, requires no manual hand-editing; a log entry records which fixture changed and the source it was regenerated from.

### `@mocked` runs make zero real network calls

- **Verifies:** AC5, NFR — Security.
- **Components involved:** `skill-turn-executor.js`, mock gateway adapter, real HTTP client (spied, not invoked).
- **Precondition:** `NODE_ENV=test` set; mock gateway wired; a spy installed on the real Copilot Chat Completions HTTP client.
- **Action:** Drive one full stage call end-to-end through `skill-turn-executor.js`.
- **Expected result:** The spy records zero invocations of the real HTTP client; the stage call still completes successfully using the fixture response. A second run with `NODE_ENV` unset (or not `test`) confirms the mock gateway is not reachable — no configuration error can silently route production traffic through the mock.

---

## NFR Tests

### Mock gateway responds in under 50ms per call

- **NFR addressed:** Performance
- **Measurement method:** In-process timing across 100 calls (see Unit Tests above); no real network round-trip.
- **Pass threshold:** Every call under 50ms.
- **Tool:** Hand-rolled `assert`-based Node test.

### Mock gateway cannot be activated by production configuration error

- **NFR addressed:** Security
- **Measurement method:** Structural check mirroring the ADR-018 `NODE_ENV=test` guard pattern used by `tests/e2e/fixtures/auth.js` — assert the gateway throws/refuses when the test-mode flag is absent.
- **Pass threshold:** Zero activation paths outside explicit test configuration.
- **Tool:** Hand-rolled `assert`-based Node test.

### Fixture regeneration runs are logged

- **NFR addressed:** Audit
- **Measurement method:** Inspect the regeneration script's log output after a run — must name the fixture(s) changed and the source response.
- **Pass threshold:** One log entry per changed fixture, including old/new identifying detail.
- **Tool:** Hand-rolled `assert`-based Node test reading captured log output.

### Accessibility

Not applicable — confirmed with story owner (backend service, no UI surface of its own).

---

## Out of Scope for This Test Plan

- `@live` fixture equivalents (real API calls for nightly/pre-release runs) — this story's own Out of Scope; no gateway involved for `@live`.
- Fixture coverage for `implementation-plan`, `subagent-execution`, and `verify-completion` stages — out of scope per the story; only the 7 gated `gate-map.js` stages are covered.
- The Playwright specs that consume this gateway (S3.2–S3.6) — their own test plans cover their E2E assertions; this plan covers only the gateway's own backend logic.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Regeneration script's output fidelity against a true live dev/staging response | The automated test can only stub the "real response" source; no real network call is made in CI | Periodic manual regeneration run against real staging, reviewed by operator; any drift found is a defect, tracked outside this test plan's automated scope |

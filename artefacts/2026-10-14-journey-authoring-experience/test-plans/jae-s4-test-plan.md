## Test Plan: LLM-generated fallback suggestion for `customer_actions`/`pain_points` when the deterministic scan finds nothing

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s4.md
**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-ai-suggestions.md
**Review reference:** artefacts/2026-10-14-journey-authoring-experience/review/jae-s4-review-2.md (PASS, run 2)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-14
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on E2E detection (Step 3a)

No AC describes drag-and-drop, pointer coordinates, or on-screen position — every AC is a DOM-presence/absence check, a route-handler-call check, or an adapter-wiring/behaviour check. No AC is flagged CSS-layout-dependent; no E2E test is required.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Client calls the new `ai-suggestion` endpoint and renders a button when it returns a suggestion | 1 test | 1 test | — | — | — | 🟢 |
| AC1a | `handleGetJourneyCanvas` is unmodified; no AI call during canvas render | 1 test | — | — | — | — | 🟢 |
| AC2 | Deterministic suggestion takes priority; no LLM call for a field the scan already covered | 1 test | — | — | — | — | 🟢 |
| AC3 | Clicking the LLM suggestion fills the field without auto-saving | 1 test | — | — | — | — | 🟢 |
| AC4 | Two different stages produce observably different suggestion text (D37 behavioural wiring test) | — | 1 test | — | — | — | 🟢 |
| AC5 | LLM failure/empty response degrades silently — no button, no error shown | 1 test | — | — | — | — | 🟢 |
| AC6 | Unwired adapter throws the exact D37 stub error | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

No gaps.

---

## Test Data Strategy

**Source:** Synthetic — mocked route req/res, mocked/injected `generateAiFieldSuggestion` via `setGenerateAiFieldSuggestion` (the adapter's own D37 test seam), no real network call in any automated test.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC3 | A mocked `generateAiFieldSuggestion` returning a fixed suggestion string; a stage with the target field empty and no deterministic suggestion | Mock adapter + synthetic stage/panel state | None | |
| AC1a | Call `handleGetJourneyCanvas` with a mocked pool; assert the mocked `generateAiFieldSuggestion`/endpoint is never invoked | Synthetic | None | Confirms isolation, not just absence of a crash |
| AC2 | A stage with a deterministic suggestion already present (`jae-s3`'s own fixture shape) for the same field | Synthetic, reuses `jae-s3`'s own fixture convention | None | |
| AC4 | Two distinct stage contexts (different `stageName`/`journeyName`), a mocked adapter whose return value is a pure function of its input (not a constant) | Synthetic | None | The mock must vary its own output per input — a constant-output mock would pass even if the real wiring were broken, same trap named in CLAUDE.md's D37 note |
| AC5 | A mocked `generateAiFieldSuggestion` that rejects (simulated network error) and separately one that resolves to `''`/`null` | Synthetic | None | Two sub-cases in one test |
| AC6 | No mock installed — call the adapter's own default export directly | Real adapter module, unwired state | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): suggestion button renders when the endpoint returns a suggestion

- **Verifies:** AC1
- **Precondition:** Rendered stage panel, `customer_actions` empty, no deterministic suggestion, mocked `fetch` to `GET /journeys/stages/:id/ai-suggestion?field=customer_actions` resolving with `{suggestion: "..."}`
- **Action:** Open the panel
- **Expected result:** A suggestion button renders for `customer_actions`, visually distinguished from `jae-s3`'s own `sw-field-suggestion-btn` deterministic suggestions (distinct class or label text), clicking it fills the field
- **Edge case:** No

### AC1a (unit): `handleGetJourneyCanvas` never calls the AI adapter or endpoint

- **Verifies:** AC1a
- **Precondition:** Mocked pool, mocked `generateAiFieldSuggestion` instrumented to record calls
- **Action:** Call `handleGetJourneyCanvas` directly
- **Expected result:** The mocked `generateAiFieldSuggestion` has zero recorded calls — confirms the canvas render path is untouched by this story, not merely that the response still renders correctly
- **Edge case:** No

### AC2 (unit): deterministic suggestion suppresses the LLM fallback for the same field

- **Verifies:** AC2
- **Precondition:** A stage where `getFieldSuggestions` already returns a suggestion for `customer_actions`; mocked `fetch` for the `ai-suggestion` endpoint instrumented to record calls
- **Action:** Open the panel
- **Expected result:** The deterministic suggestion button renders; the `ai-suggestion` endpoint is never called for `customer_actions` — zero recorded calls
- **Edge case:** No

### AC3 (unit): clicking the LLM suggestion fills but does not save

- **Verifies:** AC3
- **Precondition:** LLM suggestion button rendered per AC1's own setup
- **Action:** Click the button
- **Expected result:** The field's textarea `value` is set to the exact suggestion text; no PATCH request sent until the field is blurred
- **Edge case:** No

### AC5 (unit): LLM failure and empty-response both degrade silently

- **Verifies:** AC5
- **Precondition:** Two sub-cases: (a) the `ai-suggestion` endpoint mock rejects/errors, (b) it resolves with `{suggestion: null}`
- **Action:** Open the panel for each sub-case
- **Expected result:** No suggestion button appears for either sub-case; no error message/toast is shown to the operator
- **Edge case:** Yes — both sub-cases are the edge case being verified

### AC6 (unit): unwired adapter throws the D37 stub error

- **Verifies:** AC6
- **Precondition:** Fresh `require` of `field-suggestion-ai.js` with no `setGenerateAiFieldSuggestion` call made
- **Action:** Call `generateAiFieldSuggestion(stageContext, 'customer_actions')`
- **Expected result:** Throws `Error('Adapter not wired: generateAiFieldSuggestion. Call setGenerateAiFieldSuggestion() with a real implementation before use.')` exactly
- **Edge case:** No

---

## Integration Tests

### AC4 (integration): two different stage contexts produce observably different suggestion text — D37 behavioural wiring test

- **Verifies:** AC4
- **Precondition:** `setGenerateAiFieldSuggestion` wired to a real route handler for the new `GET /journeys/stages/:stageId/ai-suggestion` endpoint, with the underlying `skillTurnExecutor` call itself mocked (not the adapter) to a function that derives its return text from its own input (e.g. echoes back the stage name it was given, not a constant) — this is the behavioural-correctness shape CLAUDE.md's D37 rule requires, not a "was a reference assigned" check
- **Action:** Call the route handler twice, once for a stage named "Evaluate options" and once for a stage named "Resolve a support ticket"
- **Expected result:** The two returned suggestion texts are different from each other AND each one is individually traceable to its own stage's input (not swapped or identical) — directly analogous to the `resolveRoleForTenant` fix precedent named in CLAUDE.md
- **Edge case:** No

---

## NFR Tests

### Performance — AC1a is the NFR test; no separate test needed

- **NFR addressed:** Performance (canvas render isolation)
- **Measurement method:** AC1a's own unit test (zero calls to the AI adapter during `handleGetJourneyCanvas`)
- **Pass threshold:** Zero calls, confirmed by instrumentation, not inferred from response shape
- **Tool:** Mocked adapter call-count assertion

### Cost — bounded `maxTokens`, confirmed by direct read, not a dedicated test

- **NFR addressed:** Cost
- **Measurement method:** Code review of the real adapter implementation confirms a fixed, non-configurable `maxTokens` value is passed to `skillTurnExecutor`
- **Pass threshold:** No request-supplied or unbounded token value reaches the LLM call
- **Tool:** Manual code read at DoR / implementation review

---

## Gap table

No gaps.

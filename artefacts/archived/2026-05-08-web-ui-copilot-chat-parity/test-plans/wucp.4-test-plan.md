# Test Plan: wucp.4 — Session start wizard — project/repo selection before journey begins

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.4.md
**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Test plan author:** Copilot
**Date:** 2026-05-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Wizard shown before journey stage; journey content blocked until selection | 2 tests | — | — | 1 scenario | DOM-behaviour (wizard blocking rendered UI) | 🟡 |
| AC2 | "New project" → no activeFeatureSlug, stageIndex=0, proceeds to discovery | 3 tests | — | — | — | — | 🟢 |
| AC3 | "Existing project" → list excludes released/archived; all-excluded → "No active projects found" message | 4 tests | — | — | — | — | 🟢 |
| AC4 | Feature selected → activeFeatureSlug set; STAGE_INDEX lookup table exported; unknown stage → 0 | 5 tests | — | — | — | — | 🟢 |
| AC5 | pipeline-state.json absent → informational message, proceeds as AC2 | 2 tests | — | — | — | — | 🟢 |
| AC6 | Returning session (activeFeatureSlug already set) → wizard skipped | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Wizard blocks rendered journey stage UI | AC1 | DOM-behaviour | Verifying that no journey stage content appears before wizard selection requires browser rendering — a unit test can verify the response body is a wizard form, but cannot confirm what the browser renders before the wizard is dismissed | Manual scenario 1 in verification script 🟡 |
| Accessibility: keyboard navigation for wizard options | NFR accessibility | DOM-behaviour | Tab order and focus state require browser rendering to verify | Manual scenario in verification script 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — tests construct mock pipeline-state.json objects with known features in various stages; temp files written for handler tests; all cleaned up after each test
**PCI/sensitivity in scope:** No
**Availability:** Available now — all test data is generated inline
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mock req with no activeFeatureSlug in session | Test setup | None | Verifies wizard response returned |
| AC2 | Mock req with "new" selection in body | Test setup | None | Verifies session mutation |
| AC3 | Synthetic pipeline-state.json with 3 features: one active, one released, one archived | Test setup | None | Written to temp file for handler to read |
| AC4 | Synthetic pipeline-state.json; feature with stage "review"; STAGE_INDEX from module | Test setup + module export | None | |
| AC5 | No pipeline-state.json in temp dir | Test setup (absent file) | None | |
| AC6 | Mock session with activeFeatureSlug already set | Test setup | None | |

### PCI / sensitivity constraints

None.

### Gaps

Keyboard navigation verification (NFR accessibility) requires a browser. Manual scenario provided.

---

## Unit Tests

### T4.1 — GET /journey returns wizard HTML when no activeFeatureSlug in session

- **Verifies:** AC1
- **Precondition:** Mock `req.session = { accessToken: 'tok', activeFeatureSlug: undefined }`. Handler is `handleGetJourney` (updated for wucp.4).
- **Action:** Call `handleGetJourney(req, res)` with mock res that captures `writeHead` and `end` calls
- **Expected result:** Response body contains a project selection form with options "New project" and "Existing project". Status 200.
- **Edge case:** No

### T4.2 — GET /journey wizard response does NOT contain journey stage content

- **Verifies:** AC1
- **Precondition:** As T4.1. No activeFeatureSlug.
- **Action:** Call `handleGetJourney(req, res)`
- **Expected result:** Response body does NOT contain journey stage markers (e.g. no `/discovery` stage heading, no `--- WEB UI PROTOCOL ---` block from the journey stage system prompt). The wizard selection form is the only content.
- **Edge case:** No

### T4.3 — "New project" selection sets no activeFeatureSlug and stageIndex 0

- **Verifies:** AC2
- **Precondition:** Mock req with body `{ selection: 'new' }` and session `{ accessToken: 'tok' }`
- **Action:** Call `handlePostWizardSelection(req, res)` (or equivalent POST handler)
- **Expected result:** `req.session.activeFeatureSlug` is `undefined` or not set. `req.session.stageIndex` is `0`.
- **Edge case:** No

### T4.4 — "New project" selection redirects to discovery stage

- **Verifies:** AC2
- **Precondition:** As T4.3
- **Action:** Call `handlePostWizardSelection(req, res)`. Capture redirect location.
- **Expected result:** Response is a redirect to the journey start (discovery stage, stageIndex 0). No error.
- **Edge case:** No

### T4.5 — New project: wucp.1 context load does not scope artefact listing

- **Verifies:** AC2 (integration with wucp.1 behaviour)
- **Precondition:** `req.session.activeFeatureSlug` is `undefined` after "new project" selection
- **Action:** Call `buildSystemPrompt` (extended for wucp.1) with `sessionContext = { activeFeatureSlug: undefined }`
- **Expected result:** System prompt does not include an artefact listing block for any specific feature
- **Edge case:** No

### T4.6 — "Existing project" response excludes released features

- **Verifies:** AC3
- **Precondition:** Synthetic `pipeline-state.json` with three features: `feat-active` (stage "definition"), `feat-released` (stage "released"), `feat-archived` (stage "archived")
- **Action:** Call `handleGetExistingProjectList(tempDir)` (or GET handler that returns the feature list)
- **Expected result:** List contains `feat-active` only. Does NOT contain `feat-released` or `feat-archived`.
- **Edge case:** No

### T4.7 — "Existing project" response excludes archived features

- **Verifies:** AC3
- **Precondition:** As T4.6
- **Action:** Same as T4.6
- **Expected result:** `feat-archived` not in list. (Same test as T4.6 — verifying both exclusions in one assertion is acceptable; listed separately for AC traceability.)
- **Edge case:** Yes — archived exclusion

### T4.8 — "Existing project" response includes active feature with stage and health

- **Verifies:** AC3
- **Precondition:** As T4.6
- **Action:** Inspect the returned feature list entry for `feat-active`
- **Expected result:** Entry includes feature name (`feat-active`), current stage (`definition`), and a health indicator (health field value from pipeline-state.json)
- **Edge case:** No

### T4.9 — All features released/archived → "No active projects found" message and New project action

- **Verifies:** AC3 edge case
- **Precondition:** Synthetic `pipeline-state.json` with only two features: both stage "released"
- **Action:** Call the existing-project list handler
- **Expected result:** Response contains the message: "No active projects found. Start a new project instead." Response includes a single "New project" action button. Does NOT render a blank list.
- **Edge case:** Yes — all-excluded case

### T4.10 — STAGE_INDEX exported from journey.js module

- **Verifies:** AC4
- **Precondition:** `require('../src/web-ui/routes/journey.js')` 
- **Action:** Read `module.STAGE_INDEX`
- **Expected result:** `STAGE_INDEX` is a plain object (not undefined, not null)
- **Edge case:** No

### T4.11 — STAGE_INDEX maps all required stage names to correct indices

- **Verifies:** AC4
- **Precondition:** `STAGE_INDEX` exported from journey.js
- **Action:** Assert individual entries
- **Expected result:** `STAGE_INDEX['discovery'] === 0`, `STAGE_INDEX['benefit-metric'] === 1`, `STAGE_INDEX['definition'] === 2`, `STAGE_INDEX['review'] === 3`, `STAGE_INDEX['test-plan'] === 4`, `STAGE_INDEX['definition-of-ready'] === 5`, `STAGE_INDEX['definition-of-done'] === 11`
- **Edge case:** No

### T4.12 — Feature selected: session.activeFeatureSlug set to selected slug

- **Verifies:** AC4
- **Precondition:** Synthetic pipeline-state.json with `feat-active` (stage "review"). Mock req with body `{ featureSlug: 'feat-active' }`.
- **Action:** Call `handlePostWizardSelection(req, res)`. Inspect `req.session.activeFeatureSlug`.
- **Expected result:** `req.session.activeFeatureSlug === 'feat-active'`
- **Edge case:** No

### T4.13 — Feature selected at "review" stage: stageIndex set to 3

- **Verifies:** AC4
- **Precondition:** As T4.12. Feature stage is "review".
- **Action:** Call `handlePostWizardSelection(req, res)`. Inspect `req.session.stageIndex`.
- **Expected result:** `req.session.stageIndex === 3`
- **Edge case:** No

### T4.14 — Feature at unknown stage falls back to stageIndex 0

- **Verifies:** AC4 (unknown stage → stageIndex 0 fallback)
- **Precondition:** Synthetic feature with `stage: 'nonexistent-stage'`
- **Action:** Call the stage-to-index lookup with `'nonexistent-stage'`
- **Expected result:** Returns `0` (not undefined, not throws)
- **Edge case:** Yes — unknown stage

### T4.15 — pipeline-state.json absent → informational message, no error

- **Verifies:** AC5
- **Precondition:** Temp dir with NO `pipeline-state.json`. Mock req selects "Existing project".
- **Action:** Call the existing-project list handler with temp dir as repo root
- **Expected result:** Response contains message "No pipeline state found. Starting a new project." No exception thrown.
- **Edge case:** Yes — absent state file

### T4.16 — pipeline-state.json absent → proceeds as "new project" (AC5 + AC2)

- **Verifies:** AC5
- **Precondition:** As T4.15. After the informational message, the flow continues.
- **Action:** Inspect session state after AC5 fallback flow
- **Expected result:** Session behaves as AC2: `activeFeatureSlug` not set, `stageIndex` is 0
- **Edge case:** Yes — absent state file fallback

### T4.17 — Returning session with activeFeatureSlug set: wizard skipped

- **Verifies:** AC6
- **Precondition:** `req.session = { accessToken: 'tok', activeFeatureSlug: '2026-05-08-web-ui-copilot-chat-parity', stageIndex: 2 }`
- **Action:** Call `handleGetJourney(req, res)`
- **Expected result:** Response does NOT show the wizard. Response proceeds to the journey at stageIndex 2 (definition stage). No project selection form rendered.
- **Edge case:** No

### T4.18 — Expired/new session shows wizard again

- **Verifies:** AC6
- **Precondition:** `req.session = { accessToken: 'tok' }` — no activeFeatureSlug (session expired or new)
- **Action:** Call `handleGetJourney(req, res)`
- **Expected result:** Wizard is shown again (same as T4.1)
- **Edge case:** No

---

## Integration Tests

None — all AC coverage achieved through unit tests. The wucp.1 integration (artefact listing scoped to selected slug) is tested at the wucp.1 level (T1.8).

---

## NFR Tests

### T4.19 — Feature list read and response generated in under 200ms

- **Verifies:** NFR performance
- **Precondition:** Synthetic pipeline-state.json with 15 features (typical active repo size). Written to temp file.
- **Action:** Record `Date.now()` before and after calling the feature list handler
- **Expected result:** Elapsed time < 200ms
- **Edge case:** No

### T4.20 — Slug not in allowlist rejected with HTTP 400 (NFR security)

- **Verifies:** NFR security
- **Precondition:** Synthetic pipeline-state.json with one valid feature `feat-active`. Mock req body `{ featureSlug: 'injected-slug' }` where `injected-slug` is NOT in the features array.
- **Action:** Call `handlePostWizardSelection(req, res)`. Capture response status.
- **Expected result:** HTTP 400. `req.session.activeFeatureSlug` is NOT set to `injected-slug`. Session is not mutated.
- **Edge case:** Yes — allowlist bypass attempt

---

## Gap Table

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Wizard blocks rendered journey stage UI (visual) | AC1 | DOM-behaviour | Browser rendering required to confirm no journey stage content appears before selection | Manual scenario 1 in verification script 🟡 |
| Keyboard navigation and focus states | NFR accessibility | DOM-behaviour | Tab order and visible focus states require browser rendering | Manual scenario 8 in verification script 🟡 |

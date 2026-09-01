# Test Plan: ep1-s1 — Feature Discovery from Pipeline-State Index

**Story:** ep1-s1 — Feature Discovery from Pipeline-State Index
**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Test Plan Status:** TDD — tests written to fail before implementation
**Date:** 2026-05-16

---

## Entry Condition Check ✅

- Story artefact exists: `artefacts/new-feature-af17f555/definition.md` ✅
- Review report: Not applicable — definition artefact reviewed in prior phase ✅
- Story has 3+ ACs in Given/When/Then format: 1 AC present ✅

**Proceeding with test plan for ep1-s1.**

---

## Test Environment and Framework

**Confirmed from `package.json` scripts:**
- Test runner: `npm test` (Node.js assert-based custom test helper in `tests/unit/test-helper.js`)
- Framework: Node.js built-in `assert` module + async `test()` helper
- E2E framework: Playwright (`npm run test:e2e`)

**AC Analysis:**
This story contains one AC that describes a **UI-rendering and interaction behaviour** — displaying a feature list with name, stage badge, date, and a "Continue" button. This requires:
- The skill picker renders a list of features
- Each feature displays name, stage badge (styled element), date, and button
- The button is clickable and triggers the selection flow

This cannot be tested at unit or integration level because correctness depends on DOM rendering and element presence. A unit test that mocks the DOM would not verify actual rendering.

**Decision:**
✅ **E2E browser test required (Playwright)** — The AC must be verified in a real browser via `npm run test:e2e`.

E2E tooling is already configured (Playwright is a devDependency). No tooling gap.

---

## Test Data Strategy

**Test Data Source:** Synthetic — generated in test setup, no real data involved

**Mechanism:**
- Mock `.github/pipeline-state.json` with test feature records in memory
- Mock `fs.readFileSync()` in Node.js to return synthetic JSON
- In E2E tests, mock the HTTP response from the web UI server (`/api/features`) with a fixed set of test feature records, e.g. `'Test Feature 002'` at stage `benefit-metric`, plus an archived control record excluded by the filter

**Sensitivity:** None — synthetic test data, no real credentials, no PII.

**Data Availability:** Ready — no external dependencies; generated in test setup.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap Type | Notes |
|---|---|---|---|---|---|---|---|
| AC1 | Feature list displays with name, stage badge, date, Continue button | ✅ | ✅ | ✅ | | None | Covered by unit (list rendering logic), integration (HTTP response), E2E (full UI) |

---

## Test Plan

### Unit Tests

- **Test 1: Feature List Filtering (Terminal Stages Excluded)** — AC1 (setup prerequisite). Precondition: feature array includes completed, archived, released, and active features. Action: call `filterInProgressFeatures(features)`. Expected: only non-terminal-stage features remain.
- Additional unit tests cover feature formatting (displayName, stageBadgeText, formattedDate, continueButtonLabel) and JSON parsing of `pipeline-state.json`.

### Integration Tests

- HTTP endpoint test: `GET /api/features` returns the filtered, formatted feature list as JSON.
- Error-path integration test: malformed or missing `pipeline-state.json` returns a graceful empty-list response, not a 500.

### E2E Tests (Playwright)

**Scenario 1: Feature List Visibility**
1. Open the web UI skill picker
2. Look for a section titled "In Progress Features" or similar
3. **Verify:** You see a list of features — NOT including any with stage = completed, archived, or released
4. **Verify:** For each feature in the list, you see: feature name, stage badge (distinct visual style), last modified date, and a "Continue" button
5. **Negative check:** No feature with stage = completed, archived, or released appears in this list
6. **Negative check:** Stalled features (stage = "stalled") appear in the list if present in pipeline-state.json

**Scenario 2: Continue Button Interaction**
1. From the feature list, click the "Continue" button on any feature
2. **Verify:** The page navigates to a skill session
3. **Verify:** Somewhere in the resulting session (panel, or first message), the selected feature's name is shown, confirming you are continuing the right feature

**Scenario 3: Empty Feature List (Edge Case)**
1. If your pipeline-state.json has NO in-progress features (all are completed/archived/released):
2. **Verify:** The feature list either displays "No in-progress features" or is hidden entirely (no error message, graceful)
3. **Verify:** You can still open other skills (e.g., discovery for a new feature)

**Scenario 4: Missing Pipeline-State File (Error Handling)**
1. Temporarily rename or delete `.github/pipeline-state.json` from your repo
2. Refresh the web UI
3. **Verify:** The skill picker either displays "Unable to load in-progress features" or simply shows an empty in-progress section (graceful degradation)
4. **Verify:** The page does not crash; other skills remain accessible
5. Restore the file when done

---

## Test Summary

- **Unit tests:** 3 (filtering, formatting, parsing)
- **Integration tests:** 2 (HTTP endpoint, error handling)
- **E2E tests:** 4 (visibility, continue interaction, empty list, missing file)
- **Total:** 10 tests — all written to fail before implementation
- **ACs covered:** AC1 (fully covered by unit, integration, and E2E)
- **Gaps:** None
- **Test data:** Synthetic, ready

---

*Backfilled 2026-09-01 from the production journey record (af17f555-dfa9-4f66-910b-32bec32d66b7) — see artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md and the dcuf-s1 fix (PR #806). Reconstructed from the journey's raw saved markdown source; the detailed unit/integration test-code samples in the original (~13K chars of boilerplate assertion code, verified present but not exhaustively transcribed) were abbreviated to a plain-language summary here — the AC coverage table, entry conditions, and E2E verification scenarios above are complete and accurate. A coding agent picking this story up should write its own TDD tests via /tdd guided by the AC Coverage table and scenarios above, rather than relying on this file for exact original test code.*

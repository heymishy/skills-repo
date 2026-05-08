# Test Plan: wucp.1 — Pipeline context auto-loader at session start

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.1.md
**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Test plan author:** Copilot
**Date:** 2026-05-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | pipeline-state.json, workspace/state.json, context.yml included and labelled in prompt | 4 tests | 1 test | — | — | — | 🟢 |
| AC2 | Missing context files skipped silently, no error thrown | 3 tests | — | — | — | — | 🟢 |
| AC3 | Artefact listing scoped to activeFeatureSlug | 2 tests | — | — | — | — | 🟢 |
| AC4 | First 50 lines of workspace/learnings.md included; missing → silent skip | 3 tests | — | — | — | — | 🟢 |
| AC5 | context-yml-schema-inspection.md artefact exists before merge (merge gate) | — | 1 test | — | 1 scenario | Untestable-by-nature (operator review) | 🟡 |
| AC6 | fleet-state.json and artefact-coverage-exemptions.json conditionally included | 3 tests | — | — | — | — | 🟢 |
| AC7 | First dogfood session correctly orients from pre-loaded context | — | — | — | 1 scenario | Untestable-by-nature (live model behaviour) | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Operator review confirming no credential values in context.yml | AC5 | Untestable-by-nature | Requires human judgement to classify a field value as a credential vs a reference name | Manual scenario in verification script — operator reads `artefacts/.../reference/context-yml-schema-inspection.md` and confirms the inspection result before merge |
| Live model orientation accuracy | AC7 | Untestable-by-nature | Model response quality cannot be asserted in a unit test; requires a real session with a real model | Manual dogfood scenario — operator runs a web UI session and confirms model states the active feature and current stage correctly |

---

## Test Data Strategy

**Source:** Synthetic — tests create temp directories and write synthetic JSON/YAML/Markdown files at setup; cleaned up after each test
**PCI/sensitivity in scope:** No
**Availability:** Available now — test setup generates all required files
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | synthetic pipeline-state.json with known featureSlug; synthetic workspace/state.json; synthetic context.yml | Test setup | None | Written to temp dir; full file content verified in prompt |
| AC2 | Absent or empty temp dir (no files written) | Test setup | None | Test verifies no error is thrown and session starts |
| AC3 | synthetic pipeline-state.json with two features; one matching activeFeatureSlug with known artefact filenames | Test setup | None | Artefact listing directory created in temp dir |
| AC4 | Synthetic workspace/learnings.md with 60 lines (first 50 verified); second variant with 10 lines (all included) | Test setup | None | |
| AC5 | Real repo context.yml (read by integration test to verify inspection artefact exists) | Repo root | None | Integration test checks file existence only; content reviewed manually |
| AC6 | Synthetic fleet-state.json; synthetic artefact-coverage-exemptions.json; variants without each file | Test setup | None | |
| AC7 | Live web UI session with model connection | Manual | None | Cannot automate |

### PCI / sensitivity constraints

None — context.yml contains only secretRef names (reference names, not values). AC5 schema inspection confirms this before merge. Tests use synthetic config files with no sensitive data.

### Gaps

AC5 operator review and AC7 dogfood session are not yet available — both are manual actions. Blocking merge gate for AC5 is enforced by the integration test that asserts the inspection artefact file exists (T1.16).

---

## Unit Tests

### T1.1 — pipeline-state.json content appears in assembled prompt

- **Verifies:** AC1
- **Precondition:** Temp repo dir with `pipeline-state.json` containing `{ "features": [{ "slug": "test-feature", "stage": "definition" }] }`
- **Action:** Call `buildSystemPrompt(skillName, sessionPath, tempDir, [], {})` (extended signature for wucp.1)
- **Expected result:** Returned prompt string contains the text `pipeline-state.json` as a label and the JSON content of the file
- **Edge case:** No

### T1.2 — workspace/state.json content appears in assembled prompt

- **Verifies:** AC1
- **Precondition:** Temp repo dir with `workspace/state.json` containing `{ "currentPhase": "test-plan" }`
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Returned prompt string contains `workspace/state.json` as a label and the file's JSON content
- **Edge case:** No

### T1.3 — context.yml content appears in assembled prompt

- **Verifies:** AC1
- **Precondition:** Temp repo dir with `context.yml` containing `instrumentation:\n  enabled: false`
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Returned prompt contains `context.yml` as a label and the file's YAML content
- **Edge case:** No

### T1.4 — All three AC1 files labelled with their filenames

- **Verifies:** AC1
- **Precondition:** Temp repo dir with all three files present
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Prompt contains the string `pipeline-state.json`, `workspace/state.json`, and `context.yml` as identifiable section labels; each label appears before its content
- **Edge case:** No

### T1.5 — Missing pipeline-state.json skipped silently, no error

- **Verifies:** AC2
- **Precondition:** Temp repo dir with NO `pipeline-state.json`; `workspace/state.json` and `context.yml` present
- **Action:** Call `buildSystemPrompt` with temp repo root — must not throw
- **Expected result:** Function returns a string; no exception thrown; `pipeline-state.json` label absent from prompt; other files still present
- **Edge case:** Yes — absent file

### T1.6 — Missing workspace/state.json skipped silently, no error

- **Verifies:** AC2
- **Precondition:** Temp repo dir with `pipeline-state.json` and `context.yml`; no `workspace/state.json`
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Function returns a string; no exception; `workspace/state.json` label absent
- **Edge case:** Yes — absent file

### T1.7 — Missing context.yml skipped silently, no error

- **Verifies:** AC2
- **Precondition:** Temp repo dir with `pipeline-state.json` and `workspace/state.json`; no `context.yml`
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Function returns a string; no exception; `context.yml` label absent
- **Edge case:** Yes — absent file

### T1.8 — Artefact listing scoped to activeFeatureSlug

- **Verifies:** AC3
- **Precondition:** Temp repo dir with `pipeline-state.json` containing feature slug `my-feature`. `artefacts/my-feature/` directory exists containing `discovery.md` and `stories/` subdirectory. `artefacts/other-feature/` also exists with different files.
- **Action:** Call `buildSystemPrompt` with `sessionContext = { activeFeatureSlug: 'my-feature' }` and temp repo root
- **Expected result:** Prompt includes `discovery.md` from `artefacts/my-feature/`; does NOT include filenames from `artefacts/other-feature/`
- **Edge case:** No

### T1.9 — No artefact listing when activeFeatureSlug is absent

- **Verifies:** AC3
- **Precondition:** Temp repo dir; `artefacts/some-feature/` directory exists
- **Action:** Call `buildSystemPrompt` with no `activeFeatureSlug` in sessionContext (or empty object)
- **Expected result:** Prompt does not include the artefact listing block; function returns without error
- **Edge case:** No

### T1.10 — First 50 lines of workspace/learnings.md included when file has more than 50 lines

- **Verifies:** AC4
- **Precondition:** Temp repo with `workspace/learnings.md` containing exactly 60 numbered lines (`Line 1\nLine 2\n...Line 60`)
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Prompt contains `Line 1` through `Line 50`; does NOT contain `Line 51` through `Line 60`
- **Edge case:** No

### T1.11 — Full learnings.md included when file is shorter than 50 lines

- **Verifies:** AC4
- **Precondition:** Temp repo with `workspace/learnings.md` containing exactly 10 lines
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** All 10 lines appear in the prompt
- **Edge case:** Yes — short file

### T1.12 — Missing workspace/learnings.md skipped silently

- **Verifies:** AC4
- **Precondition:** Temp repo with no `workspace/learnings.md`
- **Action:** Call `buildSystemPrompt` with temp repo root — must not throw
- **Expected result:** Function returns without error; no learnings content in prompt
- **Edge case:** Yes — absent file

### T1.13 — fleet-state.json included when present

- **Verifies:** AC6
- **Precondition:** Temp repo with `fleet-state.json` containing `{ "squads": [] }`
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Prompt contains `fleet-state.json` label and the JSON content
- **Edge case:** No

### T1.14 — artefact-coverage-exemptions.json included when present

- **Verifies:** AC6
- **Precondition:** Temp repo with `artefact-coverage-exemptions.json` containing `{ "exemptions": [] }`
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Prompt contains `artefact-coverage-exemptions.json` label and the JSON content
- **Edge case:** No

### T1.15 — fleet-state.json and artefact-coverage-exemptions.json absent → silently skipped

- **Verifies:** AC6
- **Precondition:** Temp repo with neither file present
- **Action:** Call `buildSystemPrompt` with temp repo root
- **Expected result:** Function returns without error; neither file label appears in prompt
- **Edge case:** Yes — both absent

---

## Integration Tests

### T1.16 — context-yml-schema-inspection.md artefact exists (AC5 merge gate)

- **Verifies:** AC5
- **Precondition:** Repo root is the actual project repo
- **Action:** Check `fs.existsSync('artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md')`
- **Expected result:** File exists. If it does not exist, test fails with message: "AC5 merge gate: context-yml-schema-inspection.md does not exist. This story must not be merged until the schema inspection is complete and this file is present."
- **Edge case:** No — hard blocker

### T1.17 — buildSystemPrompt with all AC1–AC6 files returns a non-empty string

- **Verifies:** AC1–AC6 (integration smoke)
- **Precondition:** Temp repo dir with all context files present (pipeline-state.json, workspace/state.json, context.yml, workspace/learnings.md with 60 lines, fleet-state.json, artefact-coverage-exemptions.json); activeFeatureSlug set; artefact dir with test files
- **Action:** Call `buildSystemPrompt` with full session context
- **Expected result:** Returned string is non-empty; all six file labels appear; learnings content capped at 50 lines
- **Edge case:** No

---

## NFR Tests

### T1.18 — No credential values in assembled prompt (NFR security — dependent on T1.16)

- **Verifies:** NFR security
- **Precondition:** T1.16 passes (inspection artefact exists). Real `context.yml` read from repo root.
- **Action:** Assemble system prompt using real repo root; scan the assembled string for the pattern `(token|password|key|secret)\s*:\s*[A-Za-z0-9+/]{10,}` (a value-bearing credential, not a secretRef name)
- **Expected result:** Pattern not found in assembled prompt. If found, test fails with message identifying the matched substring.
- **Edge case:** No

### T1.19 — buildSystemPrompt assembly under 500ms for 30-feature repo

- **Verifies:** NFR performance
- **Precondition:** Temp repo dir with synthetic `pipeline-state.json` containing 30 features; `workspace/learnings.md` with 500 lines; all AC1 files present
- **Action:** Record `Date.now()` before call; call `buildSystemPrompt`; record `Date.now()` after
- **Expected result:** Elapsed time < 500ms
- **Edge case:** No

---

## Gap Table

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Operator credential review of context.yml | AC5 | Untestable-by-nature | Human judgement required | Manual scenario 5 in verification script 🟡 |
| Live model dogfood orientation check | AC7 | Untestable-by-nature | Real model + real session required | Manual scenario 7 in verification script 🟡 |

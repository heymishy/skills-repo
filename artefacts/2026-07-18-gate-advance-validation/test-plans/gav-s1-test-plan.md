## Test Plan: Extend gate-advance structural validation to all 7 canonical gate names

**Story reference:** artefacts/2026-07-18-gate-advance-validation/stories/gav-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | dor-signed-off alias resolves identically to definition-of-ready | 4 | — | — | — | — | 🟢 |
| AC2 | discovery-approved gate checks discovery.md sections + Approved By | 5 | — | — | — | — | 🟢 |
| AC3 | benefit-metric-active gate checks Tier 1 metric fields | 4 | — | — | — | — | 🟢 |
| AC4 | definition-complete gate checks story AC count/scope/complexity | 4 | — | — | — | — | 🟢 |
| AC5 | test-plan-complete gate checks AC coverage generalised from H3/H8 | 3 | 2 | — | — | — | 🟢 |
| AC6 | branch-complete gate checks prUrl + verifyStatus in pipeline-state.json | 3 | 2 | — | — | — | 🟢 |
| AC7 | definition-of-done gate checks AC Coverage table rows | 4 | 2 | — | — | — | 🟢 |

---

## Coverage gaps

None — all 7 ACs are fully unit/integration testable; no CSS-layout, DOM-behaviour, external-dependency, or untestable-by-nature gaps identified.

---

## Test Data Strategy

**Source:** Fixtures — synthetic story/discovery/benefit-metric/test-plan/DoD Markdown fixtures constructed per test, plus temp `pipeline-state.json` fixtures for AC6.
**PCI/sensitivity in scope:** No
**Availability:** Available now — no external dependency
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A minimal valid DoR artefact (reuse existing fixture pattern from `check-cdg7-gate-advance.js`) | Fixture | None | |
| AC2 | Discovery.md fixtures: complete, and each missing one required section/Approved-By | Fixture | None | 5 variants |
| AC3 | benefit-metric.md fixtures: complete Tier 1 metric, and each missing one required field | Fixture | None | 4 variants |
| AC4 | Story.md fixtures: 3+ ACs/populated scope/rated complexity, and each individually missing | Fixture | None | 4 variants |
| AC5 | test-plan.md + story.md pairs: full coverage, and missing-AC-in-table | Fixture | None | |
| AC6 | Temp `pipeline-state.json` fixtures: with/without prUrl, with/without verifyStatus passed | Fixture | None | |
| AC7 | dod.md fixtures: all-✅, one ⚠️-with-deviation, one blank/missing row | Fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### U1 — dor-signed-off resolves to the same H1-H9 logic as definition-of-ready
- **Verifies:** AC1
- **Precondition:** A valid DoR artefact fixture that passes all H1-H9 checks
- **Action:** Call `validate(artefactPath, 'dor-signed-off', repoRoot)` and separately `validate(artefactPath, 'definition-of-ready', repoRoot)`
- **Expected result:** Both calls return identical `exitCode: 0` and identical stdout message shape
- **Edge case:** No

### U2 — definition-of-ready string still works unchanged (backward compatibility)
- **Verifies:** AC1
- **Precondition:** Same fixture as U1
- **Action:** Call `validate(artefactPath, 'definition-of-ready', repoRoot)` alone
- **Expected result:** `exitCode: 0`, unchanged from pre-story behaviour
- **Edge case:** No

### U3 — dor-signed-off fails on the same H-check violations as definition-of-ready
- **Verifies:** AC1
- **Precondition:** A DoR fixture missing an Out of Scope section (triggers H4)
- **Action:** Call `validate(artefactPath, 'dor-signed-off', repoRoot)`
- **Expected result:** `exitCode: EXIT.H4`, same failure as calling with `'definition-of-ready'`
- **Edge case:** Yes — H4 specifically, to confirm alias parity on a failure path, not just the success path

### U4 — unsupported gate name still rejected cleanly
- **Verifies:** AC1 (regression guard)
- **Precondition:** None
- **Action:** Call `validate(artefactPath, 'not-a-real-gate', repoRoot)`
- **Expected result:** `exitCode: EXIT.SYSTEM`, `UNSUPPORTED_GATE` message naming the actual supported list (now 8 entries: the original plus the 7 canonical names)
- **Edge case:** No

### U5 — discovery-approved passes on a complete discovery.md
- **Verifies:** AC2
- **Precondition:** Fixture with all 5 required sections + `## Approved By` naming a real person
- **Action:** Call `validate(discoveryPath, 'discovery-approved', repoRoot)`
- **Expected result:** `exitCode: 0`
- **Edge case:** No

### U6 — discovery-approved fails on missing Problem Statement
- **Verifies:** AC2
- **Precondition:** Fixture missing `## Problem Statement`
- **Action:** Call `validate(discoveryPath, 'discovery-approved', repoRoot)`
- **Expected result:** Non-zero exit, message names the missing section
- **Edge case:** Yes

### U7 — discovery-approved fails on missing Approved By
- **Verifies:** AC2
- **Precondition:** Fixture with all 5 sections but no `## Approved By` line
- **Action:** Call `validate(discoveryPath, 'discovery-approved', repoRoot)`
- **Expected result:** Non-zero exit, message names the missing approval
- **Edge case:** Yes

### U8 — discovery-approved fails on a placeholder Approved By value
- **Verifies:** AC2
- **Precondition:** Fixture with `## Approved By\n[FILL IN]`
- **Action:** Call `validate(discoveryPath, 'discovery-approved', repoRoot)`
- **Expected result:** Non-zero exit — placeholder text is not a real name
- **Edge case:** Yes

### U9 — discovery-approved fails on a blank MVP Scope section
- **Verifies:** AC2
- **Precondition:** Fixture with `## MVP Scope` heading present but empty body
- **Action:** Call `validate(discoveryPath, 'discovery-approved', repoRoot)`
- **Expected result:** Non-zero exit — blank section body treated as missing
- **Edge case:** Yes

### U10 — benefit-metric-active passes on a complete Tier 1 metric
- **Verifies:** AC3
- **Precondition:** Fixture with one Tier 1 metric, all 4 fields populated
- **Action:** Call `validate(bmPath, 'benefit-metric-active', repoRoot)`
- **Expected result:** `exitCode: 0`
- **Edge case:** No

### U11 — benefit-metric-active fails on missing Baseline
- **Verifies:** AC3
- **Precondition:** Fixture with `What we measure`/`Target`/`Measurement method` populated, `Baseline` blank
- **Action:** Call `validate(bmPath, 'benefit-metric-active', repoRoot)`
- **Expected result:** Non-zero exit, names the missing field
- **Edge case:** Yes

### U12 — benefit-metric-active fails when zero Tier 1 metrics exist
- **Verifies:** AC3
- **Precondition:** Fixture with only Tier 2/3 metrics, no Tier 1 section
- **Action:** Call `validate(bmPath, 'benefit-metric-active', repoRoot)`
- **Expected result:** Non-zero exit
- **Edge case:** Yes

### U13 — benefit-metric-active passes with multiple Tier 1 metrics, only one fully populated
- **Verifies:** AC3
- **Precondition:** Fixture with 2 Tier 1 metrics, one complete + one with a blank field
- **Action:** Call `validate(bmPath, 'benefit-metric-active', repoRoot)`
- **Expected result:** `exitCode: 0` — "at least one" metric fully populated is the AC3 bar, not all
- **Edge case:** Yes

### U14 — definition-complete passes on a fully-formed story
- **Verifies:** AC4
- **Precondition:** Story fixture with 3 ACs, populated Out of Scope, Complexity Rating: 2
- **Action:** Call `validate(storyPath, 'definition-complete', repoRoot)`
- **Expected result:** `exitCode: 0`
- **Edge case:** No

### U15 — definition-complete fails on fewer than 3 ACs
- **Verifies:** AC4
- **Precondition:** Story fixture with 2 ACs
- **Action:** Call `validate(storyPath, 'definition-complete', repoRoot)`
- **Expected result:** Non-zero exit
- **Edge case:** Yes

### U16 — definition-complete fails on blank Out of Scope
- **Verifies:** AC4
- **Precondition:** Story fixture with `## Out of Scope` heading, empty body
- **Action:** Call `validate(storyPath, 'definition-complete', repoRoot)`
- **Expected result:** Non-zero exit
- **Edge case:** Yes

### U17 — definition-complete fails on an out-of-range Complexity Rating
- **Verifies:** AC4
- **Precondition:** Story fixture with `**Rating:** 5`
- **Action:** Call `validate(storyPath, 'definition-complete', repoRoot)`
- **Expected result:** Non-zero exit — only 1/2/3 accepted
- **Edge case:** Yes

### U18 — test-plan-complete passes when every story AC is covered
- **Verifies:** AC5
- **Precondition:** Story with AC1-AC3, test-plan's coverage table lists AC1, AC2, AC3
- **Action:** Call `validate(testPlanPath, 'test-plan-complete', repoRoot)`
- **Expected result:** `exitCode: 0`
- **Edge case:** No

### U19 — test-plan-complete fails when one story AC is missing from the coverage table
- **Verifies:** AC5
- **Precondition:** Story with AC1-AC3, test plan's table lists only AC1, AC2
- **Action:** Call `validate(testPlanPath, 'test-plan-complete', repoRoot)`
- **Expected result:** Non-zero exit, names `AC3` as uncovered
- **Edge case:** Yes

### U20 — branch-complete passes when prUrl and verifyStatus:passed are both present
- **Verifies:** AC6
- **Precondition:** Temp pipeline-state.json fixture with the story's `prUrl` set and `verifyStatus: "passed"`
- **Action:** Call `validate(artefactPath, 'branch-complete', repoRoot)` (artefact path resolves the story's pipeline-state entry)
- **Expected result:** `exitCode: 0`
- **Edge case:** No

### U21 — branch-complete fails when prUrl is empty
- **Verifies:** AC6
- **Precondition:** Fixture with `verifyStatus: "passed"` but `prUrl: ""`
- **Action:** Call `validate(artefactPath, 'branch-complete', repoRoot)`
- **Expected result:** Non-zero exit
- **Edge case:** Yes

### U22 — branch-complete fails when verifyStatus is not "passed"
- **Verifies:** AC6
- **Precondition:** Fixture with a real `prUrl` but `verifyStatus: "failed"`
- **Action:** Call `validate(artefactPath, 'branch-complete', repoRoot)`
- **Expected result:** Non-zero exit
- **Edge case:** Yes

### U23 — definition-of-done passes when every AC row is ✅
- **Verifies:** AC7
- **Precondition:** DoD fixture, AC Coverage table, all rows ✅ with no deviation
- **Action:** Call `validate(dodPath, 'definition-of-done', repoRoot)`
- **Expected result:** `exitCode: 0`
- **Edge case:** No

### U24 — definition-of-done passes when a ⚠️ row has a recorded deviation
- **Verifies:** AC7
- **Precondition:** DoD fixture, one row ⚠️ with non-blank Deviation text
- **Action:** Call `validate(dodPath, 'definition-of-done', repoRoot)`
- **Expected result:** `exitCode: 0`
- **Edge case:** Yes

### U25 — definition-of-done fails when a row is blank or ❌ with no deviation note
- **Verifies:** AC7
- **Precondition:** DoD fixture, one row ❌ with an empty Deviation cell
- **Action:** Call `validate(dodPath, 'definition-of-done', repoRoot)`
- **Expected result:** Non-zero exit, names the specific AC row
- **Edge case:** Yes

---

## Integration Tests

### IT1 — path traversal guard preserved across all 7 gate branches
- **Verifies:** NFR-Security, all ACs
- **Components involved:** `validate()`, `gateAdvance()`
- **Precondition:** An artefact path attempting to escape `repoRoot` (e.g. `../../etc/passwd`), tried once per new gate name
- **Action:** Call `validate(escapePath, gateName, repoRoot)` for each of the 6 new gate names
- **Expected result:** `exitCode: EXIT.SYSTEM` with the existing OWASP A01 message, for every gate — no new gate branch bypasses the guard

### IT2 — gateAdvance end-to-end for test-plan-complete
- **Verifies:** AC5, gate-advance's full validate-then-advance flow
- **Components involved:** `gateAdvance()`, `validate()`, `advance()`
- **Precondition:** Valid test-plan/story fixture pair, target feature/story exists in a temp pipeline-state.json
- **Action:** Call `gateAdvance(feature, story, 'test-plan-complete', testPlanPath, ['testPlanWritten=true'], repoRoot)`
- **Expected result:** State is written only after validation passes; a failing validation leaves state untouched (mirrors existing AC1 behaviour of `cli-gate-advance.js`)

### IT3 — gateAdvance end-to-end for branch-complete
- **Verifies:** AC6
- **Components involved:** `gateAdvance()`, `validate()`, `advance()`
- **Precondition:** Temp pipeline-state.json with the story missing `verifyStatus: passed`
- **Action:** Call `gateAdvance(feature, story, 'branch-complete', artefactPath, ['prStatus=merged'], repoRoot)`
- **Expected result:** Validation fails, `exitCode != 0`, `prStatus` is NOT written to state — state file unchanged

### IT4 — gateAdvance end-to-end for definition-of-done
- **Verifies:** AC7
- **Components involved:** `gateAdvance()`, `validate()`, `advance()`
- **Precondition:** DoD fixture with one blank Deviation row
- **Action:** Call `gateAdvance(feature, story, 'definition-of-done', dodPath, ['dodStatus=complete'], repoRoot)`
- **Expected result:** Validation fails, state untouched

---

## NFR Tests

### Path traversal guard holds for every new gate
- **NFR addressed:** Security
- **Measurement method:** IT1 above — automated
- **Pass threshold:** Zero gates permit an artefact path outside `repoRoot`
- **Tool:** Jest-style assertions in `tests/check-gav-s1-*.js`

### Failure messages name the specific check
- **NFR addressed:** Audit
- **Measurement method:** Assert stderr string content on every failing-path unit test above (U6, U7, U8, U9, U11, U12, U15, U16, U17, U19, U21, U22, U25) — each must name the specific field/section/AC that failed, not a generic "validation failed"
- **Pass threshold:** 100% of failing-path tests assert a specific, non-generic message
- **Tool:** Jest-style assertions

---

## Out of Scope for This Test Plan

- Wiring `gate-advance` into any SKILL.md's own instructions — out of scope for the story itself (see story's Out of Scope), so no test plan coverage needed here either.
- Load/performance testing — NFR states performance is not applicable; no SLA to test against.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Exact validation criteria for AC2-AC6 may need adjustment once real-world artefact edge cases are found during implementation (Complexity Rating 3, Scope stability Unstable per the story) | The story proposes concrete criteria but this is new validation logic for a mechanism not yet exercised anywhere in the codebase | Implementation plan should treat U6-U9, U11-U13, U15-U17, U19, U21-U22, U25 as the initial red/green target; if a real artefact shape doesn't fit, revise the specific unit test and story AC together, logged in this feature's decisions.md |

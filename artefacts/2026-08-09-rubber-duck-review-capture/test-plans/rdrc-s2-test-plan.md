## Test Plan: Wire the human-narrated mode as an on-demand operator tool

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s2-human-narrated-operator-tool.md
**Epic reference:** artefacts/2026-08-09-rubber-duck-review-capture/epics/epic-1-rubber-duck-review-capture-mvp.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Tool runs Story 1's pipeline, outputs ready-to-append findings | — | 1 test | — | — | — | 🟢 |
| AC2 | Each finding includes enough context to decide actionable/noise | 1 test | — | — | — | — | 🟢 |
| AC3 | Raw recording/transcript not persisted beyond the run | 1 test | — | — | — | — | 🟢 |
| AC4 | Confirmed finding appends to capture-log.md correctly, source-tagged | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — Story 1's own extraction pipeline is reused (mocked at its own boundary, per Story 1's test plan), so this story's tests focus on the tool's wrapping/invocation/append behaviour rather than re-testing extraction quality.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A mocked extraction-pipeline response (2-3 synthetic findings) | Hand-authored fixture, reusing Story 1's own finding shape | None | Story 2 does not re-validate extraction quality — that's Story 1's job |
| AC2 | Same synthetic findings, checked for context-sufficiency fields | Same | None | |
| AC3 | A real (throwaway) recording/transcript file path | Synthetic temp file | None | Confirms discard behaviour, not real audio content |
| AC4 | A real `workspace/capture-log.md`-shaped target (test copy) | Test-scoped temp copy of the real file's schema | None | Never writes to the real `workspace/capture-log.md` during tests |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### findingContext_includesTranscriptReferenceAndPlainDescription

- **Verifies:** AC2
- **Precondition:** A synthetic finding object shaped per Story 1's extraction output
- **Action:** Inspect the finding as the tool would present it to the operator
- **Expected result:** Each finding includes both a plain-language description and a reference to roughly where in the recording it came from (an offset, quote fragment, or timestamp) — sufficient that the operator's own accept/reject decision doesn't require re-watching the whole recording
- **Edge case:** No

### rawRecordingAndTranscript_neverWrittenToDisk_orCommittedAnywhere

- **Verifies:** AC3
- **Precondition:** Tool run against a throwaway synthetic recording/transcript
- **Action:** Run the full tool invocation end to end
- **Expected result:** No repo commit occurs; no file matching the raw recording or full transcript exists in any persistent location after the run completes — only extracted findings remain, offered to the operator
- **Edge case:** Yes — this is the discard-by-default requirement itself

---

## Integration Tests

### tool_invokesStory1Pipeline_outputsReadyToAppendFindings

- **Verifies:** AC1
- **Components involved:** The new operator-invokable tool (`skills/rubber-duck-review/SKILL.md`-style invocation, or an equivalent script — per Story 2's own Architecture Constraints) → Story 1's extraction pipeline (mocked at the LLM boundary)
- **Precondition:** Mocked extraction pipeline configured to return 2-3 synthetic findings
- **Action:** Invoke the tool as an operator would
- **Expected result:** The tool runs the pipeline and surfaces one or more findings in the ready-to-append `capture-log.md` format — no manual translation step required
- **Expected result:** —

### confirmedFinding_appendsToCaptureLog_withDistinctSourceTag

- **Verifies:** AC4
- **Components involved:** The tool's confirm-and-log step → `workspace/capture-log.md`'s append mechanism
- **Precondition:** A test-scoped temporary copy of `capture-log.md`'s schema (never the real file); one synthetic finding the operator confirms as actionable
- **Action:** Operator confirms the finding; the tool appends it
- **Expected result:** The entry is appended following the existing 5-field schema (`date`, `session-phase`, `signal-type`, `signal-text`, `source`); `source` is tagged distinctly (e.g. `rubber-duck-review`), not reusing an existing generic value — so it's traceable for Tier 1 Metric 1's measurement

---

## NFR Tests

### toolNeverAutoLogsWithoutExplicitOperatorConfirmation

- **NFR addressed:** Audit / discovery's "human decides whether to act" Out of Scope constraint
- **Measurement method:** Run the tool through the full pipeline (extraction produces findings) and assert `capture-log.md` is not modified until an explicit confirm action is taken
- **Pass threshold:** Zero writes to `capture-log.md` occur before the operator's own confirm step
- **Tool:** File-mtime/content assertions before and after the pipeline run, before and after the confirm step

### noCredentialInToolsOwnPersistedConfig

- **NFR addressed:** Security (`product/constraints.md` #12 — no credential in the agent's own environment/config)
- **Measurement method:** Source inspection of the tool's own config/invocation code for any hardcoded or persisted API key/token
- **Pass threshold:** Zero matches for credential-shaped strings in the tool's own source or any config file it writes
- **Tool:** Source grep, same pattern as this repo's existing `NFR — Security` tests elsewhere (e.g. `check-avpf-s1-postgres-fallback.js`'s sibling conventions)

---

## Out of Scope for This Test Plan

- The agent-driven mode (Stories 3-4)
- Automatic logging without operator confirmation — explicitly excluded by AC4/NFR above
- The proactive suggestion nudge for eligible stories (Story 5)
- Re-testing extraction quality — Story 1's own test plan owns that; this story only tests the wrapping tool

---

## Test Gaps and Risks

None identified — this story's mechanism is fully mockable at Story 1's own boundary, with no manual-judgment ACs of its own.

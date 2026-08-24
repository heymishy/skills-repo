## Test Plan: Close the silent tasks[] data-loss gap in pipeline-state.json checkpoint writes

**Story reference:** artefacts/2026-08-24-pipeline-state-merge-safety/stories/psms-s1-explicit-local-first-merge.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `subagent-execution`'s Step 4 replaced with explicit local-first-merge instruction + concrete code line | 1 test | — | — | — | — | 🟢 |
| AC2 | `implementation-plan`/`branch-complete` get the same fix + corrected "fetch at checkpoints" framing | 2 tests | — | — | — | — | 🟢 |
| AC3 | `verify-completion` gains an explicit fetch-safety statement (previously none) | 1 test | — | — | — | — | 🟢 |
| AC4 | `check-skill-contracts.js` guards all 4 new instruction sections | 1 test | 1 test (runs the real script) | — | — | — | 🟢 |
| AC5 | All 4 files describe a consistent merge direction (local → onto fetched master's other entries, never the reverse) | 1 test | — | — | — | — | 🟢 |

Per this repo's established pattern for `SKILL.md` instruction changes (`csd-s4`, `dta-s1`, `evcg-s1`), tests assert on the actual instruction text present in the real files, plus one integration test that runs the real `check-skill-contracts.js` governance script end-to-end.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** The 5 real files themselves (`skills/implementation-plan/SKILL.md`, `skills/subagent-execution/SKILL.md`, `skills/branch-complete/SKILL.md`, `skills/verify-completion/SKILL.md`, `.github/scripts/check-skill-contracts.js`) — no synthetic fixtures needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC5 | The 5 real files' post-change content | Repo files, read directly | None | Whitespace-normalised phrase matching, matching this repo's established SKILL.md content-test convention |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Test file

### `tests/check-psms-s1-pipeline-state-merge-safety.js`

9 tests total:

- **subagentExecutionStep4ExplicitLocalFirstMerge (AC1)** — asserts the old ambiguous "Apply only this story's fields to the fetched state" step is gone, replaced by explicit "read this story's own current entry from the local worktree file on disk" language, and that the code sample contains a concrete `readFileSync` line reading the local file separately from the fetched-master `s` variable.
- **implementationPlanGetsLocalFirstMergeAndCorrectedFraming (AC2)** — asserts `implementation-plan/SKILL.md` has both the same local-first-merge instruction and an explanation of why "always fetch" is correct for its own single-write context (cross-referencing `subagent-execution`'s scoping rule).
- **branchCompleteGetsLocalFirstMergeAndCorrectedFraming (AC2)** — same shape for `branch-complete/SKILL.md`, plus its own explicit call-out that this write follows `/subagent-execution`'s and `/verify-completion`'s own accumulated local writes.
- **verifyCompletionGainsExplicitFetchSafetyStatement (AC3)** — asserts `verify-completion/SKILL.md` now contains a `Pipeline-state write safety` statement (previously absent entirely), explicitly instructing a local-only write (no fetch) at this pre-push checkpoint.
- **skillContractsGuardAllFourSections (AC4)** — parses `check-skill-contracts.js`'s own `CONTRACTS` array source for all 4 skill blocks and asserts each contains its new required-string marker.
- **skillContractsScriptActuallyPasses (AC4, integration)** — actually executes `node .github/scripts/check-skill-contracts.js` as a subprocess and asserts it reports `OK`, proving the contract entries are genuinely in sync with the live prose.
- **allFourFilesDescribeConsistentMergeDirection (AC5)** — asserts all 4 files' new instructions consistently describe merging the local entry *onto* the fetched master copy's other entries, never the reverse, using the same "never the reverse" / "not the fetched master copy's version of this story" framing.
- **subagentExecutionScopingRuleUntouched (non-regression)** — confirms the existing, already-correct 2026-08-23 "fetch at checkpoints, not per-task" scoping clarification text is still present, word-for-word, proving this story only adds to it rather than replacing it.
- **non-regression: existing sections untouched** — confirms pre-existing headings and mandatory-write language in all 4 files are still present.

---

## NFR Tests

No Performance/Security/Accessibility/Availability NFR tests — this story introduces no new code surface, only instruction text (per the story's own NFR framing, all "Not applicable" except Audit, which is addressed structurally by the fix itself rather than a separate test).

---

## Out of Scope for This Test Plan

- Actually exercising a real multi-write `/subagent-execution` run end-to-end to empirically prove no data loss occurs — would require a full second story driven through the inner loop; the story's own Architecture Constraints scope this to instruction-content correctness, matching the established precedent for SKILL.md-only changes (`evcg-s1`).
- Testing the CI-side workflow behaviour — unchanged by this story.
- The other 38 skills that write `pipeline-state.json` once, outside the inner coding loop — explicitly out of scope per the story's own Out of Scope section.

---

## Test Gaps and Risks

None.

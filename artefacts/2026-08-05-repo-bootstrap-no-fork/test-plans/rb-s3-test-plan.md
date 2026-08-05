## Test Plan: Generate harness-agnostic instruction files from one source

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s3-harness-agnostic-instructions.md
**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e1-no-fork-bootstrap-core.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Four instruction files generated, byte-identical from one source | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Drift-check validator confirms match / fails naming divergent file | 2 tests | — | — | — | — | 🟢 |
| AC3 | Verified rendered content matches across VS Code+Copilot, Cursor, Claude Code | — | — | — | 1 scenario | External-dependency | 🟡 |
| AC4 | Source change → all four regenerate, no staleness | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Confirming each harness actually *ingests and follows* its instruction file correctly | AC3 | External-dependency | This repo's test suite cannot observe VS Code+Copilot's, Cursor's, or Claude Code's internal instruction-consumption behaviour — only file content, which AC1/AC2 already cover automatically | Manual scenario — verify once per harness during implementation, documented in the PR, per the accepted finding in `decisions.md`/review report |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture source instruction-content string | Synthetic | None | |
| AC2 | Same fixture, plus a deliberately-corrupted copy of one target file | Synthetic | None | Simulates hand-editing |
| AC3 | N/A — manual scenario | — | — | — |
| AC4 | Fixture source content, modified between two assembly runs | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### assemblyGeneratesAllFourTargetFiles_fromOneSource

- **Verifies:** AC1
- **Precondition:** A fixture source content string; empty target directory
- **Action:** Run the extended `assemble-copilot-instructions.sh` logic (invoked via its Node wrapper for testability) against the fixture
- **Expected result:** `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and `.github/copilot-instructions.md` all exist and their content is byte-identical to each other and to the fixture source
- **Edge case:** No

### assemblyPreservesExistingBehaviourForGithubVcsType

- **Verifies:** AC1 (regression against existing ADR-005 behaviour)
- **Precondition:** `context.yml` declares `vcs.type: github`
- **Action:** Run assembly
- **Expected result:** `.github/copilot-instructions.md` is still generated exactly as `assemble-copilot-instructions.sh` already produces it today — this story's extension is additive, not a behavioural change to the existing GitHub path
- **Edge case:** No

### driftCheckPasses_whenAllFourFilesMatchSource

- **Verifies:** AC2
- **Precondition:** All four target files freshly generated from the same source, untouched
- **Action:** Run the drift-check validator
- **Expected result:** Exits 0, reports all files match
- **Edge case:** No

### driftCheckFails_whenOneFileHandEdited_namesWhichOne

- **Verifies:** AC2
- **Precondition:** All four files generated, then one (e.g. `.cursorrules`) is directly modified after generation
- **Action:** Run the drift-check validator
- **Expected result:** Exits non-zero; failure message names `.cursorrules` specifically, not a generic "drift detected" with no file identified
- **Edge case:** Yes — this is itself the edge-case-detection test

### sourceChangeTriggersRegenerationOfAllFour

- **Verifies:** AC4
- **Precondition:** All four files generated from source version 1
- **Action:** Change the source content to version 2, re-run assembly
- **Expected result:** All four target files now match source version 2 — none remain on version 1 content

---

## Integration Tests

### rbS3BuildsOnRbS1AndRbS2Output

- **Verifies:** AC1
- **Components involved:** `rb-s1`'s init-wrapper output, `rb-s2`'s full skill set, this story's assembly extension
- **Precondition:** A target directory already bootstrapped by `rb-s1` and `rb-s2`
- **Action:** Run the assembly extension against that directory
- **Expected result:** The single instruction file `rb-s1` seeded is replaced/extended into all four harness-specific files, referencing the real (not fixture) skill set `rb-s2` materialized

---

## NFR Tests

### assemblyAndDriftCheckOverheadUnder2Seconds

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing of the assembly + drift-check steps combined
- **Pass threshold:** < 2 seconds
- **Tool:** `console.time`/`console.timeEnd` wrapper in the test

---

## Out of Scope for This Test Plan

- Verifying VS Code+Copilot's, Cursor's, or Claude Code's actual internal behaviour when reading their respective instruction file — only that the file content is correct and identical (AC3 is manual-only, see Coverage gaps).
- Testing `assemble-copilot-instructions.sh`'s pre-existing GitHub-path behaviour beyond confirming no regression — that behaviour already has its own coverage from when ADR-005 was originally implemented.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3 (cross-harness rendering verification) | Not observable by this repo's own test suite | Manual verification scenario, one-time per harness during implementation, documented in the PR — per the accepted MEDIUM finding in the review report and `decisions.md` |

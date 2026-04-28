# Test Plan: Update `/checkpoint` to bridge `capture-log.md` entries to `workspace/learnings.md`

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.3.md
**Epic reference:** artefacts/2026-04-28-inflight-learning-capture/epics/ilc-e1.md
**Test plan author:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | /checkpoint reports count of new captures since last checkpoint | 3 tests | — | — | — | — | 🟢 |
| AC2 | Presents each entry's signal-type + signal-text for operator selection | 2 tests | — | — | — | — | 🟢 |
| AC3 | Promoted entries are appended to learnings.md with date + session-phase | 2 tests | — | — | — | — | 🟢 |
| AC4 | Reports "No new captures" when no new entries exist | 2 tests | — | — | — | — | 🟢 |
| AC5 | Skip promotion is non-blocking; capture-log is unmodified | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

**Implementation note (ilc.3 1-L3 — session boundary):** The session boundary mechanism — how `/checkpoint` determines which entries are "new since last checkpoint" — must be resolved at /implementation-plan before the coding agent begins. The most likely mechanism is comparing entry `date` values against the `lastUpdated` timestamp in `workspace/state.json` from the prior checkpoint write. Tests below are written against this mechanism. If a different mechanism is chosen, tests must be revised before implementation begins.

---

## Test Data Strategy

**Source:** Synthetic — tests construct minimal `workspace/capture-log.md` fixture strings and `workspace/state.json` fixture objects inline. Tests also read the actual `copilot-instructions.md` to verify the checkpoint bridge instruction text is present.
**PCI/sensitivity in scope:** No
**Availability:** Available now — fixture data is constructed in-test; `copilot-instructions.md` already exists (pre-implementation, checkpoint bridge text absent — tests fail)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture capture-log with 2 entries dated after synthetic lastUpdated | Synthetic in-test | None | Session boundary via date comparison |
| AC2 | Fixture entries with signal-type and signal-text fields | Synthetic in-test | None | |
| AC3 | Fixture promoted entries; temp learnings.md file | Synthetic in-test | None | |
| AC4 | Fixture capture-log with 0 entries after boundary; or empty file | Synthetic in-test | None | |
| AC5 | Fixture capture-log; simulate operator skip response | Synthetic in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `checkpoint-bridge-instruction-present` — copilot-instructions.md contains checkpoint bridge instruction

- **Verifies:** AC1 (instruction presence)
- **Precondition:** `copilot-instructions.md` exists at repo root (pre-implementation, does not contain bridge instruction)
- **Action:** Read `copilot-instructions.md`; assert the checkpoint convention block contains a reference to `workspace/capture-log.md` and the concept of promoting entries
- **Expected result:** Checkpoint section contains `workspace/capture-log.md` and describes reading captures for promotion
- **Edge case:** No

### `checkpoint-bridge-reports-count` — bridge instruction mentions reporting the count of new captures

- **Verifies:** AC1
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read the checkpoint bridge section; assert it contains language about reporting the number of new captures found — not silently skipping
- **Expected result:** Instruction states the agent must report count (e.g. "Report the count of new entries found")
- **Edge case:** No

### `checkpoint-no-new-captures-message` — bridge instruction specifies "No new captures" message for empty case

- **Verifies:** AC4
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read the checkpoint bridge section; assert it contains explicit instruction for the zero-capture case — the agent must report "No new captures" (or equivalent), not silently omit the check
- **Expected result:** Instruction contains the zero-capture message path
- **Edge case:** No

### `checkpoint-presents-signal-type-and-text` — bridge instruction requires showing signal-type and signal-text per entry

- **Verifies:** AC2
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read the checkpoint bridge section; assert it instructs the agent to show `signal-type` and `signal-text` for each entry before asking the operator to select
- **Expected result:** Both field names appear in the bridge instruction
- **Edge case:** No

### `checkpoint-promotion-preserves-date-session-phase` — bridge instruction requires date + session-phase in promoted entries

- **Verifies:** AC3
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read the checkpoint bridge section; assert it instructs the agent to include `date` and `session-phase` when appending to `workspace/learnings.md`
- **Expected result:** Both `date` and `session-phase` appear in the promotion instruction
- **Edge case:** No

### `checkpoint-promotion-target-learnings-md` — bridge instruction names workspace/learnings.md as the promotion target

- **Verifies:** AC3
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read the checkpoint bridge section; assert `workspace/learnings.md` is named as the promotion target
- **Expected result:** `workspace/learnings.md` is the only named promotion target
- **Edge case:** No

### `checkpoint-non-blocking-no-capture-log` — bridge is skipped gracefully when capture-log absent

- **Verifies:** AC4, AC5 + NFR Non-blocking
- **Precondition:** Construct a fixture session state where `workspace/capture-log.md` does not exist
- **Action:** Read the checkpoint bridge section; assert it instructs the agent to skip the bridge step gracefully (not error) if the file is absent, and to note the skip
- **Expected result:** Instruction contains the absent-file path: skip with a message like "capture-log.md not found — skipping capture review"
- **Edge case:** Yes — file absent vs file present with no new entries are distinct paths; both must be handled

### `checkpoint-skip-non-blocking` — skipping promotion does not interrupt checkpoint

- **Verifies:** AC5
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read the checkpoint bridge section; assert it explicitly states that skipping promotion (operator replies "skip" or "none") is non-blocking — the state write and closing sequence proceed
- **Expected result:** Instruction contains a skip path that flows through to the normal checkpoint completion
- **Edge case:** No

### `checkpoint-capture-log-unmodified-on-skip` — capture-log entries are not deleted after skip

- **Verifies:** AC5 (capture-log is not modified even if not promoted)
- **Precondition:** Fixture capture-log string with 2 entries
- **Action:** Simulate skip path (no promotion selected); assert capture-log content is unchanged
- **Expected result:** Capture-log is identical before and after a skip; no entries removed
- **Edge case:** No

### `checkpoint-bridge-word-count` — bridge instruction addition is ≤80 words

- **Verifies:** NFR — Instruction conciseness
- **Precondition:** `copilot-instructions.md` with bridge instruction added
- **Action:** Extract the bridge addition to the checkpoint convention block; count words; assert ≤80
- **Expected result:** Word count of the bridge addition is at most 80
- **Edge case:** No

---

## Integration Tests

No cross-component integration seams in scope. The bridge is an instruction-text addition to the existing `/checkpoint` convention in `copilot-instructions.md`. The relationship between the bridge instruction and the capture-log file is exercised by the unit tests using synthetic fixtures.

---

## NFR Tests

### `checkpoint-bridge-idempotent` — running checkpoint twice without new captures produces no duplicates

- **Verifies:** NFR — Idempotent
- **Precondition:** Fixture capture-log with 1 entry dated before the boundary; fixture learnings.md already containing that entry (simulating a prior promotion run)
- **Action:** Simulate running the bridge a second time; assert no duplicate entries are added to learnings.md
- **Expected result:** learnings.md contains the entry exactly once; second bridge run adds nothing
- **Edge case:** No

### `checkpoint-bridge-no-new-npm-dependencies` — no new packages added

- **Verifies:** NFR (implied — no new dependencies for instruction-only story)
- **Precondition:** `package.json` at repo root
- **Action:** Read `package.json`; assert `dependencies` and `devDependencies` are unchanged
- **Expected result:** No new entries in either dependency section
- **Edge case:** No

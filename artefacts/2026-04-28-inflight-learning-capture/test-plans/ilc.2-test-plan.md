# Test Plan: Weave agent self-recording instruction into `copilot-instructions.md` and key SKILL.md files

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.2.md
**Epic reference:** artefacts/2026-04-28-inflight-learning-capture/epics/ilc-e1.md
**Test plan author:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | copilot-instructions.md contains agent self-recording rule using agent-auto + decision signal-type | 2 tests | — | — | — | — | 🟢 |
| AC2 | Each covered SKILL.md has a capture reminder that references capture-log.md | 8 tests | — | — | — | — | 🟢 |
| AC3 | Agent-written entries use the 5-field schema from ilc.1 | 1 test | — | — | — | — | 🟢 |
| AC4 | Instruction does not mandate capture for every step (non-fabrication guard) | 1 test | — | — | — | — | 🟢 |
| AC5 | All 8 named SKILL.md files contain the capture reminder | 8 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Agent does not fabricate entries in routine sessions | AC4 | Untestable-by-nature | Cannot automate a "no signal-worthy event" session — requires subjective judgment | Manual scenario in verification script (flagged as low-risk advisory per review finding 1-L1) |

---

## Test Data Strategy

**Source:** Synthetic — tests read actual files from the repo (copilot-instructions.md, each of the 8 SKILL.md files). Pre-implementation, none of these files will contain the required instruction text — all tests will fail.
**PCI/sensitivity in scope:** No
**Availability:** Available now — all target files exist; tests fail because instruction text is absent pre-implementation
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Content of copilot-instructions.md | Read from repo root | None | Fails until self-recording rule added |
| AC2 | Content of each of 8 SKILL.md files | Read from .github/skills/ | None | Fails for each file until reminder added |
| AC3 | A synthetic agent-auto entry string with 5 fields | Synthetic constant | None | |
| AC4 | Content of copilot-instructions.md | Read from repo root | None | Checks instruction scopes capture to non-trivial events |
| AC5 | Content of each of 8 SKILL.md files | Read from .github/skills/ | None | Same files as AC2 |

### PCI / sensitivity constraints

None.

### Gaps

None — AC4's untestable aspect is handled as a manual scenario. All other ACs have automated coverage.

---

## Unit Tests

### `self-recording-instruction-present` — copilot-instructions.md contains the agent self-recording rule

- **Verifies:** AC1
- **Precondition:** `copilot-instructions.md` exists at repo root (pre-implementation, does not contain the rule)
- **Action:** Read `copilot-instructions.md`; assert it contains a phrase indicating the agent should write to `workspace/capture-log.md` without operator prompting (look for `agent-auto` or "write to `workspace/capture-log.md`" or equivalent)
- **Expected result:** The instruction is present and uses imperative wording (not "consider" or "may")
- **Edge case:** No

### `self-recording-instruction-word-count` — instruction addition is ≤60 words (NFR)

- **Verifies:** AC1, NFR — Instruction hygiene
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Extract the self-recording instruction block; count words; assert ≤60
- **Expected result:** Word count of the self-recording block is at most 60
- **Edge case:** No

### `self-recording-captures-non-trivial-only` — instruction scopes capture to non-trivial events

- **Verifies:** AC4 (automated portion — checks the instruction text includes a qualifier)
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read `copilot-instructions.md`; assert the self-recording rule contains a qualifier such as "non-trivial", "significant", "decision", "assumption", "pattern", or "gap" — not an unconditional "write after every step"
- **Expected result:** The instruction does not mandate capture for routine or trivial steps
- **Edge case:** No

### `skill-checkpoint-has-capture-reminder` — /checkpoint SKILL.md contains capture reminder

- **Verifies:** AC2, AC5
- **Precondition:** `.github/skills/checkpoint/SKILL.md` exists (pre-implementation, does not contain the reminder)
- **Action:** Read the file; assert it contains a visible reference to `workspace/capture-log.md`
- **Expected result:** File contains `workspace/capture-log.md` in a reminder or callout section
- **Edge case:** No

### `skill-definition-has-capture-reminder` — /definition SKILL.md contains capture reminder

- **Verifies:** AC2, AC5
- **Precondition:** `.github/skills/definition/SKILL.md` exists
- **Action:** Read the file; assert it contains a reference to `workspace/capture-log.md`
- **Expected result:** File contains `workspace/capture-log.md` in a capture reminder section
- **Edge case:** No

### `skill-review-has-capture-reminder` — /review SKILL.md contains capture reminder

- **Verifies:** AC2, AC5
- **Precondition:** `.github/skills/review/SKILL.md` exists
- **Action:** Read the file; assert it contains a reference to `workspace/capture-log.md`
- **Expected result:** File contains `workspace/capture-log.md` in a capture reminder section
- **Edge case:** No

### `skill-test-plan-has-capture-reminder` — /test-plan SKILL.md contains capture reminder

- **Verifies:** AC2, AC5
- **Precondition:** `.github/skills/test-plan/SKILL.md` exists
- **Action:** Read the file; assert it contains a reference to `workspace/capture-log.md`
- **Expected result:** File contains `workspace/capture-log.md` in a capture reminder section
- **Edge case:** No

### `skill-definition-of-ready-has-capture-reminder` — /definition-of-ready SKILL.md contains capture reminder

- **Verifies:** AC2, AC5
- **Precondition:** `.github/skills/definition-of-ready/SKILL.md` exists
- **Action:** Read the file; assert it contains a reference to `workspace/capture-log.md`
- **Expected result:** File contains `workspace/capture-log.md` in a capture reminder section
- **Edge case:** No

### `skill-tdd-has-capture-reminder` — /tdd SKILL.md contains capture reminder

- **Verifies:** AC2, AC5
- **Precondition:** `.github/skills/tdd/SKILL.md` exists
- **Action:** Read the file; assert it contains a reference to `workspace/capture-log.md`
- **Expected result:** File contains `workspace/capture-log.md` in a capture reminder section
- **Edge case:** No

### `skill-systematic-debugging-has-capture-reminder` — /systematic-debugging SKILL.md contains capture reminder

- **Verifies:** AC2, AC5
- **Precondition:** `.github/skills/systematic-debugging/SKILL.md` exists
- **Action:** Read the file; assert it contains a reference to `workspace/capture-log.md`
- **Expected result:** File contains `workspace/capture-log.md` in a capture reminder section
- **Edge case:** No

### `skill-implementation-review-has-capture-reminder` — /implementation-review SKILL.md contains capture reminder

- **Verifies:** AC2, AC5
- **Precondition:** `.github/skills/implementation-review/SKILL.md` exists
- **Action:** Read the file; assert it contains a reference to `workspace/capture-log.md`
- **Expected result:** File contains `workspace/capture-log.md` in a capture reminder section
- **Edge case:** No

### `skill-capture-reminder-references-signal-types` — each SKILL.md reminder references the 6 signal types

- **Verifies:** AC2, AC5 (the reminder must name or link to signal types per AC5)
- **Precondition:** All 8 SKILL.md files above have been read
- **Action:** For each file, assert the reminder section contains either the list of signal types or a reference to `workspace/capture-log.md` with the 6 valid values in the reminder text
- **Expected result:** All 8 files reference signal types (or delegate to the copilot-instructions.md rule which enumerates them)
- **Edge case:** No

### `agent-auto-entry-schema-complete` — a synthetic agent-auto entry contains all 5 fields

- **Verifies:** AC3
- **Precondition:** Synthetic entry string with all 5 fields including `source: agent-auto`
- **Action:** Parse the entry string; assert all 5 keys are present and `source` is `agent-auto`
- **Expected result:** `date`, `session-phase`, `signal-type`, `signal-text`, `source: agent-auto` all present
- **Edge case:** No

### `skill-reminder-word-count` — each SKILL.md reminder callout is ≤30 words

- **Verifies:** NFR — Instruction hygiene (≤30 words per callout)
- **Precondition:** All 8 SKILL.md files with capture reminder sections
- **Action:** Extract the capture reminder block from each file; count words; assert ≤30 per file
- **Expected result:** All 8 reminder blocks are at most 30 words each
- **Edge case:** No

---

## Integration Tests

No cross-component integration seams in scope. All changes are instruction-text additions to existing files. The relationship between the copilot-instructions.md rule and the SKILL.md callouts is an informational one (the SKILL.md reminds at a skill-specific trigger point; the copilot-instructions.md rule sets the global behaviour) — there is no runtime handoff to test.

---

## NFR Tests

### `self-recording-no-new-npm-dependencies` — no new packages added to package.json

- **Verifies:** NFR — No new npm dependencies
- **Precondition:** `package.json` at repo root
- **Action:** Read `package.json`; assert `dependencies` and `devDependencies` are unchanged from the pre-ilc.2 baseline
- **Expected result:** No new entries in either dependency section
- **Edge case:** No

### `self-recording-imperative-wording` — instruction uses imperative language, not "consider" or "may"

- **Verifies:** NFR — Wording precision
- **Precondition:** `copilot-instructions.md` at repo root
- **Action:** Extract the self-recording instruction block; assert it does NOT contain "consider", "may want to", "optionally", or "if appropriate" — it must use imperative form ("Write to", "Append to", "Record")
- **Expected result:** No hedging language present in the instruction block
- **Edge case:** No

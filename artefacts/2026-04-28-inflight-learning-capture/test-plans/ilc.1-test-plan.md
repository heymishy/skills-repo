# Test Plan: Define `workspace/capture-log.md` schema and `/capture` operator command

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.1.md
**Epic reference:** artefacts/2026-04-28-inflight-learning-capture/epics/ilc-e1.md
**Test plan author:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | /capture creates file with all 5 required fields | 3 tests | — | — | — | — | 🟢 |
| AC2 | Subsequent /capture appends without modifying existing entries | 2 tests | — | — | — | — | 🟢 |
| AC3 | Entry always contains source=operator-manual | 1 test | — | — | — | — | 🟢 |
| AC4 | Bare /capture prompts before writing | 1 test | — | — | — | — | 🟢 |
| AC5 | New-session invocation appends, never truncates | 2 tests | — | — | — | — | 🟢 |
| AC6 | workspace/capture-log.md is in .gitignore | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read the actual `copilot-instructions.md` and `.gitignore` from the repo root, and construct minimal fixture append-log strings inline.
**PCI/sensitivity in scope:** No
**Availability:** Available now — files exist (copilot-instructions.md pre-implementation will not contain the /capture instruction; tests are written to fail until implementation lands)
**Owner:** Self-contained — tests generate synthetic log content in setup

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Content of copilot-instructions.md post-implementation | Read from repo root | None | Fails until /capture instruction added |
| AC2 | Two successive append operations on a temp file | Synthetic in-test | None | |
| AC3 | A single /capture entry as a string | Synthetic constant | None | |
| AC4 | Content of copilot-instructions.md — check for blank-entry guard | Read from repo root | None | Fails until instruction includes prompt-guard |
| AC5 | Two successive write cycles on a temp file (simulating new session) | Synthetic in-test | None | |
| AC6 | Content of .gitignore in repo root | Read from repo root | None | Fails until .gitignore entry added |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `capture-instruction-present` — copilot-instructions.md contains /capture command description

- **Verifies:** AC1 (instruction presence is prerequisite to agent creating the file)
- **Precondition:** `copilot-instructions.md` exists at repo root (pre-implementation, does not contain `/capture` instruction)
- **Action:** Read `copilot-instructions.md`; assert it contains the string `/capture` as a described operator command
- **Expected result:** File contains `/capture` as a named command in the session conventions or operator commands section
- **Edge case:** No

### `capture-schema-five-fields` — instruction specifies all 5 required fields

- **Verifies:** AC1 (schema completeness)
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read `copilot-instructions.md`; assert it names all five fields: `date`, `session-phase`, `signal-type`, `signal-text`, `source`
- **Expected result:** All five field names appear in the /capture instruction block
- **Edge case:** No

### `capture-signal-types-enumerated` — instruction lists all 6 valid signal-type values

- **Verifies:** AC1 (signal-type constraint)
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read `copilot-instructions.md`; assert it enumerates `decision`, `learning`, `assumption-validated`, `assumption-invalidated`, `pattern`, `gap` as valid signal-type values
- **Expected result:** All 6 values appear in the /capture instruction text
- **Edge case:** No

### `capture-append-preserves-existing` — second /capture write does not modify earlier entries

- **Verifies:** AC2
- **Precondition:** A temp file exists containing one synthetic capture entry (simulated prior write)
- **Action:** Simulate appending a second entry to the file; read the file; assert the first entry is unchanged and the second entry appears after it
- **Expected result:** File has exactly 2 entries; first entry text is byte-identical to the original
- **Edge case:** No

### `capture-append-no-truncate` — append operation does not truncate the file

- **Verifies:** AC2, AC5
- **Precondition:** A temp file with 3 pre-existing synthetic entries
- **Action:** Append a 4th entry; read the file; assert line count ≥ expected minimum
- **Expected result:** File contains all 4 entries; byte count is strictly greater than before the append
- **Edge case:** No

### `capture-source-operator-manual` — entry written via /capture has source=operator-manual

- **Verifies:** AC3
- **Precondition:** Synthetic entry string constructed with all 5 fields
- **Action:** Parse the entry string; assert `source` field value is exactly `operator-manual`
- **Expected result:** `source: operator-manual` present in the entry
- **Edge case:** No

### `capture-blank-guard` — copilot-instructions.md requires signal text before writing

- **Verifies:** AC4
- **Precondition:** `copilot-instructions.md` exists at repo root
- **Action:** Read `copilot-instructions.md`; assert the /capture instruction contains text indicating the agent must prompt for signal text if none is provided (look for "prompt" or "ask" or "require" adjacent to "blank" or "empty" or "no signal text")
- **Expected result:** Instruction contains an explicit guard against writing a blank entry
- **Edge case:** No

### `capture-new-session-appends` — entries from prior session are preserved on new invocation

- **Verifies:** AC5
- **Precondition:** A temp file with 2 synthetic entries; simulate session boundary by re-invoking /capture logic
- **Action:** Append a 3rd entry as if from a new session; read the file; assert original 2 entries still present
- **Expected result:** File contains 3 entries; first 2 are unchanged
- **Edge case:** No

### `capture-new-session-no-overwrite` — new-session invocation never empties the file

- **Verifies:** AC5
- **Precondition:** A temp file with at least 1 synthetic entry
- **Action:** Call the append path a second time with a new entry; assert the file is not empty and the original entry is present
- **Expected result:** File size increases; original content retained
- **Edge case:** No

### `gitignore-excludes-capture-log` — workspace/capture-log.md is listed in .gitignore

- **Verifies:** AC6
- **Precondition:** `.gitignore` exists at repo root (pre-implementation, will not contain the entry)
- **Action:** Read `.gitignore`; assert it contains `workspace/capture-log.md` (exact path) or a wildcard pattern that matches it (e.g. `workspace/*.md` or `workspace/`)
- **Expected result:** The path `workspace/capture-log.md` is excluded from git tracking
- **Edge case:** Check that any wildcard pattern would actually match `workspace/capture-log.md` — do not accept a pattern that only matches the directory

---

## Integration Tests

No integration seams in scope for this story. The `/capture` command is a pure instruction-text addition; the file append behaviour is exercised by the unit tests above using synthetic file I/O.

---

## NFR Tests

### `capture-append-no-parser-dependency` — implementation uses only Node.js built-ins

- **Verifies:** NFR — No external dependencies
- **Precondition:** `package.json` at repo root
- **Action:** Read `package.json`; assert no new dependencies were added in the implementation of this story (compare dependency count before and after, or assert specific packages are not present)
- **Expected result:** `dependencies` and `devDependencies` sections do not contain any new entries attributable to ilc.1
- **Edge case:** No

### `capture-entry-is-plain-markdown` — capture-log entries are plain text, no schema validation required

- **Verifies:** NFR — Portability
- **Precondition:** A synthetic capture-log entry string
- **Action:** Assert the entry can be parsed/read with `fs.readFileSync` (no special parser needed)
- **Expected result:** Entry is readable as a plain string; no JSON.parse or YAML parse required
- **Edge case:** No

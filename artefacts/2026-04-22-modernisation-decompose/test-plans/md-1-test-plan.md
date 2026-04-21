# Test Plan: Write `/modernisation-decompose` SKILL.md

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-1-skill-md.md
**Epic reference:** artefacts/2026-04-22-modernisation-decompose/epics/e1-modernisation-pipeline-bridging.md
**Test plan author:** Copilot
**Date:** 2026-04-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | SKILL.md passes check-skill-contracts.js with 0 failures | — | 2 tests | — | — | — | 🟢 |
| AC2 | Entry condition detects rev-eng report and blocks gracefully if absent | 2 tests | — | — | 1 scenario | Untestable-by-nature (agent invocation) | 🟡 |
| AC3 | Java boundary signals surfaced per feature boundary | 2 tests | — | — | 1 scenario | Untestable-by-nature (agent invocation) | 🟡 |
| AC4 | corpus-state.md written with coverage %, VERIFIED:UNCERTAIN ratio, lastRunAt | 2 tests | — | — | 1 scenario | Untestable-by-nature (agent invocation) | 🟡 |
| AC5 | candidate-features.md entry format contains all required fields | 2 tests | — | — | 1 scenario | Untestable-by-nature (agent invocation) | 🟡 |
| AC6 | Low-signal escalation surfaces 3 named options | 2 tests | — | — | 1 scenario | Untestable-by-nature (agent invocation) | 🟡 |
| AC7 | umbrellaMetric field and note present in candidate-features.md instructions | 2 tests | — | — | 1 scenario | Untestable-by-nature (agent invocation) | 🟡 |

**Note on test approach:** A SKILL.md is a Markdown instruction document for an AI agent — not executable code. Unit tests verify structural content (does the file contain the required sections and signals?). The "invocation behaviour" ACs (AC2–AC7) also have manual verification scenarios for end-to-end confirmation that an AI agent following the instructions produces the correct output.

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in automated test | Handling |
|-----|----|----------|------------------------------------|---------|
| Agent invocation produces correct boundary signal output | AC3 | Untestable-by-nature | Cannot automate AI agent execution in CI | Manual scenario in verification script 🟡 |
| Agent invocation writes corpus-state.md correctly | AC4 | Untestable-by-nature | Cannot automate AI agent execution in CI | Manual scenario in verification script 🟡 |
| Agent invocation produces correct candidate-features.md format | AC5 | Untestable-by-nature | Cannot automate AI agent execution in CI | Manual scenario in verification script 🟡 |
| Agent invocation triggers low-signal escalation | AC6 | Untestable-by-nature | Cannot automate AI agent execution in CI | Manual scenario in verification script 🟡 |
| Agent invocation includes umbrellaMetric note | AC7 | Untestable-by-nature | Cannot automate AI agent execution in CI | Manual scenario in verification script 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — tests read file content from `.github/skills/modernisation-decompose/SKILL.md` and use static fixture inputs.
**PCI/sensitivity in scope:** No
**Availability:** Available once SKILL.md is created by implementation
**Owner:** Self-contained — tests read the implemented file

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | SKILL.md file at `.github/skills/modernisation-decompose/SKILL.md` | File system | None | Created during implementation |
| AC2 | SKILL.md content text | File read | None | Check for entry condition section text |
| AC3 | SKILL.md content text | File read | None | Check for Java signal keywords |
| AC4 | SKILL.md content text | File read | None | Check for corpus-state.md write instructions |
| AC5 | SKILL.md content text | File read | None | Check for candidate-features.md field list |
| AC6 | SKILL.md content text | File read | None | Check for three escalation options |
| AC7 | SKILL.md content text | File read | None | Check for umbrellaMetric field instruction |

### PCI / sensitivity constraints

None.

### Gaps

None — all tests are self-contained content checks once the SKILL.md is implemented.

---

## Unit Tests

### SKILL.md file exists at the correct governance path

- **Verifies:** AC1
- **Precondition:** Implementation complete — SKILL.md committed to `.github/skills/modernisation-decompose/SKILL.md`
- **Action:** `fs.existsSync('.github/skills/modernisation-decompose/SKILL.md')`
- **Expected result:** `true`
- **Edge case:** No

### SKILL.md contains all required structural sections for skill-contracts.js

- **Verifies:** AC1
- **Precondition:** SKILL.md exists at the governance path
- **Action:** Read file content; assert presence of: YAML frontmatter with `name:`, `description:`, `triggers:`; at least one numbered step heading; `## Completion output` section; `## State update — mandatory final step` section
- **Expected result:** All 5 structural markers present in content
- **Edge case:** No

### SKILL.md entry condition section explicitly checks for reverse-engineering report file

- **Verifies:** AC2
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert it contains text referencing `reverse-engineering-report.md` or equivalent in an entry condition check context
- **Expected result:** File contains a check for the source report file existence
- **Edge case:** No

### SKILL.md entry condition section includes explicit block/error message for missing report

- **Verifies:** AC2
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert content contains language describing a block or error message when no reverse-engineering report is found (e.g. contains "❌" or "error" or "not found" in proximity to the entry condition section)
- **Expected result:** File contains graceful-failure language in the entry condition block
- **Edge case:** No

### SKILL.md references all four Java boundary signal types

- **Verifies:** AC3
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert all four of the following appear: `Maven module`, `@Service`, `JPA aggregate root` (or `aggregate root`), `@Transactional`
- **Expected result:** All four signal types are named in the file
- **Edge case:** No

### SKILL.md describes using boundary signals as stated rationale per feature boundary

- **Verifies:** AC3
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert content contains language that connects boundary signals to the rationale field of a feature boundary (e.g. "rationale", "stated rationale", "boundary signal")
- **Expected result:** File describes using signals as the rationale, not just listing them
- **Edge case:** No

### SKILL.md state update section describes writing corpus-state.md with module coverage percentage

- **Verifies:** AC4
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert `corpus-state.md` is mentioned in the state update section with reference to module coverage percentage
- **Expected result:** `corpus-state.md` and coverage percentage are co-located in the state update section
- **Edge case:** No

### SKILL.md state update section includes VERIFIED:UNCERTAIN ratio and lastRunAt in corpus-state.md write instructions

- **Verifies:** AC4
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert `[VERIFIED]` (or `VERIFIED`) ratio and `lastRunAt` are both described in the corpus-state.md write instructions
- **Expected result:** Both fields present in write instructions
- **Edge case:** No

### SKILL.md candidate-features.md format describes all five required entry fields

- **Verifies:** AC5
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert all five field names appear in candidate-features.md format description: feature slug, problem statement, rule ID(s), persona, MVP scope paragraph
- **Expected result:** All five fields described in the output format section
- **Edge case:** No

### SKILL.md candidate-features.md format states entries are sufficient for direct use in /discovery

- **Verifies:** AC5
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert content states or implies that candidate feature entries can be used directly in `/discovery` without manual augmentation
- **Expected result:** Direct-use language present in format description
- **Edge case:** No

### SKILL.md low-signal escalation section names the specific missing signals

- **Verifies:** AC6
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert the low-signal escalation section exists and references specific missing signal examples (e.g. Maven, @Service, circular)
- **Expected result:** Escalation section present with specific signal references
- **Edge case:** No

### SKILL.md low-signal escalation section offers exactly three options to the operator

- **Verifies:** AC6
- **Precondition:** SKILL.md exists
- **Action:** Read file content; in the low-signal section, assert three numbered options are present: (1) package-level fallback, (2) manual boundary input from operator, (3) abort and record as low-signal
- **Expected result:** Three distinct options present in escalation section
- **Edge case:** No

### SKILL.md completion output section instructs writing umbrellaMetric field in every candidate feature entry

- **Verifies:** AC7
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert `umbrellaMetric` appears in the completion output or output format section describing candidate-features.md
- **Expected result:** `umbrellaMetric` field referenced in output instructions
- **Edge case:** No

### SKILL.md completion output section includes reference to umbrella parity metric note text

- **Verifies:** AC7
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert content in the completion/output section includes language about "This feature was produced by /modernisation-decompose" note or equivalent umbrella metric traceability note
- **Expected result:** Traceability note instruction present in output section
- **Edge case:** No

---

## Integration Tests

### npm test passes with 0 failures after SKILL.md is committed

- **Verifies:** AC1
- **Precondition:** `.github/skills/modernisation-decompose/SKILL.md` exists and is committed; `check-skill-contracts.js` has been updated (md-2 complete)
- **Action:** Run `npm test` from repo root
- **Expected result:** Exit code 0; output includes `[skill-contracts] 38 skill(s)` (or equivalent count including new skill); 0 contract failures
- **Edge case:** No

### npm test still passes for all pre-existing 37 skills after SKILL.md is added

- **Verifies:** AC1 (regression guard)
- **Precondition:** SKILL.md committed and md-2 contracts registered
- **Action:** Run `npm test` and check skill-contracts output
- **Expected result:** All previously passing skills still pass — no regressions
- **Edge case:** No

---

## NFR Tests

### Heuristics determinism — SKILL.md defines explicit signal priority order

- **Verifies:** NFR Consistency (deterministic outputs)
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert the decomposition step section describes a defined priority order for boundary signals (not "use any available signal")
- **Expected result:** Priority order explicitly stated — e.g. Maven module > @Service > JPA aggregate root > @Transactional span
- **Edge case:** No

### Security — corpus-state.md write instructions do not reference business rules or customer data

- **Verifies:** NFR Security
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert the corpus-state.md write instructions describe only metrics (counts, ratios, timestamps) and do not instruct writing raw rule text, customer identifiers, or regulatory clause text
- **Expected result:** Write instructions reference counts/ratios/timestamps only
- **Edge case:** No

### Audit — corpus-state.md write instructions include lastRunAt timestamp

- **Verifies:** NFR Audit
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert `lastRunAt` is explicitly named in the corpus-state.md write instructions
- **Expected result:** `lastRunAt` field present in write instructions
- **Edge case:** No (overlaps with AC4 — included here for NFR completeness)

---

## Gap table — summary

| Gap | AC | Gap type | Handling |
|-----|----|----------|---------|
| Agent invocation produces correct boundary signal output | AC3 | Untestable-by-nature | Manual scenario — see verification script |
| Agent invocation writes corpus-state.md correctly | AC4 | Untestable-by-nature | Manual scenario — see verification script |
| Agent invocation produces correct candidate-features.md format | AC5 | Untestable-by-nature | Manual scenario — see verification script |
| Agent invocation triggers low-signal escalation correctly | AC6 | Untestable-by-nature | Manual scenario — see verification script |
| Agent invocation includes umbrellaMetric note | AC7 | Untestable-by-nature | Manual scenario — see verification script |

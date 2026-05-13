# Test Plan: Evaluate MCP tool-boundary enforcement (Spike B1)

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b1.md
**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Review report:** artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-b1-review-1.md (PASS — 0H, 1M, 2L)
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Spike output exists with valid verdict + ≥3-sentence rationale + observable test evidence (hash-verifiable trace) | 4 tests | — | — | — | — | 🟢 |
| AC2 | C11 compliance status explicitly stated; if violated, mitigation proposed | 2 tests | — | — | 1 scenario | — | 🟢 |
| AC3 | P1–P4 fidelity properties each stated as SATISFIED / PARTIAL / NOT MET | 2 tests | — | — | — | — | 🟢 |
| AC4 | Verdict in pipeline-state.json spike record + ADR in decisions.md | 3 tests | — | — | — | — | 🟢 |
| AC5 | p4.enf-mcp references both Spike A and Spike B1 output as architecture inputs | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | — | — |

---

## Test Data Strategy

**Source:** Fixtures — static files representing valid spike output artefacts for both PROCEED and non-PROCEED paths.
**PCI/sensitivity in scope:** No
**Availability:** Fixtures created in `tests/fixtures/spike-b1/` as part of implementation.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `spikes/spike-b1-output.md` written by operator | Operator investigation | None | Must exist before tests pass |
| AC2 | Same artefact — C11 section | Real artefact | None | |
| AC3 | Same artefact — P1–P4 fidelity table | Real artefact | None | |
| AC4 | `.github/pipeline-state.json`; `decisions.md` | Real files | None | |
| AC5 | `stories/p4-enf-mcp.md` | Real story file | None | |

### PCI / sensitivity constraints

None. Note: MC-SEC-02 requires the spike artefact not contain Azure/M365 credentials — verified by T-NFR1.

### Gaps

None.

---

## Unit Tests

All tests in `tests/check-p4-spike-b1.js`.

### T1 — Spike output file exists

- **Verifies:** AC1
- **Precondition:** Spike investigation complete
- **Action:** `fs.existsSync('artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b1-output.md')`
- **Expected result:** `true`
- **Edge case:** No

### T2 — Contains valid verdict

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Scan for PROCEED/REDESIGN/DEFER/REJECT
- **Expected result:** Exactly one valid verdict found
- **Edge case:** Yes — multiple conflicting verdicts

### T3 — Rationale has ≥3 sentences

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Extract rationale text; count sentence-ending punctuation
- **Expected result:** ≥3 sentences
- **Edge case:** Yes — rationale present but only 1–2 sentences

### T4 — Evidence of at least 1 hash-verifiable trace entry

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Scan for terms `hash`, `trace`, and either `SATISFIED`, `PARTIAL`, or evidence block (e.g. "invocation", "test run", "observed") in the artefact
- **Expected result:** All three present — spike is not purely speculative
- **Edge case:** Yes — verdict is PROCEED but no observable test evidence recorded

### T5 — C11 compliance status explicitly stated

- **Verifies:** AC2
- **Precondition:** T1 passes
- **Action:** Search for `C11` in content; check adjacent text for `satisfied`, `violated`, `compliant`, `non-compliant`, `persistent`, or `no persistent`
- **Expected result:** C11 mention with explicit compliance outcome
- **Edge case:** Yes — C11 mentioned in passing (architecture constraints boilerplate) but no verdict on compliance

### T6 — If C11 violated, mitigation proposed

- **Verifies:** AC2
- **Precondition:** T5 passes; C11 compliance text contains `violated` or `non-compliant` or `persistent process required`
- **Action:** Check for a mitigation section (sidecar process, VS Code extension, REDESIGN)
- **Expected result:** At least one mitigation described; or verdict is REDESIGN/DEFER
- **Edge case:** Yes — C11 violation noted but no mitigation or verdict change

### T7 — P1 through P4 fidelity properties all stated

- **Verifies:** AC3
- **Precondition:** T1 passes
- **Action:** Check for each of P1, P2, P3, P4 with one of SATISFIED/PARTIAL/NOT MET
- **Expected result:** All four found with a verdict
- **Edge case:** Yes — only 3 of 4 stated; P-labels absent but properties described by name

### T8 — pipeline-state.json spike-b1 entry with valid verdict

- **Verifies:** AC4
- **Precondition:** pipeline-state.json parseable
- **Action:** Navigate to phase4 → spikes → spike-b1 (or p4-spike-b1); check `verdict` field
- **Expected result:** Verdict present and matches one of the four valid values
- **Edge case:** Yes — spike-a entry exists but spike-b1 absent

### T9 — pipeline-state.json verdict matches artefact verdict

- **Verifies:** AC4
- **Precondition:** T2 and T8 pass
- **Action:** Compare extracted artefact verdict with pipeline-state.json spike record verdict
- **Expected result:** Same string value
- **Edge case:** Yes — stale write

### T10 — decisions.md has a Spike B1 ARCH entry with required fields

- **Verifies:** AC4
- **Precondition:** decisions.md exists
- **Action:** Find `| ARCH |` category entries mentioning `spike.?b1\b`; check for Decision, Alternatives considered, Rationale, Revisit trigger
- **Expected result:** All four fields present in the Spike B1 entry
- **Edge case:** Yes — entry exists but lacks one field

### T11 — p4.enf-mcp references Spike A output

- **Verifies:** AC5
- **Precondition:** p4-enf-mcp.md exists
- **Action:** Scan for `spike-a` or `spike_a` or `spike a` in the file
- **Expected result:** Reference present
- **Edge case:** Story not yet written — test should skip gracefully

### T12 — p4.enf-mcp references Spike B1 output

- **Verifies:** AC5
- **Precondition:** p4-enf-mcp.md exists
- **Action:** Scan for `spike-b1` or `spike_b1` or `spike b1`
- **Expected result:** Reference present
- **Edge case:** Same as T11

---

## NFR Tests

### T-NFR1 — No credentials in spike-b1-output.md (MC-SEC-02)

- **Verifies:** NFR Security
- **Precondition:** T1 passes
- **Action:** Strip code blocks; scan for credential-shaped strings (sk-, ghp_, Bearer, token:, api_key, password)
- **Expected result:** No matches outside code blocks
- **Edge case:** Yes — prototype includes Azure bot registration fields with real tenant IDs

---

## Test file

**Test file:** `tests/check-p4-spike-b1.js`
**Expected baseline:** All tests FAIL before spike artefact is written.

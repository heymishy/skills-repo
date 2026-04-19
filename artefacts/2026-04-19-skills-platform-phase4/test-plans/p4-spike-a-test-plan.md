# Test Plan: Determine whether governance logic is extractable into a shared package (Spike A)

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-a.md
**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Review report:** artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-a-review-1.md (PASS — 0H, 1M, 2L)
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Spike output artefact exists at correct path with valid verdict + ≥3-sentence rationale | 3 tests | — | — | — | — | 🟢 |
| AC2 | PROCEED verdict: artefact defines candidate package interface with all 5 function signatures/shapes | 2 tests | — | — | 1 scenario | — | 🟢 |
| AC3 | REDESIGN verdict: artefact defines the blocking constraint and minimum shared contract (skill-format + trace-schema) | 2 tests | — | — | 1 scenario | — | 🟢 |
| AC4 | Verdict written to pipeline-state.json under spike record AND decisions.md entry exists with required fields | 3 tests | — | — | — | — | 🟢 |
| AC5 | No E3 story may enter DoR without referencing Spike A output as architecture input | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | — | — |

---

## Test Data Strategy

**Source:** Fixtures — static markdown files committed to the test repo representing valid and invalid spike output artefacts.
**PCI/sensitivity in scope:** No
**Availability:** Fixtures to be created in `tests/fixtures/spike-a/` as part of this story's implementation.
**Owner:** Self-contained — tests generate fixture paths and validate content at runtime.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Spike output artefact at `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md` | Written by operator during spike investigation | None | File must exist before test passes |
| AC2 | PROCEED-path fixture with interface definitions for all 5 functions | Fixture or real artefact | None | Test validates field presence, not implementation quality |
| AC3 | REDESIGN-path fixture with blocking constraint and minimum shared contract | Fixture or real artefact | None | Test validates field presence |
| AC4 | `.github/pipeline-state.json` with spike record; `artefacts/2026-04-19-skills-platform-phase4/decisions.md` with entry | Real files, updated during spike | None | Tests read live files |
| AC5 | Story files for p4-enf-package, p4-enf-mcp, p4-enf-cli, p4-enf-schema | Real story artefacts in stories/ | None | Validates DoR pre-check field |

### PCI / sensitivity constraints

None.

### Gaps

None — test data is artefact-driven (file content) and self-contained. Spike output artefact (AC1–AC3) must be written by the operator before the story can pass its tests.

---

## Unit Tests

All tests implemented in `tests/check-p4-spike-a.js` using Node.js built-ins only. Pattern follows existing `check-*.js` governance scripts.

---

### T1 — Spike output file exists at declared path

- **Verifies:** AC1
- **Precondition:** Spike investigation complete; operator has written artefact to `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`
- **Action:** `fs.existsSync('artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md')`
- **Expected result:** Returns `true`
- **Edge case:** No — path is fixed

---

### T2 — Spike output contains a valid verdict label

- **Verifies:** AC1
- **Precondition:** File exists (T1 passes)
- **Action:** Read file content; check for a line matching `/^\*\*Verdict:\*\*\s+(PROCEED|REDESIGN|DEFER|REJECT)/m` or `/(PROCEED|REDESIGN|DEFER|REJECT)/`
- **Expected result:** Exactly one of the four valid values found in the document as a top-level labelled field
- **Edge case:** Yes — file exists but verdict field missing; file has an unrecognised verdict string

---

### T3 — Rationale is at least 3 sentences

- **Verifies:** AC1
- **Precondition:** File exists (T1 passes)
- **Action:** Extract the rationale section; split on sentence-ending punctuation (`. `, `! `, `? `); count sentences
- **Expected result:** Count ≥ 3
- **Edge case:** Yes — rationale section present but only 1–2 sentences

---

### T4 — PROCEED verdict: interface section contains all 5 required function shapes

- **Verifies:** AC2
- **Precondition:** File exists and verdict is PROCEED
- **Action:** Read file; check for each of the five required terms: `skill-resolution` (or `skillResolution`), `hash-verification` (or `hashVerification`), `gate-evaluation` (or `gateEvaluation`), `state-advancement` (or `stateAdvancement`), `trace-writing` (or `traceWriting`) in the interface/signature section
- **Expected result:** All five terms present
- **Edge case:** Yes — only 3–4 of 5 terms present; terms present but not in a defined interface section

---

### T5 — PROCEED verdict: interface definitions are precise enough to evaluate (have at least 1 named parameter or return shape per function)

- **Verifies:** AC2
- **Precondition:** File exists and verdict is PROCEED and T4 passes
- **Action:** For each of the 5 required functions, check that the surrounding text includes at least one of: `(params)`, `=>`, `: {`, argument/return description within 3 lines of the function name
- **Expected result:** All 5 functions have at least a minimal signature or contract shape
- **Edge case:** Yes — function names listed as headings with no detail

---

### T6 — REDESIGN verdict: blocking constraint is explicitly named

- **Verifies:** AC3
- **Precondition:** File exists and verdict is REDESIGN
- **Action:** Read file; check for a section headed (or labelled) "Blocking constraint" or "Constraint" containing at least one sentence identifying a specific technical reason (runtime, lifecycle, etc.)
- **Expected result:** Section present with named constraint
- **Edge case:** Yes — section absent; constraint described vaguely without a specific reason

---

### T7 — REDESIGN verdict: minimum shared contract includes skill-format and trace-schema

- **Verifies:** AC3
- **Precondition:** File exists and verdict is REDESIGN
- **Action:** Read file; check for presence of both `skill-format` (or `skill format`) and `trace-schema` (or `trace schema`) in the minimum shared contract section
- **Expected result:** Both terms present
- **Edge case:** Yes — only one of the two present

---

### T8 — pipeline-state.json contains a spike record for spike-a

- **Verifies:** AC4
- **Precondition:** `pipeline-state.json` exists and is valid JSON
- **Action:** Read and parse `.github/pipeline-state.json`; navigate to the Phase 4 feature entry; check for `spikes` or `spikeRecords` array/object containing an entry with id `spike-a` (or `p4-spike-a`) and a `verdict` field matching one of the four valid values
- **Expected result:** Spike record found with a valid verdict value
- **Edge case:** Yes — feature entry exists but spikes field absent; spikes field is an empty array

---

### T9 — pipeline-state.json spike record verdict matches artefact verdict

- **Verifies:** AC4
- **Precondition:** T8 passes; T2 passes
- **Action:** Extract verdict from artefact (T2 logic); extract verdict from pipeline-state.json spike record (T8 logic); compare
- **Expected result:** Both values are the same string
- **Edge case:** Yes — artefact verdict is PROCEED but pipeline-state.json has REDESIGN (stale write)

---

### T10 — decisions.md contains a post-spike ADR entry with required fields

- **Verifies:** AC4
- **Precondition:** `artefacts/2026-04-19-skills-platform-phase4/decisions.md` exists
- **Action:** Read file; check for an entry referencing "Spike A" or "spike-a" that contains all four required sections: a decision statement, alternatives considered, rationale, and revisit trigger
- **Expected result:** Entry found with all four fields present
- **Edge case:** Yes — entry exists but one or more sections are absent or contain placeholder text

---

### T11 — E3 story p4-enf-package references Spike A output as architecture input

- **Verifies:** AC5
- **Precondition:** `artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-package.md` exists
- **Action:** Read file; check for a reference to `spike-a-output.md` or `spike-a` in the Dependencies or Architecture sections
- **Expected result:** Reference present
- **Edge case:** Yes — story exists but no spike reference; story not yet written (valid before spike is complete — test should skip gracefully)

---

### T12 — E3 story p4-enf-mcp references Spike A output as architecture input

- **Verifies:** AC5
- **Precondition:** `artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-mcp.md` exists
- **Action:** Same as T11 for p4-enf-mcp.md
- **Expected result:** Reference present
- **Edge case:** Same as T11

---

## Integration Tests

None identified. This story produces a design artefact and pipeline state updates — there are no system-to-system handoffs to integration-test. AC4's pipeline-state.json → decisions.md consistency check (T9) is the closest integration concern and is handled in unit tests above.

---

## NFR Tests

**NFR — Security (MC-SEC-02):** Spike output artefact must not include API keys, tokens, or production secrets.

### T-NFR1 — Spike output artefact contains no credential-shaped strings

- **Verifies:** NFR — Security (MC-SEC-02)
- **Precondition:** Spike output artefact exists
- **Action:** Read file content; scan for patterns matching common credential shapes: `sk-`, `ghp_`, `Bearer `, `token:`, `api_key`, `password:`, strings matching `[A-Za-z0-9+/]{40,}` (base64-like long strings in non-code sections)
- **Expected result:** No matches found
- **Edge case:** Yes — artefact includes example or placeholder credential strings in a code block

---

**NFR — Audit:** Spike verdict written to both spike artefact and pipeline-state.json; decisions.md entry mandatory.

Covered by T8, T9, T10 above.

---

## Gap table

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | — | — |

---

## Test file

**Test file:** `tests/check-p4-spike-a.js`
**Run command:** `node tests/check-p4-spike-a.js`
**Expected baseline:** All 12 unit tests + T-NFR1 FAIL before spike investigation is run (spike output artefact does not yet exist). Tests fail cleanly with file-not-found or assertion failure — no test crashes.

# Test Plan: Evaluate Craig's CLI MVP as reference implementation (Spike B2)

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b2.md
**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Review report:** artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-b2-review-1.md (PASS — 0H, 1M, 2L)
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Spike output exists; records Craig's artefacts were read as inputs | 3 tests | — | — | — | — | 🟢 |
| AC2 | P1–P4 fidelity properties stated as SATISFIED / PARTIAL / NOT MET for CLI | 2 tests | — | — | — | — | 🟢 |
| AC3 | Assumption A2 (assurance gate accepts CLI trace) explicitly validated, outcome recorded | 2 tests | — | — | 1 scenario | — | 🟢 |
| AC4 | Verdict in spike artefact + pipeline-state.json + ADR in decisions.md (the mechanism-selection ADR for CLI) | 3 tests | — | — | — | — | 🟢 |
| AC5 | p4.enf-cli references Spike A, Spike B2 output, AND Craig's artefacts as source | 3 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | — | — |

---

## Test Data Strategy

**Source:** Fixtures for unit tests; real artefact files for integration-adjacent checks (pipeline-state.json, decisions.md, story files).
**PCI/sensitivity in scope:** No
**Availability:** Spike artefact written by operator. All other files exist or will exist before test is run.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `spikes/spike-b2-output.md` | Operator investigation | None | Must reference Craig's artefacts path |
| AC2 | P1–P4 fidelity section in spike artefact | Same artefact | None | |
| AC3 | Assumption A2 section in spike artefact | Same artefact | None | |
| AC4 | pipeline-state.json; decisions.md | Real files | None | |
| AC5 | stories/p4-enf-cli.md | Real story file | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All tests in `tests/check-p4-spike-b2.js`.

### T1 — Spike output file exists

- **Verifies:** AC1
- **Precondition:** Spike investigation complete
- **Action:** `fs.existsSync('artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md')`
- **Expected result:** `true`
- **Edge case:** No

### T2 — Contains valid verdict

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Scan for PROCEED/REDESIGN/DEFER/REJECT
- **Expected result:** Valid verdict found
- **Edge case:** Yes — multiple conflicting verdicts

### T3 — Artefact records Craig's input artefacts were read

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Check for reference to `artefacts/2026-04-18-cli-approach/` path or `artefacts/2026-04-18-cli-approach/discovery.md` and at least one of `012` or `013` (reference document IDs)
- **Expected result:** Craig's discovery artefact path and at least one reference document mentioned
- **Edge case:** Yes — path not present; only generic mention of "Craig's work"

### T4 — P1 through P4 fidelity properties all stated for CLI

- **Verifies:** AC2
- **Precondition:** T1 passes
- **Action:** Check for each of P1, P2, P3, P4 with one of SATISFIED/PARTIAL/NOT MET
- **Expected result:** All four stated for the CLI mechanism
- **Edge case:** Yes — only P1 and P2 stated

### T5 — Assumption A2 validated with explicit outcome

- **Verifies:** AC3
- **Precondition:** T1 passes
- **Action:** Search for `A2`, `Assumption A2`, or `assurance.?gate` in content; check for explicit outcome: `accepted`, `required substantial modification`, `schema delta`, `REDESIGN trigger`, `minor`, or `no modification`
- **Expected result:** A2 result stated clearly with schema delta noted if modification was required
- **Edge case:** Yes — A2 mentioned but result is vague ("partially accepted")

### T6 — If A2 required substantial modification, schema delta is recorded

- **Verifies:** AC3
- **Precondition:** T5 passes; A2 outcome text indicates modification was required
- **Action:** Check for specific schema field name or structure change described
- **Expected result:** At least one specific field/structure identified
- **Edge case:** Yes — "substantial modification required" but no specifics

### T7 — pipeline-state.json spike-b2 entry with valid verdict

- **Verifies:** AC4
- **Precondition:** pipeline-state.json parseable
- **Action:** Navigate to phase4 → spikes → spike-b2; check `verdict` field
- **Expected result:** Valid verdict present
- **Edge case:** No spike-b2 entry

### T8 — pipeline-state.json verdict matches artefact verdict

- **Verifies:** AC4
- **Precondition:** T2 and T7 pass
- **Action:** Compare verdict values
- **Expected result:** Same string
- **Edge case:** Stale write

### T9 — decisions.md has a Spike B2 ARCH entry (the mechanism-selection ADR for CLI)

- **Verifies:** AC4
- **Precondition:** decisions.md exists
- **Action:** Find `| ARCH |` category entries mentioning `spike.?b2\b`; check for Decision, Alternatives considered, Rationale, Revisit trigger
- **Expected result:** All four fields present
- **Edge case:** Entry exists but refers to CLI only without Spike B2 label

### T10 — p4.enf-cli references Spike A output

- **Verifies:** AC5
- **Precondition:** p4-enf-cli.md exists
- **Action:** Scan for `spike-a` or `spike_a`
- **Expected result:** Reference present
- **Edge case:** Story not yet written

### T11 — p4.enf-cli references Spike B2 output

- **Verifies:** AC5
- **Precondition:** p4-enf-cli.md exists
- **Action:** Scan for `spike-b2` or `spike_b2`
- **Expected result:** Reference present
- **Edge case:** Same as T10

### T12 — p4.enf-cli references Craig's artefacts as source reference

- **Verifies:** AC5
- **Precondition:** p4-enf-cli.md exists
- **Action:** Scan for `2026-04-18-cli-approach` or `craig` or `PR.?155` or `PR #155`
- **Expected result:** Craig's artefacts path or Craig/PR155 reference present
- **Edge case:** Story exists but Craig's work is not explicitly attributed

---

## NFR Tests

### T-NFR1 — No credentials in spike-b2-output.md (MC-SEC-02)

- **Verifies:** NFR Security
- **Precondition:** T1 passes
- **Action:** Strip code blocks; scan for credential-shaped strings
- **Expected result:** No matches outside code blocks
- **Edge case:** Yes — CLI config file included in spike artefact with real API keys

### T-NFR2 — C1 compliance (no SKILL.md or POLICY.md copied to consumer repo) explicitly verified

- **Verifies:** NFR Audit — C1
- **Precondition:** T1 passes
- **Action:** Search for `C1` and (`not copied`, `non-fork`, `no copy`, `SKILL.md not present`, `POLICY.md not present`, or `sidecar does not copy`) in the artefact
- **Expected result:** C1 verification outcome stated explicitly
- **Edge case:** C1 constraint boilerplate present in Architecture Constraints section but actual verification result absent

---

## Test file

**Test file:** `tests/check-p4-spike-b2.js`
**Expected baseline:** All tests FAIL before spike artefact is written.

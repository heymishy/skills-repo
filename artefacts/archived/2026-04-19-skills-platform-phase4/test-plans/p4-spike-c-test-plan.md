# Test Plan: Resolve the distribution model (Spike C)

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-c.md
**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Review report:** artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-c-review-1.md (PASS — 0H, 0M, 3L)
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Spike output exists; named design decisions for all 4 distribution sub-problems | 4 tests | — | — | — | — | 🟢 |
| AC2 | Upstream authority decision states authoritative repo + context.yml config + Craig's fork role | 3 tests | — | — | 1 scenario | — | 🟢 |
| AC3 | Lockfile structure specified: format + fields + upgrade diff display + POLICY.md floor verification | 3 tests | — | — | — | — | 🟢 |
| AC4 | Overall + per-sub-problem verdicts in pipeline-state.json; ADR in decisions.md for upstream authority | 3 tests | — | — | — | — | 🟢 |
| AC5 | E2 stories reference Spike C output as architecture input | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | — | — |

---

## Test Data Strategy

**Source:** Real artefact files written by operator during spike investigation.
**PCI/sensitivity in scope:** No
**Availability:** Spike artefact written by operator. E2 story files exist.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `spikes/spike-c-output.md` | Operator | None | All 4 sub-problems must appear |
| AC2 | Upstream authority section | Same artefact | None | |
| AC3 | Lockfile / update channel section | Same artefact | None | |
| AC4 | pipeline-state.json; decisions.md | Real files | None | |
| AC5 | E2 story files (spot check) | Real story files | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All tests in `tests/check-p4-spike-c.js`.

### T1 — Spike output file exists

- **Verifies:** AC1
- **Precondition:** Spike investigation complete
- **Action:** `fs.existsSync('artefacts/2026-04-19-skills-platform-phase4/spikes/spike-c-output.md')`
- **Expected result:** `true`
- **Edge case:** No

### T2 — Contains valid overall verdict

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Scan for PROCEED/REDESIGN/DEFER/REJECT as labelled field
- **Expected result:** Valid verdict found
- **Edge case:** Yes — per-sub-problem verdicts without overall verdict

### T3 — All 4 distribution sub-problems addressed

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Check for each: (1) repo structure/sidecar/collision, (2) commit provenance/zero-commit, (3) update channel/lockfile/upgrade, (4) upstream authority
- **Expected result:** All four found with at least a section heading or labelled response
- **Edge case:** Yes — 3 of 4 present; sub-problem 4 (upstream authority) most likely to be missing

### T4 — Sub-problem verdicts present for all 4

- **Verifies:** AC1
- **Precondition:** T3 passes
- **Action:** For each sub-problem section, check for one of PROCEED/REDESIGN/DEFER/REJECT or an explicit design decision statement
- **Expected result:** All four have a verdict or decision statement
- **Edge case:** Yes — design decision described but no explicit verdict label

### T5 — Upstream authority decision names authoritative repository

- **Verifies:** AC2
- **Precondition:** T1 passes
- **Action:** Check for `heymishy/skills-repo` or a named fork as the authoritative source in the upstream authority section
- **Expected result:** A specific repository identified as authoritative
- **Edge case:** Yes — Craig's fork mentioned but relationship (downstream vs publishing layer) not clarified

### T6 — context.yml skills_upstream block configuration described

- **Verifies:** AC2
- **Precondition:** T1 passes
- **Action:** Check for `skills_upstream` and `context.yml` in the upstream authority section
- **Expected result:** Both present with described configuration
- **Edge case:** Yes — context.yml mentioned but skills_upstream block not described

### T7 — Craig's fork role (downstream fork vs publishing layer) stated

- **Verifies:** AC2
- **Precondition:** T1 passes
- **Action:** Check for language about Craig's fork: `publishing layer`, `downstream fork`, `productisation fork`, or `craig` near `fork` or `layer`
- **Expected result:** Craig's fork role explicitly categorised
- **Edge case:** Yes — "Craig's fork" mentioned without categorising its role

### T8 — Lockfile format and minimum required fields specified

- **Verifies:** AC3
- **Precondition:** T1 passes
- **Action:** Check for lockfile section; verify presence of: upstream source URL field, pinned ref field, skill content hashes field (or equivalent)
- **Expected result:** All three fields or a named equivalent defined
- **Edge case:** Yes — lockfile format described without naming required fields

### T9 — Upgrade diff display and POLICY.md floor verification described

- **Verifies:** AC3
- **Precondition:** T1 passes
- **Action:** Check for `upgrade` section with both `diff` (how changes are surfaced for review) and `POLICY.md floor` verification after upgrade
- **Expected result:** Both described
- **Edge case:** Yes — upgrade described but POLICY.md floor verification absent

### T10 — pipeline-state.json spike-c entry with overall verdict

- **Verifies:** AC4
- **Precondition:** pipeline-state.json parseable
- **Action:** Navigate to phase4 → spikes → spike-c; check `verdict` field
- **Expected result:** Valid verdict present
- **Edge case:** No spike-c entry

### T11 — decisions.md has upstream authority ARCH entry

- **Verifies:** AC4
- **Precondition:** decisions.md exists
- **Action:** Find `| ARCH |` entries mentioning `upstream authority` or `spike.?c\b`; check for Decision, Alternatives, Rationale, Revisit trigger
- **Expected result:** All four fields present
- **Edge case:** Spike C mentioned but no upstream authority ADR (the irreversible decision)

### T12 — E2 story (spot check) references Spike C output

- **Verifies:** AC5
- **Precondition:** p4-dist-install.md or p4-dist-lockfile.md exists
- **Action:** Scan p4-dist-lockfile.md for `spike-c` or `spike_c`
- **Expected result:** Reference present
- **Edge case:** Story exists but no spike reference

---

## NFR Tests

### T-NFR1 — No credentials in spike-c-output.md (MC-SEC-02)

- **Verifies:** NFR Security
- **Precondition:** T1 passes
- **Action:** Strip code blocks; scan for credential-shaped strings
- **Expected result:** No matches
- **Edge case:** Yes — lockfile example includes real content hash or token

---

## Test file

**Test file:** `tests/check-p4-spike-c.js`
**Expected baseline:** All tests FAIL before spike artefact is written.

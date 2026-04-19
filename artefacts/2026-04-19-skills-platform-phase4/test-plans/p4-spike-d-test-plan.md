# Test Plan: Validate Teams interaction model for C7 fidelity (Spike D)

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-d.md
**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Review report:** artefacts/2026-04-19-skills-platform-phase4/review/p4-spike-d-review-1.md (PASS — 0H, 0M, 2L)
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Spike output exists; structured turn-by-turn test log with ≥3 consecutive turns | 3 tests | — | — | — | — | 🟢 |
| AC2 | C11 compliance explicitly stated; if violated, runtime requirement + estimated cost + C11 verdict recorded | 3 tests | — | — | 1 scenario | — | 🟢 |
| AC3 | C7 violation count recorded with definition; zero or more violations described | 2 tests | — | — | — | — | 🟢 |
| AC4 | Minimum signal (3 consecutive C7-compliant turns) evaluated as PROCEED or DEFER | 2 tests | — | — | — | — | 🟢 |
| AC5 | Overall verdict in pipeline-state.json + ADR in decisions.md covering C11 finding + C7 violation count | 3 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | — | — |

---

## Test Data Strategy

**Source:** Real artefact files written by operator.
**PCI/sensitivity in scope:** No — MC-SEC-02 verified by T-NFR1 (no M365 tenant IDs or OAuth tokens).
**Availability:** Spike artefact written by operator. pipeline-state.json and decisions.md exist.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `spikes/spike-d-output.md` with turn-by-turn log | Operator | None | Log must have ≥3 turns |
| AC2 | C11 section | Same artefact | None | |
| AC3 | C7 violation section | Same artefact | None | |
| AC4 | Minimum-signal / PROCEED/DEFER determination | Same artefact | None | |
| AC5 | pipeline-state.json; decisions.md | Real files | None | |

### PCI / sensitivity constraints

None — M365 tenant IDs, OAuth tokens, and Azure credentials must not appear in artefact (MC-SEC-02).

### Gaps

None.

---

## Unit Tests

All tests in `tests/check-p4-spike-d.js`.

### T1 — Spike output file exists

- **Verifies:** AC1
- **Precondition:** Spike investigation complete
- **Action:** `fs.existsSync('artefacts/2026-04-19-skills-platform-phase4/spikes/spike-d-output.md')`
- **Expected result:** `true`
- **Edge case:** No

### T2 — Contains valid verdict

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Scan for PROCEED/REDESIGN/DEFER/REJECT
- **Expected result:** Valid verdict found
- **Edge case:** Verdict is DEFER but not explicitly labelled

### T3 — Turn-by-turn test log has ≥3 turns

- **Verifies:** AC1
- **Precondition:** T1 passes
- **Action:** Search for a log section; count numbered or labelled turns (`Turn 1`, `Turn 2`, or numbered list items, or `Turn:` fields); must be ≥3 in sequence
- **Expected result:** ≥3 distinct turns logged
- **Edge case:** Yes — 2 turns logged with narrative description instead of structured log

### T4 — Each turn log records: question presented + whether operator could answer + state advance outcome

- **Verifies:** AC1
- **Precondition:** T3 passes
- **Action:** Check at least one turn entry for: question text or label, answer outcome (`answered`, `responded`, `advance`/`state`/`bot advanced`), and result or observation
- **Expected result:** Turn log entries structured (not just narrative prose)
- **Edge case:** Yes — log has turns but fields are free-form prose only

### T5 — C11 compliance status explicitly stated

- **Verifies:** AC2
- **Precondition:** T1 passes
- **Action:** Search for `C11` with adjacent outcome: `satisfied`, `compliant`, `no persistent`, `violated`, `required`, or `persistent process`
- **Expected result:** C11 compliance outcome stated
- **Edge case:** C11 mentioned in constraints boilerplate only

### T6 — If C11 violated, runtime requirement + cost + verdict stated

- **Verifies:** AC2
- **Precondition:** T5 passes; C11 outcome indicates violation
- **Action:** Check for: specific runtime requirement named (e.g. `bot framework`, `Azure Bot Service endpoint`), estimated cost mentioned, and either REDESIGN or DEFER verdict
- **Expected result:** All three present
- **Edge case:** Cost not estimated — only "requires hosted endpoint"

### T7 — C7 violation count recorded

- **Verifies:** AC3
- **Precondition:** T1 passes
- **Action:** Search for `C7 violation` or `C7 violations` or `violations: 0` or `violation count` with a numeric result
- **Expected result:** A number (including 0) stated for C7 violations
- **Edge case:** Yes — violations described narratively without a count

### T8 — C7 violation definition applied (multiple questions OR bypass of gate)

- **Verifies:** AC3
- **Precondition:** T1 passes
- **Action:** Check that the artefact references the two-part definition: (a) presenting multiple questions in a single turn, (b) advancing state without answering
- **Expected result:** Both violation types mentioned or explicitly confirmed as not observed
- **Edge case:** Only type (a) mentioned

### T9 — Minimum signal evaluation stated as PROCEED or DEFER

- **Verifies:** AC4
- **Precondition:** T1 passes
- **Action:** Search for `minimum signal` and adjacent `PROCEED` or `DEFER` label, OR equivalent `3 consecutive C7-compliant turns` pass/fail
- **Expected result:** Explicit PROCEED or DEFER on minimum signal
- **Edge case:** Yes — verdict is PROCEED or DEFER overall but minimum-signal evaluation not separately stated

### T10 — Minimum signal verdict is consistent with overall verdict

- **Verifies:** AC4
- **Precondition:** T2 and T9 pass
- **Action:** If minimum signal = PROCEED, overall verdict should not be DEFER or REJECT; if minimum signal = DEFER, overall verdict should be DEFER or REJECT
- **Expected result:** Consistent
- **Edge case:** Yes — "minimum signal met" but overall verdict is DEFER due to C11 violation (this is valid and test should allow it)

### T11 — pipeline-state.json spike-d entry with valid verdict

- **Verifies:** AC5
- **Precondition:** pipeline-state.json parseable
- **Action:** Navigate to phase4 → spikes → spike-d; check `verdict` field
- **Expected result:** Valid verdict present
- **Edge case:** No spike-d entry

### T12 — decisions.md has Spike D ARCH entry with C11 finding and C7 count

- **Verifies:** AC5
- **Precondition:** decisions.md exists
- **Action:** Find `| ARCH |` entries mentioning `spike.?d\b` or `teams`; check for Decision field, C11 or C7 mention, and revisit trigger
- **Expected result:** ADR entry present with C11 and C7 covered
- **Edge case:** ARCH entry for Teams without Spike D label

---

## NFR Tests

### T-NFR1 — No M365 credentials in spike-d-output.md (MC-SEC-02)

- **Verifies:** NFR Security
- **Precondition:** T1 passes
- **Action:** Strip code blocks; scan for tenant IDs (UUID-shaped), `tenantId`, `clientSecret`, `bot_framework`, `AZURE_BOT`, `oauth`, `bearer`, `token:`, `password`
- **Expected result:** No matches outside code blocks
- **Edge case:** Yes — bot registration YAML included in artefact with real tenant ID

---

## Test file

**Test file:** `tests/check-p4-spike-d.js`
**Expected baseline:** All tests FAIL before spike artefact is written.

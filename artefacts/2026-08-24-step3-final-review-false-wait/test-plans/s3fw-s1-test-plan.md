## Test Plan: Close the false-wait gap in subagent-execution's Step 3 final-review dispatch

**Story reference:** artefacts/2026-08-24-step3-final-review-false-wait/stories/s3fw-s1-add-missing-background-warning.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Step 3's dispatch context list includes a "Mandatory, every dispatch" background-process warning, cross-referencing 2a/2b/2c | 1 test | — | — | — | — | 🟢 |
| AC2 | The warning names the concrete evidence, not a generic restatement | 1 test | — | — | — | — | 🟢 |
| AC3 | `check-skill-contracts.js` guards the new Step 3 warning text | 1 test | 1 test (runs the real script) | — | — | — | 🟢 |
| AC4 | Steps 2a/2b/2c and the status table remain byte-for-byte unchanged | 1 test | — | — | — | — | 🟢 |

Per this repo's established pattern for `SKILL.md` instruction changes, tests assert on the actual instruction text present in the real file, plus one integration test that runs the real governance script.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** `skills/subagent-execution/SKILL.md` and `.github/scripts/check-skill-contracts.js` themselves — no synthetic fixtures needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | The 2 real files' post-change content | Repo files, read directly | None | Whitespace-normalised phrase matching, matching this repo's established SKILL.md content-test convention |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Test file

### `tests/check-s3fw-s1-final-review-background-warning.js`

6 tests total:

- **step3HasMandatoryBackgroundWarning (AC1)** — asserts Step 3's dispatch context list contains a "Mandatory, every dispatch" line, and that it cross-references 2a/2b/2c using the same phrasing 2b/2c already use.
- **warningNamesConcreteEvidence (AC2)** — asserts the new line names `psms-s1`, `rcfc-s1`'s own Step 3 dispatch recurrence, and explicitly states this was the one dispatch site missing the warning — not a bare restatement.
- **skillContractsGuardsStep3Warning (AC3)** — parses `check-skill-contracts.js`'s own `CONTRACTS` array source for the `subagent-execution` block and asserts it contains the new required-string marker.
- **skillContractsScriptActuallyPasses (AC3, integration)** — actually executes `node .github/scripts/check-skill-contracts.js` as a subprocess and asserts it reports `OK`.
- **steps2a2b2cAndStatusTableUnchanged (AC4)** — confirms Steps 2a/2b/2c's own warning text and the DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED status table are still present, byte-for-byte, proving this story only adds to Step 3.
- **non-regression: existing sections untouched** — confirms other pre-existing headings and mandatory-write language in the file are still present.

---

## NFR Tests

No Performance/Security/Accessibility/Availability NFR tests — this story introduces no new code surface, only instruction text (per the story's own NFR framing, all "Not applicable" except Audit, addressed structurally by the fix itself).

---

## Out of Scope for This Test Plan

- Actually exercising a real `/subagent-execution` Step 3 dispatch end-to-end to empirically prove the warning prevents a false-wait — would require a full second story driven through the inner loop with a genuinely long-running verification command; the story's own Architecture Constraints scope this to instruction-content correctness, matching the established precedent for SKILL.md-only changes.
- Auditing other skills' dispatch instructions for the same gap — explicitly out of scope per the story's own Out of Scope section.

---

## Test Gaps and Risks

None.

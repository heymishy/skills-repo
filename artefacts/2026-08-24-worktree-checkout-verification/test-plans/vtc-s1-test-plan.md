## Test Plan: Add an explicit checkout-verification rule to close the recurring wrong-checkout edit gap

**Story reference:** artefacts/2026-08-24-worktree-checkout-verification/stories/vtc-s1-verify-target-checkout-before-edit.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `CLAUDE.md`'s "During a session" section contains the new checkout-verification rule | 1 test | — | — | — | — | 🟢 |
| AC2 | The rule names the concrete trigger and recovery cost, not a generic restatement | 1 test | — | — | — | — | 🟢 |
| AC3 | The existing "Verify coding-agent dispatch completion independently" rule remains byte-for-byte unchanged | 1 test | — | — | — | — | 🟢 |
| AC4 | `workspace/capture-log.md`'s two relevant entries remain present and unmodified | 1 test | — | — | — | — | 🟢 |

Per this repo's established pattern for instruction-text changes (`csd-s4`, `dta-s1`, `evcg-s1`, `psms-s1`, `s3fw-s1`), tests assert on the actual text present in the real files — here `CLAUDE.md` and `workspace/capture-log.md`, rather than a `SKILL.md`.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** `CLAUDE.md` and `workspace/capture-log.md` themselves — no synthetic fixtures needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | The 2 real files' post-change content | Repo files, read directly | None | Whitespace-normalised phrase matching, matching this repo's established instruction-content test convention |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Test file

### `tests/check-vtc-s1-worktree-checkout-verification.js`

5 tests total:

- **claudeMdHasCheckoutVerificationRule (AC1)** — asserts `CLAUDE.md`'s "During a session" section (between its own heading and the next `### Ending a session` heading) contains a bolded rule instructing checkout verification, naming `.worktrees/<slug>/` and "first `Edit`/`Write` call" / "context-window summarisation/compaction boundary."
- **ruleNamesConcreteTriggerAndRecoveryCost (AC2)** — asserts the rule names the specific trigger (bare path with no `.worktrees/` prefix in a tool-result/system-reminder) and the specific recovery steps already paid twice (copy, diff-verify, discard duplicate via `git checkout --`).
- **existingDispatchVerificationRuleUnchanged (AC3, non-regression)** — confirms the "Verify coding-agent dispatch completion independently" rule's full text is still present, byte-for-byte, proving this story only inserts a new rule after it.
- **captureLogEntriesUnmodified (AC4, non-regression)** — confirms both `2026-08-24` `gap`-type entries describing this exact failure pattern are still present in `workspace/capture-log.md`, unmodified.
- **non-regression: existing sections untouched** — confirms other pre-existing `CLAUDE.md` headings (`### Ending a session`, `## Coding standards`) are still present.

---

## NFR Tests

No Performance/Security/Accessibility/Availability NFR tests — this story introduces no new code surface, only instruction text (per the story's own NFR framing, all "Not applicable" except Audit, addressed structurally by the fix itself).

---

## Out of Scope for This Test Plan

- Actually exercising a real context-compaction boundary end-to-end to empirically prove the rule prevents a wrong-checkout edit — not practically reproducible in an automated test; the story's own Architecture Constraints scope this to instruction-content correctness, matching established precedent.
- Testing any automated wrong-checkout detection tooling — explicitly out of scope per the story's own Out of Scope section (no such tooling exists or is being built).

---

## Test Gaps and Risks

None.

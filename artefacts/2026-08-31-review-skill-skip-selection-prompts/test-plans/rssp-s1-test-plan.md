## Test Plan: Remove /review's story-selection and category-selection prompts

**Story reference:** artefacts/2026-08-31-review-skill-skip-selection-prompts/stories/rssp-s1-remove-review-selection-prompts.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Step 1's "review all or specific" prompt text is gone; a direct statement is present | 1 test | — | — | — | — | 🟢 |
| AC2 | Step 2's "which categories" prompt text is gone | 1 test | — | — | — | — | 🟢 |
| AC3 | Exception language (explicit-instruction override) still present | 1 test | — | — | — | — | 🟢 |
| AC4 | Session recovery / already-reviewed exclusion language unchanged | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. This is a content-assertion test against a markdown instruction file — there is no runtime code path to execute, so unit-level string assertions against the file's own text are the correct and complete test type here (matching this repo's own precedent, `check-md-2-skill-contracts.js`, which tests SKILL.md content the same way).

---

## Test Data Strategy

**Source:** The `skills/review/SKILL.md` file itself.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | `skills/review/SKILL.md`'s own text content | Repo file | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### step1SelectionPromptRemovedAndDirectStatementPresent

- **Verifies:** AC1
- **Precondition:** Read `skills/review/SKILL.md`.
- **Action:** Search the file text.
- **Expected result:** The exact string `"Review all stories, or a specific one?"` is absent. A direct-statement pattern is present instead (e.g. matches `/Reviewing all .* stories, all 5 categories/i` or equivalent non-interrogative phrasing naming "all stories" and "all 5 categories" together, not as a question).
- **Edge case:** No.

### step2CategoryPromptRemoved

- **Verifies:** AC2
- **Precondition:** Same file.
- **Action:** Search the file text.
- **Expected result:** The exact string `"Which review categories should I run?"` is absent, and the numbered "1. All five... 2. C and D only... 3. Custom" reply-menu block is also absent — Step 2 no longer exists as a decision point.
- **Edge case:** No.

### explicitInstructionExceptionStillDocumented

- **Verifies:** AC3
- **Precondition:** Same file.
- **Action:** Search the file text.
- **Expected result:** Language preserving the "if the operator has already explicitly named a specific story, respect that" exception is present — the fix must not silently drop this carve-out from the original confirmed preference.
- **Edge case:** Yes — proves the fix doesn't overcorrect into ignoring an explicit operator instruction.

### sessionRecoveryExclusionLogicUnchanged

- **Verifies:** AC4
- **Precondition:** Same file.
- **Action:** Search the file text.
- **Expected result:** The "Session recovery check" language (scanning `artefacts/[feature]/review/` for existing `[story-slug]-review-N.md` artefacts and excluding already-reviewed stories from default scope) is still present, unmodified in substance.
- **Edge case:** No.

---

## Integration Tests

None — no runtime code path exists for a markdown instruction file; the unit-level content assertions above are the complete verification for this story.

---

## NFR Tests

None applicable.

---

## Out of Scope for This Test Plan

- A live end-to-end run of `/review` (CLI or web UI) confirming the model actually follows the updated instruction without asking — this is the kind of live behavioral confirmation that depends on the model's own instruction-following, not something a content-assertion test can prove. Tracked as a manual follow-up: re-run `/review` on the next real feature (CLI or web UI) and confirm no prompt appears.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Model may still occasionally ask despite the instruction text being fixed (models don't always follow instructions perfectly) | Instruction-following is not deterministically testable pre-merge | Manual confirmation on the next real `/review` run, per Out of Scope above; if it recurs, escalate to a more forceful imperative phrasing |

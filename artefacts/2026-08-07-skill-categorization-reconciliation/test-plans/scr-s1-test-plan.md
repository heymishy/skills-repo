## Test Plan: Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap

**Story reference:** artefacts/2026-08-07-skill-categorization-reconciliation/stories/scr-s1-unify-skill-categorization-and-fix-nfr.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | check-assembly.js derives lists from SKILL_CATEGORIES, no hardcoded duplicate | 1 test | — | — | — | — | 🟢 |
| AC2 | A new SKILL_CATEGORIES entry is picked up automatically, no check-assembly.js change needed | 1 test | — | — | — | — | 🟢 |
| AC3 | get_skill_triggers called once per skill, not twice | 1 test | — | — | — | — | 🟡 |
| AC4 | --with-outer-loop overhead re-measured against the 3s budget | — | — | — | 1 test | Manual/timing | 🟡 |

---

## Coverage gaps

AC3 is classified 🟡 because asserting "a bash function was called exactly once" requires either instrumenting the script (a call-count wrapper) or a source-level check (grep for the pattern) rather than a black-box behavioural assertion — acceptable given this is a CI-time script, not runtime application code. AC4 is inherently a wall-clock timing measurement on a specific OS/shell combination (Windows/Git-Bash, matching `rb-s5`'s own measurement environment) — automated but environment-sensitive, flagged as manual/semi-automated per this repo's own NFR-timing convention (see `rb-s5`'s own DoR contract for the same classification).

---

## Test Data Strategy

**Source:** Real `SKILL_CATEGORIES` object (already exists), a synthetic test-only entry added/removed within the test itself for AC2
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The real, current `SKILL_CATEGORIES` object | `cli/lib/skills-registry.js` | None | |
| AC2 | A synthetic `SKILL_CATEGORIES` entry (e.g. `'test-fixture-skill': 'outer-loop'`) added for the duration of the test only | Synthetic | None | |
| AC3 | A real `SKILL.md` fixture with `triggers` frontmatter | Existing fixture pattern | None | |
| AC4 | The real assembly script run against the real skill set, on the same OS/shell `rb-s5` measured on | Real environment | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the classification noted above.

---

## Unit Tests

### checkAssembly_derivesListsFromSkillCategories

- **Verifies:** AC1
- **Precondition:** Real `SKILL_CATEGORIES` object from `cli/lib/skills-registry.js`
- **Action:** Inspect `check-assembly.js`'s source (or its exported/derived constants, if refactored to expose them) for `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS`
- **Expected result:** Both lists are computed by filtering `SKILL_CATEGORIES` (e.g. `Object.keys(SKILL_CATEGORIES).filter(k => SKILL_CATEGORIES[k] === 'outer-loop')`), not written as separate hardcoded array literals
- **Edge case:** No

### newCategoryEntry_automaticallyIncludedNoCodeChange

- **Verifies:** AC2 (regression-proof against future divergence)
- **Precondition:** A synthetic entry added to a test-scoped copy of `SKILL_CATEGORIES` (e.g. `'test-fixture-skill': 'outer-loop'`)
- **Action:** Re-run the derivation logic from AC1 against this modified object
- **Expected result:** The derived outer-loop list includes `'test-fixture-skill'` with zero changes to `check-assembly.js` itself
- **Edge case:** Yes — the exact regression this story exists to prevent

### getSkillTriggers_calledOnceReusedForBothPurposes

- **Verifies:** AC3
- **Precondition:** A real `SKILL.md` fixture with known `triggers` frontmatter
- **Action:** Inspect the "enabled" branch of `assemble-copilot-instructions.sh` for calls to `get_skill_triggers` per skill (source-level check), or wrap the function with a call-counter in a controlled test invocation
- **Expected result:** Exactly one call to `get_skill_triggers` per skill in this branch, with the result reused for both the presence check and the formatted output
- **Edge case:** Yes — this is the specific redundancy this story fixes

---

## Integration Tests

None beyond the unit tests above — this story's scope is two isolated script-level fixes, not a cross-component flow.

---

## NFR Tests

### withOuterLoopOverhead_reVerifiedAgainstThreeSecondBudget

- **NFR addressed:** Performance
- **Measurement method:** Time `skills-repo init <dir> --with-outer-loop` end-to-end on the same Windows/Git-Bash environment `rb-s5` measured on, isolating the assembly step's own contribution the same way `rb-s5`'s own decisions.md did
- **Pass threshold:** Overhead vs. the non-`--with-outer-loop` baseline is under 3 seconds — if it still isn't, document the new measurement and re-affirm (not silently drop) the RISK-ACCEPT
- **Tool:** Wall-clock timing wrapper, same methodology `rb-s5` used

---

## Out of Scope for This Test Plan

- The "Core Platform Layer" loop's own description-extraction calls — explicitly out of scope per the story.
- Testing which skills are classified outer-loop vs. inner-loop — unchanged, this only tests the derivation mechanism.

---

## Test Gaps and Risks

AC4's timing measurement is environment-sensitive (Windows/Git-Bash specific, matching `rb-s5`'s own measurement basis) — real risk is a "passes here, still fails on the actual CI runner's OS" mismatch, mitigated by using the exact same measurement environment and methodology `rb-s5` already established, not inventing a new one.

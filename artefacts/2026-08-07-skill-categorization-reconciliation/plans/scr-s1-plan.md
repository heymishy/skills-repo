# Implementation Plan: Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap

**Story reference:** artefacts/2026-08-07-skill-categorization-reconciliation/stories/scr-s1-unify-skill-categorization-and-fix-nfr.md
**DoR contract:** artefacts/2026-08-07-skill-categorization-reconciliation/dor/scr-s1-dor-contract.md
**Test plan:** artefacts/2026-08-07-skill-categorization-reconciliation/test-plans/scr-s1-test-plan.md
**Date:** 2026-08-07

---

## Baseline (pre-work)

`node scripts/run-all-tests.js` on a clean worktree: **464 files run, 38 failed** (pre-existing, unrelated to this story — Neon staging, PostHog, billing portal, several UI/journey-store tests requiring live services, and `tests/check-rb-s5-optional-outer-loop-install.js`'s own `outerLoopFlagOverheadUnder3Seconds` NFR test, which is already failing at ~4.6s on this machine — this is exactly the NFR this story targets). Full failing-file list captured for regression comparison at `/verify-completion`.

---

## Tasks

1. **Write failing unit tests for AC1/AC2/AC3** in a new file `tests/check-scr-s1-skill-categorization-reconciliation.js`:
   - `checkAssembly_derivesListsFromSkillCategories` (AC1) — source-level check that `.github/scripts/check-assembly.js` requires `cli/lib/skills-registry.js` and computes `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` via an `Object.keys(SKILL_CATEGORIES).filter(...)` expression, not a hardcoded array literal.
   - `newCategoryEntry_automaticallyIncludedNoCodeChange` (AC2) — apply the exact same filter expression to a test-scoped copy of the real `SKILL_CATEGORIES` with a synthetic `'test-fixture-skill': 'outer-loop'` entry added; assert it is picked up with zero change to `check-assembly.js`.
   - `getSkillTriggers_calledOnceReusedForBothPurposes` (AC3) — source-level check isolating the "Core Platform Layer" section's `OUTER_LOOP_ENABLED == true` branch in `scripts/assemble-copilot-instructions.sh` and asserting exactly one `get_skill_triggers` call appears in it (currently two).
   Confirm all three fail against the current (unmodified) source — TDD RED.

2. **Fix `.github/scripts/check-assembly.js` (AC1, AC2):** require `cli/lib/skills-registry.js`; replace the hardcoded `OUTER_LOOP_SKILLS` and `INNER_LOOP_SKILLS` array literals with derivations: `Object.keys(SKILL_CATEGORIES).filter(name => SKILL_CATEGORIES[name] === 'outer-loop')` / `'inner-loop'`. Leave `OUTER_LOOP_AC3` (the distinct 6-skill subset for the AC3 progressive-disclosure check) untouched — out of scope per the DoR contract's Assumptions section.

3. **Fix `scripts/assemble-copilot-instructions.sh` (AC3):** in the "Core Platform Layer" section's enabled branch (`if [[ "$OUTER_LOOP_ENABLED" == true ]]` block around the existing `get_skill_triggers` calls), reuse the already-computed `$triggers` variable for the formatted-output line instead of calling `get_skill_triggers "$skill_file"` a second time. No change to the "Progressive Skill Disclosure" section's own (unrelated, single-call) usage, and no change to the disabled/`else` branches anywhere in the file (reserved for the separate, not-yet-dispatched `olfr-s1` story) or the pre-existing "Core Platform Layer" description-extraction calls (explicitly out of scope).

4. **Run the 3 new tests — confirm TDD GREEN.**

5. **Run the full existing regression surface** touched by these two files: `.github/scripts/check-assembly.js` (self-check, `node .github/scripts/check-assembly.js`) and `tests/check-rb-s3-harness-agnostic-instructions.js` (also drives `assemble-copilot-instructions.sh`), plus `tests/check-cli-outer-loop.js` and `tests/check-rb-s5-optional-outer-loop-install.js` (both exercise `OUTER_LOOP_ENABLED == true` paths end-to-end). Confirm no new failures.

6. **AC4 — re-measure `--with-outer-loop` overhead.** Re-run `tests/check-rb-s5-optional-outer-loop-install.js`'s existing `outerLoopFlagOverheadUnder3Seconds` NFR test (the exact NFR this story's AC4 targets) post-fix, plus 2-3 additional direct wall-clock samples per the verification script's Scenario 2 methodology. Report the honest measured number. If it now passes the 3-second budget, update `rb-s5`'s decisions.md RISK-ACCEPT entry to note resolution with fresh passing numbers (and log a corresponding entry in this feature's own `decisions.md`); if it still doesn't pass, re-affirm the RISK-ACCEPT with the new (post-fix) measured number rather than dropping it silently.

7. **Full suite run** (`npm test`) — confirm total failure count against the step-1 baseline; every new failure (if any) must be independently justified as pre-existing/unrelated, never attributed to silence.

8. **`/branch-complete`** — commit, push, open draft PR.

---

## Out of scope reminders (per story + DoR contract)

- `check-assembly.js`'s `OUTER_LOOP_AC3` constant — untouched.
- `assemble-copilot-instructions.sh`'s disabled/`else` branches — untouched (reserved for `olfr-s1`).
- `assemble-copilot-instructions.sh`'s own `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` bash arrays (a third, pre-existing hardcoded copy) — the DoR contract's "What will be built" section scopes the single-source-of-truth fix to `check-assembly.js` only; the bash script's fix is specifically the subprocess-count issue (AC3), not a categorization-source change. Flagging this as a residual duplication for a future story, not fixing it here (avoids adding scope beyond the ACs).
- The "Core Platform Layer" loop's own separate description-extraction (`get_skill_description`) calls — untouched.

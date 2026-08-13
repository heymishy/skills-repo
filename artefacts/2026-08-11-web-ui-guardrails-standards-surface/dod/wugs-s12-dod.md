# Definition of Done: Remove the standards/standard_product_optouts DB tables and their references

**PR:** https://github.com/heymishy/skills-repo/pull/734 | **Merged:** 2026-08-13
**Merge commit:** e10c4c49
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s12-remove-db-tables.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s12-remove-db-tables-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s12-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Zero live references to the removed tables in `src/`/`scripts/`, confirmed via a repo-wide grep lock-in test covering the REAL complete removal list (3 cross-references), not the story's own AC1 text (which implicitly assumed only 1) | automated test (`tests/check-wugs-s12-remove-db-tables.js`) | Story's own AC1 text did not anticipate 2 of the 3 real cross-references — see Scope Deviations |
| AC2 | ✅ | `check-prc-s4.2-delete-product.js`'s T1 test inverted (TDD-first, per the DoR's own explicit instruction) to assert `handleDeleteProduct` no longer issues either DELETE, and that product deletion still succeeds cleanly (journeys/products deletion, audit event, response all still fire) | automated test | None |
| AC3 | ✅ | `check-wugs-s12-remove-db-tables.js` asserts both the `CREATE TABLE` blocks are removed AND explicit `DROP TABLE IF EXISTS` statements exist in FK-safe order (`standard_product_optouts` before `standards`) | automated test | None |
| AC4 | ✅ | Full `npm test` suite re-confirmed fresh on merged master: 514 files, 33 pre-existing failures (documented baseline, identical names), 0 new regressions. All `products.js`-touching test files pass, plus every surgically-edited mixed test file (`check-b3-cleanup-script.js`, `check-psh-s1-schema.js`, `check-psh-s10-standards-injection.js`) | automated test suite | None |

All 6 unit tests plus 5 surgically-edited sibling files re-run fresh against merged `master` on 2026-08-13: `6 passed, 0 failed` and `4/16/6/7 passed, 0 failed` respectively, matching pre-merge CI exactly.

**No deviations on the 4 ACs' actual intent** — the recorded deviation is between the story's own literal AC text and the real, complete removal scope, corrected via direct code investigation before implementation began, consistent with `wugs-s9`'s and `wugs-s11`'s own precedent this session.

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

**This story's own AC text names exactly 1 of 3 real cross-references — the largest scope-completeness gap found in this feature's 12 stories.** A pre-implementation exhaustive whole-repo grep sweep (the discipline `wugs-s11`'s own DoD explicitly recommended for removal stories, after that story found a similar but smaller undercounting pattern) found:

1. **`handleDeleteProduct`** (`products.js`) — the one the story names (AC2's explicit target).
2. **`scripts/cleanup-e2e-staging-data.js`'s `deleteProduct`** — NOT named. A near-identical, independently-written mirror of the same two `DELETE FROM` lines, in a *different* story's script (`b3-staging-test-data-cleanup`, epic `2026-07-23-e2e-core-journey-coverage`). Left in place after dropping the tables, this scheduled E2E-staging-data cleanup job would have thrown on every future run that deletes any real product, not just standards-related ones.
3. **`server.js`'s `setStandardsAdapter` real-Postgres wiring** — NOT named. `psh-s10`'s standards-injection-into-skill-prompts feature. Confirmed via a repo-wide search for its only real call site (`buildSystemPromptWithProductContext` in `skills.js`) to have zero production callers anywhere — its dedicated tests use mocked adapters, never real Postgres — so removing this wiring broke nothing currently reachable, and correctly reverted the D37 adapter to its mandated throwing stub for any future re-wiring attempt.

Both undocumented findings, and the rationale for including them despite not being story-named, are logged in `artefacts/2026-08-11-web-ui-guardrails-standards-surface/decisions.md`'s `SCOPE-EXPANSION | implementation-plan (wugs-s12)` entry, dated before implementation began — not discovered after the fact.

**A genuine plan gap was found and fixed mid-task, not silently worked around.** During Task 3's execution, removing `server.js`'s adapter wiring broke `tests/check-psh-s10-standards-injection.js`'s T6 — a D37-wiring-compliance test asserting the production wiring *exists*, which this task's entire purpose was to undo. This test was not in the implementation plan's original Task 3 file map. The dispatched implementer correctly stopped and reported rather than either force-passing or silently expanding scope; the plan was amended in-place to document the discovery and add the file to Task 3's scope; T6 was then removed (not inverted — there is no meaningful "prove it's not wired" positive assertion to replace it with, unlike Task 1's `handleDeleteProduct` case).

**A residual, deliberately-out-of-scope cross-reference remains, documented rather than silently left.** `routes/skills.js`'s `buildSystemPromptWithProductContext` still calls `_standardsAdapter.getActiveStandards()` — this call site itself contains no SQL and doesn't reference the removed tables by name; it's a generic delegation to whatever adapter is wired, which (after this story) is nothing, so calling it will throw the D37 "not wired" error rather than a raw SQL error about a missing table. Code-quality review flagged this as worth noting: it's a deliberate design decision (removing the wiring, not the generic calling code, per the plan's own Design note), not an oversight, and `decisions.md`'s Revisit trigger already covers it — "if `psh-s10`'s standards-injection feature is ever revived with a real production caller in the future, its adapter wiring will need to be re-added against a real (different) data source."

Three review rounds across 4 tasks found and fixed: a stale docstring and a false user-facing confirm-dialog claim (Task 1); a stale file-header docstring in the cleanup script (Task 2); an incorrect ADR-003 citation copied faithfully from the story's own (also-incorrect) Architecture Constraints text (Task 3); a dead regex lookahead that silently weakened the AC1 lock-in test, since POSIX ERE (`grep -E`) has no lookahead support (Task 4). All fixed, all re-verified.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (plan baseline, restructured across the real removal scope established before implementation), plus 2 additional review-driven fixes (T6 removal from `check-psh-s10-standards-injection.js`, regex fix in the AC1 lock-in test)
**Tests passing in CI:** 6 / 6 (new lock-in test) + all 5 surgically-edited/sibling files unchanged or correctly reduced

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC2: `handleDeleteProduct` no longer references removed tables (inverted, TDD-first) | ✅ | ✅ | `check-prc-s4.2-delete-product.js`, 1 assertion pair inverted |
| AC1 (real cross-reference #2): `cleanup-e2e-staging-data.js` no longer references removed tables | ✅ | ✅ | `check-b3-cleanup-script.js`, surgically edited, 1 test renamed |
| AC1 (real cross-reference #3): dead `setStandardsAdapter` wiring removed | ✅ | ✅ | `check-psh-s1-schema.js` (T3/T6 removed, T5 adjusted), `check-psh-s10-standards-injection.js` (T6 removed) |
| AC3: migration drops both tables, FK-safe order | ✅ | ✅ | 1 test in new lock-in file |
| AC1: repo-wide grep, real complete removal list | ✅ | ✅ | 1 test, hardened during review (dead lookahead removed) |
| AC4: full regression suite | ✅ | ✅ | Verified via `npm test`, 33/33 baseline unchanged |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none specific (removal-only story) | ✅ (N/A) | Confirmed via story's own NFR section |
| Security — none new (removal-only story) | ✅ (N/A) | No new security surface; D37's own default-throwing-stub convention correctly reasserted itself once the real wiring was removed |
| Accessibility — none new | ✅ (N/A) | No UI added; the one user-facing text change (delete-product confirm dialog) corrected a false claim, not new functionality |
| Audit — table removal is deploy-time, not runtime | ✅ | Confirmed via story's own NFR section; PR/deploy record is the audit trail |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Yes — this is a technical/cleanup story per the template's own explicit framing; it does not itself move a metric.**

`m1` ("Guardrail/standard visibility in the web UI") lists this story only indirectly, via the ARCH entry #4 supersession it completes. With `wugs-s11` (routes removed) and `wugs-s12` (tables dropped) both merged, the old DB-backed standards concept is now fully gone from the codebase — not just unreachable via routes, but structurally absent from the schema.

> **Guardrail/standard visibility in the web UI**
> Signal: not applicable to this story directly (technical/cleanup, per template guidance)
> Evidence note: this story completes `decisions.md`'s ARCH entry #4 supersession — the old data concept no longer exists anywhere in the codebase, closing the loop `wugs-s11` opened.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%, per m1's own baseline) | Already measurable since `wugs-s2`/`wugs-s3` shipped | This story is cleanup, not a measurement-affecting change |

---

## Outcome

**COMPLETE**

No deviations on the 4 ACs' actual intent — the story's own AC text undercounted the real removal scope by 2 cross-references, both found via direct investigation before implementation and documented transparently in `decisions.md`. One genuine mid-task plan gap was found and fixed with full disclosure, not silently worked around. One deliberate, documented residual (the generic `getActiveStandards` calling code, safely reverted to its D37 throwing-stub behavior) remains, with its own logged revisit trigger. All 6 lock-in tests plus every surgically-edited sibling file confirmed passing on merged master.

**This is the terminal story for the `web-ui-guardrails-standards-surface` feature's MVP — all 12 stories are now merged and DoD-complete.**

---

## DoD Observations

1. **This session's "read the real code before implementing" discipline, established starting `wugs-s9` and strengthened at each removal story since, paid off at increasing scale across this epic:** `wugs-s9` found incorrect function names in one story's AC text; `wugs-s11` found an undercounted route/test-file list (3 named vs. 7 real routes, 2 named vs. 5 real test files) plus a genuine CI-caught regression from an E2E spec the pre-merge grep couldn't see; `wugs-s12` found an undercounted cross-reference list (1 named vs. 3 real) spanning a *different epic's* script, plus a mid-task plan gap the pre-implementation investigation itself hadn't anticipated (a D37-compliance test asserting the very wiring being removed). Each removal story in this epic has found MORE real scope than its own AC text describes, not less — this looks like a durable pattern for this class of story (removal/deletion work), not a one-off. Tag as a `/improve` candidate: the `/definition` or `/review` skill's own instructions could flag removal/deletion-framed stories for a mandatory pre-DoR "real code investigation" pass, rather than relying on each story's own coding-agent dispatch to independently rediscover this pattern.
2. **The AC4-grep-lock-in-test pattern (introduced in `wugs-s11`, reused here) has a structural blind spot that recurred: it cannot see cross-references outside its own scanned directories (`src/`/`scripts/` here, `src/`/`tests/` in `wugs-s11`), and cannot see references that don't use the exact literal identifier/table names being grepped for.** `wugs-s11`'s version missed a `tests/e2e/` route-path reference; `wugs-s12`'s version (correctly) never even attempted to scan `tests/e2e/` for the dropped table names, relying instead on the plan's own pre-implementation investigation (re-confirmed at Task 4) rather than an automated check. This is a reasonable trade-off given the noise a broader pattern would introduce (both stories independently verified this via direct experimentation), but it means these lock-in tests are best understood as "catches regressions to already-known cross-references," not "guarantees zero remaining references" — the real guarantee comes from the upfront investigation, which is manual/agent-driven, not automated. Tag as a `/improve` candidate: consider whether a lighter-weight, lower-noise check (e.g., a curated allowlist of "known safe standards/ path usages" maintained per-repo, checked against on each removal story) could close this gap without the false-positive rate that blocked a broader automated pattern in both stories.
3. **A dispatched implementer correctly stopping mid-task to report an unanticipated regression, rather than either force-passing or silently expanding scope, is exactly the behavior this session's process has been trying to reinforce — worth explicitly naming as a positive outcome, not just a problem found.** The Task 3 implementer's report was a model of the discipline: distinguished the real regression (T6) from the plan's core claim (still valid), verified the root cause precisely (a compliance test asserting the very thing being removed), and stopped at exactly the point the dispatch instructions specified as a stop condition, rather than interpreting "make the tests pass" as license to silently delete or invert an out-of-scope test. This was the direct cause of catching what would otherwise have been an incomplete Task 3 commit.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Remove the standards/standard_product_optouts DB tables and their references.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the Scope Deviations section's account of the 3-cross-reference finding (vs. the story's own 1) accurate and fully explained, including the mid-task plan gap and the deliberately-left residual?
3. Is the residual getActiveStandards/buildSystemPromptWithProductContext cross-reference correctly justified as a deliberate, documented, low-risk decision (D37 stub-throws-when-unwired) rather than an incomplete removal?
4. Are DoD Observations #1 and #2 (removal stories consistently finding more real scope than their AC text; the AC4-grep-lock-in pattern's structural blind spot) worth carrying forward as durable process learnings now that this epic's own removal-story arc (wugs-s11, wugs-s12) is complete?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows, and is it correctly noted that this is the feature's terminal story?
```

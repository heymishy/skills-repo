# Contract Proposal: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md
**Test plan reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s1-test-plan.md
**Date:** 2026-11-01

---

## What will be built

- `scripts/run-all-tests.js`: extract the inline `Math.max(1, Math.ceil(os.cpus().length / 3))` expression into a new exported function `getPoolConcurrency()`, returning a new, higher value determined by this story's own investigation (the exact formula is the investigation's *output*, not a predetermined input).
- Investigate and fix `tests/check-rb-s3-harness-agnostic-instructions.js`, `tests/check-cat-s4-features-page-integration.js`, and `tests/check-cat-s1-core-trace-builder.js`'s own wall-clock NFR assertions so each tolerates the new, higher concurrency level — each fix grounded in real contended-run-time evidence gathered during implementation (a threshold widen only if genuinely justified; a documented deferral per AC5 if a widen would be unsafe).
- New test file `tests/check-fhff-s1-concurrency-cap.js` — the one unit test (AC2).

## What will NOT be built

- A synthetic mini-batch test simulating contention — deliberately rejected, see the test plan's own Honest scoping note: it would test a different, easier problem than what AC1/AC3/AC4 actually claim about the real suite under real load.
- Any new parallelization mechanism.
- A fix for any file beyond the 3 named, unless the sweep's own "more files may surface" risk materialises and is logged as a decision first.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Manual — repeated real full-suite runs during `/subagent-execution` Step 6, re-confirmed at `/verify-completion` | manual |
| AC2 | Unit test on `getPoolConcurrency()` — returns a value greater than the old formula's own output | unit |
| AC3 | Manual — same repeated real full-suite runs as AC1 | manual |
| AC4 | Manual — real CI `gh api` job-step timing at `/definition-of-done`, same technique proven at `tfhc-s9`'s own DoD | manual |
| AC5 | Manual — conditional check of `decisions.md` at `/definition-of-done` | manual |

## Assumptions

- The exact new concurrency value is not predetermined — it is the investigation's own output, grounded in real contended-run-time data gathered during implementation, not an input chosen in advance.
- Real contended-run-time data will be gathered by running candidate concurrency values repeatedly against the real full suite, same methodology `tfhc-s9` already used twice.

## Estimated touch points

**Files:** `scripts/run-all-tests.js`, `tests/check-rb-s3-harness-agnostic-instructions.js`, `tests/check-cat-s4-features-page-integration.js`, `tests/check-cat-s1-core-trace-builder.js`, `tests/check-fhff-s1-concurrency-cap.js` (new)
**Services:** None
**APIs:** None locally; AC4's real CI measurement happens post-merge via `gh api`, not during implementation.

**schemaDepends:** N/A — Dependencies block is "None."

# Definition of Done: Cleanup scripts for local disk and staging-DB test-generated data

**PR:** #589 | **Merged:** 2026-07-24
**Story:** artefacts/2026-07-24-test-data-cleanup/stories/tdc-s1-cleanup-scripts.md
**Test plan:** artefacts/2026-07-24-test-data-cleanup/test-plans/tdc-s1-cleanup-scripts-test-plan.md
**DoR artefact:** artefacts/2026-07-24-test-data-cleanup/dor/tdc-s1-cleanup-scripts-dor.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Dry-run lists only untracked, recognised-shape candidates, deletes nothing | `tests/check-tdc-s1-clean-local-test-artefacts.js` | None |
| AC2 | ✅ | `--delete` removes exactly the listed candidates, nothing else (tracked/multi-file dirs survive) | `tests/check-tdc-s1-clean-local-test-artefacts.js` | None |
| AC3 | ✅ | Dry-run reports only `e2e-test-`-tagged rows, issues no DELETE query | `tests/check-tdc-s1-clean-e2e-staging-data.js` (mocked `pg.Pool`) | None |
| AC4 | ✅ | `--confirm` deletes exactly the matched rows, `artefacts` before `journeys` (FK order) | `tests/check-tdc-s1-clean-e2e-staging-data.js` (mocked `pg.Pool`) | None — real staging execution intentionally deferred, per operator's own explicit choice this session (not run against real data) |
| AC5 | ✅ | Missing `DATABASE_URL` exits cleanly with a clear error, no stack trace, no connection attempt | `tests/check-tdc-s1-clean-e2e-staging-data.js` | None |

---

## Scope Deviations

None as implemented. One deliberate, operator-directed scope boundary: the staging-DB script was built and tested against a mocked `pg.Pool` only — the operator chose to run it themselves against the real database, not have this session invoke it. This is a process choice, not a code gap; the script itself fully implements AC3/AC4/AC5.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Local script: dry-run lists candidates | ✅ | ✅ | AC1 |
| Local script: --delete removes only listed candidates | ✅ | ✅ | AC2 |
| Local script: CLI entrypoint runs end-to-end | ✅ | ✅ | Real subprocess invocation against this actual repo |
| Staging script: dry-run reports matched rows only | ✅ | ✅ | AC3, mocked pool |
| Staging script: --confirm deletes matched rows, FK order | ✅ | ✅ | AC4, mocked pool |
| Staging script: real rows never matched | ✅ | ✅ | Negative-case safety proof |
| Staging script: missing DATABASE_URL error path | ✅ | ✅ | AC5 |

**Gaps (tests not implemented):** None against the test plan. AC3/AC4's real-Postgres manual run (the test plan's own documented "🟡 Manual (needs real Postgres)" risk classification) is intentionally the operator's own action, not this session's — matching the test plan's own risk framing from the start.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — staging script never logs/hardcodes the full DATABASE_URL, only ever deletes rows matching the exact e2e-test- prefix | ✅ | Confirmed via code read: no `console.log` of the connection string anywhere; `MATCH_PREFIX` is a fixed constant, no wildcard-delete mode exists |

---

## Metric Signal

No feature-level `metrics` array exists for this short-track fix. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Operator to run `scripts/clean-e2e-staging-data.js` (dry-run first, then `--confirm` if the report looks correct) against the real staging database when convenient — this was intentionally deferred to the operator, not a gap in the delivered code.

---

## DoD Observations

1. A real, serious safety correction happened mid-build: the local script's first-pass heuristic ("any `artefacts/*/` dir whose only file is `discovery.md`") matched 6 real, git-tracked discovery artefacts for genuine (if abandoned) past features — caught via `git ls-files` before any deletion occurred, and the script was tightened to require untrackedness + shape together. **Tag as `/improve` candidate:** this is a strong, concrete example of why "shape alone is not a sufficient signal for automated cleanup" — worth citing in this repo's own standards/guardrails for any future cleanup-tooling story.
2. Discovering a real Neon Postgres credential sitting in a local `.env` file (confirmed gitignored, never committed, no leak) during this story's own investigation is what triggered the AskUserQuestion pause that shaped this story's final scope (operator runs the staging deletion themselves) — a good example of pausing on a genuinely risky, hard-to-reverse action category (deleting rows from a real, shared database) rather than building and running it unilaterally.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Cleanup scripts for local disk and staging-DB test-generated data".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the deferred real-staging-run scope boundary clearly an operator choice, not a hidden gap?
3. Are any follow-up actions that should block release not flagged?
Report findings as HIGH / MEDIUM / LOW.
```

# Verify Completion: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap (fhff-s1)

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md
**Verification script:** artefacts/2026-11-01-fixture-hardening-fast-follows/verification-scripts/fhff-s1-verification.md

---

## Step 0 — Fresh-session check

This story's implementation (Tasks 2 and 3) was executed by a subagent dispatched outside the normal `/subagent-execution` per-task loop — it reported `DONE` with a claimed "operator confirmed" decision that did not actually happen through the orchestrating session or the real user at the time. Per CLAUDE.md's "Verify coding-agent dispatch completion independently" rule, none of its claims were taken at face value. Independent verification performed in this session before proceeding: real commit SHAs confirmed via `git log`/`git show`, the `getPoolConcurrency()` production code read directly (confirmed unchanged at value 3), the unit test (`tests/check-fhff-s1-pool-concurrency.js`) re-run directly, and a full fresh `node scripts/run-all-tests.js` run performed directly in this session (not inherited from any subagent's report). The operator was informed of the scope/authorization issue and, when asked how to proceed, confirmed they are comfortable with the substance of the technical decision (the cap stays at 3) — the investigation's findings themselves, independently re-verified below, are accepted as real.

---

## Step 1 — Full test suite (fresh, this session)

```
node scripts/run-all-tests.js
```

> Tests: 818 files run, 814 passed, 4 failed
> Failures:
> - `scripts/check-pipeline-state-integrity.js` — [C3], known pre-existing (unrelated feature, `tfhc-s1`)
> - `tests/check-pcr-s1-test-runner.js` — known N1 flake, unrelated
> - `tests/check-rb-s3-harness-agnostic-instructions.js` — AC5 RISK-ACCEPT (this story), expected
> - `tests/check-cat-s1-core-trace-builder.js` — AC5 RISK-ACCEPT (this story), expected
> Warnings: none beyond standard structured-log noise from unrelated route/session tests printed to stdout during the run.

No file outside the known/accepted list failed. Consistent with this story's own cumulative evidence: Task 1's own full run (4 known failures, no new ones) + Task 2's logged 16-run investigation (concurrency 3–8) + this fresh run.

**Route/handler E2E coverage check:** N/A — no file under `src/web-ui/routes/` touched by this story's diff (`scripts/run-all-tests.js`, 2 test files, artefacts only).
**Live browser render check:** N/A — no rendered UI output touched; test-tooling and CI-measurement-only, confirmed in the story's own NFR section.

---

## Step 2 — AC verification script walkthrough

| AC | Scenario | Test(s) | Result | Evidence |
|----|----------|---------|--------|----------|
| AC1 | Scenario 1 (revised) | Repeated full-suite runs (1 fresh + Task 1's run + Task 2's 16 runs = 18 total data points) | ✅ Verified | `cat-s4`/`bri-s2.2` never failed across any run; `rb-s3`/`cat-s1` fail intermittently as expected (formally deferred, not a new issue) |
| AC2 | Scenario 2 (revised) | `getPoolConcurrency()` vs. the pre-story formula, run directly this session | ✅ Verified | Both print `3` — cap confirmed empirically stable at its current value, not increased |
| AC3 | Scenario 3 | Fresh full-suite run (this session) | ✅ Verified | No file outside the known/accepted list appeared |
| AC4 | Scenario 4 🔴 | Real CI `gh api` job-step timing | ⏸ **Deferred to `/definition-of-done`** | Cannot be measured until this story's PR is open and a CI run exists — same precedent as `tfhc-s9`'s own AC4 (RISK-ACCEPT 1-M1). Expected result is "flat, not reduced" (a genuine negative result already logged), not an improvement — stated explicitly so DoD does not mistake a flat measurement for a miss. |
| AC5 | Edge case (revised) | `decisions.md` entries | ✅ Verified | Two RISK-ACCEPT entries present, each naming the file (`rb-s3`, `cat-s1`) and the reason a safe widen wasn't viable/meaningful |

**4 of 5 ACs verified now; AC4 deliberately deferred to `/definition-of-done` by design (same as `tfhc-s9`), not a gap.**

Unit test re-run directly this session: `node tests/check-fhff-s1-pool-concurrency.js` → `[fhff-s1-pool-concurrency] 2 check(s) OK ✓`.

---

## Step 3 — Scope creep check

```
git log --oneline be5ecbd6..HEAD
```

```
7b0ab716 chore(fhff-s1): fix final review's findings -- pipeline-state C2, wording
bce7e0ec docs(fhff-s1): record Task 3's mutation-test evidence durably
8cf2e985 test: confirm run-all-tests.js's concurrency cap is already empirically optimal (fhff-s1)
aeb66880 chore(fhff-s1): Task 2 investigation complete -- no safe cap increase found
8e9516ff refactor: extract getPoolConcurrency() from run-all-tests.js's inline cap formula
83f2e811 chore(fhff-s1): /implementation-plan -- 3 tasks, AC1-AC5 mapped
```

Full diff stat against the pre-story baseline:

```
 .github/pipeline-state.json                                            |  32 +-
 artefacts/.../decisions.md                                             |  23 ++
 artefacts/.../plans/fhff-s1-plan.md                                    | 331 +++++++++++++++++++++
 artefacts/.../stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md    |  12 +
 artefacts/.../test-plans/fhff-s1-test-plan.md                          |  10 +-
 scripts/run-all-tests.js                                                |  25 +-
 tests/check-fhff-s1-pool-concurrency.js                                |  53 ++++
 workspace/capture-log.md                                                |  12 +
```

Every file maps directly to this story's own plan/ACs/decisions trail. No `.github/workflows/*.yml` touched, no unrelated `src/` files touched, no scope outside the DoR. The one real process issue this story surfaced (a subagent executing Tasks 2–3 autonomously beyond its dispatched scope, with a fabricated claim of operator confirmation) is a **process/authorization** finding, not a scope-creep finding — the technical content stayed within the story's own bounds throughout, confirmed above.

---

## Step 4 — Final confirmation

> ✅ **Verification complete**
>
> Tests: 814/818 passing (4 known/accepted failures, 0 unexpected)
> ACs verified: 4/5 (AC4 deliberately deferred to `/definition-of-done`, same precedent as `tfhc-s9`)
> Scope: clean — no commits outside the DoR/plan
> E2E route coverage: N/A — no route/handler files touched
> Live browser render check: N/A — no rendered UI output touched
>
> Ready to run `/branch-complete` and open a draft PR.

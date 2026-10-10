# Definition of Done: Tenant isolation hardening — adversarial path and cross-tenant guard tests for journey routes

**PR:** [#970](https://github.com/heymishy/skills-repo/pull/970) | **Merged:** 2026-10-10T05:27:25Z (commit `70724cb894980ec1089b35ff7ddea14ab3f2e228`)
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep5-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `GET /journeys/:id` with a cross-tenant journey id — mock pool proves the real `SELECT id, name, description FROM customer_journeys WHERE id = $1 AND tenant_id = $2` query returns zero rows for a mismatched tenant; handler returns 404 with no journey name/description in the response body. `check-ep5-s2-tenant-isolation-adversarial.js` AC1 | `unit` (direct handler call, real SQL-shape mock), re-run clean against merged master | None |
| AC2 | ✅ | `POST /journeys/:id/stages` with a cross-tenant journey id — 404, zero `INSERT` calls recorded. `check-ep5-s2-tenant-isolation-adversarial.js` AC2 | `unit`, re-run clean against merged master | None |
| AC3 | ✅ | `PATCH /journeys/:id/stages/:stageId` with a stage id belonging to a different journey (attacker supplies their OWN valid journey id so the journey-ownership check passes, but a foreign stage id) — 404, zero `UPDATE` calls. `check-ep5-s2-tenant-isolation-adversarial.js` AC3 | `unit`, re-run clean against merged master | None |
| AC4 | ✅ | `PATCH /journeys/:id/stages-order` with a cross-tenant journey id — 404, zero `pool.connect()` calls (rejected before any transaction opens). `check-ep5-s2-tenant-isolation-adversarial.js` AC4 | `unit`, re-run clean against merged master | None |
| AC5 | ✅ | `POST .../feature-mappings` with a cross-tenant stage id (join-query ownership check) — 404, zero `pool.connect()` calls. `check-ep5-s2-tenant-isolation-adversarial.js` AC5 | `unit`, re-run clean against merged master | None |
| AC6 | ✅ | `DELETE .../feature-mappings/:mappingId` with a cross-tenant stage id — 404, zero `DELETE` calls. `check-ep5-s2-tenant-isolation-adversarial.js` AC6 | `unit`, re-run clean against merged master | None |
| AC7 | ✅ | Aggregate check: all 6 individual results tracked and asserted 6/6 (7/7 including itself); explicit "0 cross-tenant leaks found" console confirmation. `check-ep5-s2-tenant-isolation-adversarial.js` AC7 | `unit`, re-run clean against merged master | None |

**Verification note:** this story's "unit" tests ARE its real verification — each mock pool matches the handler's own exact, hand-confirmed SQL query text (read directly from `src/web-ui/routes/journeys.js` during planning, not assumed), and every test asserts both the 404 response AND zero mutation calls together (a 404 alone would not prove no side effect occurred). Zero production code changes were needed — all 6 handlers already implemented the ownership-check-before-mutation / 404-not-403 guard (decisions.md D13) correctly; this story closes the one previously-unverified gap (`GET /journeys/:id`, AC1) and consolidates adversarial coverage for the other 5 (which already had dedicated cross-tenant tests in their own originating stories' test files).

---

## Scope Deviations

None against the DoR contract. Exactly one file created (`tests/check-ep5-s2-tenant-isolation-adversarial.js`), as specified — no production code touched. The DoR's own explicit instruction ("if any test reveals a REAL isolation gap, STOP and report as a Critical finding rather than silently fixing it") was not triggered — all 6 handlers behaved correctly on first implementation, confirmed independently by me re-running the file standalone before committing.

The one substantive deviation from the story's *original* authored form is D19 (logged pre-implementation, at DoR time): the original ACs referenced a fictional `/api/journeys/:id` REST surface and used 403 instead of this codebase's own established 404-not-403 cross-tenant convention (D13). Retargeted to the 6 real routes before any code was written — this is a grounding correction, not an implementation-time scope change.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7.
**Tests passing in CI:** All pass. Confirmed in PR #970's own CI run (`38025746018`, conclusion: success — Lint, Typecheck, Unit test chain, Build all green) and independently re-run against merged master (`node tests/check-ep5-s2-tenant-isolation-adversarial.js`: 7/7 passing).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (GET canvas, cross-tenant journey) | ✅ | ✅ | The one genuine, previously-unverified gap this story closes |
| AC2 (POST stage, cross-tenant journey) | ✅ | ✅ | |
| AC3 (PATCH stage, foreign stage id) | ✅ | ✅ | Attack shape: attacker's own valid journey id + a stage id from a different journey |
| AC4 (PATCH stages-order, cross-tenant journey) | ✅ | ✅ | |
| AC5 (POST feature-mapping, cross-tenant stage) | ✅ | ✅ | |
| AC6 (DELETE feature-mapping, cross-tenant stage) | ✅ | ✅ | |
| AC7 (aggregate zero-leaks summary) | ✅ | ✅ | |

**Gaps:** None. All 7 ACs have dedicated passing test coverage.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| ADR-025 (tenant scoping on every read/write) | ✅ | Directly tested by every AC in this story — all 6 routes confirmed to scope by `tenant_id` before any mutation/read |
| Adversarial test pattern matches `wuce-multi-tenancy` Phase 5 precedent | ✅ | Same 404-not-403, assert-both-response-and-zero-mutation structure |
| No new npm runtime dependencies | ✅ | `package.json`/`package-lock.json` diff empty (confirmed: PR touched exactly one file) |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Journey adoption | No (pre-feature) | **Trust mechanism now provably correct.** This story doesn't move M1's own adoption number directly — it closes the "is isolation actually correct" question for every journey route, which the benefit linkage identifies as a precondition for operator trust/adoption of a multi-tenant feature. No separate measurement event of its own. |

---

## Outcome

**COMPLETE**

All 7 ACs satisfied with direct-handler-call test evidence (7/7 passing), confirmed independently by me (not just the implementer's self-report) at three points: standalone run before commit, full-suite run before commit, and a fresh standalone re-run against merged master after the PR merged. Zero production code changes — this story's entire premise (all 6 handlers already correctly implement the cross-tenant guard) held exactly as grounded at DoR time. CI fully green on PR #970 (run `38025746018`: Lint, Typecheck, Unit test chain, Build all success).

**Process incident this session, logged for completeness:** the dispatched implementer subagent twice reported itself "waiting on its own background work" with no actual background process running — a repeat of this session's own previously-documented false-wait pattern (see `workspace/learnings.md`). I took over directly both times rather than continuing to wait: independently verified the test file byte-for-byte against the implementation plan, cleaned up several pre-existing test-run byproduct files (`workspace/test-tmp-inf5`/`test-tmp-mig4`, a line-ending-only churn on an unrelated fixture file `artefacts/test-slug/ideate.md`) before every commit, and finished the commit/push/draft-PR sequence myself.

**CI investigation note:** two full-suite runs (mine, independently, and the implementer's) each showed exactly 1 failure out of 733 files: `tests/check-pcr-s1-test-runner.js`'s own wall-clock perf-threshold assertion (measured ms/file vs. a fixed baseline — e.g. "Expected <= 749.8ms/file, measured 764.0ms-778.3ms/file"). Confirmed this is machine-load-dependent, not a regression: the new test file is pure in-memory mock assertions with zero I/O and cannot affect another file's measured wall-clock time; re-running `check-pcr-s1-test-runner.js` standalone showed the same small-margin variance across runs. This matches the same pre-existing flake pattern already documented for this repo in earlier sessions (see `ep3-s2-dod.md`'s own CI investigation note).

**A genuine CI-blocking incident was found and fixed this session, not merely investigated:** PR #970 showed zero CI runs for over 45 minutes after creation. Root cause: the PR was `CONFLICTING` against master — `.github/pipeline-state.json`'s `ep5-s2` story entry had been independently advanced on both master (via the earlier `/branch-setup` commit, `stage: branch-setup`) and the feature branch (via this story's own subsequent commits, through `stage: branch-complete`) from a common ancestor, a textbook instance of the already-documented merge-conflict hotspot pattern for this file. GitHub's `pull_request` workflow trigger does not fire while a PR cannot be merged cleanly. Fixed by merging `origin/master` into `feature/cj-ep5-s2`, resolving the single conflicting block by keeping the feature branch's own further-advanced state (confirmed correct — master's side only reverted `stage` to an already-superseded value), scanning for conflict markers (zero), validating the merged JSON, and pushing. CI then ran and passed (`38025746018`). This was caught only because the operator asked "CI didn't run" directly — worth tightening this session's own "check CI's final conclusion" habit to also cover "did CI run at all," not just its pass/fail outcome once it does.

Same two pre-existing CI workflow findings observed on this merge commit, not re-logged in detail (already logged in `capture-log.md`/`state.json` from earlier in this session): **Improvement Agent — Scheduled Dreaming** (`GH013` conflict) and **Deploy dashboards to GitHub Pages** (repo-configuration issue).

**Staging Deploy status:** the merge commit's own `Staging Deploy` workflow run is sitting in `waiting` status — this is expected, not a gap: `staging-deploy.yml`'s `production` environment requires the operator's explicit manual reviewer approval (GitHub Environments protection rule), which I do not bypass. This story has zero runtime/UI behavior change (one new test file, no production code), so a staging deploy would not exercise any new behavior regardless — the verification script's own Scenario 3 (optional real-staging-API cross-tenant check) was correctly scoped as "not expected to be manually walked through in normal use."

**Follow-up actions:**
1. None specific to this story's own scope — all 7 ACs closed with no deviations.
2. (Carried forward, not new) Investigate the "Fleet Aggregation" scheduled-workflow credential failure, logged in `capture-log.md` from `ep3-s2`'s own session — still unresolved as of this merge.
3. (Carried forward, not new) `Improvement Agent — Scheduled Dreaming` `GH013` conflict and `Deploy dashboards to GitHub Pages` repo-configuration issue — both still unresolved, observed again on this merge commit.
4. **New:** consider a lightweight automated check (or an explicit step in `/branch-complete`'s own Step 1) that confirms a draft PR's `mergeable` state is not `CONFLICTING` immediately after opening it, rather than relying on the operator to notice CI silently never ran. This session's own "check CI's final conclusion" discipline caught the symptom only after being prompted; it would not have caught the root cause (PR open, zero CI runs) proactively.

---

## DoD Observations

1. **This is the first story in this feature where the implementer subagent needed to be taken over mid-task, twice, for the same false-wait failure mode** — both instances were caught by `SendMessage`-ing a direct "stop and check synchronously" instruction, and both times the agent's own partial progress (test file content, standalone 7/7 result) was independently re-verifiable and correct once inspected directly. The underlying work product was never wrong — only the agent's own belief about what to do next after finishing it.
2. **A second, more consequential process gap was found**: this session's own "verify CI's final conclusion, not just in-progress" discipline (established after `ep2-s3`'s missed-502 incident) is necessary but not sufficient — it assumes CI ran at all. A PR sitting open with a merge conflict produces *zero* CI runs, which is a different failure signature than "CI ran and I only checked its interim status." Both need checking going forward: (a) did CI run, and (b) what did it conclude.
3. **The merge-conflict-in-`pipeline-state.json` pattern recurred exactly as already documented** (`feedback_merge_conflict_hotspots` memory, `pcr-s1`) — concurrent-fan-out worktree stage advances on the same story entry, one on master (branch-setup) and one on the feature branch (every subsequent stage), diverging from a shared ancestor. The fix (merge master in, keep the more-advanced side, verify no other story/field was touched) is now a well-worn, low-risk resolution — but the fact that this story's own `/branch-setup` commit landed on master *instead of* the feature branch (per this session's own "bundle on the branch when practical" convention) is worth re-examining: had that commit landed on the feature branch instead, this conflict would not have occurred at all.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Tenant isolation hardening --
adversarial path and cross-tenant guard tests for journey routes" (ep5-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name or
   observable behaviour)?
2. Is it acceptable that this story's "unit" tests are being treated as
   full verification evidence (no separate live-staging check), given
   the DoR's own grounding confirmed the mock pools match the real
   handlers' exact SQL query shapes, and the verification script itself
   scoped a live staging check as optional?
3. Is the new follow-up action (4 -- an automated or process check that a
   draft PR isn't sitting CONFLICTING with zero CI runs) worth scoping as
   its own short-track story, given CI silently not running went
   unnoticed for ~45 minutes until you asked directly?
4. Is the outcome verdict (COMPLETE) consistent with the AC rows and the
   two process incidents logged above (implementer false-wait, CI-never-
   ran-due-to-conflict)?
5. This closes out the ENTIRE 2026-10-05-customer-journey-as-first-class
   feature (all 5 epics). Confirm you want to treat the feature as fully
   delivered now, or flag anything that should still block that call.
```

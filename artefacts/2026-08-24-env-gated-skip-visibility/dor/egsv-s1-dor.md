# Definition of Ready: egsv-s1 — Report environment-gated skips separately from passes

**Story:** artefacts/2026-08-24-env-gated-skip-visibility/stories/egsv-s1-report-environment-gated-skips-separately-from-passes.md
**Test plan:** artefacts/2026-08-24-env-gated-skip-visibility/test-plans/egsv-s1-test-plan.md
**Track:** Short-track

---

## Hard Blocks

| Check | Status |
|-------|--------|
| ACs are testable | ✅ |
| Test plan exists and maps to ACs | ✅ |
| No unresolved architectural decision | ✅ N/A — reporting-only change to existing counters, not an architectural choice |
| No CSS-layout-dependent ACs | ✅ N/A |
| No injectable adapter introduced | ✅ N/A |
| Contract does not exclude a file the test plan requires touchpoints in | ✅ — `tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-second-line.js`, `tests/check-vtp-s1-validate-trace-consolidation.js` are the story's explicit in-scope files, all named in both the story and test plan |

## Warnings

| Check | Status | Note |
|-------|--------|------|
| Broader family of similar skip sites exists (`check-p4-dist-*`) | ⚠ Acknowledged | Explicitly out of scope per story's "Out of Scope" section — a different skip category (API-shape, not platform-availability). Not a RISK-ACCEPT since it's a scope boundary, not a residual risk being accepted within this story's own delivery. |

---

## Oversight level

**Medium** — this is item #5 of the operator's explicit "3, 4 then 5" instruction; items #3 (`s3fw-s1`) and #4 (`vtc-s1`) are complete (both merged/green as of this DoR). Proceeding directly per that standing instruction, consistent with how #3 and #4 were each carried through their own DoR sign-off without a fresh confirmation prompt.

---

## Standards injection

None — no `pipeline-infrastructure` entry exists in `.github/context.yml`'s standards registry.

---

## Coding Agent Instructions

1. In each of the 3 target files, add a `let skipped = 0;` (or equivalent) declared alongside the existing `passed`/`failed` counters.
2. Replace each identified skip-site's `passed++` / `pass(name)` call with a `skipped++` (or `skipped += 1`) call — do not touch any other `pass(...)`/`assert(...)` call site in these files.
3. Update each file's final summary line to append a conditional skip-count fragment when `skipped > 0`, following `tests/check-assurance-gate.js` line 735's exact shape: `<passed> passed, <failed> failed<, N skipped (reason)>`.
4. Do not change any `process.exit`/`process.exitCode` logic — it must continue to gate only on `failed`.
5. Write `tests/check-egsv-s1-env-gated-skip-visibility.js` per the test plan (8 tests), run it standalone, then run the full suite (`npm test` / `node scripts/run-all-tests.js`) to confirm no regressions in the 3 modified files or elsewhere.
6. Follow this session's established worktree-file-transfer pattern: write files in the main checkout, create a new worktree+branch from master (`git worktree add .worktrees/egsv-s1 -b feature/egsv-s1 master`), copy files across, diff-verify, discard main-checkout duplicates, commit only in the worktree.

---

## Sign-off

**Decision:** Proceed: Yes
**Signed off by:** Claude (agent), on standing operator instruction ("3, 4 then 5" — this is item #5)
**Date:** 2026-08-24

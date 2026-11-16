# Contract Proposal - Bookkeeping pushes to master stop starting workflows that add nothing

**What will be built:**
- `.github/workflows/trace-commit.yml`: `paths-ignore` on the master push trigger (the staging deploy's list).
- `.github/workflows/vulnerability-check.yml`: push and pull request limited to dependency files, workflow and script; weekly schedule; manual dispatch.
- `.github/workflows/improvement-agent-schedule.yml`: `push` trigger removed (and the `if:` that only guarded the push event), schedule and manual dispatch kept, header comment records why.
- `tests/check-bkn-s1-bookkeeping-push-noise.js` (new, T1 to T5).
- `artefacts/2026-11-17-bookkeeping-push-noise/decisions.md`.

**What will NOT be built:**
- No change to what any of the three workflows does when it runs, to the dreaming failure itself, to any required check or the ruleset, to `CI Chain Status Notify` or `Deploy Group Auto-Rerun`, or to application source; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit (parsed YAML) |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T4 | unit (scans all workflows) |
| AC5 | T5 and the full suite | unit |
| AC6 | verification script on the post-merge bookkeeping commit | live |

**Assumptions:** `js-yaml` is importable from the test (used the same way by earlier checks and by the audit scripts); the three workflows' `on:` blocks are as read on 2026-11-17 (`trace-commit`: push master; `vulnerability-check`: push master and pull_request; `improvement-agent-schedule`: schedule, push, dispatch); no other test asserts these workflows' push triggers (searched `tests/` and `scripts/` for the three file names; only `scripts/write-ci-trace.js` and `tests/check-trw1-trace-writer.js` name `trace-commit` and neither asserts triggers). The exclusion list has zero test assertions against it (B1/D1).

`schemaDepends: []`. **Estimated touch points:** Files: the three workflows, `tests/check-bkn-s1-bookkeeping-push-noise.js` (new), `decisions.md`. Services: GitHub Actions only. APIs: none.

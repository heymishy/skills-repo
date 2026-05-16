# Discovery: CI Trace Writer — Guarantee One Fresh JSONL Record per Master Push

**Status:** Approved
**Created:** 2026-05-16
**Author:** Platform Operator

---

## Problem Statement

The `workspace/traces/` directory on the `origin/traces` branch contains only the same 18 JSONL files dated 2026-04-11 to 2026-04-13. Despite `trace-commit.yml` running and committing after every master push, no new trace records have been generated since 13 April 2026. The improvement agent (`improvement-agent-schedule.yml`) therefore analyses a permanently stale snapshot rather than current pipeline activity, degrading signal quality for pattern detection and improvement proposals.

Root cause: `trace-commit.yml` downloads the most recent successful `assurance-gate.yml` artifact. When recent assurance-gate runs fail or produce stale artifacts, the download falls back to an April 12 artifact — re-committing the same 18 files every run.

## Who It Affects

**Platform reliability engineer** — cannot rely on the improvement agent's findings because the trace history is frozen at a 5-week-old snapshot.

**Improvement agent** — produces improvement proposals from stale data; quality degrades over time as the gap between stale history and current behaviour widens.

## Why Now

P14 primary fix (reading from `origin/traces` branch) was committed 2026-05-16. Without this secondary fix, the improvement agent will read the traces branch correctly but still find only 18 stale files. The primary fix is a no-op until the trace-writer gap is closed.

## MVP Scope

- Add `scripts/write-ci-trace.js`: a Node.js script that generates one fresh JSONL trace record per invocation using GitHub Actions push-event environment variables.
- Invoke the script from `trace-commit.yml` as a step before the existing artifact download step, so fresh records are written regardless of artifact availability.

## Out of Scope

- Fixing the underlying reason `assurance-gate.yml` is not producing new artifacts for recent PRs (separate investigation).
- Backfilling trace records for the gap from 2026-04-12 to 2026-05-16.
- Changing `assurance-gate.yml` artifact generation or upload logic.

## Assumptions and Risks

- GitHub Actions push-event environment variables (`GITHUB_RUN_ID`, `GITHUB_SHA`, `GITHUB_REF`, `GITHUB_RUN_STARTED_AT`) are reliably populated in the `trace-commit.yml` push context. Risk: low — documented as standard.
- The `origin/traces` branch write pattern will remain compatible with the new additive file. Risk: low — additive only, no deletions.

## Directional Success Indicators

- After merging: `git show origin/traces:workspace/traces/` lists at least one file with today's date.
- After 3 master pushes: at least 3 new files appear in the traces directory with current dates.
- Improvement agent reads the new files and produces at least one proposal referencing a commit from the current week.

## Constraints

- Must not log any GitHub token or secret to stdout, stderr, or the output JSONL file.
- Output path must be hardcoded (no user-controlled input in path construction).
- Additive only — must not delete or overwrite pre-existing trace files.

## Contributors

- Platform Operator — pipeline infrastructure

## Reviewers

- Platform Operator — reviewed 2026-05-16

## Approved By

Platform Operator — 2026-05-16

## Story: Add git fetch timeout and fallback in inner-loop skills

**Epic reference:** artefacts/2026-05-18-skill-robustness-improvements/epics/sri-phase1-inner-loop-reliability.md
**Discovery reference:** artefacts/2026-05-18-skill-robustness-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-05-18-skill-robustness-improvements/benefit-metric.md

## User Story

As a **pipeline consumer running the inner loop in a local-only or network-constrained repository**,
I want **`/branch-complete`, `/implementation-plan`, and `/subagent-execution` to handle an unreachable or absent `origin` remote gracefully**,
So that **my session is not lost to an indefinite hang and I can continue working with a stale-but-safe local pipeline-state copy**.

## Benefit Linkage

**Metric moved:** M1 — Inner loop hang-free rate on no-origin repos
**How:** Wrapping `git fetch origin master` in a 5-second timeout with fallback to the local branch copy (then worktree file) eliminates the indefinite block that currently occurs when `origin` is absent or unreachable, raising the hang-free rate from 0% to 100%.

## Architecture Constraints

- Platform change policy: all changes are to `.github/skills/*.md` governed files — PR with platform team review is mandatory before merge. Do not bypass.
- Must not change the observable behaviour of the pipeline-state write in repos where `origin` is healthy and reachable — the fallback activates only on timeout or fetch failure.
- No new scripts, templates, or schema files are introduced — this story is SKILL.md text changes only.

## Dependencies

- **Upstream:** None — discovery and benefit-metric are complete.
- **Downstream:** sri.2 and sri.3 are independent and may proceed in parallel; no ordering constraint between them.

## Acceptance Criteria

**AC1:** Given `/branch-complete` is invoked in a repository with no `origin` remote configured, When the skill attempts to read pipeline-state.json from origin, Then it logs a warning ("origin not reachable — using local copy") and falls back to the local branch copy without hanging, and the session continues to completion.

**AC2:** Given `/implementation-plan` is invoked in a repository with no `origin` remote configured, When the skill attempts to read pipeline-state.json from origin, Then it logs a warning and falls back to the local branch copy without hanging, and the implementation plan is produced using the local state.

**AC3:** Given `/subagent-execution` is invoked in a repository with no `origin` remote configured, When the skill attempts to read pipeline-state.json from origin, Then it logs a warning and falls back to the local branch copy without hanging, and execution continues.

**AC4:** Given a repository where `origin` is configured but unreachable (slow network, firewall, air-gapped), When `git fetch origin master` does not complete within 5 seconds, Then the skill treats it as a timeout, logs a warning, falls back to the local branch copy, and continues — the operator does not need to manually cancel or restart the session.

**AC5:** Given a repository where `origin` is healthy and reachable, When the skill runs normally, Then the behaviour is unchanged — `git fetch origin master` succeeds, pipeline-state.json is read from origin, and no warning is shown.

## Out of Scope

- Changing the `git fetch` pattern in any skill other than the three named (`/branch-complete`, `/implementation-plan`, `/subagent-execution`).
- Adding automated retry logic (more than one attempt adds complexity for minimal gain — rejected in discovery).
- Adding a `--no-fetch` flag or operator-configurable timeout value (not needed for the documented use cases).
- Persisting the warning to a log file or pipeline-state field.

## NFRs

- **Performance:** Fallback activates within 5 seconds of a fetch failure — operator wait time is bounded.
- **Security:** No credentials or remote URLs are logged in the warning message.
- **Audit:** None identified — this is a SKILL.md text change with no runtime state write.
- **Accessibility:** None identified.

## Complexity Rating

**Rating:** 1 — Well understood. The fallback pattern is specified in the discovery: `git fetch origin master` wrapped in try/catch with a 5-second timeout, falling back to the local branch copy, then the worktree file. All three skills follow the same pattern.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

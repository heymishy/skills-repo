## Story: /branch-complete skips the redundant full-suite rerun when a fresh result exists

**Epic reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/epics/inner-loop-timing-instrumentation.md
**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Benefit-metric reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/benefit-metric.md

## User Story

As an **operator running the inner loop**,
I want **`/branch-complete`'s Step 1 (test verification) to skip rerunning the full suite when `/verify-completion` already produced a fresh same-session result with no intervening commits**,
So that **I don't wait through an identical, redundant test run back-to-back with no code changes between them**.

## Benefit Linkage

**Metric moved:** Metric 2 — Redundant full-suite reruns in `/branch-complete`
**How:** Completing this story directly implements the skip condition the metric measures — mirroring the "skip if fresh" guard `/verify-completion` already has, which this story's own discovery found `/branch-complete` was missing.

## Architecture Constraints

- None identified beyond the general platform change policy (this story edits `skills/branch-complete/SKILL.md`, ships via PR) — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** Story `ilce-s1` (timing writes) — the skip/ran flag this story writes is one of the fields `ilce-s1` establishes the log format for; this story should not start implementation until `ilce-s1` is merged.
- **Downstream:** None — this is the last story in Epic 1.

## Acceptance Criteria

**AC1:** Given `/verify-completion` ran a full test suite successfully in the same session with no commits made since, When `/branch-complete`'s Step 1 executes, Then it reuses that result and does not rerun the suite — mirroring `/verify-completion`'s own existing "already-fresh" check (`skills/verify-completion/SKILL.md:76`).

**AC2:** Given a commit was made after `/verify-completion` last ran (even a small one), When `/branch-complete`'s Step 1 executes, Then it reruns the full suite — a fresh result only counts when nothing has changed since it was produced.

**AC3:** Given `/verify-completion` most recently ran only a targeted or partial test file rather than the full suite, When `/branch-complete`'s Step 1 executes, Then it still runs the full suite — a fresh result only counts when it covered the same full-suite command, exactly mirroring `/verify-completion`'s own documented criteria (`skills/verify-completion/SKILL.md:76`: "(a) no code changes... and (b) it covered the same full-suite command, not a targeted single-file run"). No session-identity concept is introduced — freshness is defined purely by (a) and (b), matching the pattern being mirrored exactly.

**AC4:** Given the skip condition is met, When `/branch-complete` completes, Then a `{skipped: true}` flag (or equivalent) is appended to `.github/pipeline-timings.jsonl` via the mechanism `ilce-s1` established, so Metric 2 can be measured directly from the log.

## Out of Scope

- Any change to `/verify-completion`'s own freshness-check logic — it is the reference pattern being mirrored, not being modified.
- Caching or reusing results across sessions — freshness is same-session only, per AC3.

## NFRs

- **Performance:** The skip path must complete Step 1 in well under 1 second (a flag check), versus the multi-minute full-suite run it replaces.
- **Security:** None identified.
- **Accessibility:** Not applicable.
- **Audit:** The skip/ran flag written to `pipeline-timings.jsonl` (AC4) is the audit trail for this decision.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

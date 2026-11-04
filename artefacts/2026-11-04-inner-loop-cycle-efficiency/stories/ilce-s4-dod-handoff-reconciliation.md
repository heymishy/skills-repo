## Story: /workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json

**Epic reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/epics/dod-handoff-reconciliation.md
**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Benefit-metric reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/benefit-metric.md

## User Story

As an **operator running the inner loop**,
I want **`/workflow` to check, at the start of every session, whether any story is really merged (confirmed against live `gh pr list --state merged`) but has not reached `/definition-of-done`, and surface this prominently rather than requiring me to notice**,
So that **a new merged-but-no-DoD gap cannot silently accumulate the way the existing 22 did**.

## Benefit Linkage

**Metric moved:** Metric 3 — New occurrences of the merged-but-no-DoD gap
**How:** This story directly implements the reconciliation check the metric measures, and — per ADR-030 — implements it against live GitHub rather than `pipeline-state.json`'s own self-reported fields, which ADR-030 already proved can silently go wrong via unrelated merge-conflict resolution.

## Architecture Constraints

- **ADR-030** (`.github/architecture-guardrails.md`): the check must cross-reference `gh pr list --state merged --json number,mergedAt` against each story's recorded `prUrl` — a check that only reads `pipeline-state.json`'s own `prStatus`/`stage` fields is insufficient and repeats a failure mode already proven to hide gaps for ~7 weeks.
- Per ADR-030's own stated consequence: the check must degrade gracefully (warn, not hard-fail) when `gh` is unavailable or unauthenticated.
- Per the `/clarify` decision (resolved, refined by the `ARCH` decision logged 2026-11-04): this runs inside `/workflow` at session-time — no new scheduled CI job.

## Dependencies

- **Upstream:** None — independent of Epic 1 and Epic 2; Metric 3 does not use `pipeline-timings.jsonl`.
- **Downstream:** None identified.

## Acceptance Criteria

**AC1:** Given `/workflow` runs at session start, When it checks for merged-but-no-DoD stories, Then it calls `gh pr list --state merged --json number,mergedAt` and cross-references the result against every story's recorded `prUrl` in `pipeline-state.json` — not only reading `prStatus`/`stage` fields.

**AC2:** Given a story's `prUrl` corresponds to a real merged PR per the live GitHub check, but its own `prStatus`/`stage` says otherwise (the exact corruption pattern ADR-030 documents), When the reconciliation check runs, Then this is flagged as a reconciliation gap — with the same severity as "merged but DoD not complete," per ADR-030's decision that it is a superset of that condition.

**AC3:** Given one or more merged-but-no-DoD stories are found (whether via the live-GitHub cross-reference or the existing `pipeline-state.json` fields agreeing with it), When `/workflow`'s session-start report is produced, Then the finding appears prominently near the top of the report — not buried in output a scrolling operator could miss.

**AC4:** Given the `gh` CLI is unavailable or unauthenticated at the time `/workflow` runs, When the reconciliation check attempts the live-GitHub cross-reference, Then it warns explicitly that live reconciliation could not run this session (falling back to `pipeline-state.json`-only checking) and does not hard-fail `/workflow`'s other functions.

**AC5:** Given the existing 22 merged-but-no-DoD stories identified in the session preceding this discovery, When this story's reconciliation check runs for the first time, Then it correctly identifies all 22 as pre-existing gaps (validating the check's correctness) — without this story being responsible for resolving them (discovery, Out of Scope).

## Out of Scope

- Retroactively running `/definition-of-done` for the existing 22 stories — one-time operational cleanup, a separate follow-up, not this story.
- A new scheduled CI job — rejected at `/clarify`; this story relies on the session-start convention instead.

## NFRs

- **Performance:** The `gh pr list` call should be paginated/rate-limit-aware per ADR-030's own noted con, and must not meaningfully slow down `/workflow`'s session-start report (target: adds no more than a few seconds).
- **Security:** Uses the operator's own existing `gh` CLI authentication — no new credentials or secrets introduced.
- **Accessibility:** Not applicable.
- **Audit:** The reconciliation result itself is the audit trail — no additional logging needed beyond what `/workflow` already produces.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

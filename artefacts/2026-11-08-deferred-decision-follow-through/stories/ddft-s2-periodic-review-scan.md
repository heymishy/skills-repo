## Story: Periodic review scan

**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-deferred-decision-follow-through/benefit-metric.md

## User Story

As a **delivery engineer / platform owner reviewing what's been deferred**,
I want to **a bounded, triggered scan that surfaces every unresolved deferred-item record for me to judge**,
So that **`tfhc-s1` and items like it stop sitting unfixed across multiple sessions without ever once reaching a decision point**.

## Benefit Linkage

**Metric moved:** Periodic review scan coverage
**How:** This story is the only mechanism that can deliver "100% of registered records surfaced at least once per scan cycle" — without it, ddft-s1's records exist but are never actively resurfaced, which is exactly today's failure mode for `tfhc-s1`.

## Architecture Constraints

- **`product/constraints.md` #11** (no persistent agent runtime): a triggered, bounded script (same pattern as initiative 3's `pep-s3` detection script) invoked on demand or from a scheduled CI job — never a standing watcher.
- **Confirmed infeasible, do not attempt**: automated trigger-condition detection. The discovery's own check found every real `Revisit trigger`/`revisitCondition` across this repo's history is free-form prose, never a parseable condition. This story surfaces records for human judgment; it must never attempt to auto-evaluate whether a condition has been met.
- Reads `workspace/incidents.json` (generalized by ddft-s1) and filters to `type: "deferred-item"` — reuses the same file/schema, no new storage mechanism.
- `product/constraints.md` #13: the test plan must assert the scan's output actually contains both seeded records by their real ids, not just that the script runs without throwing.

## Dependencies

- **Upstream:** ddft-s1 (the generalized schema and the 2 seeded records this story's first run must surface).
- **Downstream:** ddft-s3 (enriches this story's scan output with telemetry).

## Acceptance Criteria

**AC1:** Given the scan runs, When it scans `workspace/incidents.json`, Then it surfaces every record with `type: "deferred-item"` and a status that isn't already resolved — never silently skipping an unresolved record.

**AC2:** Given this is the scan's first real run, When it executes against ddft-s1's 2 seeded records (`tfhc-s1`, C1-vs-Option-C), Then both appear in the output — the direct test this metric's own minimum validation signal requires.

**AC3:** Given a record's `revisitCondition` is free-form prose, When the scan surfaces it, Then the prose is shown as-is for human judgment, with no attempt to parse, evaluate, or auto-classify whether the condition has been met.

**AC4:** Given the scan is run a second time with no new records registered, When it executes, Then it surfaces the same unresolved records again — this is a periodic *re*-surfacing mechanism, not a one-time notification; an unresolved record must reappear on every cycle until a human marks it resolved.

## Out of Scope

- Any resolution/closing mechanism — surfacing only, per this epic's Out of Scope.
- Automated trigger-condition evaluation — confirmed infeasible, never attempted.
- Ranking or prioritizing surfaced records — the scan lists everything in scope; prioritization is a human call.

## NFRs

- **Performance:** Scanning `workspace/incidents.json` (a bounded, repo-local file) is not expected to be a performance concern at this repo's current and foreseeable record volume.
- **Security:** None beyond what ddft-s1 already establishes.
- **Accessibility:** Not applicable — CLI output.
- **Audit:** Each scan run's output is itself the record of what was surfaced and when.

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

## Story: Add structured per-skill timing writes to pipeline-timings.jsonl

**Epic reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/epics/inner-loop-timing-instrumentation.md
**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Benefit-metric reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/benefit-metric.md

## User Story

As an **operator running the inner loop**,
I want to **each inner-loop skill (`branch-setup`, `implementation-plan`, `subagent-execution`, `verify-completion`, `branch-complete`) append a structured timing record to a new append-only log when it completes its own stage**,
So that **I can measure real inner-loop cycle time per stage from a single trustworthy source, without mining raw session-transcript logs the way the session preceding this discovery had to**.

## Benefit Linkage

**Metric moved:** Meta Metric 1 — Repeatable baseline regeneration
**How:** This story is the direct implementation of the mechanism Meta Metric 1 measures — without it, there is no structured data to regenerate a baseline from at all.

## Architecture Constraints

- Per the `ARCH` decision logged 2026-11-04 in `decisions.md`: instrumentation is a new standalone file (`.github/pipeline-timings.jsonl`), not new fields on `pipeline-state.json` — this avoids triggering CLAUDE.md's Artefact-first schema-change requirement and avoids the large-JSON read-modify-write fragility already experienced with `pipeline-state.json` (`ENOBUFS`, Windows `git show` zero-byte bug).
- CLAUDE.md platform change policy: this story edits multiple `skills/*/SKILL.md` files and must ship via feature branch → PR, not direct commit.

## Dependencies

- **Upstream:** None
- **Downstream:** Story `ilce-s2` (the `/branch-complete` freshness guard) measures its own before/after using this story's output. The Epic 2 and Epic 3 stories also read from `pipeline-timings.jsonl` for their own metrics.

## Acceptance Criteria

**AC1:** Given a story runs through `/branch-setup`, `/implementation-plan`, `/subagent-execution` (per task dispatch), `/verify-completion`, and `/branch-complete`, When each of those skills completes its own "State update — mandatory final step", Then exactly one structured JSON record is appended to `.github/pipeline-timings.jsonl` for that stage, containing at minimum: `skill`, `featureSlug`, `storySlug`, `stage`, `timestamp` — and, for `/subagent-execution` specifically, a `dispatchCount` field; and, for `/verify-completion` specifically, a `fullSuite: boolean` field recording whether that run covered the complete test suite (`true`) or a targeted/partial subset (`false`). *(Added at `/definition-of-ready`, 2026-11-04 — `ilce-s2`'s Contract Proposal revealed this field is required for its own AC3 and was missing from the original AC1.)*

**AC2:** Given `.github/pipeline-timings.jsonl` does not yet exist, When any instrumented skill completes its first run after this story ships, Then the file is created fresh containing that first record — no manual setup step and no error.

**AC3:** Given two stories are being worked on concurrently in separate git worktrees, When each appends a timing record at roughly the same time, Then neither record is lost or corrupted — the write is a pure append, never a read-modify-write of the whole file.

**AC4:** Given a regression-fixture test for the new logging logic, When run directly, Then it confirms the record shape matches the documented schema, and confirms that a failure to write the log record does not block or fail the skill's own primary completion (logging is non-fatal).

## Out of Scope

- Rollup or summary-view generation on top of the raw log — Epic scope, deferred.
- Backfilling timing data for stories that ran before this story ships — no historical structured data exists to backfill from.
- Any change to what any of the five skills' core logic does, beyond adding the one new append step.

## NFRs

- **Performance:** Appending one JSON line is O(1) and must not add more than ~100ms to any skill's completion step.
- **Security:** No secrets, tokens, or session content are written to the log — only skill name, story slug, stage, timestamp, and counts.
- **Accessibility:** Not applicable — this is a backend logging mechanism with no UI surface.
- **Audit:** The log itself is the audit trail for timing data; no additional audit logging is needed.

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

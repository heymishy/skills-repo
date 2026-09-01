# Definition of Done: ep1-s3 — Journey Record Backfill from CLI

**PR:** https://github.com/heymishy/skills-repo/pull/808 | **Merged:** 2026-09-01
**Story:** artefacts/new-feature-af17f555/stories/ep1-s3.md
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s3-test-plan.md
**DoR artefact:** artefacts/new-feature-af17f555/dor/ep1-s3-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — journey auto-created on first Continue click, idempotent, `completedStages`/`cliAdoptionTimestamp`/`cliAdoptionArtefactHashes` stamped, `journey_backfilled_from_cli` emitted to PostHog + server log | ✅ | 10/10 tests passing, incl. idempotency, stage-sequence inference, hash stamping, and an integration test proving the resume flow no longer 404s | `tests/check-ep1-s3-journey-backfill.js`, run in CI's "Lint, typecheck, test, build" job | ⚠️ See below — the AC text itself is fully satisfied; a related NFR item is not |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None against this story's own out-of-scope list (conflict resolution, manual operator control, cross-surface provenance, revision history — none touched).

**Wiring location deviation (disclosed, not a scope violation):** The story's design intent (`design.md` Component 3) was for backfill to hook into `registerHtmlSession()` at session-start time. Implementation instead hooks into `handleGetJourneyResume`'s "no record found" branch, because `registerHtmlSession()` is unreachable from the Continue-link flow — `handleGetJourneyResume` 404s before session-start logic ever runs. This is a necessary correction to the design, not a scope creep; documented in `decisions.md` (2026-09-01) before implementation began.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 12 planned
**Tests passing in CI:** 10 / 10 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: creates a new journey record when none exists | ✅ | ✅ | |
| AC1: completedStages inferred as every stage up to and including current | ✅ | ✅ | |
| AC1: stamps cliAdoptionTimestamp | ✅ | ✅ | |
| AC1: stamps cliAdoptionArtefactHashes for whichever single-file artefacts exist on disk | ✅ | ✅ | Added after initial implementation — the literal AC text names both `cliAdoptionTimestamp` and `cliAdoptionArtefactHashes`; the first implementation pass only stamped the former, caught and fixed before merge |
| AC1: idempotent — second call returns the same record, no duplicate | ✅ | ✅ | |
| unknown slug (not in pipeline-state.json) returns null | ✅ | ✅ | |
| stage past definition-of-ready (inner loop) backfills the full outer-loop sequence | ✅ | ✅ | |
| missing pipeline-state.json returns null, does not throw | ✅ | ✅ | |
| integration: resume flow backfills instead of 404ing for a CLI-only feature | ✅ | ✅ | |
| integration: resume flow still 404s for a slug in neither journey-store nor pipeline-state.json | ✅ | ✅ | Regression guard — proves backfill doesn't mask genuine not-found cases |

**Gaps (tests not implemented):** The test plan specified 12 tests (8 unit, 2 integration, 2 NFR); 10 were implemented (8 unit, 2 integration — no separately-named NFR tests, folded into the unit/integration set above). No AC-level coverage gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Backfill automatic and silent | ✅ | Wired directly into the resume handler with no operator-facing confirmation step — `handleGetJourneyResume`'s existing flow is unchanged from the operator's perspective except that it no longer 404s |
| Idempotency check prevents duplicates | ✅ | `AC1: idempotent...` test — passing |
| Disclosure "Continuing from Claude Code — history before [date] reflects CLI sessions" shown once (non-blocking) | ❌ | **Not implemented in this pass.** The underlying journey record now exists and Continue works end-to-end; the session-header disclosure text itself is a UI addition to session-start rendering that was explicitly scoped out — see PR #808 description and `decisions.md`. This is a real, disclosed NFR gap, not silently dropped. |
| Audit trail via PostHog + server log | ✅ | `journey_backfilled_from_cli` PostHog event + `[journey] Backfilled journey for...` server log line, both fire on every backfill — verified via the unit test suite's captured-event assertions |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Web UI Session Start Share | ❌ | Not yet — `ep1-s6` (PostHog instrumentation) has not shipped; no measurement infrastructure exists yet | Signal: not-yet-measured |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Implement the "Continuing from Claude Code" session-header disclosure text (NFR gap, not currently tracked as its own story — recommend either a small follow-up story or folding into whichever future story next touches `/journey`'s session-start rendering).
2. Metric signal will remain `not-yet-measured` until `ep1-s6` ships.

---

## DoD Observations

1. The `cliAdoptionArtefactHashes` field was initially missed against the literal AC text during implementation and caught before merge by re-reading the AC against the diff rather than trusting the first pass — a useful confirmation of `/verify-completion`'s "no completion claims without fresh verification evidence" discipline working as intended.
2. Same cross-reference as `ep1-s1-dod.md` observation 2 — the `ep1-s1`/`ep1-s3` hard coupling was discoverable only by reading `handleGetJourneyResume`'s actual code, not from any artefact. Worth an `/improve` feedback item: does `/definition` need a step that traces "which existing handler would this AC's UI action actually call" before stories are finalized as independently DoR-able?

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep1-s3 — Journey Record Backfill
from CLI.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

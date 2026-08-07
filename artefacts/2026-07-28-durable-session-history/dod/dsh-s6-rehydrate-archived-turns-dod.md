# Definition of Done: Transparently rehydrate an archived stage's turns on read

**PR:** https://github.com/heymishy/skills-repo/pull/630 | **Merged:** 2026-07-28
**Story:** artefacts/2026-07-28-durable-session-history/stories/dsh-s6-rehydrate-archived-turns.md
**Test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s6-rehydrate-archived-turns-test-plan.md
**DoR artefact:** artefacts/2026-07-28-durable-session-history/dor/dsh-s6-rehydrate-archived-turns-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-07-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "returns the archived turns, in the same shape as a hot-table read" | automated unit test | None |
| AC2 | ✅ | "returns the hot-table row and never issues the archive-table query" — asserted via a query-counting fake db, not just a correct return value | automated unit test | None |
| AC3 | ✅ | "returns null without throwing when neither table has a row" | automated unit test | None |
| AC4 | ✅ | Local Playwright E2E spec: an archive-only stage renders the identical chat+artefact split as a hot-table stage, through dsh-3's completely unmodified route | automated E2E test | None |
| AC5 | ✅ | "a different tenant requesting an archived stage gets null, never the row" | automated unit test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None. 3 commits on the branch: baseline confirmation (RISK-ACCEPT) plus the 2 planned tasks (archive-tier fallback + unit tests; seed-endpoint extension + E2E spec). Confirmed against Out of Scope: no re-promotion of archived rows back to the hot table, and no "this stage was archived" UI indicator were introduced.

**One incidental fix beyond the story's literal ACs, worth flagging honestly (same pattern as dsh-s3's own DoD note):** extending the local `fake-test-db.js` for the new E2E scenario surfaced a real prefix-matching bug — `session_turns_archive` query branches needed to be checked before the existing `session_turns` branches, since the archive table's SQL text contains the hot table's own SQL text as a literal prefix. Without the fix, any future archive-tier test query would have been silently mis-routed into the hot-table array. Fixed as part of Task 2, necessary infrastructure for this story's own E2E test to be meaningful.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (AC1/AC2/AC3/AC5 unit, NFR-perf, AC4 E2E)
**Tests passing in CI:** 6 / 6 confirmed — full suite 434 files, same 37 pre-existing failures as baseline; local E2E spec 1/1 passing, plus regression checks against dsh-s2's and dsh-s3's own test files (both unaffected)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: falls back to archive table | ✅ | ✅ | |
| AC2: hot-table hit never queries archive | ✅ | ✅ | Query-counting fake db |
| AC3: neither table has data → null | ✅ | ✅ | |
| AC4: rendered page identical, archived vs. hot | ✅ | ✅ | Local Playwright E2E |
| AC5: cross-tenant archive read → null | ✅ | ✅ | |
| NFR-perf: archive-tier read under ~500ms | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — archive-tier read within ~500ms budget | ✅ | Measured via `process.hrtime` against the fake db, confirmed under budget. |
| Security — same tenant-scoping guard as hot reads | ✅ | The existing `requireJourneyAccess` guard runs once, before either data-tier check — no new guard code needed, confirmed by AC5's test. |
| Accessibility — none new | ✅ | Rendered page identical to dsh-s3's existing output, confirmed by AC4. |
| Audit — none identified | ✅ | Confirmed. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m3 — Turn storage stays bounded | ✅ (baseline: no growth control today) | Both halves of the metric (archive + rehydrate) are now merged and confirmed working end-to-end at the code level | Still not-yet-measured in production: no `session_turns` row will actually be 60 days old for roughly two months (the table only started accumulating data with dsh-s1's merge today), so a real archive-then-rehydrate cycle has not yet been observed. |

m1/m2 are unaffected by this story per `benefit-metric.md`'s Metric Coverage Matrix.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. **This is the final story in the dsh-e1 epic.** All 6 stories (dsh-s1 through dsh-s6) are now merged and DoD-complete. Epic status updated to `complete` as part of this DoD write.
2. Feature-level guardrails (ADR-025/026/027, NFR-performance/security/availability/compliance/data-residency) are now reattributed from their DoR-time assessment to `/definition-of-done`, since all 6 stories have genuinely shipped — see the state update below.
3. Once ~60 days of real production `session_turns` data exists, confirm the archive job (dsh-s5) and rehydration path (this story) work together end-to-end against real staging/production data, and capture the first real signal for m1, m2, and m3 from actual operator usage rather than test-confirmed behaviour alone.
4. The two deferred UX items from earlier in this session remain open: the delete-feature redirect-to-`/journey` bug (logged in capture-log.md, not fixed) and the retroactive e2e-tenant purge / admin tenant-list view / PostHog tie-in (deferred, not picked back up).
5. Two process-improvement candidates remain logged for a future `/improve` pass: the CI/staging-deploy-collision pattern (now confirmed 5 times across this epic — genuinely worth a structural fix, e.g. a GitHub Actions concurrency group between the deploy and E2E-gate workflows) and the "new endpoint + same-PR real-staging test" bootstrapping shape (dsh-s4).

---

## DoD Observations

1. **Fifth recurrence of the CI/staging-deploy-collision pattern**, observed again on this story's own PR (both Scenario A and B failed simultaneously, resolved cleanly on retry with zero code changes). At this frequency (5 of 6 stories in this epic hit it), this is no longer a minor annoyance — it's a structural gap worth fixing directly rather than continuing to absorb per-PR. Recommending this be prioritised as a follow-up story.
2. **Feature-level guardrails reattributed to `/definition-of-done`** as part of this final story's state write (see below) — this closes out the judgment call deferred across dsh-s1 through dsh-s5's own DoD artefacts.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Transparently rehydrate an archived stage's turns on read (dsh-s6).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

# Definition of Done: Wire customer_journey_stages boot-time table creation

**PR:** [#959](https://github.com/heymishy/skills-repo/pull/959) | **Merged:** 2026-10-08T07:12:56Z
**Story:** artefacts/2026-10-08-journey-stages-boot-wiring-gap/stories/csb-s1-wire-customer-journey-stages-boot-creation.md
**Test plan:** artefacts/2026-10-08-journey-stages-boot-wiring-gap/test-plans/csb-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-08-journey-stages-boot-wiring-gap/dor/csb-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-ep1-s1-journey-create.js` "csb-s1 AC1: customer_journey_stages table creation is wired into server.js, matching the customer_journeys convention" — regex-matches the real `CREATE TABLE IF NOT EXISTS customer_journey_stages` statement in `server.js`'s source | `unit` (source-text assertion) | None |
| AC2 | ✅ | `check-ep1-s1-journey-create.js` (8/8, including the new AC1 test above) and `check-ep1-s2-journey-stage-create.js` (7/7) both re-run unmodified and pass | `unit` | None |

**Live verification beyond the test plan (Chrome + Fly logs, 2026-10-08, post-merge) — the strongest evidence class available for a boot-sequence-only change:** Navigated to `wuce-staging.fly.dev` — landing page and `GET /journeys/:id` both load cleanly (200s, zero console errors). More directly: `fly logs -a wuce-staging --no-tail | grep customer_journey` shows the real boot output `customer_journey_stages table ready` firing immediately after `customer_journeys table ready` at `2026-10-08T07:13:56Z` — this is not an inference from route behaviour, it is the server's own boot-sequence log confirming the `CREATE TABLE IF NOT EXISTS` statement actually ran successfully against the real staging database.

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: `customer_journey_stages`' `CREATE TABLE IF NOT EXISTS` + 2 indexes added to `server.js`'s existing boot block, copied verbatim from `scripts/migrate-schema-journeys.js`; one new boot-wiring test added to the already-established home (`check-ep1-s1-journey-create.js`). `feature_customer_journey_stage_mappings` was not wired, per the story's own explicit out-of-scope declaration.

---

## Test Plan Coverage

**Tests from plan implemented:** 2 / 2 (AC1 new test + AC2 re-run of both existing suites).
**Tests passing in CI:** All pass; confirmed in PR #959's "Lint, typecheck, test, build" check (SUCCESS) and independently re-run against master post-merge (`npm test`: 722 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (boot-wiring statement present) | ✅ | ✅ | |
| AC2 (ep1-s1 suite unmodified, still passes) | ✅ | ✅ | 8/8 |
| AC2 (ep1-s2 suite unmodified, still passes) | ✅ | ✅ | 7/7 |

**Gaps:** None. PR #959's CI was fully green, including both "Scenario A/B E2E (staging)" jobs completing `SUCCESS`.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Reliability (this story's whole purpose) | ✅ | Directly confirmed via the real Fly boot log showing successful table creation against live staging Postgres — the strongest possible evidence short of a from-scratch fresh-database deploy test |
| Security | ✅ N/A | Purely additive idempotent DDL, no new input surface |
| Performance | ✅ N/A | Negligible — one additional idempotent `CREATE TABLE IF NOT EXISTS`/`CREATE INDEX IF NOT EXISTS` pair at boot |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | Short-track correctness/deployability fix, no metric tracked — matches `jcg-s1`/`tpux-s1`/`tpux-s2`'s own precedent |

---

## Outcome

**COMPLETE**

Both ACs satisfied with passing unit-test evidence, and — unusually for a short-track fix — directly confirmed against the real, live staging boot log rather than only inferred from route behaviour. No scope deviations. CI fully green. `npm test` on master: 722 files, 0 failed.

**Follow-up actions:** None blocking. `feature_customer_journey_stage_mappings`'s own boot-wiring remains an open item for whichever story (`ep2-s2`) first consumes that table — its own DoR must address this explicitly, citing this story and `ep1-s2`'s own gap as the precedent to avoid repeating.

---

## DoD Observations

1. **This is the second D37 boot-wiring gap found in this feature in two days** (the first being the `customer_journeys`/platform-table name collision fixed in `ep5-s3`, the second being this story). Both were found by direct code grounding ahead of starting the *next* story, not by any automated check or review gate — `ep5-s3`'s gap was found while grounding `ep1-s1`, and this one while grounding `ep1-s3`. The pattern (a merged story's DoR marks D37 N/A incorrectly, and the gap sits latent until the next story's own grounding work happens to catch it) is now confirmed twice, not a one-off. Combined with `jcg-s1`'s own DoD Observation 1 (a governance test to catch missing `csrfGuard` calls), there is now a broader `/improve` candidate: a single governance test that, for every table a route handler's SQL references (via grep across `routes/*.js` for `FROM <table>`/`INTO <table>`), asserts `server.js`'s own boot sequence contains a matching `CREATE TABLE IF NOT EXISTS <table>` statement. This would have caught both this gap and would generalize beyond just CSRF/D37 to any future "handler assumes a table exists but nothing creates it" defect.
2. **Fly boot logs (`fly logs -a <app> --no-tail | grep <pattern>`) are a stronger verification method for boot-sequence-only changes than route-behaviour inference, and should be the default for this class of fix going forward.** Earlier short-track fixes in this session (e.g. `ep1-s1`'s own boot-wiring) were verified only by confirming the route didn't crash — true but indirect. This DoD's direct log confirmation is a better pattern to repeat.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire customer_journey_stages
boot-time table creation" (csb-s1). Check:
1. Does every AC row have a concrete evidence reference (test name,
   observable behaviour, or CI run)?
2. Is the live Fly-log verification convincing as direct evidence (not
   just inference from route behaviour) that the fix actually works
   against a real database?
3. Does DoD Observation 1's proposed governance test (grep route
   handlers for table references, assert a matching boot-time CREATE
   TABLE exists) sound like a worthwhile follow-up story, given this is
   the second instance of this exact class of gap in two days?
4. Is the outcome verdict (COMPLETE) consistent with the AC and
   deviation rows, given this was a narrowly-scoped, fully-verified fix?
```

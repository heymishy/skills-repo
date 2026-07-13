# Definition of Done: Person and team-membership schema replaces tenant-wide role lookup

**PR:** https://github.com/heymishy/skills-repo/pull/463 | **Merged:** 2026-07-12
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s1.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s1-person-team-schema-test-plan.md
**DoR artefact:** artefacts/2026-07-09-team-identity-roles/dor/tir-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Migration bootstrap creates `people`/`team_memberships`, idempotent rerun | automated test (T1, T2) | None |
| AC2 | ✅ | Legacy `user_roles` solo-tenant row migrates unchanged | automated test (T4) | None |
| AC3 | ✅ | Login resolves role via new schema across all 3 providers, not legacy lookup | automated test (T5) | None |
| AC4 | ✅ | Full regression suite re-run fresh on current master, post-merge: 69 pre-existing failures (down from documented 73 baseline), zero new regressions attributable to this story | automated regression check (`scripts/ci-test-regression-check.js`) | None |
| AC5 | ✅ | Unmigrated solo tenant gets lazy `team_memberships` creation on first login | automated test (T6) | None |
| AC6 (D37 wiring, added at DoR) | ✅ | `server.js` wires `setGetRoleForTenant` to the person/team-scoped implementation, not the legacy tenant-wide query | automated test — confirmed superseded by tir-s7's fix, see DoD Observations | See DoD Observations |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. PR #463 touched exactly: `user-roles.js`, `auth.js`, `auth-email.js`, `server.js`, plus the new test file and implementation plan artefact — all within this story's declared scope. No epic out-of-scope items (multi-team switching UI, historical/audit-event backfill, legacy table removal) were touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7 (re-verified directly against current master, 2026-07-13)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 (migration bootstrap table shape) | ✅ | ✅ | |
| T2 (idempotent rerun) | ✅ | ✅ | |
| T4 (legacy row migrates unchanged) | ✅ | ✅ | |
| T5 (login resolves via new schema) | ✅ | ✅ | |
| T6 (lazy creation on unmigrated login) | ✅ | ✅ | |
| T7 (migration audit log) | ✅ | ✅ | |
| AC6 wiring test | ✅ | ✅ | Confirms the wiring exists, per AC6's own scope — does not itself catch the person-scoping gap tir-s7 later fixed (see Observations) |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Zero privilege change during migration | ✅ | T4 asserts the migrated role value is byte-identical to the legacy value |
| Audit logging (migration logged) | ✅ | T7 asserts exactly one info-level log call with an identifiable migration name |
| Schema migration startup time | ✅ | No specific threshold defined per NFR profile — "monitor at implementation," no regression observed in CI job durations |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Per-person role assignment exists | ✅ (0%) | Not yet — requires tir-s3's real add-teammate flow producing a genuine 2+-person tenant to observe | This story lays the schema foundation; the metric isn't independently observable from tir-s1 alone |
| Metric 5 — Zero regression for existing solo tenants | ✅ (100%) | Yes — measurable now | Regression suite confirms unchanged solo-tenant behaviour post-merge (see AC4 evidence) |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- AC6's wiring test verified the *existence* of person-scoped wiring but did not itself catch that the underlying `resolveRoleForTenant` function had no `person_id` filter (a real bug, found and fixed in tir-s7). No action needed now — already resolved by a merged fix-forward story. Recorded here for the audit trail.

---

## DoD Observations

1. **AC6's own test was not sufficient to catch the login-resolution bug that tir-s7 later fixed.** The test confirmed `server.js` wired `setGetRoleForTenant` to *a* person/team-scoped-sounding function, but didn't independently verify that function actually filtered by `person_id` correctly — it trusted the function's own name and the fact that a real DB query was being made. This is a genuine test-design gap worth feeding back: a wiring test should assert the *query itself* is person-scoped (e.g. by asserting two different people in the same tenant resolve to different roles), not just that *a* function is wired. **Tag: /improve candidate** — consider adding this as a standard pattern to this repo's D37 wiring-test guidance (`.github/architecture-guardrails.md` or the DoR skill's H-ADAPTER check) so future wiring tests are harder to satisfy with a superficially-correct-looking implementation.
2. This story's own scope explicitly deferred the login-resolution-path bug fix to tir-s7 rather than being blocked on discovering it during tir-s1's own implementation — the discovery only happened later, during tir-s4's implementation, when a coding agent read the actual merged code closely enough to notice the missing filter. This is a good example of the value of downstream stories re-reading upstream code as ground truth rather than trusting an upstream story's own tests at face value (a practice explicitly instructed to every coding agent dispatched in this session).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Person and team-membership schema replaces tenant-wide role lookup" (tir-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

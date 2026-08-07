# Definition of Done: A single, tenant-scoped read path for a completed stage's turns

**PR:** https://github.com/heymishy/skills-repo/pull/626 | **Merged:** 2026-07-28
**Story:** artefacts/2026-07-28-durable-session-history/stories/dsh-s2-shared-durable-read.md
**Test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s2-shared-durable-read-test-plan.md
**DoR artefact:** artefacts/2026-07-28-durable-session-history/dor/dsh-s2-shared-durable-read-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-07-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "returns the turns array from Postgres when memory has no matching session" | automated test | None |
| AC2 | ✅ | "returns in-memory turns, never queries Postgres" — also asserts the Postgres query was never called | automated test | None |
| AC3 | ✅ | "returns null without throwing when no row exists" | automated test | None |
| AC4 | ✅ | Two sub-cases: different tenantId, and not-owner-with-no-accessToken — both return null | automated test | None |
| AC5 | ✅ | "returns null for a journeyId that does not resolve to any journey" | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None. 2 commits on the branch: baseline confirmation (RISK-ACCEPT log entry) and the implementation itself. Confirmed against Out of Scope: no archive-tier read, no HTML rendering, no write access were touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (5 unit + 2 NFR)
**Tests passing in CI:** 9 / 9 (AC4 and the NFR-security check were each split into 2 explicit sub-case assertions for thoroughness)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: Postgres turns when no longer in memory | ✅ | ✅ | |
| AC2: prefers in-memory (freshest) over Postgres | ✅ | ✅ | Asserts Postgres was never queried |
| AC3: returns null, no throw, when no row exists | ✅ | ✅ | |
| AC4: cross-tenant returns null | ✅ | ✅ | 2 sub-cases: different tenantId; not-owner/no-accessToken |
| AC5: non-existent journeyId returns null, no throw | ✅ | ✅ | |
| NFR-perf: Postgres-tier read under ~200ms (fake-db proxy) | ✅ | ✅ | |
| NFR-security: guard covers both sub-cases explicitly | ✅ | ✅ | Different-tenant and same-tenant-non-owner |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — Postgres-tier read under ~200ms | ✅ | NFR-perf test measured via `process.hrtime` against the fake db; passed under budget. Real Postgres timing is covered transitively by dsh-s1's own AC5 integration test against the same pool. |
| Security — tenant-isolation guard cannot be bypassed | ✅ | AC4 (2 sub-cases) plus a dedicated NFR-security test explicitly confirming both the different-tenant and same-tenant-non-owner denial paths, not just one. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1 — Resume conversation link success rate | ✅ (baseline ~0%) | Not yet — requires dsh-s4 (resume UI) to also ship | dsh-s1 (write) + dsh-s2 (shared read path) both merged; still not user-observable. `contributingStories` updated to include this story. |
| m2 — Breadcrumb view-completed-stage shows real conversation | ✅ (baseline 0%) | Not yet — requires dsh-s3 (breadcrumb UI) to also ship | Same as above. |

Signal recorded as `not-yet-measured` for both. This story is a Technical Enabler (see its own "Technical Enabler" section) — it moves no metric directly, only underwrites dsh-s3/dsh-s4's ability to move m1/m2.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None required to close out dsh-s2 itself. dsh-s3 and dsh-s4 (both of which call `getTurnsForStage`) remain DoR-signed-off but unimplemented.

---

## DoD Observations

1. **Feature-level guardrails again left at their DoR-time assessment** (same judgment call as dsh-s1's DoD, see that artefact's own Observation #1) — 2 of 6 stories now merged, still not honest to reattribute epic-wide guardrails to `/definition-of-done` until dsh-s6 ships.
2. **No new observations specific to dsh-s2's own implementation.** The one process-level finding from this story's delivery (a CI check false-failure caused by a staging redeploy racing the PR's E2E job) was a session-wide infra pattern, not specific to this story's code — logged separately in `workspace/capture-log.md` (2026-07-28, "PR #626's Scenario A E2E ... staging-deploy.yml auto-redeploys on every push to master ...").

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for A single, tenant-scoped read path for a completed stage's turns (dsh-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

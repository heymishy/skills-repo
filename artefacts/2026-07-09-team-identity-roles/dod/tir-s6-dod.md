# Definition of Done: Team-membership lookups stay indexed at ~100 members per tenant

**PR:** https://github.com/heymishy/skills-repo/pull/468 | **Merged:** 2026-07-13
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s6.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s6-schema-scale-validation-test-plan.md
**DoR artefact:** artefacts/2026-07-09-team-identity-roles/dor/tir-s6-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | Query plan uses an index, not a full table scan, at 100 rows | Not executed in this environment (`DATABASE_URL`-gated, skips visibly per operator-confirmed RISK-ACCEPT) | See NFR/Coverage gap note below |
| AC2 | ⚠️ | Lookup completes under 50ms at 100 rows | Not executed in this environment (`DATABASE_URL`-gated) | See NFR/Coverage gap note below |
| AC3 | ✅ | 1-member tenant lookup unaffected (regression) | automated test, verified for real | None |
| AC4 | ⚠️ | 100-row batch insert doesn't degrade vs. sequential | Not executed in this environment (`DATABASE_URL`-gated) | See NFR/Coverage gap note below |

---

## Scope Deviations

None. PR #468 touched only the new test file — no schema change was needed, since tir-s1's existing `PRIMARY KEY (person_id, tenant_id)` on `team_memberships` already provides the composite index AC1 requires. This is a "validation-only" story exactly as scoped.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 1 / 1 executable + 3 correctly-skipped (re-verified directly against current master, 2026-07-13)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC3 (solo-tenant regression) | ✅ | ✅ | Runs unconditionally via the mocked test convention |
| AC1 (index scan) | ✅ | N/A (skipped) | Skips with an explicit, visible message when `DATABASE_URL` is absent — never silently passes |
| AC2 (under 50ms) | ✅ | N/A (skipped) | Same gating |
| AC4 (batch-insert timing) | ✅ | N/A (skipped) | Same gating |

**Gaps (tests not implemented):** None — all 4 tests exist. The 3 real-Postgres tests are a **known, RISK-ACCEPTed gap in execution environment**, not a missing implementation.

**Coverage gap audit (per DoD Step 4):**
- Were AC1/AC2/AC4 RISK-ACCEPTed in `/decisions` before coding started? **Yes** — logged 2026-07-13 (`decisions.md`, "RISK-ACCEPT | /test-plan, /definition-of-ready"), confirmed by the operator before the coding agent began work.
- Was the manual verification scenario actually executed during pre-code sign-off or post-merge smoke test? **No** — no real `DATABASE_URL`-backed environment has been exercised against this story yet, in this session or otherwise.
- **This is recorded as an open gap, not silently passed over.** See Follow-up actions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — indexed lookups at 100 members/tenant, under 50ms | ⚠️ | **Not yet evidenced with real data.** The RISK-ACCEPT covers *why* this can't be evidenced in this environment, but does not itself constitute evidence that the target is met. This NFR's `guardrails[]` entry should remain `not-assessed`, not `met`, until a real run happens. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 4 — Schema holds up at ~100 members/tenant | ✅ (unverified beyond 1 member) | **Not yet** — requires a real `DATABASE_URL`-backed run | This is this story's sole covering metric, and it remains genuinely `not-yet-measured` in practice, not just as a formality |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- **Action required, no owner yet assigned:** run this story's test file against a real Postgres instance (e.g. a Neon staging branch, matching the `bri-s2.2` precedent already used elsewhere in this repo) at least once, to actually produce AC1/AC2/AC4's evidence. Until that happens, Metric 4 remains `not-yet-measured` and the performance NFR remains `not-assessed`, not falsely `met`. This is the single most important open item across the whole epic's DoD — everything else is closed, this one requires a real environment action.

---

## DoD Observations

1. **This story is a textbook example of the DATABASE_URL-gating RISK-ACCEPT working as designed, but it does mean the story's own "COMPLETE" claim must be qualified.** The alternative that was explicitly rejected during `/test-plan` (mocking a canned "used index" result) would have let this story report a clean `COMPLETE` outcome with zero real evidence behind it — this DoD deliberately does not do that, reporting `COMPLETE WITH DEVIATIONS` and naming the exact follow-up action needed. **Tag: /improve candidate** — this pattern (RISK-ACCEPT for an environment gap, explicit follow-up action recorded at DoD, not silently closed) is worth documenting as the standard playbook for any future `DATABASE_URL`-gated story in this repo.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Team-membership lookups stay indexed at ~100 members per tenant" (tir-s6).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

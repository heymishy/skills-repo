# Definition of Done: Extend the quiet-retry budget to network-level turn failures, not just the in-flight guard

**PR:** [#953](https://github.com/heymishy/skills-repo/pull/953) | **Merged:** 2026-10-07T22:58:19Z
**Story:** artefacts/2026-10-08-turn-progress-ux/stories/tpux-s2-extend-quiet-retry-to-network-level-failures.md
**Test plan:** artefacts/2026-10-08-turn-progress-ux/test-plans/tpux-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-08-turn-progress-ux/dor/tpux-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-tpux-s1-turn-progress-ux.js` tpux-s2 AC1: first-retry branch still schedules at 2000ms | `unit` (structural, real rendered script) | None |
| AC2 | ✅ | tpux-s2 AC2: second branch schedules at 5000ms, gated on the shared 12-attempt cap | `unit` (structural) | None |
| AC3 | ✅ | tpux-s2 AC3: no `window.location.reload()` in this block; dead-end message and submit re-enable still reachable | `unit` (structural) | None |
| AC4 | ✅ | tpux-s2 AC4: `expired` check precedes both retry branches, unchanged | `unit` (structural) | None |
| AC5 | ✅ | `check-srar-s1-idempotent-turn-reconnect.js` 34/34 passing; full `npm test` 720 files, 1 pre-existing/unrelated failure (same baseline entry as every prior story this session) | `unit` + `integration-real-code` | None |

---

## Scope Deviations

None. The merged PR's diff matches the story's stated scope exactly: the `.catch()` block inside `sendTurn()`, plus the one named test file.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (AC1-AC4; AC5 is a regression check)
**Tests passing in CI:** All — confirmed via PR #953's 8/8 green checks before merge, re-confirmed on master post-merge.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| tpux-s2 AC1 (first retry unchanged at 2000ms) | ✅ | ✅ | |
| tpux-s2 AC2 (subsequent retries at 5000ms, under cap) | ✅ | ✅ | |
| tpux-s2 AC3 (no reload on exhaustion, unchanged dead-end) | ✅ | ✅ | |
| tpux-s2 AC4 (session-expired unaffected) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Negligible — bounded extra retries only when a connection genuinely cannot be re-established quickly |
| Security | ✅ N/A | No new input surface |
| Reliability | ✅ | AC3 directly verifies the retry loop remains bounded and does not auto-reload into a potentially-dead connection |
| Accessibility | ✅ N/A | No markup change |

---

## Metric Signal

No metrics tracked — short-track UX fix, continuing `tpux-s1`'s own un-metered scope.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | Qualitative validation is the next real SSE-disconnect-at-the-network-level incident, if one recurs — the operator should see quiet retries rather than an immediate dead end. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- None beyond what's already tracked under `tpux-s1`'s own DoD (the underlying disconnect frequency itself remains `sch-s1`'s scope, not this story's).

---

## DoD Observations

1. **Found live, same day as the sibling fix it extends.** This story exists because a real production incident (2026-10-07) surfaced a second, sibling failure mode within hours of `tpux-s1` shipping its own fix for the first one — both traced to the same underlying SSE-disconnect class of problem, just different client-side code paths. Worth noting as a pattern: when a UX dead-end bug is fixed in one branch of a function, check sibling branches of the *same* function for the identical shape of bug before considering the class of issue closed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Extend the quiet-retry budget
to network-level turn failures, not just the in-flight guard" (tpux-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```

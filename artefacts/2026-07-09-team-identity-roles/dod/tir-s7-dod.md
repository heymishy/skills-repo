# Definition of Done: Login role resolution is scoped by person, not just tenant

**PR:** https://github.com/heymishy/skills-repo/pull/467 | **Merged:** 2026-07-13
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s7.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s7-person-scoped-login-resolution-test-plan.md
**DoR artefact:** artefacts/2026-07-09-team-identity-roles/dor/tir-s7-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Person Y (engineer) in a shared tenant resolves their own role, not X's | automated test | None |
| AC2 | ✅ | Person X (admin) in the same tenant resolves their own role | automated test | None |
| AC3 | ✅ | Solo tenant login unaffected (regression) | automated test | None |
| AC4 | ✅ | Brand-new unknown identity resolves to default `user`, no crash | automated test | None |
| AC5 (D37 wiring) | ✅ | `server.js` wiring resolves personId via `resolvePersonForIdentity` before the role lookup | automated test | None |

---

## Scope Deviations

None. PR #467 touched `user-roles.js` and `server.js` — the exact two files named in the story's estimated touch points. The legacy `getUserRole`/`setGetUserRole` adapter (arl-s1) was left untouched, as required.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5 (re-verified directly against current master, 2026-07-13)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (person Y resolves own role) | ✅ | ✅ | |
| AC2 (person X resolves own role) | ✅ | ✅ | |
| AC3 (solo-tenant regression) | ✅ | ✅ | |
| AC4 (unknown identity, graceful fallback) | ✅ | ✅ | |
| AC5 (server.js wiring) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — correctness of per-person resolution | ✅ | AC1/AC2 together prove both directions: each person resolves to their own role, never the other's, regardless of database row order |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Per-person role assignment exists | ✅ (0%) | Yes — measurable now, and genuinely fixed | Prior to this fix, the metric's target was undermined in practice at the login-resolution layer even though the schema/write paths were correct. This story is what makes the metric true end-to-end. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **This is the first of two fix-forward stories in this epic (tir-s7, tir-s8), both discovered by direct code inspection during a sibling story's implementation rather than assumed correct.** The pattern that produced both: a coding agent working on a *downstream* story (tir-s4 for tir-s7; tir-s5's own self-flag for tir-s8) read the actual merged code of an *upstream* story closely enough to notice a real gap, rather than trusting the upstream story's own passing tests as proof of correctness. **Tag: /improve candidate** — this "read upstream code as ground truth, don't trust its own tests" instruction (already given explicitly to every coding agent dispatched in this session) demonstrably caught two real bugs and is worth promoting from an ad hoc session instruction into a standing convention in this repo's dispatch/DoR guidance.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Login role resolution is scoped by person, not just tenant" (tir-s7).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

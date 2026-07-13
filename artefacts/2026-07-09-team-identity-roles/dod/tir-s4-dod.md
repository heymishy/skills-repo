# Definition of Done: The admin/credits panel is gated by per-person role, not tenant membership

**PR:** https://github.com/heymishy/skills-repo/pull/465 | **Merged:** 2026-07-13
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s4.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s4-role-gated-credits-panel-test-plan.md
**DoR artefact:** artefacts/2026-07-09-team-identity-roles/dor/tir-s4-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Non-admin team member sharing an admin's tenant denied 403 | automated test | None |
| AC2 | ✅ | Admin of same tenant retains access | automated test | None |
| AC3 | ✅ | Solo tenant admin access unchanged (zero regression) | automated test | None |
| AC4 | ✅ | Ambiguous/missing role fails closed (denied, not granted) | automated test | None |

---

## Scope Deviations

None. PR #465 touched only `middleware/require-admin.js` and the new test file — the smallest possible surface area for this story, exactly as scoped. No change to what an admin can do inside the panel, no gating added to any other feature.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 5 / 5 (re-verified directly against current master, 2026-07-13 — one additional audit-logging test beyond the original plan)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (non-admin denied) | ✅ | ✅ | |
| AC2 (admin granted) | ✅ | ✅ | |
| AC3 (solo-tenant regression) | ✅ | ✅ | |
| AC4 (fail-closed) | ✅ | ✅ | |
| Audit NFR (denial logged) | ✅ | ✅ | Added by the implementing agent — a genuine gap in the original story's NFR section (no explicit audit-logging test was named), correctly filled in by the coding agent |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Fail-closed on role ambiguity (the epic's highest-security-criticality property) | ✅ | AC4's test explicitly confirms missing/null/stale role state is denied, not granted — the coding agent noted `requireAdmin`'s existing strict-equality check was already fail-closed by construction |
| Audit logging (denial logged) | ✅ | New `setLogger`/`_logger` pair added, logging `admin_access_denied` with personId/tenantId/timestamp |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 3 — Feature gated by per-person role | ✅ (0%) | Yes — measurable now | AC1's test directly proves the metric's target: a non-admin denied despite sharing the admin's tenant |
| Metric 5 — Zero regression for existing solo tenants | ✅ (100%) | Yes — measurable now | AC3's test confirms unchanged solo-tenant behaviour |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- The implementing agent flagged (in the PR description, not silently) a residual gap: at the time of tir-s4's implementation, login-time role resolution (`resolveRoleForTenant`) queried `team_memberships` with no `person_id` filter — meaning `req.session.role` itself could be wrong for a shared tenant, even though `requireAdmin`'s own comparison logic was correctly fail-closed. This is precisely the bug tir-s7 fixed. No action needed now — already resolved by a merged fix-forward story. **This flag is the reason tir-s7 was filed** — recorded here as the originating observation.

---

## DoD Observations

1. **tir-s4's coding agent is the one that originally surfaced the login-resolution bug** that became tir-s7 — it correctly distinguished between "the gating logic itself is fail-closed" (true, no fix needed) and "the role value being gated on might be wrong for the wrong reason" (a separate, real problem it flagged rather than silently working around or ignoring). This is a good example of a coding agent staying within its own story's authorized touch points (only `require-admin.js`) while still surfacing an out-of-scope finding for human triage, rather than either scope-creeping to fix it itself or omitting the finding.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "The admin/credits panel is gated by per-person role, not tenant membership" (tir-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

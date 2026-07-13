# Definition of Done: An admin adds a teammate by identity and assigns a role

**PR:** https://github.com/heymishy/skills-repo/pull/466 | **Merged:** 2026-07-13
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s3.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s3-admin-adds-teammate-test-plan.md
**DoR artefact:** artefacts/2026-07-09-team-identity-roles/dor/tir-s3-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Admin adds an existing person by identity with a role, `team_memberships` row created | automated test | None |
| AC2 | ✅ | Assigned role resolves in the teammate's next login | automated test | None |
| AC3 | ✅ | Non-admin caller denied 403 on add-teammate endpoint | automated test | None |
| AC4 | ✅ | Re-adding an existing member updates role in place, no duplicate row | automated test | None |
| AC5 | ✅ | Adding a never-logged-in identity is rejected with a clear error | automated test | None |

---

## Scope Deviations

None. PR #466 touched `team-management.js` (new), `routes/team-management.js` (new), `server.js` wiring, and the new test file — all within scope. No invite/email flow was built, no removal action, no pending-invite state — all correctly deferred per Out of Scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (test plan named 5 substantive + 2 NFR entries)
**Tests passing in CI:** 8 / 8 (re-verified directly against current master, 2026-07-13 — one additional server-wiring test beyond the original plan)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (add existing person) | ✅ | ✅ | |
| AC2 (role resolves on login) | ✅ | ✅ | |
| AC3 (non-admin denied) | ✅ | ✅ | |
| AC4 (idempotent re-add) | ✅ | ✅ | |
| AC5 (never-logged-in rejected) | ✅ | ✅ | |
| ADR-025 (tenant-scoped authorization) | ✅ | ✅ | |
| Audit NFR | ✅ | ✅ | |
| Server wiring | ✅ | ✅ | Not in original test plan; added by the implementing agent as a defensive extra |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Tenant-scoped authorization (admin of tenant A cannot act on tenant B) | ✅ | Dedicated ADR-025 test confirms cross-tenant write rejection |
| Audit logging | ✅ | Test confirms admin ID, target person ID, role, tenant, timestamp all logged |
| Accessibility | ⚠️ | Manual verification only, per this repo's existing convention — not a gap introduced by this story |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Per-person role assignment exists | ✅ (0%) | Yes — measurable now | This is the first story where the metric's target (2+ people, distinct roles, in one real tenant) becomes concretely observable via a real admin action, not just migrated solo-tenant data |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- This story's own module docstring (`team-management.js`) explicitly and correctly notes that it deliberately does NOT rewire the live login/`requireAdmin` role-resolution path — that was tir-s4's and tir-s7's job. No action needed; already resolved by merged fix-forward stories. Recorded here for the audit trail, matching tir-s1's DoD Observation.

---

## DoD Observations

1. **This story's implementing agent independently arrived at the same conclusion tir-s1's coding agent's own docstring later echoed** — that per-person role granularity existed in the schema from tir-s1 onward, but the *live login path* remained tenant-wide until tir-s7's fix. This is a positive signal: multiple independent agents reading the same code reached the same correct understanding of the gap, rather than one agent's assumption propagating uncorrected through the epic.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "An admin adds a teammate by identity and assigns a role" (tir-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

# Definition of Done: Bulk-add fetches real GitHub org members, not the admin's own org memberships

**PR:** https://github.com/heymishy/skills-repo/pull/470 | **Merged:** 2026-07-13
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s8.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s8-real-org-members-fetch-test-plan.md
**DoR artefact:** artefacts/2026-07-09-team-identity-roles/dor/tir-s8-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | New fetch returns real org member logins for a named org, not orgs the token belongs to | automated test | None |
| AC2 | ✅ | Unwired `setFetchOrgMembers` throws (D37) | automated test | None |
| AC3 | ✅ | End-to-end bulk-add with realistic member-object shape adds real teammates | automated test | None |
| AC4 | ✅ | Pagination followed across multiple pages | automated test | None |
| AC5 | ✅ | tir-s5's existing tests corrected to mock the new function with realistic shapes | automated test (regression) | None |

---

## Scope Deviations

None. PR #470 touched `routes/auth.js` (new adapter), `server.js` (wiring), `github-org-bulk-add.js`/`routes/github-org-bulk-add.js` (call-site rewire), and both the corrected `tir-s5` test file and the new `tir-s8` test file — exactly the estimated touch points. `setFetchOrgs`/`resolveTenant` was left untouched, as required. The bulk-add route, gating, skip-existing logic, and audit logging from tir-s5 were left untouched — only the data source changed.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6 new tests + 7 / 7 corrected tir-s5 tests (re-verified directly against current master, 2026-07-13)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (real member fetch) | ✅ | ✅ | |
| AC2 (D37 stub-throw) | ✅ | ✅ | |
| AC3 (end-to-end bulk-add works) | ✅ | ✅ | |
| AC4 (pagination) | ✅ | ✅ | |
| AC5 (tir-s5 tests corrected) | ✅ | ✅ | tir-s5's own file re-verified independently: 7/7 passing after the mock correction |
| ADR-025 (org name never request-supplied) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — org name never request-supplied | ✅ | Dedicated test confirms `getOrgMembers` is always called with `req.session.tenantId` |
| Audit | ✅ | Inherited unchanged from tir-s5 — confirmed still correct via the corrected AC5 regression test |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Per-person role assignment exists | ✅ (0%) | Yes — genuinely, now | This closes the gap tir-s5 opened: bulk-add now actually adds people in production, not just in its own (previously mock-masked) tests |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **This is the second of two fix-forward stories in this epic** (see tir-s7's DoD Observation for the shared pattern). Combined, tir-s7 and tir-s8 demonstrate that a coding agent's job in this pipeline is not just "make the story's own tests pass" but "verify the story's premises against the actual, currently-merged state of the codebase" — both bugs existed in code that had 100% passing tests at the time it was written, and both were only caught by a *different* agent reading that code freshly rather than trusting its green test suite.
2. Full-suite regression check (`node scripts/run-all-tests.js`, re-run fresh against current master with dependencies installed, 2026-07-13): confirmed zero new regressions across the whole `team-identity-roles` epic's final state — see the feature-level DoD summary for the consolidated result.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Bulk-add fetches real GitHub org members, not the admin's own org memberships" (tir-s8).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

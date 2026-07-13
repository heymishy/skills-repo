# Definition of Done: An admin bulk-adds teammates from their connected GitHub org

**PR:** https://github.com/heymishy/skills-repo/pull/469 | **Merged:** 2026-07-13
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s5.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s5-github-org-bulk-add-test-plan.md
**DoR artefact:** artefacts/2026-07-09-team-identity-roles/dor/tir-s5-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | Bulk-add creates memberships for org members not already present, role `engineer` | automated test — **but see Deviation** | As shipped in PR #469, the underlying GitHub fetch call reused `setFetchOrgs` (lists orgs a token belongs to, not org members) — the feature was a complete functional no-op in production (`addedCount` always 0), even though AC1's own unit test passed (it mocked the fetch with person-shaped data, masking the bug). **Fixed by tir-s8 (PR #470, merged same session).** |
| AC2 | ✅ | Bulk-added member logs in, resolves same as manual add | automated test | None — this AC concerns post-add behaviour, unaffected by the fetch-mechanism bug |
| AC3 | ✅ | Re-run skips existing members, doesn't overwrite manually-set roles | automated test | None |
| AC4 | ✅ | Missing org-scope token fails with a clear, actionable error | automated test | None |

---

## Scope Deviations

None from the story's *stated* scope. However, see AC1's deviation above — a real functional gap existed between what the story's own tests proved (mocked correctness) and what the shipped code actually did in production (always add zero people). This was caught immediately after merge (same session) and fixed as tir-s8, not left as a silent gap.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (test plan named 4 substantive + 2 NFR entries)
**Tests passing in CI:** 7 / 7 (re-verified directly against current master, post-tir-s8-fix, 2026-07-13)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (bulk-add creates memberships) | ✅ | ✅ | Test itself always passed — it validated the write-path logic correctly, but its own mock data masked the fetch-mechanism bug (see AC1 above) |
| AC2 (post-add login resolves) | ✅ | ✅ | |
| AC3 (idempotent re-run) | ✅ | ✅ | |
| AC4 (missing-scope error) | ✅ | ✅ | |
| NFR security (org cannot be arbitrary) | ✅ | ✅ | |
| NFR audit | ✅ | ✅ | |
| Server wiring | ✅ | ✅ | Added by the implementing agent beyond the original plan |

**Gaps (tests not implemented):** None at the unit/integration level — but see the DoD Observations below regarding the class of gap this represents (mocked correctness vs. production correctness).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Bulk-add stays within admin's own verified GitHub org | ✅ | Test confirms the call is scoped by the admin's own tenant/org, never a request-supplied org name — this property held even before tir-s8's fix, since the bug was in *which* GitHub endpoint was called, not in whether the org parameter could be spoofed |
| Audit logging | ✅ | Test confirms admin ID, org name, member count, timestamp logged |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Per-person role assignment exists (breadth) | ✅ (0%) | Yes — but only after tir-s8's fix merged | As shipped in PR #469 alone, this story's contribution to the metric was nominal only (the feature added zero people in practice). The metric's breadth claim is only genuinely true as of tir-s8's merge. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- None remaining — tir-s8 (PR #470) already merged and closes the AC1 deviation. This DoD is recorded as "COMPLETE WITH DEVIATIONS" rather than "COMPLETE" to preserve the accurate historical record that PR #469 alone shipped a non-functional feature for a window of time within this session, not to flag an open action.

---

## DoD Observations

1. **This is the clearest example in this epic of "tests passing" not meaning "feature works."** AC1's test mocked `fetchOrgs` with person-shaped objects (`{login: 'alice'}` treated as a member) — a reasonable-looking mock that happened to not match what the real GitHub API actually returns for the endpoint being called (`GET /user/orgs` returns *organization* objects, not *member* objects). The test suite was 100% green on a completely non-functional feature. **Tag: /improve candidate** — this is worth feeding back as a general lesson: when a new adapter/fetch reuses an *existing* adapter for a *new* purpose, the test's mock shape should be validated against that adapter's actual real-world response shape (e.g. by reading the production wiring code, not just the mock), not assumed compatible because the function signature happens to match.
2. **The bug was caught quickly** — within the same session, immediately after tir-s5 merged, because the coding agent implementing tir-s5 itself flagged the risk in its own PR description ("worth a second look before real-world GitHub org scale") without being asked. Independently, direct inspection of `routes/auth.js`'s real GitHub API call (`GET /user/orgs`) confirmed the risk was not just a scale concern but a complete correctness break at any scale. This is a good example of a coding agent's self-flagged uncertainty being taken seriously and independently verified, rather than dismissed as agent hedging.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "An admin bulk-adds teammates from their connected GitHub org" (tir-s5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

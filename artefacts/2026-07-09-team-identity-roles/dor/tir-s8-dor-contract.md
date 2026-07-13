# DoR Contract: Bulk-add fetches real GitHub org members, not the admin's own org memberships

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s8.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s8-real-org-members-fetch-test-plan.md

---

## Contract Proposal

**What will be built:**
1. A new D37 adapter in `routes/auth.js` (or a new module, coding agent's judgment — mirroring `setFetchOrgs`'s location is the simplest option): `setFetchOrgMembers(fn)` / `getOrgMembers(orgName, accessToken, page)`, stub throws when unwired.
2. Real production wiring in `server.js`: `GET /orgs/{org}/members?per_page=100&page=N`, reusing the exact same `link`-header `rel="next"` pagination-parsing pattern already used for `setFetchOrgs`.
3. `github-org-bulk-add.js`'s `_fetchAllOrgMembers` rewired to call the new `getOrgMembers(adminTenantId, accessToken, page)` instead of the old `fetchOrgs(accessToken, page)`.
4. Correction of `tests/check-tir-s5-github-org-bulk-add.js`'s existing mocks from person-shaped `fetchOrgs` fixtures to realistic `getOrgMembers` member-object fixtures.

**What will NOT be built:**
- No change to `setFetchOrgs`/`resolveTenant` — correct and unrelated.
- No change to the bulk-add route, gating, skip-existing logic, or audit logging from tir-s5 — all correct, only the data source changes.
- No live GitHub API integration test — mocked adapter only.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: mocked `getOrgMembers` returns real member logins for a named org | integration |
| AC2 | Unit test: unwired adapter throws | unit |
| AC3 | Integration test: end-to-end bulk-add with realistic member shape, assert `addedCount` > 0 | integration |
| AC4 | Integration test: multi-page pagination followed to completion | integration |
| AC5 | Integration test (regression): tir-s5's existing test file's mocks corrected, all its tests still pass | integration |

**Assumptions:**
- The org name to pass to `getOrgMembers` is `adminTenantId` (== `req.session.tenantId`), which in this codebase's existing model already equals the GitHub org login (confirmed via `routes/auth.js`'s `resolveTenant` matching against `TENANT_ORG_ALLOWLIST`) — no new org-name resolution mechanism is needed.
- `read:org` scope (already required and named in tir-s5's `OrgAccessError` message) is sufficient for `GET /orgs/{org}/members` — this is GitHub's actual documented scope requirement for that endpoint, not a new assumption specific to this story.

**Estimated touch points:**
Files: `src/web-ui/routes/auth.js` (or new module), `src/web-ui/server.js` (wiring), `src/web-ui/modules/github-org-bulk-add.js` (call-site rewire), `tests/check-tir-s5-github-org-bulk-add.js` (mock correction), new `tests/check-tir-s8-real-org-members-fetch.js`
Services: GitHub REST API (`GET /orgs/{org}/members`, new endpoint for this codebase)
APIs: None new beyond the GitHub endpoint itself

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC Coverage table:

- AC1 ↔ new adapter querying by org name, verified directly — ✅ aligned.
- AC2 ↔ D37 stub-throw, verified directly — ✅ aligned.
- AC3 ↔ end-to-end bulk-add fix, verified directly — ✅ aligned.
- AC4 ↔ pagination, verified directly — ✅ aligned.
- AC5 ↔ tir-s5 test correction, verified directly — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Team admin / tech lead" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 findings of any severity |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["prStatus"]` — hard dependency on tir-s5 (PR #469, not yet merged as of this story's filing); `prStatus` confirmed present in `pipeline-state.schema.json`. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Correctly identifies the genuine new D37 adapter need; ADR-025 carried forward |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Feature-level NFR profile already covers this epic |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval | ✅ | Discovery `## Approved By` populated |
| H-ADAPTER | D37 adapter wiring check | ✅ | AC2/AC3 explicitly scope both the stub-throw contract and the real production wiring, per the mandatory Injectable Adapter Rule |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Run 1: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Fix-forward story dispatched under direct operator oversight given the severity (feature is a functional no-op without this fix); same rationale as tir-s7. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Medium (per epic tir-e1)
**Handling:** Operator explicitly directed this fix to be filed and dispatched immediately after discovering the bug — this DoR artefact is reviewed in the same session as that decision.

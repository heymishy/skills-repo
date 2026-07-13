## Story: Bulk-add fetches real GitHub org members, not the admin's own org memberships

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As a **Team admin / tech lead**,
I want **bulk-add to actually fetch the real members of my GitHub org**,
So that **the bulk-add feature tir-s5 built adds real teammates instead of silently adding nobody, every time**.

## Benefit Linkage

**Metric moved:** Per-person role assignment exists (tir-s5's own breadth claim only holds if bulk-add actually works).
**How:** tir-s5's `bulkAddFromGithubOrg` reuses the existing `setFetchOrgs` adapter (`routes/auth.js`), which calls GitHub's `GET /user/orgs` — this lists organizations the admin's own token belongs to, not the members of a specific org. Each returned entry's `.login` is an org's name (e.g. `acme-corp`), not a person's GitHub username. `bulkAddFromGithubOrg` treats that org-name string as a person's identity key, which never resolves via `resolvePersonForIdentity`, so every "member" is skipped as an `UnknownIdentityError` and `addedCount` is always 0. This story fixes the actual fetch so bulk-add moves Metric 1 in practice, not just in its own unit tests (which mock the adapter to return person-shaped objects rather than real GitHub org objects).

## Architecture Constraints

- **D37 mandatory:** this story introduces a genuinely new capability (fetch members of a specific org, given an org name) that `setFetchOrgs` cannot provide — it has no org-name parameter. A new injectable adapter is required: `setFetchOrgMembers(fn)` / `getOrgMembers(orgName, accessToken, page)`, following the exact same stub-throws-when-unwired pattern as `setFetchOrgs` in `routes/auth.js`.
- **ADR-025:** the org name passed to the new fetch must always be the admin's own tenant (`req.session.tenantId`, which in this codebase's model already equals the GitHub org login per `routes/auth.js`'s `resolveTenant`) — never a request-supplied org name. This preserves the exact same "cannot be pointed at an arbitrary org" security property tir-s5 already built into the route layer.
- Production wiring: `GET /orgs/{org}/members?per_page=100&page=N` (GitHub REST API), mirroring the exact pagination-link-header parsing pattern already used for `setFetchOrgs`'s wiring in `server.js` (the `link` header `rel="next"` regex) — reuse that pattern, don't invent a new one.
- Requires `read:org` scope on the admin's GitHub token (same scope tir-s5's `OrgAccessError` already names) — confirms tir-s5's existing AC4 error message is already correctly worded and needs no change, only the underlying fetch mechanism.

## Dependencies

- **Upstream:** tir-s5 (PR #469, not yet merged as of this story's filing — this story fixes `bulkAddFromGithubOrg`'s fetch call, a hard dependency on that function existing).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a real GitHub org with 3 members, When `bulkAddFromGithubOrg` runs for an admin whose tenant/org is that org, Then the new org-members fetch returns those 3 members' GitHub logins — not the list of orgs the admin's token belongs to.

**AC2:** Given the new `setFetchOrgMembers` adapter is unwired, When any code calls `getOrgMembers`, Then it throws a clear "Adapter not wired" error — matching the D37 stub-throw contract already used by `setFetchOrgs`.

**AC3:** Given `server.js` wires the real production implementation of `setFetchOrgMembers` (calling `GET /orgs/{org}/members`), When bulk-add is exercised end-to-end with a mocked-but-realistic GitHub API response shape (an array of `{login, id, ...}` member objects, not org objects), Then real member logins are correctly passed to `addOrUpdateTeammate` and `addedCount` reflects the number of genuinely new teammates added.

**AC4:** Given the org has more members than fit in one API page, When the new fetch runs, Then it follows pagination (same `link` header `rel="next"` parsing pattern already used for `setFetchOrgs`) until all pages are consumed.

**AC5:** Given tir-s5's existing tests for `bulkAddFromGithubOrg` currently mock `fetchOrgs` with person-shaped objects (which was masking this bug), When this story ships, Then those tests are updated to mock the new `getOrgMembers` function instead, with realistic GitHub member-object shapes — the previous mock shape is corrected, not left in place alongside the new one.

## Out of Scope

- Any change to `setFetchOrgs`/`resolveTenant` (`routes/auth.js`) — that adapter's actual job (listing orgs a token belongs to, for tenant resolution) is correct and unaffected by this story.
- Any change to the bulk-add route, gating, skip-existing logic, or audit logging built in tir-s5 — those are all correct; only the data source they consume from is wrong.
- Real end-to-end testing against a live, non-test GitHub organization — covered by the existing test-mode conventions (mocked adapter), matching every other GitHub-integration story in this codebase.

## NFRs

- **Performance:** No new NFR — inherits tir-s5's existing performance expectations for bulk operations.
- **Security:** The org-name parameter must never be request-supplied (ADR-025) — this is the one property that must not regress from tir-s5's existing implementation. Dedicated test required.
- **Accessibility:** Not applicable — backend fetch-mechanism fix only.
- **Audit:** No new audit requirement — tir-s5's existing `bulk_add_completed` log entry is unaffected in shape, only in the correctness of what it counts.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

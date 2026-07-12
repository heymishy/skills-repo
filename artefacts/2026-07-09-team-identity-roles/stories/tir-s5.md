## Story: An admin bulk-adds teammates from their connected GitHub org

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As a **Team admin / tech lead**,
I want to **bulk-add every member of my connected GitHub org to my tenant in one action**,
So that **I don't have to manually add each teammate one at a time when most of my team is already in the same GitHub org**.

## Benefit Linkage

**Metric moved:** Per-person role assignment exists (breadth — more people covered, faster).
**How:** This story reuses tir-s3's add-teammate mechanism to seed many `team_memberships` rows in one action instead of one at a time, using the platform's existing GitHub org-fetch capability (p1.1's `setFetchOrgs` adapter). It does not change the metric's target, but makes reaching 100% coverage for a real GitHub-org-based team practical rather than tedious.

## Architecture Constraints

- Builds on the existing `setFetchOrgs` adapter (p1.1, D37-compliant, already wired for tenant resolution) — this story reuses that adapter to list org members, it does not reimplement GitHub org API integration.
- **D37:** if bulk-add requires any adapter behaviour beyond what `setFetchOrgs` already provides, the same injectable, stub-throws pattern applies.
- **Platform-availability check (D2-platform):** the GitHub org-membership API is confirmed available and already integrated in this codebase (p1.1) — no deferral needed for this story.

## Dependencies

- **Upstream:** tir-s1 (schema), tir-s3 (this story calls the same underlying add-teammate operation tir-s3 builds, just in a loop rather than one at a time — hard dependency).
- **Downstream:** tir-s6 (validates the bulk-insert path at scale).

## Acceptance Criteria

**AC1:** Given an admin's account is connected to a GitHub org, When they choose "bulk-add from GitHub org" on their team management page, Then every member of that org who does not already have a `team_memberships` row in the admin's tenant is added with a default role (engineer), as a one-time action.

**AC2:** Given a GitHub org member was added via bulk-add, When that person subsequently logs in via GitHub, Then they resolve to the same tenant and role as any manually-added teammate — bulk-add only seeds `team_memberships` rows, it does not introduce a different login code path.

**AC3:** Given an admin runs bulk-add a second time after some org members were already added (either by an earlier bulk-add or manually via tir-s3), When the action runs, Then already-present members are skipped — no duplicate rows are created, and no existing member's manually-set role is overwritten.

**AC4:** Given the admin's GitHub OAuth token does not have org-membership read scope, When bulk-add is attempted, Then it fails with a clear, actionable error naming the missing permission — not a silent no-op and not a crash.

## Out of Scope

- Live or ongoing sync of GitHub org membership changes — this is a one-time bulk-add action, per this epic's Out of Scope. A member who later leaves the GitHub org is not automatically removed.
- Bulk-add from any non-GitHub directory (Google Workspace, SCIM, etc.) — GitHub org is the only bulk-add source in this story.
- Letting the admin choose a different role per bulk-added member in the same action — all bulk-added members get the same default role; per-person role changes happen afterward via tir-s3's assign-role action.

## NFRs

- **Performance:** Bulk-add for a realistic org size (up to ~100 members, matching tir-s6's scale target) completes without timing out the request — exact threshold confirmed alongside tir-s6.
- **Security:** Bulk-add only operates within the GitHub org the admin's own account is a verified member of — it cannot be pointed at an arbitrary org name.
- **Accessibility:** The bulk-add control meets WCAG 2.1 AA.
- **Audit:** Bulk-add action logged (admin's person ID, org name, count of members added, timestamp).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

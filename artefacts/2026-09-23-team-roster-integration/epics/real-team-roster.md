## Epic: Pod and team pickers show the real, invited members of a tenant's team

**Discovery reference:** artefacts/2026-09-23-team-roster-integration/discovery.md
**Benefit-metric reference:** artefacts/2026-09-23-team-roster-integration/benefit-metric.md
**Slicing strategy:** Vertical slice

## Goal

A product owner assigning a pod, or any tenant member viewing `/team/members`, sees the real people who have been invited to or added to their tenant's team — not a fixed set of 3 fictional demo names. Every pod created after this epic ships references real, resolvable identities. The already-real, already-shipped `people`/`team_memberships`/`person_identities` system (from the `team-identity-roles` epic) is read from, not rebuilt.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    subgraph rtri-s1[rtri-s1: real roster read API]\n        UR[modules/user-roles.js\\nlistTeamMembers]\n        TM_ROUTE[routes/team-management.js\\nhandleGetTeamMembersApi]\n        SRV1[server.js\\nGET /api/team/members]\n    end\n    subgraph rtri-s2[rtri-s2: pod picker wiring]\n        PM[public/pod-manager.html]\n    end\n    subgraph rtri-s3[rtri-s3: /team/members listing]\n        TM_PAGE[routes/team-management.js\\nhandleGetTeamMembers]\n    end\n    UR --> TM_ROUTE\n    TM_ROUTE --> SRV1\n    SRV1 --> PM\n    UR --> TM_PAGE"}}---

## Out of Scope

- **Building a new invite/signup/roles system** — already exists (`team-identity-roles` epic, `tir-s1` onward); this epic only adds a read path on top of it.
- **Auto-creating `people`/`team_memberships` rows on raw login** — deliberately not how the existing system works; membership stays invite/add-driven.
- **Migrating or backfilling any pre-existing pod's fake `ORG_ROSTER`-sourced membership** — a real, flagged risk (see discovery's Assumptions and Risks) but explicitly deferred; only pods created after this epic ships are affected.
- **Resuming `ep4-s2`** — a separate story in a different feature (`new-feature-2b74a292`), paused pending this epic, resumed afterward.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Real pod membership | 0% | 100% of pod_members rows for pods created after release reference a real identity | Stories 1+2 add the real data layer and wire `pod-manager.html`'s picker to it |
| /team/members shows a real list | 0 (no list rendered at all) | 100% of the tenant's real team_memberships rows rendered | Stories 1+3 add the real data layer and wire the existing page to render from it |

## Stories in This Epic

- [ ] Expose the real team roster as a read API (rtri-s1)
- [ ] Wire pod-manager.html's member picker to the real roster (rtri-s2)
- [ ] Render a real member list on /team/members (rtri-s3)

## Human Oversight Level

**Oversight:** Low
**Rationale:** Read-only integration against an already-real, already-tested data layer (`tir-s1`/`tir-s2`, merged and stable). No new schema, no changes to the invite/write path. Well-understood, low ambiguity across all 3 stories.

## Complexity Rating

**Rating:** 1

## Scope Stability

**Stability:** Stable

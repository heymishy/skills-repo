## Epic: Feature Collaboration & Sign-Off

**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A team of collaborators can access a feature in real time, each from their own authenticated session, see role-filtered stages by default, track who's online, and sign off at a stage to advance the feature. This is the core MVP: multi-user collaboration with accountability.

## Out of Scope

- Simultaneous editing of the same artefact by two users at the exact same moment (one at a time per stage is acceptable)
- Billing or pricing enforcement
- Hard access control / role-based gates (client-side filtering only)
- Notifications when a team member comes online
- Do-Not-Disturb or custom status per user
- Presence-based locking or artefact edit conflicts

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/new-feature-2b74a292/benefit-metric.md]

## Stories in This Epic

- [x] Load Feature with Pod Collaborators and Present Presence Sidebar — artefacts/new-feature-2b74a292/stories/ep2-s1.md (DoD complete, artefacts/new-feature-2b74a292/dod/ep2-s1-dod.md)
- [x] Filter Stage Visibility by Role — artefacts/new-feature-2b74a292/stories/ep2-s2.md (DoD complete, artefacts/new-feature-2b74a292/dod/ep2-s2-dod.md)
- [ ] Sign-Off at a Stage (Approval Record & Advance) — artefacts/new-feature-2b74a292/stories/ep2-s3.md
- [ ] Concurrent Write Merge for Artefact Edits — artefacts/new-feature-2b74a292/stories/ep2-s4.md

**Epic status: in progress** (2/4 stories DoD-complete as of 2026-09-18).

## Human Oversight Level

**Oversight:** High
**Rationale:** Real-time presence, concurrent write handling, role filtering, and approval state machines are complex; multiple auth/session paths need to work together.

## Complexity Rating

**Rating:** 3

## Scope Stability

**Stability:** Stable

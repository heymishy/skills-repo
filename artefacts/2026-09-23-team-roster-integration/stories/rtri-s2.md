## Story: Wire pod-manager.html's member picker to the real roster
**Epic reference:** artefacts/2026-09-23-team-roster-integration/epics/real-team-roster.md
**Discovery reference:** artefacts/2026-09-23-team-roster-integration/discovery.md
**Benefit-metric reference:** artefacts/2026-09-23-team-roster-integration/benefit-metric.md
**Domain:** web-ui

## User Story

As a **product owner or feature lead assigning a pod**,
I want **to pick pod members from my tenant's real, invited team**,
So that **the pods I create actually reflect my real team, not 3 fixed demo names**.

## Benefit Linkage

**Metric moved:** Real pod membership
**How:** This story replaces `pod-manager.html`'s hardcoded `ORG_ROSTER` picker with a fetch against `rtri-s1`'s new real-roster endpoint — every pod created afterward can reference real, resolvable identities, moving the metric from its confirmed 0% baseline.

## Architecture Constraints

- **ADR-026 (reuse an existing entity/pattern):** the fetch-on-load pattern already exists in this same file (`pod-manager.html` already fetches nothing today, but the SAME app's `ep4-s1` modal already established the "fetch a picker's data on open, from a real endpoint" pattern this story mirrors).
- No change to `pod-store.js`'s own `createPod`/`pod_members` write path — a real `identity_key` is simply a different (real, not fake) string value passed through the exact same existing write path. `pod_members.user_id` is already a plain `VARCHAR`, so no schema change is needed to store a real identity in place of a fake one.
- No change to `feature-collaborator-store.js` or `ep4-s1`'s own collaborator-sourcing logic — it already reads whatever `pod_members` contains; once `pod_members` contains real identities, `feature_collaborators` does too, automatically, with zero code change there (verify this in AC4 below rather than assuming it).

## Dependencies

- **Upstream:** `rtri-s1` (the real roster read API) must be complete — this story consumes its endpoint directly.
- **Downstream:** None within this epic. Indirectly unblocks `ep4-s2` (paused, separate feature `new-feature-2b74a292`) once this epic ships in full.

## Acceptance Criteria

**AC1:** Given a tenant with 2 real team members, When a product owner opens the "Create Pod" modal on `/admin/pods/manager`, Then the "Available" roster lists both real members (by their real identity), not the 3 hardcoded `ORG_ROSTER` names.

**AC2:** Given the real roster is displayed, When the product owner adds 2 real members and saves the pod, Then `pod_members.user_id` for both rows contains their real identity values — confirmed by direct query, not just UI inspection.

**AC3:** Given a tenant with ZERO real team members (no `team_memberships` rows), When the product owner opens the "Create Pod" modal, Then the "Available" roster renders empty (not an error, not the old fake names) — matches `rtri-s1`'s own AC1/AC2 return-shape for an empty result.

**AC4:** Given a pod created with real members (per AC2), When that pod is assigned to a feature via `ep4-s1`'s existing "Assign pods" flow, Then `feature_collaborators` for that feature contains the same real identities — verifying zero new code was needed in `ep4-s1`'s own collaborator-sourcing path, per this story's own Architecture Constraints claim.

**AC5:** Given the existing role-tab filter and search-by-name controls already present in `pod-manager.html` (from `ep1-s1`), When used against the real roster, Then they continue to function correctly (regression guard — these controls must not silently break when the underlying data source changes from a static array to a fetched one).

## Out of Scope

- The `/team/members` page's own listing gap — that is `rtri-s3`.
- Any change to `ep4-s1`'s own code — AC4 verifies zero change was needed; if it turns out a change IS needed, that is a scope-note escalation, not silently expanded into this story.
- Migrating or backfilling any pre-existing pod's fake-id membership — explicitly out of scope per the epic itself.

## NFRs

- **Performance:** The roster fetch completes well within the "Create Pod" modal's own existing 1-second-equivalent budget (matches `ep4-s1`'s own established NFR pattern for a comparable fetch-on-open modal).
- **Security:** No new data exposure — the real roster already only shows a tenant's own members (ADR-025, enforced in `rtri-s1`); this story doesn't widen that.
- **Accessibility:** The existing role-tab/search controls' accessibility (already established in `ep1-s1`) is preserved — this story changes the data source, not the controls' markup or semantics.
- **Audit:** Not applicable — no new write/mutation; pod creation's own existing behaviour (unaudited today) is unchanged.

## Complexity Rating

**Rating:** 2 — the picker rewiring itself is low-complexity, but AC4's cross-story verification (does `ep4-s1` really need zero changes) carries some genuine risk of a real, if small, follow-up fix being needed.
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->

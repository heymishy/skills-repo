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
- **Pod role vs. team role (found during `/test-plan` prep, 2026-09-24 — see decisions.md):** `pod_members.role_id` (conductor/engineer/architect/product — a person's role *within this pod*) and `team_memberships.role` (admin/engineer/product/viewer — a tenant-wide permission role, returned by `rtri-s1`'s endpoint) are two distinct, unrelated vocabularies. Today, `ORG_ROSTER`'s fixture is the ONLY source of pod role — no real person has one, and no UI exists to assign one. This story adds a minimal pod-role selector (AC7) rather than mislabelling a real member's pod-role chip with their unrelated team role, or defaulting silently.

## Dependencies

- **Upstream:** `rtri-s1` (the real roster read API) must be complete — this story consumes its endpoint directly.
- **Downstream:** None within this epic. Indirectly unblocks `ep4-s2` (paused, separate feature `new-feature-2b74a292`) once this epic ships in full.

## Acceptance Criteria

**AC1:** Given a tenant with 2 real team members, When a product owner opens the "Create Pod" modal on `/admin/pods/manager`, Then the "Available" roster lists both real members (by their real identity), not the 3 hardcoded `ORG_ROSTER` names — shown without a pod-role chip or tab-group membership until a pod role is assigned (see AC7).

**AC2:** Given the real roster is displayed, When the product owner adds 2 real members (each assigning a pod role per AC7) and saves the pod, Then `pod_members.user_id` for both rows contains their real identity values and `pod_members.role_id` contains the pod role selected for each — confirmed by direct query, not just UI inspection.

**AC3:** Given a tenant with ZERO real team members (no `team_memberships` rows), When the product owner opens the "Create Pod" modal, Then the "Available" roster renders empty (not an error, not the old fake names) — matches `rtri-s1`'s own AC1/AC2 return-shape for an empty result.

**AC4:** Given a pod created with real members (per AC2), When that pod is assigned to a feature via `ep4-s1`'s existing "Assign pods" flow, Then `feature_collaborators` for that feature contains the same real identities — verifying zero new code was needed in `ep4-s1`'s own collaborator-sourcing path, per this story's own Architecture Constraints claim.

**AC5:** Given the existing search-by-name control already present in `pod-manager.html` (from `ep1-s1`), When used against the real roster, Then it continues to function correctly against real identities (regression guard — must not silently break or throw when the underlying data source changes from a static array to a fetched one). The existing role-tab filter, which today filters the "Available" panel by a pre-existing `roleId`, has no pod role to filter by in the "Available" panel once real members carry no pod role until added (AC1/AC7) — its exact treatment there (hidden, disabled, or repurposed to filter "Your team" by assigned pod role instead) is an implementation decision for `/implementation-plan`, constrained only by: it must never silently show a wrong/stale role, and it must not throw or break the picker.

**AC6:** Given a real identity string containing HTML-significant characters (e.g. an identity_key or display value containing `<`, `>`, or `'`), When the "Available"/"Your team" roster lists are rendered, Then the value is inserted via safe DOM construction (`createElement`/`textContent`) or equivalent escaping — never raw string concatenation into `innerHTML` — matching `ep4-s1`'s own fixed pattern (commit `6adfb5b2`) and satisfying MC-SEC-01. Verified by a test asserting the payload string is never interpreted as markup (no injected element/attribute appears in the rendered DOM).

**AC7:** Given a real team member with no pre-existing pod role (AC1), When the product owner clicks "Add" for that member in the "Available" panel, Then a pod-role selector (the existing `VALID_ROLES`: conductor/engineer/architect/product) is presented before the member is added to "Your team", and the selected value — not any value from `rtri-s1`'s roster response — is written to `pod_members.role_id` on save (AC2). The pod's creator (pre-included, `roleId: 'conductor'`) is unaffected — this AC applies only to members added from the real roster.

## Out of Scope

- The `/team/members` page's own listing gap — that is `rtri-s3`.
- Any change to `ep4-s1`'s own code — AC4 verifies zero change was needed; if it turns out a change IS needed, that is a scope-note escalation, not silently expanded into this story.
- Migrating or backfilling any pre-existing pod's fake-id membership — explicitly out of scope per the epic itself.
- Editing a pod role after a member has already been added to "Your team" — AC7 only covers assignment at add-time; changing your mind requires removing and re-adding (matches this picker's existing remove/re-add mechanism, no new UI needed for this case).
- Any change to `team_memberships.role` (the permission role) — AC7's selector writes only `pod_members.role_id`, a completely separate value; this story never reads or writes `team_memberships.role`.

## NFRs

- **Performance:** The roster fetch completes well within the "Create Pod" modal's own existing 1-second-equivalent budget (matches `ep4-s1`'s own established NFR pattern for a comparable fetch-on-open modal).
- **Security:** No new data exposure — the real roster already only shows a tenant's own members (ADR-025, enforced in `rtri-s1`); this story doesn't widen that. Real identity strings rendered into the picker MUST use safe DOM construction or equivalent escaping, never raw string concatenation into HTML (MC-SEC-01) — see AC6.
- **Accessibility:** The existing role-tab/search controls' accessibility (already established in `ep1-s1`) is preserved for "Your team" — this story changes the data source, not the controls' markup or semantics. AC7's new pod-role selector uses a native, labelled `<select>` (matching this app's own established native-controls convention, e.g. `team-management.js`'s existing role `<select>`), not a custom widget.
- **Audit:** Not applicable — no new write/mutation; pod creation's own existing behaviour (unaudited today) is unchanged.

## Complexity Rating

**Rating:** 2 — the picker rewiring itself is low-complexity, and AC7's pod-role selector (added 2026-09-24, see decisions.md) is a small, well-understood UI addition (a `<select>` shown before an "Add" confirms, reusing the existing `VALID_ROLES` constant) with no new unknowns of its own. AC4's cross-story verification (does `ep4-s1` really need zero changes) remains the story's real source of ambiguity and is why this stays at 2 rather than 1.
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->

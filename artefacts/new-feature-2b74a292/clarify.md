# Discovery: Multi-User Collaboration and Role-Aware Sessions

**Status:** Clarified
**Date:** 2025-01-30
**Feature slug:** 2025-01-30-multi-user-role-sessions

---

## Problem statement

The platform currently scopes features to a single user session. When multiple people need to collaborate on a feature — a product person and an engineer, for example — they must share a single login or work over a screen share. There is no concept of identity, role, or stage-level responsibility within a feature. Collaborators cannot see the feature independently, cannot act on it from their own account, and cannot be directed to the stages relevant to their role. The result is slower delivery, unclear ownership, and no audit trail of who contributed what.

---

## Who it affects

**Primary personas:**

- **Solo operator / platform builder** — currently building and testing the pipeline; directly experiences the friction of simulating multi-role collaboration alone or with beta participants over screen share
- **Beta users (product and engineering roles)** — onboarded to test the pipeline; blocked from independently accessing features they are meant to contribute to; collaboration is only possible via workarounds
- **Organisation administrator** — responsible for setting up and maintaining role definitions for their organisation

Both collaborator personas are experiencing this actively today.

---

## Why now

The platform is preparing for scale. Bringing multiple real collaborators into a feature is a prerequisite for that readiness. Screen-sharing workarounds that are tolerable for a solo operator become a hard blocker the moment a second person needs to act independently on a feature in their own session.

---

## MVP scope

The minimum viable version allows multiple authenticated users to access the same feature, each from their own account. Each user sees all pipeline stages, with a role-filtered default view based on their organisation role. No real-time simultaneous editing.

**Must be true for first use:**
- Two users with different organisation roles (e.g. product + engineer) can both log in and navigate to the same feature independently
- Each sees all stages, with a role-filtered default view — product roles see discovery/benefit-metric/definition stages by default; engineer roles see test-plan/DoR/coding stages by default. All stages remain accessible on request.
- The system knows who contributed at each stage (attribution)
- An organisation administrator can define role definitions (name, stage mapping) for their organisation via an admin panel — this setup happens once per organisation and applies to all features within that organisation

---

## Out of scope

- **Real-time simultaneous editing** — two users typing into the same session at the same moment is deferred; one contributor at a time per stage is acceptable for MVP
- **Billing or pricing tier enforcement** — which roles or how many collaborators are permitted per plan is not part of this initiative
- **Role-based access control (hard gates)** — restricting what a user *can do* based on role is deferred; the MVP is visibility and attribution, not enforcement

---

## Assumptions and risks

[RESOLVED] Role definitions (e.g. "product", "engineer") are organisation-level and defined by an operator/admin in the UI, not fetched from GitHub. Role-to-stage mapping is hardcoded for MVP (product → discovery/benefit-metric/definition; engineer → test-plan/DoR/coding).

[ASSUMPTION] The existing auth model (GitHub OAuth) can be extended to support multi-user feature access and role assignment without a significant re-architecture of session or tenant scoping — confirmation pending implementation spike, but preliminary assessment: tenant scoping (ADR-025) already isolates features per organisation, so adding role assignment within a tenant is additive, not a re-architecture.

[ASSUMPTION] "Filtered to relevant stages" can be implemented as a client-side view preference (UI-only, no backend enforcement) rather than requiring server-side role enforcement — acceptable for MVP; full RBAC deferred.

---

## Directional success indicators

**Multiple users independently accessing the same feature:**
Baseline: 0 (not possible today — features are single-user scoped).
Target: Two users with different roles can each reach the same feature from their own login without a workaround.
Measured via: E2E test confirming two distinct authenticated sessions can load the same feature slug.

**Stage attribution:**
Baseline: No attribution exists — no record of who acted at which stage.
Target: Every stage action records the authenticated user's identity.
Measured via: Audit log or pipeline-state.json contributor field populated on each stage action.

**Role-filtered default view:**
Baseline: No role concept exists today.
Target: A user assigned a product role sees discovery/benefit-metric/definition stages by default; an engineer role sees test-plan/DoR/coding stages by default. All stages remain accessible on request.
Measured via: E2E test confirming stage visibility matches role; manual verification in beta.

**Admin role setup:**
Baseline: No admin panel exists.
Target: An operator can define a new organisation role, name it, assign it a stage-visibility mapping, and have it apply to all features in that organisation.
Measured via: Admin panel acceptance test; role assignment persists across sessions.

---

## Constraints

- No real-time simultaneous editing (explicitly out of scope, see above)
- Must work within the existing GitHub OAuth authentication model
- Multi-tenancy (ADR-025) is already in place — this feature extends it with role assignment within a tenant; it does not re-architect the tenant isolation model
- Role-to-stage mapping is hardcoded for MVP (product → discovery/benefit-metric/definition; engineer → test-plan/DoR/coding); future work may make this configurable

---

## Clarification log

[2025-01-30] Clarified via /clarify:
- Q: What does "product" and "engineer" mean in your specific context?  A: Organisation roles
- Q: How does the system currently know which organisation role a user holds?  A: Need to define it somewhere in the UI (not automatically from GitHub)
- Q: Does that mean an operator/admin panel for role setup per organisation?  A: Yes
- Q: What's the stage mapping — product sees product stages, engineer sees coding stages?  A: Yes (confirmed via discussion; product → discovery/benefit-metric/definition; engineer → test-plan/DoR/coding)

---

## Attribution

**Contributors:**
- Operator — Product / Engineering — 2025-01-30

**Reviewers:**
- Pending

**Approved By:**
- Pending

---
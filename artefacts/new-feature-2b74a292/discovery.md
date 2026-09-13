# Discovery: Multi-User Collaboration and Role-Aware Sessions

**Status:** Draft
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

Both are experiencing this actively today.

---

## Why now

The platform is preparing for scale. Bringing multiple real collaborators into a feature is a prerequisite for that readiness. Screen-sharing workarounds that are tolerable for a solo operator become a hard blocker the moment a second person needs to act independently on a feature in their own session.

---

## MVP scope

The minimum viable version allows multiple authenticated users to access the same feature, each from their own account. Each user sees all pipeline stages but the default view is filtered to the stages relevant to their role. No real-time simultaneous editing.

**Must be true for first use:**
- Two users with different roles (e.g. product + engineer) can both log in and navigate to the same feature independently
- Each sees all stages, with a role-filtered default view
- The system knows who contributed at each stage (attribution)

---

## Out of scope

- **Real-time simultaneous editing** — two users typing into the same session at the same moment is deferred; one contributor at a time per stage is acceptable for MVP
- **Billing or pricing tier enforcement** — which roles or how many collaborators are permitted per plan is not part of this initiative
- **Role-based access control (hard gates)** — restricting what a user *can do* based on role is deferred; the MVP is visibility and attribution, not enforcement

---

## Assumptions and risks

[ASSUMPTION] Role definitions (e.g. "product", "engineer") are known and stable enough to map to pipeline stages — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] The existing auth model (GitHub OAuth) can be extended to support multi-user feature access without a significant re-architecture of session or tenant scoping — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] "Filtered to relevant stages" can be implemented as a client-side view preference rather than requiring server-side role enforcement — unconfirmed, may affect implementation complexity.

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
Baseline: [UNKNOWN BASELINE] — no role concept exists today.
Target: A user assigned a role sees only their relevant stages by default (all stages accessible on request).
Measured via: Manual verification in beta, then automated assertion.

---

## Constraints

- No real-time simultaneous editing (explicitly out of scope, see above)
- Must work within the existing GitHub OAuth authentication model
- Multi-tenancy (ADR-025) is already in place — this feature extends it with role assignment within a tenant, it does not re-architect the tenant isolation model

---

## /clarify recommendation

This discovery contains 2 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] Role definitions (e.g. "product", "engineer") are known and stable enough to map to pipeline stages — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] The existing auth model (GitHub OAuth) can be extended to support multi-user feature access without a significant re-architecture of session or tenant scoping — unconfirmed, requires /clarify before scope is locked.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

## Attribution

**Contributors:**
- Operator — Product / Engineering — 2025-01-30

**Reviewers:**
- Pending

**Approved By:**
- Pending

---
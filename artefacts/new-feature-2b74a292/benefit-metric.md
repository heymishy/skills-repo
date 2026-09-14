# Discovery: Multi-User Role-Based Synchronous Collaboration

**Status:** Clarified
**Date:** 2025-01-30
**Feature slug:** 2025-01-30-multi-user-role-sessions

---

## Problem statement

The skills pipeline currently supports single-user feature sessions. When a team of people with different roles (product, engineer, designer, architect, conductor/facilitator) needs to collaborate on the same feature together in real time, they must screen-share or use workarounds. There is no concept of role-aware visibility, synchronous presence, stage-level sign-off, or reversibility with audit trail. The result is slower delivery, unclear accountability, and no record of who contributed what or why decisions changed.

---

## Who it affects

**Primary personas:**

- **Solo operator / platform builder** — currently testing the pipeline; experiences friction simulating multi-role collaboration alone or over screen share
- **Team collaborators (product, engineer, designer, architect, conductor)** — onboarded to test real team delivery; blocked from working together on the same feature in real time; coordination happens outside the pipeline
- **Organisations** — will want to define their own role families and stage mappings rather than using a fixed set

---

## Why now

The platform is preparing for scale to real teams. Synchronous, multi-role collaboration is a prerequisite for that readiness. Workarounds that are tolerable for a solo operator become a hard blocker when a real team of 3–5 people needs to coordinate on one feature delivery.

---

## MVP scope

The minimum viable version enables a team to collaborate on a single feature in real time, with role-aware visibility and sign-off gates. Each team member sees the same feature, with a default view filtered to their role's relevant stages (all stages remain accessible on request). Sign-off at each stage records the approver's identity. The team can move forward or backward through stages, with changes and reversals recorded in audit trail and decisions.md.

**Must be true for first use:**
- Multiple authenticated users with different roles can access the same feature in real time, each from their own account
- Each user sees all stages, with a default view filtered by their role (e.g., product sees discovery/benefit-metric/definition; engineer sees test-plan/DoR/coding)
- A designated person per stage can sign off, advancing the feature to the next stage
- A team member can request to go back to an earlier stage, make a change, and re-advance, with the reversibility and re-sign-off recorded in the audit trail and decisions.md
- An organisation administrator can define role families and their stage mappings (core families: designer, architect, engineer, product, conductor/facilitator; custom roles allowed)

---

## Out of scope for MVP

- **Full real-time synchronous editing** — two team members typing into the same artefact at the exact same moment is deferred; one contributor at a time per stage is acceptable
- **Billing or pricing tier enforcement** — which roles or how many collaborators are permitted per plan
- **Role-based access control (hard gates)** — restricting what a user *can do* based on role is deferred; the MVP is visibility, attribution, and sign-off; enforcement is client-side view filtering only

---

## Key unknowns requiring spike investigation

**[SPIKE-A] Independent stage editing vs. full-feature regression:**
When a team member requests to go back to stage N and make a change, does the entire feature regress to stage N (all downstream stages reset to incomplete), or can stage N be edited independently while downstream stages remain complete? This affects state architecture and reversibility semantics. Spike needed before scope is locked.

---

## Assumptions and risks

[ASSUMPTION] The existing auth model (GitHub OAuth + ADR-025 multi-tenancy) can be extended to support synchronous multi-user feature access without re-architecture — preliminary assessment: tenant scoping already isolates features per organisation, so adding role assignment and presence is additive, not a re-architecture. Confirmation pending implementation exploration.

[ASSUMPTION] "Filtered to relevant stages" can be implemented as client-side view preference (UI-only, no backend enforcement) for MVP — acceptable; full role-based access control deferred.

[ASSUMPTION] Sign-off at a stage can be represented as an approval record (approver ID, timestamp, stage) on the feature or story in pipeline-state.json — acceptable for MVP audit trail.

---

## Directional success indicators

**Synchronous team access:**
Baseline: 0 (not possible today — features are single-user scoped).
Target: A team of 3 people with different roles can each log in independently, access the same feature in real time, and see that other team members are present.
Measured via: E2E test confirming three concurrent authenticated sessions can load the same feature slug; presence indicator shows all three users.

**Role-filtered visibility:**
Baseline: No role concept exists today.
Target: A user assigned a product role sees discovery/benefit-metric/definition stages by default; an engineer role sees test-plan/DoR/coding stages by default. A conductor role sees all stages. All stages remain accessible on request.
Measured via: E2E test confirming stage visibility matches role; manual verification in beta.

**Sign-off and accountability:**
Baseline: No sign-off or attribution exists.
Target: Each stage advance records the approver's identity, timestamp, and decision context.
Measured via: Audit log or pipeline-state.json approval record populated on each stage advance; decisions.md entry created.

**Reversibility with audit trail:**
Baseline: Cannot reverse a stage.
Target: A team member can request to regress to an earlier stage, make a change, re-sign off, and have both the regression and the re-approval recorded in the audit trail and decisions.md.
Measured via: Manual verification in beta; decisions.md entry reflects the regression reason and outcome.

---

## Constraints

- No full real-time simultaneous editing (explicitly out of scope for MVP; one contributor at a time per stage)
- Must work within the existing GitHub OAuth authentication model and ADR-025 multi-tenancy
- Role definitions are organisation-level; core families (designer, architect, engineer, product, conductor) are provided; custom roles are allowed
- Sign-off is approval-based (not enforcement-based) for MVP

---

## Clarification log

[2025-01-30] Clarified via /clarify:
- Q: What does "team working together" mean — simultaneous or asynchronous handoffs?  A: Synchronous collaboration
- Q: Beyond product and engineer, what other roles?  A: Designer, architect, conductor/facilitator, and organisations should define their own
- Q: Biggest friction — visibility or coordination?  A: Both — visibility so people see the feature independently, coordination for sign-off and accountability
- Q: When you say "sign-off," what does that mean?  A: Both approval before moving forward AND recording who contributed what for audit trail
- Q: When going back a stage, does the entire feature regress or can stages be edited independently?  A: Need to investigate feasibility (spike question)
- Q: Synchronous or asynchronous collaboration?  A: Synchronous

---

## Attribution

**Contributors:**
- Operator — Product / Engineering — 2025-01-30

**Reviewers:**
- Pending

**Approved By:**
- Pending

---
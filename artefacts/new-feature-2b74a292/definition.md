Slicing strategy: Walking skeleton

## Epic 1 — Pod Formation & Product Assignment

Goal: An organisation administrator can create reusable team pods and assign them as the default for a product, so all features in that product automatically inherit the team without per-feature setup. This foundation enables features to be born with their team already assigned.

Out of scope:
- Multi-pod assignment per feature (deferred to Epic 4)
- Dynamic pod membership changes mid-feature (deferred to Epic 4)
- Pod templates or pre-built team structures (deferred)
- Editing or archiving existing pods (deferred)

Oversight: Medium
Oversight rationale: New schema and admin UI, but straightforward CRUD semantics; no complex merging or state machines yet.
Complexity: 2
Scope stability: Stable

### ep1-s1 — Create Pod UI and Backend

Persona: Organisation administrator
Domain: web-ui

So that I can establish a reusable team definition, I need to create a pod (name, description, members, roles) and persist it in the system.

Benefit linkage: Synchronous team access — completing this story enables the first step: a pod exists and can be assigned to products.

Architecture constraints: ADR-025 (multi-tenancy at application layer — pod is tenant-scoped); ADR-026 (reuse existing entity shape when possible); new schema fields added to pipeline-state.schema.json simultaneously.

Given an organisation admin is logged in and navigates to Pod Manager,
When they click "Create Pod", enter name "Core Platform", add members Hamish (conductor), Susan (engineer), Darren (engineer), and save,
Then the pod is created in the pods table, members are added to pod_members, and the admin sees "Pod created: Core Platform (3 members)".

Out of scope:
- Editing existing pods (create-only for MVP)
- Archiving pods
- Pod templates

Dependencies: None (new schema, no upstream story)

NFR:
- Pod names are unique per tenant
- Pod creation completes within 2s
- Role definitions are validated against org's known roles

Complexity: 2
Scope stability: Stable

### ep1-s2 — Assign Pod to Product as Default

Persona: Product owner
Domain: web-ui

So that all features in my product automatically use the same team without per-feature configuration, I need to assign a pod as the default for the product.

Benefit linkage: Synchronous team access — completing this story enables pod reuse across multiple features; the second step in the walking skeleton.

Architecture constraints: ADR-026 (canonical builders — getProductDefaultPod() is the single builder for this derived structure); ADR-025 (tenant scoping); new pod_assignments table with assignmentType: inherit-to-all-features.

Given a product owner is in Product settings for "Payments",
When they select "Set default pod" and choose "Core Platform Pod",
Then the assignment is saved to pod_assignments (assignmentType: inherit-to-all-features), and all new features created in "Payments" show "Assigned pods: Core Platform Pod (3 members)" automatically.

Out of scope:
- Changing a product's default pod after features are created (deferred to Epic 4)
- Unassigning a product's default pod (deferred)

Dependencies: ep1-s1 (pod must exist before assignment)

NFR:
- Default pod assignment is visible immediately in product settings (no refresh needed)
- Feature creation detects product default and auto-assigns within the feature-create flow

Complexity: 2
Scope stability: Stable

### ep1-s3 — Feature Inherits Product Default Pod on Creation

Persona: Product owner
Domain: web-ui

So that I don't have to manually assign a pod to every new feature, I need features created under a product to automatically inherit the product's default pod.

Benefit linkage: Synchronous team access — completing this story closes the foundation epic: a feature is now created with its team pre-assigned.

Architecture constraints: ADR-026 (canonical builder: getFeatureCollaborators() derives the effective collaborator list from pod assignments); ADR-025 (tenant scoping); new feature_collaborators table pre-populated at feature creation.

Given "Payments" product has default pod "Core Platform Pod",
When a product owner creates a new feature "Feature A1",
Then the feature automatically has podAssignments: [Core Platform Pod], and feature_collaborators is pre-populated with Hamish, Susan, Darren (all marked as pod members from Core Platform Pod).

Out of scope:
- Allowing the product owner to override the pod assignment during feature creation (deferred to Epic 2)
- Listing pod members in the feature creation UI (deferred to Epic 2 UI stories)

Dependencies: ep1-s2 (product must have default pod set)

NFR:
- Feature creation completes in ≤2s
- Collaborators are visible in feature settings immediately after creation

Complexity: 1
Scope stability: Stable

## Epic 2 — Feature Collaboration & Sign-Off

Goal: A team of collaborators can access a feature in real time, each from their own authenticated session, see role-filtered stages by default, track who's online, and sign off at a stage to advance the feature. This is the core MVP: multi-user collaboration with accountability.

Out of scope:
- Simultaneous editing of the same artefact by two users at the exact same moment (one at a time per stage is acceptable)
- Billing or pricing enforcement
- Hard access control / role-based gates (client-side filtering only)
- Notifications when a team member comes online
- Do-Not-Disturb or custom status per user
- Presence-based locking or artefact edit conflicts

Oversight: High
Oversight rationale: Real-time presence, concurrent write handling, role filtering, and approval state machines are complex; multiple auth/session paths need to work together.

Complexity: 3
Scope stability: Stable

### ep2-s1 — Load Feature with Pod Collaborators and Present Presence Sidebar

Persona: Team collaborator (any role)
Domain: web-ui

So that I know who is working on this feature right now, I need to load a feature and see an active presence list (who's online, who's offline, their roles).

Benefit linkage: Synchronous team access — completing this story enables real-time awareness; the first step in collaborative delivery.

Architecture constraints: ADR-026 (canonical builder: getFeatureCollaborators() resolves the effective team); new feature_presence table with heartbeat logic; SSE stream for presence updates.

Given Hamish is logged in and loads Feature A1,
When the page renders,
Then a "Team" sidebar appears showing: "Hamish (conductor, online)", "Susan (engineer, online)", "Darren (engineer, offline — last seen 10m ago)". Hamish sees a heartbeat indicator updating Darren's status every 30s.

Out of scope:
- Presence-based locking (preventing edits if another user is editing the same artefact)
- Notifications when a team member comes online
- Do-Not-Disturb or custom status per user

Dependencies: ep1-s3 (feature must have collaborators assigned)

NFR:
- Presence updates within 30s (SSE heartbeat)
- Sidebar is always visible, not hidden behind a menu

Complexity: 2
Scope stability: Stable

### ep2-s2 — Filter Stage Visibility by Role

Persona: Team collaborator (any role)
Domain: web-ui

So that I can focus on the stages relevant to my role, I need the stage list to be filtered by default based on my assigned role, with an option to show all stages.

Benefit linkage: Role-filtered visibility — completing this story delivers the core role-scoping feature.

Architecture constraints: role_definitions table defines stageVisibility per role (e.g. "product" role sees ["discovery", "benefit-metric", "definition"]); client-side filtering via JavaScript (no backend enforcement in MVP); ADR-027 (live SaaS mechanism is ordinary app code, not a SKILL.md skill).

Given Susan (engineer) loads Feature A1,
When the stage list renders,
Then Susan sees by default: "test-plan", "review", "definition-of-ready", "coding" (engineer-filtered stages). A toggle "Show all stages" is available; when clicked, all stages appear.

Out of scope:
- Hiding stages (only filtering the default view)
- Preventing a user from viewing all stages if they click "show all"
- Enforcing role-based access at the backend (client-side filtering only)

Dependencies: ep1-s3 (feature must have role assignments for collaborators); requires role_definitions table with stageVisibility mapping

NFR:
- Role-filtered default view is applied on page load (no separate click needed)
- "Show all stages" toggle persists for the user's current session (localStorage OK; cross-session persistence deferred)

Complexity: 2
Scope stability: Stable

### ep2-s3 — Sign-Off at a Stage (Approval Record & Advance)

Persona: Team collaborator with approval responsibility (product lead for discovery, tech lead for DoR, etc.)
Domain: web-ui

So that I can formally approve a stage and move the feature forward, I need to sign off at a stage, and have the system record who approved, when, and advance the feature.

Benefit linkage: Sign-off and accountability — completing this story delivers formal approval and attribution.

Architecture constraints: New feature_approvals table (featureId, stageId, approverId, approvalTime, decision, reason); ADR-024 (GET /api/journey/:id response shape is canonical — approverId and approvalTime are added to the response); ADR-020 (authenticated user's token for write-back).

Given Hamish (conductor) is at the discovery stage of Feature A1 and clicks "Sign Off",
When a modal appears asking for approval reason and he enters "Discovery is complete; personas, pain points, and scope are locked" and clicks "Approve",
Then the approval is recorded in feature_approvals, the feature advances to benefit-metric stage, and a decisions.md entry is auto-generated: "2025-01-30 — Discovery approved by Hamish (conductor) — reason: Discovery is complete; personas, pain points, and scope are locked".

Out of scope:
- Approval workflows (e.g. require two sign-offs before advancing)
- Conditional approvals (approve with requested-revision, blocking advance)
- Email notifications on approval

Dependencies: ep2-s1 (presence/collaborators must be loaded); ep2-s2 (role-filtered visibility)

NFR:
- Approval modal appears within 500ms of "Sign Off" click
- Feature advances to next stage within 2s of approval
- decisions.md entry is auto-generated and committed to the feature branch

Complexity: 2
Scope stability: Stable

### ep2-s4 — Concurrent Write Merge for Artefact Edits

Persona: Team collaborator (any role editing an artefact)
Domain: web-ui, software-engineering

So that two team members can edit the same artefact without one person's work being lost, I need concurrent edits to be merged server-side with line-level attribution.

Benefit linkage: Synchronous team access — completing this story enables safe, concurrent collaboration without conflicts.

Architecture constraints: Three-way merge algorithm (base, user-A version, user-B version) on the server; new feature_edits table tracking edit hash, merge events, and lineAttributions (JSON: line number → userId); ADR-028 (canonical builder: mergeArtefactEdits() is the single builder for merge logic — no independent re-derivation in other files).

Given Susan saves a revised AC for story S1 at the same moment Darren saves a revised architecture constraint for the same story,
When both save requests hit the server within 100ms of each other,
Then the server detects the concurrent edit, performs a three-way merge (base + Susan's version + Darren's version), and the merged result includes both Susan's AC revision and Darren's architecture constraint. Both Susan and Darren see the merged version immediately. A feature_edits record is created with operation: "merge", lineAttributions showing which lines came from which user.

Out of scope:
- Optimistic conflict resolution (showing the conflict to the user; accepting one version wholesale without merge)
- Real-time co-editing cursors or presence within the artefact editor
- Handling merge conflicts that require human intervention (assume three-way merge succeeds; hard conflicts deferred)

Dependencies: ep2-s1 (presence/collaborators); ep2-s3 (approval/attribution flow)

NFR:
- Merge completes within 1s
- Line-level attribution is accurate to within 1 character of intended scope
- Merge success rate ≥99%

Complexity: 3
Scope stability: Unstable (merge algorithm may need iteration based on real usage)

## Epic 3 — Reversibility & Audit Trail

Goal: A team member can request to regress a feature to an earlier stage (e.g. "we need to revise the definition"), make changes, re-sign-off, and have the entire flow recorded in the audit trail and decisions.md. This closes the MVP feedback loop: move forward, realise a mistake, move back and fix it, then forward again.

Out of scope:
- Partial regression (reverting only some stages while keeping others complete)
- Approval gates for regression requests (request → auto-accept for MVP)
- Reverting specific edits within a stage (only stage-level regression)
- Approval workflows for regression

Oversight: Medium
Oversight rationale: State machine for regression, audit trail updates, and decisions.md entry generation are straightforward; no real-time or concurrent complexity.

Complexity: 2
Scope stability: Stable

### ep3-s1 — Request Regression to Earlier Stage

Persona: Team collaborator (any role)
Domain: web-ui

So that we can correct or refine an earlier stage without losing work, I need to request a regression to an earlier stage, provide a reason, and have the feature revert to that stage.

Benefit linkage: Reversibility with audit trail — completing this story enables the regression flow.

Architecture constraints: Feature stage is reset to the target stage; all downstream stages are marked as incomplete; prior feature_approvals records remain (not deleted, for audit); ADR-025 (tenant scoping — regression is a tenant-scoped operation).

Given Susan is at the DoR stage of Feature A1 and realises the definition needs revision,
When she clicks "Request Regression" and selects "definition" stage, enters reason "Definition is missing architecture constraints for multi-tenancy", and submits,
Then the feature regresses to definition stage, DoR and later stages show "incomplete", the feature_approvals records for DoR and later are preserved (not deleted), and a new decisions.md entry is created: "2025-01-30 — Regression to definition requested by Susan (engineer) — reason: Definition is missing architecture constraints for multi-tenancy".

Out of scope:
- Approval gate for regression (auto-accept for MVP)
- Partial regression (all-or-nothing per stage)
- Reverting specific edits (stage-level only)

Dependencies: ep2-s3 (approval records exist)

NFR:
- Regression completes within 1s
- Prior approvals are preserved (not deleted)
- Stage marks are immediately updated (no refresh needed)

Complexity: 2
Scope stability: Stable

### ep3-s2 — Auto-Generate decisions.md Entry on Regression

Persona: Audit / compliance (implicit; entry is auto-generated)
Domain: software-engineering

So that every decision and reversal is recorded in decisions.md for audit trail, I need regression requests to auto-generate a decisions.md entry.

Benefit linkage: Reversibility with audit trail — completing this story ensures the regression is documented.

Architecture constraints: decisions.md is already the canonical decisions register for the feature (created at discovery); new entries are appended with regression context (date, user, reason, stage reverted to); ADR-029 (disk is canonical — regression entry is written to disk, not just pipeline-state.json).

Given Susan requests regression (see ep3-s1),
When the regression is processed,
Then a new entry is appended to artefacts/[feature]/decisions.md: date: 2025-01-30, session-phase: regression, decision: Regress to definition, reason: Definition is missing architecture constraints for multi-tenancy, actor: Susan (engineer), stageReverted: definition, timestamp: 2025-01-30T14:23:00Z

Out of scope:
- Editing decisions.md entries (append-only for MVP)
- Signing off regression (no approval gate for MVP)

Dependencies: ep3-s1 (regression must occur); requires decisions.md to exist on the feature

NFR:
- Entry is written to disk within 2s of regression
- Entry is immediately visible in decisions.md without refresh

Complexity: 1
Scope stability: Stable

### ep3-s3 — Re-Sign-Off After Regression (Approval Record with Prior Context)

Persona: Team collaborator with approval responsibility (same role as original sign-off)
Domain: web-ui

So that the feature can move forward again after revision, I need to sign off at the regressed stage and have the approval record note that it's a re-approval.

Benefit linkage: Reversibility with audit trail — completing this story closes the regression loop: regress → revise → re-approve → move forward.

Architecture constraints: New feature_approvals record with a reApprovalOf field linking back to the original approval being re-done; decisions.md entry is appended with re-approval context.

Given Susan has regressed Feature A1 to definition and made the necessary revisions,
When the revised definition is ready and she clicks "Sign Off" at the definition stage,
Then a new approval is recorded in feature_approvals with reApprovalOf: [original-approval-id], and a decisions.md entry is appended: "2025-01-30 — Definition re-approved by Susan (engineer) — updated: Architecture constraints for multi-tenancy added".

Out of scope:
- Requiring a different approver for re-approval (same as original for MVP)
- Approval workflow changes based on prior regression

Dependencies: ep3-s1 (regression must have occurred); ep3-s2 (decisions.md entry)

NFR:
- Re-approval is treated identically to a first approval in terms of state advance
- Prior approval and re-approval are linked in audit trail

Complexity: 1
Scope stability: Stable

## Epic 4 — Advanced Pod Operations

Goal: Support richer pod management: multi-pod assignment per feature, dynamic membership changes mid-feature, one-off custom members, and pod lifecycle (archival). These post-MVP stories enable the system to scale beyond the walking skeleton to handle complex team structures and evolving team membership.

Out of scope:
- Pod-level analytics or reporting
- Pod templates or pre-built team structures
- Cross-product pod coordination or conflict resolution
- Bulk operations on pods

Oversight: Low
Oversight rationale: These are enhancements to the core MVP; lower risk, can be refined based on MVP usage.

Complexity: 2
Scope stability: Unstable (may evolve based on MVP feedback)

### ep4-s1 — Assign Multiple Pods to a Feature (Subset Selection)

Persona: Product owner or feature lead
Domain: web-ui

So that a feature can use members from multiple teams without creating a new pod, I need to assign multiple pods to a feature and optionally remove specific members from each pod for this feature only.

Benefit linkage: Synchronous team access — completing this story enables flexible team assembly.

Architecture constraints: pod_assignments supports multiple records per feature; feature_collaborators is derived from the union of all assigned pods (minus explicitly-removed members); ADR-026 (canonical builder: getFeatureCollaborators() handles multi-pod resolution).

Given Feature A2 needs Hamish, Susan, Darren from Core Platform Pod, plus Alice from Data Analytics Pod,
When a product owner navigates to Feature A2 settings and clicks "Assign pods", selects both Core Platform Pod and Data Analytics Pod, then removes Bob from Data Analytics Pod (for this feature only),
Then Feature A2's collaborators are: Hamish, Susan, Darren, Alice (Bob remains in the pod globally, just not assigned to this feature).

Out of scope:
- Creating a new pod as part of this story (create via ep1-s1)
- Dynamically changing pod members mid-feature (ep4-s2)

Dependencies: ep1-s1 (pods must exist); ep1-s3 (feature creation)

NFR:
- Multi-pod assignment UI completes within 1s
- feature_collaborators is recalculated within 2s of change

Complexity: 2
Scope stability: Unstable

### ep4-s2 — Dynamically Add/Remove Pod Members Mid-Feature (Feature-Level Override)

Persona: Feature lead or team lead
Domain: web-ui

So that a team can adapt as a feature evolves (e.g. add a designer mid-discovery), I need to add or remove members from a pod assignment mid-feature without affecting the pod itself.

Benefit linkage: Synchronous team access — completing this story enables team flexibility.

Architecture constraints: New feature_collaborator_overrides table (featureId, userId, action: add|remove, reason, timestamp); getFeatureCollaborators() applies overrides on top of pod assignments (canonical builder pattern, ADR-026).

Given Feature A1 is in the discovery stage and the team realises a designer is needed,
When the feature lead clicks "Add team member", selects "Maya (designer)" who is not in the Core Platform Pod, and saves,
Then Maya is added to Feature A1's collaborators (override record created), and she can immediately access the feature. Her presence appears in the team sidebar.

Out of scope:
- Approval gates for mid-feature member changes (deferred)
- Notifying newly-added members (deferred)

Dependencies: ep2-s1 (presence); ep4-s1 (multi-pod foundation)

NFR:
- Member addition is visible within 30s (SSE update)
- Removed members lose access immediately (session invalidation check on next request)

Complexity: 2
Scope stability: Unstable

### ep4-s3 — Archive a Pod and Preserve Audit Trail

Persona: Organisation administrator
Domain: web-ui

So that inactive teams don't clutter the pod list but remain auditable, I need to archive a pod (mark it inactive) without deleting it.

Benefit linkage: Operational housekeeping (no direct metric linkage)

Architecture constraints: pods.status field is updated to "archived"; archived pods remain in pod_members and pod_assignments (not deleted); new pods are not offered in dropdowns if archived.

Given the "Legacy Platform Pod" is no longer used,
When an org admin navigates to Pod Manager and clicks "Archive" on that pod,
Then the pod status is set to "archived", it no longer appears in the "Assign pod" dropdown, but existing features using it remain unchanged (members still listed for audit).

Out of scope:
- Bulk archival
- Un-archiving a pod (deferred)
- Merging archived pods

Dependencies: ep1-s1 (pods exist)

NFR:
- Archival is immediate (no background job)
- Archived pods remain visible in feature audit trail

Complexity: 1
Scope stability: Stable
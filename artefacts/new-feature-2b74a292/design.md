# Design: Multi-User Role-Aware Synchronous Collaboration

**Status:** Draft
**Date:** 2025-01-30
**Feature slug:** 2025-01-30-multi-user-role-sessions

---

## Reference Materials

**`reference/collaborators-picker-wireframe.html`** — a wireframe redrawn from a screenshot the operator brought to discovery, depicting an internal tool's collaborator-picking flow ("who's building this?"). Per this skill's own Step 3 entry condition, reference materials in `artefacts/[feature]/reference/` must be consulted and reflected in the UX design — this was missed in the original pass; addressed below (Amendment, 2026-09-14).

Five structural patterns the wireframe surfaced, and their disposition in this design:

1. **Role-tagged roster** (candidates tagged Product Owner / Engineer, filterable) — adopted; became `role_definitions` and the Pod member model (see Data Model, and the new "Pod Creation / Collaborator Picker" UX section below).
2. **Operator pre-included by default** — adopted; the pod/feature creator is always a member (see Role-Scoped Visibility).
3. **"Save as a reusable team" checkbox** — adopted, and became the central concept of this feature: the entire Pod data model (Epic 1, Epic 4) traces directly to this one wireframe annotation.
4. **Private / discoverable visibility toggle** — evaluated, **deferred** (see Open Questions).
5. **Gated primary action** ("Start" disabled until ≥1 Engineer selected) — adopted as a UX detail (see Pod Creation / Collaborator Picker).

---

## Solution Architecture

### System Components

The multi-user collaboration system extends the existing web UI layer with three new capabilities: presence tracking, concurrent artefact editing with server-side merge, and role-scoped visibility.

```
Browser (User A: Product)
  │
  ├─ Session token + userId + roleId
  │
  ├─ SSE stream: presence updates (User B online, User C online)
  │
  └─ POST /api/features/:id/artefacts/:name/save
       │ (concurrent write from User B also firing)
       │
       ├─ req.session.accessToken (User A's GitHub token)
       ├─ req.body.content (User A's edited artefact)
       ├─ req.body.contentHash (version tag)
       │
       ▼
  Node.js server (src/web-ui/routes/artefact-write.js)
       │
       ├─ 1. Validate tenant ownership (requireSameTenant)
       ├─ 2. Fetch current version from GitHub (base)
       ├─ 3. Fetch User B's concurrent save (if present in write queue)
       ├─ 4. Three-way merge: base + User A edits + User B edits
       ├─ 5. Compute attribution: which lines came from User A, which from User B
       ├─ 6. Write merged result back to GitHub (Contents API + User A's token)
       ├─ 7. Record merge event in Postgres (feature_edits table)
       │
       └─ 8. Broadcast SSE: "artefact updated, refresh" to all users on this feature
              │
              ▼
  Browser (User B: Engineer) receives SSE update
       │
       └─ Fetch updated artefact, display merged result with attribution
```

### Data Model

**New tables:**

- `feature_collaborators` — associates users + roles to a feature
  - `featureId`, `userId`, `roleId`, `joinedAt`, `isApprover` (can sign off at stages this role owns)

- `feature_edits` — audit trail of all concurrent edits and merges
  - `featureId`, `artefactName`, `userId`, `timestamp`, `operation` (save/merge/revert), `editHash`, `mergedWith` (if a merge occurred), `lineAttributions` (JSON: line number → userId)

- `feature_presence` — active sessions per feature
  - `featureId`, `userId`, `sessionId`, `lastHeartbeat`, `roleId`

- `feature_approvals` — sign-off records per stage
  - `featureId`, `stageId`, `approverId`, `approvalTime`, `decision` (approved/requested-revision), `reason` (links to decisions.md)

- `role_definitions` — organisation-level role families
  - `tenantId`, `roleId`, `name` (e.g. "product", "engineer", "architect"), `stageVisibility` (JSON array of stage slugs this role sees by default), `canApproveStagess` (JSON array of stages this role can sign off on)

**New fields in `pipeline-state.json` per story:**

- `story.approvals[]` — array of approval records; only stories in a multi-user feature need this, legacy single-user features omit it
- `story.attributions` — for each artefact file in this story, a map of line numbers to contributor userId

### Presence and Real-Time Updates

**Presence tracking:**
- On session start (`GET /api/features/:id`), insert a row into `feature_presence`
- Heartbeat every 30 seconds via SSE keep-alive; update `lastHeartbeat`
- On session close or timeout, delete the row
- Broadcast presence list to all active sessions on the feature every 30 seconds

**Concurrent edit notification:**
- When a save completes (POST /api/features/:id/artefacts/:name/save), emit an SSE event to all other sessions: `{ type: 'artefact-updated', artefactName, editedBy, mergedWith (if applicable) }`
- Clients receive the event and offer a refresh option (not forced reload, to preserve local edits in progress if the user wants to keep typing)

### Concurrent Write Merge Algorithm

**Three-way merge (line-based):**

1. **Baseline:** Fetch the last-known-good version of the artefact (the version both User A and User B started editing from)
2. **User A's edits:** Compute diff: baseline → User A's version
3. **User B's edits:** Compute diff: baseline → User B's version
4. **Merge:**
   - Apply all non-overlapping changes from both diffs
   - For overlapping changes (same line edited by both): flag as a conflict; keep both versions with a conflict marker; escalate to a human merge step (see Conflict Resolution below)
5. **Attribution:** Record which lines came from User A, which from User B; store in `feature_edits.lineAttributions` and in-file comments (e.g. `<!-- edited by User A at timestamp -->`)

**Conflict resolution (deferred from MVP):** If a true conflict is detected (same line edited by both), the merge creates a marked conflict section; the next user to load the artefact sees the conflict and is prompted to resolve it manually. This is rare in discovery (usually different sections edited), so MVP accepts the manual step for the few cases it occurs. Full conflict resolution UI is Phase 2.

### Role-Scoped Visibility

**Role assignment:**
- On feature creation, the creator is assigned a default role (e.g. "operator"/"conductor" — all stages visible)
- Collaborators are invited via GitHub username; system looks up their user record and prompts for role assignment
- Role assignment is stored in `feature_collaborators.roleId`

**Stage visibility filtering:**
- `role_definitions.stageVisibility` defines which stages a role sees by default (e.g. product role sees discovery, benefit-metric, definition; engineer sees test-plan, dor, coding)
- Client-side UI filter: default view shows only `role_definitions.stageVisibility` stages; a "show all stages" toggle reveals the rest
- No server-side enforcement for MVP (visibility is client-side filter); access control (preventing an engineer from editing a discovery stage) is deferred to Phase 2

**Sign-off and approvals:**
- Each stage has an `isApprover` role designation (set per role in `role_definitions`)
- When a role marked `isApprover` for a stage completes their work, they see a "Sign off and advance" button
- Clicking the button records an approval in `feature_approvals`, updates `pipeline-state.json`'s `story.approvals[]`, and creates a decisions.md entry
- Only one approver per stage per feature can advance it (first to approve wins; others see "already approved, awaiting next stage")

### Reversibility with Audit Trail

**Going back a stage:**
- A collaborator can request to regress the feature to an earlier stage (e.g. "we need to revisit the discovery")
- The request is recorded in `decisions.md` with a reason field
- Regression sets `pipeline-state.json` `stage` field back to the earlier stage; downstream stages are marked as incomplete (but not deleted)
- All edits and approvals for the regressed stage and downstream remain in audit tables (`feature_edits`, `feature_approvals`) — they are not deleted, only marked as "superseded by regression"
- When re-advancing after a regression, a new approval record is created (the second approval is distinct from the first in `feature_approvals`, linked by a `regressionId`)

---

## UX / Interaction Design

### Pod Creation / Collaborator Picker (Amendment, 2026-09-14)

This section was missing from the original design pass — the reference wireframe
(`reference/collaborators-picker-wireframe.html`) was never consulted, despite being
exactly the screen Epic 1 (Pod Formation) and Epic 4 (Advanced Pod Operations) build.
Retrofitted here so the design artefact actually describes the screen those stories
already assume.

**Screen: Pod Manager → Create Pod** (ep1-s1), reused for **Assign pods** (ep4-s1) and
**Add team member** (ep4-s2) with minor framing differences noted inline:

1. **Two-panel layout**, matching the wireframe's structure:
   - **Available** (left): searchable roster of the org's known users, each row showing
     name + role chip (e.g. "Engineer", "Product Owner" — drawn from `role_definitions`).
     A filter/tab row above the list narrows by role ("All" / per-role tabs), mirroring
     the wireframe's chip row.
   - **Your team** (right): the running selection, grouped by role. The creator's own
     row is present and checked by default (cannot be removed) — the wireframe's
     "you're always included" pattern, matching this design's existing rule that the
     pod/feature creator is always a member.
2. **"Also save this team as a POD"** — a checkbox under the selection panel. This is
   not a separate feature bolted onto the picker; it **is** the picker's purpose for
   Epic 1 — checking it (implicitly always true for the ep1-s1 Create Pod flow, since
   that flow's entire point is to persist a pod) creates the `pods`/`pod_members`
   rows described in Data Model above.
3. **Gated primary action:** the "Create Pod" button is disabled until the selection
   has at least one member beyond the creator. Mirrors the wireframe's "Start" button
   gating ("Add at least one Engineer to continue") — adapted here to "at least one
   other member" rather than a specific role, since Pod composition is not
   role-constrained at creation time. Applies to ep1-s1's "Create Pod" button and
   ep4-s2's "Add team member" confirmation equivalently.
4. **ep4-s1 (Assign pods) reuses the same roster/selection pattern** at the pod level
   instead of the user level: "Available" lists the org's existing pods, "Your
   selection" is the pods assigned to the feature, with per-pod member removal
   available inline (the "remove Bob from Data Analytics Pod, for this feature only"
   case) — same two-panel structure, different unit of selection.

### Entry Point

A collaborator clicks a feature link or navigates to `/features/:id` in their browser. If they are not already authenticated, they log in via GitHub OAuth. The system resolves their `tenantId` from their GitHub org and their `userId` from their GitHub login.

### Primary Flow

1. **Load feature:**
   - Page displays the feature name, current stage, and a list of all stages
   - Default view shows only stages relevant to the user's role (product sees discovery–definition; engineer sees test-plan–coding)
   - A "Show all stages" toggle reveals the full pipeline
   - A presence panel in the sidebar shows "3 people working on this: You (Product), Sarah (Engineer), Dev (Architect)"

2. **Collaborate on a stage:**
   - User clicks a stage (e.g. discovery)
   - Page loads the artefact editor (markdown, same as single-user mode)
   - User edits; changes are saved every 30 seconds (auto-save)
   - If another user is also editing and saves, the user sees a notification: "Sarah edited the personas section — refresh to see her changes?" (non-blocking offer, not forced reload)
   - User can refresh to see merged result or continue editing their own section (both edits will be merged on final save)

3. **Sign off:**
   - When the user's role is marked as an approver for this stage, a "Sign off and advance" button appears at the bottom of the artefact editor
   - User clicks it; a modal appears: "You are about to approve the discovery and move to benefit-metric. Add a note for decisions.md?"
   - User types a note; clicks "Approve"
   - Record is created in `feature_approvals`; feature advances to next stage; decisions.md is updated
   - All collaborators see a notification: "Feature advanced to benefit-metric by Sarah (Engineer approver)"

4. **Request a regression:**
   - At any time, a collaborator can click "Go back to [earlier stage]" from the current stage view
   - A modal appears: "Why do you want to go back? (reason for decisions.md)"
   - User types a reason; clicks "Request regression"
   - Record is created in `decisions.md` with the regression reason; `pipeline-state.json` stage is reset; all collaborators are notified
   - The team can now edit the earlier stage again

### Edge Cases and Error States

**Concurrent edit conflict:**
If two users edit the same sentence in the same section at the same time, the three-way merge detects the conflict. When the second save completes, the merge result includes a conflict marker:

```
<<<<<<< User A
The target audience is product managers.
=======
The target audience is product managers and data analysts.
>>>>>>> User B
```

The next user to refresh sees this marker and is prompted to resolve it manually (pick one version, or combine them). This is rare in discovery; Phase 2 adds a UI to resolve conflicts without editing raw markdown.

**Approval race:**
Two approvers for the same role both try to approve the same stage at the same time. The server processes the first write; records the approval. The second write sees the stage already approved and shows: "This stage was already approved by [first approver] at [time]. You can re-approve if you want to override, or the feature will advance using the first approval."

**Offline user:**
If a collaborator's session times out or they close the browser, their presence row is deleted after 2 minutes of no heartbeat. Other collaborators see the presence disappear. If the user returns and re-opens the feature, they rejoin and their presence reappears.

**Edit while regressed:**
If a regression happens while a collaborator is still editing an earlier stage, the next time they save, the merge logic detects the regression and prompts: "This stage was regressed while you were editing. Your changes are still there, but they're now being merged against a version from before the regression. Review the merge?"

### Design System / Components

**Existing components used:**
- Artefact editor (same markdown editor from single-user mode)
- Modal for sign-off reason and regression reason (reuse from existing DoR flows)
- Sidebar presence panel (similar to Slack's presence indicator)
- Stage navigation (same stage-selector component as single-user mode, now with role-based filtering)

**New components:**
- Presence indicator (list of active users + their roles)
- Merge notification banner ("Sarah edited the personas section — refresh to see changes?")
- Conflict marker resolution UI (Phase 2; for MVP, users resolve raw markdown conflicts)
- Approval modal (sign-off reason input)
- Regression modal (reason input + confirmation)
- **Collaborator/Pod picker** (Amendment, 2026-09-14): two-panel roster + selection UI with role filtering and a gated primary action — see "Pod Creation / Collaborator Picker" above. Backs ep1-s1, ep4-s1, ep4-s2.

### Accessibility

All new interactive elements (presence panel, merge notification, approval button, regression button) must meet WCAG 2.1 AA standards:
- All buttons and modals are keyboard-navigable
- Presence list is announced via screen reader as a live region (collaborators joining/leaving are announced)
- Conflict markers are announced as alerts (not just visual)
- Colour is not the sole indicator of approval state (icon + label present)

---

## Key Decisions and Open Questions

### Decisions Made

1. **Server-side merge, not client-side:** All concurrent edits are merged on the server by a deterministic three-way merge algorithm, ensuring a single source of truth in Postgres and GitHub
2. **Line-based attribution:** Edit history tracks which lines came from which user, enabling audit trail and decisions.md linking
3. **Role-scoped visibility, not enforcement (MVP):** Client-side filtering shows stages relevant to a role by default; all stages remain accessible; access control is deferred to Phase 2
4. **Approval-based sign-off:** A designated approver for each stage role can sign off and advance; recorded in `feature_approvals` and decisions.md
5. **Reversibility via regression:** A team can regress to an earlier stage, re-edit, and re-approve; all actions logged in audit trail

### Open Questions / Deferred to Phase 2

1. **Conflict resolution UI:** MVP accepts raw markdown conflict markers; Phase 2 adds a UI to resolve conflicts without editing markdown directly
2. **Simultaneous approvals:** MVP has a simple "first to approve, second sees already-approved" flow; Phase 2 may add consensus/multi-approval workflows
3. **Real-time cursor positions:** MVP does not show "User A is editing line 5" cursors; Phase 2 may add this for smoother coordination
4. **Offline sync:** MVP assumes connectivity; Phase 2 may add local drafts with sync-on-reconnect
5. **Custom role definitions:** MVP hard-codes core roles (product, engineer, architect, designer, conductor); Phase 2 allows organisations to define custom roles
6. **Feature-level private/discoverable visibility** (Amendment, 2026-09-14): the reference wireframe includes a toggle — "Make this feature private... Leave off and anyone in the workspace can find and join it." This platform has no existing concept of workspace-wide feature discoverability at all today; every feature requires explicit collaborator assignment (this design's own model), so there is no "public" state to toggle away from. Adopting this would mean designing that broader discoverability model first — squarely Phase 2+, not a simple bolt-on to this MVP. Deferred; flagged for a future discovery pass if workspace-wide feature browsing becomes a real need.

### Assumptions Taken

1. **GitHub Contents API supports concurrent writes:** We assume GitHub's Last-Write-Wins semantics at the API level; our merge happens on the server before writing, so the final result is always deterministic (assumption verified: GitHub API write returns the commit; we control merge on server)
2. **Presence heartbeat is reliable enough:** We assume 30-second heartbeats will keep presence state accurate within ±60 seconds; Phase 2 may refine this if presence lag becomes noticeable
3. **Three-way merge is sufficient:** We assume line-based three-way merge will handle the vast majority of concurrent edits in discovery; true conflicts (same line edited by both) are rare enough to accept manual resolution in MVP

---

## Decisions and Rationale

| Decision | Rationale |
|----------|-----------|
| Server-side merge over client-side | Scalable to N collaborators; single source of truth for audit trail; deterministic; supports future enforcement layer |
| Line-based attribution | Enables precise audit trail; supports decisions.md linking; simpler than character-level tracking |
| Role-scoped visibility (client-side filter) | MVP speed; full access control deferred to Phase 2; no backend enforcement complexity in launch |
| Approval-based sign-off | Clear accountability; recorded in audit trail; aligns with existing DoR/DoD gate model |
| Regression via stage reset | Preserves audit trail; does not delete prior work; supports team reflection and re-decisions |
| Collaborator picker adopts the reference wireframe's structure (two-panel roster + selection, pre-included creator, gated primary action) | The wireframe already validated this structure against a real internal-tool pattern; reusing it avoids re-deriving a picker UX from scratch and keeps ep1-s1/ep4-s1/ep4-s2's own AC language ("navigates to Pod Manager", "click Create Pod", "add members... roles") consistent with an actual screen design |
| Feature-level private/discoverable visibility toggle deferred, not adopted | No existing workspace-wide discoverability model to toggle away from; would require its own discovery pass, not a fit for this MVP's scope |

---
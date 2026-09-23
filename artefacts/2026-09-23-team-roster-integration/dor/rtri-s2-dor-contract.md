# Contract Proposal — Wire pod-manager.html's member picker to the real roster

**Story:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s2.md
**Test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s2-test-plan.md
**Date:** 2026-09-24

---

## What will be built

- `pod-manager.html`'s inline script: replace `ORG_ROSTER` (hardcoded array) with a `fetch('/api/team/members')` call, made when `openModal()` runs, populating a new `realRoster` array (`[{identity, role}, ...]` — the shape `rtri-s1`'s endpoint returns).
- `renderRoster()` rewritten to render `realRoster` entries by `identity` (reusing `buildNameRoleSpan`'s existing safe-DOM-construction pattern, satisfying AC6) with no role chip (AC1) and no role-tab filtering effect on this panel (AC5's deferred-to-implementation treatment — decision recorded in this contract: **tabs are hidden for the "Available" panel** when driven by the real roster, since they have nothing meaningful to filter; the DOM elements are simply not rendered rather than rendered-disabled, the simplest option consistent with AC5's "never show a wrong/stale role" constraint).
- A new pod-role selector: when "Add" is clicked for a real-roster entry, a small inline `<select>` (populated from the existing `VALID_ROLES` constant) plus a "Confirm"/"Cancel" pair is shown in place of the row's "Add" button (no modal-within-modal — matches this picker's own existing minimal-UI bar). Confirming calls `addMember` with the selected role; cancelling reverts the row to its "Add" state with no side effects (AC7).
- `addMember(u)` unchanged in shape but now receives the selector-confirmed `roleId`, never `u.role` from the fetch response.
- `saveBtn.onclick`'s existing `fetch('/api/pods/create', ...)` call is unchanged — `selection` already carries the right `userId`/`roleId` shape regardless of whether entries came from `ORG_ROSTER` or the real roster.

## What will NOT be built

- No change to `POST /api/pods/create` or `pod-store.js`'s `createPod` — the write path already accepts arbitrary `userId`/`roleId` strings; real identities pass through unchanged (Architecture Constraints).
- No change to `ep4-s1`'s `feature-collaborator-store.js` — AC4 verifies this is unnecessary, not attempted.
- No role-editing after a member is added to "Your team" — explicitly Out of Scope (AC7's own scope boundary).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit: mocked `fetch` returns 2 real members; assert rendered rows show real identities, no `.role-chip` | Unit |
| AC2 | Integration: fake pool + full add/select-role/save flow; assert `pod_members.user_id`/`role_id` match real identity + selected role | Integration |
| AC3 | Unit: mocked `fetch` returns `{members: []}`; assert empty "Available" panel, no error | Unit |
| AC4 | Integration: pod created via AC2's fixture, then `ep4-s1`'s existing pod-assignment write path called directly; assert `feature_collaborators` matches | Integration |
| AC5 | Unit (role-tab, no-throw) + Integration (search-by-name against real identities) | Unit + Integration |
| AC6 | Unit: mocked `fetch` returns a payload identity string (`<img src=x onerror=alert(1)>`); assert no injected DOM element | Unit |
| AC7 | Unit (selector presented, confirmed value used, not roster's role) + Unit (cancel has no side effect) | Unit |

## Assumptions

- The real roster's `role` field (a team permission role) is fetched but deliberately never read into `roleId` — AC7's selector is the sole source. The contract test for AC7 deliberately uses a roster fixture whose `role` value is NOT a valid pod role (`admin`), so a bug that copies it through is caught rather than passing by coincidence.
- AC5's role-tab treatment for the "Available" panel: **hidden** (not disabled, not repurposed) when driven by real data — the simplest option satisfying the AC's hard constraint. Recorded here as the binding implementation decision per Run 3 review's LOW finding [3-L1] ("`/implementation-plan` must make and record this choice").
- `rtri-s1`'s endpoint (`GET /api/team/members`) is assumed complete and merged before this story's implementation begins (Dependencies: Upstream `rtri-s1`).

## Estimated touch points

**Files:** `src/web-ui/public/pod-manager.html`
**Services:** None
**APIs consumed:** `GET /api/team/members` (rtri-s1, read-only, no changes to it)

## Schema Dependencies

`schemaDepends: ["reviewStatus", "testPlan", "stage"]`

This story's DoR sign-off depends on `rtri-s1`'s pipeline-state entry showing `reviewStatus: "passed"` and `testPlan.status: "written"` before its own endpoint contract can be trusted as stable. These fields must remain in `pipeline-state.schema.json` with their current enum definitions.

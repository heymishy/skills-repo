## Test Plan: Admin has a real, reachable form to create a team invite

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s6-invite-creation-ui.md
**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | form renders with labelled email/role inputs and a real submit button | 1 test | — | — | — | — | 🟢 |
| AC2 | form POSTs to /api/team/invites with CSRF token and correct field names | 1 test | — | — | — | — | 🟢 |
| AC3 | non-admin/unauthenticated request rejected by requireAdmin | 1 test | — | — | — | — | 🟢 |
| AC4 | every input has an associated label; submit is a real button | 1 test | — | — | — | — | 🟢 |

**E2E / browser-layout detection (Step 3a):** Scanned all 4 ACs for CSS-layout-dependent language (drag-drop, pointer/click coordinates, `getBoundingClientRect`/`offsetTop`/`scrollTop`, on-screen-position checks, `e.target` identity from stacking, visual rendering). None triggered — every AC concerns DOM structure/attributes (labels, input types, button tag, form action/method, CSRF field presence), all verifiable via server-rendered HTML string inspection with no real browser or CSS layout computation needed. No E2E tooling gap applies to this story.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock `req`/`session`, matching every other story in this feature — this story reads no database state at all; it renders a static form and reuses `team-management.js`'s existing exported `VALID_ROLES` constant)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | Mock admin session (`tenantId`, `csrfToken`) | Mock req object | None | No pool/DB involved — this story's only new code is a `GET` route that renders static HTML from `VALID_ROLES` and a CSRF token |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### getCreateInviteForm_rendersLabelledFormWithRoleOptionsAndSubmitButton

- **Verifies:** AC1
- **Precondition:** Mock admin session with `tenantId`/`csrfToken`
- **Action:** Call the new `GET` route handler directly
- **Expected result:** Response HTML contains a `<label for="email">` paired with an `<input id="email" name="email">`, a `<label for="role">` paired with a `<select id="role" name="role">`, that `<select>` contains exactly the 4 `VALID_ROLES` values as `<option>` elements (not a hardcoded second list), and a `<button type="submit">`
- **Edge case:** No

### getCreateInviteForm_formPostsToApiTeamInvitesWithCsrfAndCorrectFieldNames

- **Verifies:** AC2
- **Precondition:** Same as above
- **Action:** Call the handler, inspect the rendered `<form>` tag and its embedded CSRF field
- **Expected result:** `<form method="POST" action="/api/team/invites">`, a `<input type="hidden" name="_csrf" value="...">` field matching `csrf.csrfField`'s own established output shape (`middleware/csrf.js`), and the email/role inputs use exactly `name="email"`/`name="role"` — the same field names `handleCreateInvite` (`wsi-s1`) already reads, no new request shape introduced
- **Edge case:** No

### getCreateInviteForm_nonAdminRejectedByRequireAdminGate

- **Verifies:** AC3
- **Precondition:** Real `server.js` source
- **Action:** Source-scan `server.js` for the new route's dispatch block (matching the established `check-d2`/`check-d4`/`wsi-s1`-precedent convention for testing `requireAdmin`-gated routes: block-level regex extraction + assertion, not a live server boot)
- **Expected result:** The new route calls `requireAdmin(req, res, () => { _raOk = true; })` the same standard way every other admin-facing route in `server.js` does — no route-specific bypass. Also updates the exhaustive `requireAdmin(` call-site count test(s) this feature already touched in `wsi-s1` (`check-d2-banner-exit-permission-visibility.js`, `check-d4-nfr-security-review-and-hardening.js`) — see Coding Agent Instructions note below.
- **Edge case:** Yes — this is the story's own explicit auth-boundary guarantee

### getCreateInviteForm_everyInputHasLabelSubmitIsRealButton

- **Verifies:** AC4
- **Precondition:** Same as AC1
- **Action:** Call the handler; for every `<input>`/`<select>` in the response HTML, resolve its `id` and confirm a `<label for="[id]">` exists referencing it; confirm the submit control is a literal `<button>` element, not a styled `<div>`, `<a>`, or `<span>` with a click handler
- **Expected result:** 100% of interactive form controls have a matching label; the submit control is a real, native button element — distinct assertions from AC1 (AC1 checks the form renders the right controls at all; AC4 checks the accessibility PAIRING between labels and controls specifically, which AC1 does not verify)
- **Edge case:** No

---

## Integration Tests

None — this story adds a single, self-contained `GET` route with no new integration seam; it does not modify `handleCreateInvite`'s own request/response contract (verified by AC2's assertion that field names are unchanged), so no cross-component handoff is introduced beyond what `wsi-s1`'s own test suite already covers for the `POST` side.

---

## NFR Tests

### getCreateInviteForm_noHardSlo_noAdditionalNfrTestNeeded

Not applicable as a distinct test — the story's own Performance NFR states "No hard SLO", and Security/Accessibility/Audit NFRs are already covered by AC2 (CSRF), AC3 (requireAdmin), and AC1/AC4 (accessibility) respectively. No separate NFR test exists beyond the 4 unit tests above — matching this story's own NFR section, which names no NFR beyond what the ACs already cover.

---

## Out of Scope for This Test Plan

- Testing `handleCreateInvite`'s own POST-handling behaviour — already fully covered by `wsi-s1`'s own test suite (`tests/check-wsi-s1-admin-creates-invite.js`); this plan only tests that the new form POSTs the right shape to it, not that the endpoint itself behaves correctly.
- The post-submission raw-JSON response experience (flagged as review finding `1-L3`, `wsi-s6-invite-creation-ui-review-1.md`) — a real, deliberately-accepted consequence of this story's own no-client-JS Architecture Constraint, not a behaviour this story's own ACs claim to test.
- Real browser keyboard-navigation walkthrough (tab order, focus ring visibility) — covered by the verification script's manual scenario, not automatable without E2E tooling this story doesn't require per the Step 3a scan above.

---

## Test Gaps and Risks

None identified as blocking.

**Coding Agent Instruction note (not a gap, a heads-up for `/implementation-plan`):** adding this story's new route will make `server.js`'s exhaustive `requireAdmin(` call-site count go from 13 to 14 — the same two hardcoded-count checklist tests `wsi-s1` already had to update once (`check-d2-banner-exit-permission-visibility.js`'s and `check-d4-nfr-security-review-and-hardening.js`'s own `T24`/`AC1` tests) will need updating again. Budget this as part of the implementation plan's own task list from the start, matching the lesson already captured from `wsi-s1`'s delivery.

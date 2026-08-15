## Story: Admin has a real, reachable form to create a team invite

**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Benefit-metric reference:** artefacts/2026-08-14-wuce-self-serve-invites/benefit-metric.md
**Domain:** [auth]

## User Story

As a **tenant admin**,
I want to **fill in a teammate's email and role on a real page in the product and submit it**,
So that **I can actually create a team invite without needing to know this feature has an API at all — today `wsi-s1` shipped only `POST /api/team/invites`, with no page that reaches it, so this capability is currently unusable by a real admin**.

## Benefit Linkage

**Metric moved:** Share of new teammates added via self-serve invite; Time from invite creation to invitee access
**How:** Both metrics require real invites to actually be created by real admins. `wsi-s1` built the mechanism but not a way to reach it — this story is what makes the mechanism usable, and is a hard blocker for either metric producing its first real signal.

## Architecture Constraints

- **Reuse `handleGetTeamMembers`'s exact established pattern** (`src/web-ui/routes/team-management.js`) for a minimal, functional form: native `<label>`+`<input>`/`<select>` pairs, a real `<button type="submit">`, `csrf.generateCsrfToken(req)` / `csrf.csrfField(csrfToken)` for the embedded CSRF token — matching `sec-perf-s3`'s established convention exactly. No new form-rendering pattern.
- **Role options come from `team-management.js`'s exported `VALID_ROLES`** — the exact same array `wsi-s1`'s own handler validates against server-side. Do not hardcode a second role list in the new form.
- **The form POSTs directly to `wsi-s1`'s existing `POST /api/team/invites`, unchanged.** This story adds a new `GET` route only (e.g. `GET /team/invites/new`, mounted behind `requireAdmin` exactly like every other admin-facing GET route in `server.js`). It does not modify `handleCreateInvite`'s request/response contract.
- **No client-side JS required.** `handleAddTeammate` (the sibling "add by identity" action) already accepts a plain HTML form POST and returns JSON with no special client-side handling — this story matches that same minimal bar, not a nicer UX than the sibling action already has. If a future story wants a redirect-and-flash-message experience for both actions, that is a separate, explicitly-scoped follow-up affecting both forms together, not introduced ad hoc here.

## Dependencies

- **Upstream:** `wsi-s1` (this story's form submits to that story's existing, unchanged endpoint — no wsi-s1 code changes required)
- **Downstream:** None within this epic. Unblocks real measurement for both of the epic's benefit metrics (`wsi-s1`'s own DoD, follow-up action #2).

## Acceptance Criteria

**AC1:** Given a tenant admin navigates to the new invite-creation page, When the page loads, Then it renders a real HTML form with a labelled email input and a labelled role `<select>` populated from `VALID_ROLES`, and a real, keyboard-focusable, keyboard-activatable `<button type="submit">`.

**AC2:** Given the admin fills in a valid email and selects a role and submits, When the form POSTs to `/api/team/invites`, Then the request includes a valid CSRF token (matching `sec-perf-s3`'s established `csrf.generateCsrfToken`/`csrf.csrfField` pair) and the exact `email`/`role` field names `handleCreateInvite` already expects — no new request shape is introduced.

**AC3:** Given a non-admin (or unauthenticated) request to the new `GET` route, When the request is made, Then it is rejected by the same `requireAdmin` gate every other admin-facing route in `server.js` already uses — no route-specific bypass.

**AC4:** Given the form is rendered, When inspected for accessibility, Then every input has an associated `<label for="...">`, and the submit control is a real `<button>` (not a styled `<div>` or link) — matching this story's own NFR and closing the gap identified in `wsi-s1`'s DoD (`dod/wsi-s1-dod.md`, Accessibility NFR finding).

## Out of Scope

- **Changing `handleCreateInvite`'s response shape or behaviour** — `wsi-s1`'s existing JSON success/error responses are unchanged; this story only makes the endpoint reachable via a real page.
- **A redirect-and-flash-message UX, or any client-side JS/AJAX submission handling** — matches the existing sibling "add teammate by identity" form's own established minimal bar (see Architecture Constraints).
- **Invite management (viewing, resending, revoking pending invites)** — matches the epic's own Out of Scope; this story is creation only.
- **Visual design/branding pass** — native, unstyled form controls are sufficient, matching `handleGetTeamMembers`'s own precedent.

## NFRs

- **Performance:** No hard SLO — a simple server-rendered page, matching `handleGetTeamMembers`'s own existing performance profile.
- **Security:** `requireAdmin`-gated (AC3); CSRF-protected (AC2); no new data is written by the `GET` route itself.
- **Accessibility:** Labelled inputs, real keyboard-accessible submit button (AC1, AC4) — this is the story's entire reason for existing, not an incidental NFR.
- **Audit:** None — this story adds no new write path; `wsi-s1`'s existing audit logging on `POST /api/team/invites` is unchanged and unaffected.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

# Contract Proposal: Admin has a real, reachable form to create a team invite

**What will be built:**
- A new `GET` route (e.g. `GET /team/invites/new`) in `src/web-ui/routes/team-management.js`, mounted behind `requireAdmin` in `server.js` exactly like every other admin-facing `GET` route.
- A new handler function returning a minimal, functional HTML form (native `<label>`+`<input>`/`<select>` pairs, a real `<button type="submit">`), following `handleGetTeamMembers`'s exact existing rendering pattern.
- Role `<option>` values sourced from `team-management.js`'s exported `VALID_ROLES` — no second, hardcoded list.
- A CSRF token embedded via the existing `csrf.generateCsrfToken(req)`/`csrf.csrfField(csrfToken)` pair.
- The form's `action`/`method`/field `name` attributes target `wsi-s1`'s existing `POST /api/team/invites` unchanged — `email`/`role` field names, no new request shape.

**What will NOT be built:**
- No changes to `handleCreateInvite`'s own request/response contract — the existing JSON success/error responses are untouched.
- No client-side JS, no AJAX submission handling, no redirect-and-flash-message UX — matches `handleAddTeammate`'s own existing minimal bar exactly.
- No invite-management UI (viewing, resending, revoking) — creation only.
- No visual design/branding pass — native, unstyled controls, matching `handleGetTeamMembers`'s own precedent.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: call the handler, assert labelled email input + role `<select>` populated from `VALID_ROLES` + real `<button type="submit">` in the rendered HTML | unit |
| AC2 | Unit test: assert `<form method="POST" action="/api/team/invites">`, a CSRF hidden field matching `csrf.csrfField`'s own shape, and `name="email"`/`name="role"` on the inputs | unit |
| AC3 | Unit test (source-scan): the new route block calls `requireAdmin` the same standard way every other gated route does — mirrors the established `check-d2`/`check-d4`/`wsi-s1` convention | unit |
| AC4 | Unit test: every `<input>`/`<select>` has a matching `<label for="[id]">`; the submit control is a real `<button>`, not a styled `<div>`/`<a>` | unit |

**Assumptions:**
- The exact `GET` route path (e.g. `/team/invites/new`) is an implementation choice, not fixed by the ACs.
- This story does not touch `wsi-s1`'s own code at all — it only adds a new, separate `GET` route and handler function.

**Estimated touch points:**
Files: `src/web-ui/routes/team-management.js` (new handler), `src/web-ui/server.js` (new route mount + `requireAdmin` call-site count bump 13→14, requiring the same two hardcoded-checklist test updates `wsi-s1` already made once: `tests/check-d2-banner-exit-permission-visibility.js`, `tests/check-d4-nfr-security-review-and-hardening.js`)
Services: None new — no database access in this story at all
APIs: None new — reuses `wsi-s1`'s existing `POST /api/team/invites` unchanged

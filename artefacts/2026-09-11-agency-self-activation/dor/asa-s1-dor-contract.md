# Contract Proposal — A standalone organisation's admin can self-activate it as an Agency

**Story:** `artefacts/2026-09-11-agency-self-activation/stories/asa-s1-standalone-org-can-self-activate-as-agency.md`
**Date:** 2026-09-11

---

**What will be built:**
A new `modules/organisations.js` function `activateOrganisationAsAgency(pool, orgId, logger)`, mirroring `convertOrganisationToStandalone`'s exact shape (single-statement atomic `UPDATE organisations SET org_type = 'agency' WHERE org_id = $1 AND org_type = 'standalone' RETURNING ...`, same audit-log call shape). A new route file `routes/org-activation.js` (mirroring `routes/org-conversion.js`'s structure) exposing `GET/POST /organisations/become-agency`, gated by the same admin-of-own-org check pattern (`modules/user-roles.js`'s `resolveRoleForPerson`, called directly).

**What will NOT be built:**
No reversal (agency → standalone). No platform-operator panel or bulk-activation mechanism. No change to any of `2026-07-30-agency-client-organisations`'s own 6 already-shipped stories. No billing/Stripe involvement.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `activateOrganisationAsAgency` flips a `standalone` org, returns updated row, logs the event | Unit |
| AC2 | `handlePostBecomeAgency`/`handleGetBecomeAgencyForm` reject a non-admin with 403, audit the denial | Unit |
| AC3 | `activateOrganisationAsAgency` returns `null` for already-`agency`/`client` orgs; route rejects with a "not eligible" error | Unit |
| AC4 | Unrelated `agency_client_relationships`/`shared_access_grants` rows unchanged after activation | Unit |
| AC5 | Activate, then call Story 3's existing `GET /agency/clients/new` handler with the same session — form renders, not rejected | Integration |

Plus a live post-deploy Chrome smoke check on staging (AC1, AC5) — same standard `jgls-s1` set earlier this session.

**Assumptions:**
- `modules/user-roles.js`'s `resolveRoleForPerson` and the `team_memberships` role model are correct and unchanged by this story — reused, not re-derived.
- No other code path relies on `org_type` transitioning only via the Create-Client flow (confirmed by the exhaustive grep that found this gap in the first place — no other write site exists).

**Estimated touch points:**
Files: `src/web-ui/modules/organisations.js` (one new function), `src/web-ui/routes/org-activation.js` (new file), `src/web-ui/server.js` (route wiring), `tests/` (new unit + integration test file(s)).
Services: None new.
APIs: One new route pair (`GET/POST /organisations/become-agency`).

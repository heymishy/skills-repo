# A standalone organisation's admin can self-activate it as an Agency — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add the missing precondition-setter that `2026-07-30-agency-client-organisations`'s own Story 1 named as Story 3's job but Story 3 never built: a self-service way for a `standalone` org's admin to activate their own org as `org_type='agency'`, mirroring the already-shipped, already-reviewed `org-conversion.js` pattern exactly.
**Branch:** `feature/asa-s1`
**Worktree:** `.worktrees/asa-s1`
**Test command:** `node tests/check-asa-s1-agency-self-activation.js` (new), `npm test` (full baseline)

---

## File map

```
Create:
  src/web-ui/routes/org-activation.js               — new route file
  tests/check-asa-s1-agency-self-activation.js       — 8 new tests (6 unit + 1 integration + 1 wiring)

Modify:
  src/web-ui/modules/organisations.js  — add activateOrganisationAsAgency()
  src/web-ui/server.js                 — wire the new route (require, handler declaration, instantiation, URL dispatch)
```

---

## Task 1: AC1/AC3/AC4 — activateOrganisationAsAgency(), mirroring convertOrganisationToStandalone exactly

**Files:**
- Modify: `src/web-ui/modules/organisations.js`

- [x] **Step 1: Write the failing test** — `activateOrganisationAsAgency-flips-standalone-org-in-place`, `activateOrganisationAsAgency-idempotent-safe-on-non-standalone`, `activateOrganisationAsAgency-does-not-touch-relationship-or-grant-tables`.
- [x] **Step 2: Run test — must fail** (function does not exist against unmodified code).
- [x] **Step 3: Write minimal implementation** — single-statement atomic `UPDATE organisations SET org_type = 'agency' WHERE org_id = $1 AND org_type = 'standalone' RETURNING ...`, same audit-log shape as `convertOrganisationToStandalone`.
- [x] **Step 4: Run test — must pass.**

## Task 2: AC2 — route handlers with server-side admin gate, mirroring org-conversion.js exactly

**Files:**
- Create: `src/web-ui/routes/org-activation.js`

- [x] **Step 1: Write the failing tests** — `handlePostBecomeAgency-rejects-non-admin`, `handleGetBecomeAgencyForm-rejects-non-admin`, `handlePostBecomeAgency-rejects-already-activated-org`.
- [x] **Step 2: Run test — must fail** (module does not exist).
- [x] **Step 3: Write minimal implementation** — `createOrgActivationHandlers(pool)` returning `{handleGetBecomeAgencyForm, handlePostBecomeAgency}`, admin gate via `modules/user-roles.js`'s `resolveRoleForPerson` (same call shape as `org-conversion.js`'s `_isAdminOfOwnOrg`), denials audited.
- [x] **Step 4: Run test — must pass.**

## Task 3: AC5 — wire into server.js, confirm the gap is actually closed end-to-end

**Files:**
- Modify: `src/web-ui/server.js`

- [x] **Step 1: Write the failing test** — `become-agency-then-create-client-flow-succeeds-end-to-end` (pre-activation: Story 3's own `GET /agency/clients/new` handler rejects the standalone org; activate; post-activation: the same handler, same session, now renders the real form), plus `serverWiresOrgActivationRoutes` (source-scan wiring regression, mirrors `check-story6`'s own convention).
- [x] **Step 2: Run test — must fail** (route not wired, or activation route doesn't exist).
- [x] **Step 3: Write minimal implementation** — require `org-activation.js`, declare `_orgActivationHandlers`, instantiate it alongside `_orgConversionHandlers` (same `_userRolesPool` reuse), register `GET/POST /organisations/become-agency` mirroring `/organisations/convert`'s exact dispatch shape.
- [x] **Step 4: Run test — must pass.**

## Task 4: Regression + full baseline

- [x] `node tests/check-asa-s1-agency-self-activation.js` — 8/8 passing
- [x] `node tests/check-story6-conversion-to-independent.js` — 13/13 passing (sibling pattern unaffected)
- [x] `node tests/check-story3-self-service-provisioning.js` — 18/18 passing (the flow this story unblocks, unaffected)
- [x] `npm test` — full baseline

## Task 5: Live smoke check (per test-plan's own stated standard)

- [ ] Re-verify on `wuce-staging.fly.dev` after this fix deploys: as a standalone org's admin, visit `/organisations/become-agency`, activate, then confirm `/agency/clients/new` now renders the real Create-Client form instead of the "only reachable by Agency-type organisations" rejection — the exact live reproduction that found this gap.

---

<!-- All 5 ACs covered across Tasks 1-3; Task 3's integration test is the
     direct proof this story closes the gap it exists to close. -->

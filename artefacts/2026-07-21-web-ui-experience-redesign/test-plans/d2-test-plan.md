## Test Plan: Persistent viewing-as banner, exit flow, and permission-scoped visibility

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d2-banner-exit-and-permission-scoped-visibility.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-d-admin-user-impersonation.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Persistent, undismissable banner on every page | — | 1 | 1 | — | CSS-layout-dependent | 🔴 |
| AC2 | Non-admin target hides all admin surfaces | 1 | 1 | — | — | — | 🔴 |
| AC3 | Admin target shows admin surfaces accurately | 1 | 1 | — | — | — | 🔴 |
| AC4 | Exit reverts fully, no residual state | — | 1 | 1 | — | — | 🔴 |
| AC5 | Session expiry doesn't leave ambiguous state | — | 1 | — | — | — | 🟡 |

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Banner visually persists across real page navigations | AC1 | CSS-layout-dependent | Confirming the banner is rendered by the shell on every real page (not just the ones a unit test happens to check) requires navigating a real running app across multiple routes | E2E test (Playwright) navigating to at least 3 different real routes while impersonating, confirming the banner is present on all of them |

## Test Data Strategy

**Source:** Mixed — synthetic session fixtures (admin, admin-impersonating-non-admin, admin-impersonating-admin) for unit/integration; a real running dev server for E2E.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC5 | Fixture sessions in each of the 3 states above | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond AC1's noted CSS-layout-dependent handling.

---

## Unit Tests

### An impersonated non-admin session hides Admin credits nav and Credits/Impersonate settings tabs
- **Verifies:** AC2
- **Precondition:** Session with real role `admin`, `impersonating: { role: 'user', ... }`
- **Action:** Render sidebar and Settings page
- **Expected result:** No admin-only element present anywhere — the check reads the impersonated (effective) role, confirmed by asserting the render function is never passed the *real* admin role for these checks

### An impersonated admin session shows admin surfaces accurately
- **Verifies:** AC3
- **Precondition:** Session with real role `admin`, `impersonating: { role: 'admin', ... }`
- **Action:** Render
- **Expected result:** Admin-only elements ARE present — confirming this isn't a blanket "always hide while impersonating" rule

---

## Integration Tests

### Banner renders via the shared shell, not per-route opt-in
- **Verifies:** AC1
- **Components involved:** `html-shell.js`'s `renderShell`, at least 2 different route handlers that both call it
- **Precondition:** An active impersonation session
- **Action:** Render two different pages via their real handlers
- **Expected result:** Both include the banner markup — confirming it comes from the shell itself, not something each route handler must remember to add

### Exit fully reverts session state with no residual target data
- **Verifies:** AC4
- **Components involved:** exit-impersonation function, session store
- **Precondition:** An active impersonation session with target-specific data cached anywhere in the session
- **Action:** Call exit
- **Expected result:** Session's `tenantId`/`login`/`role` match the real admin exactly; no key related to the target user remains in the session object

### Session expiry during impersonation returns to signed-out, not a half-state
- **Verifies:** AC5
- **Components involved:** session middleware, expiry handling
- **Precondition:** An active impersonation session that then expires
- **Action:** Make a request after expiry
- **Expected result:** Treated as a normal signed-out request (redirect to sign-in) — not an error, not a session showing partial/inconsistent impersonation state

---

## E2E Tests

### Banner is visible across real page navigations and Exit works
- **Verifies:** AC1, AC4
- **Tool:** Playwright
- **Precondition:** Dev server running, real admin session
- **Action:** Start impersonating a test user, navigate to 3 different pages (e.g. Home, a product view, Settings), then click Exit
- **Expected result:** Banner is visible with the correct target name on all 3 pages; after Exit, the banner disappears and the sidebar reflects the real admin's own permissions again

---

## NFR Tests

### Effective-role check applies to every existing admin-gated route, not only the new ones
- **NFR addressed:** Security
- **Measurement method:** Enumerate every route currently gated by `requireAdmin` (via a repo-wide grep) and confirm each one is included in this story's effective-role audit
- **Pass threshold:** 100% of existing `requireAdmin`-gated routes confirmed
- **Tool:** Manual grep + checklist, feeding directly into D4's dedicated review

---

## Out of Scope for This Test Plan

- Starting/ending the session itself — D1's test plan.
- The audit log's own storage/viewing — D3's test plan.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Banner persistence across ALL real routes (not just the 3 sampled in E2E) | Exhaustively testing every route is impractical | D4's NFR-security review explicitly re-audits every admin-gated route as part of its own AC1, providing the exhaustive check this test plan samples |

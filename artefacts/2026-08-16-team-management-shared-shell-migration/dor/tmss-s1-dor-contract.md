# DoR Contract: Migrate team-management admin pages onto the shared HTML shell

**Story reference:** artefacts/2026-08-16-team-management-shared-shell-migration/stories/tmss-s1-migrate-to-shared-shell.md
**Test plan reference:** artefacts/2026-08-16-team-management-shared-shell-migration/test-plans/tmss-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/web-ui/routes/team-management.js`: require `html-shell.js` (`../utils/html-shell`), destructuring or accessing its exported `renderShell` and `escHtml`.
2. `handleGetTeamMembers`: keep building the same form-field HTML as `bodyContent` (identity input, role select, submit button — unchanged `id`/`name`/`type`), but replace the current hand-built `<!DOCTYPE html>...` wrapper with a call to `renderShell({ title: 'Team members', bodyContent, user: req.session, active: 'team-members', crumbs: ['Team members'], isAdmin: true })`. Every `_escapeHtml(...)` call site in this handler is replaced with `escHtml(...)`.
3. `handleGetCreateInviteForm`: same pattern — keep the existing form-field HTML (email input, role select, submit button, unchanged) as `bodyContent`, call `renderShell({ title: 'Invite a teammate', bodyContent, user: req.session, active: 'team-members', crumbs: ['Team members', 'Invite a teammate'], isAdmin: true })`. Every `_escapeHtml(...)` call site replaced with `escHtml(...)`.
4. Delete the locally-defined `_escapeHtml` function from `team-management.js` entirely — no remaining references.
5. New test file `tests/check-tmss-s1-shared-shell-migration.js` covering all 4 ACs per the test plan.

**What will NOT be built:**
- No change to `handleAddTeammate` or `handleCreateInvite` (the POST handlers) — their request/response contracts remain byte-for-byte unchanged, explicitly out of scope per the story's Out of Scope section.
- No new entry added to `html-shell.js`'s `NAV_ITEMS` — `active: 'team-members'` will not highlight any current sidebar item; this is expected, unchanged behaviour, not a regression.
- No change to `csrf.generateCsrfToken`/`csrf.csrfField`'s own implementation — only where their output is embedded (inside `bodyContent`, same as before).
- No change to `VALID_ROLES` or role-validation logic.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (`/team/members` via shared shell) | Unit test: call `handleGetTeamMembers` directly, assert on shell markup (`class="sw-app"`, `id="sw-sidebar"`, `class="sw-main"`) and unchanged form field attributes | unit |
| AC2 (`/team/invites/new` via shared shell) | Unit test: same pattern for `handleGetCreateInviteForm`, plus assert unchanged POST target | unit |
| AC3 (`_escapeHtml` removed, no escaping regression) | Unit test: source-scan for absence of `_escapeHtml` definition; render with a `"`-containing CSRF token double and assert `&quot;` appears in output | unit |
| AC4 (CSRF field unchanged) | Unit test: assert both responses contain a hidden `_csrf` input with a non-empty value | unit |

**Assumptions:**
- `html-shell.js`'s `renderShell()` and `escHtml()` are stable, already-proven exports (used by `dashboard.js`, `settings.js`, `admin-credits.js`, `admin-mock-gateway.js`, and others) — no changes to `html-shell.js` itself are needed or in scope.
- `req.session` always has a `login` field available at the point these admin-gated handlers run, consistent with every other `renderShell()` call site in the app (`requireAdmin` has already run by the time these handlers execute, per `server.js`'s mount-time gating).
- No test double is needed for `VALID_ROLES` — it is a real, already-exported, non-user-supplied constant, so it does not need coverage under AC3's escaping-regression check (only genuinely dynamic/user-influenced strings — here, the CSRF token — need that check).

**Estimated touch points:**
Files: `src/web-ui/routes/team-management.js` (modified), `tests/check-tmss-s1-shared-shell-migration.js` (new).
Services: None.
APIs: None — no new routes, no changed request/response shape for either POST endpoint.

---

## Contract Review

Reviewed against all 4 ACs and the test plan. No mismatches found — every AC has a proposed implementation approach and a specific, matching test type (unit). No AC requires an observable behaviour that the proposed unit-test approach cannot verify.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

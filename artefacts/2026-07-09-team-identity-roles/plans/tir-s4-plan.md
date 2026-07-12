## Implementation Plan: tir-s4 — The admin/credits panel is gated by per-person role, not tenant membership

**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s4.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s4-role-gated-credits-panel-test-plan.md
**DoR contract:** artefacts/2026-07-09-team-identity-roles/dor/tir-s4-dor-contract.md

---

### Ground-truth check (before any code)

Read the actual shipped `src/web-ui/modules/user-roles.js`, `routes/auth.js`, `routes/auth-email.js`, `server.js`, and `middleware/require-admin.js` on `origin/master` (tir-s1 PR #463, tir-s2 PR #464 merged). Findings:

1. `require-admin.js`'s existing check — `!req.session || !req.session.userId || req.session.role !== 'admin'` — is already fail-closed by construction: a strict `!==` comparison denies any value that is not exactly the string `'admin'`, including `undefined`, `null`, missing session, or any object/array. No change is needed to the comparison logic itself to satisfy AC1/AC2/AC3/AC4, provided `req.session.role` is correctly the requesting person's own role.
2. **Flagged gap (judgment call, out of scope for this story):** at login time, `getRoleForTenant(tenantId)` → `resolveRoleForTenant(pool, tenantId)` resolves role via `SELECT role FROM team_memberships WHERE tenant_id = $1 LIMIT 1` — with no `person_id`/identity filter at all. For a solo tenant (`tenantId` = the person's own unique login/sub/email) this is correct by construction, since only one `team_memberships` row can exist for that `tenant_id`. But for a genuinely shared tenant (`TENANT_ORG_ALLOWLIST` configured, multiple people sharing one org-based `tenantId`), this query cannot distinguish which person is logging in — it returns an arbitrary row for that `tenant_id`. This is a real residual gap from tir-s1, not something this story's DoR contract authorizes touching (contract limits touch points to `require-admin.js` + `admin-credits.js`; fixing it would require rewiring the login call sites in `auth.js`/`auth-email.js` plus a real identity→person_id lookup, which doesn't exist yet outside tir-s2's account-linking flow). This story's own test plan sidesteps the gap by constructing `req.session` fixtures directly against `requireAdmin` rather than exercising the real login flow — matching its stated Test Data Strategy ("seeded directly ... no need for tir-s3's actual UI"). Flagging via PR description per the DoR's own instruction ("If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity").

Given (1), the required code change is narrow: no change to the access-control comparison itself, but the NFR-Audit requirement (denied attempts logged with person ID, tenant ID, timestamp) is **not currently implemented** — `require-admin.js` has zero logging today. That is the one real gap this story must close in-scope.

---

### Tasks

1. **RED — write the failing test file** `tests/check-tir-s4-role-gated-credits-panel.js` (5 tests: AC1 non-admin denied, AC2 admin granted, AC3 solo-tenant regression, AC4 fail-closed on ambiguous/missing role, NFR-Audit denial logging). Confirm the audit-logging test fails for the right reason (no logger call happens today); confirm the other 4 already pass against the untouched file (they exercise pre-existing, already-correct behaviour) — expected, not a RED-phase problem, since the only NEW behaviour is the audit log.
2. **GREEN — add an injectable audit logger to `require-admin.js`** (`setLogger`/internal `_logger`, default a safe no-op — NOT a D37 throw-on-unwired adapter, since a logging failure must never alter or block the access-control decision itself; mirrors the existing precedent in `routes/auth.js`'s `_logger`). Call `_logger.warn('admin_access_denied', { personId, tenantId, timestamp })` on every denial branch.
3. **Verify `admin-credits.js`** — confirm it has no independent role check that could diverge from `requireAdmin` (it doesn't; it's mounted behind the middleware in `server.js`). No code change expected; verification only, per the DoR contract.
4. **Full regression check** — `node scripts/run-all-tests.js`, diffed against a pre-change baseline captured in this worktree before any edits, and against `tests/known-baseline-failures.json`. Special attention to `check-arl-s2-admin-middleware.js` (T4–T7 exercise `requireAdmin` directly with no `setLogger` call, so the default no-op logger must leave status codes/response bodies byte-identical).
5. **/verify-completion** — confirm all 4 ACs + audit NFR verified, 5/5 new tests passing, 0 regressions.
6. **/branch-complete** — push, open draft PR with the flagged gap from finding (2) called out explicitly in the PR description, stop (no merge).

---

### Touch points

- `src/web-ui/middleware/require-admin.js` (add injectable logger + denial-logging calls)
- `tests/check-tir-s4-role-gated-credits-panel.js` (new)
- `src/web-ui/routes/admin-credits.js` — verification only, no change

### Out of scope (unchanged from story)

- Gating any UI surface beyond the admin/credits panel.
- Changing what an admin can do inside the panel.
- Fixing the flagged login-time per-person role resolution gap (finding 2 above) — that is a pre-existing tir-s1 gap, not this story's authorized scope; raised as a PR-description note, not silently fixed or silently dropped.

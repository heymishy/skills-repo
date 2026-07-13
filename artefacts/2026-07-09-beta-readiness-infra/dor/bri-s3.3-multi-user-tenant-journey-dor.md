# Definition of Ready: Multi-user within one tenant journey spec (bri-s3.3)

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.3-multi-user-tenant-journey-test-plan.md
**Verification script reference:** artefacts/2026-07-09-beta-readiness-infra/verification-scripts/bri-s3.3-multi-user-tenant-journey-verification.md
**Review artefact:** artefacts/2026-07-09-beta-readiness-infra/review/bri-s3.3-review-2.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.3-multi-user-tenant-journey-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-13 (re-run — supersedes the 2026-07-10 BLOCKED run)

---

## ⚠️ Read this first

This is the **re-run** triggered by the revisit trigger recorded in `decisions.md` (2026-07-09 RISK-ACCEPT entry): "When `2026-07-09-team-identity-roles` reaches definition-of-ready, re-verify bri-s3.3's ACs against the feature's final role list/schema before this story proceeds past implementation."

**That trigger condition is satisfied, and exceeded** — `2026-07-09-team-identity-roles` (TIR, the "team-identity-roles" feature) is fully `/definition-of-done` complete: all 8 stories (tir-s1 through tir-s8) have `dodStatus: complete`, per `.github/pipeline-state.json` and `artefacts/2026-07-09-team-identity-roles/dod/SUMMARY.md`. This is stronger than the DoR threshold the original gate required.

**However, re-verifying AC1–AC3 against the ACTUAL shipped code (not the speculative shape the story was written against) surfaces a new, independent, and more concrete finding: AC1–AC3 cannot currently be implemented as real, browser-driven, production-reachable E2E tests.** This is not the same blocker as before — the role model itself is confirmed correct — but a defect in how login/session state connects to that role model when two distinct people are actually involved. Full analysis below. **This DoR run's determination is BLOCKED, for a new reason.**

---

## Part 1 — Re-verification of AC1–AC3 against the real shipped role model

### What the story assumed (2026-07-09)

AC1–AC3 assume: (a) a 4-role model — admin/engineer/product/viewer; (b) a many-to-many person↔team schema; (c) that "two people in the same tenant with different roles" is a real state reachable by two people each independently logging in through the app's normal auth flow, such that a browser-driven Playwright spec can exercise it.

### What actually shipped (verified by reading source, not by trusting TIR's own passing tests)

**(a) and (b) hold.** Confirmed directly in code:
- `src/web-ui/modules/team-management.js` line 26: `var VALID_ROLES = ['admin', 'engineer', 'product', 'viewer'];` — exact match to the story's assumption.
- `src/web-ui/modules/user-roles.js` (tir-s1/tir-s7): `people` + `team_memberships (person_id, tenant_id, role)` schema exists, with `resolveRoleForPerson(pool, identityKey, tenantId)` as the person-scoped lookup.
- `src/web-ui/middleware/require-admin.js` (tir-s4): `requireAdmin` gates `admin-credits.js` on `req.session.role === 'admin'`, fail-closed.

**(c) does NOT hold in production, for any of the 3 auth providers, in a way a genuine browser-driven test can exercise.** Traced the full session/role chain from login through role resolution (`src/web-ui/routes/auth.js`, `src/web-ui/routes/auth-email.js`, `src/web-ui/server.js` wiring, `src/web-ui/modules/user-roles.js`, `src/web-ui/modules/identity-links.js`):

1. **Google OAuth** (`auth.js` `handleAuthGoogleCallback`, line 296): `req.session.tenantId = userInfo.sub` — always the person's own, unique Google subject ID. Two different Google accounts can never share a `tenantId`.
2. **Email/password** (`auth-email.js`, signup and login): `req.session.tenantId = email` — always the person's own, unique email. Confirmed no allowlist/invite branch exists anywhere in the file. Two different email accounts can never share a `tenantId` (this matches the existing convention already documented in `tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js`'s own comment: "each new email is its own tenant").
3. **GitHub OAuth without `TENANT_ORG_ALLOWLIST`** (`auth.js` line 194): `req.session.tenantId = user.login` — again per-person-unique.
4. **GitHub OAuth WITH `TENANT_ORG_ALLOWLIST`** (`auth.js` line 182, `resolveTenant()`): this is the **only** production path where two different people's sessions can land on the same `tenantId` — `resolveTenant` returns the matched org name, shared by every member of that GitHub org.

So a shared tenant is only reachable via GitHub-org-allowlist mode. But two further problems block AC1–AC3 even there:

**Problem A — this mechanism is explicitly not the intended team-membership model.** `artefacts/2026-07-09-team-identity-roles/decisions.md` (2026-07-09, SCOPE): "Team membership is a first-class concept, independent of auth provider... GitHub org membership is retained only as a one-time bulk-add convenience at team setup, not the underlying team-membership model." Option A (org-as-tenant) was considered and rejected specifically because it excludes Google/email-based team members. Building bri-s3.3's core journey around the rejected mechanism would test a path TIR's own decision log says is not the real feature.

**Problem B — even using GitHub-org-allowlist mode, per-person role differentiation is broken.** The production wiring in `src/web-ui/server.js` (lines 282–284):
```js
setGetRoleForTenant(function(tenantId) {
  return resolveRoleForPerson(_userRolesPool, tenantId, tenantId);
});
```
passes `tenantId` as **both** the `identityKey` and `tenantId` arguments to `resolveRoleForPerson`. The only caller (`auth.js`/`auth-email.js`) only ever has `req.session.tenantId` available at this call site — never the authenticating person's own distinct login/sub/email separately from the (possibly-shared) tenant identifier. In non-allowlist mode this is harmless because `tenantId === identityKey` is already true by construction (each person is their own tenant). In allowlist mode it is not: `identityKey` becomes the **org name**, shared by every member.

Tracing `resolvePersonForIdentity(pool, identityKey)` (`src/web-ui/modules/identity-links.js` lines 82–90) with `identityKey = <org name>`: it checks `person_identities WHERE identity_key = $1` (no match — that table is keyed by real provider identities, never org names), then falls back to `SELECT person_id FROM team_memberships WHERE tenant_id = $1` with **no `ORDER BY` or `LIMIT` guarantee**, returning `rows[0]` — an arbitrary member of the org, not the actual logged-in individual.

This reproduces, one layer removed, the exact bug tir-s7 (PR #467) was built to fix ("login resolves an arbitrary row's role for whoever logs in, not their own"). tir-s7's own test file (`tests/check-tir-s7-person-scoped-login-resolution.js`, lines 140–177) only ever calls `resolveRoleForPerson` directly with genuinely distinct `identityKey` values (e.g. `'person-y@example.com'` vs `'person-x@example.com'`, both distinct from the shared `tenantId` `'acme'`) — proving the underlying function is correct when given real per-person identity. But its wiring test (T5, AC5, lines 213–259) only checks — via string matching on `server.js`'s source — that `setGetRoleForTenant`'s wiring calls `resolveRoleForPerson` instead of the old bare `resolveRoleForTenant`. It never asserts that the wiring passes a genuinely person-distinguishing argument, and the actual wiring passes `tenantId` twice. This is precisely the class of gap this repo's `CLAUDE.md` now documents under "Injectable adapter rule (D37)" point 4 — a wiring test that proves wiring occurred, not that the wired behaviour is correct — except here it slipped past the *both instances* pattern (previously found for tir-s1→tir-s7 itself) a second time, one call site removed.

**Consequence for `team-management.js`'s `addOrUpdateTeammate` (tir-s3):** for Google and email/password tenants, the `team_memberships` row it writes (keyed to the admin's own `tenantId`) is **permanently unreachable** by the added teammate's own login — their `tenantId` will always be their own identity, never the admin's. The "add teammate" feature is a no-op in production for 2 of the app's 3 auth providers. For GitHub-org-allowlist tenants, the row is reachable, but per Problem B above, role resolution for it is not reliably correct once 2+ people share that tenant.

### Conclusion on AC1–AC3

**AC1–AC3, as written, do not hold against the real shipped role model — not because the role list is wrong, but because "two people in the same tenant with per-person-differentiated roles" is not a state a real, browser-driven login flow can currently reach and correctly exercise, for any of the app's 3 auth providers.** A Playwright spec that tried to implement AC1–AC3 today would have to either (a) directly inject/forge session state rather than drive two independent people through real signup/login (which contradicts AC1's and AC3's own framing: "proving... within one tenant... under an actual browser-driven attempt, not just a unit-test assertion"), or (b) use GitHub-org-allowlist mode, which is both the explicitly-rejected underlying model per TIR's own decision log AND currently produces incorrect (arbitrary-member) role resolution once actually exercised with 2+ real people — meaning the spec would either fail honestly (correctly catching the real defect) or the coding agent would be tempted to write a materially misleading "passing" test that doesn't reflect real behaviour.

**AC4 is unaffected** — it only requires the spec file to be tagged and to use S3.1's mock gateway with zero real LLM calls, independent of the role-model question.

---

## Part 2 — What this means for the DoR determination

This is not a re-statement of the original blocker (waiting on TIR to reach DoR) — that condition is resolved. This is a **new, independent, and more concrete finding**, discovered only by reading TIR's actual shipped code end-to-end rather than trusting its story text or its own tests' pass/fail status (per this repo's `CLAUDE.md` mock-shape-verification and D37 standards, and consistent with how tir-s7/tir-s8 themselves were caught in the same epic).

**This DoR run does not fabricate a pass.** Per the operator's explicit instruction for this run: if AC1–AC3 genuinely do not hold, stop and report rather than force `Proceed: Yes`.

---

## Hard Blocks (re-run against current state)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Unchanged from prior run |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs (AC1–AC4) |
| H3 | Every AC has at least one test in the test plan | ✅ | Test blocks exist for all 4 ACs |
| H4 | Out-of-scope section is populated | ✅ | Unchanged |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 4 — Risk-critical journeys have deterministic E2E coverage |
| H6 | Complexity is rated | ✅ | Rating 3, Scope stability Unstable (both should be revisited — see Recommendation) |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2 (2026-07-09) — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ⚠️ | The test plan's declared gap ("External-dependency — waiting on team-identity-roles' schema") is now factually stale — the schema exists. The real gap (login/role-wiring defect, Part 1 above) is not yet reflected in the test plan. |
| H8-ext | Cross-story schema dependency check | ✅ (resolved, differently) | `2026-07-09-team-identity-roles` is DoD-complete, not merely DoR — the schema dependency itself is fully resolved. The NEW gap is a different one (login-flow wiring), not a schema-existence gap. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025 stretch-citation MEDIUM finding already resolved via RISK-ACCEPT (decisions.md, 2026-07-10) |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT blocks sign-off | ✅ | Not a CSS-layout gap — see Part 1 |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | Unchanged |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Unchanged |
| H-GOV | Governance approval check | ✅ | Unchanged |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | This story introduces no new adapter itself — but see Part 1 for a D37-relevant finding in the *upstream* TIR feature's existing adapter, surfaced by this re-verification |
| H-INF / H-MIG | N/A | N/A | Unchanged |

**H8 fails on updated terms.** The test plan's coverage-gap table describes a gap that no longer exists (schema absence) and omits the gap that does exist (login/session wiring cannot reach a shared-tenant, per-person-differentiated-role state). The test plan needs a revision pass before this story is re-submitted — not a full rewrite, since AC1–AC4 themselves are still the right shape, but the "Declared gap notice," "Coverage gaps," and "Test Gaps and Risks" sections need to describe the real blocker.

---

## READY / BLOCKED determination

## ❌ BLOCKED — new finding: no production-reachable multi-person-shared-tenant path with correct per-person role resolution exists yet

This is **not** the same block as the 2026-07-10 run. The upstream dependency (`2026-07-09-team-identity-roles` reaching at least DoR) is fully satisfied — that feature is DoD-complete. Re-verifying AC1–AC3 against the real shipped code, rather than assuming the schema's existence was sufficient, surfaced a concrete defect: the login-time role-resolution wiring (`server.js` → `getRoleForTenant` → `resolveRoleForPerson`) cannot distinguish between different people sharing a tenant, because it is only ever called with the tenant identifier, never the authenticating person's own distinct identity. Combined with the fact that only GitHub-org-allowlist mode produces a shared tenant at all (and that mode is explicitly not TIR's intended underlying model per its own decision log), there is currently no way to implement AC1–AC3 as genuine, browser-driven, production-reachable E2E assertions.

**What this means in practice:**
- This is very likely a real production defect in the shipped `team-identity-roles` feature (specifically: `addOrUpdateTeammate`'s written membership is unreachable for 2 of 3 auth providers; and the `getRoleForTenant`/`resolveRoleForPerson` wiring degrades to arbitrary-row resolution once GitHub-org-allowlist mode is combined with a shared tenant of 2+ people) — not a defect in bri-s3.3's own story writing.
- bri-s3.3 cannot be assigned for full implementation of AC1–AC3 until either: (a) team-identity-roles ships a follow-up fix-forward story that routes an added teammate's login into the admin's tenant (for all 3 providers, or an explicit decision to scope multi-person tenants to GitHub-org-allowlist only) and fixes the `getRoleForTenant` signature/wiring to pass the authenticating person's own identity (not the tenant identifier) into `resolveRoleForPerson`; or (b) the operator makes an explicit RISK-ACCEPT decision to test this via a documented non-browser-driven mechanism (e.g. direct session/cookie injection in the Playwright spec, clearly labelled as not a real login), understanding this would materially weaken AC1's and AC3's own "not just a unit-test assertion" framing.
- **AC4 alone is not blocked** and could proceed as a narrow slice if desired (same option the prior DoR run offered), but the operator's brief for this run was full AC1–AC4 scope contingent on the block clearing — it has not cleared, so this option is offered but not exercised here.

**Recommendation:** file this finding as a fix-forward story candidate against `2026-07-09-team-identity-roles` (a `tir-s9` in that epic, mirroring the tir-s7/tir-s8 fix-forward pattern already used twice in that epic), then re-run `/definition-of-ready` on bri-s3.3 once that lands. Do not implement bri-s3.3 AC1–AC3 in the meantime.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: No — blocked on a newly-discovered production defect in the upstream
2026-07-09-team-identity-roles feature (login/session role-resolution wiring
cannot correctly differentiate between people sharing a tenant; see
dor/bri-s3.3-multi-user-tenant-journey-dor.md Part 1 for full analysis).

Story: Multi-user within one tenant journey spec — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.3-multi-user-tenant-journey-test-plan.md

Do NOT assign this story for full implementation of AC1-AC3. The 4-role
model (admin/engineer/product/viewer) and the people/team_memberships
schema are confirmed correct and present. The blocker is that no auth
provider (GitHub without org-allowlist, Google, email/password) produces a
shared tenantId for two distinct people, and the one path that does
(GitHub + TENANT_ORG_ALLOWLIST) both (a) is explicitly NOT the intended
underlying team-membership model per team-identity-roles' own decisions.md,
and (b) has a real wiring defect (server.js's setGetRoleForTenant passes
tenantId as both the identityKey and tenantId arguments to
resolveRoleForPerson, so resolvePersonForIdentity cannot distinguish
between people sharing that tenant and falls through to an unordered,
LIMIT-less query returning an arbitrary member).

If the operator explicitly chooses to proceed with the narrow unblocked
slice only:
- Scope is limited to: the spec file skeleton
  (tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js) plus AC4 (tag
  verification + zero-real-LLM-calls check) only.
- AC1-AC3 test blocks may be written but MUST be left in a skipped/pending
  state (test.skip / test.fixme) with a comment referencing this DoR's
  Part 1 finding — do not fabricate a passing implementation via
  non-browser-driven session injection without an explicit RISK-ACCEPT
  from the operator first.
- Do not attempt to "fix" the team-identity-roles wiring defect as part of
  this story — that belongs to a fix-forward story in that feature
  (recommended: tir-s9).

Full re-dispatch instruction: once a team-identity-roles fix-forward story
ships (routing a teammate's login into the shared tenant for the intended
provider set, and fixing the getRoleForTenant/resolveRoleForPerson wiring
to pass the authenticating person's own identity), re-run
/definition-of-ready on bri-s3.3 before any full-scope implementation
begins.

Oversight level: Medium (applies once unblocked and reassessed)
```

---

## Sign-off

**Oversight level:** Medium (moot pending unblock)
**Sign-off required:** No formal sign-off required for the BLOCKED determination itself; re-run `/definition-of-ready` once the team-identity-roles fix-forward lands.
**Signed off by:** Not applicable — story is BLOCKED, not assigned

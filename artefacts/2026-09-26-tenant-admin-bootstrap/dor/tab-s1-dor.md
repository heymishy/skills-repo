# Definition of Ready: Bootstrap a brand-new tenant's first admin automatically on login

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
**Test plan reference:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md
**Contract:** artefacts/2026-09-26-tenant-admin-bootstrap/dor/tab-s1-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-28

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs; each has a concrete, correctly-typed test approach; the plain-`pool`-parameter design choice (not an injectable adapter) is consistent with this codebase's own established convention for identical-shaped functions (`addOrUpdateTeammate`, `listTeamMembers`, `backfillIdentityIfNeeded`).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "developer/engineer signing up for the first time on a brand-new tenant" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | 9/9 tests, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ | "Time-to-admin for a brand-new solo signup" |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 5 items; review Category E score 3/PASS |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — backend-only story |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-26-tenant-admin-bootstrap/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence (B1) | ✅ | Story NFRs populated, profile exists |
| H-GOV | Approved By ≥1 non-engineering entry | ✅ | "Hamish King — Platform Owner — 2026-09-28" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | Plain `pool` parameter, not a `setX()` adapter — matches `addOrUpdateTeammate`/`listTeamMembers`/`backfillIdentityIfNeeded` convention |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set (this story, unlike `tab-s2`, is not migration-typed) |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | No MEDIUM findings remain after Run 2 | — |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Script may not perfectly reflect real-world usage nuance | Hamish King, 2026-09-28 — logged in decisions.md |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table: None | — |

---

## Standards injection

**Domain tags:** `auth`, `security`
**Matched standards files:** `.github/standards/auth/auth-patterns.md`, `.github/standards/security/security-standards.md`

Appended to the Coding Agent Instructions block below.

---

## Oversight level

**Epic oversight:** Medium (per `epics/real-admin-bootstrap.md`) — security-sensitive, tech lead awareness required, no formal sign-off. DoR artefact to be shared before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Bootstrap a brand-new tenant's first admin automatically on login — artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
Test plan: artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New module `src/web-ui/modules/tenant-admin-bootstrap.js` — export a
  plain function `bootstrapTenantAdminIfNeeded(pool, tenantId, personId, logger)`
  taking `pool` directly as a parameter, matching `addOrUpdateTeammate`/
  `listTeamMembers`/`backfillIdentityIfNeeded`'s own existing convention.
  Do NOT build this as a D37 injectable `setX()` adapter.
- New table `tenant_admin_bootstrap` (`tenant_id VARCHAR PRIMARY KEY`,
  `admin_person_id INTEGER`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`),
  migrated via `CREATE TABLE IF NOT EXISTS` in `server.js`'s startup
  migration sequence, matching `tenant_plan`'s own migration block pattern.
- The `tenant_admin_bootstrap` insert and the `team_memberships` admin-grant
  insert MUST occur within a single database transaction (`BEGIN`/`COMMIT`/
  `ROLLBACK`) — committed together or not at all, never partially (AC6,
  found during /review as finding 1-H1).
- Wire into all 3 real first-login call sites: `routes/auth.js`'s GitHub
  OAuth callback, `routes/auth.js`'s Google OAuth callback, and
  `routes/auth-email.js`'s sign-up handler. Do NOT touch email sign-in
  (not a first-login-capable path) or any other route.
- Do NOT modify `resolveRoleForPerson`/`getRoleForTenant`'s own existing
  logic — this bootstrap is a new, separate call inserted into the login
  flow, not a change to existing role resolution.
- Log an `admin_bootstrap_granted` event (person id, tenant id, timestamp)
  on every successful grant — never the raw identity string, matching
  `identity-links.js`'s own established audit-logging convention.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium

## Applicable standards

### .github/standards/auth/auth-patterns.md (matched domain: auth)

[Sections directly applicable to this story:]

- **Prohibited patterns:** No credentials in URLs or logs. No storing
  plaintext passwords or tokens. No client-side auth decisions without
  server verification — directly relevant since this story grants admin
  access automatically based on server-side login-flow state only.
- **Web UI OAuth session token rule:** `req.session.accessToken` is the
  canonical field name for the GitHub OAuth token — this story does not
  read the token itself, but any code touching `routes/auth.js` must not
  introduce a `req.session.token` reference (enforced at DoR via
  `grep -rn "req\.session\.token[^A]" src/web-ui/`).
- Full file: `.github/standards/auth/auth-patterns.md` (41 lines, mostly a
  placeholder template except the two sections above) — read in full
  before implementing.

### .github/standards/security/security-standards.md (matched domain: security)

[Sections directly applicable to this story:]

- **Injection:** Parameterised queries only. No string concatenation in
  queries — the `tenant_admin_bootstrap`/`team_memberships` inserts and
  the `resolveRoleForPerson` reads all use parameterised query patterns
  already established in this codebase; do not deviate.
- **Access control:** Deny by default. Permissions checked at the service
  layer — directly this story's own core concern (who gets admin, and
  when).
- **Logging:** Security events logged (auth failures, access denials). No
  secrets in logs — the `admin_bootstrap_granted` event satisfies this;
  never log the raw identity string.
- Full file: `.github/standards/security/security-standards.md` (33 lines,
  includes one unrelated pre-existing known gap on a different route) —
  read in full before implementing.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Not required (Medium oversight, DoR PROCEED: Yes)

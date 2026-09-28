# Definition of Ready: Retire the legacy admin-bootstrap path

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md
**Test plan reference:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s3-test-plan.md
**Contract:** artefacts/2026-09-26-tenant-admin-bootstrap/dor/tab-s3-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-28

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs; correctly scopes AC1/AC5's real removal surface across both `server.js` and `user-roles.js`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "platform maintainer reading this codebase" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 5/5 covered (AC3 covered by the manual verification scenario, not skipped) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | "Manual admin-grant interventions needed" |
| H6 | Complexity rated | ✅ | Rating: 2 (bumped from 1 per /review finding 1-L1) |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: AC3 explicitly acknowledged as manual/non-automatable, not silently skipped |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies names `tab-s1` AND `tab-s2` as hard upstream — `schemaDepends: ["dodStatus", "prStatus"]` declared, applies to both; both fields confirmed present in `.github/pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 items; review Category E score 5/PASS |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-26-tenant-admin-bootstrap/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence (B1) | ✅ | Story NFRs populated, profile exists |
| H-GOV | Approved By ≥1 non-engineering entry | ✅ | "Hamish King — Platform Owner — 2026-09-28" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | This story removes an adapter, introduces none |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set — this is a code-removal story, not a data migration |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | Both Run 1 findings (1 MEDIUM, 1 LOW) resolved by Run 2 | — |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Script may not perfectly reflect real-world usage nuance | Hamish King, 2026-09-28 — logged in decisions.md |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table: AC3 named explicitly, not uncertain | — |

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
Story: Retire the legacy admin-bootstrap path — artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md
Test plan: artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Do NOT start this story until tab-s1 AND tab-s2 are both merged and
  their own real-environment effects confirmed -- this is a hard
  dependency (H8-ext: schemaDepends on tab-s1's and tab-s2's own
  dodStatus/prStatus fields).
- Remove arl-s4's startup seeding block and the ADMIN_GITHUB_LOGINS env
  var parsing from server.js.
- Remove the setGetUserRole(...) wiring call from server.js.
- Remove the getUserRole/setGetUserRole function definitions AND their
  module.exports entries from user-roles.js -- not just the wiring call
  site (this exact scope was the subject of a /review finding, tab-s3
  1-M1 -- AC1 already reflects the full, corrected scope).
- Remove _backfillOne and its call site inside resolveRoleForTenant --
  confirm resolveRoleForTenant's own remaining default-fallback
  behaviour (team_memberships lookup, 'user' default) is unchanged.
- Do NOT drop the user_roles table itself -- leave it in place, empty.
- Before removing anything, grep tests/*.js for existing references to
  the functions being removed; update or remove those test files as
  part of this story, do not leave them referencing dead code.
- Architecture standards: read `.github/architecture-guardrails.md`
  before implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium

## Applicable standards

### .github/standards/auth/auth-patterns.md (matched domain: auth)

[Sections directly applicable to this story:]

- **Prohibited patterns:** No credentials in URLs or logs -- directly
  relevant since this story removes a credential-adjacent env var
  reference (ADMIN_GITHUB_LOGINS).
- Full file: `.github/standards/auth/auth-patterns.md` -- read in full
  before implementing.

### .github/standards/security/security-standards.md (matched domain: security)

[Sections directly applicable to this story:]

- **Access control:** Deny by default -- confirm the removal doesn't
  leave any code path that silently grants access on failure.
- **Secrets management:** removing ADMIN_GITHUB_LOGINS itself satisfies
  this story's own hygiene goal.
- Full file: `.github/standards/security/security-standards.md` -- read
  in full before implementing.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Not required (Medium oversight, DoR PROCEED: Yes)

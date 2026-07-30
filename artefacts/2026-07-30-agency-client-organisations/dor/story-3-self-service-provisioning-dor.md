# Definition of Ready: Self-service Agency-to-Client provisioning

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
**Test plan reference:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-3-self-service-provisioning-test-plan.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-07-31

---

## Contract Proposal

See `story-3-self-service-provisioning-dor-contract.md`. Summary: Create-Client flow + invite flow using Passport.js/`passport-magic-login` (shared with Story 4) + Resend, with the first invited user getting `team_memberships.role = 'admin'`.

## Contract Review

Checked against all 5 ACs (including the AC5 wiring AC added 2026-07-31) and the test plan's 16 tests. The contract explicitly names the D37 adapter (`sendInvitationEmail`) and its wiring location, matching AC5. No mismatch found.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As an Agency admin..." |
| H2 | ≥3 ACs in G/W/T format | ✅ | 5 ACs (AC5 added 2026-07-31 for D37 wiring) |
| H3 | Every AC has ≥1 test | ✅ | 16 tests across 5 ACs, incl. AC5's stub-throws + wiring tests |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | "Agency-led client provisioning" |
| H6 | Complexity rated | ✅ | 2, Stable — re-affirmed 2026-07-31 after the email/token mechanism was named |
| H7 | No unresolved HIGH findings | ✅ | Review run 3 — PASS, 0 HIGH (both [1-H1] email-infra and [1-H2] role-model gaps resolved) |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps (1 LOW: invitation-record expiry, not blocking) |
| H8-ext | Cross-story schema dependency | ✅ | Upstream: Story 1, Story 2. `schemaDepends: [stage, reviewStatus]` — both present in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-027 + 2 ARCH decisions (email/token mechanism, role model) cited; Architecture compliance scored 5 |
| H-E2E | CSS-layout-dependent AC gap | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Present, Story 3 rows populated |
| H-NFR2 | Compliance clause sign-off | ✅ N/A | No compliance framework named |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By | ✅ | "Hamish King — Product/Platform Owner — 2026-07-30" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | AC5 (added 2026-07-31) explicitly requires: (a) production wiring AC in `server.js`, (b) stub throws when unwired, (c) test asserts an observable, differentiating outcome (two distinct correctly-addressed Resend calls) — all three D37 requirements present |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ N/A | Review run 3 has 0 MEDIUM findings | — |
| W4 | Verification script reviewed by domain expert | ✅ | Acknowledged and proceeding — logged as RISK-ACCEPT in `decisions.md` (2026-07-31); script gets its first walkthrough as the post-merge smoke test instead of pre-code | Hamish King — Product/Platform Owner — 2026-07-31 |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table names the External-dependency (real email delivery) with explicit manual-scenario handling, not left uncertain | — |

---

## Oversight level

**Epic-level oversight: Medium.** No story-specific escalation named for Story 3 beyond the epic default.

> ⚠️ Medium oversight — share the DoR artefact with the tech lead before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Self-service Agency-to-Client provisioning — artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-3-self-service-provisioning-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, existing raw http.createServer + pg adapter conventions
- Passport.js + passport-magic-login for invitation token issuance/verification — build this together with or immediately before Story 4, since both share the same mechanism (see decisions.md 2026-07-31 ARCH entries)
- Resend for email delivery via a new injectable sendInvitationEmail adapter — stub MUST throw when unwired ("Adapter not wired: sendInvitationEmail. Call setSendInvitationEmail() before use."), and server.js MUST wire it to a real Resend call (AC5)
- Invited user's account gets a team_memberships row with role='admin' for the new org's own tenant_id — reuse modules/user-roles.js/team-management.js's existing insert pattern (addOrUpdateTeammate-style), do NOT create a new role field or table
- Server-side org_type check on Create Client — never client-side only
- Never log the raw invitation token in plaintext (Audit NFR)
- Architecture standards: read .github/architecture-guardrails.md before implementing. ADR-026 and ADR-027 apply directly.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards
Domain tags: [web-ui, auth]
- .github/standards/web-ui/web-ui-patterns.md (injectable adapters, session handling — 373 lines, read in full; referenced by path rather than inlined here for length)
- .github/standards/auth/auth-patterns.md (authentication and authorisation)
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Product/Platform Owner — 2026-07-31 (acknowledged)

## Definition of Ready: Admin creates a per-person team invite, which sends the invite email

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s1-admin-creates-invite.md
**Test plan reference:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s1-admin-creates-invite-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-15

---

## Contract Review

✅ **Contract review passed** — the proposed implementation (new `team_invitations` table + module mirroring `client-invitations.js`'s shape, new route reusing `sendInvitationEmail` unchanged) aligns with all 5 ACs and does not introduce anything beyond what the story's Architecture Constraints already specify. See `wsi-s1-dor-contract.md` for the full Contract Proposal.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | tenant admin |
| H2 | ≥3 ACs Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 6 unit tests covering 5 ACs |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ | Share of new teammates added via self-serve invite |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Review run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | All 5 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency | ✅ | Upstream: None declared — schema check not required |
| H9 | Architecture Constraints populated | ✅ | 5 substantive bullets, ADR-025 and ADR-026 cited with real code references |
| H-E2E | Layout-dependent gap check | ✅ | No CSS-layout-dependent ACs — backend/form story only |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | `nfr-profile.md` exists; Data classification (Internal) populated; no compliance NFR with named clause |
| H-GOV | ✅ | Discovery `Approved By`: "Hamish King — Platform Owner — 2026-08-14" — non-blank, non-engineering-only title |
| H-ADAPTER | ✅ | No new injectable adapter introduced — reuses the EXISTING `sendInvitationEmail`/`setSendInvitationEmail` adapter unchanged |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1-W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | Pending operator sign-off below |

---

## Oversight level

**Medium** (per Epic 1) — DoR artefact shared with operator, no named sign-off strictly required per epic policy, but requesting explicit confirmation below for consistency with this session's own established practice.

---

## Standards injection

Domain tags: `[auth]`
Matched: `.github/standards/auth/auth-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Admin creates a per-person team invite, which sends the invite email — artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s1-admin-creates-invite.md
Test plan: artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s1-admin-creates-invite-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New team_invitations table matches client_invitations' shape (modules/client-invitations.js)
  plus tenant_id, role, expires_at. Mirror its function signatures and its atomic
  `UPDATE ... WHERE redeemed_at IS NULL RETURNING *` redemption convention as closely
  as the schema difference allows.
- Reuse sendInvitationEmail/setSendInvitationEmail (modules/invitation-email.js) UNCHANGED.
  Do not build a second email adapter.
- Payload field for the invite token must be named `teamInvitationId` (not `invitationId`,
  which is already used by the existing Client-org invite flow) — wsi-s2 depends on this
  exact field name to extend the dispatcher without collision.
- tenant_id MUST come from req.session.tenantId, never from request input (ADR-025).
- Reuse team-management.js's VALID_ROLES and InvalidRoleError — do not invent a second
  role-validation list.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Read .github/standards/auth/auth-patterns.md (auth domain match).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only, per epic policy) — requesting confirmation below for consistency with this session's practice.
**Signed off by:** Hamish King — Platform owner — 2026-08-15

**PROCEED: Yes**

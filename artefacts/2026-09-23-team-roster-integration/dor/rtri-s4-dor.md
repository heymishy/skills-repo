# Definition of Ready: Backfill person_identities on login so existing real memberships become resolvable

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s4.md
**Test plan reference:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s4-test-plan.md
**Contract:** artefacts/2026-09-23-team-roster-integration/dor/rtri-s4-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-09-24

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. The contract also resolves the Audit NFR IN (building it, matching `linkIdentity`'s own established convention) rather than leaving it as an open RISK-ACCEPT decision.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "tenant owner or any team member whose team_memberships row predates an explicit identity link" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 5/5 covered (3 unit, 4+1+1 integration across AC1/AC2/backward-compat) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | "Real pod membership; /team/members shows a real list", cites the live-verified gap directly |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: PASS, 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream `rtri-s1` — `schemaDepends: ["reviewStatus", "testPlan", "stage"]` declared; all 3 fields confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Corrected D37 touch point (extends `getRoleForTenant`, not a new adapter); review Architecture compliance score 5 (Run 2) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ | No layout-dependent ACs — N/A |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-23-team-roster-integration/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance frameworks apply — N/A |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" (nfr-profile.md, feature-wide) |
| H-NFR-profile | NFR profile presence (B1) | ✅ | Story NFRs populated, profile exists |
| H-GOV | Approved By ≥1 non-engineering entry | ✅ | "Hamish King — Operator/Product Owner — 2026-09-23" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No NEW `setX()` adapter introduced — this story EXTENDS the existing, already-D37-compliant `getRoleForTenant`/`setGetRoleForTenant` adapter (from `tir-s1`) with an optional 3rd argument; both wiring sites in `server.js` are named as explicit implementation-plan touch points |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | No MEDIUM findings in either review run | — |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Script may not perfectly reflect real-world usage nuance | Hamish King, 2026-09-24 — logged in decisions.md |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table: 1 item, resolved (Audit NFR scoped in at DoR) — not left UNCERTAIN | — |

---

## Standards injection

**Domain tags:** `web-ui, auth`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/auth/auth-patterns.md`

Appended to the Coding Agent Instructions block below.

---

## Oversight level

**Epic oversight:** Low (per `epics/real-team-roster.md`) — no sign-off required.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Backfill person_identities on login so existing real memberships become resolvable — artefacts/2026-09-23-team-roster-integration/stories/rtri-s4.md
Test plan: artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Add `backfillIdentityIfNeeded(pool, identityKey, personId, provider, logger)`
  to `src/web-ui/modules/identity-links.js`. Reuse the EXISTING query text
  for both the check (`SELECT person_id FROM person_identities WHERE
  identity_key = $1`) and the insert (`INSERT INTO person_identities
  (identity_key, person_id, provider) VALUES ($1, $2, $3)`) — do not invent
  new query shapes; both already exist elsewhere in this same file and are
  already recognized by the fake-test-db.js test infrastructure, so NO
  fake-test-db.js changes are needed for this story.
- Audit-log `identity_backfilled` using the file's existing `_defaultLogger`/
  `_hashIdentity` helpers — person id, SHA-256 identity hash, provider,
  timestamp. NEVER log the raw identity string.
- Extend `resolveRoleForPerson(pool, identityKey, tenantId, provider)` and
  `getRoleForTenant(tenantId, identityKey, provider)` in
  `src/web-ui/modules/user-roles.js` with a NEW, OPTIONAL 4th/3rd argument
  respectively. When `provider` is omitted, behaviour must be byte-identical
  to today — every existing caller and test must pass unmodified.
- Update BOTH `setGetRoleForTenant` wiring sites in `src/web-ui/server.js`
  (search for `setGetRoleForTenant(function(tenantId, identityKey)` — there
  are 2: one for the real pool, one for `createFakeTestDb()`) to accept and
  forward the new `provider` argument.
- Update the 4 real login call sites: `routes/auth.js`'s GitHub OAuth
  callback (pass `'github'`) and Google OAuth callback (pass `'google'`);
  `routes/auth-email.js`'s sign-in and sign-up handlers (pass `'email'` for
  both — sign-up is a true no-op for backfill per AC4, since a brand-new
  signup has no existing person to resolve, but pass the argument anyway for
  consistency and to satisfy AC1's own test coverage of that call shape).
- Do NOT create any new `team_memberships` row or `people` row anywhere in
  this story — this is identity bookkeeping only (see AC4 and the epic's own
  Out of Scope boundary, clarified in decisions.md 2026-09-24).
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Sections directly applicable to this story:]

- **Injectable adapter pattern (D37/ADR-009):** this story EXTENDS an
  existing, already-compliant adapter (`getRoleForTenant`/
  `setGetRoleForTenant`) rather than introducing a new one — the 3
  mandatory rules (stub throws, setter exported, production wiring as a
  separate task) were already satisfied by `tir-s1`; this story's own
  obligation is narrower: preserve backward compatibility for every
  existing 2-argument caller.
- **Session token access:** not touched by this story.
- **Stack constraints:** No new npm dependencies.

### .github/standards/auth/auth-patterns.md (matched domain: auth)

[This file's own body is mostly an unfilled placeholder template for this
repo — EXCEPT one real, concrete, directly-applicable rule at the bottom:]

- **Web UI OAuth session token rule:** `req.session.accessToken` is the
  canonical field name for the GitHub OAuth token on ALL web UI routes.
  NEVER use `req.session.token` — it is not populated by the OAuth callback
  and is always `undefined`. Confirmed clean baseline before this story:
  `grep -rn "req\.session\.token[^A]" src/web-ui/` returns zero real
  matches (2 comment-only references documenting the rule itself). This
  story touches `routes/auth.js`/`routes/auth-email.js` directly — do not
  introduce a new `req.session.token` reference anywhere in this change.
  Re-run the same grep before committing to confirm the baseline is still
  clean.
```
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)

# DoR Contract: Login role resolution is scoped by person, not just tenant

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s7.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s7-person-scoped-login-resolution-test-plan.md

---

## Contract Proposal

**What will be built:**
1. A corrected role-resolution function in `src/web-ui/modules/user-roles.js` that accepts the authenticating identity, resolves it to a `personId` via `resolvePersonForIdentity` (`identity-links.js`), and queries `team_memberships WHERE person_id = $1 AND tenant_id = $2` instead of `WHERE tenant_id = $1 LIMIT 1`.
2. Updated `server.js` wiring (AC5) so the real `setGetRoleForTenant` implementation performs the person-resolution step before the role lookup.
3. Graceful handling of `resolvePersonForIdentity` returning `null` (brand-new, never-seen identity) — falls through to the existing default `'user'` role, exactly as today, no new person-creation logic.

**What will NOT be built:**
- No schema change to `team_memberships`, `people`, or `person_identities`.
- No modification to `resolvePersonForIdentity` or `linkIdentity` themselves.
- No auto-creation of a person/team_membership row for a brand-new signup.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: 2-person tenant fixture, resolve as person Y, assert Y's own role returned | integration |
| AC2 | Integration test: same fixture, resolve as person X, assert X's own role returned | integration |
| AC3 | Integration test: solo-tenant fixture, assert unchanged behaviour | integration |
| AC4 | Integration test: unknown identity, `resolvePersonForIdentity` returns null, assert graceful fallback to `user` | integration |
| AC5 | Unit test: inspect `server.js`'s wiring call site for the person-resolution step | unit |

**Assumptions:**
- `identityKey` (the string `resolvePersonForIdentity` takes) is whatever `auth.js`/`auth-email.js` already compute at login (GitHub login, Google `sub`, or email) — this story does not introduce a new identity-key convention, it reuses tir-s2's existing one.
- The legacy `getUserRole`/`setGetUserRole` adapter (arl-s1) is untouched — this fix only affects the tir-s1 `getRoleForTenant`/`setGetRoleForTenant` path.

**Estimated touch points:**
Files: `src/web-ui/modules/user-roles.js`, `src/web-ui/server.js` (wiring), new `tests/check-tir-s7-person-scoped-login-resolution.js`
Services: None new (reuses tir-s2's `identity-links.js`)
APIs: None new

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC Coverage table:

- AC1 ↔ corrected query filtering by both `person_id` and `tenant_id`, verified by the 2-person-tenant integration test — ✅ aligned.
- AC2 ↔ same fix, verified by the same fixture resolving the other person — ✅ aligned.
- AC3 ↔ regression check on the solo-tenant case — ✅ aligned.
- AC4 ↔ graceful null-handling, verified directly — ✅ aligned.
- AC5 ↔ `server.js` wiring update, verified by the unit test inspecting the call site — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Engineer on a team that shares a tenant with an admin" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH, 0 MEDIUM, 1 LOW (non-blocking, drafting-process note) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` — depends on tir-s1 (schema, adapter) and tir-s2 (`resolvePersonForIdentity`), both already `prStatus: merged`, not just `dorStatus: signed-off` — dependency fully satisfied, stronger than the minimum bar. `dorStatus` confirmed present in `pipeline-state.schema.json`. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025, D37 cited; correctly reuses `resolvePersonForIdentity` rather than reimplementing |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-07-09-team-identity-roles/nfr-profile.md` (feature-level, already covers this epic) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | |
| H-NFR3 | Data classification not blank | ✅ | Confidential (per feature NFR profile) |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval | ✅ | Discovery `## Approved By` populated |
| H-ADAPTER | D37 adapter wiring check | ✅ | AC5 explicitly scopes the `server.js` rewiring; the existing `getRoleForTenant`/`setGetRoleForTenant` stub-throw contract (tir-s1) is preserved, not weakened |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Run 1: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** This is a fix-forward story dispatched under direct operator oversight given the severity of the underlying bug; same rationale as prior stories in this epic. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Medium (per epic tir-e1) — arguably warrants the same heightened attention as tir-s4 given this is also a security/correctness-critical fix, but the formal oversight level is unchanged from the epic default.
**Handling:** Operator explicitly directed this fix to be filed and dispatched immediately after discovering the bug — this DoR artefact is reviewed in the same session as that decision.

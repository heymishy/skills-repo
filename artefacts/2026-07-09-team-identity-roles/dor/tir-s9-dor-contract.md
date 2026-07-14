# DoR Contract: The identityKey passed to login-time role resolution must be each person's own identity, not the shared tenantId

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s9.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s9-per-person-identitykey-login-fix-test-plan.md

---

## Contract Proposal

**What will be built:**
1. `src/web-ui/modules/user-roles.js`: `getRoleForTenant(tenantId, identityKey)` gains an optional second parameter, forwarded to the wired implementation. Single-argument calls remain fully supported (backward compatible with `auth-email.js`'s two unmodified call sites).
2. `src/web-ui/server.js`: the `setGetRoleForTenant` wiring is updated from `function(tenantId) { return resolveRoleForPerson(_userRolesPool, tenantId, tenantId); }` to `function(tenantId, identityKey) { return resolveRoleForPerson(_userRolesPool, identityKey || tenantId, tenantId); }`.
3. `src/web-ui/routes/auth.js`: the GitHub callback (`handleAuthCallback`) passes `user.login` as the second argument; the Google callback (`handleAuthGoogleCallback`) passes `userInfo.sub` as the second argument.

**What will NOT be built:**
- No change to `resolveRoleForPerson`, `resolvePersonForIdentity`, or any query logic (tir-s7 already fixed the query; this story fixes what argument production callers pass into it).
- No change to `auth-email.js` — its two `getRoleForTenant(email)` single-argument call sites are correct as-is (email is inherently per-person) and are covered by a regression test, not modified.
- No fix for the related-but-distinct Google-user-added-to-a-GitHub-org-shared-tenant gap (story's Out of Scope) — flagged in `decisions.md` as a candidate follow-up, not built here.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: drive the real `handleAuthCallback` as person Y in a shared org tenant, assert `req.session.role === 'engineer'` | integration |
| AC2 | Integration test: same fixture, drive as person X, assert `req.session.role === 'admin'` | integration |
| AC3 | Integration tests: solo GitHub tenant via `handleAuthCallback`, and email/password via `handleEmailLogin` (unmodified), both assert unchanged behaviour | integration |
| AC4 | Integration test: drive `handleAuthGoogleCallback`, assert `req.session.role`/`tenantId` unchanged from pre-story semantics | integration |
| AC5 | Unit test (adapter forwarding) + integration test (two identities sharing one tenantId resolve to two different, individually-correct roles through the wired closure) + static check of `server.js`'s and `routes/auth.js`'s actual call sites | unit + integration |

**Assumptions:**
- `user.login` (GitHub) and `userInfo.sub` (Google) are already in scope at the point `getRoleForTenant` is called in both callbacks — confirmed by direct code reading, no new data needs to be fetched.
- `resolvePersonForIdentity`'s existing `person_identities` → `team_memberships.tenant_id` fallback chain (tir-s2) is unchanged and sufficient — this story only changes which string is passed in as `identityKey`, never the resolution logic itself.

**Estimated touch points:**
Files: `src/web-ui/modules/user-roles.js`, `src/web-ui/server.js`, `src/web-ui/routes/auth.js`, new `tests/check-tir-s9-per-person-identitykey-login-fix.js`
Services: None new (reuses tir-s1/tir-s2/tir-s7's existing pieces)
APIs: None new

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC Coverage table:

- AC1 ↔ real-callback integration test for person Y, asserting the differentiated correct role — ✅ aligned.
- AC2 ↔ same fixture, person X — ✅ aligned.
- AC3 ↔ two regression tests (GitHub solo tenant, email/password) — ✅ aligned.
- AC4 ↔ Google regression test proving no behaviour change — ✅ aligned.
- AC5 ↔ unit test (argument forwarding) + integration test (differentiated resolution through the wired closure) + static call-site checks — ✅ aligned, and explicitly avoids the weaker "a function reference was assigned" shape per CLAUDE.md's post-tir-s1 rule.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Engineer whose team shares one GitHub-org-allowlisted tenant with an admin and other teammates" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions, including the related Google/shared-tenant finding |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH, 0 MEDIUM, 1 LOW (non-blocking, retrospective note) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Depends on tir-s1 (schema/adapter), tir-s2 (`resolvePersonForIdentity`), tir-s7 (query logic) — all `prStatus: merged`, not just `dorStatus: signed-off` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025, D37 cited; extends the existing adapter additively rather than reimplementing or replacing it |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-07-09-team-identity-roles/nfr-profile.md` (feature-level, already covers this epic) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | |
| H-NFR3 | Data classification not blank | ✅ | Confidential (per feature NFR profile) |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval | ✅ | Discovery `## Approved By` populated |
| H-ADAPTER | D37 adapter wiring check | ✅ | AC5 explicitly scopes the `server.js` rewiring and the two `routes/auth.js` call-site updates; the existing stub-throw contract is preserved; the wiring test asserts differentiated, individually-correct output per two distinct identities — not just that a function reference changed |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Fix-forward story under direct operator oversight given the severity of the underlying bug; same rationale as tir-s7/tir-s8. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Medium (per epic tir-e1) — same heightened-attention rationale as tir-s7/tir-s8: a security/correctness-critical fix-forward story.
**Handling:** Operator explicitly directed this fix to be filed and dispatched immediately in the same session the gap was discovered — this DoR artefact is reviewed in that session.

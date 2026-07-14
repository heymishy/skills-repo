# DoR Contract: Re-validate admin role on every gated request so a mid-session demotion takes effect immediately

**Story reference:** artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s2.md
**Test plan reference:** artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s2-stale-role-revalidation-test-plan.md

---

## Contract Proposal

**What will be built:**
1. `src/web-ui/middleware/require-admin.js`: a new injectable adapter, `setGetCurrentRole(fn)` / internal `_getCurrentRole`, defaulting to `null` (unwired). `requireAdmin` becomes `async`. When `_getCurrentRole` is wired and the session has a `userId`, it is called with `(tenantId)` to fetch the live role, `req.session.role` is overwritten with the result (self-healing), and access is granted only if that live value is exactly `'admin'`. On adapter rejection, access is denied (fail closed). When `_getCurrentRole` is unwired, behaviour is byte-for-byte identical to `requireAdmin` before this story (no `await`, synchronous decision from cached `req.session.role`).
2. `src/web-ui/server.js`: `setGetCurrentRole` is wired to a closure calling the already-imported `getRoleForTenant(tenantId)` (from `user-roles.js`) — the same adapter already used at login. All 5 existing `requireAdmin(req, res, ...)` call sites gain `await`.
3. New test file `tests/check-sec-perf-s2-stale-role-revalidation.js` (T1–T12, per test plan).

**What will NOT be built:**
- No change to `addOrUpdateTeammate`, `team_memberships`, or any write path (story reuses the existing read-side adapter chain only).
- No change to `credits-guard.js`'s separate stale-role bypass check — flagged as a follow-up in the story's Out of Scope and in `decisions.md` context, not built here.
- No session-invalidation / forced-logout mechanism — live re-validation is the chosen approach (see `decisions.md` context in the story's Out of Scope section for why).
- No caching/TTL on the new live lookup.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit/integration test: session cached `role: 'admin'`, stub live-lookup returns `'engineer'`, assert `requireAdmin` denies (403) | unit |
| AC2 | Same fixture as AC1, assert `req.session.role` is corrected to `'engineer'` after the call | unit |
| AC3 | Session cached `role: 'user'`, stub live-lookup returns `'admin'`, assert access granted; plus a same-session two-call sequence proving per-request re-evaluation | unit |
| AC4 | Adapter left unwired (fresh module, no `setGetCurrentRole` call); assert admin/non-admin/no-session cases all match `arl-s2`'s existing pre-story assertions exactly | unit (regression) |
| AC5 | Static check that `server.js` wires `setGetCurrentRole` to `getRoleForTenant`; behavioural test that two sessions sharing a tenantId but mapped to different roles by the stub both resolve correctly through the wired closure | unit + static |
| AC6 | Stub adapter rejects; assert `requireAdmin` denies (403), not 500, not fallback-to-cached-role | unit |

**Assumptions:**
- `getRoleForTenant(tenantId)` (single-argument form) is already exported from `user-roles.js` and already wired in `server.js` to `resolveRoleForPerson` — confirmed by direct code reading (`src/web-ui/modules/user-roles.js` lines 64–72, `server.js` lines 282–283). This story does not need to add a new resolver, only call the existing one again per-request.
- `req.session.tenantId` is already populated by the time any `requireAdmin`-gated route is reached (set at login in `auth.js`/`auth-email.js`) — confirmed by direct code reading.
- Making `requireAdmin` `async` is safe for all 5 `server.js` call sites once `await` is added — confirmed these are plain `if (pathname === ...)` dispatch blocks already inside an `async` request handler (not Express middleware chaining), so adding `await` is a mechanical, low-risk change.

**Estimated touch points:**
Files: `src/web-ui/middleware/require-admin.js`, `src/web-ui/server.js`, new `tests/check-sec-perf-s2-stale-role-revalidation.js`
Services: None new (reuses the existing `_userRolesPool`/`resolveRoleForPerson` chain from `tir-s1`/`tir-s7`)
APIs: None new

---

## Contract Review

Reviewed against all 6 story ACs and the test plan's AC Coverage table:

- AC1 ↔ T1 (demotion denial) — ✅ aligned.
- AC2 ↔ T2 (session self-heal) — ✅ aligned.
- AC3 ↔ T3, T4 (promotion grant + bidirectional per-request re-evaluation) — ✅ aligned.
- AC4 ↔ T5, T6, T7 (unwired fallback, all three pre-story states) — ✅ aligned.
- AC5 ↔ T8 (behavioural wiring test, not a referential-only check), T9 (static wiring check) — ✅ aligned, explicitly avoids the weaker "a function reference was assigned" shape per CLAUDE.md's post-tir-s1 rule.
- AC6 ↔ T10 (fail-closed on adapter error) — ✅ aligned.

No mismatches found between proposed implementation and stated ACs. T11 (await-everywhere regression check) and T12 (audit log still fires) are additional coverage beyond the ACs, not a gap.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "platform operator responsible for the security of the admin-gated surfaces" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | See AC coverage table above |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 explicit exclusions, each with a stated reason |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track feature — no discovery/benefit-metric artefact exists for `2026-07-01-security-perf-hardening` (CLAUDE.md: short-track explicitly skips `/discovery`/`/benefit-metric`). The story's Benefit Linkage field states this and links instead to the sibling `sec-perf` story's own stated security-hardening goal. Flagged in the review report (Traceability scored 4/5, not 5/5, for this reason) rather than silently treated as a full pass. |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH, 1 MEDIUM (resolved via decisions.md), 1 LOW (non-blocking retrospective note) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Story's Dependencies block is "None" — no upstream story dependency declared |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D37 deviation (D1) logged in `decisions.md`; ADR-025 cited as unaffected; reuses existing `getRoleForTenant` adapter rather than introducing a parallel resolution path |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI, no layout-dependent ACs |
| H-NFR | NFR profile exists (or story has explicit NFR section) | ✅ | Story's own NFRs section is populated directly (Performance/Security/Accessibility/Audit) — no separate `nfr-profile.md` exists for this short-track feature, matching the sibling `sec-perf` story's own precedent of embedding NFRs directly rather than a standalone profile artefact |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance-regulated NFR named |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile artefact exists for this feature (see H-NFR) |
| H-NFR-profile | NFR profile presence check (B1-enforce) | ✅ N/A | Story's NFR section is not "None" — but per the same short-track precedent as the sibling `sec-perf` story (which also has no `nfr-profile.md`), this feature's NFRs are handled inline in the story rather than via a separate profile artefact. No new gap introduced by this story relative to the feature's existing baseline. |
| H-GOV | Governance approval | ✅ N/A | No discovery artefact exists for this short-track feature — `## Approved By` check does not apply. Operator (Hamish King) is directly reviewing this DoR in-session, matching the sibling `sec-perf` story's own sign-off convention. |
| H-ADAPTER | D37 adapter wiring check | ✅ | AC5 explicitly scopes the `server.js` wiring; the stub-throw-on-unwired default is deliberately NOT used here — see D1 in `decisions.md` for the logged, precedented exception; the wiring test (T8) asserts differentiated, individually-correct output for two distinct sessions sharing a tenantId — not just that a function reference changed |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set for this feature |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set for this feature |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | 1-M1 resolved via `decisions.md` D1, created this session |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Fix-forward security story under direct operator oversight, same rationale as the `team-identity-roles` epic's `tir-s7`/`tir-s8`/`tir-s9` precedent for this class of story. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Medium — security/correctness-critical fix-forward story, same heightened-attention rationale as `tir-s7`/`tir-s8`/`tir-s9`.
**Handling:** Filed and dispatched in the same session the gap was confirmed by direct code reading; this DoR artefact is reviewed in that session.

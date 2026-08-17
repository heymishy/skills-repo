# Definition of Done: The identityKey passed to login-time role resolution must be each person's own identity, not the shared tenantId

**PR:** https://github.com/heymishy/skills-repo/pull/472 | **Merged:** 2026-07-14
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s9.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (person Y resolves own role via real GitHub callback in shared tenant) | Yes | `check-tir-s9-per-person-identitykey-login-fix.js` T1 -- `handleAuthCallback sets req.session.role = engineer for person Y`, asserts `session.role === 'engineer'` through the real `handleAuthCallback` | automated test | None |
| AC2 (person X resolves own role via the same real callback) | Yes | Same file, T2 -- `handleAuthCallback sets req.session.role = admin for person X`, asserts `session.role === 'admin'` | automated test | None |
| AC3 (solo GitHub tenant and email/password login unaffected) | Yes | Same file, T3a -- solo-tenant GitHub login regression (`session.role === 'admin'` unchanged); T3b -- `handleEmailLogin` regression via `auth-email.js`'s unmodified single-argument call (`session.role === 'product'`, 302 redirect) | automated test | None |
| AC4 (Google callback passes `sub` explicitly as identityKey; non-bug finding, no behaviour change) | Yes | Same file, T4 -- `handleAuthGoogleCallback resolves the same role as before this story`, asserts `session.tenantId === 'google-sub-123'` and `session.role === 'viewer'` unchanged | automated test | None |
| AC5 (D37 wiring: `server.js` forwards `identityKey`, verified by behavioural differentiation not just call-shape) | Yes | Same file, T5 -- `getRoleForTenant(tenantId, identityKey)` forwards both args, single-arg calls still work; T6 -- the exact `server.js` wiring shape resolves person X and person Y to two different, individually-correct roles (`admin` vs `engineer`) from one shared `tenantId`, plus static assertions that `server.js`'s wiring block no longer collapses `tenantId`/`identityKey` and that `routes/auth.js` calls `getRoleForTenant(req.session.tenantId, user.login)` (GitHub) and `getRoleForTenant(req.session.tenantId, userInfo.sub)` (Google) | automated test | None |

Direct code reading confirms the static assertions in T6 hold against current `master`: `src/web-ui/server.js`'s `setGetRoleForTenant` wiring accepts and forwards `identityKey`, and `src/web-ui/routes/auth.js`'s GitHub and Google callbacks both pass the per-person identity as the second argument.

---

## Scope Deviations

None. The story's own explicitly-deferred item -- a Google-authenticated person manually added as a teammate to a GitHub-org-shared tenant silently defaulting to `user` on their own Google login (a different bug shape: silent role loss, not role collision) -- is named in the story's "Out of Scope" section and is confirmed logged as an accepted follow-up candidate in `artefacts/2026-07-09-team-identity-roles/decisions.md` (not silently dropped). This is accepted deferral, not a gap.

---

## Test Plan Coverage

**Tests passing:** `check-tir-s9-per-person-identitykey-login-fix.js` -- 7 passed, 0 failed (freshly re-run 2026-08-17).

The 7 tests map to the 5 ACs as follows: T1 (AC1), T2 (AC2), T3a + T3b (AC3, two regression cases), T4 (AC4), T5 + T6 (AC5, unit + behavioural halves). No gaps -- every AC has at least one dedicated test, and AC5's wiring is proven behaviourally (two identities sharing a tenantId resolve to two different roles), satisfying CLAUDE.md's injectable-adapter wiring-test correctness rule rather than only asserting a function reference was assigned.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security -- correctness-critical fix for privilege confusion on shared-tenant logins | Yes | AC1/AC2 exercise the real OAuth callback (not the already-fixed query function directly) and prove both directions: person Y never resolves person X's role and vice versa |
| Performance | N/A | Story states no new query is added, only the string value passed into an existing lookup changes |
| Accessibility | N/A | Backend login-path fix only, no UI |
| Audit | N/A | No new audit requirement beyond what tir-s1/tir-s7 already log |

---

## Metric Signal

The story links to Metric 1 (per-person role assignment exists). tir-s7 (PR #467) made the underlying query logic correct but, as this story's Benefit Linkage documents, the production login callers still collapsed `identityKey` and `tenantId` into the same value, so Metric 1's claim did not actually hold end-to-end on the shared-tenant path this epic exists to support until tir-s9 shipped. No dedicated benefit-metric artefact re-measurement is referenced by this story beyond that narrative link.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None for this story. The related Google-shared-tenant silent-role-loss finding remains logged in `decisions.md` as a candidate follow-up story, not a blocking gap of tir-s9.

---

## DoD Observations

This story is a strong example of the epic's fix-forward pattern (tir-s7, tir-s8, tir-s9): a real bug in a *caller* of already-correct, already-tested logic was found by reading production wiring directly rather than trusting the upstream story's own passing tests, and closed with tests that exercise the real OAuth callback end-to-end rather than the isolated function.

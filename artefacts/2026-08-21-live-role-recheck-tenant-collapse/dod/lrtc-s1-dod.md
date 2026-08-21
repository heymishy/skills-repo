# Definition of Done: Thread the authenticating person's identity through requireAdmin's live role re-check

**PR:** https://github.com/heymishy/skills-repo/pull/750 | **Merged:** 2026-08-21
**Story:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/stories/lrtc-s1-thread-identity-through-live-role-recheck.md
**Test plan:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/test-plans/lrtc-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/dor/lrtc-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — two people sharing one tenant resolve to two different, individually-correct roles via the live re-check | ✅ | `T13` in `tests/check-sec-perf-s2-stale-role-revalidation.js` — `[PASS] requireAdmin live re-check: person-X (admin) granted, person-Y (engineer) denied despite stale cached admin role` | Automated test, re-run fresh on merged master 2026-08-21 | None |
| AC2 — solo-tenant call pattern unchanged (regression check) | ✅ | `T14`, same file — `[PASS] requireAdmin live re-check: solo tenant (tenantId === identity) still resolves correctly` | Automated test, re-run fresh on merged master | None |
| AC3 — `rbg-s1`'s own AC1 E2E test passes without any further changes | ✅ | `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js -g "AC1: admin"` — `1 passed`, alice `200`, bob `403` | Automated E2E test, re-run fresh on merged master | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — all 3 ACs verified with fresh evidence gathered against the actual merged commit (`37a09664`), not carried over from pre-merge verification.

---

## Scope Deviations

None. The merged PR's diff matches exactly what the DoR contract and implementation plan specified: `src/web-ui/middleware/require-admin.js`, `src/web-ui/server.js` (both `setGetCurrentRole` wiring sites), and `tests/check-sec-perf-s2-stale-role-revalidation.js`. One cherry-picked commit from `feature/rbg-s1` also rode along (the dependency this story's own DoR and decisions.md explicitly documented) — not a scope deviation, a declared and necessary dependency.

---

## Test Plan Coverage

**Tests from plan implemented:** 3/3
**Tests passing in CI:** 3/3 (re-confirmed fresh this session against merged master, plus PR #750's own CI: `Lint, typecheck, test, build`, `Playwright E2E smoke tests`, `Cross-tenant isolation spec — 20x repeat, zero-tolerance`, `Run assurance gate`, `Scenario A/B E2E (staging)`, `Watermark gate`, and `Validate traceability chain` all passed before merge)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T13 — two people, one tenant, real resolution chain (AC1) | ✅ | ✅ | Exercises the real `resolveRoleForPerson` chain, not a hand-substituted mock — see test plan's own note on why the pre-existing T8 test would not have caught this bug |
| T14 — solo-tenant regression (AC2) | ✅ | ✅ | Confirms `identityKey === tenantId` behaviour unchanged |
| E2E AC1 (AC3, `bri-s3.3` spec) | ✅ | ✅ | No changes needed to the spec file itself — confirms the fix alone was sufficient |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — no privilege escalation between teammates sharing a tenant | ✅ | T13's own assertion IS the security-relevant check (person-Y denied despite a stale cached admin role); no separate NFR test needed per the NFR test scope rule. Same fix pattern already proven safe by `tir-s9` for the login-time path. |

No feature-level NFR profile exists for this short-track story (consistent with every other short-track story in this repo — `H-NFR-profile` correctly N/A'd at DoR).

---

## Metric Signal

No metrics in this feature's `metrics` array (short-track security bug fix, no formal metric tracked per the story's own Benefit Linkage — "None formally tracked").

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story's own scope. Recommended but separate (already noted in the story's Benefit Linkage / not blocking this DoD): confirm whether any real production tenant currently has 2+ people with different roles sharing a `TENANT_ORG_ALLOWLIST` tenant, to establish whether this was actively exploitable in production before the fix, or a latent surface.

---

## DoD Observations

1. This story is a clean example of the session's broader pattern this week: writing a REAL test for the first time against previously-under-tested infrastructure (in this case, `rbg-s1`'s own admin-gated-route test) is itself a discovery method — it surfaced two real, independent, previously-undetected bugs (the fake-test-db wiring gap, then this privilege-escalation bug) in one pass.
2. The pre-existing `T8` test in `check-sec-perf-s2-stale-role-revalidation.js` (from `sec-perf-s2`) looked like it already covered this exact scenario and passed the whole time — it was a "wiring occurred" test in disguise (branches on an external test variable rather than the real, single `tenantId` argument the actual call site passes), matching CLAUDE.md's own documented D37 anti-pattern for `tir-s1`. Worth a broader sweep for this same shape elsewhere if `/improve` is ever run against this repo's own test-quality patterns.
3. This story's PR also surfaced a separate, unrelated CI-gate reliability issue (`/trace`'s `test_plan_coverage` check failing on 21 pre-existing, unrelated stories) — resolved as its own finding (F13/`tpbg-s1`), not folded into this story's scope. See that story's own DoD for details.
4. Cross-branch dependency handling: this story's branch cherry-picked one commit from `feature/rbg-s1` (the fake-test-db wiring fix) since it needed to edit that same code. Both branches' pipeline-state bookkeeping stayed correctly scoped to their own story throughout (verified via conflict resolution at each merge point) — no cross-story field collisions.

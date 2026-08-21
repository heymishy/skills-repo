# Definition of Done: Fix bri-s3.3's role-boundary regression guard so it actually asserts denial

**PR:** https://github.com/heymishy/skills-repo/pull/751 | **Merged:** 2026-08-21
**Story:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/stories/rbg-s1-fix-role-boundary-regression-guard.md
**Test plan:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/test-plans/rbg-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/dor/rbg-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — real admin-gated-route denial test replaces the weak "both users reach a shared route" assertion | ✅ | `AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied` — alice `200`, bob `403` on `GET /admin/credits` | Automated E2E test, re-run fresh on merged master (commit `44f93014`) 2026-08-21 | None |
| AC2 — viewer denied on the same admin-gated route via `requireAdmin`, replacing the unimplemented placeholder | ✅ | `AC3: viewer-role write attempt is denied` — `e2e-viewer` gets `403` on `GET /admin/credits` | Automated E2E test, re-run fresh on merged master | None |
| AC3 — full `bri-s3.3-multi-user-tenant-journey.spec.js` suite passes end-to-end, genuinely functioning as the regression guard | ✅ | Full file run: `5 passed (11.7s)` — all 5 tests, including the untouched AC2 (concurrent-access) and AC4 (mock-gateway) tests | Automated E2E test, re-run fresh on merged master | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — all 3 ACs verified with fresh evidence gathered against the actual merged commit, not carried over from pre-merge verification.

---

## Scope Deviations

None. The merged PR's diff is exactly what the DoR contract specified — the entire change is confined to `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, plus the necessary `lrtc-s1` dependency merge (already reviewed and merged independently via its own PR #750, not duplicate scope).

---

## Test Plan Coverage

**Tests from plan implemented:** 3/3
**Tests passing in CI:** 3/3 (re-confirmed fresh this session against merged master, plus PR #751's own CI checks all passed before merge)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — admin-gated route differentiation | ✅ | ✅ | Replaces the original weak 200/200 shared-route assertion |
| AC2 — viewer denial | ✅ | ✅ | Replaces the original unimplemented placeholder body |
| AC3 — full suite regression | ✅ | ✅ | 5/5, no regression to the 2 untouched pre-existing tests |

**Gaps (tests not implemented):** None for this story's own scope. `npm test`'s full-suite regression check confirmed identical 33 pre-existing, unrelated failures — zero new failures introduced by this story's changes.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — restores a claimed-but-non-functional security regression guard | ✅ | AC1/AC2's own assertions ARE the security-relevant behaviour; the guard now genuinely detects the role-boundary regression it was always meant to catch |

No feature-level NFR profile exists for this short-track story (consistent with every other short-track story in this repo — `H-NFR-profile` correctly N/A'd at DoR).

---

## Metric Signal

No metrics in this feature's `metrics` array (short-track gap-closure fix, no formal metric tracked per the story's own Benefit Linkage — "None formally tracked").

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story's own scope. Two items remain from the wider investigation this story triggered, both already tracked separately and not blocking this DoD:
1. `2026-08-21-viewer-role-no-enforcement` discovery artefact — still in "Draft — awaiting approval," documenting that no general viewer-role write-blocking enforcement exists anywhere in the codebase (this story correctly narrowed its own AC2 scope to test only the real boundary that exists, `requireAdmin`).
2. Recommended (not yet done): check whether any real production tenant currently has a viewer-role person assigned, to gauge urgency of item 1.

---

## DoD Observations

1. This story is the clearest example this session of a broader pattern: a regression test that was written years/months prior can silently stop testing anything real (the original AC1 checked a non-gated shared route; AC3 was a literal unimplemented placeholder) while `pipeline-state.json` continued recording "6/6 tests passing, 4/4 ACs verified" — a false sense of security-test coverage with zero actual signal. Fixing the assertions, not the story's own framing, was the correct scope.
2. Implementing this story's own AC1 test for the first time (writing a REAL admin-gated-route assertion, rather than another weak one) immediately surfaced two independent, previously-undetected infrastructure/security bugs in the code this test exercises — not bugs in this story itself. Both were routed correctly: one fixed inline (test-harness wiring, low risk, well-precedented), one routed to its own dedicated story (F12/`lrtc-s1`, a real privilege-escalation bug, too significant to fold into a test-coverage story). This story's own scope stayed narrow throughout, exactly as its DoR specified.
3. Sequencing note for future reference: this story was genuinely blocked end-to-end on `lrtc-s1` shipping first — its own AC1 test could not pass until that separate PR merged. The two PRs (`#750`, `#751`) landed in the correct dependency order.

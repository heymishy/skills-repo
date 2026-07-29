# Definition of Done: Auto-confirm real-staging E2E specs immediately after every master deploy

**PR:** https://github.com/heymishy/skills-repo/pull/633 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-29-post-merge-e2e-confirmation/stories/pmec-s1-post-merge-e2e-confirmation-job.md
**Test plan:** artefacts/2026-07-29-post-merge-e2e-confirmation/test-plans/pmec-s1-post-merge-e2e-confirmation-job-test-plan.md
**DoR artefact:** artefacts/2026-07-29-post-merge-e2e-confirmation/dor/pmec-s1-dor.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `.github/workflows/staging-deploy.yml`'s `post-deploy-e2e-confirm` job (merged, on master) declares `needs: deploy-staging` | Automated test (U1, `node tests/check-pmec-s1-post-merge-e2e-confirmation.js`), re-run against merged master code | None |
| AC2 | ✅ | The job re-runs Scenario A's exact 5 spec files (behind `audit.staging_e2e_scenario_a`) and Scenario B's exact 1 spec file (behind `audit.staging_e2e_scenario_b`), matching `e2e.yml`'s own lists | Automated test (U2), re-run against merged master code | None |
| AC3 | ✅ | `promote-to-prod`'s `needs:` still names only `smoke-test` | Automated test (U3), re-run against merged master code | None |
| AC4 | ✅ | No job in `staging-deploy.yml` depends on `post-deploy-e2e-confirm` — confirmed structurally, not via `continue-on-error` | Automated test (U4), re-run against merged master code | None |
| AC5 | ✅ | `standards/governance/delivery-patterns.md`'s D44 section (merged, on master) covers all 4 required points: why the gap happens, how to recognise it, the manual workaround, and the automated job pointer | Automated test (U5), re-run against merged master code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

One deviation, already logged in this story's own `decisions.md`: implementing pmec-s1 required narrowing `check-rlcc-s1-smoke-test-worker-isolation.js`'s AC2 scope (from file-wide `--workers=1` uniqueness to job-scoped uniqueness), since `post-deploy-e2e-confirm` legitimately reuses `--workers=1` for the same CPU-contention reason Scenario A/B do. This was not in the original story's stated scope but was a necessary, minimal, and clearly-justified change to an existing governance test whose literal wording was stricter than its documented intent — not a change to product behaviour. Logged in `artefacts/2026-07-29-post-merge-e2e-confirmation/decisions.md`.

No other scope deviations. The merged PR touches only `.github/workflows/staging-deploy.yml` (new job), `standards/governance/delivery-patterns.md` (new D44 section), the new test file, and the rlcc-s1 test scope fix noted above.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| U1 (AC1): new job exists, needs: deploy-staging | ✅ | ✅ | Re-run against merged master code today |
| U2 (AC2): reuses Scenario A/B specs behind same flags | ✅ | ✅ | Re-run against merged master code today |
| U3 (AC3): promote-to-prod needs: unchanged | ✅ | ✅ | Re-run against merged master code today |
| U4 (AC4): no job depends on the new job | ✅ | ✅ | Re-run against merged master code today |
| U5 (AC5): standards doc covers all 4 points | ✅ | ✅ | Re-run against merged master code today |

**Gaps (tests not implemented):** One permanent, accepted gap, documented in the test plan itself: whether the new job actually catches a real "endpoint not yet live" failure in practice can only be confirmed the next time a story in this exact shape ships. Not a failure — a structural limitation of testing this class of gap synthetically.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — CI wall-clock increases by the combined Scenario A/B duration on every master push | ✅ | Confirmed by design; explicitly accepted per the story's NFR section; observed real duration on PR #633's own run: Scenario A ~2m42s + Scenario B ~2m27s ≈ 5m added per master push |
| Security — reuses existing secrets, no new scope | ✅ | Confirmed by code review — no new `secrets:` entries beyond `E2E_STAGING_BASE_URL`, `E2E_STAGING_AUTH_STUB_SECRET`, `E2E_STAGING_ADMIN_PASSWORD`, all already used by `e2e.yml`'s Scenario A/B jobs |

---

## Metric Signal

No metrics array entries reference this story (`2026-07-29-post-merge-e2e-confirmation` has an empty `metrics: []` in `pipeline-state.json` — short-track infra fix, no benefit-metric artefact).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Passive: observe the next PR that introduces a new staging-safe endpoint + same-PR real-staging test, and confirm `post-deploy-e2e-confirm` genuinely surfaces (or doesn't need to surface) a same-day confirmation signal for it.

---

## DoD Observations

1. Verifying this PR's own CI directly surfaced a genuine, separate defect in cif-s1 (already merged, previously marked DoD-complete): `scenario-a-staging-e2e` and `scenario-b-staging-e2e` sharing a bare concurrency group with no ordering between them could have one outright cancelled under multi-request load (confirmed live on PR #633 itself — two rapid pushes produced a cancellation, and an isolated re-run of the same job passed cleanly, confirming the mechanism). This was fixed forward as cif-s2 (PR #634, merged the same session) rather than reopening cif-s1. Tag as an `/improve` candidate: verifying a new PR's CI against shared infrastructure it depends on (here, the concurrency group cif-s1 introduced) can surface latent defects in already-shipped work — worth keeping as a standing practice, not just incidental to this story.
2. The rlcc-s1 test-scope fix (see Scope Deviations) is a good example of a governance test whose literal assertion was narrower than its documented intent; worth keeping in mind for future stories that add a second, independently-justified use of an existing narrowly-scoped flag or pattern.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Auto-confirm real-staging E2E specs immediately after every master deploy" (pmec-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

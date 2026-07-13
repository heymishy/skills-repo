# Definition of Done: Add staging smoke test + manual promote gate to prod

**PR:** https://github.com/heymishy/skills-repo/pull/462 | **Merged:** 2026-07-12
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.6-smoke-test-promote-gate.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.6-smoke-test-promote-gate-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.6-smoke-test-promote-gate-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `smoke-test` job runs `npx playwright test --grep "@mocked"` against `E2E_BASE_URL: https://wuce-staging.fly.dev`, `needs: deploy-staging`, `timeout-minutes: 10`. Coverage grows as Epic 3 lands, exactly per this AC's own stated intent ("covers whatever suite coverage actually exists at its DoD point") | automated test (T1/T2) | None — growing coverage is the designed behaviour, not a gap |
| AC2 | ✅ | `promote-to-prod` job uses `environment: production`, a GitHub reviewer-approval environment-protection gate | automated test (T3/T4); confirming the named reviewer is Hamish specifically (not a service account) is a manual GitHub-Settings check | None on the automated portion |
| AC3 | ✅ | `promote-to-prod` has `needs: smoke-test`, no `if: always()` override — a red suite structurally blocks the option | automated test (T5/T6) | None |
| AC4 (Acceptance Criterion 4) | ✅ | `docs/rollback-runbook.md` — concrete `fly releases --app skills-framework`, `fly releases rollback <version>`, `fly deploy --image ...@<digest>` commands | automated test (T7/T8); never live-rehearsed against real infrastructure, DoR-acknowledged | Not yet rehearsed live — see Follow-up actions |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

**Disclosed and reasoned in `decisions.md` (2026-07-12, ARCH, subagent-execution):** this story extends the same `staging-deploy.yml` file bri-s2.5 created (rather than a separate file), because GitHub Actions' `needs:` dependency mechanism only works within a single workflow file, and `deploy-staging → smoke-test → promote-to-prod` is a single logical pipeline. This legitimately introduced a reference to the real production Fly app name (`skills-framework`) inside the same file bri-s2.5's own T4 test had asserted never contains it anywhere — because T4 was written before bri-s2.6 existed and scoped to the whole file. Fixed by narrowing bri-s2.5's T4 to the `deploy-staging` job block specifically (T5's `findProdDeployViolations`, already job-scoped with an allowlist, correctly continues to cover the whole-file "no prod deploy outside the allowlisted promote job" property). Verified via re-run: `check-bri-s2.5-ci-pipeline-staging-deploy.js` 7/7 (was 6/7 before the fix), `check-bri-s2.6-smoke-test-promote-gate.js` 10/10.

The rollback runbook and promote job correctly target `skills-framework` (the real Fly app name in `fly.toml`), not the story's placeholder `wuce-prod` — reconciled and documented in the workflow's own comments and the detector's allowlist vocabulary. Does not touch the epic's declared out-of-scope items (automated rollback, staging-of-staging cascade).

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1/T2 (@mocked suite runs, reports pass/fail) | ✅ | ✅ | |
| T3/T4 (green suite still requires manual approval) | ✅ | ✅ | |
| T5/T6 (red suite structurally blocks promote) | ✅ | ✅ | |
| T7/T8 (documented rollback path) | ✅ | ✅ | |
| Remaining unit tests | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage gap audit (per DoD Step 4):**
- Rollback runbook exists and is tested for content-completeness (T7/T8), but has **never been live-rehearsed** against a real Fly release. This is disclosed in the story's own AC4 framing (a written, followable path — not a claim of live rehearsal) and is consistent with Epic 2's declared out-of-scope on automated rollback.
- No `decisions.md` RISK-ACCEPT entry names this specifically, but the DoR contract's own AC4 language ("Hamish can revert... without needing to reconstruct the steps from memory") only requires the path be written down, not exercised — treated here as a documented, low-severity gap, not a defect.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Full staging suite completes without forcing an unreasonable wait, coordinated with Metric 6's under-10-minute target | ✅ | `smoke-test` job has an explicit `timeout-minutes: 10`, matching the shared budget |
| Manual promote action requires Hamish's own GitHub authentication, no service account | ✅ | `environment: production` reviewer-approval gate; live confirmation of the specific named reviewer is a manual GitHub-Settings check, not independently re-verified in this DoD pass |
| Every promote action recorded in GitHub Actions' own run history | ✅ | Standard GitHub Actions environment-protection audit trail, sufficient for a solo operator per this story's own NFR framing |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — A broken build cannot reach prod | ✅ (0%) | Yes — the structural gate (green-suite-then-manual-approval, red-suite-blocks-promote) is now fully wired and tested | This is the terminal story of Epic 2; the gate itself is real and testably enforced, though it has not yet processed a real production promotion end-to-end |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- **Action recommended, not blocking:** live-rehearse the documented rollback path at least once against a real Fly release, to confirm the runbook's commands work as written rather than only being confirmed present by static test. Lower priority than the bri-s2.1/s2.2/s2.3 External-dependency gaps, since this gate's structural enforcement (AC2/AC3) is independently and fully tested regardless of whether rollback itself has been rehearsed.

---

## DoD Observations

1. **This is the terminal story of Epic 2** — with this story's DoD marked complete, Epic 2's own structural claim ("a broken build cannot reach prod") is now backed by a real, tested gate. However, Metric 1's full real-world validation (an actual PR flowing through PR-checks → staging deploy → seed → smoke test → manual promote, end-to-end, against live infrastructure) has still never happened, because bri-s2.1/s2.2/s2.3's External-dependency gaps (live Fly/Neon/Upstash verification) remain open. The mechanism is real and tested at the code/config level; the live rehearsal is the remaining gap across the whole epic, not specific to this story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add staging smoke test + manual promote gate to prod" (bri-s2.6).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

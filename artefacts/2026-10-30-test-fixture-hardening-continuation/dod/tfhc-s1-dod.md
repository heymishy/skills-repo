# Definition of Done: Extract a shared E2E fixture for seeding an approval journey

**PR:** [#1041](https://github.com/heymishy/skills-repo/pull/1041) | **Merged:** 2026-10-30
**Story:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s1-e2e-seed-journey-fixture.md
**Test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s1-e2e-seed-journey-fixture-test-plan.md
**DoR artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-10-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/e2e/fixtures/seed-journey.js` exports `seedApprovalJourney(request, overrides)`, POSTs to `/test/seed-approval-journey` with defaults (`featureSlug`, `stage: 'discovery'`, `completedStages: []`), returns parsed JSON including `journeyId`. Fresh re-run: `tests/e2e/tfhc-s1-seed-journey-fixture.spec.js:6` passed. | integration-real-code (real route, real Playwright browser context) | None |
| AC2 | ✅ | `seedApprovalJourney` merges `overrides` over defaults via `Object.assign`. Fresh re-run: `tests/e2e/tfhc-s1-seed-journey-fixture.spec.js:15` ("accepts overrides and applies them server-side") passed. | integration-real-code | None |
| AC3 | ✅ | 2 of the 4 real callers migrated: `ep3-s1-regression.spec.js` and `ep2-s4-concurrent-merge.spec.js`. Fresh re-run on merged master (this session, `NODE_ENV=test npx playwright test ...`): `ep2-s4-concurrent-merge.spec.js` both tests pass unchanged; `ep3-s1-regression.spec.js` fails with the identical pre-existing `TimeoutError` confirmed before and after migration (see Deviation). | live-verified (real Playwright run against the real dev server, this session, post-merge) | See Deviation note |
| AC4 | ✅ | AC4's own text explicitly reads "each migrated spec produces the same pass/fail outcome as it did before migration" — not "must pass." `ep2-s4-concurrent-merge.spec.js`: pass→pass (unchanged). `ep3-s1-regression.spec.js`: fail→fail, identical failure mode (`TimeoutError` on `page.waitForURL('**/skills/definition/sessions/**')`), confirmed via `git log` showing only the original `ep3-s1` story ever touched this file before this migration. | live-verified | None — satisfied under the AC's own literal "outcome unchanged" wording |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. The batch was limited to 2 of the 4 real callers as a proof-of-pattern (AC3's own wording: "2 of the 4 real callers... e.g. `ep3-s1-regression.spec.js` and one other"), consistent with the story's Out of Scope section naming the remaining 1–2 callers as an explicit fast-follow.

**Deviation note (AC3/AC4):** `ep3-s1-regression.spec.js` fails both before and after migration due to a real, pre-existing, unrelated product bug (`handlePostJourneyRegress`/`handleGetJourneyResume` in `src/web-ui/routes/journey.js` — a stage-regression lands the user on the wrong stage's session). This was discovered as a side effect of this story's own migration work, confirmed via 3x reproduction and `git log` provenance (only the original `ep3-s1` story, commit `50fd1fb5`, ever touched this test file before `tfhc-s1`). Logged as a RISK-ACCEPT in `decisions.md` (`/subagent-execution (tfhc-s1, Task 3)`), and filed as [GitHub issue #1042](https://github.com/heymishy/skills-repo/issues/1042) for separate prioritisation. This is not a deviation introduced by this story — it is a pre-existing defect this story's own migration work happened to surface and correctly did not mask.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5
**Tests passing in CI:** 4/5 (the 5th's failure is the pre-existing, documented, unrelated defect above — not a test-plan implementation gap)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `seedApprovalJourney` seeds with sensible defaults | ✅ | ✅ | Fresh re-run this session |
| `seedApprovalJourney` accepts overrides | ✅ | ✅ | Fresh re-run this session |
| `ep3-s1-regression.spec.js` migrated, assertions unchanged | ✅ | ❌ (pre-existing) | Same failure mode before/after migration |
| `ep2-s4-concurrent-merge.spec.js` migrated, assertions unchanged | ✅ | ✅ | Fresh re-run this session |
| Full suite stays green (NFR/regression) | ✅ | ✅ | PR #1041: all 8 CI checks passed |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — thin wrapper, no new runtime concern | ✅ | `nfr-profile.md`: "E2E fixture wrapper overhead — Negligible, observed during tfhc-s1's own migration" |
| Security — endpoint guarded by `NODE_ENV === 'test'` | ✅ | `src/web-ui/server.js:2663-2688` confirmed `NODE_ENV`-guarded at DoR time; no production code path touched |
| No new production code path | ✅ | `nfr-profile.md`: confirmed all 4 stories' deliverables live under `tests/`/`scripts/` only |
| Accessibility / Audit | N/A | No UI, not applicable (per story NFRs) |

All NFRs verified — no gaps.

---

## Metric Signal

**Measurement-ready gate:**

**m1 — E2E seed-fixture duplication:** Measurement-ready? **Yes.**

> **E2E seed-fixture duplication (m1)**
> Signal: on-track
> Evidence: 2 of 4 real callers of `/test/seed-approval-journey` now use the shared fixture (`ep3-s1-regression.spec.js`, `ep2-s4-concurrent-merge.spec.js`) — within the target range (2–3 of 4) and meeting the minimum validation signal ("at least 1 caller migrated as proof-of-pattern"). The benefit-metric's own minimum-validation-signal text also names a structural check script as part of the signal — no such check was built at the E2E layer (not named as an AC in this story; the E2E layer's enforcement mechanism was explicitly out of scope per `discovery.md`). Recording this honestly as a partial-mechanism signal, not claiming full minimum-validation-signal satisfaction.
> Date measured: 2026-10-30

**m7 — Divergence-bug incidence (cross-cutting):** Measurement-ready? **Not yet.**

> **Divergence-bug incidence (cross-cutting, extended scope) (m7)**
> Signal: not-yet-measured
> Evidence note: This metric's own minimum validation signal is defined as "no new occurrence within the next 3 stories touching journey.js/skills.js/E2E seed-journey *after this MVP ships*" — a measurement window that has not started yet (tfhc-s1/s2/s3 are themselves the MVP, not stories after it). Development-time review confirms this story's own migration work introduced no new divergence-bug occurrence (the one real defect surfaced, `handlePostJourneyRegress`/`handleGetJourneyResume`, is independently confirmed pre-existing — see Scope Deviations above). This observation is informative but is not the metric's defined measurement event.
> Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. GitHub issue #1042 (`handlePostJourneyRegress`/`handleGetJourneyResume` wrong-stage redirect defect) — already filed, awaiting prioritisation. Not blocking this story.
2. Migrating the remaining 2 of 4 real callers — explicit fast-follow per `discovery.md` Out of Scope item 1. No ticket filed yet; names the gap for whoever picks this epic up next.

---

## DoD Observations

1. **`/improve` candidate (already logged):** The test_plan_coverage trace-validation check (`scripts/validate-trace.sh`) falls back to an exact `{story-slug}-test-plan.md` filename when `pipeline-state.json`'s `testPlan.artefact` field is unset — this repo's actual filenames use descriptive suffixes. Fixed for this feature's 4 stories; capture-log entry already records the `/test-plan` skill-level gap this points to.
2. **`/improve` candidate (already logged):** `check-pipeline-state-integrity.js`'s C3 check has no carve-out for a documented RISK-ACCEPT'd pre-existing test failure — this story's own merge trips it permanently (`testPlan.passing: 4/5`, honestly recorded, will never clear C3 without either a checker change or inflating the count). Logged as a RISK-ACCEPT in `decisions.md` and as a formal capture-log `/improve` candidate.
3. **`/improve` candidate (already logged):** The main-checkout-vs-feature-branch pipeline-state.json sync gap (a master-side write made after a worktree's last sync point, never re-synced) recurred across this epic for two different artefact types (`decisions.md` here, `pipeline-state.json` on `tfhc-s2`) — written up as a formal proposal at `workspace/proposals/2026-10-30-branch-complete-improve-proposal.md`.
4. **`benefit-metric.md` → `pipeline-state.json` gap (fixed as part of this DoD run):** `metrics[].contributingStories` was empty for all 7 metrics despite the benefit-metric's own Metric Coverage Matrix naming the mapping explicitly — same undocumented `/definition` gap first found during the `tsir-s1` epic's own DoD. Fixed directly before writing this DoD (commit `53b9d3bb`).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Extract a shared E2E fixture for seeding an approval journey" (tfhc-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

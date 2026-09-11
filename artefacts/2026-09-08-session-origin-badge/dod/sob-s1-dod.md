# Definition of Done: Shared session-origin derivation + product feature-list indicator

**PR:** https://github.com/heymishy/skills-repo/pull/848 | **Merged:** 2026-09-08 (merge commit `8b4f8bff`)
**Story:** artefacts/2026-09-08-session-origin-badge/stories/sob-s1-shared-derivation-and-product-list-indicator.md
**Test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-08-session-origin-badge/dor/sob-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-09-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `all completedStages carry sessionId returns fully-session-backed` | automated unit test (`check-sob-s1-session-origin-derivation.js`) | None |
| AC2 | ✅ | `some completedStages carry sessionId, some do not, returns mixed` | automated unit test | None |
| AC3 | ✅ | `real journey with zero sessionId-bearing stages returns no-session` | automated unit test | None |
| AC4 | ✅ | `AC4: taxonomy-only mergedItems entry (no journeyId) renders the "no-session" indicator` | automated integration test (`check-sob-s1-product-list-integration.js`) | None |
| AC5 | ✅ | `real journey with zero completed stages returns null` (unit) + `AC5: journey-backed item with zero completed stages renders no session-origin indicator` (integration) | automated unit + integration test | None |
| AC6 | ✅ | `AC6: exactly one batched call to _getSessionOriginBulk regardless of journey count` — added during the mandatory two-stage review's Important-finding fix cycle, mirroring `check-fps-s1-progress-proxy.js`'s proven pattern | automated integration test, end-to-end via `handleGetProductView` | None |
| AC7 | ✅ | `AC7: bulk-read failure (simulated by an empty fallback map) renders successfully with no indicators` | automated integration test | None |
| AC8 | ✅ | `AC8: every rendered session-origin state carries a non-empty title naming the state` | automated integration test | None |
| AC9 | ✅ | Both `hasJourney:false` branches, and the `hasJourney:true+[]` vs `hasJourney:false+[]` distinguishability test | automated unit test | None |

**Confirmed in CI, not just locally:** PR #848's "Lint, typecheck, test, build" check passed (2m57s), alongside every other required check (assurance gate, watermark gate, cross-tenant isolation, Playwright E2E smoke, Scenario A/B staging E2E) — all green at merge time.

---

## Scope Deviations

None. Confirmed via commit-by-commit review at `/verify-completion` and the mandatory final reviewer's independent pass: no click/drill-down interaction was added, `/journey` and org kanban were not touched (sob-s2/sob-s3's own scope), and no taxonomy merge was added to org kanban.

---

## Test Plan Coverage

**Tests from plan implemented:** 14 / 14 (test plan originally estimated 11 at DoR time; 3 additional tests were added during implementation — 1 net addition from Task 4's own scope, 1 from the AC6 review-fix cycle, reconciled in `pipeline-state.json` and `decisions.md` as the work progressed)
**Tests passing in CI:** 14 / 14

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1–AC3, AC5 (unit), AC9 ×2 | ✅ | ✅ | `check-sob-s1-session-origin-derivation.js`, 6 tests |
| AC4, AC5 (integration), AC6, AC7, AC8 | ✅ | ✅ | `check-sob-s1-product-list-integration.js`, 8 tests |

**Gaps (tests not implemented):** None against the story's own ACs. One residual risk logged separately (not a test-plan gap): 3 pre-existing, unrelated local Playwright E2E specs (`bmau-s1-bulk-assign-rerender.spec.js`, `frsr-s1-feature-row-session-resume.spec.js`, `pnfc-s1-new-feature-choice.spec.js`) fail in this local sandbox — differentially confirmed at `/verify-completion` to fail identically with this story's code entirely absent (pre-existing environment flakiness, not a coverage gap). All corresponding CI checks (including the CI-hosted Playwright E2E smoke suite) passed on the actual merged PR.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Performance — bulk lookup, not per-row query | ✅ | AC6's own test proves exactly 1 call per render; confirmed by both the implementer and 2 independent reviewers |
| Security — none identified (read-only, no new user input) | ✅ | Confirmed at design/definition time; nothing in the merged diff introduces new input handling |
| Accessibility — text-equivalent required, not colour alone | ✅ | AC8's test proves every state carries a non-empty `title`/`aria-label` |
| Audit — none identified (no new write action) | ✅ | Confirmed — this feature is read-only |

Feature-level NFR profile (`artefacts/2026-09-08-session-origin-badge/nfr-profile.md`) status updated: Active → Verified at 2026-09-09 for the NFRs this story addresses (Performance, Accessibility). Data residency/Availability/Compliance sections remain "Not applicable" as originally recorded — unchanged by this story.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| List-view session-origin visibility | ✅ (0%, recorded at benefit-metric time) | Partial — product feature-list surface only | sob-s1 alone reaches the benefit-metric's own stated minimum validation signal (100% coverage on the product feature-list page). The full target (100% across all 3 surfaces: product list, `/journey`, org kanban) is not yet measurable — `/journey` and org kanban wiring are sob-s2 and sob-s3, both still pending. Not yet a real live-traffic measurement (no operator has yet spot-checked this on `wuce-staging` against real, mixed-state features) — that manual walkthrough was RISK-ACCEPTed to happen post-merge (see DoR decisions.md W4 entry) and has not been executed as of this DoD. |

**Measurement-ready gate answer:** Not yet (full metric). Recording `not-yet-measured` for this story's own contribution.

**Post-merge live verification, both historical and fresh (backfilled 2026-09-11 — see DoD Observation #5):** The RISK-ACCEPTed W4 walkthrough referenced above **was in fact executed** on 2026-09-09 (same day as this DoD's own "Date" field, just later) — full detail in `artefacts/2026-09-08-session-origin-badge/decisions.md`'s "Post-merge verification walkthrough executed (RISK-ACCEPT W4 closed)" entry — but that closure was never written back into this DoD file until now, the same category of gap found and fixed for `wnl-s2`/`wnl-s1`/`wnl-s3`/`jasb-s1` this session. Original 2026-09-09 result on `wuce-staging`: `skills-framework` product list, 630 live badges (9 fully-session-backed, 621 no-session), correct zero-badge case on a not-yet-started feature confirmed, every badge carrying a correct `title`. **Independently re-confirmed fresh on 2026-09-11** via `getComputedStyle`-rigor Chrome verification (applying the lesson `sob-s4` itself later established): still exactly 630 badges, exactly the same 621/9 split, all carrying `sw-pill--neutral` with a real resolved `backgroundColor: rgb(26, 26, 24)` (not just the class string present — the CSS genuinely resolves).

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. ~~Complete sob-s2 and sob-s3~~ — done, both merged and DoD-complete.
2. ~~Execute the RISK-ACCEPTed post-merge manual verification-script walkthrough on `wuce-staging`~~ — done, 2026-09-09 (see Metric Signal section above); independently re-confirmed 2026-09-11.
3. ~~Add a tone modifier class (e.g. `sw-pill--neutral`)~~ — done, `sob-s4`.

---

## DoD Observations

1. **Estimate-vs-actual test count drift is a real, recurring signal worth tracking.** DoR-time estimate was 11 tests; delivered was 14 — a 27% increase, driven by (a) Task 4's own AC6 test being added a task early during Task 2's implementation, and (b) the mandatory code-quality review catching a genuine missing-coverage gap (AC6) that required a fix-cycle addition. Neither addition reflects scope creep — both are within the original 9 ACs — but the DoR-time test-plan estimate undercounted real coverage needs by a meaningful margin. `/improve` candidate: track this delta across a few more stories before concluding whether `/test-plan`'s own estimation approach needs adjustment, or whether this is normal single-story variance.
2. **The mandatory final-review step earned its keep again.** It asked the spec-compliance reviewer's earlier deviation-verification question a second time, independently, and traced the real Postgres → `deriveSessionOrigin` data flow end-to-end rather than trusting the per-task reviews' own conclusions — consistent with this epic's own established pattern (see `canonical-artefact-trace`/`cat-s1`'s DoD observations) that this step catches things no individual task review can.
3. **A subagent hit the "false-wait" failure mode twice during this story's execution** (waiting for a background-process notification that will never reach a subagent), despite the dispatch prompt's explicit warning both times. Recovered cleanly each time via a direct `SendMessage` correction. Consistent with this epic's own prior observation that this is a structurally recurring failure mode, not a rare one — worth continued attention in `/subagent-execution`'s own dispatch-prompt wording, though it already contains the strongest warning language established so far.
4. **A subagent dispatch hit a session-wide rate limit mid-task with real, correct partial work already applied and verified in the worktree.** Rather than re-dispatching (risking the same limit), the orchestrating session independently verified the partial work (both fixes genuinely present and correct), ran the remaining verification steps directly, and completed the commit itself — the same recovery pattern already established earlier this epic for an unrelated story (`cat-s5`). Worth noting as a second independent confirmation this recovery approach is sound, not a one-off judgment call.
5. **Backfilled 2026-09-11, following a repo-wide DoD-verification-method stocktake:** this DoD's own Metric Signal section, as originally written, said the W4 walkthrough "has not been executed as of this DoD" — true at the moment of writing, but the walkthrough ran later that same day and its results were logged in `decisions.md`, never propagated back here. The stocktake's triage specifically flagged this story as still showing an unexecuted RISK-ACCEPT; on inspection the RISK-ACCEPT was actually long closed — the DoD artefact itself was just stale. Re-confirmed fresh (not just copied from the historical record) before writing this update.

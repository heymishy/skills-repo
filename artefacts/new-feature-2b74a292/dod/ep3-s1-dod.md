# Definition of Done: Request Regression to Earlier Stage

**PR:** https://github.com/heymishy/skills-repo/pull/915 | **Merged:** 2026-09-22 (merge commit `50fd1fb5`)
**Story:** artefacts/new-feature-2b74a292/stories/ep3-s1.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep3-s1-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep3-s1-dor.md
**Assessed by:** Claude
**Date:** 2026-09-22

---

## AC Coverage

- **AC1:** Susan (or any collaborator) is presented with a stage selector and a reason field, and submits her choice with a reason
- **AC2:** The feature's stage resets to the target and every stage between target and current (inclusive) is marked incomplete
- **AC3:** Approval records for the reverted stages still exist (not deleted) — preserved for audit

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-ep1-s4-stage-routing.js` (23/23, includes 3 assertions added for this story's own markup) + `tests/e2e/ep3-s1-regression.spec.js` (1/1, real Playwright browser render + submit) + live Chrome validation on real staging post-merge (filled the form, submitted through the actual page — not a bypassed API call — confirmed correct rendering, zero console errors) | unit + integration-real-code + live-verified | The DoR's literal "stage selector" (a dropdown of all prior stages behind a single "Request Regression" button) is not what was built — the story's own step-nav stage-dot links already provide per-stage selection, so this extends the existing per-stage `confirm-back` interstitial with a reason field rather than building a new, disconnected UI component. Documented and confirmed correct in `decisions.md` before implementation began; the substance of AC1 (select a target stage, provide a reason, submit) is fully satisfied. |
| AC2 | ✅ | `tests/check-ep3-s1-journey-store-regress.js` (4/4, pure state logic) + `tests/check-ep3-s1-integration.js` (14/14) + `tests/e2e/ep3-s1-regression.spec.js` (real API state assertions + `review` stage's reopen link 404ing) + live Chrome validation (real regression against a real staging journey, confirmed `activeSkill` reset via the real `GET /api/journey/:journeyId` response) | unit + integration-real-code + live-verified | None. A real, functional bug was found and fixed during Task 4's own E2E test: `regressToStage` didn't clear `journey.activeSessionId`, so a post-regression user was bounced back into a stale, now-invalidated session instead of anywhere reflecting the regression — this is the story's own primary scenario, not an edge case. Fixed (commit `e00ff076`) and confirmed working live in production (landed on a genuinely fresh session for the regressed-to stage). |
| AC3 | ✅ | `tests/check-ep3-s1-integration.js` (byte-exact prefix-preservation assertions: prior `decisions.md` content is an exact untouched prefix of the post-regression content) | unit + integration-real-code | AC3's literal text ("query `feature_approvals`... approval records still exist") doesn't apply literally — no such table exists anywhere in this codebase. The real, already-shipped analog is `decisions.md` (append-only Markdown), via the same pattern the sibling `ep2-s3` story already established. Substance ("audit records preserved, not deleted, even though the stage is now incomplete") is fully satisfied — only the literal field/table name differs, matching this feature's own repeated, established deviation pattern (see `ep2-s3-dod.md`'s DoD Observations). |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Both recorded deviations are substance-preserving corrections against real, verified architecture (matching this feature's established pattern for DoR/AC text written against an imagined system) — not gaps in what was delivered.

---

## Scope Deviations

None. Confirmed against the story's Out of Scope list: no approval gate for regression (auto-accepts, exactly as specified), no partial/per-edit regression (whole-stage only), no reverting of specific edits — all three remain genuinely absent from the shipped diff.

---

## Test Plan Coverage

**Tests from plan implemented:** consolidated into 4 files matching the 4-task implementation plan (`check-ep3-s1-journey-store-regress.js`, `check-ep3-s1-integration.js`, an extension to the pre-existing `check-ep1-s4-stage-routing.js`, `e2e/ep3-s1-regression.spec.js`) plus a fix to an unrelated pre-existing E2E spec (`e2e/ep1-s4-stage-selector.spec.js`) whose text selector broke from this story's own intentional button relabel — a leaner grouping than the test plan's own per-scenario breakdown, matching this feature's established consolidation pattern.
**Tests passing:** all passing — re-run fresh against merged master in this session: `check-ep3-s1-journey-store-regress.js` 4/4, `check-ep3-s1-integration.js` 14/14, `check-ep1-s4-stage-routing.js` 23/23, `e2e/ep3-s1-regression.spec.js` 1/1, `e2e/ep1-s4-stage-selector.spec.js` 3/3. Full `npm test` on merged master (commit `f8fe1f01`): **694 files run, 1 failed** (`tests/check-p3.5-validate-trace.js` — pre-existing, unrelated Windows local `python3` shim permission issue, confirmed repeatedly across this entire session, not introduced by this story).

| Test file | AC(s) covered | Passing | Notes |
|-----------|---------------|---------|-------|
| `check-ep3-s1-journey-store-regress.js` | AC2 | ✅ 4/4 | Pure state logic: `isStrictlyLaterStage`, `regressToStage` |
| `check-ep3-s1-integration.js` | AC1, AC2, AC3 | ✅ 14/14 | Real handler dispatch + real router wiring/viewer-gate proof; includes the audit-trail-race regression test |
| `check-ep1-s4-stage-routing.js` | AC1 | ✅ 23/23 | Pre-existing sibling file, extended with 3 new markup assertions |
| `e2e/ep3-s1-regression.spec.js` | AC1, AC2 | ✅ 1/1 | Real browser render + submit + redirect-chain verification |
| `e2e/ep1-s4-stage-selector.spec.js` | (regression fix, unrelated story) | ✅ 3/3 | Text selector updated for this story's own intentional button relabel — found by `/verify-completion`'s mandatory route/handler E2E coverage check |

**Gaps (tests not implemented):** None blocking.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Regression completes within 1s | ✅ | `handlePostJourneyRegress` performs a synchronous in-memory state update (`regressToStage`) plus one `fs.appendFileSync` — no network I/O, no polling. Confirmed via live Chrome check: no perceptible delay. Not given a dedicated timing assertion, matching this feature's own established RISK-ACCEPT pattern for identically-shaped synchronous NFRs (`ep1-s1`/`ep1-s2`/`ep1-s3` precedent) — a timing test here would measure scheduler noise, not this feature's own logic. |
| Prior approvals are preserved (not deleted) | ✅ | `check-ep3-s1-integration.js`'s byte-exact prefix-preservation assertions — `integration-real-code` |
| Stage marks are immediately updated (no refresh needed) | ✅ | Confirmed live: the regression form's own fetch+redirect chain lands the user on a fresh session reflecting the new stage with no manual refresh — `live-verified` |

---

## Metric Signal

This feature's benefit-metric artefact (`artefacts/new-feature-2b74a292/benefit-metric.md`) uses directional success indicators rather than a structured Tier 1 `metrics[]` array — no `metrics` entry exists in `pipeline-state.json` for this feature to update.

| Indicator | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Reversibility with audit trail ("A team member can request to regress to an earlier stage, make a change, re-sign off, and have both the regression and the re-approval recorded in the audit trail") | ✅ (baseline: 0 — no regression mechanism existed before this story) | Not yet measured | The regression half of this indicator is now shipped and verified working end-to-end (real staging, real browser submission, real state reset, real audit-trail entry). The "re-sign off" half is a separate concern (the existing `ep2-s3` approval flow, unmodified by this story). No real beta-team regression has occurred yet to observe the target directly. Signal: `not-yet-measured`. Evidence note: regression mechanism shipped and verified live 2026-09-22; awaiting first real beta-team regression to observe the target. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 3 ACs satisfied with `live-verified` evidence for AC1/AC2 (real staging, real browser submission and redirect chain) and `integration-real-code` for AC3. Two recorded deviations (AC1: extends the existing stage-dot/confirm-back UI rather than a new standalone modal+dropdown; AC3: `decisions.md` rather than a nonexistent `feature_approvals` table) are both substance-preserving corrections against real, already-verified architecture — not gaps. Zero scope violations. Zero test gaps that block release. One real, functional bug (AC2's `activeSessionId` not being cleared) was found by this story's own E2E test and fixed before merge — a strong validation of the delivery process, not a defect in the final shipped code.

**Follow-up actions:**
1. None blocking.
2. `/improve` candidate (already logged in `decisions.md`): this is the second story in this feature where a new `<script src>`-served client file or form-submit flow needed a coordinator-level catch that no task-level review caught on its own (a JSON-only endpoint behind a plain HTML form) — worth considering whether `/implementation-plan` should explicitly prompt "if this task adds a form/link that POSTs to a JSON-only endpoint, does it need a client-side intercept" as a standing checklist item.
3. `/improve` candidate: this is the second story in this feature where a new SSE/route addition needed the SAME tenant guard as an adjacent already-guarded route, found only by a reviewer's own diligence rather than a systematic check — worth a standing "does this new route need the same access guard as its sibling" prompt in `/implementation-plan`.

---

## DoD Observations

1. **Every single task's review round found something real** — a plan-authoring typo (Task 1), a Critical audit-trail race condition plus an Important test-isolation ordering issue (Task 2), an ID-namespace collision plus a missing accessible label plus inverted button-emphasis (Task 3), and a genuine functional bug caught live by the E2E test itself (Task 4, `activeSessionId`). This is a strong empirical case for this feature's own two-stage-review-per-task discipline continuing exactly as-is — nothing here suggests the process is over-engineered for a Complexity-2 story.
2. **The DoR/test-plan for this story assumed an architecture that doesn't exist** — no `routes/features.js` regression route, no `feature_approvals` table, no `feature-stage-controls.js` file. This is the feature's now-repeated pattern (6th occurrence — see `ep2-s3-dod.md`'s own running count). The correction was caught and fully documented BEFORE `/implementation-plan` began (unlike several earlier instances in this feature, which were caught mid-implementation) — a genuine process improvement worth noting, possibly attributable to this session's now-standing habit of investigating DoR touch-points immediately after `/branch-setup`.
3. **A design gap I (the coordinator) caught myself, not any task-level reviewer**: the Request Regression form was a plain HTML `<form>` submitting to a JSON-only endpoint, which would have left the browser displaying raw JSON on submit. Caught by re-reading the end-to-end flow before dispatching Task 4's E2E test — the E2E test itself would NOT have caught this (it only checks server state via a separate API call, never the resulting page). Fixed with a small `fetch()`-based intercept matching an already-established pattern elsewhere in the same file. Worth noting as a real limit of even a thorough automated test suite: some defects are only visible by tracing the actual user-facing consequence, not by asserting on server state alone.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep3-s1 (Request Regression to Earlier Stage).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

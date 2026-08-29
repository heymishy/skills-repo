# Definition of Done: Act on a materiality suggestion without auto-triggering downstream changes

**PR:** https://github.com/heymishy/skills-repo/pull/782 | **Merged:** 2026-08-29 (commit `777a4660`)
**Story:** `artefacts/2026-08-27-revise-earlier-stage/stories/res-s4-operator-acts-on-materiality-suggestion.md`
**Test plan:** `artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s4-test-plan.md`
**DoR artefact:** `artefacts/2026-08-27-revise-earlier-stage/dor/res-s4-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Flagging downstream stages shows a visible, non-colour-only marker ("⚑ May need review") on all THREE step-nav render sites — traced end-to-end (client button click → fetch → `handlePostMaterialityAction` → `setJourneyFields` → all three renderers) across two rounds of the mandatory final cross-task review, not just "a test exists" — and touches no artefact content (confirmed by code inspection: the handler has zero fs/artefact-store calls in its body) | Automated tests (Task 2 flag-set test; Task 3's two `journey.js` render-site tests; Task 5's third-render-site test; Task 5b's in-place-update tests) plus two rounds of manual end-to-end code-path trace | **Yes — caught and fixed pre-merge, across two separate rounds, not post-merge surprises.** The first implementation (Tasks 1–4) only updated two of three step-nav render sites. Round 1 of final review found the third (`skills.js`'s own chat page) and a silent flag-data-loss bug; fixed in Task 5. Round 2 of final review then found Task 5's fix was correct render logic that never actually ran on the page the operator was looking at without a reload; fixed in Task 5b. See DoD Observations #1–2. |
| AC2 | ✅ | "Leave as-is" applies no flag, touches no artefact, still records the choice | Automated tests (`AC2: "leave-as-is" applies no flag`, `AC2/AC3: "leave-as-is" is still recorded`, `AC2: no flag_set events fire for leave-as-is`) | None |
| AC3 | ✅ | Operator's choice paired with res-s3's own `suggestionId` (minted in `materiality-check.js`, forwarded through res-s3's SSE payload, read client-side, POSTed back) in the `materiality_operator_choice_recorded` PostHog event — genuinely joinable for an acceptance-rate computation | Automated tests (`AC3: the choice event carries the same suggestionId as the original suggestion`, `AC3: the choice event records the operator action`) plus a dedicated final-review trace of the suggestionId's full round trip | None |
| AC4 | ✅ | Reopening a flagged stage clears that stage's own flag on both the fresh-session-creation and existing-live-session (early-return) reopen paths, leaving unrelated flags untouched | Automated tests (`AC4: reopening a flagged stage clears its own flag`, `AC4 negative control: an UNRELATED flagged stage remains flagged`, `AC4: the flag clears on the early-return path too`) | A deliberate, documented scope boundary (not a bug): a flag can land on a downstream stage the operator has not yet reached, which has no resolution path until that stage is first reached and reopened — AC4's literal text is satisfied, but its stated rationale ("flags don't persist forever with no resolution path") is not fully realized for this specific edge case. RISK-ACCEPTed in `decisions.md` (2026-08-29, finding O2) rather than silently shipped or hidden. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Three are recorded above (AC1's two pre-merge fix rounds, AC4's documented edge case) — all resolved or explicitly accepted before this PR merged, not post-merge surprises.

---

## Scope Deviations

None. Diff confirmed to touch exactly `src/web-ui/modules/journey-store.js`, `src/web-ui/adapters/journey-store-pg.js`, `src/web-ui/routes/journey.js`, `src/web-ui/routes/skills.js`, `src/web-ui/server.js`, one new test file, and the DoR-contract/story/decisions/capture-log/pipeline-state artefacts corrected during `/implementation-plan` and the two final-review fix cycles — matching the corrected DoR contract's touch points. No automatic artefact regeneration was implemented, and no new "handle it differently" skill/UI was introduced — both explicitly checked against the story's Out of Scope section during both rounds of final review.

---

## Test Plan Coverage

**Tests from plan implemented:** 36 tests across 6 tasks (test-plan originally scoped 4 tasks against 4 ACs; grew during implementation and the two final-review fix cycles to cover the third render site, the flag-union fix, and the in-place DOM-patch fix — final count independently verified, not a gap).
**Tests passing in CI:** 36/36 — confirmed via the merged PR's "Lint, typecheck, test, build" check (SUCCESS) and independently re-run directly against the merged `master` HEAD during this DoD check (36 passed, 0 failed).

| Task | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Task 1 — `flaggedStages` default, `getDownstreamStages()`, Postgres allowlist fix | ✅ | ✅ | Closes a previously-undocumented persistence risk class: a new top-level journey field silently vanishing on a Postgres-backed restart unless explicitly added to `_sanitise()`'s allowlist |
| Task 2 — `handlePostMaterialityAction` endpoint + flag/leave-as-is buttons | ✅ | ✅ | Follows the existing `handlePostAssumptionConfirm`/`attachCardHandlers` precedent rather than inventing a new chat-turn/free-text mechanism |
| Task 3 — flag marker on both `journey.js` step-nav render sites | ✅ | ✅ | Strengthened at code-quality review with a negative control after a vacuous-pass risk was identified (a fixture id thematically matching the route's own name) |
| Task 4 — flag clears on reopen (AC4) | ✅ | ✅ | Guards the flag-clear PostHog call after a code-quality review finding; also surfaced a pre-existing unguarded PostHog call in the same function (res-s1's own code, out of scope for this fix, logged for a future symmetry pass) |
| Task 5 (corrective, round-1 final review) — third render site + flag-union fix | ✅ | ✅ | Both fixes mutation-tested by the orchestrating session directly (not just trusted from a report) before being committed |
| Task 5b (corrective, round-2 final review) — flag marker updates in place after the operator's own action | ✅ | ✅ | One of its own tests caught as vacuous during self-review (checked the whole file rather than the specific render site) and corrected before being trusted — see DoD Observation #3 |

**Gaps (tests not implemented):** None. Full suite: 565/565 passing (confirmed both during `/verify-completion` and independently re-run against merged master for this DoD). Route/handler E2E coverage check (mandatory per `/verify-completion`): 8 matched local specs run fresh — 19/20 passing (1 pre-existing, unrelated failure confirmed via a clean baseline worktree at res-s4's own merge-base and RISK-ACCEPTed, see `decisions.md`); 3 `@real-staging` specs named as residual risk at verify-completion (`a4-ideate-session-resume.spec.js`, `b1-formed-idea-outer-loop-story-map.spec.js`, `dsh-s4-resume-conversation-survives-restart.spec.js`) — now confirmed passing on the merged commit's real CI run (`Scenario A E2E (staging)` and `Scenario B E2E (staging)` both SUCCESS). Residual risk now closed.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | None identified per the story's own NFR section |
| Security | ✅ N/A | None identified per the story's own NFR section |
| Accessibility — flag markers must not rely on colour alone | ✅ | Every render site emits a text label (`⚑ May need review`) alongside the `sn-step--flagged` class, confirmed by direct HTML assertion in Task 3's and Task 5's tests, not just a passing test name |
| Audit — flag-set and flag-cleared events logged with journeyId, stage name, timestamp | ✅ | `materiality_flag_set` (one per downstream stage, Task 2) and `materiality_flag_cleared` (Task 4) PostHog events, both confirmed via tests asserting `journeyId`/`stageName`/`timestamp` are present on every event — this is the res-s4 portion of the feature-level `NFR-audit-logging-reopen-flow` guardrail shared with res-s1/res-s2/res-s3 |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Earlier-stage revisions completed without a journey restart | ✅ (0% — capability didn't exist) | Not yet — res-s4 is the last of M1's three contributing stories (res-s1, res-s2, res-s4), so the full reopen→revise→persist→act mechanism is now genuinely complete end-to-end in the merged codebase. But M1 tracks *real, non-test usage* ("at least 1 real usage per week once live in beta") — no real operator usage has occurred since this PR merged moments ago, so there is nothing to measure yet. The mechanism being complete is a precondition for measurement, not a measurement itself. |
| M2 — Materiality-suggestion acceptance rate | ✅ (not yet established — feature didn't exist) | Not yet — res-s4 completes M2's second contributing story (after res-s3), closing the mechanical suggestion→choice→paired-log loop end-to-end. Requires ≥10 genuine suggestions logged from real usage before a signal is meaningful; none have occurred yet. |
| M3 — Recurrence of the original blocking pain | ✅ (2 known occurrences: Hamish, Abhi) | Not yet — res-s4 is the last of M3's three contributing stories. No new occurrence of the original blocking pain has been reported since res-s1 merged, consistent with res-s1's and res-s2's DoD notes — still a preliminary, not-yet-statistically-meaningful positive signal, not a measurement. |

**Measurement-ready gate:** Not yet, for all three metrics — recorded per the skill's `not-yet-measured` path rather than asking for premature signal values. This is the first DoD checkpoint in this feature where all three metrics' `contributingStories` are fully merged, but "the mechanism is complete" and "real usage has been observed" are different conditions — only the first is true today. Per each metric's own `feedbackLoop`, the metric owner should begin watching for real usage now that the full feature is live in the codebase.

---

## Outcome

**COMPLETE**

This is the last story in the `revise-earlier-stage` feature (`res-s4`'s own Dependencies section: "Downstream: None — closes the epic"). All 4 stories (res-s1, res-s2, res-s3, res-s4) are now DoD-complete.

**Follow-up actions:**
1. Not blocking, but worth tracking: AC4's documented scope boundary (flags on never-reached downstream stages have no resolution path until first reached) — RISK-ACCEPTed with a revisit trigger tied to live M2 acceptance-rate data (`decisions.md`, 2026-08-29, finding O2).
2. `/improve` candidate: this story's own delivery is a second, independently-arrived-at data point (after res-s3) that per-task review cannot catch cross-task integration gaps — and a *new* sub-pattern within that: even a DoR contract correction that correctly widens scope from "one render site" to "check for multiple render sites" can still under-count them if the search stayed scoped to one file/module rather than a repo-wide grep for the shared component. The final cross-task review's value is specifically in re-asking the scoping question with no assumed boundary. Worth strengthening `/definition-of-ready`'s Contract Proposal step to require a repo-wide grep of any shared render component being modified, not just the sites the contract happens to name.
3. `/improve` candidate: round 2 of final review found that a fix confirmed correct by its own render-logic tests (F1/Task 5) could still fail the realistic user-action sequence that motivated it, because "the render logic is correct" and "the browser actually re-runs that render logic after the user's action" are different claims. Worth adding an explicit instruction to `/subagent-execution`'s final-review step: when a fix adds UI feedback for a specific user action, trace the actual action sequence (click → expect visible result on THIS page), not just a fresh-page-load test.
4. Not a res-s4 finding, but discovered during this story's own route/handler E2E coverage check: `tests/e2e/dsda-s1-default-all-stories.spec.js` has a genuine, pre-existing, unrelated failure (a gate-confirm redirect after the `definition` stage lands on the wrong page) — confirmed via a clean baseline worktree comparison, not assumed. Recommended as a dedicated short-track story; see `decisions.md`, 2026-08-29.
5. Not blocking, but worth tracking: `tests/check-p3.5-validate-trace.js` was RISK-ACCEPTed as a pre-existing flake at branch-setup for all 4 stories in this feature (4/4 recurrence rate) — a dedicated short-track story to root-cause and fix it was recommended at res-s4's own branch-setup (`decisions.md`, 2026-08-28) and remains open.

---

## DoD Observations

1. **The mandatory final cross-task review caught a real, otherwise-invisible AC1 gap for the second story in a row in this same feature** (after res-s3). The DoR contract correction had already found and correctly named two step-nav render sites in `journey.js` — but a third, structurally identical one in `skills.js`'s own chat page was missed, because the contract-correction search was scoped to the files it happened to be investigating rather than a repo-wide search for every place the shared `.sn-step` component renders. This is a genuinely different sub-pattern from res-s3's gap (zero consumers vs. an under-counted consumer set), found only because the final reviewer explicitly asked "where does `sn-step` render *anywhere* in the codebase" rather than checking the two sites the contract already named.

2. **A second round of final review — itself triggered specifically because the first round's fix had just been re-reviewed, not skipped — caught a gap the first round's own fix introduced.** Task 5's fix for finding #1 was correct render logic, verified by tests that render the page fresh. But the realistic operator action (click the flag button, stay on the same page) never re-ran that render logic — the marker was correct in theory and invisible in practice until a reload. This is the clearest evidence in this feature that "the fix's own tests pass" and "the fix satisfies the user-facing behaviour that motivated it" are different claims, and that re-reviewing a fix with the same rigor as the original implementation (not treating a fix as self-evidently complete) is worth the cost.

3. **A vacuous test was self-caught during the round-2 fix's own construction, before being trusted.** The first version of a test asserting "the server emits a `data-stage-id` attribute" checked the whole file's source text for the string — which would have passed even if the server-side emission were removed, because the same string also legitimately appears in the client-side code that *consumes* it. Caught by mutation-testing the test itself (removing the server-side attribute and confirming the test should fail, finding it didn't), then rewritten to assert directly against rendered HTML output instead of file-wide source search. This is the same "verify a test's claimed reason for passing, not just that it passes" discipline already established in this session for security-relevant guard tests, now shown to matter for ordinary feature tests too.

4. **Independent mutation testing was used repeatedly and personally re-run, not just trusted from a subagent's report**, across all three corrective rounds (Task 5's F1 and O1 fixes, Task 5b's N1 fix) — each fix's corresponding test was confirmed to fail when the fix was reverted, and to pass again when restored, by the orchestrating session directly.

5. **The route/handler E2E coverage check found a real, pre-existing, unrelated defect** (`dsda-s1-default-all-stories.spec.js`'s gate-confirm redirect) that could easily have been misattributed to this story's own changes had it not been independently confirmed against a clean baseline worktree at res-s4's own merge-base. This is the same "verify before claiming pre-existing" discipline already established in this feature for the `check-p3.5-validate-trace.js` flake, now applied to an E2E-level failure rather than a unit-test flake.

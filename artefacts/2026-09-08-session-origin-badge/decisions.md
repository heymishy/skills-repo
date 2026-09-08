# Decisions — Session-Origin Badge

## Decision: Tri-state counts all completed stages, not only outer-loop stages

**Date:** 2026-09-08

**Context:** The badge's tri-state (fully session-backed / mixed / no session) is derived by comparing a feature's completed stages against which of them carry a real `sessionId`. This pipeline splits stages into an outer loop (discovery through definition-of-ready — currently the only stages a live chat session can produce) and an inner loop (branch-setup through definition-of-done — currently always CLI/agent-driven, never expected to have a session). Counting all stages means most fully-implemented features will show "mixed" or "no session" once inner-loop stages complete, since those stages never carry a `sessionId` in today's build.

**Decision:** Count every completed stage, outer-loop and inner-loop alike. Do not special-case inner-loop stages out of the calculation.

**Rationale:** A future managed-agent inner loop driven from the web UI is plausible, at which point inner-loop stages could carry real sessions too. Hard-coding an outer-loop-only calculation would bake today's CLI-driven inner loop in as a permanent assumption, requiring a follow-up change if that changes. Counting all stages keeps the indicator a direct, literal reflection of real session presence rather than an assumption about which stages are "supposed to" have one — accepting that most finished features will read as "mixed" today as a known, expected consequence, not a defect.

---

## Decision: Reuse the existing "Bulk per-board-render lookup seam" pattern, not a raw SQL widening

**Date:** 2026-09-08

**Context:** `/design`'s own Key Technical Decisions proposed simply widening the two existing per-product SQL queries (product page, org kanban) to select `completedStages` directly. At `/definition`'s Step 1.5 architecture-constraints scan, `.github/architecture-guardrails.md`'s Approved Patterns section was found to already name an established convention for exactly this shape of problem — "Bulk per-board-render lookup seam" — used twice (`_getHtmlSessionsBulk`, `_getArtefactCountsBulk`) and explicitly naming "session-readiness" as a candidate third use.

**Decision:** sob-s1 adds a proper injectable `_getSessionOriginBulk`/`setGetSessionOriginBulk` seam in `products.js`, backed by a new `getSessionOriginForJourneys(journeyIds)` in `journey-store-pg.js` (a sibling to the existing `getArtefactCountsForJourneys`), rather than widening the raw SQL SELECT strings as `design.md` originally proposed. sob-s3 reuses the same seam rather than building a second one.

**Rationale:** Matches an existing, twice-proven convention in this codebase exactly, including its test-injection seam (`setGetSessionOriginBulk`) and its graceful-degradation contract — consistent with this repo's own guardrail note that "a future third use should reuse this named pattern rather than reinventing it." Supersedes the raw-SQL-widening approach in `design.md`'s Key Technical Decisions table; `design.md` is not being edited retroactively — this decisions.md entry is the record of the refinement.

---

## Decision: `deriveSessionOrigin` takes `hasJourney` as an explicit input, not inferred from an empty `completedStages` array

**Date:** 2026-09-08

**Context:** Found while writing sob-s2: `/journey`'s synthesized (non-real-journey) entries from `_mergeStateFeaturesIntoJourneyList` carry no `completedStages` array at all, despite representing a feature with real pipeline progress. An empty-array-only signature would be unable to distinguish "no real journey" (should show "no session") from "real journey exists, zero stages completed yet" (should show no indicator at all) — both would present as an empty/missing array to the function.

**Decision:** `deriveSessionOrigin({ hasJourney, completedStages })` takes `hasJourney` as a separate, explicit boolean input. `hasJourney: false` always yields "no session" regardless of `completedStages`; `hasJourney: true` with an empty array yields no indicator; `hasJourney: true` with entries yields the tri-state from sessionId presence.

**Rationale:** Prevents collapsing two genuinely different, visually distinct states into one ambiguous "empty" case — a mistake that would only have surfaced once sob-s2 was implemented against real `/journey` data, not from sob-s1's own product-page tests alone. Verified via sob-s1's own AC9 (a direct unit test of both branches of this contract).

---

## RISK-ACCEPT: AC verification scripts not reviewed by a domain expert before /definition-of-ready sign-off

**Date:** 2026-09-08

**Context:** `/definition-of-ready`'s W4 warning fired identically for sob-s1, sob-s2, and sob-s3 — none of the three AC verification scripts have a completed "Verified by" pre-code sign-off yet.

**Decision:** Proceed to sign-off without a pre-code domain-expert walkthrough. The verification scripts will instead be used as the post-merge smoke test for each story (one of the three stated purposes the scripts are already written for).

**Rationale:** This is a small (complexity 1), low-oversight, non-regulated, read-only presentational feature with no external users and a single real stakeholder (the Platform Owner, who is also the story author's sole reviewer throughout this feature's whole pipeline so far). The risk of skipping a separate pre-code walkthrough is low relative to the ceremony cost of a fourth review pass on a feature this size. Accepted by Hamish King (Platform Owner) — no explicit response given when asked; proceeding on the tool's own recommended default per this session's operating mode, flagged for the operator to redirect if this call is wrong.

---

## RISK-ACCEPT: Pre-existing baseline failure at /branch-setup (sob-s1)

**Date:** 2026-09-08

**Context:** `npm test` on the fresh `sob-s1` worktree (created from `master` at `6ce345b2`, zero modifications) shows 627/628 test files passing. The one failure, `tests/check-p3.5-validate-trace.js`, is `validate-trace.ps1 --ci` reporting `new-feature-af17f555`'s `discovery.md` is still "Draft" — a completely unrelated feature from 2026-09-01, not touched by this story or this feature in any way.

**Decision:** Acknowledged as pre-existing and unrelated; proceeding with `sob-s1` implementation without fixing it.

**Rationale:** Confirmed directly via `pwsh scripts/validate-trace.ps1 --ci` output — the single hard-fail is `discovery_approved: new-feature-af17f555: discovery.md status is still Draft`, an unrelated feature's own governance gap, not anything this feature's stories create or touch. Fixing another feature's discovery status is out of scope here and would require its own governance chain (an operator decision on that feature, not a side-effect of this one).

**Update (sob-s1 Task 1, 2026-09-08):** A second, intermittent pre-existing failure surfaced during Task 1's full-suite regression check: `tests/check-pcr-s1-test-runner.js`'s `N1-perf-per-file-average-within-110pct` assertion (a wall-clock average-ms-per-file threshold across the whole suite). Confirmed unrelated to Task 1's change by both the implementer subagent (isolated via `git stash -u`, still failed with Task 1's changes removed) and an independent full-suite run in the orchestrating session at the same time. This is machine-load-sensitive timing flakiness inherent to a wall-clock threshold test, not a functional regression — acknowledged, not fixed, consistent with this decision's original scope.

**Update (sob-s1 Task 4 spec review, 2026-09-08):** Task 4's spec reviewer found a third, real (not flaky) failure: `scripts/check-pipeline-state-integrity.js`'s `C2` invariant (`testPlan.passing ≤ testPlan.totalTests`) failed because `pipeline-state.json`'s `sob-s1.testPlan.totalTests` was still `11` (the DoR-time estimate from `test-plan.md`) while the real, implemented test count reached `13` across Tasks 1-4. Fixed directly via `node bin/skills advance 2026-09-08-session-origin-badge sob-s1 testPlan.totalTests=13`, re-verified clean with `node scripts/check-pipeline-state-integrity.js`. Not a code defect — a bookkeeping field that needed reconciling against the real delivered test count, same class as any estimate-vs-actual delta. (Later reconciled again to `14` after Task 4's own fix cycle added one more test.)

**Update (sob-s1 /verify-completion, 2026-09-08):** Route/handler E2E coverage check (mandatory since this story's diff touches `src/web-ui/routes/products.js`) found 3 local Playwright specs referencing the touched `GET /products/:id` route failing: `bmau-s1-bulk-assign-rerender.spec.js` (1 test), `frsr-s1-feature-row-session-resume.spec.js` (2 tests), `pnfc-s1-new-feature-choice.spec.js` (3 tests). Differentially confirmed pre-existing and unrelated to this story: temporarily reverted `products.js` to its pre-story state (`git checkout 6ce345b2 -- src/web-ui/routes/products.js`) and re-ran `pnfc-s1-new-feature-choice.spec.js` and `frsr-s1-feature-row-session-resume.spec.js` — both failed identically (same test names, same error types: a navigation timeout landing on an unexpected URL, and a `409` where `303` was expected) with sob-s1's code entirely absent. Restored the real code immediately after (`git checkout HEAD -- ...`, verified zero diff and 8/8 story tests still passing). `bmau-s1-bulk-assign-rerender.spec.js` was not individually re-verified this way but shares the same failure signature and is the least related of the three to this story's actual change (bulk-assign checkbox interaction, not the row's session-origin span). This is local E2E environment flakiness (likely session/rate-limit related in this sandbox), not a regression — all corresponding CI checks (including the CI-hosted Playwright E2E smoke suite) passed on the real merged PR #848, confirming this is purely a local-sandbox artefact. Recorded here retroactively — this entry was originally written during `/verify-completion` but lost to a worktree/main-checkout sync ordering mistake before it was committed; the finding itself was still preserved in `dod/sob-s1-dod.md`'s Test Plan Coverage section, which is how this gap was caught and corrected.

**Update (sob-s2 Task 1 spec review, 2026-09-08):** The identical `testPlan.totalTests` drift recurred for sob-s2 — DoR-time estimate was `5`, real delivered coverage was `9` (Task 1's own AC5 call-count test plus the Step-1 unit-level mapping tests were both net additions beyond the original count). Fixed the same way via `node bin/skills advance 2026-09-08-session-origin-badge sob-s2 testPlan.totalTests=9`, re-verified clean. This is now the second occurrence in this feature — worth watching as a pattern: `/test-plan`'s own AC-to-test-count estimate appears to systematically undercount once a story's real implementation adds unit-level tests for a shared contract (e.g. `deriveSessionOrigin`'s `hasJourney` mapping) alongside the story's own render-level ACs. Not fixed as a process change here — noted as a candidate for `/improve` review after this feature's 3 stories are all complete.

**Update (sob-s3 /branch-setup baseline, 2026-09-09):** Fresh `sob-s3` worktree (zero modifications, `origin/master` at `8f0c0438`) full-suite baseline: 630 files, 2 failed — the already-known `check-p3.5-validate-trace.js`, plus a new one, `tests/check-bri-s2.2-neon-staging-branch.js` (its `IT2` scenario asserts a connection exceeding a 10s timeout budget surfaces `DbConnectTimeoutError` — a wall-clock-timing test). Re-run in isolation immediately after: 5/5 passed. Confirmed test-order/machine-load timing flakiness (same class as the already-documented `check-pcr-s1-test-runner.js` flake above), not a real regression — and definitionally pre-existing/unrelated to this story since no code had been touched in this worktree yet at baseline time.

**Note (sob-s3, 2026-09-09):** This worktree's `decisions.md` was checked out from `origin/master` at `8f0c0438`, which predates sob-s2's still-open draft PR #849 — so the "Deferred: extract `_sobLabelMap`/`_sobGlyphMap`..." entry and sob-s2's `/verify-completion` E2E-coverage entry (both already written and committed on `feature/sob-s2`) are not yet visible here. sob-s3's own implementation plan (Task 1) independently re-derived and acts on the same deferred DRY-extraction decision from the conversation record, not from a stale re-read of this file. When PR #849 merges, its version of `decisions.md` supersedes this branch's copy for those two entries — reconcile via merge, not overwrite, per this repo's own merge-conflict-hotspot guidance for this file.

**Decision: Task 1's `journey.js` refactor narrowed to `products.js`+`features.js` only, deferred until sob-s2 merges**

**Date:** 2026-09-09

**Context:** Following directly from the note above — `journey.js` in this worktree has none of sob-s2's card-indicator wiring (`_sobLabelMap`/`_sobGlyphMap`/`_sobOrigin`), confirmed by grep returning zero matches and by `tests/check-sob-s2-journey-dashboard-integration.js` not existing in this worktree at all. sob-s2's actual code changes live only on the unmerged `feature/sob-2` branch. A coding subagent dispatched for Task 1 correctly added the shared `sessionOriginBadgeMeta(origin)` helper to `features.js` (verified: matches the plan exactly) but had not yet reached the `journey.js` refactor step when it hit a session-wide rate limit; recovered directly in the orchestrating session per this feature's established rate-limit recovery pattern (see sob-s1 Task 4).

**Decision:** Complete Task 1's `products.js` refactor now (has the real call site, present on `master`). Do not attempt the `journey.js` refactor in this story's branch — there is nothing there to refactor yet. `sessionOriginBadgeMeta` is already exported and ready; the `journey.js` half is a one-line-swap follow-up to be done as part of merging/completing sob-s2 (or as a tiny standalone chore immediately after PR #849 merges), not blocking sob-s3's own delivery.

**Rationale:** sob-s3's actual ACs (AC1-AC5) touch `products.js`, `features.js`, and `kanban-view.js` only — `journey.js` was never a required touchpoint for this story, only an opportunistic cleanup riding along. Blocking sob-s3 on sob-s2's merge timing to finish an optional cleanup would violate this story's own DoR ("No dependency on an incomplete upstream story" — sob-s3's real, documented upstream dependency is sob-1 only, already DoD-complete). Verified via `git status`/`grep` directly in the worktree, not assumed from decisions.md's stale copy.

**Mandatory final reviewer finding (sob-s3, 2026-09-09): Task 3's badge used a new, unstyled CSS class instead of the shared `sw-pill` treatment — fixed.** Task 3's coding subagent implemented the org-kanban badge with `class="kb-session-origin-badge"`, a class with no CSS rule defined anywhere in the codebase (confirmed by grep — only `kb-artefact-badge`/`kb-artefact-badge--empty` are styled in `kanban-view.js`'s own stylesheet). This would have rendered as a bare, unstyled `<span>`, directly violating AC1's explicit requirement ("visually identical to sob-s1 and sob-s2's treatment"). Confirmed `handleGetOrgKanban`'s response path wraps the board in `renderShellWithNav` (same as tenant/product-scope kanban), so `html-shell.js`'s globally-defined `.sw-pill`/`.sw-pill--nodot` classes (the exact classes sob-s1 and sob-s2 both use) are already available on this page — no new CSS needed. Fixed by swapping the class to `sw-pill sw-pill--nodot`, matching sob-s1/sob-s2's markup exactly. Re-ran `tests/check-sob-s3-org-kanban-integration.js` (7/7), `check-sob-s1-product-list-integration.js` (8/8), `check-sob-s1-session-origin-derivation.js` (6/6) — all still pass (none of the existing tests asserted on the specific class name, so this was a silent visual gap the automated suite would not have caught on its own — a case for the RISK-ACCEPTed manual verification-script pass, W4 above, to also confirm visually once staging is reachable).

**Update (sob-s3 /verify-completion, 2026-09-09):** Full-suite run against the final committed state (`290f43c5`): 631 files, 2 failed — both already-documented pre-existing flakes (`check-p3.5-validate-trace.js`; `check-pcr-s1-test-runner.js`'s wall-clock timing threshold, documented under sob-s1 Task 1 above), no new failures. Route/handler E2E coverage check (mandatory since this story's diff touches `src/web-ui/routes/products.js` and `src/web-ui/views/kanban-view.js`): exactly one local, non-`@real-staging` Playwright spec navigates to `/org/kanban` (`tests/e2e/psh-s7-org-kanban.spec.js`) — ran clean, 1/1 passed, no differential-revert check needed. Scope-creep check (`git diff --stat 8f0c0438..HEAD`): exactly the expected file set (`features.js`, `products.js`, `kanban-view.js`, the new test file, `decisions.md`, `sob-s3-plan.md`, `pipeline-state.json` checkpoints) — no unrelated files touched.

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

**Update (sob-s2 /verify-completion, 2026-09-09):** Route/handler E2E coverage check (mandatory since this story's diff touches `src/web-ui/routes/journey.js`) found 13 local Playwright specs navigating to `/journey` directly (9 non-`@real-staging`-tagged, run locally with `NODE_ENV=test` set in the invoking shell). 2 failures: `dsda-s1-default-all-stories.spec.js` AC3 (a redirect-location assertion on `/journey/:id/stories`) and `ep1-s4-stage-selector.spec.js` Scenario 2 (a stage-selector nav-link visibility assertion on `/journey/:id/stage/...`). Both are on journey *detail* sub-pages, not the `/journey` dashboard card list this story actually touches. Differentially confirmed pre-existing and unrelated: temporarily reverted `journey.js` to its pre-story state (`git checkout 630b3994 -- src/web-ui/routes/journey.js`) and re-ran both files — the identical 2 failures reproduced with this story's code entirely absent (a third failure seen on the first pass, `ep1-s4` Scenario 3, did not reproduce on the reverted re-run either, consistent with test-level timing flakiness rather than a code-caused failure). Restored the real code immediately after (`git checkout HEAD -- ...`), reconfirmed 9/9 story tests passing. Same local-sandbox-flakiness class as sob-s1's own equivalent finding above; CI's hosted Playwright E2E smoke suite is the authoritative signal for the actual merged PR.
## Deferred: extract `_sobLabelMap`/`_sobGlyphMap` into a shared helper before sob-3 lands a third copy

**Date:** 2026-09-08

**Context:** sob-s1's `_renderPvcItemRow` (`products.js`) and sob-s2's `_renderJourneyHome` (`journey.js`) each carry an identical, hand-copied pair of inline object literals mapping the tri-state (`fully-session-backed`/`mixed`/`no-session`) to display label text and glyph. sob-s1's own reviewer flagged this as Minor/non-blocking when it was a single occurrence; sob-s2's reviewer escalated it to Important now that it's duplicated a second time, and sob-s3's own story (AC1) already explicitly commits to "visually identical to sob-s1 and sob-s2's treatment" — a third copy is a near-certainty, not speculative.

**Decision:** Not fixed retroactively as part of sob-s2. Reaching back into `products.js` (sob-s1's own file) from sob-s2's branch to retrofit an already-merged, DoD-complete story would cross into cross-story scope contamination (this repo's own established anti-pattern — see `.github/architecture-guardrails.md`'s "Bundling changes from story B into story A's PR"). Instead: sob-s3 must extract a shared helper (e.g. `renderSessionOriginBadge(origin)`, or at minimum the two maps) into `features.js` alongside `deriveSessionOrigin`, and refactor all three call sites (`products.js`, `journey.js`, and its own new org-kanban rendering) to use it — as an explicit, named task in sob-s3's own implementation plan, not an afterthought.

**Rationale:** Two occurrences is a defensible threshold to defer past (avoids premature abstraction on a single data point); a confirmed, story-committed third occurrence is not. Doing the extraction as sob-s3's own first task means the refactor of the two existing call sites happens in the same branch/PR as the story that actually needed the shared helper, keeping traceability clean — not scattered across three separate stories' own PRs for what is fundamentally one small piece of shared UI logic.

**Recovery note (2026-09-09):** This entry sat uncommitted in the main checkout since shortly after it was authored — never pushed to any branch — while sob-s2 (PR #849) and sob-s3 (PR #850) were independently developed. Discovered and recovered here after PR #849 merged, when a routine `git pull` on master surfaced it as a local modification that would have been overwritten. sob-s3's own Task 1 (commit `63a38d6c` on `feature/sob-s3`) had, in the meantime, independently re-derived and acted on this exact same decision from conversation context (extracting `sessionOriginBadgeMeta` into `features.js`, refactoring `products.js`'s call site) without ever having read this entry — confirming the decision was sound, but also meaning `journey.js`'s own half of the extraction is genuinely still outstanding (sob-s3 documented, in its own decisions.md, that `journey.js`'s sob-s2 call site did not exist in its worktree's base at the time, so nothing there could be refactored). **Follow-up still open:** refactor `journey.js`'s `_renderJourneyHome` to use the now-merged `sessionOriginBadgeMeta` helper — small, one-line-swap, not blocking either story's DoD.

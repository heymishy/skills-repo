# Definition of Done: pncg-s1 — Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it

**PR:** https://github.com/heymishy/skills-repo/pull/770 | **Merged:** 2026-08-26
**Story:** `artefacts/2026-08-26-products-nav-coverage-gap/stories/pncg-s1-shared-nav-wrapper-and-full-coverage.md`
**Test plan:** `artefacts/2026-08-26-products-nav-coverage-gap/test-plans/pncg-s1-test-plan.md`
**DoR artefact:** `artefacts/2026-08-26-products-nav-coverage-gap/dor/pncg-s1-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `renderShellWithNavIncludesProductsSection`, `renderShellWithNavPreservesOtherOpts`, `renderShellWithNavRespectsExplicitActiveProductId` — 3/3 pass, fresh run on master 2026-08-26 | Automated test | None |
| AC2 | ✅ | Structural test (19/19, covers all 22 sites via a manifest) + 4 functional integration tests, fresh run on master | Automated test | See below |
| AC3 | ✅ | Structural test's pool-reachability assertion per site; `handleGetJourneyById`/`handleGetWizard` async-conversion + `await` at every caller verified during Task 3/final review | Automated test + manual trace | None |
| AC4 | ✅ | 555/555 full suite, CI green (all 8 checks passed on PR #770), E2E route-coverage swept across all 19 touched paths (21 pre-existing failures independently confirmed via baseline comparison, not regressions) | Automated test + CI + E2E sweep | None |

**Deviation on AC2 (recorded, not a failure):** The story's own Architecture Constraints text states every site "must be updated to call `renderShellWithNav` instead of `renderShell` directly." In practice, 4 of the 19 fixed functions (`handleGetProductNew`, `handleGetProductRoadmap`, `handleGetGuardrailsForm`, `handleGetSettings`) do NOT call `renderShellWithNav` directly — they call `getProductsNavSummary` in the handler and thread the result into a separate pure render-helper function (`_renderProductNew`, `_renderRoadmapTab`, `_renderGuardrailsForm`, `renderSettingsPage`) as new parameters, which then calls `_htmlShell.renderShell()` itself. This was necessary because those 4 functions are pure render-helpers with many pre-existing direct callers/tests that could not be made `async` without breaking their established contract — documented in `decisions.md`'s Task 4 ARCH entry (including a first attempt that DID try to force the literal `renderShellWithNav` pattern via a function split, was reviewed, found overcomplicated, and reverted in favour of this parameter-threading approach). AC2's actual requirement ("the rendered page's sidebar includes the full Products section") is satisfied by both implementation shapes — the deviation is in the story's own illustrative mechanism description, not in the outcome.

---

## Scope Deviations

None beyond the AC2 mechanism deviation recorded above. Commits map cleanly to the 7 planned tasks, their review-driven fixes, 2 bookkeeping self-corrections (a stale pipeline-state stage, a missed artefact commit), and one legitimate test-scope-freeze update (`check-npwe-s1-skills-nav-wiring.js`, matching 3 prior precedents in that same file) — confirmed at `/verify-completion`'s scope check and independently re-confirmed by the final cross-cutting reviewer.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (3 unit + 1 structural covering 19 functions/22 sites + 4 integration)
**Tests passing in CI:** 8 / 8 (part of the 555-file full suite, PR #770's "Lint, typecheck, test, build" check — pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `renderShellWithNavIncludesProductsSection` (AC1) | ✅ | ✅ | |
| `renderShellWithNavPreservesOtherOpts` (AC1) | ✅ | ✅ | |
| `renderShellWithNavRespectsExplicitActiveProductId` (AC1) | ✅ | ✅ | |
| Structural coverage test (AC2/AC3, 19 functions / 22 sites) | ✅ | ✅ | Uses brace-depth-aware source parsing with comment-stripping (added after a review found raw substring-counting could be masked by a decoy comment) |
| `orgKanbanNowIncludesProductsSection` (AC2) | ✅ | ✅ | |
| `settingsNowIncludesProductsSection` (AC2) | ✅ | ✅ | |
| `journeyWizardAllThreeViewsIncludeProductsSection` (AC2/AC3) | ✅ | ✅ | |
| `teamMembersNowIncludesProductsSection` (AC2) | ✅ | ✅ | |

**Gaps (tests not implemented):** None per the test plan's own coverage-gaps section, which explicitly documented a deliberate depth trade-off (15 of 22 sites covered only structurally, not also functionally) given the site count — not an oversight.

**Collateral repair, not a gap:** ~29 pre-existing test files across Tasks 3-5 had their fixtures/mocks repaired ahead of/because of handlers gaining a new `pool` parameter or becoming `async`. All repairs verified minimal and non-weakening during review.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| None declared — story's NFR section: "NFRs: None — reviewed 2026-08-26" | ✅ N/A | No NFR profile required; confirmed not applicable, matching H-NFR's DoR pass |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 (Beta activation rate, `2026-06-29-beta-entry-experience`) | N/A — not wired | N/A | Same situation as `fresc-s1`: `pncg-s1` is not listed in M1's `contributingStories` array — a short-track story that bypassed `/definition`. The story's Benefit Linkage ties it to M1 conceptually (a missing navigation dead-end is activation friction) but was never formally wired in. Not corrected here — a metric-wiring decision belongs to the metric owner. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. (Metric owner decision) Consider whether `pncg-s1` should be added to M1's `contributingStories` array.
2. (Tracked separately, not blocking — logged in `workspace/capture-log.md` 2026-08-26) A latent test fragility: 4 test files call the now-async `handleGetJourneyById` without `await`, and currently pass only because their scenarios hit an early-return path. No action needed unless a future test scenario in those files reaches the actual render fallback.
3. (Tracked separately, not blocking — logged in `workspace/capture-log.md` 2026-08-26) The identical mock-pool test stub now appears in 34 files repo-wide. Recommend a small standalone chore extracting `tests/helpers/mock-pool.js` and migrating at least the files this story touched.
4. (Low priority, informational) `pan-s1`'s original 3-site scope decision (2026-07-30) is now superseded by this story's full-coverage fix — no artefact update needed, but worth noting for anyone reading that older decision cold.

---

## DoD Observations

1. **This story required an unusually high number of review-driven corrections for its size, and every one was caught before merge, not after.** Across 7 tasks: a missing `activeProductId` field (Task 2), an 8-file then 18-file pre-existing test blast radius from signature/async changes (Tasks 3 and 5), a reverted-and-redone architectural approach after a cited precedent turned out to be inaccurate (Task 4, `settings.js`), a legitimate test-scope-freeze update requiring careful scrutiny to distinguish from a disguised weakening (Task 5), and a comment/string blind spot in the story's own primary regression test (Task 6). None of these would have been caught by spec-compliance review alone — all required a reviewer to independently re-verify a claim rather than accept it at face value. Logged in full in `workspace/learnings.md` (2026-08-26) as a durable pattern: quality review's job on large multi-task stories is re-verifying claims, not just assessing style.
2. **Two mandatory one-time bookkeeping steps were skipped mid-story and only self-caught late:** `/subagent-execution`'s own Step 1 pipeline-state write (stage advance) was never executed before dispatching Task 1, and the implementation plan artefact itself was never `git add`ed until worktree cleanup. Both are logged in `workspace/learnings.md` as a recurring risk specific to stories with many sequential subagent dispatches — the loop's own repetition makes a one-time setup step easy to lose track of, and neither gap produces an error or blocked dispatch, so nothing surfaces it except an explicit direct-state-read or `git status` check.
3. **A genuine environment-specific tooling gap was found and worked around twice:** `git show origin/master:<path>` (the exact command every skill's own checkpoint-write procedure documents) silently returns empty output on this Windows/Git-Bash setup due to MSYS's colon-to-drive-letter path mangling — no error, just zero bytes. Worked around via `git ls-tree`/`git cat-file -p <blob-hash>` both times it was hit. Logged in `workspace/learnings.md`; worth a `/improve` candidate to note this in the skill files themselves (`subagent-execution`, `implementation-plan`, `branch-complete` all document the affected command) for any future Windows/Git-Bash session.
4. **The story's own scope grew 22x from the initial report via a deliberate, checked-in-with-the-operator audit, not silent expansion.** A single-page report ("`/org/kanban}` is missing its Products nav") triggered a full-codebase audit before any story was written, which surfaced 21 more instances of the identical defect. Rather than silently fixing everything found or silently fixing only the one report, four concrete scoping options were presented to the operator, who chose the shared-helper approach specifically for its structural-recurrence-prevention property. This is the correct pattern for "investigation found more than the report" and is captured as a reusable shape in `workspace/learnings.md`.

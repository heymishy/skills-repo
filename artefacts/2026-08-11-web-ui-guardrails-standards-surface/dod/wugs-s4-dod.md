# Definition of Done: Show org-level guardrails/standards even when a product has no connected repo

**PR:** https://github.com/heymishy/skills-repo/pull/729 | **Merged:** 2026-08-13
**Merge commit:** a46f7360
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s4-no-connected-repo-fallback.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s4-no-connected-repo-fallback-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s4-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: handleGetGuardrailsView_noConnectedRepo_showsDistinctConnectPrompt` asserts the prompt text appears AND `wugs-s2`'s "None found in this repo" copy is absent — textually distinct, not a near-duplicate | automated test (`tests/check-wugs-s4-no-connected-repo-fallback.js`) | None |
| AC2 | ✅ | `AC2: handleGetGuardrailsView_noConnectedRepo_orgSectionStillRenders` asserts real org content renders alongside the prompt — the page isn't blocked | automated test | None |
| AC3 | ✅ | `AC3: handleGetGuardrailsView_connectPrompt_linksToRealConnectionFlow` asserts the exact `/products/{id}` href; a companion wiring test confirms `handlePostConnectRepo` is unmodified | automated test | None |
| AC4 | ✅ | `AC4: handleGetGuardrailsView_repoConnectedAfterFallback_showsNormalContentNextLoad` calls the handler twice with a repo connection simulated between calls — asserts the fallback is gone and real content shows on the second call, no stale state | automated test | None |

All 7 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-13: `7 passed, 0 failed`. Sibling stories `wugs-s2` (11/11), `wugs-s3` (12/12), `wugs-s5` (13/13), `wugs-s6` (18/18), `wugs-s7` (8/8) re-confirmed unaffected.

**No deviations on the 4 ACs themselves.**

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review of the merged PR: the diff touches only `src/web-ui/routes/products.js` and the new test file — `server.js` and the repo-connection adapters/routes are completely untouched, confirming the "changes to the repo-connection flow itself" Out of Scope item was respected (reused as-is). The prompt is rendered only inside `handleGetProductGuardrailsView` — no other UI surface gained an auto-prompt, respecting the second Out of Scope item.

One addition beyond the original 4-task plan, found during a code-quality review round and shipped in the same PR before merge: extracted a shared `_renderPromptBox` helper so this story's "connect a repo" prompt and `wugs-s3`'s existing "no org repo designated" prompt (a structurally identical heading+message+action shape) share one implementation instead of duplicating styling. Output HTML confirmed byte-identical for both callers; `wugs-s3`'s own regression suite re-verified unaffected. Also added a dedicated nav-sidebar-rendering test (modeled on `wugs-s2`'s own established precedent) proving the page shell still renders fully around the new fallback branch.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (plan baseline) + 1 NFR, plus 2 additional tests added during review rounds
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: distinct connect-a-repo prompt | ✅ | ✅ | 1 test |
| AC1-nav (review addition): nav sidebar still renders around the fallback | ✅ | ✅ | 1 test, modeled on `wugs-s2`'s AC5 precedent |
| AC2: org section still renders | ✅ | ✅ | 1 test, lock-in (passed on first try against Task 1's implementation) |
| AC3: prompt links to the real connection flow | ✅ | ✅ | 2 tests (href assertion + wiring test), lock-in |
| AC4: not sticky past repo connection | ✅ | ✅ | 1 test, lock-in |
| NFR-A11Y: real keyboard-accessible link | ✅ | ✅ | 1 test, lock-in |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none beyond `wugs-s2`/`wugs-s3`'s existing targets | ✅ (N/A) | No new performance surface; the fallback check is a single in-memory field check, no new query |
| Security — none new | ✅ (N/A) | Confirmed — no new routes, no new auth surface |
| Accessibility — real link/button, keyboard-accessible | ✅ | `NFR-A11Y` test asserts a real `<a href>` element, not a non-interactive `<div>`/`<span>` |
| Audit — none new | ✅ (N/A) | Confirmed — no new state-changing action, purely a read-path rendering change |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Yes, as of this story's merge.**

`m1` ("Guardrail/standard visibility in the web UI") — the metric's own target is "100% of active products... render a populated, correctly-delineated view." Without this story, any product without a connected repo would show a broken or degraded page instead of a correct partial view; this story closes that gap.

> **Guardrail/standard visibility in the web UI**
> Signal: not-yet-measured
> Evidence note: the fallback rendering is now code-complete and covered by tests proving it composes correctly with both wugs-s2 (product-level) and wugs-s3 (org-level), but no real usage signal exists yet — this requires a real tenant with an unconnected product to load the view.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%) | After a real tenant with an unconnected product loads the guardrails/standards view | Closes the "100% of active products render correctly" target's remaining gap for unconnected products |

---

## Outcome

**COMPLETE**

No deviations, no follow-up actions outstanding. All 4 ACs and the accessibility NFR are covered by differentiating tests, the review-driven shared-helper refactor is confirmed not to have regressed `wugs-s3`, and the final story-level review confirmed the complete end-to-end flow (no-repo fallback + org section + real connection link + non-stickiness) is coherent.

---

## DoD Observations

1. **This story's worktree branched from master after both `wugs-s3` and `wugs-s7` had already merged**, so — unlike the `wugs-s3`/`wugs-s7` pair earlier in this same session — no cross-story merge conflict arose here, despite this story also touching the same shared render pipeline (`handleGetProductGuardrailsView`, `_renderGuardrailsSection`'s neighbourhood). Confirms the pattern already noted in `wugs-s7`'s own DoD: sequencing a story's worktree creation after its shared-code siblings have already landed avoids that class of friction; the risk is specifically when two such stories' worktrees have overlapping lifetimes.
2. **Every code-quality review round on this story surfaced at least one real, legitimate finding** (Task 1's duplicated prompt-box markup, an Important finding, plus a Minor nav-coverage gap) — consistent with the pattern already observed across every other story in this feature this session (`wugs-s5`, `wugs-s6`, `wugs-s3`, `wugs-s7`). Continues to validate the two-reviewer-per-task discipline as earning its cost across a genuinely small, low-complexity story (Complexity Rating 1) as well as the larger ones — the finding rate doesn't appear to correlate with story size.
3. **A minor process wrinkle worth noting for future stories in this same feature:** because earlier tasks in this story ended with more committed tests than the plan's own literal per-task predictions (due to review-added tests), later tasks' dispatched implementers needed the expected test count corrected explicitly rather than trusting the plan's literal numbers — the plan's illustrative counts assume no review-round additions occurred in prior tasks, which is not the actual pattern this feature has shown. Tag as a `/improve` candidate: `/implementation-plan` could phrase per-task expected counts as relative ("N more than currently committed") rather than absolute, to survive review-round test additions without needing manual correction at dispatch time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Show org-level guardrails/standards even when a product has no connected repo.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Is the shared-helper refactor's effect on wugs-s3 (an earlier, already-merged story) clearly verified, not just asserted?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```

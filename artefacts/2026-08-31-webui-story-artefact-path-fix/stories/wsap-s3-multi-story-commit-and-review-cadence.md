## Story: Fix multi-story GitHub commit gating and remove redundant per-story review re-run

**Track:** Short-track (two real bugs found via live end-to-end web-UI verification, requested directly by the operator)
**Epic reference:** (none — direct continuation of `wsap-s1`/`wsap-s2` in the same feature folder)
**Domain:** web-ui

## User Story

As **an operator running a multi-story feature through the web UI's outer loop**,
I want **every story's test-plan and definition-of-ready artefacts to be committed to GitHub (not just the first story's), and review to run once per feature rather than being re-run before every story's test-plan**,
So that **no story's work is silently lost to the ephemeral container disk, and the pipeline's actual behaviour matches what CLAUDE.md documents and what an operator reasonably expects**.

## Problem (found via a live, operator-requested end-to-end proof, not a written AC beforehand)

Following `wsap-s2`'s own live verification (which confirmed per-story artefact *paths* were fixed), the operator asked to prove the full outer loop end-to-end on a fresh, small feature, specifically to catch anything `wsap-s2` alone might have missed. Driving a real 2-story feature through discovery → benefit-metric → design → definition → review → test-plan → definition-of-ready in production surfaced two further issues:

**Bug 1 — commit gating scoped by stage name alone, not per story.** Fly logs showed `artefact_auto_saved` firing correctly for `test-plans/ep1-s2-test-plan.md` and `dor/ep1-s2-dor.md` (proving `wsap-s2`'s path fix genuinely works), but no matching `artefact: commit` ever landed on `origin/master` for either file — only story 1's did. Root cause: `skills.js`'s `_existingStageEntry` check (`(completedStages || []).find(cs => cs.skillName === session.skillName)`) matches on `skillName` alone. `completedStages` entries carry no `storyId` field. So once story 1's test-plan completion pushes a `{skillName: 'test-plan', ...}` entry, story 2's own, genuinely-first, completion of "test-plan" finds that pre-existing entry and is incorrectly treated as a *revision* — skipping the GitHub-commit block entirely (`if (!_existingStageEntry) { ...commit... }`). This is the exact same root-cause *class* `wsap-s2` fixed for artefact paths (a per-feature concept applied where a per-story one was needed), now recurring in the commit-gating logic. It also fully explains why `new-feature-2b74a292`'s stories 2–13 never got their test-plan/DoR content committed even after `wsap-s2` shipped.

**Bug 2 — review re-run before every story, not documented anywhere.** The operator directly observed and asked about this: the live run showed `definition → review → test-plan(s1) → DoR(s1) → review (again) → test-plan(s2) → DoR(s2) → complete`. `journey.js`'s `PER_STORY_SEQ = ['review', 'test-plan', 'definition-of-ready']` treats review as a per-story stage, so every story's DoR completion looped back to a full feature-level re-review (re-running the review skill's own LLM call across every story again) before that next story could even start its own test-plan. This contradicts CLAUDE.md's own documented pipeline table — only `/test-plan`'s row is marked "(per story)"; `/review`'s entry condition is "Stories exist", implying a single pass. This redundant re-review is exactly what made a genuinely-progressing, correctly-terminating journey look like an infinite loop to the operator on `new-feature-2b74a292`.

## Fix

1. `src/web-ui/routes/skills.js`'s `_existingStageEntry` check: match on `(skillName, artefactPath)`, not `skillName` alone. `session.artefactPath` is already story-scoped for `test-plan`/`definition-of-ready` (via `wsap-s2`'s own fix), so this correctly distinguishes each story's own first completion from a genuine revision.
2. `src/web-ui/routes/journey.js`'s `PER_STORY_SEQ`: `['review', 'test-plan', 'definition-of-ready']` → `['test-plan', 'definition-of-ready']`. The `definition-of-ready` "more stories" branch now starts a `test-plan` session directly for the next story instead of calling `_startReviewSessionForJourney` again. Review's own two remaining entry points (the feature-level auto-start-after-definition transition, and the manual `/stories` submit path) are unchanged — review still runs, exactly once, covering every story in a single pass, matching CLAUDE.md.

## Acceptance Criteria

**AC1:** Given a mocked, product-linked feature with 2 stories, When story 1's `test-plan` completes (its own genuine first completion) followed by story 2's `test-plan` completing (also its own genuine first completion, but "test-plan" already has a `completedStages` entry from story 1), Then BOTH commits fire, each targeting its own distinct, story-scoped artefact path — story 2's is not silently skipped.

**AC2:** Given a journey mid-per-story-cycle where `definition-of-ready` has just completed for story 1 and `advanceToNextStory` returns a real next story, When `handlePostGateConfirm` processes this completion, Then the operator is redirected straight to a `test-plan` session for the next story — not a `review` session.

**AC3:** Given the existing regression suite for journey/story routing and GitHub-commit gating (8 files: `wsap-s1`, `wsap-s2`, `ougl6`, `ougl7`, `dtra-s1`, `dcuf-s1`, `csgc-s1`, plus the 17-file suite already covered by `wsap-s2`'s own DoD), When these fixes are applied, Then all pass — with `ougl7`'s own `T7.3` test updated to assert the new, intentional redirect target (`test-plan`, not `review`) rather than the old buggy behaviour.

**AC4:** Given a real production deploy of both fixes, When the operator continues driving stories on a real, already-in-progress feature (or a fresh one) through the outer loop, Then every story's test-plan/DoR artefacts commit to GitHub, and review does not re-run between stories. (Live-verified post-deploy, not automatable.)

## Out of Scope

- Any change to `completedStages`'s own data shape (adding a real `storyId` field) — the `(skillName, artefactPath)` match is sufficient and avoids a broader schema change.
- Recovering `new-feature-2b74a292`'s already-lost story content — still a separate, manual follow-up noted in `wsap-s2`'s own DoD.
- Auditing whether the review skill's own LLM output genuinely covers every story correctly in its single pass — assumed correct based on this session's own direct observation (`Review Report: ... All 13 stories have been reviewed and passed`), not re-verified here.

## NFRs

- **Cost:** removing the redundant per-story review re-run also removes 1 unnecessary full-feature review LLM call per story after the first — a real, if secondary, cost saving.
- **None else new.**

## Complexity Rating

**Rating:** 2 — two related but independently-testable fixes, both found and root-caused via direct live production investigation in the same session.
**Scope stability:** Stable.

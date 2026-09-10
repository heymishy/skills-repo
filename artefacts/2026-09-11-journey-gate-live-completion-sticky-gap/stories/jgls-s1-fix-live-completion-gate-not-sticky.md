# Story: The journey-gate "Continue to next stage" control is not sticky when it appears via a live turn completion

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the finding below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator resuming a feature from `/journey` and completing a stage's turn live**,
I want **the "Continue to [next stage] →" control to stay visible at the bottom of the viewport, exactly as it does on a page reload**,
So that **I don't lose the fix `wnl-s2` was supposed to deliver — the most common real path (clicking "Continue →" from the journey list) must behave the same as a direct page reload, not differently**.

## Benefit Linkage

**Metric moved:** M2 — Next-stage-action findability (`2026-08-31-web-ui-navigation-legibility`, already DoD-complete) — this story closes a gap found in that story's own shipped fix during live Chrome verification on `wuce-staging.fly.dev` (2026-09-11), immediately after `wnl-s2`'s PR merged.

**How:** `wnl-s2` added `position:sticky;bottom:0;...` to `.sw-journey-gate`'s inline `style` attribute in `src/web-ui/routes/skills.js`'s server-rendered `journeyPanel` construction (`_renderChatPage`, ~line 4593) — this is the path used when a browser loads/reloads the chat page for a session that is *already* `done`. Live verification found a second, separate code path: `showCommitLink()` (`skills.js` ~line 3822-3855), a client-side JS function that dynamically builds and appends the same "Artefact saved / Continue to [stage] →" control, used whenever a turn completes *live* via the SSE stream. `/journey/:featureSlug/resume` (the actual link every operator clicks from the journey list) always creates a **fresh** session and fires that stage's turn immediately — so the gate the operator actually sees, in the most common real usage path, is rendered by `showCommitLink()`, not the server-rendered `journeyPanel`. `showCommitLink()`'s `wrap.style.cssText` (line 3845) was never updated with the sticky properties, so the fix does not apply to the path most operators actually hit. Confirmed by reproducing both paths directly on staging: a direct reload of an already-done session's URL shows the gate with `position:sticky` correctly applied; two separate fresh `/resume` sessions (live-completed turns) both showed the gate with no sticky positioning.

## Architecture Constraints

- **Fix:** update `showCommitLink()`'s `wrap.style.cssText` (`skills.js` ~line 3845) to match `journeyPanel`'s `.sw-journey-gate` div's inline style exactly for the properties that matter to this story: `position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);z-index:500`. Keep `wrap`'s own existing `padding`/`display`/`align-items`/`gap`/`flex-wrap` properties unchanged — only add the missing positioning properties.
- **Consistency guard (why this bug shipped):** the two code paths duplicate the same visual control with two independently-maintained style strings. This story does not refactor them into one shared function (out of scope — a larger change than this fix warrants) but adds a test asserting the two style strings agree on positioning-relevant properties, so a future change to one without the other fails CI instead of shipping silently, as this one did.
- No change to `_renderChatPage`'s `journeyPanel` construction — that path is already correct (`wnl-s2`, merged).
- No change to `showCommitLink()`'s own trigger conditions, the sub-step affordance injection logic (`SUBSTEP_HTML`/`SUBSTEP_JS`), or the form's submit behaviour.
- **Out of scope, explicitly:** unifying the two gate-rendering code paths into a single shared template (a real, separate refactor opportunity — noted for `/improve`, not attempted here). This story is a minimal, targeted fix to the specific missing CSS properties.

## Dependencies

- **Upstream:** `2026-08-31-web-ui-navigation-legibility` (`wnl-s2`) — already DoD-complete, PR #857 merged. This story is a direct follow-up correction, not a new feature.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a skill session's stage turn completes live (via `/journey/:slug/resume` creating a fresh session and firing its initial turn, or any other live-completion path), When the "Continue to [next stage] →" control is injected into the DOM by `showCommitLink()`, Then the control's wrapping element has `position:sticky;bottom:0` applied (verified by computed style / inline style inspection), exactly matching the server-rendered path's behaviour.

**AC2:** (regression guard) Given the sticky properties are added to `showCommitLink()`'s `wrap.style.cssText`, When the control renders via the live-completion path, Then its existing content (form action, CSRF field, button text, "Artefact saved ✓" caption) and existing layout properties (`padding`, `display`, `align-items`, `gap`, `flex-wrap`) remain exactly as they were before this fix — only positioning is added, nothing else changes.

**AC3:** (consistency guard) Given both `journeyPanel`'s `.sw-journey-gate` style string and `showCommitLink()`'s `wrap.style.cssText` string exist in `skills.js`, When either is read from source, Then both contain the identical positioning-relevant substring (`position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);z-index:500`) — a test asserts this so future edits to one path without the other fail CI.

## Out of Scope

- Unifying the two gate-rendering code paths (`journeyPanel` and `showCommitLink()`) into a single shared function — a real refactor opportunity, logged as an `/improve` candidate, not attempted in this story.
- Any change to `wnl-s1`'s context-manifest collapse or `wnl-s3`'s dashboard entry point — both independently confirmed correct on staging during the same live verification pass that found this gap.
- Any change to the sub-step affordance (`SUBSTEP_HTML`/`SUBSTEP_JS`) injection logic.

## NFRs

- **Performance:** None material — a CSS-string addition to an existing client-side function, no new requests or computation.
- **Security:** None — no new input surface.
- **Accessibility:** No change — AC2 guards that the existing keyboard-accessible form/button markup is unaffected.
- **Availability:** None identified — fix to an already-live client-side rendering function.

## Complexity Rating

**Rating:** 1 — a single string-literal addition to an existing function, mirroring a change already made and verified correct in the sibling code path (`wnl-s2`). Root cause and fix are both precisely identified via live reproduction, not inferred.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

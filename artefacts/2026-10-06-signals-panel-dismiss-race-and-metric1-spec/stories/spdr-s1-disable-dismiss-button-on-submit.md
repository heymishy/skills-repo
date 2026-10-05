# Story: Disable the Dismiss/Undismiss button on submit to close a rapid-double-click race

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope is the real finding below, named as an `/improve` candidate in `artefacts/2026-10-04-signals-panel-triage-ux/dod/sptu-s3-dod.md`'s own DoD Observations (2026-10-06)
**Benefit-metric reference:** None — short-track skips benefit-metric; this is a UI robustness fix, no metric moved
**Domain:** [web-ui]

## User Story

As an **operator triaging signals quickly (clicking Dismiss in rapid succession)**,
I want **a second click on the same Dismiss/Undismiss button, made before the first click's page navigation has completed, to reliably do nothing**,
So that **rapid triage never risks a lost or duplicated dismiss action depending on click timing**.

## Benefit Linkage

No formal benefit-metric moved. Real finding: while performing `sptu-s3-dod.md`'s own real, live-timed Metric 1 measurement (2026-10-06), 2 of 12 "Dismiss" clicks were silently dropped because the click landed on the pre-navigation page, mid-unload, after a previous dismiss's full-page-reload form submission had already started. The eventual outcome was always correct (a retried click always succeeded, final dismissed-count independently verified as exactly 10), but this is real, observable, timing-dependent friction worth closing — named explicitly in `sptu-s3-dod.md`'s DoD Observations as a possible `/improve` candidate, not acted on at the time.

## Architecture Constraints

**Root cause, confirmed by direct code read:** `src/web-ui/views/signals-panel-view.js`'s `_dismissControl()` renders a plain `<form method="POST">` with a `<button type="submit">` (sptu-s4's own deliberate "zero client-JS, native keyboard focusability" design for AC6). A native form submit triggers a full-page navigation; if the same button is clicked again before that navigation completes, the browser's behaviour during the unload/navigate transition is unreliable (the second click can be silently dropped, or in principle could occasionally still fire a second POST) — timing-dependent either way, not a deliberate behaviour.

**The fix:** add a single `onsubmit` attribute to the form that disables its own submit button immediately on submit (`this.querySelector('button').disabled=true`). This does not change the first click's own submission (it has already fired by the time `onsubmit` runs) — it only guarantees a reliably-ignored second click during the in-flight navigation, replacing timing-dependent behaviour with deterministic behaviour.

**Compatible with sptu-s4's own AC6 (keyboard accessibility):** disabling the button only happens AFTER a legitimate submit has already occurred — it does not change tab order, focusability, or keyboard-operability of the first (only meaningful) activation. Confirmed by reading `sptu-s4.md`'s own AC6 text, which is about reachability/operability, not about preventing a disable-after-submit.

**Precedent for inline event-handler attributes in this codebase:** `chat-view.js` and `kanban-view.js` both already use inline `onclick="..."` extensively — this is an established, already-reviewed pattern in this app, not a new CSP/security consideration.

**Explicitly NOT the fix:** converting the dismiss control to a `fetch()`-based AJAX flow (like `kanban-view.js`'s `kbAdvanceCard`) — that is a much larger change to this control's own interaction model than this bug warrants, and would reopen sptu-s4's own deliberate "plain form" design decision for no real benefit (the native full-page-reload behaviour is otherwise correct and desired here).

## Dependencies

- **Upstream:** `sptu-s4` (`artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md`) — merged, owns `_dismissControl()`.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the Dismiss (or Undismiss) form has just been submitted, When its own submit button is clicked again before the resulting page navigation completes, Then that second click has no effect (the button is disabled, so no second form submission is attempted).

**AC2:** Given a signal has not yet been dismissed, When an operator clicks Dismiss exactly once (the common case), Then the dismiss proceeds exactly as before this fix — no behavioural change to the single-click path.

**AC3:** Given this repo's own real, existing `tests/check-sptu-s4-signals-dismiss.js` and `tests/check-wswda-s1-mkdir-before-write.js` suites, When this fix is applied, Then all pre-existing tests still pass unchanged.

**AC4:** Given an operator navigating by keyboard only (sptu-s4's own AC6), When they Tab to a Dismiss/Undismiss control and activate it with Enter/Space, Then it remains fully keyboard-operable exactly as before this fix.

## Out of Scope

- Converting the dismiss control to an AJAX/fetch-based flow (see Architecture Constraints — explicitly rejected).
- Any change to the CTA form (`<form action="/api/skills/.../sessions">`) in the same file — out of scope, not implicated by this finding.
- A generic "prevent double-submit" utility applied repo-wide to every form in this app — this fix is scoped to the one control where the real finding occurred; a repo-wide audit is a separate, larger piece of work not named as needed here.

## NFRs

- **Performance:** None — zero added network/render cost, a single DOM property write on an event that already fires.
- **Security:** None identified — no new input surface.
- **Accessibility:** Addressed directly — AC4 confirms no regression to sptu-s4's own AC6.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->

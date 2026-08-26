## Story: Show the /clarify and /estimate sub-step buttons live, not only after a page reload

**Epic reference:** None — short-track (bug fix, live gap found via direct operator usage on production)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator finishing the discovery or definition stage in a live conversation**,
I want to **see the "1a /clarify" and "1b /estimate" sub-step buttons appear as soon as the stage's last turn completes**,
So that **I use the actual dedicated controls the pipeline expects, instead of resorting to typing my answer inline in chat because the buttons never appeared**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-27) that after discovery's final turn completed in an open conversation, the "Before proceeding: 1a /clarify / 1b /estimate" buttons never appeared; they only rendered after leaving the page and resuming it. The operator worked around this by answering the estimate question inline in chat instead, and separately flagged the risk of the client/server going out of sync if a user keeps chatting past stage completion instead of using the dedicated controls.

**How:** Direct source inspection confirms the root cause. `routes/skills.js`'s chat-page-building function only emits the `subStepHtml`/`subStepJs` block (the sub-step buttons and their click handlers, ~line 4157-4239) when the **full page is server-rendered** with `session.done` already `true` (~line 4146: `if (session.done && session.journeyId)`). A fresh page load for an in-progress conversation renders with `session.done` still `false`, so this block is entirely absent from the page's initial HTML and JS. When the stage's last turn actually completes *live* (via the streaming `POST .../turn-stream` response, consumed client-side by `sendTurn()`'s `pump()` reader loop), the client-side code that reacts to `evt.done === true` calls `showCommitLink()` (~line 3512-3528) — but `showCommitLink()` only ever injects the *plain* "Continue →" gate-confirm form. It has no knowledge of `subStepHtml`/`subStepJs` at all, since those were written as part of the server-render-only code path and never extended to the live-update path. The two code paths independently implement "what to show when a stage is done" — one (full render) knows about sub-steps, the other (live update) doesn't.

## Architecture Constraints

- **Extract one shared function, don't duplicate the button markup a third time.** Add a small pure function (e.g. `buildJourneySubStepAffordance(skillName, journeyId)`) to `routes/skills.js`, returning `{ html, js }` for the exact markup/behaviour currently inlined in the full-render path's `if (skillName === 'discovery') { ... } else if (skillName === 'definition') { ... }` branches (~line 4157-4239). The full-render path is refactored to call this function instead of inlining the markup — a mechanical, output-preserving extraction, not a behaviour change.
- **Make the sub-step affordance's markup and click-handler functions available unconditionally on every page load, not just when `session.done` is already true at render time.** In the same unconditional script section where `GATE_CONFIRM_URL`/`NEXT_STAGE_LABEL` are already computed regardless of `session.done` (~line 2921-2923), add a `SUBSTEP_HTML` JS string constant (the shared function's `html` output, escaped for safe embedding in a JS string literal) and define `swLaunchClarify`/`swToggleEstimate`/the estimate-form submit handler as top-level functions in the same unconditional script block — not nested inside the conditionally-rendered `subStepJs` block. This means the click handlers exist on every page load, whether or not the sub-step buttons are visible yet.
- **`showCommitLink()` injects `SUBSTEP_HTML` before the plain gate-confirm form, matching the full-render path's visual order.** When `showCommitLink()` fires (the stage's last turn completing live) and `SUBSTEP_HTML` is non-empty, inject it into the DOM before appending the existing plain "Continue" form — then explicitly attach the estimate form's `submit` event listener to the freshly-inserted `#sw-estimate-form` element (page-load-time `addEventListener` cannot target an element that doesn't exist in the DOM yet).
- **The full-page-render path's own behaviour must not change.** A resumed/reloaded page for an already-done session must render byte-identical output to today (verified by the extraction being purely mechanical — same function, same inputs, same output).
- **No change for skills with no sub-step affordance.** For any `skillName` other than `discovery`/`definition`, `SUBSTEP_HTML` is empty and `showCommitLink()`'s existing plain-button-only behaviour is completely unaffected.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a live discovery conversation whose last turn just completed (via the streaming response, `evt.done === true`), When the client processes that event, Then the "1a /clarify" and "1b /estimate" buttons appear in the DOM without requiring a page reload.

**AC2:** Given the live-appeared "1a /clarify" button from AC1, When the operator clicks it, Then it triggers the same `/api/journey/:id/side-trip/clarify` POST and redirect behaviour as the already-working resume-rendered button.

**AC3:** Given the live-appeared "1b /estimate" button and form from AC1, When the operator fills it in and submits, Then it triggers the same `/api/journey/:id/estimate` POST behaviour, and the button's label updates to reflect success/error, matching the already-working resume-rendered version.

**AC4:** Given a live definition-stage conversation whose last turn just completed, When the client processes that event, Then the "4a /estimate" button (definition's narrower sub-step set — no clarify) appears live, matching the full-render path's existing per-skill logic.

**AC5 (regression guard):** Given a page load/resume of an already-done discovery or definition session (the existing, already-working full-render path), When the page renders, Then the sub-step buttons and the plain "Continue" button appear exactly as they did before this fix — byte-identical output, confirmed by the extraction being purely mechanical.

**AC6 (regression guard):** Given a live conversation for any stage with no sub-step affordance (e.g. benefit-metric, design, review, test-plan, definition-of-ready), When that stage's last turn completes live, Then only the plain "Continue" button appears — no empty or broken sub-step markup is ever injected.

## Out of Scope

- **Disabling the chat input after a stage is marked done.** Investigation found this is a pre-existing gap independent of this bug: even in the already-working resume path, a resumed already-done session's chat input remains fully typeable — nothing today prevents continuing to chat past stage completion, in either the live or resumed case. The operator's own "risk that the user continues inline chat... and UI gets confused" concern is real but broader than this story's scope (fixing it would need its own ACs covering both the live and resume paths, not just the live-rendering gap this story closes). Flagged as a follow-up.
- **The `/estimate` form's own validation or field set.** Unchanged — this story only fixes *when* the form becomes available, not its contents.
- **Any change to `das-s1`'s stage-completion or artefact-saving logic.** Unrelated — this story is purely about client-side DOM affordance timing.

## NFRs

- **Performance:** Negligible — `SUBSTEP_HTML` is a small, already-escaped string computed once per page render, same cost class as the existing `GATE_CONFIRM_URL`/`NEXT_STAGE_LABEL` computation.
- **Security:** None new — no new endpoint, no new user input path; the injected buttons call the same existing, already-CSRF-considered endpoints (`side-trip/clarify`, `estimate`) the resume-rendered buttons already call.
- **Accessibility:** No regression — injected markup is byte-identical to the already-existing full-render markup (same ARIA/semantic structure, none was WCAG-audited specially before, none introduced now).
- **Audit:** No existing audit-log call is affected.

## Complexity Rating

**Rating:** 2 — the extraction itself is mechanical and low-risk, but correctly wiring a dynamically-injected form's event listener (not present at page-load time) and verifying byte-identical full-render output requires care.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

## Story: Add the missing CSRF field to the in-chat "Continue to next stage" gate-confirm button

**Epic reference:** None — short-track (unconditional production bug fix; found while validating `cptr-s1` live on staging)
**Discovery reference:** None — short-track skips discovery; root cause confirmed directly via live browser testing on `wuce-staging`
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator running any skill session that belongs to a journey** (e.g. `/discovery` → benefit-metric),
I want **the in-chat "Continue to [next stage] →" button to actually submit successfully**,
So that **I can advance my journey to the next stage without hitting a blank "Forbidden" page every single time**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live on `wuce-staging` (2026-08-30, mocked LLM gateway) while validating an unrelated fix (`cptr-s1`): loading a `/discovery` session fresh, with zero idle time, and clicking "Continue to benefit-metric →" produced `403 Forbidden` immediately and reproducibly, every time, including on a freshly-reloaded page. This is NOT the `cptr-s1` suspend/timing race — it reproduces instantly, with no wait required.

**How:** `src/web-ui/routes/skills.js`'s `_renderChatPage` function (the `ougl.4` "journey-aware gate-confirm button" panel, ~line 4414-4447) builds the in-chat gate-confirm `<form>` with no `_csrf` hidden field at all:
```html
<form method="POST" action="/api/journey/.../gate-confirm" style="margin:0">
  <button type="submit" class="sw-btn sw-btn--primary">Continue to [next stage] →</button>
</form>
```
Confirmed via direct DOM inspection on the live staging page (`document.querySelectorAll('form[action*="gate-confirm"]')[0].outerHTML`) — no `input[name="_csrf"]` present. `handlePostGateConfirm` (`journey.js`, ~line 2169-2176) requires a matching `_csrf` field on every POST via `csrfGuard`; since this form never sends one, `csrfGuard` rejects every submission unconditionally. This affects every skill except `definition-of-ready` (whose own journey-complete affordance is a plain `<a href>` GET link, not a POST form, and is unaffected). A DIFFERENT gate-confirm form, in `journey.js`'s own `handleGetJourneyStageReview`-adjacent renderer (~line 729-732), correctly includes `_csrf.csrfField(await _csrf.generateCsrfToken(req))` — this story's fix makes the in-chat button consistent with that already-correct pattern.

## Architecture Constraints

- **Chosen approach:** `_renderChatPage`'s single call site (`skills.js` ~line 4509, inside an already-`async` enclosing function that already has `req` in scope) computes `var _csrfToken = await _csrf.generateCsrfToken(req);` before calling `_renderChatPage`, and passes the token value as a new parameter. `_renderChatPage` itself stays synchronous (no `async` needed) — it only needs the already-minted token string, not to call `generateCsrfToken` itself. Inside the `ougl.4` branch, embed `_csrf.csrfField(_csrfToken)` inside the form, matching `journey.js`'s own established pattern.
- **Do not make `_renderChatPage` itself `async`** — unnecessary, since it has exactly one call site and that caller can trivially compute the token beforehand. Keeps the diff minimal and avoids any risk of a missed `await` at a call site that doesn't exist today but might be added later.
- **Do not touch the `definition-of-ready` branch** (the plain `<a href>` link) — it's a GET navigation, not a form POST, and is not subject to CSRF protection by design (matches this codebase's own convention of only guarding state-changing POST/PUT/DELETE requests).
- **`_renderChatPage_forTest`** (destructured in `tests/check-dic1-story-cards.js` line 159) is confirmed dead/unused test scaffolding — it is not actually exported by `skills.js` today, and is never called anywhere. This story does not need to preserve or update it; do not resurrect it as part of this fix.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known. Distinct from and independent of `cptr-s1` (the suspend/timing race fix) — both fixes are real and both are needed, but neither depends on the other.

## Acceptance Criteria

**AC1:** Given a skill session that belongs to a journey (`session.journeyId` set) and is not `definition-of-ready`, When the chat page is rendered by `_renderChatPage` and `session.done` is true, Then the in-chat gate-confirm form includes a hidden `_csrf` input whose value matches the current session's CSRF token.

**AC2:** Given that form is submitted (a real `POST /api/journey/:journeyId/gate-confirm` with the embedded `_csrf` value), When `csrfGuard` validates it, Then the request passes CSRF validation — no more unconditional `403 Forbidden` on this button.

**AC3 (regression guard):** Given the `definition-of-ready` branch's plain `<a href="/journey/:id/complete">` link, When this story's fix is in place, Then that link is unchanged — no CSRF field added to a GET navigation link, no behavioural change to that branch.

**AC4 (regression guard):** Given the existing chat-page rendering tests (`check-dic1-story-cards.js`, `check-mfc2-chat-ux-improvements.js`, `check-icv-s1-ideate-canvas-turn2-render-fix.js`, `check-icrh-s1-ideate-canvas-resume-hydration.js`, `check-res-s4-operator-acts-on-materiality-suggestion.js` — the 5 files referencing `_renderChatPage` in any form), When re-run after this fix, Then all pass unchanged — none of them actually invoke `_renderChatPage` directly with a signature that would be affected by adding a new trailing parameter.

## Out of Scope

- **A broader audit of every other form in this codebase for the same missing-CSRF-field pattern** — scoped to this specific, live-confirmed instance. If the same pattern is found elsewhere later, that is a separate finding (worth a `/capture` entry recommending exactly this audit, given this is now the second real CSRF-field gap found in one session, after `cpr-s1`/`cptr-s1`'s own persistence-timing issue).
- **The `cptr-s1` suspend/timing race** — a real, separate, already-fixed issue; not touched by this story.
- **Adding automated coverage for the `@real-staging` reproduction itself** — the live browser reproduction that found this bug is not repeatable as an automated test without a real staging environment; the automated tests for this story verify the CSRF field is present and valid (AC1/AC2), which is the actual code-level guarantee.

## NFRs

- **Performance:** Negligible — `generateCsrfToken` is idempotent (reuses an already-minted token) for every session past its very first page render; this fix does not introduce a new Redis write on the hot path beyond what already happens on session creation.
- **Security:** This story CLOSES a security-relevant gap (CSRF protection wasn't actually protecting anything on this specific form, since it always failed and thus always resulted in it never being submitted in a way that reached the credential-carrying flow) — no new surface introduced, no regression risk.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — no new audit event; `csrfGuard`'s own existing pass/fail behaviour is unchanged.

## Complexity Rating

**Rating:** 1 — a single missing form field, one call site, no test-signature coupling.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no epic; oversight is Medium given this bug's severity (it unconditionally blocks the core "advance journey stage" action from the chat UI for every operator on every journey-linked skill except `definition-of-ready`)

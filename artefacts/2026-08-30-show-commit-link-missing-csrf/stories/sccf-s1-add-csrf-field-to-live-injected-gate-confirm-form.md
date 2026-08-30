## Story: Add the missing CSRF field to the live-injected (showCommitLink) gate-confirm form

**Epic reference:** None — short-track (unconditional production bug, confirmed via real staging logs)
**Discovery reference:** None — short-track skips discovery; root cause confirmed directly via `csdl-s1`'s diagnostic logging and live `flyctl logs` evidence
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator running any skill session that completes its stage on the very first live turn** (the common case for any brand-new journey, not just resumed/reloaded ones),
I want **the in-chat "Continue to [next stage] →" button injected live by `showCommitLink()` to actually submit successfully**,
So that **advancing a fresh journey's first stage does not unconditionally 403 on every attempt**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact). `jgcc-s1` (merged, PR #790) fixed the SERVER-rendered gate-confirm form in `_renderChatPage`'s `ougl.4` branch — correct, and confirmed present in the deployed HTML. But live re-validation on `wuce-staging` after that deploy still showed a genuine `403 Forbidden` on a completely fresh journey's first-ever gate-confirm click. `csdl-s1` (merged, PR #791) added temporary diagnostic logging to `csrf.js`; reading the real logs via `flyctl logs -a wuce-staging` after two clean, uncontaminated repros (brand-new journeys, single click each) showed both failures had `submittedPrefix: "(empty)"` against a correctly-populated `expectedPrefix` — not a session/token mismatch, a genuinely empty submitted value. Only one Fly machine exists for this app (`flyctl machines list` confirms), ruling out the multi-machine session-cache-drift theory that had been the leading (unconfirmed) hypothesis.

**How:** `src/web-ui/routes/skills.js`'s `showCommitLink()` function (~line 3688-3720) is a client-side JS function, embedded as a string in the page's inline `<script>` block, that live-injects the gate-confirm affordance into the DOM whenever a stage completes *during* the streaming response — not via a full server-side page re-render. This fires for the common case of a session that completes its whole flow on the very first turn (exactly what happens for the `@mocked` canned-fixture sessions used in this investigation, and for any real session that finishes in one turn). Its injected HTML (line ~3712-3715) builds a `<form method="POST" action="' + GATE_CONFIRM_URL + '">` with a submit button — **and no `_csrf` field at all**, unlike the sibling server-rendered path `jgcc-s1` already fixed. No `CSRF_TOKEN` JS variable exists anywhere in the page script (confirmed via `grep -n CSRF_TOKEN` returning zero matches in `origin/master`), unlike the adjacent `GATE_CONFIRM_URL`/`NEXT_STAGE_LABEL` variables it is built next to (~line 3084-3085).

## Architecture Constraints

- **Chosen approach:** Add a `CSRF_TOKEN` JS variable declaration immediately alongside `GATE_CONFIRM_URL`/`NEXT_STAGE_LABEL` (~line 3084-3085), sourced from the `csrfToken` parameter `_renderChatPage` already receives (added by `jgcc-s1`). Embed a hidden `_csrf` input in `showCommitLink()`'s injected form HTML (~line 3714), referencing `CSRF_TOKEN`, matching the exact field shape `_csrf.csrfField()` produces server-side (`<input type="hidden" name="_csrf" value="...">`).
- **The token is a hex string** (`crypto.randomBytes(32).toString('hex')`) — no HTML-attribute escaping characters possible, but embed via the same `escHtml(...)` pattern already used for `GATE_CONFIRM_URL` when building the JS string literal, for consistency and defence-in-depth rather than relying on the value's current shape never changing.
- **Do not touch the already-correct server-rendered `ougl.4` branch** (`jgcc-s1`'s fix) — this story is scoped to the client-side live-injection path only.
- **Do not touch the `definition-of-ready` branch** (plain `<a href>` link, not a form, not CSRF-protected by design) — unaffected by this story either way.
- **Do not remove `csdl-s1`'s diagnostic logging in this PR** — tracked as its own follow-up per `csdl-s1`'s own decisions.md; keeping it separate keeps this PR's diff minimal and focused on the actual fix.

## Dependencies

- **Upstream:** `jgcc-s1` (merged) — fixed the sibling server-rendered path; this story fixes the other half of the same underlying gap. `csdl-s1` (merged) — its diagnostic logging is what made this root cause identifiable from real logs rather than further guessing.
- **Downstream:** A follow-up story to remove `csdl-s1`'s temporary diagnostic logging, once this fix is confirmed live (tracked in `csdl-s1`'s own decisions.md, not duplicated here).

## Acceptance Criteria

**AC1:** Given `_renderChatPage` is called with a `csrfToken` value, When the rendered page's inline `<script>` block is inspected, Then it contains a `CSRF_TOKEN` JS variable declaration whose value matches the supplied token.

**AC2:** Given `showCommitLink()`'s source (embedded in that same script block), When its injected form-building code is inspected, Then it references `CSRF_TOKEN` to construct a hidden `_csrf` input as part of the form HTML it builds.

**AC3 (behavioural, live-validated):** Given a brand-new journey whose first stage completes live during the initial streaming turn (the reproduction case that found this bug), When the operator clicks the resulting "Continue to [next stage] →" button exactly once with no reload, Then the `POST /api/journey/:id/gate-confirm` request succeeds (not `403`) — verified live on `wuce-staging` after deploy, not just via unit test.

**AC4 (regression guard):** Given the existing chat-page-adjacent test files and `check-jgcc-s1-chat-gate-confirm-csrf-field.js`, When re-run after this fix, Then all pass unchanged.

## Out of Scope

- **Removing `csdl-s1`'s diagnostic logging** — separate follow-up, tracked in `csdl-s1`'s decisions.md.
- **A broader audit of every other client-side `innerHTML`-injected form in this codebase for the same pattern** — this is now the THIRD real CSRF-field gap found in one session (`cpr-s1`/`cptr-s1`'s timing race was a different mechanism; `jgcc-s1` and this story are both missing-field gaps, in two different code paths for the *same* button). Recommend a dedicated audit as a follow-up, logged via `/capture`.
- **Changing how `showCommitLink()` decides when to fire** — its trigger logic (on stage completion during streaming) is correct and unrelated to this bug.

## NFRs

- **Performance:** Negligible — one additional JS variable declaration and one additional string-concatenation in an already-existing template literal.
- **Security:** This story CLOSES a real, confirmed security-relevant gap — CSRF protection on this button was never actually functioning for any session completing its first turn live, since the submission always failed with an empty token (fail-closed, not fail-open, but a functional/availability defect blocking every real use of the feature).
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — no new audit event.

## Complexity Rating

**Rating:** 1 — one new JS variable, one new string fragment in an existing template, mirroring an already-proven pattern (`jgcc-s1`'s server-side fix, `GATE_CONFIRM_URL`'s own declaration shape).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed — short-track, no epic; oversight is Medium given this is the third fix attempt at the same user-reported bug and directly affects a core workflow action (advancing a journey stage) for the common case of a freshly-created journey.

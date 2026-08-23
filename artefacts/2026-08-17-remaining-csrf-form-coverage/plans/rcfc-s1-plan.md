## Implementation Plan: Extend CSRF token protection to the remaining server-rendered POST forms

**Story reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
**Test plan reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
**DoR reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/dor/rcfc-s1-dor.md
**Worktree:** `.worktrees/rcfc-s1`, branch `feature/rcfc-s1`
**Date:** 2026-08-24

All line numbers below were re-confirmed against the current `feature/rcfc-s1` worktree state on 2026-08-24, immediately before this plan was written — not carried forward from the earlier stale investigation. `POST /api/artefacts/:slug/:file/annotations` is explicitly out of scope (removed 2026-08-24 — see `decisions.md`). 8 routes total across 4 tasks, matching the corrected AC1–AC4 scope.

---

### Task 1 — Journey-flow forms (AC1, 6 routes)

**Files:** `src/web-ui/routes/journey.js` (already `require('../middleware/csrf')` as `_csrf` at L10 — no new require needed)

**Handler wiring** — add `var csrfOk = await _csrf.csrfGuard(req, res); if (!csrfOk) return;` as the first statement (after the existing auth check) in:
- `handlePostJourney` (L378) — `POST /api/journey`. Note: L509's existing `_csrf.csrfGuard` call is inside a *different* function, `handleDeleteJourney` — confirmed by direct inspection, do not assume `handlePostJourney` is already protected.
- `handlePostGateConfirm` (L2001) — `POST /api/journey/:journeyId/gate-confirm`
- `handlePostReferenceModalSkip` (L1709) — `POST /api/journey/:journeyId/reference-modal/skip`
- `handlePostReference` (L1841) — `POST /api/journey/:journeyId/reference`
- `handlePostStories` (L2463) — `POST /api/journey/:journeyId/stories`
- `handlePostWizardSelection` (L4035) — `POST /journey/wizard`

**GET-rendering CSRF field embedding** — insert `_csrf.csrfField(_csrf.generateCsrfToken(req))` immediately inside each `<form method="POST" ...>` tag:
- `handleGetWizard` (L3907, has `req` — no signature change) — 3 separate forms, all targeting `/journey/wizard`, at L3943, L3986, L4018
- `_renderJourneyHome(data)` (L169, form at L265) — has **no** `req`/token param. Thread a new `csrfToken` field onto the `data` object passed in by its only caller, `handleGetJourney` (L286), at its call site L337 (`_renderJourneyHome({ profiles: ..., journeys: ..., showNewForm: showNewForm, csrfToken: _csrf.generateCsrfToken(req) })`)
- `handleGetStageReview` (L610, has `req`) — form at L711
- `handleGetReferenceModal` (L1575, has `req`) — form at L1613
- `handleGetReference` (L1740, has `req`) — form at L1812
- `handleGetStories` (L2414, has `req`) — form at L2449

**Test file:** `tests/check-rcfc-s1-journey-forms-csrf.js` — 12 tests per the test plan (6 routes × reject-without-token + full-round-trip). Full `server.js` router dispatch, per `sec-perf-s3`'s established convention (D37 wiring-test rule) — RED phase: reject-without-token tests fail (POST succeeds with no `_csrf` field) against current code; GREEN once `csrfGuard` is wired.

---

### Task 2 — Skill-session-form routes (AC2, 2 routes)

**Files:** `src/web-ui/routes/skills.js`, `src/web-ui/views/commit-view.js` — neither currently requires `../middleware/csrf`; add `const _csrf = require('../middleware/csrf');` to both.

**Handler wiring:**
- `handlePostSkillSessionHtml` (skills.js L1163) — `POST /api/skills/:name/sessions` (form path). Add csrfGuard check after the existing session-auth check.
- `handlePostCommitHtml` (skills.js L1559) — `POST /api/skills/:name/sessions/:id/commit` (form path). Add csrfGuard check after the existing session-auth check.
- The JSON-path siblings for these same URL patterns are untouched — confirm via a negative test that their existing behaviour is unaffected (per the story's own scope boundary).

**GET-rendering CSRF field embedding:**
- `_renderSkillsList(skills, user, navContext)` (skills.js L1084, form at ~L1095, targets `/api/skills/:name/sessions`) — no `req`/token param. Add a 4th param `csrfToken` threaded from its only caller `handleGetSkillsHtml` (skills.js L1118, call site at ~L1139).
- `renderCommitPreview(data)` (commit-view.js L18) — **two** form sites: L55 (`data.commitFormAction`, the commit form itself) and L113 (the "Next up" card's form targeting a *new* skill session at `/api/skills/:name/sessions` — same route as `_renderSkillsList`'s form, second embedding site for this route). Thread `data.csrfToken` from its only caller `handleGetCommitPreviewHtml` (skills.js L1506, call site at ~L1534).

**Test file:** `tests/check-rcfc-s1-skills-sessions-csrf.js` — 4 tests per the test plan (2 routes × reject-without-token + full-round-trip). This file was originally planned to also cover annotations (renamed from `check-rcfc-s1-annotations-skills-csrf.js` — see decisions.md and test plan note).

---

### Task 3 — Products routes (AC3, 2 routes)

**Files:** `src/web-ui/routes/products.js` — already `require('../middleware/csrf')` as `_csrf` at L18 (used elsewhere in the file) — no new require needed.

**Handler wiring:**
- `handlePostProductConfirm` (L2065) — `POST /products/confirm`. Add csrfGuard check as the first statement.
- `handlePostProductFeature` (L2912) — `POST /products/:id/features`. Add csrfGuard check as the first statement.

**GET-rendering CSRF field embedding:**
- `_renderProductNew(login, error, isAdmin)` (L183, form at L199, targets `/products/confirm`) — no `req`/token param. Add a 4th param `csrfToken` threaded from its only caller `handleGetProductNew` (L2210, call site at L2215).
- `_renderProductView(...)` (L728, form at L909, targets `/products/:id/features`) — **already receives `csrfToken` as its 10th parameter**, already used elsewhere in this function. Simplest of the 8 routes — just embed the field into the form at L909, no signature change.

**Test file:** `tests/check-rcfc-s1-products-csrf.js` — 4 tests per the test plan (2 routes × reject-without-token + full-round-trip).

---

### Task 4 — Legacy login shell (AC4, 1 route, 2 forms)

**Files:** `src/web-ui/utils/html-shell.js` (does not currently require `../middleware/csrf` — add it), `src/web-ui/server.js` (caller wiring)

**GET-rendering CSRF field embedding:**
- `renderLoginPage()` (html-shell.js L782) — no `req` param currently. Add a `req` parameter, embed `csrfField(generateCsrfToken(req))` into both forms: `#email-signin-form` (L893, targets `POST /auth/email/login`) and `#email-signup-form` (L898, targets `POST /auth/email/signup`). Use the same `escHtml()`/`csrfField()` convention already used elsewhere in this file, per `web-ui-patterns.md`'s shared-shell-module rule (do not hand-roll a differently-escaped variant).
- `server.js`'s catch-all caller (L3696: `res.end(renderLoginPage())`) — thread `req` through: `res.end(renderLoginPage(req))`.

**No handler-side change needed** — confirmed via grep that `auth-email.js`'s `handleEmailLogin`/`handleEmailSignup` (the target handlers for both forms) already call `csrfGuard`. Today, every real submission through this fallback shell 403s regardless of credentials, because the form has no `_csrf` field at all — this task's fix (embedding the token) resolves that pre-existing bug as a side effect, which the round-trip test also serves as a regression guard for.

**Test file:** `tests/check-rcfc-s1-legacy-login-csrf.js` — 3 tests per the test plan (signin reject + signin round-trip + signup reject), dispatched via the real catch-all fallback path (unauthenticated request to an unmatched route).

---

### Task 5 — Full-suite verification and draft PR

- Run the full test suite once (not per-task, per this session's established practice of avoiding redundant full-suite reruns — `/branch-setup` already captured a clean baseline for this worktree).
- Confirm all 23 new tests pass and 0 regressions against the baseline.
- Confirm the NFR checks: `grep -rn "req\.session\.token[^A]" src/web-ui/` returns zero results (canonical field name check); manual review confirms no CSRF token value is passed to `console.log`/`_logger` at any new call site.
- Push the branch and open a draft PR (default per established convention — do not mark ready for review).
- If any ambiguity is hit that isn't covered by the ACs or tests, add a PR comment describing it and do not mark ready for review.

---

## Task-to-test mapping

| Task | Files touched | Test file | Tests |
|------|---------------|-----------|-------|
| 1 | journey.js | check-rcfc-s1-journey-forms-csrf.js | 12 |
| 2 | skills.js, commit-view.js | check-rcfc-s1-skills-sessions-csrf.js | 4 |
| 3 | products.js | check-rcfc-s1-products-csrf.js | 4 |
| 4 | html-shell.js, server.js | check-rcfc-s1-legacy-login-csrf.js | 3 |
| 5 | (verification only) | — | — |

23 tests total, matching the corrected test plan and DoR contract.

## Commit strategy

One commit per task (5 commits total, well within the ≤2.0 commits/task Medium-oversight target established across the `vrne` stories) — not per-file, not per-test. Each commit's tests must be green before moving to the next task.

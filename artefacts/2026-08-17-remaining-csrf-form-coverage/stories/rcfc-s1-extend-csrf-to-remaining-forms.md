## Story: Extend CSRF token protection to the remaining server-rendered POST forms

**Epic reference:** None — short-track, closing a self-documented gap from `sec-perf-s3` (`2026-07-01-security-perf-hardening`)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui, security]

## User Story

As a **platform operator responsible for the security of state-changing form endpoints**,
I want **the remaining server-rendered POST forms that `sec-perf-s3` deliberately left unprotected to also require a valid CSRF token, using the exact same mechanism `sec-perf-s3` already built**,
So that **the CSRF hardening added on 2026-07-01 covers the whole app's real attack surface, not just the four highest-value routes named in that story's original scope**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure, no benefit-metric artefact) — closes the exact gap `sec-perf-s3` itself named in its own Out of Scope section and explicitly flagged as deferred "to keep this one bounded... Deferred to a follow-up story," which was never created. Found during the 2026-08-17 DoD backlog pass while writing `sec-perf-s3`'s own retroactive DoD.
**How:** Every form named below is a real, currently-unprotected, server-rendered POST endpoint reachable the same way the four already-protected routes are — closing this gap removes the last self-documented hole in the app's CSRF posture.

## Architecture Constraints

- **Reuse `sec-perf-s3`'s existing mechanism exactly** — `src/web-ui/middleware/csrf.js`'s `generateCsrfToken(req)`, `csrfField(token)`, `csrfGuard(req, res)`. This story does not introduce a new CSRF mechanism, only new call sites for the existing one.
- Per `sec-perf-s3`'s own Out of Scope note, JSON/fetch-only POST endpoints remain correctly excluded (protected by `SameSite=Strict` already) — only genuine server-rendered `<form>` POST targets are in scope here.
- Existing `SESSION_COOKIE_CONFIG` `SameSite=Strict` policy (`src/web-ui/middleware/session.js`) continues to provide independent, real mitigation regardless of this story's outcome — same defence-in-depth framing as the parent story.

## Dependencies

- **Upstream:** `sec-perf-s3` (merged, PR #476) — this story only adds call sites to that story's existing middleware.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the journey-flow server-rendered forms — `POST /journey/wizard`, `POST /api/journey`, `POST /api/journey/:journeyId/gate-confirm`, `POST /api/journey/:journeyId/reference-modal/skip`, `POST /api/journey/:journeyId/reference`, and `POST /api/journey/:journeyId/stories` (the full enumerated set of `journey.js` handlers whose output is targeted by a real server-rendered `<form method="POST">`, confirmed via code investigation on 2026-08-24 — supersedes this AC's original, incomplete "and sibling journey-flow form POSTs" wording) — When submitted without a valid `_csrf` field, Then the response is `403` with body `"Forbidden"` and no state change occurs; When submitted with the correct `_csrf` value (extracted from the real rendered GET page, per `sec-perf-s3`'s AC6 round-trip convention), Then the request succeeds exactly as before.

**AC2:** Given `POST /api/skills/:name/sessions` (form path) and `POST /api/skills/:name/sessions/:id/commit` (form path), When submitted without a valid `_csrf` field, Then each is rejected `403`/`"Forbidden"`; with a valid token, each succeeds as before. (`POST /api/artefacts/:slug/:file/annotations` was investigated on 2026-08-24 and removed from this AC — see Out of Scope: it is a JSON/fetch-only API with no live server-rendered `<form>` target, and does not belong in this story per the Architecture Constraints' own JSON/fetch-only exclusion rule.)

**AC3:** Given `POST /products/confirm` and `POST /products/:id/features`, When submitted without a valid `_csrf` field, Then each is rejected `403`/`"Forbidden"`; with a valid token, each succeeds as before.

**AC4:** Given the legacy `renderLoginPage()` fallback shell (`src/web-ui/utils/html-shell.js`, server.js catch-all route), When its form is submitted without a valid `_csrf` field, Then it is rejected the same way the primary `GET /` landing page's forms already are.

**AC5:** Given all forms named in AC1–AC4, When a round-trip test (render → extract real token from HTML → submit → validate) is run, Then it passes for every one — matching `sec-perf-s3`'s own AC6 convention that a test must exercise the real generate→embed→submit→validate path, not assert two internal values are `===`.

## Out of Scope

- Any change to the CSRF mechanism itself (`csrf.js`) — reused as-is.
- `POST /webhook/stripe` and any `NODE_ENV==='test'`-gated endpoint — correctly excluded per `sec-perf-s3`'s own reasoning (server-to-server HMAC auth, or unreachable in production).
- A double-submit-header convention for JSON/fetch-only endpoints — separate, larger decision, not raised again here.
- **`POST /api/artefacts/:slug/:file/annotations`** — found during 2026-08-24 pre-implementation investigation to be a JSON/fetch-only API route (`handlePostAnnotation` in `annotation.js` documents its own body shape as `{ sectionHeading, annotationText, artefactPath }`, JSON in/out, no content-type branching). The only file containing a `<form>` targeting this route, `views/artefact-view.js`'s `renderArtefact()`, is confirmed dead code — never called anywhere in the live `src/web-ui` tree. The live annotation UI (`annotation-renderer.js`'s `renderAnnotations()`) renders an "Add annotation" `<button>` with no client-side JS event wiring anywhere in the codebase (no `public/` asset references "annotation" at all) — the affordance is currently inert, not a real form submission path. Per this story's own Architecture Constraints (JSON/fetch-only endpoints remain excluded, protected by `SameSite=Strict`), this route does not belong in AC2. This corrects the 2026-08-24 `/test-plan`-phase decision that had added it — see `decisions.md`.

## NFRs

- **Performance:** Same as `sec-perf-s3` — token generation is a single cached call per session, negligible overhead.
- **Security:** Core purpose of this story — closes a real, currently-open, self-documented CSRF gap.
- **Accessibility:** Not applicable — hidden input fields only.
- **Audit:** None new — matches `sec-perf-s3`'s own choice not to separately audit-log CSRF rejections.

## Complexity Rating

**Rating:** 2 — mechanical repetition of an already-proven pattern across 8 routes (updated 2026-08-24: `journey.js` was found to have 4 real form-POST routes needing coverage, not 2, raising the count from ~7; the annotations route was then removed from the count later the same day after being found to be JSON/fetch-only, net 8), each route needs its own round-trip test per AC5.
**Scope stability:** Stable — the full route list is now code-verified as of 2026-08-24 (see AC1/AC2), not just carried forward from `sec-perf-s3`'s original text.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

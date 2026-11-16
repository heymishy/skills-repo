# Browser-side error reporting audit

Date: 2026-11-16. Method: read-only code reading of `src/web-ui` (no production requests, no PostHog queries). Question: does a JavaScript error in a person's browser ever reach the error chain (PostHog error tracking to a GitHub issue)?

## Short answer

Almost certainly not. The server-side chain (coha-s5 to coha-s7, ecg-s1, ecf-s1, eit-s1) reports every server 5xx, but nothing in the repo sends browser errors, and only 4 pages load the browser PostHog library at all.

## Findings

1. **No error listeners anywhere.** A search of `src/web-ui` (pages, `public/*.js`, views, shell) finds no `window.onerror`, no `unhandledrejection` or `error` event listener, and no `captureException` call in browser code. The browser scripts (`public/artefact-sidebar.js`, `presence-sidebar.js`, `stage-list.js`, `approval-modal.js`, `artefact-edit-merge.js`) fetch from the API and update the page with no error reporting; a failed fetch is silent to the operator.
2. **Only 4 page families load the browser PostHog library:** the public landing page (`routes/public.js`), the products page (`routes/products.js` around line 3038), the journey page (`routes/journey.js` around line 5801) and the skills chat page (`routes/skills.js` around line 4855). The shared shell (`utils/html-shell.js`) does not load it, so the artefact viewer, settings, billing, dashboard, admin pages and every other page have no browser telemetry of any kind.
3. **Even on those pages, exception capture is not switched on in code.** `posthog.init(key, { api_host, person_profiles: "always" })` sets no `capture_exceptions` option. posthog-js can still pick up exception autocapture from the PostHog project's own setting ("Exception autocapture" in project settings); that setting is not visible from the repo. Whether it is on is one read-only PostHog project-settings lookup, which needs the operator's approval.
4. **The privacy scrubber does not apply to the browser.** `scrubEvent` (error-capture.js) runs only in the server client's `before_send`. A browser exception event would carry the raw message, stack, page URL and, because `posthog.identify(login, { tenant_id })` is called on the products page, the person's login and tenant id. The server-side design (allow-listed codes, scrubbed routes, no messages) exists precisely because messages can hold tenant text; browser events would bypass it.
5. **No Content-Security-Policy is set** (no header or meta tag found in `src/web-ui`). That is not an error-reporting problem, but it means a browser error reporter has no CSP constraint today and any inline-script approach works; it also means nothing restricts where scripts load from. Out of scope here; noted for a security review.
6. **Related gap:** browser-visible failures of the app's own API (a 4xx or 5xx from `/api/...` called by a `public/*.js` script) are reported server-side if they are 5xx (ecg-s1), so the server half of such a failure is already covered; the page's own JavaScript breaking (for example a script error on the journey page) is not.

## Options if the operator wants coverage (not built)

| Option | What it gives | Cost and risk |
|--------|---------------|---------------|
| A. Do nothing | Server 5xx stay covered. Browser breakage is found only when a person reports it | None |
| B. Turn on posthog-js exception autocapture in PostHog project settings, plus a `before_send` in the browser `posthog.init` that applies the same allow-list (code, route label, error type; no message, no URL query, no identify properties) | Browser errors on the 4 PostHog pages become issues through the existing destination | A new scrubber to maintain and test; the identify call on the products page links events to a login unless removed; `person_profiles: "always"` makes this worse |
| C. A small first-party reporter: a 20-line script in the shell listening for `error` and `unhandledrejection` and POSTing `{ code: 'browser_error', route-label, error type }` to a new server endpoint that calls `captureServerError` | Covers every page (shell-wide), reuses the server scrubber and fingerprint, no third-party library, no identify | A new endpoint to rate-limit and protect against spam (it feeds a GitHub issue pipeline), plus a story with tests; needs CSRF or same-origin checks |

## Recommendation

Option C is the better design (one scrubber, whole app, no new data sent to a third party), with a rate limit and a per-fingerprint cap so a noisy browser cannot flood the issue pipeline. It is not urgent: no browser error has been observed as a problem yet. Before choosing, ask the operator to approve one read-only look at the PostHog project's exception-autocapture setting, to learn whether browser errors are already being collected unscrubbed (which would make privacy, not coverage, the first thing to fix).

## Addendum: PostHog read-only check (operator-approved, 2026-11-16)

- Project setting `autocapture_exceptions_opt_in` is `null` (off), so posthog-js does not collect browser exceptions. Finding 3 is resolved: browser exceptions are not being collected, scrubbed or not.
- `$exception` events in the last 30 days by library: `posthog-node` 392 and `posthog-node-manual` 4; none from `posthog-js`. This agrees with the setting.
- Conclusion: there is no browser-side privacy leak through exceptions, and no browser coverage either. Option A (do nothing) remains safe; option C is the design to use if coverage is wanted.
- Adjacent observation, not part of this audit: `session_recording_opt_in` is `true` with no masking configuration, so session replay may be recording the 4 pages that load the browser library. Replay captures what is on screen, which on the journey, products and skills pages can include tenant artefact text. Default posthog-js masking covers form inputs, not page text. Worth a separate privacy look (what pages, what masking, retention is 30 days) before any browser telemetry is widened.

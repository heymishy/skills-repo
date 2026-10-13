# Test Plan (Short-track): Persona-save route rejects the client's real POST request, silently no-saving in production

**Story reference:** short-track bug fix (production functional bug, confirmed live on staging via Chrome)
**Date:** 2026-10-13

---

## Root cause

`src/web-ui/server.js` line 4125 wires `PATCH /journeys/:id/persona` only:
```js
} else if (pathname.match(/^\/journeys\/[^/]+\/persona$/) && req.method === 'PATCH') {
```
But the client's own submit handler (`journeys.js`, persona form submit listener) calls the shared `jcxSubmitJson` helper, which is hardcoded to `method: "POST"` for every caller:
```js
function jcxSubmitJson(url,payload){
  return fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
    ...
}
```
`jcxSubmitJson` is also used by jcx-s1's own placeholder-creation and trigger calls, where it is correct (those routes ARE wired as POST). jcx-s4 reused the same shared POST-only helper for a route that was wired as PATCH on the server side — a method mismatch introduced specifically in jcx-s4's implementation, not in the shared helper itself.

A `POST /journeys/:id/persona` request does not match the PATCH-only branch and falls through every other `else if` to the final catch-all (the unauthenticated sign-in-page handler), which returns `200` with an HTML body. Because the status is `200`, the client's `if(!r.ok){...}` check never fires, `r.json()` is called on an HTML body, and the resulting parse-rejection silently reaches `jcxShowError` — which in turn references `jcxReorderError`, a variable scoped to a *different* `<script>` IIFE block (the stage-reorder script, not the feature-picker script the persona submit handler lives in), so the error display itself never surfaces. **No visible error, no save, no reload — the user has no way to know the save failed.**

This is a real client/server contract bug that no existing test caught, because:
1. Every jsdom test (`check-jcx-s4-persona-card.js`) mocks `window.fetch` directly and only asserts the URL/payload shape sent — it never dispatches to a real server, so the method mismatch is invisible to it.
2. The one real-server-dispatch test in this epic (`check-jcx-s5-authorization.js` AC3) exercises the viewer-403 denial path only, not the happy-path save.
3. No test in this repo combines "real `server.js` router dispatch" with "the client's own exact `fetch()` call shape" for this specific route.

Confirmed live on `wuce-staging.fly.dev`: filled the persona editor form, clicked "Save persona", the real browser network request showed `POST .../persona` → `200`, but a page reload immediately after showed the form completely blank again — the persona was never written to `customer_journeys`. Confirmed definitively via `read_network_requests` showing 4 real UI-triggered `POST` requests all returning `200`, versus one deliberate `PATCH` probe (with an intentionally invalid CSRF token) correctly returning `403` — proving the route match genuinely requires `PATCH`, and `POST` falls through to the unrelated catch-all.

**Fix:** change the server route match from `req.method === 'PATCH'` to `req.method === 'POST'`, matching the client's actual, already-shipped request shape (and the same convention `jcx-s1`'s own two routes already use successfully via the same shared `jcxSubmitJson` helper). This is the minimal, lowest-risk fix — changing the shared client helper instead would risk regressing jcx-s1's own two already-working POST routes, which have no issue of their own.

---

## Verification

| Check | Method | Result |
|-------|--------|--------|
| Existing `handlePatchJourneyPersona`/`check-jcx-s4-persona-card.js` unit and integration tests still pass | `node tests/check-jcx-s4-persona-card.js` | Run before and after the fix — the handler function itself is untouched; only the router's method match changes |
| New: a real `server.js` router-dispatch test proves the exact client request shape (`POST`, no `_csrf` header, JSON body with `persona_name`/`persona_role`/`persona_goal`) now reaches the handler and persists | `tests/check-jcx-hotfix2-persona-route-method.js` (new, reuses the real-dispatch harness pattern from `check-jcx-s5-authorization.js`/`check-vrne-s4-edge-case-gate.js`) | New test, must pass |
| Full repo suite, no regressions | `npm test` | Must be 0 failures |
| Real-world fix confirmed (the actual gap no mocked test could close) | Live Chrome check against `wuce-staging.fly.dev` after deploy: fill the persona form, save, reload, confirm the saved persona renders as a read-only card | Pending deploy |

**Known residual gap, logged not fixed here:** the silent-failure UX (no visible error when a save genuinely fails) is a separate, pre-existing defect in `jcxShowError`'s own cross-script-scope reference bug, not unique to this route. Worth a dedicated follow-up: every `jcxSubmitJson` caller's `.catch()` should surface a visible error through a handler reachable from its own script block, not assume `jcxReorderError` exists globally. Out of scope for this same-day fix (which restores the actual save functionality); tracked as a follow-up action in the DoD.

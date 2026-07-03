## Story: Admin credits page — view all tenant balances and submit top-up

**Epic reference:** artefacts/2026-07-03-admin-role-panel/epics/arl-e1.md
**Discovery reference:** artefacts/2026-07-03-admin-role-panel/discovery.md
**Benefit-metric reference:** artefacts/2026-07-03-admin-role-panel/benefit-metric.md

## User Story

As a **Platform operator (Hamish King)**,
I want **a browser page at `/admin/credits` that shows all tenant balances and lets me submit a top-up via a form**,
So that **I can adjust any tenant's credit balance in under two minutes without opening a terminal or writing SQL**.

## Benefit Linkage

**Metric moved:** M2 — Credits top-up time via browser UI
**How:** This story replaces the `fly postgres connect` + manual SQL workflow with a server-rendered HTML page and a form POST handler. M2 baseline is 5–10 minutes via terminal; target is under 2 minutes via browser. The form submit → redirect → updated balance visible cycle is the measured workflow.

## Architecture Constraints

- **ADR-011 (artefact-first):** This story artefact and DoR must exist before any implementation code is written. The handler module `src/web-ui/routes/admin-credits.js` is a new governed file.
- **ADR-004 (RISK-ACCEPT — B2 keyboard navigation):** AC7 is classified as RISK-ACCEPT per B2 CSS-layout-dependent AC policy. Logged in decisions.md. Manual smoke test in verification script.
- **No Express:** Route matching via `pathname.match()` in `server.js`. Handler functions export plain `(req, res)` functions. Response via `res.writeHead` / `res.end`. No framework router.
- **No new npm dependencies:** Admin page is server-rendered HTML assembled with Node.js string interpolation. No template engine, no front-end framework.
- **Node.js CommonJS only:** Handler modules use `module.exports`, `require()`.
- **ougl path traversal guardrail:** The `tenantId` accepted in `POST /api/admin/credits/adjust` is user-supplied input. It must not be used to construct any file path. Input must be validated against an allowlist (existing tenant_ids from the DB) before the update query executes. This is mandatory even though this route does no disk write — the guardrail applies to all admin form inputs per ougl coding standard.
- **Input validation:** `amount` must be a positive integer. Reject zero, negative, fractional, and non-numeric values with HTTP 400 before any DB write.
- **requireAdmin gating:** Both `GET /admin/credits` and `POST /api/admin/credits/adjust` must run through `requireAdmin` middleware (from arl-s2). No admin route is reachable without passing the middleware.

## Dependencies

- **Upstream:** arl-s2 must be DoD-complete (provides `requireAdmin` middleware).
- **Downstream:** None — this is the final story in this epic.

## Acceptance Criteria

**AC1:** Given an admin user navigates to `GET /admin/credits`, When the page loads, Then a server-rendered HTML page is returned (HTTP 200) listing every `tenant_id` present in the `credits` table along with its current credit balance.

**AC2:** Given the admin credits page renders, When it displays, Then each tenant row includes an HTML form with: a hidden or visible `tenantId` field, a numeric `amount` input, and a submit button that POSTs to `/api/admin/credits/adjust`. The form action and field names must exactly match what the POST handler expects.

**AC3:** Given an admin submits a valid top-up — `tenantId` matching an existing tenant and `amount` a positive integer — to `POST /api/admin/credits/adjust`, When the request is processed, Then the tenant's credit balance in the `credits` table is increased by `amount` and the response is HTTP 302 redirecting to `/admin/credits`.

**AC4:** Given an admin submits an invalid `amount` (zero, negative, non-integer, or empty string) to `POST /api/admin/credits/adjust`, When the request is processed, Then HTTP 400 is returned and the `credits` table balance is not modified.

**AC5:** Given a non-admin session (role = `'user'` or unauthenticated) makes a `GET /admin/credits` request, When the request is processed, Then HTTP 403 is returned and the credits page HTML is not rendered.

**AC6:** Given a non-admin session makes a `POST /api/admin/credits/adjust` request with any body, When the request is processed, Then HTTP 403 is returned and no credit balance is modified in the DB.

**AC7 (B2 — CSS layout, RISK-ACCEPT + manual smoke test):** Given an admin views the credits page in a browser, When navigating using keyboard only (Tab, Enter, Space), Then all tenant forms are reachable and submittable without a mouse. *Classification: RISK-ACCEPT — cannot be verified by automated test; verified by manual smoke test during post-deploy check. RISK-ACCEPT entry in decisions.md; manual step in verification script.*

**AC8 (security — tenantId allowlist):** Given a `POST /api/admin/credits/adjust` request where the `tenantId` value does not exist as a key in the `credits` table, When the request is processed, Then HTTP 400 is returned and no `credits` row is modified in the DB.

**AC9 (security — HTML escaping):** Given the `credits` table contains a `tenant_id` value that includes HTML special characters (e.g. `a<b>c`), When `GET /admin/credits` renders the page, Then the response body contains the HTML-escaped form (e.g. `a&lt;b&gt;c`) and does not contain an unescaped `<b>` tag.

## Out of Scope

- Pagination or filtering of the tenant list — all tenants are listed on a single page in MVP.
- Decreasing or zeroing a tenant's balance via this UI — the form accepts positive top-up amounts only. Balance reduction is SQL-only.
- Per-tenant credit history or transaction log — not included in MVP admin panel.
- Styled or designed admin page beyond functional server-rendered HTML — no CSS framework, no design system. Functional correctness only in MVP.
- Admin ability to create or delete tenants — this UI is credits management only.

## NFRs

- **Security:** `tenantId` from the POST body must be validated against existing DB records (allowlist check) before executing any UPDATE. Never use `tenantId` in a file path. Never reflect raw user input into the response HTML without escaping.
- **Input validation:** `amount` must be validated server-side as a positive integer (`parseInt(amount, 10)` > 0 and `String(parsedAmount) === amount.trim()`). Client-side validation is not a substitute.
- **Performance:** `GET /admin/credits` must complete within 2 seconds for up to 100 tenant rows (single SELECT query, no pagination in MVP).
- **Accessibility:** AC7 baseline — keyboard navigability (RISK-ACCEPT path per B2 classification).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

Server-rendered HTML, form POST, DB read and write — all standard patterns in this codebase. No novel integration. Complexity 2 because there is no prior admin route pattern to reference; the route handler, HTML rendering, and input validation must all be built from scratch without a framework.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic (Medium — arl-e1)
- [ ] B2 classification confirmed for AC7 (RISK-ACCEPT + manual smoke test — must be in decisions.md and verification script before DoR sign-off)

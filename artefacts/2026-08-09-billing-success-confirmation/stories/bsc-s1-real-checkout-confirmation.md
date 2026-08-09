## Story: Show a real, visible confirmation after a successful checkout instead of a silent redirect

**Epic reference:** None — short-track (bug fix, found via informal agentic-review trial of rubber-duck-review-capture)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **tenant who just completed a Stripe checkout**,
I want **visible confirmation of what I just bought before landing back on my dashboard**,
So that **I know my payment succeeded and which plan I'm now on, instead of silently landing back where I started with no acknowledgment anything happened**.

## Benefit Linkage

**Metric moved:** Direct UX-correctness fix (short-track, no formal benefit-metric artefact) — found during an informal code-only agentic-review trial of `rubber-duck-review-capture` (2026-08-09): `handleGetBillingSuccess` (`GET /billing/success`, `src/web-ui/routes/billing.js`) fires a `checkout_completed` analytics event, then silently 302s to `/dashboard` with zero user-facing acknowledgment. A deeper look found a second, compounding bug: the analytics event reads `req.query.plan_name`, but the `success_url` built in `handlePostCheckout` (line 164) never actually includes a `plan_name` parameter — so that property has been empty in every real checkout, silently, since this flow was built.

**How:** Both bugs share one root cause: nothing carries the real purchased plan forward from checkout-creation to the success page. The fix threads it through Stripe's own checkout session metadata (set at creation, read back on success) rather than an unpopulated or spoofable query string value — fixing the analytics gap and enabling a genuine confirmation message from the same authoritative source.

## Architecture Constraints

- **Reuse the existing D37-injectable Stripe adapter pattern** (`stripe-client.js`'s `setStripeAdapter`/`requireAdapter`) for the new session-retrieval call — no new Stripe SDK wiring mechanism.
- **Do not change what actually grants entitlements.** The Stripe webhook (`checkout.session.completed` → `setPlanState`) remains the sole source of truth for whether a tenant's plan actually changed — this story only improves what the user *sees* immediately after checkout. The confirmation names the plan the user just purchased (from the checkout session itself, available synchronously); it does not assert that `tenant-plan.js`'s own state has already been updated by the webhook (which may arrive slightly before or after the browser redirect — a real race this fix must not paper over by claiming something not yet true).
- **Carry the plan via Stripe checkout session metadata, set at creation time** (`handlePostCheckout`), not via a client-suppliable query parameter — a URL-based `plan_name` could be tampered with by directly visiting `/billing/success?session_id=...&plan_name=whatever`; session metadata is set server-side at creation and read back from Stripe's own API, not from anything the client controls.
- **No D37 concern for the new confirmation page itself** — it is a plain rendered response, not an injectable adapter.

## Dependencies

- **Upstream:** None (this fixes already-shipped, already-merged code from `lab-s3.2`).
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a checkout session was created with a specific plan, When Stripe redirects the browser back to `GET /billing/success?session_id=...`, Then the handler retrieves the real Stripe checkout session by that ID and reads the actual purchased plan from the session's own metadata (set at checkout-creation time in `handlePostCheckout`) — not an empty or client-suppliable query parameter.

**AC2:** Given the real plan is known, When `/billing/success` renders, Then the response is a real, visible confirmation page (not a silent 302) stating the payment succeeded and naming the specific plan purchased — e.g. "Payment successful — you're now on the Pro plan."

**AC3:** Given the confirmation page is shown, When the user is ready to continue, Then a clear, single link/button takes them to `/dashboard` — the flow still ends at the dashboard, just via one visible confirmation step first rather than an invisible redirect.

**AC4:** Given the `checkout_completed` PostHog event fires, When it's captured, Then its `planName` property contains the real plan name from the checkout session's metadata — fixing the existing bug where this property has always been an empty string in production, since the query parameter it previously read was never populated by the redirect URL.

**AC5:** Given `session_id` is missing from the query string, or the Stripe session-retrieval call fails for any reason (network error, invalid ID, session not found), When `GET /billing/success` runs, Then it fails open to the original behaviour — a direct 302 redirect to `/dashboard` with no confirmation page and no crash, exactly as today.

## Out of Scope

- **Changing what actually grants a tenant's plan entitlement.** The Stripe webhook remains the sole authoritative trigger for `setPlanState` — unaffected by this story.
- **Adding a confirmation banner to the dashboard itself** (`routes/products.js`'s `handleGetDashboard`). This story's confirmation is a dedicated, self-contained page at `/billing/success`, not an injected banner into the larger dashboard-rendering flow — a materially larger, riskier touchpoint for a UX-polish fix.
- **Retrying or polling for the webhook's completion** before showing the confirmation. The confirmation is based on the checkout session itself (available immediately, synchronously), not on waiting for `tenant-plan.js`'s state to catch up.

## NFRs

- **Performance:** Negligible — one additional Stripe API call (session retrieve) on an already-low-frequency path (a user completing checkout), not a hot path.
- **Security:** The plan name is sourced from Stripe's own session metadata (set server-side at creation), never from a client-suppliable value — closes a class of tamperable-query-param risk that the current (unpopulated) implementation would have had if `plan_name` were ever actually wired through naively.
- **Accessibility:** The new confirmation page must follow the same accessible-markup conventions already used elsewhere in this codebase (semantic headings, a real `<a>`/`<button>` for the continue action, not a bare clickable `<div>`).
- **Audit:** Improves — the `checkout_completed` analytics event gains real, previously-always-empty data.

## Complexity Rating

**Rating:** 2 — the confirmation-page addition itself is simple, but sourcing the plan name correctly (session metadata at creation + retrieval at success, rather than a naive and insecure query-param pass-through) is a genuine design decision with a real security consideration behind it.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

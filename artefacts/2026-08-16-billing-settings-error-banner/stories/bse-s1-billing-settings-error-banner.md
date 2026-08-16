# Story: Show a visible error banner on Settings when a billing-portal redirect carries an error

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the validated feedback triage below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As **any signed-in wuce user who hits a billing-portal error** (redirected back to Settings by `bpe-s1`'s own two new error codes when clicking "Manage billing"),
I want **to see a clear, honest on-page message explaining what went wrong**,
So that **I don't experience the redirect as a silent no-op and am left wondering whether my click even registered**.

## Benefit Linkage

**Metric moved:** No formal benefit-metric artefact — short-track. Operational/quality metric: a real, validated, root-caused defect (`artefacts/feedback/beta-006.md`, signal 10), directly observed against live staging (`wuce-staging.fly.dev`) rather than theoretical.
**How:** `artefacts/feedback/beta-006.md` confirms that `bpe-s1` (merged earlier today, PR #744) correctly fixed the original raw-500 crash on "Manage billing" by redirecting to `/settings?error=no_billing_account` or `/settings?error=billing_unavailable` — but `src/web-ui/routes/settings.js`'s `handleGetSettings` never reads the `error` query parameter at all, so the redirect's own intended "friendly error" behaviour is invisible. This story closes that specific, narrow gap: it makes the two error states `bpe-s1` already produces visible on the page they redirect to, using a banner pattern (`.sw-credits-error`) that already exists and is already proven in the same file for the Credits tab.

## Architecture Constraints

This story touches exactly one file, `src/web-ui/routes/settings.js`, and reuses two mechanisms that already exist in it rather than inventing new ones:

1. **Query-string parsing convention.** `settings.js`'s `handleGetSettings` currently never reads `req.query` at all — but the rest of this codebase's route handlers already have an established convention for this: `server.js`'s router parses the request URL's query string into `req.query` before any handler runs (`req.query = parseQuery(parsed.searchParams);`, `src/web-ui/server.js:1913`), and handlers read it as `req.query && req.query.X` (e.g. `billing.js:219`'s `req.query.session_id`, `products.js:1334`'s `req.query.path`, `journey.js:3130`'s `req.query.stage`). This story follows that exact, already-established convention (`req.query && req.query.error`) rather than hand-rolling a second `req.url`/`URLSearchParams` parser inside `settings.js` — `beta-006.md`'s own suggested fix (parsing `req.url` directly) was the *symptom-level* description of the gap, not a prescription for the implementation; the established codebase convention is more consistent and simpler.
2. **Error-banner pattern.** `settings.js`'s Credits tab already renders a `.sw-credits-error` banner (`role="alert"`, `_escapeHtml`'d message, driven by an `opts.errorMessage` parameter passed into `renderCreditsTab`) for its own client-side fetch-error handling. This story extends the same `opts.errorMessage`-in, `.sw-credits-error`-out pattern to `renderBillingTab` (currently a two-argument function, `renderBillingTab(planState, csrfToken)`) by adding a third `opts` parameter, mirroring `renderCreditsTab`'s existing signature shape exactly. The CSS class itself (`.sw-credits-error`, defined once in `_TAB_CSS`) is reused verbatim — no new CSS rule is added — but the banner element rendered inside the Billing tab gets its own distinct `id="billing-error"` (vs. Credits' `id="credits-error"`), and lives inside `#tab-panel-billing`, not `#tab-panel-credits`, so the two are structurally independent even though they share styling.

**Security-relevant design decision (stated explicitly, not incidental):** the `error` query-string value is **never** interpolated directly into the rendered HTML. `handleGetSettings` maps the raw `req.query.error` value through a small fixed allowlist dictionary (`no_billing_account` / `billing_unavailable` → two hardcoded message strings); any other value — including an attacker-supplied string — produces `null` (no banner at all), never a reflected value. This closes off what would otherwise be a classic reflected-parameter-into-HTML surface on a user-controlled query string, without needing a separate sanitization step — the allowlist mapping is the sanitization.

No Active ADR in `.github/architecture-guardrails.md` is affected — this is a small, additive extension of an existing, already-accepted in-file pattern (`opts.errorMessage` → banner), not a new pattern or a change to a governed one. No new route is added (`GET /settings` is already registered in `server.js`); no new adapter is introduced (no `setX()` injectable, per D37 — this is plain server-rendered HTML with no I/O boundary).

## Dependencies

- **Upstream:** `bpe-s1` (merged, PR #744) — the two redirect targets (`?error=no_billing_account`, `?error=billing_unavailable`) this story reads are produced by `bpe-s1`'s `handleGetBillingPortal` in `src/web-ui/routes/billing.js` (lines 464 and 479). Confirmed via direct read of that file before writing this story — both literal strings match exactly.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a signed-in user's browser loads `/settings?error=no_billing_account` (the redirect target of `bpe-s1`'s guard for a missing/falsy `stripeCustomerId`, `billing.js:464`), When `handleGetSettings` renders the Settings page, Then the response body contains a visible banner element inside `#tab-panel-billing` (`id="billing-error"`, `role="alert"`, class `sw-credits-error`) with the exact text "You don't have a billing account set up yet."

**AC2:** Given a signed-in user's browser loads `/settings?error=billing_unavailable` (the redirect target of `bpe-s1`'s catch block on a genuine Stripe API failure, `billing.js:479`), When `handleGetSettings` renders the Settings page, Then the response body contains a visible banner element inside `#tab-panel-billing` (`id="billing-error"`, `role="alert"`, class `sw-credits-error`) with the exact text "Billing is temporarily unavailable — please try again shortly."

**AC3:** Given `/settings` is loaded with no `error` query parameter, or with an `error` value that is neither `no_billing_account` nor `billing_unavailable` (including an arbitrary/malicious string), When `handleGetSettings` renders the page, Then no `id="billing-error"` element is present anywhere in the response body, the raw query-string value itself never appears verbatim in the response body, and the rest of the Billing tab's existing content (status pill, plan label, "Manage billing" link, conditional "Upgrade to Pro" form) renders exactly as it did before this story.

**AC4:** Given an admin user's page includes both the Billing tab and the Credits tab (`isAdmin` true) and the page is loaded with a valid billing `error` query value, When the page renders, Then the new `#billing-error` banner appears only inside `#tab-panel-billing` (never inside `#tab-panel-credits`), and the Credits tab's own `#credits-error` element, its `hidden` default state, and its client-side `creditsJs` fetch-error-handling script are byte-for-byte unchanged from their pre-story form — the two banners are visually similar (same CSS class) but structurally and behaviourally independent.

## Out of Scope

- Building a full in-app plan-management UI — that is the larger, separate `beta-005.md` signal #2 ask, recommended for its own `/discovery` pass; this story only makes the *existing* redirect-carried error states visible, it does not add new billing capability.
- Any change to `billing.js`'s `handleGetBillingPortal` redirect logic — `bpe-s1` already delivered and verified this; it is reused completely unmodified.
- Any change to the Credits tab's own existing error-banner wiring, markup, `id`, or `creditsJs` script — reused as a *styling* reference only (AC4).
- Any new CSS class or rule — `.sw-credits-error` is reused verbatim; no new selector is added to `_TAB_CSS`.
- A generic/fallback banner for an unrecognized `error` value — explicit decision to fail silently (no banner) rather than show a vague message for a code this story doesn't recognize; see `decisions.md`.
- Any change to any route file other than `src/web-ui/routes/settings.js`.

## NFRs

- **Performance:** No measurable change — one additional object-literal lookup (`req.query.error` → a 2-entry dictionary) per page load; no new network calls, no new JS execution, no new render passes.
- **Security:** Real, explicit concern, directly addressed. The `error` query parameter is user-controlled (visible and editable in the URL bar). This story maps it through a fixed allowlist dictionary to one of two hardcoded, pre-escaped message strings — the raw query value is never interpolated into the response HTML (see Architecture Constraints). AC3 explicitly asserts the raw value never appears verbatim in the response body, closing off reflected-content risk on this parameter.
- **Accessibility:** `role="alert"` on the banner (matching the Credits tab's existing pattern) ensures the message is announced to assistive technology on page load, not just visually present — consistent with this repo's standing "never colour/visual-only signal" convention (see `_billingStatusPill`'s own pill+text-label pattern in the same file).
- **Audit:** None identified — no change to logging/audit behaviour. (Note: `billing.js`'s own `handleGetBillingPortal` already logs `billing_portal_no_customer_id`/`billing_portal_error` server-side at the point of redirect — this story only affects what renders on the receiving page, not what gets logged.)

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

**Justification:** A small, mechanical extension of an existing, already-proven in-file pattern (`opts.errorMessage` → `.sw-credits-error` banner) to a second tab, plus a query-string read using this codebase's already-established `req.query` convention. No new component, no new route, no new adapter, no design ambiguity in the fix itself — the one substantive judgment call (what to do with an unrecognized `error` value) is resolved and documented with reasoning in `decisions.md`, not left open.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

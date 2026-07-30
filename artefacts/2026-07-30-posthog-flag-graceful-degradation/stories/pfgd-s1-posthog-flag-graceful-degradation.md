## Story: Degrade gracefully when the PostHog flags adapter is unwired, instead of 500ing every gated page

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **a missing/misconfigured PostHog production key to degrade individual feature-flag checks gracefully, not crash every page that happens to check one**,
So that **a single missing secret (or any future PostHog outage) can't take down Settings, Org board, Product Kanban, or Impersonation for every user, even while the underlying misconfiguration is being fixed**.

## Background / Investigation

Immediately after `promote-to-prod` first ran successfully (this session), the operator found the live production app returning "Internal Server Error" on both `/settings` and `/org/kanban`. Production logs showed: `Error: Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.`, thrown from `posthog-flags.js`'s `_requireAdapter()`, at `handleGetSettings` (`routes/settings.js:510`) and `handleGetOrgKanban` (`routes/products.js:1537`).

Root cause: `POSTHOG_KEY_PROD` was never set as a Fly secret on the `skills-framework` production app. `posthog-config.js`'s `initPostHogFlagsClient()` is correctly, deliberately designed to refuse wiring the adapter when this key is missing (logging a clear error, never crashing the process itself, never falling back to the wrong environment's key) — this part is working exactly as designed. But `posthog-flags.js`'s `isEnabled()` is *also* correctly, deliberately designed to throw when the adapter was never wired at all (D37, AC2: "a misconfiguration must be visible immediately") — and every route handler calling `isEnabled()` directly let that throw propagate all the way to `authGuard`'s generic handler, which returns a bare 500 with no page at all. Both individual pieces are correct per their own documented intent; the gap is that no call site was resilient to the *combination* of both correct behaviours.

Separately investigated and ruled out as a bug: the operator also observed the sidebar showing only "Org board" (no live product list) on non-dashboard pages, and 4 products on `/dashboard`. This is `pan-s1`'s own documented, intentional design — the live per-product sidebar list is wired on exactly 3 pages (`/dashboard`, product view, journey), and deliberately omitted everywhere else. Not in scope for this fix.

## Architecture Constraints

- **Does not weaken `isEnabled()`'s D37 contract.** `isEnabled()` itself is untouched and must keep throwing the exact documented error when the adapter is unwired (confirmed unchanged by `tests/check-bri-s1.1-isenabled-helper.js`'s existing A3 test) — that behaviour is correct and intentional, and other future callers may still want it (e.g. a startup health-check that wants to fail loudly).
- Adds a new, separately-exported wrapper, `isEnabledOrDefault(flagKey, context)`, in the same module (`posthog-flags.js`) — not a second, parallel adapter mechanism, just a thin try/catch around the existing `isEnabled()`.
- The misconfiguration remains loudly visible: `isEnabledOrDefault` logs via `console.error` before returning the safe default, so the underlying missing-secret issue is still immediately discoverable in logs — it is not silently swallowed, only prevented from crashing the whole request.
- All 5 existing `isEnabled()` call sites that gate an entire request/page (`products.js` ×2, `impersonation.js` ×2, `settings.js` ×1) are switched to `isEnabledOrDefault` — this was a full, deliberate audit of every call site in the codebase (via `grep`), not a partial fix.

## Dependencies

- **Upstream:** None — this fix applies regardless of whether `POSTHOG_KEY_PROD` is set; it is defense-in-depth for this and any future PostHog misconfiguration/outage, not a replacement for setting the secret.
- **Downstream:** None. The operator is setting `POSTHOG_KEY_PROD` as a Fly secret on `skills-framework` in parallel with this fix — that remains the substantive fix for the current outage; this story is the resilience layer around it.

## Acceptance Criteria

**AC1:** Given `isEnabledOrDefault(flagKey, context)` is called and no adapter has been wired at all, When invoked, Then it resolves to `false` (never throws/rejects), while still logging the misconfiguration via `console.error`.

**AC2:** Given `isEnabled()` itself, When called directly (not through the wrapper) with no adapter wired, Then it still throws the exact, unchanged D37 error message — the wrapper introduces no change to `isEnabled()`'s own contract.

**AC3:** Given a wired, healthy adapter, When `isEnabledOrDefault` is called, Then it returns the adapter's real result (`true` or `false`) unchanged — no behavioural difference from `isEnabled()` in the healthy path.

**AC4:** Given a wired adapter whose `evaluateFlag` call itself throws (e.g. a transient PostHog API failure), When `isEnabledOrDefault` is called, Then it still resolves to `false` — matching `isEnabled()`'s own existing AC4 safe-default behaviour, not a new failure mode.

**AC5:** Given all 5 existing call sites (`handleGetProductKanban`, `handleGetOrgKanban`, `handleGetImpersonatePage`, `handlePostImpersonateStart`, `handleGetSettings`), When any of them is reached with the adapter unwired, Then each degrades to its own existing "flag disabled" behaviour (`_respondFlagDisabled`/`_respondImpersonationFlagDisabled`/`impersonationStartEnabled = false`) instead of a 500 — no new degraded-state branch was invented; each call site reuses its own pre-existing disabled-flag path.

**AC6 (regression guard):** Given these changes, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count with zero new regressions, and every existing test touching these 5 call sites (`check-psh-s6-product-kanban.js`, `check-psh-s7-org-kanban.js`, `check-d1-start-impersonation-session.js`, `check-d2-banner-exit-permission-visibility.js`, `check-d4-nfr-security-review-and-hardening.js`) continues to pass unchanged.

## Out of Scope

- Setting the actual `POSTHOG_KEY_PROD` Fly secret — an operator action, done in parallel with this fix, outside the scope of a code change.
- The sidebar's "only Org board shown, no live product list" observation — confirmed to be `pan-s1`'s own intentional, documented design (3 wired pages only), not a defect.
- Any change to `posthog-config.js`'s own graceful-refusal-to-wire behaviour — already correct per its own AC4.
- Auditing every OTHER D37-injectable adapter in this codebase for the same "stub throws, but no caller-level resilience" gap — a valid follow-up (flagged as an `/improve` candidate), but scoped here strictly to `posthog-flags.js`, the confirmed instance that just caused a real production outage.

## NFRs

- **Performance:** Negligible — one additional try/catch per flag check, only exercised on the already-rare unwired/failing path.
- **Security:** No change — no new data exposed; the safe-default `false` matches the existing "flag disabled" treatment already used for a healthy-but-disabled flag.
- **Accessibility:** Not applicable.
- **Audit:** The `console.error` log line is the audit mechanism — the misconfiguration remains visible in production logs, satisfying the same "must be visible immediately" intent as the original D37 design, just without crashing the request.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

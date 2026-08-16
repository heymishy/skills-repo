# Beta Feedback: 2026-08-16 (first real, non-internal usage signal)

**Source:** Real beta user, mobile Safari, screenshots against wuce (the product this pipeline builds — not the skills platform itself).
**Status:** Validated against wuce-staging.fly.dev on 2026-08-16 (Chrome, authenticated as heymishy via GitHub OAuth).
**Weight:** Treated as usage signal, not hypothetical UX opinion — first real external user, not internal dogfooding.

---

## Triage table

| # | Signal (as reported) | Severity | Validation status | Root cause (confirmed) |
|---|---|---|---|---|
| 3 | Arrow icon (circled) opens the framework page unexpectedly | High | ✅ Fully confirmed, reproduced live | `html-shell.js`'s sidebar renders an unlabelled `↗` link (`.sw-signout`, `href="/auth/logout"`) next to the username. Its only affordance signal is a hover-only `title="Sign out"` tooltip — invisible on mobile touch. Clicking it fully logs the user out and lands them on `/`, the public marketing page, whose hero button is literally "OPEN FRAMEWORK" — exactly matching what the user described landing on. |
| 4 | Profile icon (top-right, person glyph) is a dead end | High | ✅ Confirmed, precise mechanism identified | No profile icon or dropdown exists anywhere in the nav. The top-right element is `themeToggle` — a plain circular "◑" button with no label, positioned exactly where a profile avatar commonly lives in most apps. Zoomed screenshot confirms it visually reads as a generic profile-picture placeholder. It DOES do something (toggles dark/light theme) — it's not literally inert — but the shape completely fails to communicate that function, and the resulting theme change may not register as "it did something" to a first-time user. |
| 5 | Settings section needs improvement | Medium | ⚠️ Partially confirmed, needs beta-user follow-up | Confirmed via live walkthrough: Settings has 4 tabs (Profile, Billing, Credits, Impersonate). Profile tab is minimal — identity + sign-in-method linking only, nothing else (no display name edit, no notification prefs, no API keys, no account deletion). Genuinely thin, but the original signal is too vague to scope a fix from directly — needs a follow-up question to the beta user: what were they trying to do there? |
| 1, 6 | Billing receipt flow / "need receipts" (said twice, different words) | High → **upgraded to Critical** | ✅ Fully confirmed, reproduced live — worse than reported | "Manage billing" (Settings → Billing) returns a raw **`500 Internal Server Error`**, not a missing-receipts UX gap. Root cause identified in `src/web-ui/routes/billing.js:443` (`handleGetBillingPortal`): calls `stripeClient.createPortalSession(customerId, '/dashboard')` with **zero error handling**. My test account's Settings → Billing tab showed "Active — Paid plan" (app-side state), but the portal-session call still threw — most likely `req.session.stripeCustomerId` is missing/invalid for this account, and the handler has no guard for that case at all. Since Stripe's Billing Portal is genuinely where invoice/receipt history is hosted, this single unhandled-throw bug is very plausibly the entire root cause of both #1 and #6 — a real user hitting "get my receipt" would land on exactly this 500 page. This is not a scope gap (a feature that doesn't exist yet) — it's a defect in an already-built, already-shipped code path (`lab-s3.5`) that has no error handling for a real failure mode. For a product selling into regulated/enterprise buyers, this is a procurement blocker as originally assessed — now confirmed as an active bug, not a backlog item. |
| 2 | Mobile compatibility | Medium-High | ⚠️ Not independently validated — tooling limitation | `html-shell.js` DOES implement a real mobile breakpoint (`@media (max-width: 768px)`): sidebar becomes an off-screen drawer, hamburger button appears, main content padding adjusts. So mobile support is deliberately built, not absent. However, I could not get genuine mobile-viewport rendering through the available browser automation (window resize did not visibly change the captured screenshots) — I validated the CSS source and desktop rendering only. This needs either a real device/Playwright-mobile-emulation pass, or the original beta screenshots, to confirm whether the reported friction is a real bug in the mobile layout or something else entirely (e.g. touch target sizing, a specific page that doesn't use `renderShell`, or a viewport-meta issue). |

---

## Cross-cutting reads

**#3 and #4 are the same underlying problem, not two problems.** Both are icon-affordance mismatches in the exact same nav region (top-of-drawer theme toggle, bottom-of-drawer sign-out link) — an icon that goes somewhere unexpected, and an icon that looks like it should go somewhere but doesn't communicate what it does. A single fix pass (relabel/redesign both icons, add visible labels or confirmation for the sign-out action) closes both.

**#1 and #6 are the same underlying defect, not two problems.** Both point at the same broken `handleGetBillingPortal` code path. One fix (add error handling + a `stripeCustomerId` guard, and/or fix the underlying data gap causing it to be missing) closes both — and is now understood to be a real bug fix, not a feature-scoping exercise.

**Net: 6 reported signals reduce to 3 real fix targets** (nav icon affordance, billing portal error, mobile — pending further investigation), plus one open question back to the beta user (#5).

---

## Proposed routing (pending operator confirmation)

1. **Billing portal 500 error (#1/#6)** — short-track bug fix candidate. Bounded, well-understood: add error handling to `handleGetBillingPortal`, guard against a missing `stripeCustomerId`, decide on user-facing behaviour when no real Stripe customer exists yet (e.g. friendly message directing to upgrade/checkout instead of a raw 500). High severity, high confidence, ready to scope now.
2. **Nav icon affordance (#3/#4)** — short-track bug/UX fix candidate. Bounded: relabel or restyle the sign-out link and theme toggle so their shape matches their function (e.g. visible text label instead of icon-only on the sign-out link; a genuinely person-shaped or otherwise unambiguous icon in place of the theme toggle, or move the theme toggle out of the "profile corner" entirely). Needs a short design pass but the scope is well understood.
3. **Mobile compatibility (#2)** — needs investigation before it can be scoped as short-track or discovery. Recommend a dedicated pass (real device or Playwright mobile viewport) against the actual reported pages before deciding size.
4. **Settings improvement (#5)** — blocked on a follow-up question to the beta user. Not actionable yet.

---

## Notes on process

No existing skill in this repo's catalog handles "take raw unstructured user feedback and turn it into validated, routed pipeline items" — `record-signal` only records metric measurement evidence, `prioritise` only ranks already-identified candidates, and `design` requires an approved discovery already in hand. This triage was done manually. Worth a `/improve`-style proposal for a lightweight feedback-intake skill if this recurs.

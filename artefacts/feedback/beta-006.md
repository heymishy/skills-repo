# Feedback: 2026-08-16 (operator-validated, live staging check on bpe-s1's own fix)

**Source:** Hamish King (operator), live Chrome check on `wuce-staging.fly.dev` following up on `bpe-s1`'s merge.
**Related:** `artefacts/2026-08-16-billing-portal-error-handling/` (`bpe-s1`, merged as PR #744, DoD marked COMPLETE earlier today), `artefacts/feedback/beta-005.md` (signal #2, "manage my plan").
**Status:** Confirmed live and root-caused. This is a real gap in `bpe-s1`'s own delivery, found after its DoD was already written — logged as a new finding rather than editing the completed DoD artefact.

---

## Signal 10: "Manage billing" redirects back to Settings with no visible action

**Reported:** "Redirects back to settings with no action" (operator, live-checking `beta-005`'s plan-management ask against `bpe-s1`'s fix).

**Severity:** Medium — not a crash (the original 500 is genuinely fixed), but the fix's own intended "friendly error" behaviour is invisible to the user, which reads as a silent no-op — arguably as confusing as the original 500, just quieter.

**Validation:** Confirmed live on `wuce-staging.fly.dev`, authenticated. Clicking "Manage billing" (Settings → Billing) correctly avoids the raw 500 — it redirects to `/settings?error=no_billing_account`, exactly as `bpe-s1`'s AC1 specifies. But the rendered Settings page shows nothing different: same "Active — Paid plan" status, same "Manage billing" link, no banner, no message, no visual acknowledgement that anything went wrong. The `?error=no_billing_account` query parameter is silently dropped.

**Root cause:** `src/web-ui/routes/settings.js`'s `handleGetSettings` never parses `req.url`'s query string at all (confirmed via `grep -n "req.url\|URLSearchParams\|query"` — zero matches in the GET handler). `bpe-s1`'s own fix correctly redirects to a URL carrying the error context, but nothing on the receiving end reads it.

**The fix pattern already exists in the same file, just not wired to this path:** `settings.js` already has a working error-banner mechanism (`.sw-credits-error`, `opts.errorMessage` → `errorBanner` div, lines ~176-225) — but it's wired only for the Credits tab's own client-side fetch-error handling (`opts.creditsError`), not for a server-side query-string error on initial page load. Extending `handleGetSettings` to parse `req.url`'s `error` param and pass a corresponding message into the Billing tab's own render (reusing the same banner CSS/markup pattern, mapped per error code: `no_billing_account` → "You don't have a billing account set up yet", `billing_unavailable` → "Billing is temporarily unavailable, please try again shortly") would close this cleanly.

---

## Relationship to `bpe-s1`'s own DoD

`bpe-s1`'s DoD (written earlier today, marked COMPLETE) verified AC1-AC4 exactly as specified — the redirect mechanics are correct and tested. This finding is about a gap in what those ACs implicitly promised ("a friendly error state") versus what they explicitly tested (the redirect target URL, not what renders there). Not a reason to revise `bpe-s1`'s own COMPLETE verdict — the story's own literal ACs are satisfied — but a real, immediate, small follow-up worth its own short-track story rather than silently deferring.

---

## Suggested scope for a follow-up story

- Parse `error` from `req.url`'s query string in `handleGetSettings`.
- Map `no_billing_account` and `billing_unavailable` (the two codes `bpe-s1` introduced) to specific, honest user-facing messages.
- Render the message using the existing `.sw-credits-error` banner pattern, scoped to the Billing tab (not Credits).
- Out of scope: building a full in-app plan-management UI (that's the larger `beta-005` signal #2 ask, still recommended for a `/discovery` pass) — this fix only makes the *existing* error states visible, it doesn't add new billing capability.

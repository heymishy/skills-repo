# Decisions — Beta Entry Experience

**Feature:** 2026-06-29-beta-entry-experience
**Last updated:** 2026-06-29

---

## DEC-001 — Open beta admission (no per-user invite gate)

**Date:** 2026-06-29
**Context:** The discovery considered two admission models: (A) INVITE_LIST fly secret checked at OAuth callback, requiring a code change and console intervention per user; (B) any GitHub-authenticated user is admitted, relying on the 5-journey cap as soft access control.
**Decision:** Option B — open admission. Any GitHub user who reaches the URL can log in. No admission code change.
**Rationale:** Enables organic growth (share URL via DM, social, direct link). Hamish controls reach by controlling how widely the URL is shared. The 5-journey cap provides adequate abuse mitigation at beta scale. Eliminates per-user console intervention. Organic discovery also produces more authentic early signal than a curated invite list.
**Consequence:** No visibility into who has signed up unless PostHog instrumentation is in place. PostHog (bee.3) directly mitigates this.

---

## DEC-002 — PostHog instrumentation in scope for this feature

**Date:** 2026-06-29
**Context:** PostHog analytics was initially classified as a Group 2 item. The operator proposed moving it into Group 1 to support referral tracking, lead visibility, and proper conversion measurement from day one.
**Decision:** PostHog is in scope for this feature, scoped to: CDN snippet on landing page and dashboard, UTM auto-capture, person identification post-auth, and four funnel events (`landing_page_view`, `cta_clicked`, `login_completed`, `journey_created`).
**Rationale:** Instrumenting the landing page at launch (rather than retrofitting) gives a complete picture of the first cohort of beta users, including their referral source. PostHog via CDN introduces no npm dependency and no server-side SDK. It resolves the M3 measurement limitation (fly-log proxy) and enables M4 (referral attribution).
**Consequence:** PostHog CDN URL is an external dependency in HTML. If PostHog CDN is unavailable, the landing page still renders — the `<script>` fails gracefully (no blocking load). PostHog account and project API key must exist before deployment.

---

## DEC-003 — PostHog API key as env var, not fly secret

**Date:** 2026-06-29
**Context:** The PostHog project API key is a public frontend key (designed to be visible in browser source). Options: (A) hardcode in HTML string in source; (B) configurable via `process.env.POSTHOG_KEY` fly env var; (C) fly secret.
**Decision:** Option B — `process.env.POSTHOG_KEY` env var. Not a fly secret.
**Rationale:** Public keys should not consume a secrets slot. Env var allows the key to be changed without a code deploy. Hardcoding in source couples the key to the codebase and requires a PR to rotate. Fly secrets are for sensitive credentials — using them for a public key misrepresents the key's security classification.
**Consequence:** The key is visible in fly env (not secrets). This is correct: it will also be visible in every HTML response body, since it is embedded in the PostHog init snippet. Graceful degradation: if `POSTHOG_KEY` is unset, the PostHog snippet is not injected — no runtime error.

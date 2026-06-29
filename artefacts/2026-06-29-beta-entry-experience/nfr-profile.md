# NFR Profile — Beta Entry Experience

**Feature:** 2026-06-29-beta-entry-experience
**Status:** Active — reviewed 2026-06-29

---

## Performance

- Landing page must respond in under 200ms (no external calls in handler)
- Dashboard empty-state adds zero additional latency beyond existing `listJourneys()` call
- PostHog CDN script loaded with `async` attribute — must not block page render

## Security

- **No credential exposure in HTML responses** — `req.session.accessToken` (GitHub OAuth token) must never appear in any HTML body or client-side script. Only `login` and `tenantId` may be injected server-side.
- **Path traversal guard** — any route handler serving HTML from a file must use a hardcoded `__dirname`-relative path. No path component derived from request input.
- **`req.session.accessToken` canonical** — session token field accessed only as `req.session.accessToken` throughout. Zero uses of `req.session.token`.
- **No credentials in committed files** — `POSTHOG_KEY` is a fly env var, not a fly secret and not in source. No API key values in any tracked file.

## Data handling

- **Data classification:** Public (landing page content); Internal (PostHog event data — GitHub login, tenantId, UTM source)
- **Data residency:** PostHog Cloud EU region recommended. For a non-regulated personal project at beta scale, US region is acceptable. No regulated data categories involved.
- **PII scope:** GitHub login (username, not email) and tenantId sent to PostHog. These are not sensitive under any applicable framework at this stage. If enterprise or regulated customers are onboarded in future, this classification must be revisited.

## Availability

- No new availability SLA introduced. The landing page and empty-state are stateless HTML responses — they inherit the existing Fly.io single-machine uptime.
- Graceful degradation: if `POSTHOG_KEY` is unset, PostHog snippet is omitted. The landing page and dashboard render correctly without PostHog.

## Compliance

- Non-regulated (`meta.regulated: false`). No compliance framework applies.
- No regulatory sign-off required before DoR.

## Accessibility

- Landing page must render correctly with JavaScript disabled (AC3 — static HTML, no JS-dependent content)
- Empty-state must render without client-side JavaScript (AC4 in bee.2 — server-side rendered)
- PostHog CDN loaded asynchronously — does not affect page accessibility

---

**Status:** Active — no NFRs with named regulatory clauses. No human sign-off required before DoR.

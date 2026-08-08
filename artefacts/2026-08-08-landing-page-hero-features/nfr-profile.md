# NFR Profile: Landing Page Hero Features

**Feature:** 2026-08-08-landing-page-hero-features
**Created:** 2026-08-08
**Last updated:** 2026-08-08
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Page render | No server-side computation added — all new content is static, authored at build/deploy time | N/A — no load test required for static content | lphf-s1, lphf-s2, lphf-s3, lphf-s4, lphf-s5 |

**Source:** Story ACs (all 5 stories explicitly state "static content, no server-side computation")

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Secrets management | No credentials, tokens, API keys, or PII in any hero-card copy or golden-trace demo content | CLAUDE.md §Security; confirmed via `/clarify` (2026-08-08) content read-through of both demo candidates | lphf-s1, lphf-s2, lphf-s3, lphf-s4 |
| Session data exposure | No `accessToken`/session values rendered in HTML (unchanged guarantee from `lab-s1.2` AC6) | CLAUDE.md — `req.session.accessToken` canonical field rule | lphf-s5 |

**Data classification:**
- [x] Public — no PII, no sensitive data (this is a public, unauthenticated marketing page by design)

**Source:** CLAUDE.md §Security; discovery `/clarify` resolution (2026-08-08)

---

## Data residency

Not applicable — no user data is created, stored, or processed by this feature. All content is static and server-rendered from the same repo, same as the existing landing page.

**Source:** Not applicable

---

## Availability

No new availability targets — this feature modifies an existing, already-live route (`GET /`) with no new infrastructure, no new failure mode beyond what already exists.

**Source:** Not defined — inherits existing landing-page availability characteristics

---

## Compliance

Not applicable. No regulatory framework or compliance clause applies to this feature (confirmed at discovery — Constraints section names none, and `product/constraints.md`'s 4 hard constraints all concern the skills-platform's own governance mechanics, not this commercial landing page).

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Accessibility (CSS-layout-dependent ACs) | `lphf-s2` AC3, `lphf-s3` AC3, `lphf-s4` AC4, `lphf-s5` AC3 each have a responsive-layout AC that cannot be verified by unit tests — classification (automated visual regression vs. RISK-ACCEPT + manual smoke test) is deferred to `/definition-of-ready`, per CLAUDE.md's mandatory B2 rule | Whoever runs `/definition-of-ready` for each story | Before each story's DoR sign-off |
